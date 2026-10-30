import test from 'node:test';
import assert from 'node:assert/strict';
import {translate} from './i18n.mjs';
const keys=['profileLoadFailed','profileRefreshFailed','signOutFailed','restoreFailed','saveFailed','timerDoneTitle','timerDone','shoppingTitle','shoppingAdded'];
for(const key of keys){test(`localized ${key} in both languages`,()=>{const fa=translate('fa',key),en=translate('en',key);assert.ok(fa&&fa!==key);assert.ok(en&&en!==key);assert.notEqual(fa,en);});}
