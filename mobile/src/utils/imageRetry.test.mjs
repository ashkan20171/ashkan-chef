import test from 'node:test';
import assert from 'node:assert/strict';
import {canRetryImage,nextImageAttempt,MAX_IMAGE_RETRIES} from './imageRetry.mjs';
test('retry available for failed image',()=>assert.equal(canRetryImage('https://example.org/a.jpg',true,0),true));
test('retry hidden if image loaded',()=>assert.equal(canRetryImage('https://example.org/a.jpg',false,0),false));
test('retry hidden if no image',()=>assert.equal(canRetryImage(null,true,0),false));
test('retry bounded to two manual attempts',()=>{assert.equal(MAX_IMAGE_RETRIES,2);assert.equal(canRetryImage('x',true,2),false);assert.equal(nextImageAttempt(2),2);});
test('attempt increment is safe',()=>{assert.equal(nextImageAttempt(0),1);assert.equal(nextImageAttempt(-1),-1);});

test('image retries stop at the configured maximum', () => {
  assert.equal(canRetryImage('https://example.org/a.jpg', true, 0), true);
  assert.equal(canRetryImage('https://example.org/a.jpg', true, 1), true);
  assert.equal(canRetryImage('https://example.org/a.jpg', true, 2), false);
});
test('retry is not offered without a valid image URL or a failure', () => {
  assert.equal(canRetryImage('', true, 0), false);
  assert.equal(canRetryImage('https://example.org/a.jpg', false, 0), false);
  assert.equal(canRetryImage(null, true, 0), false);
});
