import test from 'node:test';
import assert from 'node:assert/strict';
import {favoriteImageUrls,bulkProgress} from './bulkOfflineImages.mjs';
const a='https://example.org/a.jpg',b='https://example.org/b.jpg';
test('selects favorite images in saved order',()=>assert.deepEqual(favoriteImageUrls([{id:1,image:a},{id:2,image:b}],[2,1]),[b,a]));
test('deduplicates repeated favorites and shared image',()=>assert.deepEqual(favoriteImageUrls([{id:1,image:a},{id:2,image:a}],[1,1,2]),[a]));
test('rejects missing and insecure images',()=>assert.deepEqual(favoriteImageUrls([{id:1,image:'http://example.org/a'},{id:2,image:b}],[1,3,2]),[b]));
test('handles malformed input',()=>assert.deepEqual(favoriteImageUrls(null,null),[]));
test('progress clamps and handles empty batches',()=>{assert.equal(bulkProgress(1,4),25);assert.equal(bulkProgress(5,4),100);assert.equal(bulkProgress(0,0),0);});
