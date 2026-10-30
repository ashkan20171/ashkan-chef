import test from 'node:test';
import assert from 'node:assert/strict';
import {profileDirection,profileAlignment,profileDisplayName} from './profileUi.mjs';
test('Persian profile uses RTL direction',()=>assert.equal(profileDirection('fa'),'row-reverse'));
test('English profile uses LTR direction',()=>assert.equal(profileDirection('en'),'row'));
test('Persian profile text is right aligned',()=>assert.equal(profileAlignment('fa'),'right'));
test('English profile text is left aligned',()=>assert.equal(profileAlignment('en'),'left'));
test('empty name has translated fallback',()=>{assert.equal(profileDisplayName('  ','fa'),'آشپز مهمان');assert.equal(profileDisplayName(null,'en'),'Guest chef')});
