import test from 'node:test';
import assert from 'node:assert/strict';
import {formatAnalyticsCount,chartEmptyMessage,getChartAccessibilitySummary} from './analyticsDisplay.mjs';
test('English chart count is grouped',()=>assert.equal(formatAnalyticsCount(12345,'en'),'12,345'));
test('Persian chart count uses Persian digits',()=>assert.equal(formatAnalyticsCount(12,'fa'),'۱۲'));
test('Invalid and negative chart counts are safe',()=>{assert.equal(formatAnalyticsCount(-3,'en'),'0');assert.equal(formatAnalyticsCount(NaN,'en'),'0')});
test('Empty chart message is localized',()=>{assert.match(chartEmptyMessage('fa'),/فعالیتی/);assert.match(chartEmptyMessage('en'),/No activity/)});
test('Accessible chart total is computed',()=>assert.equal(getChartAccessibilitySummary([{count:3},{count:2}], 'en'),'Total activities: 5'));
