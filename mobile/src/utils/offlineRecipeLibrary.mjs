/** Public/local recipe snapshots only. No credentials, session data or private notes. */
export const OFFLINE_LIBRARY_KEY = 'ashkan-chef:offline-library:v1';
export const MAX_OFFLINE_RECIPES = 80;
export function normalizeOfflineRecipe(recipe, savedAt = Date.now()) {
  if (!recipe || !['string','number'].includes(typeof recipe.id) || !String(recipe.id).trim() || typeof recipe.title !== 'string' || !recipe.title.trim()) return null;
  if (!Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps) || !recipe.ingredients.length || !recipe.steps.length) return null;
  const clean = values => values.slice(0,80).filter(v=>typeof v==='string'&&v.trim()).map(v=>v.trim().slice(0,500));
  const ingredients=clean(recipe.ingredients), steps=clean(recipe.steps);
  if (!ingredients.length || !steps.length) return null;
  return {id:String(recipe.id).slice(0,100),title:recipe.title.trim().slice(0,200),ingredients,steps,
    image:typeof recipe.image==='string'&&/^https:\/\//i.test(recipe.image)?recipe.image.slice(0,2000):null,
    category:typeof recipe.category==='string'?recipe.category.slice(0,80):'',
    minutes:Number.isFinite(recipe.minutes)?Math.max(0,Math.min(1440,recipe.minutes)):0,
    difficulty:typeof recipe.difficulty==='string'?recipe.difficulty.slice(0,80):'',
    calories:Number.isFinite(recipe.calories)?Math.max(0,recipe.calories):0,
    savedAt:Number.isFinite(savedAt)&&savedAt>0?savedAt:Date.now()};
}
export function inspectOfflineLibrary(raw) {
  if (raw == null || raw === '') return { recipes: [], status: 'empty', skipped: 0, duplicates: 0, truncated: 0 };
  let data;
  try { data = JSON.parse(raw); } catch {
    return { recipes: [], status: 'corrupt', skipped: 1, duplicates: 0, truncated: 0 };
  }
  if (!Array.isArray(data)) return { recipes: [], status: 'invalid-shape', skipped: 1, duplicates: 0, truncated: 0 };
  const byId = new Map();
  let skipped = 0, duplicates = 0;
  for (const item of data) {
    const recipe = normalizeOfflineRecipe(item, item?.savedAt);
    if (!recipe) { skipped++; continue; }
    if (byId.has(recipe.id)) duplicates++;
    // Keep the most recently encountered snapshot while preserving a deterministic order.
    byId.delete(recipe.id);
    byId.set(recipe.id, recipe);
  }
  const all = [...byId.values()];
  const truncated = Math.max(0, all.length - MAX_OFFLINE_RECIPES);
  const recipes = all.slice(-MAX_OFFLINE_RECIPES).reverse();
  const status = skipped || duplicates || truncated ? 'recovered' : recipes.length ? 'ready' : 'empty';
  return { recipes, status, skipped, duplicates, truncated };
}
export function parseOfflineLibrary(raw) { return inspectOfflineLibrary(raw).recipes; }
export function mergeOfflineLibrary(current, recipes, now=Date.now()) {
  const result=parseOfflineLibrary(JSON.stringify(current));
  for(const item of Array.isArray(recipes)?recipes:[]){const recipe=normalizeOfflineRecipe(item,now);if(!recipe)continue;
    const index=result.findIndex(r=>r.id===recipe.id);if(index>=0)result.splice(index,1);result.unshift(recipe);
  }return result.slice(0,MAX_OFFLINE_RECIPES);
}
export function removeOfflineRecipe(current,id){return parseOfflineLibrary(JSON.stringify(current)).filter(r=>r.id!==String(id));}
export function favoriteRecipeSnapshots(recipes, ids){const byId=new Map((Array.isArray(recipes)?recipes:[]).map(r=>[String(r?.id),r]));return [...new Set(Array.isArray(ids)?ids.map(String):[])].map(id=>byId.get(id)).filter(Boolean);}
