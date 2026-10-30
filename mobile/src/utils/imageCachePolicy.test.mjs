import test from 'node:test';
import assert from 'node:assert/strict';
import {imageCacheKey, shouldKeepImage, oldestFilesToRemove, MAX_IMAGE_BYTES} from './imageCachePolicy.mjs';
test('cache key accepts secure public URLs',()=>assert.match(imageCacheKey('https://example.com/a.jpg'),/^[0-9a-f]{8}-[0-9a-f]+\.img$/));
test('cache rejects insecure and credentialed URLs',()=>{for(const u of ['http://a.com/a','file:///etc/passwd','https://a:b@host.com/x','not-a-url'])assert.equal(imageCacheKey(u),null);});
test('different URLs produce different keys',()=>assert.notEqual(imageCacheKey('https://a.com/1'),imageCacheKey('https://a.com/2')));
test('image byte size is bounded',()=>{assert.equal(shouldKeepImage(MAX_IMAGE_BYTES),true);assert.equal(shouldKeepImage(MAX_IMAGE_BYTES+1),false);assert.equal(shouldKeepImage(0),false);});
test('oldest files are selected for cleanup',()=>assert.deepEqual(oldestFilesToRemove([{name:'old',modified:1},{name:'new',modified:2}],1),['old']));
test('invalid cache metadata is ignored',()=>assert.deepEqual(oldestFilesToRemove([null,{}, {name:'ok'}],1),[]));

import {isCacheFilename, cacheUsagePercent} from './imageCachePolicy.mjs';
test('cache filename accepts generated keys',()=>assert.equal(isCacheFilename('deadbeef-10.img'),true));
test('cache filename rejects path traversal',()=>assert.equal(isCacheFilename('../deadbeef-10.img'),false));
test('cache filename rejects partial files',()=>assert.equal(isCacheFilename('deadbeef-10.img.partial'),false));
test('usage clamps over-capacity values',()=>assert.equal(cacheUsagePercent(200,100),100));
test('usage handles zero capacity',()=>assert.equal(cacheUsagePercent(50,0),0));

import {selectLruEvictions, normalizeCacheLimit} from './imageCachePolicy.mjs';
test('LRU retains recently accessed images',()=>assert.deepEqual(selectLruEvictions([
  {name:'aaaaaaaa-1.img',bytes:10,accessed:100},
  {name:'bbbbbbbb-1.img',bytes:10,accessed:300},
  {name:'cccccccc-1.img',bytes:10,accessed:200}
],2,100),['aaaaaaaa-1.img']));
test('LRU respects byte budget',()=>assert.deepEqual(selectLruEvictions([
  {name:'aaaaaaaa-1.img',bytes:80,accessed:3},
  {name:'bbbbbbbb-1.img',bytes:50,accessed:2},
  {name:'cccccccc-1.img',bytes:20,accessed:1}
],3,100),['bbbbbbbb-1.img']));
test('LRU ignores unsafe filenames',()=>assert.deepEqual(selectLruEvictions([{name:'../bad',bytes:1,accessed:1}],0,0),[]));
test('cache limit allows only supported options',()=>{assert.equal(normalizeCacheLimit(20),20);assert.equal(normalizeCacheLimit('40'),40);assert.equal(normalizeCacheLimit(999),60);});
test('LRU does not mutate input',()=>{const rows=[{name:'aaaaaaaa-1.img',bytes:1,accessed:1},{name:'bbbbbbbb-1.img',bytes:1,accessed:2}];selectLruEvictions(rows,1,10);assert.equal(rows[0].name,'aaaaaaaa-1.img');});
