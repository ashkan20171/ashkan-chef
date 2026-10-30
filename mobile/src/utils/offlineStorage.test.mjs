import test from 'node:test';
import assert from 'node:assert/strict';
import {formatCacheBytes} from './offlineStorage.mjs';
test('empty bytes',()=>assert.equal(formatCacheBytes(0,'en'),'0 KB'));
test('kilobytes',()=>assert.equal(formatCacheBytes(2048,'en'),'2 KB'));
test('megabytes',()=>assert.equal(formatCacheBytes(1572864,'en'),'1.5 MB'));
test('invalid bytes',()=>assert.equal(formatCacheBytes(NaN,'en'),'0 KB'));
test('Persian numerals',()=>assert.match(formatCacheBytes(2048,'fa'),/۲/));
