import * as FS from 'expo-file-system/legacy';
import {imageCacheKey, MAX_CACHED_IMAGES, shouldKeepImage, oldestFilesToRemove, isCacheFilename, selectLruEvictions, normalizeCacheLimit, MAX_IMAGE_BYTES} from '../utils/imageCachePolicy.mjs';

const DIR = `${FS.documentDirectory}public-recipe-images/`;
const pending = new Map();
const META = DIR + 'cache-index.json';
const SETTINGS = DIR + 'cache-settings.json';
let lock = Promise.resolve();
function serialized(action) {
  const job = lock.then(action, action);
  lock = job.catch(() => {});
  return job;
}
async function readJson(path, fallback) {
  try { return JSON.parse(await FS.readAsStringAsync(path)); } catch { return fallback; }
}
async function writeJson(path, value) {
  await ensureDir();
  const temp = path + '.partial';
  await FS.writeAsStringAsync(temp, JSON.stringify(value));
  await FS.moveAsync({from:temp,to:path});
}
async function markUsed(name) {
  await serialized(async () => {
    const index = await readJson(META, {});
    index[name] = Date.now();
    await writeJson(META, index);
  });
}
export async function getOfflineImageLimit() {
  await ensureDir();
  const data = await readJson(SETTINGS, {});
  return normalizeCacheLimit(data.maxImages);
}
export async function setOfflineImageLimit(limit) {
  if (![20,40,60].includes(Number(limit))) return false;
  await serialized(() => writeJson(SETTINGS, {maxImages:Number(limit)}));
  await pruneOfflineImages();
  return true;
}

async function ensureDir() { await FS.makeDirectoryAsync(DIR, {intermediates:true}); }
/** Persist only explicitly viewed, public HTTPS recipe images. No user tokens or private images. */
export async function getOfflineImage(url) {
  const key = imageCacheKey(url);
  if (!key) return null;
  const path = DIR + key;
  try { const info = await FS.getInfoAsync(path); if (info.exists && shouldKeepImage(info.size)) {
      await markUsed(key).catch(() => {});
      return path;
    }
    return null; }
  catch { return null; }
}
export async function saveOfflineImage(url) {
  const key = imageCacheKey(url);
  if (!key) return null;
  if (pending.has(key)) return pending.get(key);
  const job = (async () => {
    const existing = await getOfflineImage(url);
    if (existing) return existing;
    await ensureDir();
    const temp = DIR + key + '.partial';
    const target = DIR + key;
    try {
      const result = await FS.downloadAsync(url, temp);
      if (result.status !== 200) return null;
      const info = await FS.getInfoAsync(temp);
      if (!info.exists || !shouldKeepImage(info.size)) return null;
      await FS.moveAsync({from:temp,to:target});
      await markUsed(key);
      await pruneOfflineImages();
      return target;
    } catch { return null; }
    finally { await FS.deleteAsync(temp,{idempotent:true}).catch(()=>{}); }
  })().finally(()=>pending.delete(key));
  pending.set(key,job);
  return job;
}
export async function pruneOfflineImages() {
  try {
    await ensureDir();
    return await serialized(async () => {
      const index = await readJson(META, {});
      const names = (await FS.readDirectoryAsync(DIR)).filter(isCacheFilename);
      const files = (await Promise.all(names.map(async name => {
        const info = await FS.getInfoAsync(DIR+name).catch(() => null);
        return info?.exists ? {name,bytes:info.size || 0,modified:info.modificationTime || 0,accessed:index[name]} : null;
      }))).filter(Boolean);
      const maxCount = await getOfflineImageLimit();
      const remove = selectLruEvictions(files,maxCount,maxCount * MAX_IMAGE_BYTES);
      for (const name of remove) await FS.deleteAsync(DIR+name,{idempotent:true});
      const remaining = new Set(files.map(f=>f.name).filter(n=>!remove.includes(n)));
      const next = Object.fromEntries(Object.entries(index).filter(([name])=>remaining.has(name)));
      await writeJson(META,next);
      return remove.length;
    });
  } catch { return 0; }
}
export async function clearOfflineImages() {
  try { await FS.deleteAsync(DIR,{idempotent:true}); return true; } catch { return false; }
}

/** Read current image storage usage without downloading any files. */
export async function getOfflineImageStats() {
  try {
    await ensureDir();
    const names = (await FS.readDirectoryAsync(DIR)).filter(name => name.endsWith('.img'));
    const infos = await Promise.all(names.map(name => FS.getInfoAsync(DIR + name).catch(() => null)));
    return {count: infos.filter(info => info?.exists).length,
      bytes: infos.reduce((sum, info) => sum + (info?.exists && Number.isFinite(info.size) ? info.size : 0), 0)};
  } catch { return {count: 0, bytes: 0}; }
}

/** Enumerate only managed image files; newest first. */
export async function listOfflineImages() {
  await ensureDir();
  const names = (await FS.readDirectoryAsync(DIR)).filter(isCacheFilename);
  const rows = await Promise.all(names.map(async name => {
    try {
      const info = await FS.getInfoAsync(DIR + name);
      return info.exists ? {name, bytes: info.size || 0, modified: info.modificationTime || 0} : null;
    } catch { return null; }
  }));
  const index = await readJson(META, {});
  return rows.filter(Boolean).map(row => ({...row,accessed:index[row.name] || row.modified,uri:DIR+row.name}))
    .sort((a,b) => b.accessed - a.accessed || a.name.localeCompare(b.name));
}
/** Only filenames generated by imageCacheKey are deletable. */
export async function deleteOfflineImage(name) {
  if (!isCacheFilename(name)) return false;
  try {
    await serialized(async () => {
      await FS.deleteAsync(DIR + name, {idempotent:true});
      const index = await readJson(META, {});
      delete index[name];
      await writeJson(META,index);
    });
    return true;
  }
  catch { return false; }
}
