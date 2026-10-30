export function normalizeRecipeSearch(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function getRecipeListState({ loading = false, error = false, count = 0, query = '', offline = false, showSaved = false } = {}) {
  if (loading) return 'loading';
  if (error) return 'error';
  if (Number.isFinite(count) && count > 0) return 'ready';
  if (showSaved) return 'saved-empty';
  if (offline) return 'offline-empty';
  if (normalizeRecipeSearch(query)) return 'search-empty';
  return 'empty';
}

export const RECIPE_LIST_PERFORMANCE = Object.freeze({
  initialNumToRender: 6,
  maxToRenderPerBatch: 6,
  windowSize: 5,
  updateCellsBatchingPeriod: 50,
});
