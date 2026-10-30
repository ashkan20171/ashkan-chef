import test from 'node:test';
import assert from 'node:assert/strict';
import {recipeImageUrl,prefetchRecipeImage,resolveRecipeImage,recipeImageCoverage} from './recipeImages.mjs';
test('accepts valid HTTPS images',()=>assert.equal(recipeImageUrl('https://example.com/food.jpg'),'https://example.com/food.jpg'));
test('rejects non-web schemes and embedded credentials',()=>{assert.equal(recipeImageUrl('file:///etc/passwd'),null);assert.equal(recipeImageUrl('https://user:secret@example.com/x'),null);});
test('rejects whitespace and malformed image URLs',()=>{assert.equal(recipeImageUrl('https://bad host/image'),null);assert.equal(recipeImageUrl('not a url'),null);});
test('prefetches safe images',async()=>{let seen='';assert.equal(await prefetchRecipeImage('https://example.com/a.jpg',async u=>{seen=u;return true;}),true);assert.equal(seen,'https://example.com/a.jpg');});
test('prefetch failure never breaks recipe navigation',async()=>assert.equal(await prefetchRecipeImage('https://example.com/a.jpg',async()=>{throw Error('offline')}),false));
test('invalid image is never prefetched',async()=>{let calls=0;assert.equal(await prefetchRecipeImage('javascript:alert(1)',async()=>{calls++;return true}),false);assert.equal(calls,0);});

test('resolves a category-specific image when a recipe has no valid photo',()=>{
 const image=resolveRecipeImage({title:'Pancakes',category:'صبحانه'});
 assert.match(image,/^https:\/\//);
 assert.match(image,/photo-1528207776546-365bb710ee93/);
});
test('keeps a valid recipe photo and supplies an image for unknown categories',()=>{
 assert.equal(resolveRecipeImage({image:'https://example.com/dish.jpg',category:'دسر'}),'https://example.com/dish.jpg');
 assert.match(resolveRecipeImage({category:'ناشناخته'}),/^https:\/\//);
});
test('reports complete image coverage for recipe collections',()=>{
 const report=recipeImageCoverage([{category:'صبحانه'},{category:'دسر',image:'https://example.com/cake.jpg'}]);
 assert.deepEqual(report,{total:2,withImage:2});
});

test('every built-in recipe resolves to a photo', async () => {
  const { recipes } = await import('../data/recipes.js');
  const report = recipeImageCoverage(recipes);
  assert.equal(report.total, recipes.length);
  assert.equal(report.withImage, recipes.length);
});
