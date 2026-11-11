import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import * as THREE from '../vendor/three.module.js';
import {createVehicleCollider,LONG_HAUL_TRUCK_COLLIDER,ARCADE_TRAFFIC_COLLIDERS} from '../src/game/vehicle-collider.mjs';
import {sweptVehicleImpact,createImpactKit,createImpactClock,resolveImpactResponse} from '../src/game/impact-kit.mjs';
import {createComicCrashKits,createDestructibleVehicleKit} from '../src/game/destructible-vehicle-kit.mjs';
import {createTrafficVehicleFactory,TRAFFIC_FLEET_SOURCE} from '../src/game/traffic-vehicle-authoring.mjs';
const collider=(x,z,y=0,heading=0,dimensions=LONG_HAUL_TRUCK_COLLIDER)=>createVehicleCollider({x,y,z},heading,dimensions);
const car=(x,z,y=0,heading=0)=>collider(x,z,y,heading,ARCADE_TRAFFIC_COLLIDERS[0]);
// Swept contact catches a car even with no endpoint overlap; height uses TOI.
const hit=sweptVehicleImpact(collider(0,-20),collider(0,20),car(0,0),car(0,0));
assert.ok(hit&&hit.time>0&&hit.time<1);assert.equal(hit.normal.z,-1);
assert.equal(sweptVehicleImpact(collider(0,-20,15),collider(0,20,15),car(0,0),car(0,0)),null);
assert.equal(sweptVehicleImpact(collider(8,-20),collider(8,20),car(0,0),car(0,0)),null);
for(const heading of [0,.3,1.2,Math.PI]){
 const c=collider(0,0,0,heading);assert.ok(sweptVehicleImpact(c,c,car(0,0),car(0,0)));
}
const makeEvent=(side=1,mass=6500)=>({id:'one',targetId:'car',heading:0,effectiveMass:mass,targetMass:1400,closingSpeed:24,normal:{x:side*.6,z:-.8},contactOffset:{x:side*1.4,z:3}});
const right=resolveImpactResponse(makeEvent()),left=resolveImpactResponse(makeEvent(-1));
assert.equal(right.hitStop,.2,'heavy impacts slow time for 0.2 seconds');
assert.equal(resolveImpactResponse({...makeEvent(),closingSpeed:8}).hitStop,.2,'solid impacts slow time for 0.2 seconds');
assert.ok(right.impulse.x>0&&left.impulse.x<0);assert.ok(right.impulse.headingDelta>0&&left.impulse.headingDelta<0);
assert.equal(right.impulse.x,-left.impulse.x);assert.equal(right.impulse.z,left.impulse.z);
assert.ok(resolveImpactResponse(makeEvent(1,14000)).impulse.x<right.impulse.x,'loaded mass reduces deflection');
const front=resolveImpactResponse({...makeEvent(),normal:{x:0,z:-1},contactOffset:{x:0,z:4}});assert.ok(Math.abs(front.impulse.headingDelta)<1e-9);assert.ok(front.impulse.z<0);
const rear=resolveImpactResponse({...makeEvent(),normal:{x:0,z:1},contactOffset:{x:0,z:-4}});assert.ok(rear.impulse.z>0);assert.ok(Math.abs(rear.impulse.headingDelta)<1e-9);
const model=createImpactKit(),truck={position:{x:0,y:0,z:-6},heading:0,velocity:{x:0,z:24},effectiveMass:6500};
model.beginFrame();const event=model.contact({targetId:'a',contact:hit,truck});assert.ok(event);assert.equal(model.contact({targetId:'a',contact:hit,truck}),null);model.endFrame();
model.beginFrame();assert.equal(model.contact({targetId:'a',contact:hit,truck}),null);model.endFrame();
model.beginFrame();model.endFrame();model.beginFrame();assert.ok(model.contact({targetId:'a',contact:hit,truck}),'separation permits fresh episode');model.endFrame();
model.beginFrame();assert.equal(model.contact({targetId:'away',contact:hit,truck:{...truck,velocity:{x:0,z:-24}}}),null,'separating contact produces no extra impact');model.endFrame();
const clock=createImpactClock();clock.request(.2);assert.equal(clock.remaining,.2);clock.advance(.1);assert.ok(Math.abs(clock.remaining-.1)<1e-9);clock.reset();clock.request(.09);let frozen=0;while(clock.advance(1/60))frozen++;assert.ok(frozen>=5&&frozen<=6);assert.equal(clock.remaining,0);clock.request(.09,0);assert.equal(clock.advance(.01),false);clock.request(.09,.5);assert.equal(clock.remaining,.045);clock.reset();assert.equal(clock.remaining,0);
assert.equal(sweptVehicleImpact({...collider(0,0),x:NaN},collider(0,0),car(0,0),car(0,0)),null);
assert.equal(model.contact({targetId:'invalid',contact:{...hit,normal:{x:NaN,z:0}},truck}),null);
const d=createDestructibleVehicleKit();d.register('car',0);const minor={...event,id:'minor',response:{targetDamage:1}};assert.equal(d.impact('car',minor).state,'damaged');assert.equal(d.impact('car',minor).applied,false);d.impact('car',{...minor,id:'two'});assert.equal(d.impact('car',minor).applied,false,'old duplicate rejected');assert.equal(d.impact('car',{...event,id:'heavy',response:{targetDamage:500}}).destroyed,true);assert.equal(d.impact('car',minor).applied,false);d.retire('car');assert.equal(d.get('car').state,'retired');d.remove('car');d.register('car');assert.equal(d.get('car').state,'intact');d.reset();assert.equal(d.snapshot().length,0);
const engine=N.createEngine({kits:createComicCrashKits(N)});assert.equal(engine.n.longHaulImpact.profile.truckId,'long-haul-truck');assert.equal(engine.n.longHaulDestructibles.register('source').state,'intact');
const gradient=new THREE.DataTexture(new Uint8Array([70,130,195,255]),4,1,THREE.RedFormat);gradient.needsUpdate=true;
const factory=createTrafficVehicleFactory({THREE,materials:{truckRed:{gradientMap:gradient}}});
for(const id of TRAFFIC_FLEET_SOURCE.vehicleIds){const parts=factory.createBreakup(id);assert.ok(parts.length>=6&&parts.length<=14,id);assert.ok(parts.some(p=>p.name.includes('wheel')),id+' wheels');assert.ok(parts.some(p=>p.name.includes('body')),id+' body');for(const part of parts){part.updateWorldMatrix(true,true);const b=new THREE.Box3().setFromObject(part);assert.ok([b.min.x,b.max.x,b.min.y,b.max.y].every(Number.isFinite));}const clone=factory.createBreakup(id);assert.notEqual(clone[0],parts[0]);}
console.log('PASS comic impacts: swept SAT, bridge separation, mirror/head/rear/mass, episodes, hit-stop bounds, duplicate/destruction/recycle, actual Nexus registration and all six authored breakup variants');
