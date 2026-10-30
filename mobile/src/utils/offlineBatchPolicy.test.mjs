import test from 'node:test';
import assert from 'node:assert/strict';
import {canStartOfflineImageBatch, shouldContinueOfflineImageBatch} from './offlineBatchPolicy.mjs';

test('allows batch when online and images exist', () => assert.equal(canStartOfflineImageBatch({imageCount:2,connection:'online'}), true));
test('does not start a batch while offline', () => assert.equal(canStartOfflineImageBatch({imageCount:2,connection:'offline'}), false));
test('unknown connectivity does not falsely block a user action', () => assert.equal(canStartOfflineImageBatch({imageCount:1,connection:'unknown'}), true));
test('blocks empty, busy, and already-running batches', () => {
  assert.equal(canStartOfflineImageBatch({imageCount:0,connection:'online'}), false);
  assert.equal(canStartOfflineImageBatch({imageCount:2,isBusy:true,connection:'online'}), false);
  assert.equal(canStartOfflineImageBatch({imageCount:2,isRunning:true,connection:'online'}), false);
});
test('stops before next image after cancellation', () => assert.equal(shouldContinueOfflineImageBatch({cancelRequested:true,connection:'online'}), false));
test('stops a batch if connectivity drops between images', () => assert.equal(shouldContinueOfflineImageBatch({connection:'offline'}), false));
test('continues when online and not cancelled', () => assert.equal(shouldContinueOfflineImageBatch({connection:'online'}), true));
