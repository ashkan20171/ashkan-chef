import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyConnection, connectionMessage } from './offlineConnection.mjs';

test('connection is offline if either network signal is explicitly false', () => {
  assert.equal(classifyConnection({isConnected:false,isInternetReachable:true}), 'offline');
  assert.equal(classifyConnection({isConnected:true,isInternetReachable:false}), 'offline');
});

test('connection is online only when both signals are true', () => {
  assert.equal(classifyConnection({isConnected:true,isInternetReachable:true}), 'online');
});

test('missing or partial network signals remain unknown', () => {
  assert.equal(classifyConnection({}), 'unknown');
  assert.equal(classifyConnection({isConnected:true,isInternetReachable:null}), 'unknown');
});

test('connection messages are localized and safe for unknown states', () => {
  assert.match(connectionMessage('offline','fa').title, /آفلاین/);
  assert.equal(connectionMessage('online','en').title, 'Internet connected');
  assert.equal(connectionMessage('unexpected','en').title, 'Connection status unknown');
  assert.ok(connectionMessage('offline','fa').detail.length > 10);
});
