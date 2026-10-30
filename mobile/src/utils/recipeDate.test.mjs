import test from 'node:test';
import assert from 'node:assert/strict';
import {formatRecipeDate} from './recipeDate.js';
test('missing dates produce an empty label',()=>assert.equal(formatRecipeDate(null),''));
test('invalid dates produce an empty label',()=>assert.equal(formatRecipeDate('not-a-date'),''));
test('English dates use Gregorian calendar',()=>assert.match(formatRecipeDate('2026-10-23T12:00:00Z','en'),/2026/));
test('Persian dates use Jalali calendar',()=>assert.match(formatRecipeDate('2026-10-23T12:00:00Z','fa'),/۱۴۰۵/));
