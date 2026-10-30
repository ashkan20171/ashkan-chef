import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_LANGUAGE,normalizeLanguage,directionFor,localizedText} from './language.mjs';
test('Persian is the default',()=>assert.equal(DEFAULT_LANGUAGE,'fa'));
test('invalid language falls back to Persian',()=>assert.equal(normalizeLanguage('de'),'fa'));
test('English remains selectable',()=>assert.equal(normalizeLanguage('en'),'en'));
test('Persian is RTL',()=>assert.equal(directionFor('fa'),'rtl'));
test('English is LTR',()=>assert.equal(directionFor('en'),'ltr'));
test('translations switch correctly',()=>{assert.equal(localizedText('fa','سلام','Hello'),'سلام');assert.equal(localizedText('en','سلام','Hello'),'Hello')});
