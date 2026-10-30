import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeSyncTransport } from './recipeSyncTransport.mjs';

test('sync transport maps upsert payload and idempotency header to authenticated API request', async () => {
  let call;
  const transport = createRecipeSyncTransport(async (...args) => { call = args; return { status: 'applied' }; });
  await transport.upsert({ id: 'local-1', title: 'Soup', ingredients: ['water'], steps: ['boil'], syncVersion: 3 }, { idempotencyKey: 'recipe:local-1:100' });
  assert.equal(call[0], '/api/sync/recipes/upsert');
  assert.equal(call[1].authenticated, true);
  assert.equal(call[1].headers['Idempotency-Key'], 'recipe:local-1:100');
  assert.deepEqual(call[1].body, { clientId: 'local-1', title: 'Soup', ingredients: ['water'], steps: ['boil'], imageUrl: null, expectedVersion: 3 });
});

test('sync transport maps deletes and requires idempotency metadata', async () => {
  let call;
  const transport = createRecipeSyncTransport(async (...args) => { call = args; });
  await transport.delete('local-2', { idempotencyKey: 'recipe:local-2:200', expectedVersion: 4 });
  assert.equal(call[0], '/api/sync/recipes/delete');
  assert.deepEqual(call[1].body, { clientId: 'local-2', expectedVersion: 4 });
  assert.throws(() => transport.delete('local-2'), /Idempotency key/);
});

test('sync transport validates dependencies and recipe identity', async () => {
  assert.throws(() => createRecipeSyncTransport(), /request function/);
  const transport = createRecipeSyncTransport(async () => ({}));
  assert.throws(() => transport.upsert({ title: 'Missing id' }, { idempotencyKey: 'key-123456' }), /stable client id/);
});

test('sync transport includes the recipe card image URL in server payload', async () => {
  let call;
  const transport = createRecipeSyncTransport(async (...args) => { call = args; return {}; });
  await transport.upsert({ id: 'local-photo', title: 'Salad', ingredients: ['tomato'], steps: ['mix'], image: 'https://example.com/salad.jpg' }, { idempotencyKey: 'recipe:local-photo:300' });
  assert.equal(call[1].body.imageUrl, 'https://example.com/salad.jpg');
});
