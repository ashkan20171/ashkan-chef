import test from 'node:test';
import assert from 'node:assert/strict';
import {createAsyncSerialQueue} from './asyncSerialQueue.mjs';

test('serializes overlapping mutations in enqueue order', async () => {
  const queue = createAsyncSerialQueue();
  const events = [];
  let releaseFirst;
  const gate = new Promise(resolve => { releaseFirst = resolve; });
  const first = queue.run(async () => { events.push('first:start'); await gate; events.push('first:end'); return 1; });
  const second = queue.run(async () => { events.push('second:start'); return 2; });
  await Promise.resolve();
  assert.deepEqual(events, ['first:start']);
  assert.equal(queue.pending, 2);
  releaseFirst();
  assert.deepEqual(await Promise.all([first, second]), [1, 2]);
  assert.deepEqual(events, ['first:start', 'first:end', 'second:start']);
  assert.equal(queue.pending, 0);
});

test('a failed mutation does not block later queued work', async () => {
  const queue = createAsyncSerialQueue();
  const first = queue.run(async () => { throw new Error('storage failed'); });
  const second = queue.run(async () => 'recovered');
  await assert.rejects(first, /storage failed/);
  assert.equal(await second, 'recovered');
  assert.equal(queue.pending, 0);
});

test('rejects non-function tasks without corrupting the queue', async () => {
  const queue = createAsyncSerialQueue();
  await assert.rejects(queue.run(null), /Queue task must be a function/);
  assert.equal(await queue.run(() => 'ok'), 'ok');
});
