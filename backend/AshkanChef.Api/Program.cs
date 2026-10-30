using System.Data;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
builder.Logging.AddJsonConsole();
builder.Services.AddDbContext<ChefDb>(o => o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
var jwt = builder.Configuration.GetSection("Jwt");
var secret = Environment.GetEnvironmentVariable("ASHKANCHEF_JWT_KEY") ?? jwt["Key"]!;
if (secret.Length < 32 || secret.StartsWith("REPLACE_")) throw new InvalidOperationException("Set ASHKANCHEF_JWT_KEY to a strong random secret (32+ characters).");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => { o.TokenValidationParameters = new TokenValidationParameters {
 ValidateIssuer=true,ValidIssuer=jwt["Issuer"],ValidateAudience=true,ValidAudience=jwt["Audience"],ValidateLifetime=true,ValidateIssuerSigningKey=true,IssuerSigningKey=new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),ClockSkew=TimeSpan.FromMinutes(1)
};
 o.Events = new JwtBearerEvents { OnTokenValidated = async context => {
  var idText=context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
  var versionText=context.Principal?.FindFirstValue("session_version");
  if(!int.TryParse(idText,out var id)||!int.TryParse(versionText,out var version)){context.Fail("Invalid session");return;}
  var db=context.HttpContext.RequestServices.GetRequiredService<ChefDb>();
  var current=await db.Users.AsNoTracking().Where(x=>x.Id==id).Select(x=>(int?)x.SessionVersion).SingleOrDefaultAsync();
  if(current is null || current.Value!=version)context.Fail("Session revoked");
 }};
});
builder.Services.AddAuthorization();
// Fixed-window limits per client IP on authentication endpoints. A reverse proxy must
// be configured to forward only trusted client addresses in production.
builder.Services.AddRateLimiter(options => {
 options.AddPolicy("uploads", context => RateLimitPartition.GetFixedWindowLimiter(
  context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
  _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true }));
 options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
 options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
  context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
  _ => new FixedWindowRateLimiterOptions {
   PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0,
   AutoReplenishment = true
  }));
});
builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = 5 * 1024 * 1024);
builder.Services.AddCors(o => o.AddPolicy("dev",p => p.WithOrigins("http://localhost:19006","http://localhost:8081").AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
// RFC 7807 errors without exposing stack traces or secrets.
app.UseExceptionHandler(errorApp => errorApp.Run(async context => {
 var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
 var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("UnhandledApiException");
 logger.LogError(exception, "Unhandled request failure {Method} {Path} TraceId={TraceId}",
  context.Request.Method, context.Request.Path, context.TraceIdentifier);
 context.Response.StatusCode = StatusCodes.Status500InternalServerError;
 await Results.Problem(title:"An unexpected server error occurred", statusCode:500,
  extensions:new Dictionary<string,object?> { ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
}));
app.UseStatusCodePages(async context => {
 var response=context.HttpContext.Response;
 if(response.StatusCode is 404 or 405 && !response.HasStarted){
  await Results.Problem(title:response.StatusCode==404?"Resource not found":"Method not allowed",
   statusCode:response.StatusCode).ExecuteAsync(context.HttpContext);
 }
});
// Defense-in-depth response headers. These do not replace TLS or proxy hardening.
app.Use(async (context, next) => {
 context.Response.Headers["X-Content-Type-Options"] = "nosniff";
 context.Response.Headers["Referrer-Policy"] = "no-referrer";
 await next();
});
app.UseStaticFiles(); app.UseCors("dev"); app.UseRateLimiter(); app.UseAuthentication(); app.UseAuthorization();
app.MapGet("/health", () => Results.Ok(new {status="ok"}));
// Database readiness is intentionally separate from liveness.
app.MapGet("/health/ready", async (ChefDb db, ILoggerFactory loggerFactory, CancellationToken ct) => {
 try {
  return await db.Database.CanConnectAsync(ct)
   ? Results.Ok(new {status="ready",database="connected"})
   : Results.Json(new {status="unavailable",database="disconnected"},statusCode:503);
 } catch (Exception ex) when (ex is not OperationCanceledException) {
  loggerFactory.CreateLogger("DatabaseReadiness").LogWarning(ex,"Database readiness check failed");
  return Results.Json(new {status="unavailable",database="disconnected"},statusCode:503);
 }
});

// Decode and re-encode untrusted uploads before making them public. Never serve raw user bytes.
app.MapPost("/api/media/images", async (HttpRequest req, IWebHostEnvironment env, CancellationToken ct) => {
 const long maxUpload = 5 * 1024 * 1024;
 const long maxPixels = 25_000_000;
 if(!req.HasFormContentType) return Results.BadRequest(new {error="Multipart form required."});
 var form=await req.ReadFormAsync(ct);
 var file=form.Files.GetFile("file");
 if(file is null || file.Length==0 || file.Length>maxUpload)
  return Results.BadRequest(new {error="Image must be 1 byte to 5 MB."});
 // Read a bounded amount; ignore the client-provided name, extension and MIME type.
 await using var input=file.OpenReadStream();
 using var buffer=new MemoryStream();
 await input.CopyToAsync(buffer,ct);
 if(buffer.Length==0 || buffer.Length>maxUpload)
  return Results.BadRequest(new {error="Image size exceeds limit."});
 buffer.Position=0;
 Image? decoded=null;
 try {
  decoded=await Image.LoadAsync(buffer,ct);
  if(decoded.Width<1 || decoded.Height<1 || decoded.Width>8192 || decoded.Height>8192 ||
     (long)decoded.Width*decoded.Height>maxPixels)
   return Results.BadRequest(new {error="Image dimensions exceed limits."});
  // Strip potentially sensitive metadata and always generate a clean file.
  decoded.Metadata.ExifProfile=null;
  decoded.Metadata.IccProfile=null;
  decoded.Metadata.XmpProfile=null;
  var directory=Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath,"wwwroot"),"uploads");
  Directory.CreateDirectory(directory);
  // All accepted formats are normalized to JPEG; client bytes are never copied verbatim.
  var name=$"{Guid.NewGuid():N}.jpg";
  var destination=Path.Combine(directory,name);
  try {
   await using(var output=new FileStream(destination,FileMode.CreateNew,FileAccess.Write,FileShare.None))
    await decoded.SaveAsJpegAsync(output,new JpegEncoder {Quality=85},ct);
  } catch {
   if(File.Exists(destination)) File.Delete(destination);
   throw;
  }
  var url=$"{req.Scheme}://{req.Host}/uploads/{name}";
  return Results.Ok(new {url});
 } catch (UnknownImageFormatException) {
  return Results.BadRequest(new {error="Unsupported or invalid image."});
 } catch (InvalidImageContentException) {
  return Results.BadRequest(new {error="Corrupt image."});
 } finally {decoded?.Dispose();}
}).RequireAuthorization().RequireRateLimiting("uploads").DisableAntiforgery();

app.MapPost("/api/auth/register", async (AuthInput input, ChefDb db) => {
 if(string.IsNullOrWhiteSpace(input.Email) || input.Password is null || string.IsNullOrWhiteSpace(input.Name))
  return Results.BadRequest(new {error="Invalid registration details"});
 var email=input.Email.Trim().ToLowerInvariant();
 if(email.Length>254 || !System.Net.Mail.MailAddress.TryCreate(email,out var addr) || addr.Address!=email || input.Password.Length<8 || input.Password.Length>128 || string.IsNullOrWhiteSpace(input.Name)) return Results.BadRequest(new {error="Invalid name, email or password (minimum 8 characters)."});
 if(await db.Users.AnyAsync(x=>x.Email==email)) return Results.Conflict(new {error="Email already registered."});
 var user=new ChefUser {Email=email,Name=input.Name.Trim()[..Math.Min(input.Name.Trim().Length,80)],PasswordHash=BCrypt.Net.BCrypt.HashPassword(input.Password)};
 db.Users.Add(user);await db.SaveChangesAsync();return Results.Ok(new {token=IssueToken(user,secret,jwt),name=user.Name});
}).RequireRateLimiting("auth");
app.MapPost("/api/auth/login",async (LoginInput input,ChefDb db)=>{
 if(string.IsNullOrWhiteSpace(input.Email) || string.IsNullOrEmpty(input.Password))
  return Results.Json(new {error="Invalid credentials"},statusCode:401);
 var user=await db.Users.SingleOrDefaultAsync(x=>x.Email==input.Email.Trim().ToLowerInvariant());
 if(user==null || !BCrypt.Net.BCrypt.Verify(input.Password,user.PasswordHash)) return Results.Json(new {error="Invalid credentials"},statusCode:401);
 return Results.Ok(new {token=IssueToken(user,secret,jwt),name=user.Name});
}).RequireRateLimiting("auth");
app.MapGet("/api/recipes",async (ChefDb db,int? page,string? search)=>{
 var current=Math.Clamp(page??1,1,10000);
 var query=db.Recipes.AsNoTracking().AsQueryable();
 if(!string.IsNullOrWhiteSpace(search)){
  var term=search.Trim(); if(term.Length>100)return Results.BadRequest(new {error="Search too long"});
  query=query.Where(r=>r.Title.Contains(term));
 }
 var total=await query.CountAsync();
 var rows=await query.OrderByDescending(r=>r.CreatedAt).ThenByDescending(r=>r.Id).Skip((current-1)*20).Take(20)
 .Select(r=>new {r.Id,r.Title,r.Ingredients,r.Steps,r.ImageUrl,r.OwnerId}).ToListAsync();
 return Results.Ok(new {items=rows,total,page=current,pageSize=20});
});
app.MapGet("/api/recipes/{id:int}",async (int id,ChefDb db)=>{
 var r=await db.Recipes.AsNoTracking().Where(x=>x.Id==id)
 .Select(x=>new {x.Id,x.Title,x.Ingredients,x.Steps,x.ImageUrl,x.OwnerId}).FirstOrDefaultAsync();
 return r is null?Results.NotFound():Results.Ok(r);
});
app.MapPost("/api/recipes",async (RecipeInput input,ClaimsPrincipal principal,ChefDb db)=>{
 if(!ValidRecipe(input)) return Results.BadRequest(new {error="Invalid recipe"});
 var recipe=new ChefRecipe {Title=input.Title.Trim(),Ingredients=System.Text.Json.JsonSerializer.Serialize(input.Ingredients),Steps=System.Text.Json.JsonSerializer.Serialize(input.Steps),ImageUrl=input.ImageUrl,OwnerId=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!)};
 db.Recipes.Add(recipe);await db.SaveChangesAsync();return Results.Created($"/api/recipes/{recipe.Id}",new {recipe.Id});
}).RequireAuthorization();
app.MapDelete("/api/recipes/{id:int}",async (int id,ClaimsPrincipal principal,ChefDb db)=>{
 var userId=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);var recipe=await db.Recipes.FindAsync(id);
 if(recipe==null)return Results.NotFound();if(recipe.OwnerId!=userId)return Results.Forbid();db.Recipes.Remove(recipe);await db.SaveChangesAsync();return Results.NoContent();
}).RequireAuthorization();
// Idempotent mobile synchronization endpoints. Client IDs are scoped to the authenticated owner.
app.MapPost("/api/sync/recipes/upsert", async (RecipeSyncInput input, HttpRequest request, ClaimsPrincipal principal, ChefDb db, CancellationToken ct) => {
 var ownerId=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var key=request.Headers["Idempotency-Key"].ToString().Trim();
 if(key.Length<8 || key.Length>200) return Results.BadRequest(new {error="A valid Idempotency-Key header is required."});
 if(string.IsNullOrWhiteSpace(input.ClientId) || input.ClientId.Length>100 || !ValidRecipe(new RecipeInput(input.Title,input.Ingredients,input.Steps,input.ImageUrl)))
  return Results.BadRequest(new {error="Invalid synchronized recipe."});
 await using var transaction=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
 var receipt=await db.RecipeSyncReceipts.AsNoTracking().SingleOrDefaultAsync(x=>x.OwnerId==ownerId && x.IdempotencyKey==key,ct);
 if(receipt is not null) return Results.Content(receipt.ResponseJson,"application/json",System.Text.Encoding.UTF8,statusCode:200);
 var recipe=await db.Recipes.SingleOrDefaultAsync(x=>x.OwnerId==ownerId && x.ClientId==input.ClientId,ct);
 var currentVersion=recipe?.SyncVersion??0;
 if(input.ExpectedVersion is not null && input.ExpectedVersion.Value!=currentVersion)
  return Results.Conflict(new {error="Recipe version conflict.",clientId=input.ClientId,serverVersion=currentVersion,serverRecipe=recipe is null?null:new {recipe.Title,recipe.Ingredients,recipe.Steps,recipe.ImageUrl}});
 if(recipe is null){ recipe=new ChefRecipe{OwnerId=ownerId,ClientId=input.ClientId,CreatedAt=DateTime.UtcNow};db.Recipes.Add(recipe); }
 recipe.Title=input.Title.Trim(); recipe.Ingredients=System.Text.Json.JsonSerializer.Serialize(input.Ingredients); recipe.Steps=System.Text.Json.JsonSerializer.Serialize(input.Steps); recipe.ImageUrl=input.ImageUrl; recipe.UpdatedAt=DateTime.UtcNow; recipe.SyncVersion=currentVersion+1;
 await db.SaveChangesAsync(ct);
 var responseJson=System.Text.Json.JsonSerializer.Serialize(new {status="applied",clientId=input.ClientId,serverId=recipe.Id,version=recipe.SyncVersion});
 db.RecipeSyncReceipts.Add(new ChefRecipeSyncReceipt{OwnerId=ownerId,IdempotencyKey=key,ResponseJson=responseJson,CreatedAt=DateTime.UtcNow});
 await db.SaveChangesAsync(ct);
 await transaction.CommitAsync(ct);
 return Results.Content(responseJson,"application/json",System.Text.Encoding.UTF8,statusCode:200);
}).RequireAuthorization();
app.MapPost("/api/sync/recipes/delete", async (RecipeSyncDeleteInput input, HttpRequest request, ClaimsPrincipal principal, ChefDb db, CancellationToken ct) => {
 var ownerId=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var key=request.Headers["Idempotency-Key"].ToString().Trim();
 if(key.Length<8 || key.Length>200 || string.IsNullOrWhiteSpace(input.ClientId) || input.ClientId.Length>100)
  return Results.BadRequest(new {error="A valid idempotency key and client recipe ID are required."});
 await using var transaction=await db.Database.BeginTransactionAsync(IsolationLevel.Serializable,ct);
 var receipt=await db.RecipeSyncReceipts.AsNoTracking().SingleOrDefaultAsync(x=>x.OwnerId==ownerId && x.IdempotencyKey==key,ct);
 if(receipt is not null) return Results.Content(receipt.ResponseJson,"application/json",System.Text.Encoding.UTF8,statusCode:200);
 var recipe=await db.Recipes.SingleOrDefaultAsync(x=>x.OwnerId==ownerId && x.ClientId==input.ClientId,ct);
 if(recipe is not null){
  var version=recipe.SyncVersion;
  if(input.ExpectedVersion is not null && input.ExpectedVersion.Value!=version)
   return Results.Conflict(new {error="Recipe version conflict.",clientId=input.ClientId,serverVersion=version});
  db.Recipes.Remove(recipe);
 }
 const string responseJson="{\"status\":\"deleted\"}";
 db.RecipeSyncReceipts.Add(new ChefRecipeSyncReceipt{OwnerId=ownerId,IdempotencyKey=key,ResponseJson=responseJson,CreatedAt=DateTime.UtcNow});
 await db.SaveChangesAsync(ct);
 await transaction.CommitAsync(ct);
 return Results.Content(responseJson,"application/json",System.Text.Encoding.UTF8,statusCode:200);
}).RequireAuthorization();

app.MapGet("/api/me",async (ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var user=await db.Users.AsNoTracking().Where(u=>u.Id==uid).Select(u=>new {u.Id,u.Name,u.Email,u.AvatarUrl}).FirstOrDefaultAsync();
 return user is null?Results.NotFound():Results.Ok(user);
}).RequireAuthorization();
// Authenticated account editing. Never accept user ID from the request body.
app.MapPut("/api/me",async (ProfileUpdate input,ClaimsPrincipal principal,ChefDb db)=>{
 var name=(input.Name??"").Trim();
 if(name.Length<2 || name.Length>80)return Results.BadRequest(new {error="Name must contain 2–80 characters"});
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var user=await db.Users.FindAsync(uid);
 if(user is null)return Results.NotFound();
 user.Name=name;
 await db.SaveChangesAsync();
 return Results.Ok(new {user.Id,user.Name,user.Email,user.AvatarUrl});
}).RequireAuthorization();
// Only the authenticated user can change their avatar. Image must be a previously uploaded local URL.
app.MapPut("/api/me/avatar",async (AvatarUpdate input,ClaimsPrincipal principal,ChefDb db,HttpRequest request,IWebHostEnvironment env)=>{
 var url=input.AvatarUrl?.Trim();
 if(url is not null){
  if(!Uri.TryCreate(url,UriKind.Absolute,out var uri) || (uri.Scheme!="http" && uri.Scheme!="https") ||
    !string.Equals(uri.Host,request.Host.Host,StringComparison.OrdinalIgnoreCase) ||
    uri.Port!=(request.Host.Port ?? (request.IsHttps?443:80)) ||
    !uri.AbsolutePath.StartsWith("/uploads/",StringComparison.Ordinal) ||
    uri.AbsolutePath[9..].Contains('/') || uri.Query.Length>0 || uri.Fragment.Length>0)
   return Results.BadRequest(new {error="Avatar must be an image uploaded to this server."});
  var fileName=Path.GetFileName(uri.AbsolutePath);
  if(!System.Text.RegularExpressions.Regex.IsMatch(fileName,@"^[a-f0-9]{32}\.(jpg|png|webp)$") ||
     !File.Exists(Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath,"wwwroot"),"uploads",fileName)))
   return Results.BadRequest(new {error="Uploaded image not found."});
 }
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var user=await db.Users.FindAsync(uid);
 if(user is null)return Results.NotFound();
 user.AvatarUrl=url;await db.SaveChangesAsync();
 return Results.Ok(new {user.Id,user.Name,user.Email,user.AvatarUrl});
}).RequireAuthorization();
// Password change requires the existing secret; no user ID is accepted from clients.
app.MapPut("/api/me/password",async (PasswordChange input,ClaimsPrincipal principal,ChefDb db)=>{
 if(string.IsNullOrEmpty(input.CurrentPassword)||string.IsNullOrEmpty(input.NewPassword)||input.NewPassword.Length<10||input.NewPassword.Length>128)
  return Results.BadRequest(new {error="New password must be 10–128 characters"});
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var user=await db.Users.FindAsync(uid);
 if(user is null)return Results.NotFound();
 if(!BCrypt.Net.BCrypt.Verify(input.CurrentPassword,user.PasswordHash))return Results.Json(new {error="Current password is incorrect"},statusCode:400);
 if(BCrypt.Net.BCrypt.Verify(input.NewPassword,user.PasswordHash))return Results.BadRequest(new {error="Choose a different password"});
 user.PasswordHash=BCrypt.Net.BCrypt.HashPassword(input.NewPassword);
 user.SessionVersion++;
 await db.SaveChangesAsync();return Results.NoContent();
}).RequireAuthorization();
// Revokes all existing JWTs including the token used for this request.
app.MapPost("/api/me/sessions/revoke",async (ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var user=await db.Users.FindAsync(uid);
 if(user is null)return Results.NotFound();
 user.SessionVersion++;
 await db.SaveChangesAsync();
 return Results.NoContent();
}).RequireAuthorization();
app.MapGet("/api/me/stats",async (ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 return Results.Ok(new {recipes=await db.Recipes.CountAsync(r=>r.OwnerId==uid),followers=await db.Follows.CountAsync(f=>f.FollowedId==uid),following=await db.Follows.CountAsync(f=>f.FollowerId==uid)});
}).RequireAuthorization();
// Authenticated dashboard: monthly publication trend and average review score.
app.MapGet("/api/me/analytics",async (ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var since=DateTime.UtcNow.AddMonths(-11);
 since=new DateTime(since.Year,since.Month,1,0,0,0,DateTimeKind.Utc);
 var monthly=await db.Recipes.AsNoTracking().Where(r=>r.OwnerId==uid && r.CreatedAt>=since)
  .GroupBy(r=>new {r.CreatedAt.Year,r.CreatedAt.Month})
  .Select(g=>new {g.Key.Year,g.Key.Month,Count=g.Count()}).ToListAsync();
 var recipeIds=db.Recipes.AsNoTracking().Where(r=>r.OwnerId==uid).Select(r=>r.Id);
 var reviews=db.Reviews.AsNoTracking().Where(r=>recipeIds.Contains(r.RecipeId));
 var reviewCount=await reviews.CountAsync();
 var average=await reviews.AverageAsync(r=>(double?)r.Rating);
 var months=Enumerable.Range(0,12).Select(i=>since.AddMonths(i)).Select(d=>new {
  year=d.Year,month=d.Month,count=monthly.FirstOrDefault(x=>x.Year==d.Year&&x.Month==d.Month)?.Count??0
 });
 var topRecipes=await db.Recipes.AsNoTracking().Where(r=>r.OwnerId==uid)
  .Select(r=>new {r.Id,r.Title,r.ImageUrl,ReviewCount=db.Reviews.Count(v=>v.RecipeId==r.Id),AverageRating=db.Reviews.Where(v=>v.RecipeId==r.Id).Average(v=>(double?)v.Rating)})
  .OrderByDescending(r=>r.ReviewCount).ThenByDescending(r=>r.AverageRating).ThenBy(r=>r.Id)
  .Take(5).ToListAsync();
 var followerRows=await db.Follows.AsNoTracking().Where(f=>f.FollowedId==uid && f.CreatedAt>=since)
  .GroupBy(f=>new {f.CreatedAt.Year,f.CreatedAt.Month})
  .Select(g=>new {g.Key.Year,g.Key.Month,Count=g.Count()}).ToListAsync();
 var followerMonths=Enumerable.Range(0,12).Select(i=>since.AddMonths(i)).Select(d=>new {
  year=d.Year,month=d.Month,count=followerRows.FirstOrDefault(x=>x.Year==d.Year&&x.Month==d.Month)?.Count??0
 });
 return Results.Ok(new {months,reviewCount,averageRating=average is null?null:Math.Round(average.Value,2),topRecipes,followerMonths});
}).RequireAuthorization();
// Profile activity: only records owned by the authenticated user. Bounded, read-only.
app.MapGet("/api/me/activity",async (int? page,ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var requested=page??1;
 if(requested<1||requested>10000)return Results.BadRequest(new {error="Invalid page"});
 const int size=8;
 var query=db.Recipes.AsNoTracking().Where(r=>r.OwnerId==uid);
 var total=await query.CountAsync();
 var recipes=await query.OrderByDescending(r=>r.CreatedAt).ThenByDescending(r=>r.Id).Skip((requested-1)*size).Take(size)
  .Select(r=>new {r.Id,r.Title,r.ImageUrl,r.CreatedAt,r.UpdatedAt}).ToListAsync();
 return Results.Ok(new {recentRecipes=recipes,page=requested,pageSize=size,total,hasMore=requested*size<total});
}).RequireAuthorization();
app.MapGet("/api/me/recipes",async (ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 return Results.Ok(await db.Recipes.AsNoTracking().Where(r=>r.OwnerId==uid).OrderByDescending(r=>r.Id).Select(r=>new {r.Id,r.Title,r.Ingredients,r.Steps,r.ImageUrl,r.OwnerId}).Take(100).ToListAsync());
}).RequireAuthorization();
app.MapPut("/api/recipes/{id:int}",async (int id,RecipeInput input,ClaimsPrincipal principal,ChefDb db)=>{
 if(!ValidRecipe(input))return Results.BadRequest(new {error="Invalid recipe"});
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var recipe=await db.Recipes.FindAsync(id);
 if(recipe is null)return Results.NotFound();
 if(recipe.OwnerId!=uid)return Results.Forbid();
 recipe.UpdatedAt=DateTime.UtcNow;recipe.Title=input.Title.Trim();recipe.Ingredients=System.Text.Json.JsonSerializer.Serialize(input.Ingredients);recipe.Steps=System.Text.Json.JsonSerializer.Serialize(input.Steps);recipe.ImageUrl=input.ImageUrl;
 await db.SaveChangesAsync();return Results.Ok(new {recipe.Id});
}).RequireAuthorization();
static bool ValidRecipe(RecipeInput input)=>!string.IsNullOrWhiteSpace(input.Title)&&input.Title.Length<=120&&input.Ingredients is {Count: >0 and <=100}&&input.Steps is {Count: >0 and <=100}&&input.Ingredients.All(x=>!string.IsNullOrWhiteSpace(x)&&x.Length<=300)&&input.Steps.All(x=>!string.IsNullOrWhiteSpace(x)&&x.Length<=2000)&&(input.ImageUrl is null || input.ImageUrl.Length<=2048 && Uri.TryCreate(input.ImageUrl,UriKind.Absolute,out var uri)&&uri.Scheme==Uri.UriSchemeHttps);
// Reviews: one review per user per recipe; authenticated writes, public reads.
app.MapGet("/api/recipes/{id:int}/reviews",async (int id,ChefDb db)=>{
 if(!await db.Recipes.AnyAsync(r=>r.Id==id))return Results.NotFound();
 var reviews=await db.Reviews.AsNoTracking().Where(r=>r.RecipeId==id).OrderByDescending(r=>r.Id).Take(100)
 .Select(r=>new {r.Id,r.RecipeId,r.Rating,r.Comment,r.CreatedAt,Author=r.User.Name}).ToListAsync();
 return Results.Ok(new {items=reviews,count=await db.Reviews.CountAsync(r=>r.RecipeId==id),average=await db.Reviews.Where(r=>r.RecipeId==id).AverageAsync(r=>(double?)r.Rating)??0});
});
app.MapPut("/api/recipes/{id:int}/reviews/me",async (int id,ReviewInput input,ClaimsPrincipal principal,ChefDb db)=>{
 if(input.Rating<1||input.Rating>5||input.Comment?.Length>1000)return Results.BadRequest(new {error="Rating must be 1-5; comment up to 1000 characters."});
 if(!await db.Recipes.AnyAsync(r=>r.Id==id))return Results.NotFound();
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var review=await db.Reviews.SingleOrDefaultAsync(r=>r.RecipeId==id&&r.UserId==uid);
 if(review is null){review=new ChefReview{RecipeId=id,UserId=uid};db.Reviews.Add(review);}
 review.Rating=input.Rating;review.Comment=input.Comment?.Trim()??"";review.CreatedAt=DateTime.UtcNow;
 await db.SaveChangesAsync();return Results.Ok(new {review.Id});
}).RequireAuthorization();
app.MapDelete("/api/recipes/{id:int}/reviews/me",async (int id,ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var review=await db.Reviews.SingleOrDefaultAsync(r=>r.RecipeId==id&&r.UserId==uid);
 if(review is null)return Results.NotFound();db.Reviews.Remove(review);await db.SaveChangesAsync();return Results.NoContent();
}).RequireAuthorization();
// Public chef profiles and authenticated follow/unfollow operations.
app.MapGet("/api/chefs/{id:int}",async (int id,ChefDb db)=>{
 var chef=await db.Users.AsNoTracking().Where(u=>u.Id==id).Select(u=>new {u.Id,u.Name}).FirstOrDefaultAsync();
 if(chef is null)return Results.NotFound();
 var followers=await db.Follows.CountAsync(f=>f.FollowedId==id);
 var recipes=await db.Recipes.AsNoTracking().Where(r=>r.OwnerId==id).OrderByDescending(r=>r.Id).Take(30).Select(r=>new {r.Id,r.Title,r.ImageUrl,r.CreatedAt,r.UpdatedAt}).ToListAsync();
 return Results.Ok(new {chef.Id,chef.Name,followers,recipes});
});
app.MapGet("/api/me/following",async (ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 return Results.Ok(await db.Follows.AsNoTracking().Where(f=>f.FollowerId==uid).OrderByDescending(f=>f.Id).Select(f=>new {id=f.FollowedId,name=f.Followed.Name}).Take(100).ToListAsync());
}).RequireAuthorization();
app.MapPut("/api/chefs/{id:int}/follow",async (int id,ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 if(uid==id)return Results.BadRequest(new {error="You cannot follow yourself."});
 if(!await db.Users.AnyAsync(u=>u.Id==id))return Results.NotFound();
 if(!await db.Follows.AnyAsync(f=>f.FollowerId==uid&&f.FollowedId==id)){
  db.Follows.Add(new ChefFollow{FollowerId=uid,FollowedId=id,CreatedAt=DateTime.UtcNow});await db.SaveChangesAsync();
 }
 return Results.Ok(new {following=true});
}).RequireAuthorization();
app.MapDelete("/api/chefs/{id:int}/follow",async (int id,ClaimsPrincipal principal,ChefDb db)=>{
 var uid=int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
 var follow=await db.Follows.SingleOrDefaultAsync(f=>f.FollowerId==uid&&f.FollowedId==id);
 if(follow is not null){db.Follows.Remove(follow);await db.SaveChangesAsync();}
 return Results.NoContent();
}).RequireAuthorization();
app.Run();
static string IssueToken(ChefUser user,string secret,IConfigurationSection jwt){
 var claims=new[]{new Claim(ClaimTypes.NameIdentifier,user.Id.ToString()),new Claim(ClaimTypes.Name,user.Name),new Claim("session_version",user.SessionVersion.ToString())};
 var key=new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
 return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(issuer:jwt["Issuer"],audience:jwt["Audience"],claims:claims,expires:DateTime.UtcNow.AddHours(12),signingCredentials:new SigningCredentials(key,SecurityAlgorithms.HmacSha256)));
}
record AuthInput(string Name,string Email,string Password);
record LoginInput(string Email,string Password);
record ReviewInput(int Rating,string? Comment);
record RecipeInput(string Title,List<string> Ingredients,List<string> Steps,string? ImageUrl);
record RecipeSyncInput(string ClientId,string Title,List<string> Ingredients,List<string> Steps,string? ImageUrl,int? ExpectedVersion);
record RecipeSyncDeleteInput(string ClientId,int? ExpectedVersion);
class ChefUser {public string? AvatarUrl {get;set;} public int Id {get;set;}public string Name {get;set;}="";public string Email {get;set;}="";public string PasswordHash {get;set;}="";public int SessionVersion {get;set;}=0;}
class ChefRecipe {public int Id {get;set;}public string? ClientId {get;set;}public int SyncVersion {get;set;}=1;public string Title {get;set;}="";public string Ingredients {get;set;}="[]";public string Steps {get;set;}="[]";public string? ImageUrl {get;set;}public int OwnerId {get;set;}public ChefUser Owner {get;set;}=null!;public DateTime CreatedAt {get;set;}=DateTime.UtcNow;public DateTime? UpdatedAt {get;set;}}
class ChefRecipeSyncReceipt {public int Id {get;set;}public int OwnerId {get;set;}public string IdempotencyKey {get;set;}="";public string ResponseJson {get;set;}="{}";public DateTime CreatedAt {get;set;}=DateTime.UtcNow;}
class ChefReview {public int Id {get;set;}public int RecipeId {get;set;}public ChefRecipe Recipe {get;set;}=null!;public int UserId {get;set;}public ChefUser User {get;set;}=null!;public int Rating {get;set;}public string Comment {get;set;}="";public DateTime CreatedAt {get;set;}=DateTime.UtcNow;}
class ChefFollow {public int Id {get;set;}public int FollowerId {get;set;}public ChefUser Follower {get;set;}=null!;public int FollowedId {get;set;}public ChefUser Followed {get;set;}=null!;public DateTime CreatedAt {get;set;}=DateTime.UtcNow;}
class ChefDb(DbContextOptions<ChefDb> options):DbContext(options){public DbSet<ChefUser> Users=>Set<ChefUser>();public DbSet<ChefRecipe> Recipes=>Set<ChefRecipe>();public DbSet<ChefRecipeSyncReceipt> RecipeSyncReceipts=>Set<ChefRecipeSyncReceipt>();public DbSet<ChefReview> Reviews=>Set<ChefReview>();public DbSet<ChefFollow> Follows=>Set<ChefFollow>();protected override void OnModelCreating(ModelBuilder m){m.Entity<ChefUser>().HasIndex(u=>u.Email).IsUnique();m.Entity<ChefUser>().Property(u=>u.Email).HasMaxLength(254);m.Entity<ChefUser>().Property(u=>u.Name).HasMaxLength(80);m.Entity<ChefRecipe>().Property(r=>r.Title).HasMaxLength(120);m.Entity<ChefRecipe>().Property(r=>r.ClientId).HasMaxLength(100);m.Entity<ChefRecipe>().HasIndex(r=>new {r.OwnerId,r.ClientId}).IsUnique().HasFilter("[ClientId] IS NOT NULL");m.Entity<ChefRecipeSyncReceipt>().Property(x=>x.IdempotencyKey).HasMaxLength(200);m.Entity<ChefRecipeSyncReceipt>().HasIndex(x=>new {x.OwnerId,x.IdempotencyKey}).IsUnique();m.Entity<ChefRecipeSyncReceipt>().Property(x=>x.ResponseJson).HasMaxLength(4000);m.Entity<ChefRecipeSyncReceipt>().HasOne<ChefUser>().WithMany().HasForeignKey(x=>x.OwnerId).OnDelete(DeleteBehavior.Cascade);m.Entity<ChefRecipe>().Property(r=>r.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");m.Entity<ChefRecipe>().HasIndex(r=>new {r.OwnerId,r.CreatedAt,r.Id});m.Entity<ChefFollow>().HasIndex(f=>new {f.FollowerId,f.FollowedId}).IsUnique();m.Entity<ChefFollow>().Property(f=>f.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");m.Entity<ChefFollow>().HasIndex(f=>new {f.FollowedId,f.CreatedAt});m.Entity<ChefFollow>().HasOne(f=>f.Follower).WithMany().HasForeignKey(f=>f.FollowerId).OnDelete(DeleteBehavior.Restrict);m.Entity<ChefFollow>().HasOne(f=>f.Followed).WithMany().HasForeignKey(f=>f.FollowedId).OnDelete(DeleteBehavior.Restrict);m.Entity<ChefReview>().HasIndex(r=>new {r.RecipeId,r.UserId}).IsUnique();m.Entity<ChefReview>().Property(r=>r.Comment).HasMaxLength(1000);}}

record ProfileUpdate(string? Name);
record AvatarUpdate(string? AvatarUrl);

record PasswordChange(string? CurrentPassword,string? NewPassword);
