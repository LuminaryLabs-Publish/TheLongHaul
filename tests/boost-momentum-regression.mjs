import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import { createLongHaulProductKits } from '../src/game/product-kits.mjs';
import { DEFAULT_TRUCK_DYNAMICS_PROFILE } from '../src/game/truck-dynamics-profile-kit.mjs';

// TLH-004: the shipped movement V2, not the byte-frozen V1 rollback kit.
const ground={groundHeight:0,groundNormal:{x:0,y:1,z:0},surface:'road',surfaceGrip:1,roadMaterial:'paved'};
function rig(version='v2') {
  const product=createLongHaulProductKits(N,{movementVersion:version});
  const engine=N.createEngine({kits:product.kits,tick:{maxDelta:1/15}});
  engine.world.__longHaulScene='driving';
  const api=engine.n.longHaulTruck;
  api.teleport({x:0,y:.92,z:0,heading:0,speed:0,...ground});engine.tick(0);
  const drive=(seconds,inputs={},dt=1/60)=>{
    for(let i=0;i<Math.round(seconds/dt);i++) { api.input({...ground,...inputs}); engine.tick(dt); }
    return api.getState();
  };
  return {api,engine,drive,state:()=>api.getState()};
}
const base=DEFAULT_TRUCK_DYNAMICS_PROFILE.maximumForwardSpeed;
const regular=rig(),momentum=rig();
regular.drive(12,{throttle:1});
momentum.drive(2,{throttle:1});
const accelerated=momentum.drive(4,{throttle:1,boost:true,rush:true});
assert.ok(accelerated.speed>base*1.6,'burst can earn substantially more speed than normal throttle');
assert.ok(accelerated.boostCruiseSpeed>base*1.6,'boosted speed is stored only by active boost');
const held=momentum.drive(6,{throttle:1});
assert.ok(held.speed>=accelerated.speed-.1,'holding throttle maintains boosted speed after the burst expires');
assert.ok(held.speed<=base*2.2+.01,'sustained boost momentum remains capped');
assert.ok(held.speed>regular.state().speed*1.5,'regular throttle alone cannot reach the same speed');
const coast=momentum.drive(3,{throttle:0});
assert.equal(coast.boostCruiseSpeed,0,'releasing throttle immediately releases the cruise reserve');
assert.ok(coast.speed<held.speed-3,'coasting loses speed through actual resistive forces');
assert.ok(coast.speed>held.speed*.7,'coasting does not trigger an artificial speed-cap snap');
const braked=momentum.drive(1,{brake:1});
assert.ok(braked.speed<coast.speed-7,'ordinary brakes meaningfully reduce retained speed');
assert.equal(braked.boostCruiseSpeed,0,'braking cannot restore earned boost speed');
const afterBrake=momentum.drive(2,{throttle:1});
assert.ok(afterBrake.speed<=braked.speed+.05,'normal throttle cannot re-create lost boost speed after braking');

const impact=rig();impact.drive(2,{throttle:1});impact.drive(4,{throttle:1,boost:true,rush:true});
assert.ok(impact.state().boostCruiseSpeed>base);
impact.api.impulse({kind:'traffic',speedDelta:-15});impact.engine.tick(0);
assert.equal(impact.state().boostCruiseSpeed,0,'an impact clears cruise reserve so it cannot undo the collision');

function steeringAt(speed){const r=rig();r.api.teleport({x:0,y:.92,z:0,heading:0,speed,...ground});r.engine.tick(0);return r.drive(.25,{throttle:1,steer:.4});}
const steeringNormal=steeringAt(28),steeringFast=steeringAt(52);
assert.ok(Math.abs(steeringFast.steeringAngle)<Math.abs(steeringNormal.steeringAngle)*.75,
  'beyond normal speed, wheel angle/steering authority falls and turns widen');
assert.ok(Math.abs(steeringFast.steeringAngle)>.02,'the driver retains some steering control');

const paused=rig();paused.drive(2,{throttle:1});paused.drive(4,{throttle:1,boost:true,rush:true});
const state=paused.state();paused.engine.world.__longHaulScene='paused';paused.drive(1,{throttle:0,brake:1});
assert.equal(paused.state().boostCruiseSpeed,state.boostCruiseSpeed,'pause preserves momentum state');
assert.equal(paused.state().speed,state.speed,'pause never advances motion');
paused.engine.world.__longHaulScene='driving';paused.api.teleport({x:0,y:.92,z:0,heading:0,speed:0,...ground});paused.engine.tick(0);
assert.equal(paused.state().boostCruiseSpeed,0,'roadside recovery clears the reserve');

const sixty=rig(),thirty=rig();
for(const r of [sixty,thirty])r.drive(2,{throttle:1});
sixty.drive(4,{throttle:1,boost:true,rush:true},1/60);
thirty.drive(4,{throttle:1,boost:true,rush:true},1/30);
sixty.drive(4,{throttle:1},1/60);
thirty.drive(4,{throttle:1},1/30);
assert.ok(Math.abs(sixty.state().speed-thirty.state().speed)<.15,'boost retention remains frame-rate invariant');
const v1=rig('v1');assert.equal(v1.state().boostCruiseSpeed,undefined,'legacy V1 remains byte-identical and isolated');
console.log(JSON.stringify({status:'PASS',baseSpeed:regular.state().speed,boostSpeed:accelerated.speed,sustainedSpeed:held.speed,coastSpeed:coast.speed,brakedSpeed:braked.speed,steeringNormal:steeringNormal.steeringAngle,steeringFast:steeringFast.steeringAngle,scope:'TLH-004 persistent boost, throttle, coast, braking, impact, steering, pause and V1 isolation'}));
