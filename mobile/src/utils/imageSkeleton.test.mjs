import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root = new URL('../components/', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
test('skeleton animation cleans up on unmount', () => { const source=read('ImageSkeleton.js'); assert.match(source,/animation\.stop\(\)/); assert.match(source,/useNativeDriver: true/); });
test('recipe hero displays skeleton while image loads', () => {assert.match(read('RecipeHero.js'),/<ImageSkeleton palette=\{palette\}/);});
test('recipe card displays compact skeleton while image loads', () => {assert.match(read('RecipeCard.js'),/<ImageSkeleton palette=\{palette\} compact/);});
test('image load failures disable skeleton in both components', () => {for(const file of ['RecipeHero.js','RecipeCard.js']) assert.match(read(file),/setLoading\(false\)|setImageLoading\(false\)/);});
