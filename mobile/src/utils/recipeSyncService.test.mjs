import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeSyncService } from './recipeSyncService.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem: async key => values.get(key) ?? null, setItem: async (key, value) => values.set(key, value) };
}
const transport = { upsert: async () => ({ acknowledged: true }), delete: async () => ({ acknowledged: true }) };
const recipe = { id: 'local-1', title: 'Soup', ingredients: ['water'], steps: ['boil'] };

test('requires explicit transport methods', () => {
  assert.throws(() => createRecipeSyncService({ storage: memoryStorage() }), /transport/);
});

test('validates stable recipe identity and required fields', async () => {
  const service = createRecipeSyncService({ storage: memoryStorage(), transport });
  await assert.rejects(service.queueUpsert({ ...recipe, id: '' }), /stable id/);
  await assert.rejects(service.queueUpsert({ ...recipe, title: ' ' }), /title/);
  await assert.rejects(service.queueUpsert({ ...recipe, steps: null }), /arrays/);
});

test('queues recipe upserts and reports pending state', async () => {
  const service = createRecipeSyncService({ storage: memoryStorage(), transport });
  await service.queueUpsert(recipe, 10);
  assert.deepEqual(await service.status(), { state: 'pending', pending: 1, upserts: 1, deletes: 0, failedAttempts: 0, storageStatus: 'ready', skippedCorruptEntries: 0 });
});

test('queues deletes and coalesces a later operation for the same recipe', async () => {
  const service = createRecipeSyncService({ storage: memoryStorage(), transport });
  await service.queueUpsert(recipe, 10);
  await service.queueDelete('local-1', 20);
  assert.deepEqual(await service.status(), { state: 'pending', pending: 1, upserts: 0, deletes: 1, failedAttempts: 0, storageStatus: 'ready', skippedCorruptEntries: 0 });
});

test('flush routes upsert and delete with deterministic idempotency metadata', async () => {
  const calls = [];
  const service = createRecipeSyncService({ storage: memoryStorage(), transport: {
    upsert: async (item, meta) => calls.push(['upsert', item.id, meta.idempotencyKey]),
    delete: async (id, meta) => calls.push(['delete', id, meta.idempotencyKey]),
  } });
  await service.queueUpsert(recipe, 100);
  await service.flush({ now: 100 });
  await service.queueDelete('local-2', 200);
  await service.flush({ now: 200 });
  assert.deepEqual(calls, [
    ['upsert', 'local-1', 'recipe:local-1:100'],
    ['delete', 'local-2', 'recipe:local-2:200'],
  ]);
  assert.equal((await service.status()).state, 'idle');
});

test('retains failed operations and reports their retry state', async () => {
  const service = createRecipeSyncService({ storage: memoryStorage(), transport: {
    upsert: async () => { throw new Error('temporarily unavailable'); }, delete: transport.delete,
  } });
  await service.queueUpsert(recipe, 0);
  const result = await service.flush({ now: 0 });
  assert.equal(result.failed, 1);
  assert.equal((await service.status()).failedAttempts, 1);
});

test('requires a non-empty recipe id for delete', async () => {
  const service = createRecipeSyncService({ storage: memoryStorage(), transport });
  await assert.rejects(service.queueDelete('  '), /id is required/);
});
