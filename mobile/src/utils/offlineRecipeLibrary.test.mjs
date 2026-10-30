import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOfflineRecipe,parseOfflineLibrary,mergeOfflineLibrary,removeOfflineRecipe,favoriteRecipeSnapshots,MAX_OFFLINE_RECIPES,inspectOfflineLibrary} from './offlineRecipeLibrary.mjs';
const recipe={id:'local-1',title:'  Soup ',ingredients:['Water'],steps:['Boil'],image:'https://example.org/a.jpg'};
test('normalizes valid local recipes without private fields',()=>{const result=normalizeOfflineRecipe({...recipe,token:'secret'},100);assert.equal(result.title,'Soup');assert.equal(result.token,undefined);assert.equal(result.savedAt,100);});
test('rejects missing cooking instructions',()=>assert.equal(normalizeOfflineRecipe({...recipe,steps:[]}),null));
test('ignores malformed persisted data',()=>assert.deepEqual(parseOfflineLibrary('{broken'),[]));
test('updates an existing snapshot without duplication',()=>{const a=mergeOfflineLibrary([], [recipe],100);const b=mergeOfflineLibrary(a,[{...recipe,title:'Updated'}],200);assert.equal(b.length,1);assert.equal(b[0].title,'Updated');});
test('removes only selected offline recipe',()=>{const all=mergeOfflineLibrary([], [recipe,{...recipe,id:'2'}]);assert.deepEqual(removeOfflineRecipe(all,'local-1').map(r=>r.id),['2']);});
test('selects only favorite recipes with stable order',()=>assert.deepEqual(favoriteRecipeSnapshots([recipe,{...recipe,id:'2'}],['2','2','local-1']).map(r=>String(r.id)),['2','local-1']));
test('limits library to bounded number of entries',()=>{const all=mergeOfflineLibrary([],Array.from({length:MAX_OFFLINE_RECIPES+10},(_,i)=>({...recipe,id:String(i)})));assert.equal(all.length,MAX_OFFLINE_RECIPES);});

test('inspection distinguishes an empty library from corrupt persisted JSON',()=>{
  assert.equal(inspectOfflineLibrary(null).status,'empty');
  assert.equal(inspectOfflineLibrary('{broken').status,'corrupt');
});
test('inspection recovers valid entries from a mixed snapshot and reports skipped entries',()=>{
  const report=inspectOfflineLibrary(JSON.stringify([recipe,{id:'bad',title:'Missing steps'},recipe]));
  assert.equal(report.status,'recovered');
  assert.equal(report.recipes.length,1);
  assert.equal(report.skipped,1);
  assert.equal(report.duplicates,1);
  assert.equal(report.recipes[0].title,'Soup');
});
test('inspection rejects valid JSON with a non-array root',()=>{
  assert.equal(inspectOfflineLibrary('{"items":[]}').status,'invalid-shape');
});
test('duplicate recovery keeps the latest snapshot',()=>{
  const report=inspectOfflineLibrary(JSON.stringify([recipe,{...recipe,title:'Newest'}]));
  assert.equal(report.recipes[0].title,'Newest');
});
