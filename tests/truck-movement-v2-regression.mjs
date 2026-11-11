import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as N from '../vendor/nexusengine.mjs';
import { createLongHaulProductKits } from '../src/game/product-kits.mjs';
import { resolveTruckTireForces } from '../src/game/truck-tire-forces.mjs';
import { createTruckSpringMassState, advanceTruckSpringMass } from '../src/game/truck-spring-mass.mjs';
import { DEFAULT_TRUCK_DYNAMICS_PROFILE } from '../src/game/truck-dynamics-profile-kit.mjs';
import { createReactiveBodyState, advanceReactiveBody, chassisHeading } from '../src/game/truck-reactive-body.mjs';
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
// A single box collider/spring system responds to actual acceleration and COM.
function responseAtCenterOfMass(height, ax=6, count=160){
 const load={effectiveMass:12000,centerOfMassHeight:height};
 let spring=createTruckSpringMassState(),body=createReactiveBodyState({},height),result;
 for(let i=0;i<count;i++){
  spring=advanceTruckSpringMass(spring,{x:ax,y:0,z:0},load,1/120,DEFAULT_TRUCK_DYNAMICS_PROFILE.springMass);
  result=advanceReactiveBody(body,spring,{x:ax,y:0,z:0},load,DEFAULT_TRUCK_DYNAMICS_PROFILE,1/120,true);
  body=result.body;
 }
 return result;
}
const lowCargo=responseAtCenterOfMass(1.2),topHeavy=responseAtCenterOfMass(2.1);
assert.ok(Math.abs(topHeavy.rollAngle)>Math.abs(lowCargo.rollAngle)*1.35,'higher cargo COM increases physically integrated lean');
assert.ok(lowCargo.contactLoads.left>lowCargo.contactLoads.right,'corner contact normals, not roll flags, carry transferred weight');
assert.ok(Number.isFinite(topHeavy.body.centerY),'box carries finite vertical contact state');
const upright=createReactiveBodyState(),side=createReactiveBodyState({quaternion:{x:0,y:0,z:1,w:0}});
const noDrive={x:0,y:0,z:0},neutral=createTruckSpringMassState();
assert.equal(advanceReactiveBody(upright,neutral,noDrive,mass,DEFAULT_TRUCK_DYNAMICS_PROFILE,1/120).tipped,false);
assert.equal(advanceReactiveBody(side,neutral,noDrive,mass,DEFAULT_TRUCK_DYNAMICS_PROFILE,1/120).tipped,true);
// Forcing a high lateral g creates a real fall; never a one-tick posture jump.
let physics=createReactiveBodyState({},1.8),counterweight=createTruckSpringMassState();let firstTip=-1,maxQuaternionStep=0,previousQ=physics.quaternion,peakAngularSpeed=0;
for(let i=0;i<520;i++){
 const a=i<360?10:0,load={effectiveMass:12000,centerOfMassHeight:1.8};
 counterweight=advanceTruckSpringMass(counterweight,{x:a,y:0,z:0},load,1/120,DEFAULT_TRUCK_DYNAMICS_PROFILE.springMass);
 const result=advanceReactiveBody(physics,counterweight,{x:a,y:0,z:0},load,DEFAULT_TRUCK_DYNAMICS_PROFILE,1/120);
 const q=result.body.quaternion,dot=Math.abs(q.x*previousQ.x+q.y*previousQ.y+q.z*previousQ.z+q.w*previousQ.w);
 maxQuaternionStep=Math.max(maxQuaternionStep,2*Math.acos(Math.min(1,dot)));
 if(firstTip<0&&result.tipped)firstTip=i/120;
 peakAngularSpeed=Math.max(peakAngularSpeed,Math.abs(result.body.angularVelocity.z));
 previousQ=q;physics=result.body;
}
assert.ok(firstTip>0.35&&firstTip<4,'box genuinely falls after accumulating torque over time');
assert.ok(peakAngularSpeed>0.3,'box accumulates rotational velocity');
assert.ok(maxQuaternionStep<0.06,'no visible quaternion discontinuity while tipping');

function maneuver(n,input,speed=24,cargo=null){const t=rig(speed,'v2',cargo);return t.drive(n,input)}
const straight=maneuver(180,{throttle:1},12),turnR=maneuver(70,{throttle:1,steer:0.28},24),turnL=maneuver(70,{throttle:1,steer:-0.28},24);
console.log('v2 baseline',JSON.stringify({straight:{spring:straight.springMass,bodyRoll:straight.bodyRoll},turnR:{roll:turnR.bodyRoll,spring:turnR.springMass?.displacement,tipped:turnR.tipped,risk:turnR.rolloverRisk,velocity:turnR.speed},turnL:{roll:turnL.bodyRoll,spring:turnL.springMass?.displacement,tipped:turnL.tipped}}));
assert.equal(straight.movementVersion,'v2');
assert.ok(Number.isFinite(turnR.bodyRoll)&&Number.isFinite(turnL.bodyRoll));
assert.ok(!turnR.tipped&&!turnL.tipped,'ordinary cornering must remain recoverable');
assert.ok(turnR.bodyRoll*turnL.bodyRoll<0,'opposed corners lean in opposing physical directions');
assert.ok(turnR.springMass.displacement.x*turnL.springMass.displacement.x<0,'spring follows lateral acceleration not steering animation');
const dangerous=maneuver(80,{throttle:1,steer:1},32); assert.ok(!dangerous.tipped,'ordinary tires can slide rather than forcing rollover');
const brake=maneuver(60,{brake:1},30);assert.ok(brake.springMass.displacement.z>0,'braking moves mass forward');
const accel=rig(0);const accelState=accel.drive(90,{throttle:1});assert.ok(accelState.springMass.displacement.z<0,'acceleration moves mass rearward');
const drift=rig(30),driftSlide=drift.drive(45,{brake:1,steer:1});assert.ok(driftSlide.drift.active,'drift remains available');
let driftExit=drift.drive(120,{steer:-1});assert.ok(driftExit.drift.releaseSequence>=1,'countersteer release survives V2');
const loaded=rig(24,'v2','unstable');const loadedTurn=loaded.drive(50,{throttle:1,steer:0.8});assert.ok(Math.abs(loadedTurn.cargoShift)>0,'unsecured load shift from one spring');
const secured=rig(24,'v2','heavy');assert.ok(Math.abs(secured.drive(50,{throttle:1,steer:0.8}).cargoShift)<1e-12,'secured heavy freight never invents a second moving mass');
const migratedSource=rig(24,'v1'); assert.ok(!migratedSource.drive(5,{steer:.2}).springMass,'V1 remains unchanged');
const snap=drift.api.snapshot();const restore=rig(1);restore.api.loadSnapshot(snap);assert.deepEqual(restore.api.getState().springMass,snap.springMass,'V2 save restores internal spring state');assert.deepEqual(restore.api.getState().reactiveBody,snap.reactiveBody,'V2 save restores rigid body orientation and inertia');
const migrated=rig(1);const old=rig(12,'v1');old.drive(60,{throttle:1,steer:.3});migrated.api.loadSnapshot(old.api.snapshot());assert.deepEqual(migrated.api.getState().springMass,createTruckSpringMassState(),'V1 save loads with neutral new spring');assert.ok(Math.abs(chassisHeading(migrated.api.getState().reactiveBody.quaternion) - old.api.getState().heading) < 1e-8, 'V1 save preserves the truck heading inside its world-space body orientation');
const beforePause=drift.api.snapshot();drift.engine.world.__longHaulScene='pause';drift.frame({steer:1});assert.deepEqual(drift.api.getState().springMass,beforePause.springMass,'pause freezes spring');assert.deepEqual(drift.api.getState().reactiveBody,beforePause.reactiveBody,'pause freezes box orientation');
drift.engine.world.__longHaulScene='driving';drift.api.teleport({x:0,y:.92,z:0,heading:0,speed:0,...ground});drift.engine.tick(0);assert.deepEqual(drift.api.getState().springMass,createTruckSpringMassState(),'roadside recovery resets spring');assert.equal(drift.api.getState().reactiveBody.quaternion.w,1,'roadside recovery restores orientation');
console.log('Movement V2 regression passed: box contacts, angular continuity, spring passivity, tire grip, braking, drift, cargo, V1 rollback, migration, pause and recovery.');

// The commanded wheel angle is a contact orientation, not a yaw target.
// Forces at the front/rear axles determine both translation and yaw.
const tireLoad = { effectiveMass: 7800, gripScale: 1 };
const flatContact = { grounded: true, traction: 1, surfaceGrip: 1, springDisplacementZ: 0 };
const initialRight = resolveTruckTireForces({ longitudinal: 30, lateral: 0, yawRate: 0, steeringAngle: 0.15 }, tireLoad, DEFAULT_TRUCK_DYNAMICS_PROFILE, flatContact);
const initialLeft = resolveTruckTireForces({ longitudinal: 30, lateral: 0, yawRate: 0, steeringAngle: -0.15 }, tireLoad, DEFAULT_TRUCK_DYNAMICS_PROFILE, flatContact);
assert.ok(initialRight.frontForce > 0 && initialRight.yawAcceleration > 0, 'right front tire generates a rightward force and yaw torque');
assert.ok(initialLeft.frontForce < 0 && initialLeft.yawAcceleration < 0, 'left front tire generates the opposite force and yaw torque');
assert.ok(Math.abs(initialLeft.yawAcceleration + initialRight.yawAcceleration) < 1e-9, 'tire impulses are left/right symmetric');
const noContact = resolveTruckTireForces({ longitudinal: 30, lateral: 0, yawRate: 0, steeringAngle: 0.4 }, tireLoad, DEFAULT_TRUCK_DYNAMICS_PROFILE, { ...flatContact, grounded: false });
assert.equal(noContact.yawAcceleration, 0, 'airborne steering cannot generate tire-induced yaw');
assert.equal(noContact.lateralAcceleration, 0, 'airborne steering cannot generate lateral tire thrust');
const rearNormal = resolveTruckTireForces({ longitudinal: 22, lateral: 4, yawRate: 0, steeringAngle: 0 }, tireLoad, DEFAULT_TRUCK_DYNAMICS_PROFILE, flatContact);
const rearDrifting = resolveTruckTireForces({ longitudinal: 22, lateral: 4, yawRate: 0, steeringAngle: 0 }, tireLoad, DEFAULT_TRUCK_DYNAMICS_PROFILE, { ...flatContact, driftActive: true });
assert.ok(Math.abs(rearDrifting.rearForce) < Math.abs(rearNormal.rearForce), 'intentional drift reduces rear, not all, tire grip');
assert.equal(rearDrifting.frontForce, rearNormal.frontForce, 'front steering authority stays available during a drift');
const betterTires = resolveTruckTireForces({ longitudinal: 30, lateral: 0, yawRate: 0, steeringAngle: 0.15 }, tireLoad,
  { ...DEFAULT_TRUCK_DYNAMICS_PROFILE, grip: { ...DEFAULT_TRUCK_DYNAMICS_PROFILE.grip, road: 8 } }, flatContact);
assert.ok(betterTires.frontForce > initialRight.frontForce, 'garage tire upgrade changes real tire force rather than cosmetic steering');
const poorRoad = resolveTruckTireForces({ longitudinal: 30, lateral: 0, yawRate: 0, steeringAngle: 0.15 }, tireLoad, DEFAULT_TRUCK_DYNAMICS_PROFILE, { ...flatContact, surfaceGrip: 0.38 });
assert.ok(Math.abs(poorRoad.frontForce) < Math.abs(initialRight.frontForce) * .5, 'low-traction terrain cannot match paved-road cornering force');
function turnAtSpeed(speed, steer) {
  const vehicle = rig(speed);
  return vehicle.drive(60, { steer, throttle: 0 });
}
const partialTurn = turnAtSpeed(30, .6), fullTurn = turnAtSpeed(30, 1), reverseTurn = turnAtSpeed(30, -.6);
assert.ok(fullTurn.steeringAngle > partialTurn.steeringAngle * 1.5, 'higher steering input visibly turns front wheels farther');
assert.ok(fullTurn.yawRate > partialTurn.yawRate + .01, 'more steering makes greater physically generated yaw, not identical cap');
assert.ok(fullTurn.heading > partialTurn.heading + .02, 'greater steering affects actual chassis direction');
assert.ok(Math.abs(fullTurn.lateralSpeed) > Math.abs(partialTurn.lateralSpeed) * 1.1, 'excess high-speed steering yields more slip');
assert.ok(partialTurn.heading > .1 && reverseTurn.heading < -.1, 'opposite tire forces turn in opposite directions');
assert.ok(!partialTurn.tipped && !fullTurn.tipped, 'ordinary paved high-speed turns remain recoverable');
const cautiousTurn = turnAtSpeed(12, .6);
assert.ok(Math.abs(cautiousTurn.lateralSpeed) < Math.abs(partialTurn.lateralSpeed) * .5, 'moderate-speed turning sticks to the road instead of skating');
const airborneSteering = rig(10);
airborneSteering.api.teleport({ x: 0, y: 8, z: 0, speed: 10, heading: 0, grounded: false, verticalSpeed: 0, ...ground });
airborneSteering.engine.tick(0);
const airborneSteered = airborneSteering.drive(12, { steer: 1 });
assert.ok(Math.abs(airborneSteered.steeringAngle) > .05 && !airborneSteered.grounded, 'driver can turn visible wheels even without traction');
// The same substep-based tire force integration must not change with render FPS.
const lowFrame = rig(30), highFrame = rig(30);
const thirtyHz = lowFrame.drive(30, { steer: 0.6 }, 1 / 30);
const oneTwentyHz = highFrame.drive(120, { steer: 0.6 }, 1 / 120);
assert.ok(Math.abs(thirtyHz.heading - oneTwentyHz.heading) < 1e-8, 'steering uses fixed simulation substeps across 30/120 FPS');
assert.ok(Math.abs(thirtyHz.lateralSpeed - oneTwentyHz.lateralSpeed) < 1e-8, 'side slip remains stable across frame rates');
console.log('Movement V2 two-axle tire regression passed: wheel direction, force/moment, friction limits, slip, drift, independent airborne wheel steering.');
