import test from 'node:test';
import assert from 'node:assert/strict';
import {connectionStatus,connectionMessage} from './connectionStatus.mjs';
test('unknown on missing state',()=>assert.equal(connectionStatus(null),'unknown'));
test('offline on disconnected',()=>assert.equal(connectionStatus({isConnected:false,isInternetReachable:null}),'offline'));
test('offline on unreachable internet',()=>assert.equal(connectionStatus({isConnected:true,isInternetReachable:false}),'offline'));
test('online only when connected and reachable',()=>assert.equal(connectionStatus({isConnected:true,isInternetReachable:true}),'online'));
test('uncertain reachability remains unknown',()=>assert.equal(connectionStatus({isConnected:true,isInternetReachable:null}),'unknown'));
test('localized messages',()=>{assert.match(connectionMessage('offline','fa'),/اینترنت/);assert.match(connectionMessage('offline','en'),/offline/);});
