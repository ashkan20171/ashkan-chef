/** Pure, dependency-free helpers for recipe discovery and shopping. */
export function normalizeSearch(value) {
  return String(value ?? '').normalize('NFKC').replace(/[ي]/g, 'ی').replace(/[ك]/g, 'ک').trim().toLocaleLowerCase();
}

export function filterRecipes(recipes, { category = 'همه', query = '', onlyFavorites = false, favorites = [] } = {}) {
  const needle = normalizeSearch(query);
  const favoriteIds = new Set(favorites);
  return recipes.filter(recipe => {
    if (!recipe || !recipe.id) return false;
    const inCategory = category === 'همه' || (category === 'دستورهای من'
      ? String(recipe.id).startsWith('local-') : recipe.category === category);
    const searchable = `${recipe.title ?? ''} ${recipe.category ?? ''} ${(recipe.ingredients ?? []).join(' ')}`;
    return inCategory && normalizeSearch(searchable).includes(needle)
      && (!onlyFavorites || favoriteIds.has(recipe.id));
  });
}

export function shoppingCompletion(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return Math.round(items.filter(item => item?.done === true).length * 100 / items.length);
}
