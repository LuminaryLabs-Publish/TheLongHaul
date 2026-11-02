import assert from 'node:assert/strict';
import { createArcadeScore } from '../src/game/arcade-score.mjs';
const tick=(s,n)=>{for(let t=0;t<n-1e-8;t+=.05)s.tick(Math.min(.05,n-t));};
const route=(id,extra={})=>({id,kind:'loading-route',route:'risky',speed:20,distance:260,clean:true,forward:true,...extra});
const pass=id=>({id,kind:'near-miss',speed:22,clearance:.7});
const s=createArcadeScore();s.beginLeg(1);
for(const bad of [{route:'safe'},{distance:209},{speed:8.9},{clean:false},{forward:false}])assert.equal(s.event(route('invalid',bad)).accepted,false);
const win=s.event(route('first'));assert.equal(win.accepted,true);assert.equal(win.multiplier,2);assert.equal(win.points,440);
tick(s,.2);assert.equal(s.event(route('first')).reason,'duplicate');assert.equal(s.beginLeg(1),false);
assert.equal(s.offerRecovery('contract-one'),true);assert.equal(s.offerRecovery('contract-one'),false);tick(s,5);assert.equal(s.snapshot().multiplier,1);
const rescued=s.event(route('second',{recovery:true,contractId:'contract-one'}));assert.equal(rescued.multiplier,3);assert.equal(s.snapshot().recovery,null);
tick(s,.2);assert.equal(s.offerRecovery('contract-one'),false);
s.beginLeg(2);s.crash();tick(s,2);s.event(pass('a'));tick(s,.2);s.event(pass('b'));assert.equal(s.offerRecovery('two'),true);s.crash();assert.equal(s.snapshot().recovery,null);
tick(s,2);assert.equal(s.event(route('no-rescue',{recovery:true,contractId:'two'})).multiplier,2);
s.beginLeg(3);assert.equal(s.snapshot().seenIds,0);s.bank();tick(s,.2);s.event(route('third'));assert.equal(s.offerRecovery('three'),true);const before=s.snapshot().recovery.remaining;s.tick(20,{active:false});assert.equal(s.snapshot().recovery.remaining,before);s.tick(0,{active:true});tick(s,49);assert.equal(s.snapshot().recovery,null);
const earned=s.snapshot().banked;assert.ok(earned>0);assert.equal(s.restoreBanked(earned,3),true);assert.equal(s.snapshot().banked,earned);assert.equal(s.snapshot().pending,0);assert.equal(s.restoreBanked(Infinity),false);
for(let leg=4;leg<200;leg++){assert.equal(s.beginLeg(leg),true);tick(s,.2);assert.equal(s.event(route(`line-${leg}`)).accepted,true);assert.ok(s.snapshot().seenIds<=1)}
console.log('freight score regression: passed (full-route eligibility, one rescue, crash/timeout, monotonic bounded legs, banked restore)');
