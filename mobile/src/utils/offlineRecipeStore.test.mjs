import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfflineRecipeStore } from './offlineRecipeStore.mjs';
import { OFFLINE_LIBRARY_KEY } from './offlineRecipeLibrary.mjs';

const soup = { id: 'soup', title: 'Soup', ingredients: ['Water'], steps: ['Boil'] };
const salad = { id: 'salad', title: 'Salad', ingredients: ['Greens'], steps: ['Mix'] };
function memoryStorage(initial = null) {
  const values = new Map(initial == null ? [] : [[OFFLINE_LIBRARY_KEY, initial]]);
  return {
    values,
    async getItem(key) { return values.has(key) ? values.get(key) : null; },
    async setItem(key, value) { values.set(key, value); },
  };
}

test('persists saved favorites and restores them through a fresh store instance', async () => {
  const storage = memoryStorage();
  const firstProcess = createOfflineRecipeStore(storage);
  await firstProcess.saveFavorites([soup, salad], ['soup'], 100);
  // A new store instance models app process restart while the persisted storage remains.
  const restartedProcess = createOfflineRecipeStore(storage);
  const restored = await restartedProcess.load();
  assert.equal(restored.status, 'ready');
  assert.deepEqual(restored.recipes.map(recipe => recipe.id), ['soup']);
  assert.equal(restored.recipes[0].savedAt, 100);
});

test('concurrent saves and removals preserve the final serialized state', async () => {
  const storage = memoryStorage();
  const store = createOfflineRecipeStore(storage);
  await Promise.all([
    store.saveFavorites([soup], ['soup'], 100),
    store.saveFavorites([salad], ['salad'], 200),
    store.remove('soup'),
  ]);
  const finalState = await store.load();
  assert.deepEqual(finalState.recipes.map(recipe => recipe.id), ['salad']);
  assert.equal(store.pending, 0);
});

test('storage write failure is reported and a later mutation can still persist', async () => {
  const storage = memoryStorage();
  const originalSet = storage.setItem.bind(storage);
  let failOnce = true;
  storage.setItem = async (key, value) => {
    if (failOnce) { failOnce = false; throw new Error('disk unavailable'); }
    return originalSet(key, value);
  };
  const store = createOfflineRecipeStore(storage);
  await assert.rejects(store.saveFavorites([soup], ['soup']), /disk unavailable/);
  await store.saveFavorites([salad], ['salad'], 300);
  assert.deepEqual((await store.load()).recipes.map(recipe => recipe.id), ['salad']);
  assert.equal(store.pending, 0);
});

test('invalid storage adapter is rejected immediately', () => {
  assert.throws(() => createOfflineRecipeStore({}), /getItem and setItem/);
});
