/** Deterministic, bounded file-cache policy. Only public HTTPS images qualify. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_CACHED_IMAGES = 60;
export function imageCacheKey(url) {
  if (typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) return null;
    // FNV-1a hash over full URL, stable on Android/iOS without crypto modules.
    let hash = 2166136261;
    for (let i = 0; i < url.length; i++) { hash ^= url.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16).padStart(8, '0') + '-' + url.length.toString(16) + '.img';
  } catch { return null; }
}
export function shouldKeepImage(bytes) { return Number.isFinite(bytes) && bytes > 0 && bytes <= MAX_IMAGE_BYTES; }
export function oldestFilesToRemove(files, limit = MAX_CACHED_IMAGES) {
  if (!Array.isArray(files)) return [];
  const sorted = files.filter(f => f && typeof f.name === 'string').sort((a,b) => (b.modified || 0) - (a.modified || 0));
  return sorted.slice(Math.max(0, limit)).map(f => f.name);
}

/** Never allow arbitrary paths to reach the filesystem from UI actions. */
export function isCacheFilename(name) {
  return typeof name === 'string' && /^[0-9a-f]{8}-[0-9a-f]+\.img$/.test(name);
}
export function cacheUsagePercent(bytes, limitBytes) {
  if (!Number.isFinite(bytes) || !Number.isFinite(limitBytes) || limitBytes <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(bytes / limitBytes * 100)));
}

/** LRU eviction considers both file count and total bytes. Most recently used wins. */
export function selectLruEvictions(files, maxCount = MAX_CACHED_IMAGES, maxBytes = MAX_CACHED_IMAGES * MAX_IMAGE_BYTES) {
  if (!Array.isArray(files)) return [];
  const safeCount = Number.isFinite(maxCount) ? Math.max(0, Math.floor(maxCount)) : MAX_CACHED_IMAGES;
  const safeBytes = Number.isFinite(maxBytes) ? Math.max(0, maxBytes) : MAX_CACHED_IMAGES * MAX_IMAGE_BYTES;
  const ordered = files.filter(f => f && isCacheFilename(f.name)).map(f => ({
    name:f.name, bytes:Number.isFinite(f.bytes) && f.bytes > 0 ? f.bytes : 0,
    accessed:Number.isFinite(f.accessed) ? f.accessed : (Number.isFinite(f.modified) ? f.modified : 0)
  })).sort((a,b) => b.accessed - a.accessed || a.name.localeCompare(b.name));
  let count=0, bytes=0;
  const remove=[];
  for (const file of ordered) {
    if (count + 1 > safeCount || bytes + file.bytes > safeBytes) remove.push(file.name);
    else { count++; bytes += file.bytes; }
  }
  return remove;
}
export function normalizeCacheLimit(value) {
  const allowed = [20,40,60];
  return allowed.includes(Number(value)) ? Number(value) : MAX_CACHED_IMAGES;
}
