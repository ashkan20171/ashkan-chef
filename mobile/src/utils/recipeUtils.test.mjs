import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('./recipeUtils.js', import.meta.url), 'utf8');
const {filterRecipes, shoppingCompletion, normalizeSearch} = await import('data:text/javascript,' + encodeURIComponent(source));
const recipes = [
 {id: '1',title:'خوراک مرغ',category:'غذای اصلی',ingredients:['زعفران']},
 {id:'local-2',title:'سوپ',category:'دستورهای من',ingredients:['هویج']}
];
test('normalizes Arabic and Persian characters',()=>assert.equal(normalizeSearch('  كيك يزدي '),'کیک یزدی'));
test('searches ingredients',()=>assert.deepEqual(filterRecipes(recipes,{query:'زعفران'}).map(r=>r.id),['1']));
test('filters own recipes',()=>assert.deepEqual(filterRecipes(recipes,{category:'دستورهای من'}).map(r=>r.id),['local-2']));
test('filters favorites',()=>assert.deepEqual(filterRecipes(recipes,{onlyFavorites:true,favorites:['1']}).map(r=>r.id),['1']));
test('empty shopping is zero percent',()=>assert.equal(shoppingCompletion([]),0));
test('calculates shopping progress',()=>assert.equal(shoppingCompletion([{done:true},{done:false}]),50));
