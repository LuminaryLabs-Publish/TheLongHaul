import assert from 'node:assert/strict';
import {buildArcadeRoutes,arcadePathPoint,arcadeRoadProgress,planArcadeEncounters} from '../src/game/arcade-encounters.mjs';

const course={seed:'freight',edges:Array.from({length:20},(_,i)=>({id:`e${i}`,from:`n${i}`,to:`n${i+1}`,branchId:'highway',surface:'paved',width:24,samples:[{x:0,z:i*100},{x:0,z:(i+1)*100}]})),depots:[{x:0,z:2000,radius:30}]};
const network=buildArcadeRoutes(course),path=network.paths[0];
assert.equal(network.paths.length,1,'traffic must remain on one continuous road across streamed edge boundaries');
assert.equal(path.length,2000);
assert.equal(arcadePathPoint(path,1050,3.4).z,1050);
assert.equal(arcadePathPoint(path,1050,3.4).x,-3.4);
assert.equal(arcadePathPoint(path,2001),null,'no traffic beyond the receiving road');
assert.equal(arcadeRoadProgress({edge:course.edges[10],segmentIndex:0,t:.5},network).distance,1050);
const events=planArcadeEncounters(course,network),repeat=planArcadeEncounters(course,network);
assert.deepEqual(events.map(e=>[e.id,e.kind,e.lane]),repeat.map(e=>[e.id,e.kind,e.lane]),'retry geometry is deterministic');
assert.equal(new Set(events.map(e=>e.id)).size,events.length);
assert.equal(new Set(events.map(e=>e.kind)).size,4,'ramp, destruction, roadblock and weaving windows are present');
for(let i=0;i<events.length;i++){
  const e=events[i];assert.ok(e.distance>=200,'no startup ambush');
  assert.ok(e.clearWidth>=7.5,'a truck-width escape corridor remains');
  assert.ok(Math.abs(e.point.z-2000)>110,'receiving yard stays clear');
  if(i)assert.ok(e.distance-events[i-1].distance>=e.warningLead+100,'warning and recovery windows cannot pile up');
}
const disconnected=buildArcadeRoutes({...course,edges:[course.edges[0],course.edges[3]]});
assert.equal(disconnected.paths.length,2,'do not invent road connections across missing segments');
assert.equal(planArcadeEncounters({...course,edges:course.edges.map(e=>({...e,width:8}))}).length,0,'narrow roads stay passable');
console.log('Encounter geometry, pacing and safe-corridor regressions passed');
