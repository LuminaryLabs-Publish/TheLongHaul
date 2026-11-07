import assert from 'node:assert/strict';
import {createRoadV3Journey,roadV3PointAt} from '../src/game/road-v3-journey.mjs';
import {ROAD_V3_VERSION} from '../src/game/road-v3-geometry.mjs';
import {createFreightJourney,prepareFreightSave} from '../src/game/freight-journey.mjs';
import {createEndlessHighway} from '../src/game/endless-highway.mjs';
const seed='v3-freight-integrated',sessionId='v3-freight-demo',roadGraph=createRoadV3Journey(seed);
const service=createFreightJourney({seed,sessionId,generatorVersion:ROAD_V3_VERSION,roadGraph});
assert.equal(service.getState().generatorVersion,ROAD_V3_VERSION);
assert.ok(service.getState().pickupStation.safe.point.x!==service.getState().pickupStation.safe.point.z);
assert.equal(service.getState().pickupStation.progress,480);
let delivered=0,picked=0,missed=0,previous=null;
for(let progress=0;progress<1300;progress+=1){
  // Contract-level simulation fixture: positions are sampled from the true V3
  // route, not footage or a claim of actual driven WebGL/vehicle simulation.
  const road=roadV3PointAt(roadGraph,progress,-2.8);
  const input={dt:0.05,position:{x:road.x,y:road.y,z:road.z},speed:20,
    heading:road.heading,grounded:true,cargoCondition:100,truckCondition:100,collisionCount:0,penaltySeconds:0};
  const events=service.tick(input);
  picked+=events.filter(e=>e.type==='cargo-picked-up').length;
  delivered+=events.filter(e=>e.type==='cargo-delivered').length;
  missed+=events.filter(e=>e.type==='pickup-missed').length;
  previous=input.position;
}
assert.ok(picked>=1,`A V3 gate should pick up cargo, got ${picked}`);
assert.ok(delivered>=1,`A V3 receiver should pay an actual receipt, got ${delivered}`);
assert.equal(missed,0);
const state=service.getState();
assert.ok(state.earnedCash>0&&state.completed>=1);
assert.equal(state.generatorVersion,ROAD_V3_VERSION);
const saved=service.snapshot();
const restore=createFreightJourney({seed,sessionId,generatorVersion:ROAD_V3_VERSION,roadGraph,snapshot:saved});
assert.equal(restore.getState().earnedCash,state.earnedCash);
assert.equal(restore.getState().completed,state.completed);
assert.throws(()=>createFreightJourney({seed,sessionId,generatorVersion:ROAD_V3_VERSION}),/road graph/);
assert.throws(()=>createFreightJourney({seed,sessionId:'short-v3',generatorVersion:ROAD_V3_VERSION,roadGraph:{...roadGraph,totalProgress:490}}),/growth ahead/);
const old=createEndlessHighway(seed);assert.equal(old.generatorVersion,'long-haul-endless-v2');
assert.equal(createFreightJourney({seed,sessionId:'legacy-v2'}).getState().generatorVersion,old.generatorVersion);
console.log(JSON.stringify({status:'PASS',mode:'V3 freight contract-level graph positions, not live gameplay',picked,delivered,earnedCash:state.earnedCash,completed:state.completed}));
