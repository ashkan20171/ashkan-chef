import test from 'node:test';
import assert from 'node:assert/strict';
import {formatStatValue} from './statDisplay.mjs';
test('formats English thousands',()=>assert.equal(formatStatValue(12345,'en'),'12,345'));
test('formats Persian digits',()=>assert.equal(formatStatValue(123,'fa'),'۱۲۳'));
test('clamps negative values',()=>assert.equal(formatStatValue(-7,'en'),'0'));
test('handles non-numeric input',()=>assert.equal(formatStatValue('oops','en'),'0'));
test('truncates fractional values',()=>assert.equal(formatStatValue(2.9,'en'),'2'));
