# PowerShell 7. Requires a running API. Readiness is optional when SQL Server is unavailable.
param([string]$BaseUrl = "http://localhost:5080", [switch]$RequireDatabase, [string]$BearerToken = "")
$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd('/')
function Check([string]$Path, [int]$Expected, [string]$Method="GET", [string]$Body=$null, [string]$Token="") {
 $args = @{ Uri="$BaseUrl$Path"; Method=$Method; SkipHttpErrorCheck=$true; TimeoutSec=15 }
 if ($null -ne $Body) { $args.ContentType="application/json"; $args.Body=$Body }
 if ($Token) { $args.Headers = @{ Authorization = "Bearer $Token" } }
 $r = Invoke-WebRequest @args
 if ([int]$r.StatusCode -ne $Expected) { throw "FAIL $Method $Path expected $Expected, got $($r.StatusCode): $($r.Content)" }
 Write-Host "PASS $Method $Path => $Expected"
 return $r
}
$health = Check "/health" 200
$ready = Invoke-WebRequest -Uri "$BaseUrl/health/ready" -SkipHttpErrorCheck -TimeoutSec 15
if ($RequireDatabase -and [int]$ready.StatusCode -ne 200) { throw "Database readiness failed: $($ready.StatusCode)" }
if ([int]$ready.StatusCode -notin @(200,503)) { throw "Unexpected readiness status $($ready.StatusCode)" }
Write-Host "PASS /health/ready => $($ready.StatusCode)"
foreach ($route in @('/api/me','/api/me/stats','/api/me/analytics','/api/me/activity','/api/me/recipes','/api/me/following')) { $null = Check $route 401 }
$null = Check '/api/me/sessions/revoke' 401 'POST'
$null = Check '/api/media/images' 401 'POST'
$null = Check '/api/recipes' 401 'POST' '{}'
$null = Check '/api/recipes/1' 401 'DELETE'
$null = Check '/api/recipes/1' 401 'PUT' '{}'
$null = Check '/api/auth/login' 400 'POST' '{}'
$null = Check '/api/auth/register' 400 'POST' '{}'
$missing = Check '/route-that-does-not-exist-v39' 404
if ($missing.Headers['X-Content-Type-Options'] -ne 'nosniff') { throw 'Missing nosniff header' }
Write-Host 'PASS response security header'
# Read-only authenticated contract checks; never modify user data.
if ($BearerToken) {
 $me = Check '/api/me' 200 'GET' $null $BearerToken
 $profile = $me.Content | ConvertFrom-Json
 if ($null -eq $profile) { throw 'Authenticated profile returned invalid JSON' }
 $stats = Check '/api/me/stats' 200 'GET' $null $BearerToken
 $statsJson = $stats.Content | ConvertFrom-Json
 foreach ($field in @('recipes','followers','following')) {
  if ($null -eq $statsJson.$field) { throw "Missing stats field $field" }
 }
 $activity = Check '/api/me/activity?page=1' 200 'GET' $null $BearerToken
 $activityJson = $activity.Content | ConvertFrom-Json
 if ($activityJson.page -ne 1 -or $activityJson.pageSize -ne 8) { throw 'Unexpected activity pagination contract' }
 $null = Check '/api/me/activity?page=0' 400 'GET' $null $BearerToken
 $null = Check '/api/me/activity?page=10001' 400 'GET' $null $BearerToken
 $null = Check '/api/me/analytics' 200 'GET' $null $BearerToken
 Write-Host 'PASS authenticated read-only contract checks'
} else {
 Write-Host 'SKIP authenticated contract checks (provide -BearerToken to enable)'
}
Write-Host 'API smoke/security checks passed.' 
