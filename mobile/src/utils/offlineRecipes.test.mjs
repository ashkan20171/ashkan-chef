import test from 'node:test';
import assert from 'node:assert/strict';
import {cacheKey,createCacheEntry,readCacheEntry,CACHE_TTL_MS,MAX_CACHED_ITEMS} from './offlineRecipes.mjs';
test('cache keys are normalized and search-specific',()=>{assert.equal(cacheKey(1,' Soup '),cacheKey(1,'soup'));assert.notEqual(cacheKey(1,'soup'),cacheKey(2,'soup'));});
test('public response is bounded',()=>{assert.equal(createCacheEntry({items:Array.from({length:100},(_,id)=>({id})),total:100}).items.length,MAX_CACHED_ITEMS);});
test('valid cache is read',()=>{assert.deepEqual(readCacheEntry(JSON.stringify(createCacheEntry({items:[{id:1}],total:1},100)),101).items,[{id:1}]);});
test('expired cache is rejected',()=>{assert.equal(readCacheEntry(JSON.stringify(createCacheEntry({items:[],total:0},100)),101+CACHE_TTL_MS),null);});
test('invalid and future cache is rejected',()=>{assert.equal(readCacheEntry('{broken'),null);assert.equal(readCacheEntry(JSON.stringify(createCacheEntry({items:[],total:0},200)),100),null);});
test('malformed response cannot be cached',()=>assert.throws(()=>createCacheEntry({items:null})));
