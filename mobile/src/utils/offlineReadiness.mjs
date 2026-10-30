/** Compare stored snapshots with current recipes without relying on timestamps. */
export function recipeFingerprint(recipe) {
  if (!recipe || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) return null;
  return JSON.stringify([String(recipe.id),recipe.title,recipe.ingredients,recipe.steps]);
}
export function offlineRecipeStatus(recipe, library) {
  if (!recipe || recipe.id == null) return 'unavailable';
  const saved = (Array.isArray(library) ? library : []).find(item => String(item?.id) === String(recipe.id));
  if (!saved) return 'not-saved';
  const current = recipeFingerprint(recipe), previous = recipeFingerprint(saved);
  return current && previous && current !== previous ? 'outdated' : 'ready';
}
export function offlineReadinessSummary(recipes, favoriteIds, library) {
  const byId = new Map((Array.isArray(recipes) ? recipes : []).map(r => [String(r.id),r]));
  return [...new Set((Array.isArray(favoriteIds) ? favoriteIds : []).map(String))].reduce((acc,id) => {
    const status = offlineRecipeStatus(byId.get(id),library);
    acc[status]++; return acc;
  }, {'ready':0,'outdated':0,'not-saved':0,'unavailable':0});
}
