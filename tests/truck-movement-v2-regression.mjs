import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as N from '../vendor/nexusengine.mjs';
import { createLongHaulProductKits } from '../src/game/product-kits.mjs';
import { createTruckSpringMassState, advanceTruckSpringMass, springBodyState } from '../src/game/truck-spring-mass.mjs';
import { DEFAULT_TRUCK_DYNAMICS_PROFILE } from '../src/game/truck-dynamics-profile-kit.mjs';
assert.equal(createHash('sha256').update(readFileSync(new URL('../src/game/truck-kit.mjs',import.meta.url))).digest('hex'),'2302d88ab6707a6dd67ed203c6d44b339615d410e5d2bece8284fe447f5b69bc','V1 source must remain byte-identical');
const ground = { groundHeight: 0, groundNormal: {x:0,y:1,z:0}, surface: 'road',surfaceGrip:1,roadMaterial:'paved'};
const v2 = createLongHaulProductKits(N);
const v1 = createLongHaulProductKits(N,{movementVersion:'v1'});
assert.ok(v2.kits.some(k=>k.id==='long-haul-truck-movement-v2-kit'));
assert.ok(!v2.kits.some(k=>k.id==='long-haul-truck-kit'));
assert.ok(v1.kits.some(k=>k.id==='long-haul-truck-kit'));
assert.ok(!v1.kits.some(k=>k.id==='long-haul-truck-movement-v2-kit'));
assert.equal(v1.kits.length,v2.kits.length,'a single authoritative truck owner');
assert.throws(()=>createLongHaulProductKits(N,{movementVersion:'unknown'}),/Unknown movement/);
function rig(speed=22,version='v2',cargo=null){
 const product=createLongHaulProductKits(N,{movementVersion:version});
 const engine=N.createEngine({kits:product.kits,tick:{maxDelta:1/15}});
 engine.world.__longHaulScene='driving';
 const api=engine.n.longHaulTruck;
 api.teleport({x:0,y:.92,z:0,heading:0,speed,...ground});engine.tick(0);
 if(cargo){api.setCargo(cargo)}
 const frame=(input={},dt=1/60)=>{api.input({...ground,...input});engine.tick(dt);return api.getState()};
 const drive=(n,input={},dt=1/60)=>{let st;for(let i=0;i<n;i++)st=frame(input,dt);return st};
 return {api,engine,frame,drive};
}
const mass={effectiveMass:11000,centerOfMassHeight:1.5};
let state=createTruckSpringMassState(),energy=0,peak=0;
for(let i=0;i<60;i++){
 const s=advanceTruckSpringMass(state,{x:6,y:0,z:-8},mass,1/120);
 state=s;peak=Math.max(peak,Math.abs(s.displacement.x));energy=s.energy;
}
assert.ok(state.displacement.x<-.01 && state.displacement.z>.01,'acceleration lags spring mass in opposite direction');
assert.ok(peak<0.9&&Number.isFinite(energy));
let lastEnergy=energy;
for(let i=0;i<220;i++){
 const s=advanceTruckSpringMass(state,{x:0,y:0,z:0},mass,1/120);
 assert.ok(s.energy<=lastEnergy+1e-6,'undriven spring dissipates mechanical energy');
 state=s;lastEnergy=s.energy;
}
assert.ok(Math.abs(state.displacement.x)<.0002 && Math.abs(state.displacement.z)<.0002,'spring settles without sustained wobble');
// The spring has fixed physical tension: more mass increases compliant
// displacement under the same inertial force, unlike the V1 cosmetic roll.
function forceResponse(massKg){
 let current=createTruckSpringMassState();
 for(let i=0;i<120;i++)current=advanceTruckSpringMass(current,{x:6,y:0,z:0},{effectiveMass:massKg},1/120);
 return Math.abs(current.displacement.x);
}
assert.ok(forceResponse(14000)>forceResponse(7800)*1.3,'more cargo increases spring displacement under equal acceleration');
const leanState={rollAngle:0,rolloverExposure:0,tipped:false};
const deflected={...createTruckSpringMassState(),displacement:{x:-0.08,y:0,z:0}};
function responseAtCenterOfMass(height){return springBodyState(leanState,deflected,{x:7,y:0,z:0},{effectiveMass:12000,centerOfMassHeight:height},DEFAULT_TRUCK_DYNAMICS_PROFILE,true,24,1/120)}
const lowCargo=responseAtCenterOfMass(1.2),topHeavy=responseAtCenterOfMass(2.5);
assert.ok(Math.abs(topHeavy.rollAngle)>Math.abs(lowCargo.rollAngle),'higher cargo COM increases actual chassis lean');
assert.ok(topHeavy.rolloverRisk>lowCargo.rolloverRisk,'higher cargo COM increases rollover moment');

function maneuver(n,input,speed=24,cargo=null){const t=rig(speed,'v2',cargo);return t.drive(n,input)}
const straight=maneuver(180,{throttle:1},12),turnR=maneuver(70,{throttle:1,steer:0.28},24),turnL=maneuver(70,{throttle:1,steer:-0.28},24);
console.log('v2 baseline',JSON.stringify({straight:{spring:straight.springMass,bodyRoll:straight.bodyRoll},turnR:{roll:turnR.bodyRoll,spring:turnR.springMass?.displacement,tipped:turnR.tipped,risk:turnR.rolloverRisk,velocity:turnR.speed},turnL:{roll:turnL.bodyRoll,spring:turnL.springMass?.displacement,tipped:turnL.tipped}}));
assert.equal(straight.movementVersion,'v2');
assert.ok(Number.isFinite(turnR.bodyRoll)&&Number.isFinite(turnL.bodyRoll));
assert.ok(!turnR.tipped&&!turnL.tipped,'ordinary cornering must remain recoverable');
assert.ok(turnR.bodyRoll*turnL.bodyRoll<0,'opposed corners lean in opposing physical directions');
assert.ok(turnR.springMass.displacement.x*turnL.springMass.displacement.x<0,'spring follows lateral acceleration not steering animation');
const dangerous=maneuver(80,{throttle:1,steer:1},32); assert.ok(dangerous.tipped,'unbraked high-speed full-lock can roll');
const brake=maneuver(60,{brake:1},30);assert.ok(brake.springMass.displacement.z>0,'braking moves mass forward');
const accel=rig(0);const accelState=accel.drive(90,{throttle:1});assert.ok(accelState.springMass.displacement.z<0,'acceleration moves mass rearward');
const drift=rig(30),driftSlide=drift.drive(45,{brake:1,steer:1});assert.ok(driftSlide.drift.active,'drift remains available');
let driftExit=drift.drive(120,{steer:-1});assert.ok(driftExit.drift.releaseSequence>=1,'countersteer release survives V2');
const loaded=rig(24,'v2','unstable');const loadedTurn=loaded.drive(50,{throttle:1,steer:0.8});assert.ok(Math.abs(loadedTurn.cargoShift)>0,'unsecured load shift from one spring');
const secured=rig(24,'v2','heavy');assert.ok(Math.abs(secured.drive(50,{throttle:1,steer:0.8}).cargoShift)<1e-12,'secured heavy freight never invents a second moving mass');
const migratedSource=rig(24,'v1'); assert.ok(!migratedSource.drive(5,{steer:.2}).springMass,'V1 remains unchanged');
const snap=drift.api.snapshot();const restore=rig(1);restore.api.loadSnapshot(snap);assert.deepEqual(restore.api.getState().springMass,snap.springMass,'V2 save restores internal spring state');
const migrated=rig(1);const old=rig(12,'v1');old.drive(60,{throttle:1,steer:.3});migrated.api.loadSnapshot(old.api.snapshot());assert.deepEqual(migrated.api.getState().springMass,createTruckSpringMassState(),'V1 save loads with neutral new spring');
const beforePause=drift.api.snapshot();drift.engine.world.__longHaulScene='pause';drift.frame({steer:1});assert.deepEqual(drift.api.getState().springMass,beforePause.springMass,'pause freezes spring');
drift.engine.world.__longHaulScene='driving';drift.api.teleport({x:0,y:.92,z:0,heading:0,speed:0,...ground});drift.engine.tick(0);assert.deepEqual(drift.api.getState().springMass,createTruckSpringMassState(),'roadside recovery resets spring');
console.log('Movement V2 regression passed: spring passivity, turning, acceleration, braking, drift/countersteer, saved cargo state, V1 rollback/migration and pause/recovery.');
