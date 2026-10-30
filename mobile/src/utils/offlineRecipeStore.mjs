import { OFFLINE_LIBRARY_KEY, inspectOfflineLibrary, mergeOfflineLibrary, removeOfflineRecipe, favoriteRecipeSnapshots } from './offlineRecipeLibrary.mjs';
import { createAsyncSerialQueue } from './asyncSerialQueue.mjs';

/** Persistence boundary for the offline recipe library; storage must expose getItem/setItem. */
export function createOfflineRecipeStore(storage, key = OFFLINE_LIBRARY_KEY) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('Offline recipe storage requires getItem and setItem');
  }
  const queue = createAsyncSerialQueue();

  async function load() {
    const raw = await storage.getItem(key);
    return inspectOfflineLibrary(raw);
  }

  async function commit(transform) {
    return queue.run(async () => {
      // Always read inside the queue: never mutate an out-of-date React state snapshot.
      const report = await load();
      const recipes = transform(report.recipes);
      await storage.setItem(key, JSON.stringify(recipes));
      return { recipes, previousReport: report };
    });
  }

  return {
    load,
    saveFavorites(recipes, favoriteIds, now = Date.now()) {
      const snapshots = favoriteRecipeSnapshots(recipes, favoriteIds);
      return commit(current => mergeOfflineLibrary(current, snapshots, now));
    },
    remove(id) {
      return commit(current => removeOfflineRecipe(current, id));
    },
    get pending() { return queue.pending; },
  };
}
