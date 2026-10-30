/** Device-only public recipe bookmarks. No credentials or private profile data. */
export const SAVED_RECIPES_KEY = 'ashkan-chef:saved-recipes:v1';
export const MAX_SAVED_RECIPES = 100;
export function safeRecipe(recipe) {
  if (!recipe || !Number.isSafeInteger(Number(recipe.id)) || Number(recipe.id) < 1 || typeof recipe.title !== 'string' || !recipe.title.trim()) throw new TypeError('Invalid recipe');
  return {id:Number(recipe.id),title:recipe.title.trim().slice(0,200),ingredients:typeof recipe.ingredients==='string'?recipe.ingredients.slice(0,10000):'[]',steps:typeof recipe.steps==='string'?recipe.steps.slice(0,20000):'[]',imageUrl:typeof recipe.imageUrl==='string'?recipe.imageUrl.slice(0,2000):null,ownerId:Number.isSafeInteger(Number(recipe.ownerId))?Number(recipe.ownerId):null};
}
export function parseSavedRecipes(raw) {
  try { const data=JSON.parse(raw); if(!Array.isArray(data))return []; const result=[]; const seen=new Set(); for(const entry of data){try{const r=safeRecipe(entry);if(!seen.has(r.id)){result.push(r);seen.add(r.id);}}catch{} if(result.length>=MAX_SAVED_RECIPES)break;} return result; }catch{return [];}
}
export function toggleSavedRecipe(items,recipe){
  const safe=safeRecipe(recipe);const current=parseSavedRecipes(JSON.stringify(items));
  return current.some(x=>x.id===safe.id)?current.filter(x=>x.id!==safe.id):[safe,...current].slice(0,MAX_SAVED_RECIPES);
}
