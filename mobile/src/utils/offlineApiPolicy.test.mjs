import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldUseCachedRecipes,shouldRefreshAfterReconnect,offlineRecipesMessage} from './offlineApiPolicy.mjs';
test('offline only skips network for explicit offline',()=>{assert.equal(shouldUseCachedRecipes('offline'),true);assert.equal(shouldUseCachedRecipes('unknown'),false);assert.equal(shouldUseCachedRecipes('online'),false)});
test('refreshes on offline to online transition',()=>assert.equal(shouldRefreshAfterReconnect('offline','online'),true));
test('does not refresh for unknown to online',()=>assert.equal(shouldRefreshAfterReconnect('unknown','online'),false));
test('does not refresh repeatedly online',()=>assert.equal(shouldRefreshAfterReconnect('online','online'),false));
test('messages localized',()=>{assert.match(offlineRecipesMessage('fa'),/آفلاین/);assert.match(offlineRecipesMessage('en'),/Offline/)});
