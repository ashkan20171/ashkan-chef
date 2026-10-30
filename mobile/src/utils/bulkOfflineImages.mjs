import {imageCacheKey} from './imageCachePolicy.mjs';
/** Preserve favorite order, exclude invalid URLs and duplicate image resources. */
export function favoriteImageUrls(recipes, favoriteIds) {
  const byId = new Map((Array.isArray(recipes) ? recipes : []).filter(r => r && r.id != null).map(r => [String(r.id), r]));
  const seen = new Set();
  return (Array.isArray(favoriteIds) ? favoriteIds : []).flatMap(id => {
    const url = byId.get(String(id))?.image;
    const key = imageCacheKey(url);
    if (!key || seen.has(key)) return [];
    seen.add(key);
    return [url];
  });
}
export function bulkProgress(completed, total) {
  return total > 0 ? Math.max(0, Math.min(100, Math.round(completed / total * 100))) : 0;
}
