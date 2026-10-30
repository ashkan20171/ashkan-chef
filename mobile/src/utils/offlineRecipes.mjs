/** Bounded, public-only recipe feed cache. Never store tokens or private user data. */
export const CACHE_PREFIX = 'ashkan-chef:public-recipes:v1:';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_CACHED_ITEMS = 40;
export function cacheKey(page = 1, search = '') {
  const safePage = Number.isSafeInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  return CACHE_PREFIX + safePage + ':' + encodeURIComponent(String(search).trim().toLowerCase().slice(0, 80));
}
export function createCacheEntry(data, now = Date.now()) {
  if (!data || !Array.isArray(data.items)) throw new TypeError('Invalid recipe response');
  return { savedAt: now, total: Math.max(0, Number(data.total) || 0), items: data.items.slice(0, MAX_CACHED_ITEMS) };
}
export function readCacheEntry(raw, now = Date.now()) {
  try {
    const entry = JSON.parse(raw);
    if (!entry || !Array.isArray(entry.items) || !Number.isFinite(entry.savedAt) || entry.savedAt > now || now - entry.savedAt > CACHE_TTL_MS) return null;
    return {items: entry.items.slice(0, MAX_CACHED_ITEMS), total: Math.max(0, Number(entry.total) || 0)};
  } catch { return null; }
}
