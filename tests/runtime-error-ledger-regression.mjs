import test from 'node:test';
import assert from 'node:assert/strict';
import {createRuntimeErrorLedger,installLongHaulErrorLedger} from '../src/game/runtime-error-ledger.mjs';
test('repeated exception count is retained without unbounded records',()=>{
 const l=createRuntimeErrorLedger(3);
 for(let i=0;i<10;i++)l.record('error','repeated','app.js',7,9);
 assert.equal(l.getState().total,10);assert.equal(l.getState().distinct,1);assert.equal(l.getState().records[0].count,10);
 for(let i=0;i<10;i++)l.record('error',`new-${i}`);
 assert.equal(l.getState().distinct,3);
});
test('installation only observes errors and never prevents defaults',()=>{
 const handlers=new Map();const host={addEventListener:(name,fn)=>handlers.set(name,fn)};
 const ledger=installLongHaulErrorLedger(host);
 assert.equal(installLongHaulErrorLedger(host),ledger);
 handlers.get('error')({message:'Something failed',filename:'game.js',lineno:14,colno:2});
 handlers.get('unhandledrejection')({reason:Error('Promise failed')});
 assert.equal(ledger.getState().total,2);
 assert.equal(ledger.getState().records[0].source,'game.js');
});
