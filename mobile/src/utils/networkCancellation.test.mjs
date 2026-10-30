import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchWithTimeout,normalizeApiError} from './network.mjs';
const abortable = (_, {signal}) => new Promise((resolve,reject) => {
  signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'),{name:'AbortError'})), {once:true});
});
test('upstream cancellation propagates as CANCELLED', async () => {
  const controller=new AbortController();
  const task=fetchWithTimeout('https://example.com',{signal:controller.signal},500,abortable);
  controller.abort();
  await assert.rejects(task,e=>e.code==='CANCELLED');
});
test('already aborted requests never start', async () => {
  const controller=new AbortController();controller.abort();let called=false;
  await assert.rejects(fetchWithTimeout('https://example.com',{signal:controller.signal},100,()=>{called=true;}),e=>e.code==='CANCELLED');
  assert.equal(called,false);
});
test('timeout remains distinct from user cancellation',async()=>{
  await assert.rejects(fetchWithTimeout('https://example.com',{},5,abortable),e=>e.code==='TIMEOUT');
});
test('cancellation message is localized',()=>{
  assert.match(normalizeApiError({code:'CANCELLED'},'en'),/cancelled/i);
  assert.match(normalizeApiError({code:'CANCELLED'},'fa'),/لغو/);
});
