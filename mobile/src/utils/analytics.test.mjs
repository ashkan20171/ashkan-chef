import test from 'node:test';
import assert from 'node:assert/strict';
import {selectRecentMonths,chartSummary,ratingLabel} from './analytics.js';
test('only allowed time windows are used',()=>assert.equal(selectRecentMonths(Array.from({length:12},(_,i)=>({month:i+1,count:i})),3).length,3));
test('invalid window falls back to twelve',()=>assert.equal(selectRecentMonths(Array.from({length:12},(_,i)=>({month:i+1,count:i})),9).length,12));
test('empty charts are safe',()=>assert.deepEqual(chartSummary(null),{months:[],total:0,peak:1}));
test('negative and invalid counts are sanitized',()=>assert.deepEqual(selectRecentMonths([{count:-4},{count:'oops'},{count:2}],3).map(x=>x.count),[0,0,2]));
test('chart totals and peak are correct',()=>{const result=chartSummary([{count:2},{count:5},{count:3}],3);assert.equal(result.total,10);assert.equal(result.peak,5)});
test('zero rating is displayed, missing rating is not',()=>{assert.equal(ratingLabel(0),'0.0');assert.equal(ratingLabel(null),'—');assert.equal(ratingLabel(4.56),'4.6')});
