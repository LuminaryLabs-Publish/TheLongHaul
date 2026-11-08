import assert from 'node:assert/strict';
import {
  LONG_HAUL_TRUCK_COLLIDER, ARCADE_TRAFFIC_COLLIDERS, createVehicleCollider,
  vehicleCollidersOverlap, vehicleColliderOverlapsCircle, verticalContactOverlaps
} from '../src/game/vehicle-collider.mjs';

const truck = (y=0.92, heading=0) => createVehicleCollider({x:0,y,z:0},heading,LONG_HAUL_TRUCK_COLLIDER);
const car = (y=0, x=0, heading=0) => createVehicleCollider({x,y,z:0},heading,ARCADE_TRAFFIC_COLLIDERS[0]);
assert.equal(vehicleCollidersOverlap(truck(),car()),true,'same-level overlapping vehicles make contact');
assert.equal(vehicleCollidersOverlap(truck(),car(-12)),false,'traffic beneath a bridge cannot strike the truck');
assert.equal(vehicleCollidersOverlap(truck(),car(12)),false,'traffic on an upper bridge cannot strike a lower truck');
assert.equal(vehicleCollidersOverlap(truck(),car(0,10)),false,'separated vehicles do not collide');
assert.equal(vehicleCollidersOverlap(truck(0.92,Math.PI/4),car()),true,'rotated traffic collider still hits');
assert.equal(vehicleColliderOverlapsCircle(truck(),0,0,1,{minY:-10,maxY:-7}),false,'roadside tree beneath elevated road cannot hit bridge truck');
assert.equal(vehicleColliderOverlapsCircle(truck(),0,0,1,{minY:0,maxY:2}),true,'roadside tree at road level hits truck');
assert.equal(vehicleColliderOverlapsCircle(truck(),0,0,1,{minY:10,maxY:12}),false,'upper island cannot hit lower truck');
assert.equal(vehicleColliderOverlapsCircle(truck(),0,0,1),true,'historical planar-only circle calls still supported');
assert.equal(verticalContactOverlaps(undefined,undefined,0,1),true,'legacy heightless callers retain planar semantics');
for (const [index,shape] of ARCADE_TRAFFIC_COLLIDERS.entries()) {
  assert.ok(shape.height>1&&shape.height<5,`vehicle ${index} has physical vertical extent`);
  assert.equal(vehicleCollidersOverlap(truck(15.92),createVehicleCollider({x:0,y:0,z:0},0,shape)),false,'all traffic classes reject false deck contacts');
}
console.log(JSON.stringify({status:'PASS',scope:'V2/V3 collision volume, grade-separated roads and legacy footprint parity'}));
