import test from 'node:test';
import assert from 'node:assert/strict';
import { getRecipeListState, normalizeRecipeSearch, RECIPE_LIST_PERFORMANCE } from './recipeListUi.mjs';

test('normalizes whitespace and non-string search input', () => {
  assert.equal(normalizeRecipeSearch('  pasta   with   herbs  '), 'pasta with herbs');
  assert.equal(normalizeRecipeSearch(null), '');
});
test('loading takes precedence over empty and error states', () => {
  assert.equal(getRecipeListState({ loading: true, error: true }), 'loading');
});
test('errors are distinct from empty results', () => {
  assert.equal(getRecipeListState({ error: true }), 'error');
});
test('results take precedence over offline empty state', () => {
  assert.equal(getRecipeListState({ count: 3, offline: true }), 'ready');
});
test('saved recipes have a dedicated empty state', () => {
  assert.equal(getRecipeListState({ showSaved: true }), 'saved-empty');
});
test('offline and search empty states are distinct', () => {
  assert.equal(getRecipeListState({ offline: true }), 'offline-empty');
  assert.equal(getRecipeListState({ query: '  ramen ' }), 'search-empty');
});
test('default empty state is stable', () => {
  assert.equal(getRecipeListState(), 'empty');
});
test('list tuning is bounded for mobile screens', () => {
  assert.equal(RECIPE_LIST_PERFORMANCE.initialNumToRender, 6);
  assert.equal(RECIPE_LIST_PERFORMANCE.maxToRenderPerBatch, 6);
  assert.equal(RECIPE_LIST_PERFORMANCE.windowSize, 5);
});
