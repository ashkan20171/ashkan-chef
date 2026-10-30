import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {imageSourceState, shouldPersistLoadedImage} from './offlineImageState.mjs';
const card = readFileSync(new URL('../components/RecipeCard.js', import.meta.url), 'utf8');
test('recipe card resolves a local cache hit before using the remote URL', () => {
  assert.deepEqual(imageSourceState('https://example.org/a.jpg', 'file:///cache/a.img', false), {
    source:'file:///cache/a.img', ready:true, offline:true
  });
  assert.match(card, /getOfflineImage\(imageUrl\)/);
  assert.match(card, /source=\{\{uri:resolved\.source,cache:'force-cache'\}\}/);
});
test('recipe card persists successful remote image loads only', () => {
  assert.equal(shouldPersistLoadedImage('https://example.org/a.jpg', false, true), true);
  assert.equal(shouldPersistLoadedImage('https://example.org/a.jpg', true, true), false);
  assert.match(card, /saveOfflineImage\(imageUrl\)/);
});
test('failed local image switches back to remote source before final failure state', () => {
  assert.match(card, /if\(resolved\.offline\)\{setOfflineUri\(null\);setImageLoading\(true\);\}else\{setImageFailed\(true\);setImageLoading\(false\);\}/);
});
test('cache lookup cancellation prevents stale recipe results from updating state', () => {
  assert.match(card, /let active=true/);
  assert.match(card, /if\(active\)setOfflineUri\(uri\)/);
  assert.match(card, /return \(\)=>\{active=false;\}/);
});
test('failed recipe images offer an accessible bilingual bounded retry', () => {
  assert.match(card, /canRetryImage\(imageUrl,true,imageAttempts\)/);
  assert.match(card, /accessibilityLabel=\{rtl\?'تلاش دوباره برای بارگذاری تصویر':'Retry image loading'\}/);
  assert.match(card, /setImageAttempts\(current=>nextImageAttempt\(current\)\)/);
  assert.match(card, /rtl\?'تلاش دوباره':'Retry image'/);
});
