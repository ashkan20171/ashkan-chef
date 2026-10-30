import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordStrength,passwordChecklist} from './passwordStrength.mjs';
test('empty password is weak',()=>assert.equal(passwordStrength('').score,0));
test('non-string input is safe',()=>assert.equal(passwordStrength(null).score,0));
test('strong password scores four',()=>assert.equal(passwordStrength('StrongPassword12!').score,4));
test('short password does not meet length rule',()=>assert.equal(passwordChecklist('abc1').length,false));
test('checklist recognizes letters and digits',()=>assert.deepEqual(passwordChecklist('abc12345'),{length:true,letters:true,numbers:true}));
