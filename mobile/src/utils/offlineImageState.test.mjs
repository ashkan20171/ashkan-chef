import test from 'node:test';
import assert from 'node:assert/strict';
import {imageSourceState,shouldPersistLoadedImage} from './offlineImageState.mjs';
test('pending cache lookup does not start network image',()=>assert.deepEqual(imageSourceState('https://example.org/a.jpg',null,true),{source:null,ready:false,offline:false}));
test('cached image wins over remote URL',()=>assert.deepEqual(imageSourceState('https://example.org/a.jpg','file:///cache/a.img',false),{source:'file:///cache/a.img',ready:true,offline:true}));
test('cache miss uses remote image',()=>assert.equal(imageSourceState('https://example.org/a.jpg',null,false).source,'https://example.org/a.jpg'));
test('missing URL shows fallback',()=>assert.deepEqual(imageSourceState(null,null,false),{source:null,ready:true,offline:false}));
test('successful remote load may be persisted',()=>assert.equal(shouldPersistLoadedImage('https://example.org/a.jpg',false,true),true));
test('failed or cached image must not be re-downloaded',()=>{assert.equal(shouldPersistLoadedImage('https://example.org/a.jpg',false,false),false);assert.equal(shouldPersistLoadedImage('https://example.org/a.jpg',true,true),false)});
