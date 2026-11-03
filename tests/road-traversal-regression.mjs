import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import { createLongHaulTruckDynamicsProfileKit } from '../src/game/truck-dynamics-profile-kit.mjs';
import { createLongHaulTruckKit } from '../src/game/truck-kit.mjs';
import { createEndlessHighway, advanceEndlessHighway, endlessHighwayPoint, isEndlessLoadingZone } from '../src/game/endless-highway.mjs';
import { nearestRoad, terrainHeight } from '../src/game/world-base.mjs';
import { roadChunkAt } from '../src/game/road-chunks.mjs';
import { createFreightJourney } from '../src/game/freight-journey.mjs';
// Actual pinned engine and product physics, with a bounded analog test driver.
// No browser, traffic simulation, renderer, authored replay or video is implied.
const seed='road-matrix-1',course=createEndlessHighway(seed),dt=1/60;
const dynamics=createLongHaulTruckDynamicsProfileKit(N),truckKit=createLongHaulTruckKit(N,{dynamicsProfileResource:dynamics.resources.TruckDynamicsProfileState});
const engine=N.createEngine({tick:{maxDelta:1/15,rejectReentry:true},kits:[dynamics.kit,truckKit.kit]});engine.world.__longHaulScene='driving';
const truck=engine.n.longHaulTruck,p=endlessHighwayPoint(course,0),journey=createFreightJourney({seed,sessionId:'road-traverse'});
truck.reset({x:p.x,y:p.y+.92,z:p.z,heading:p.heading});engine.tick(0);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let maxOffset=0,maxEdges=0,maxRoll=0,updates=0,pickups=0,deliveries=0,previousCargo=null;
const seen=new Set(),loads=new Set();
for(let tick=0;tick<600*60;tick++) {
  const state=truck.getState(),s=-state.position.z,road=nearestRoad(course,state.position),chunk=roadChunkAt(seed,s);
  seen.add(chunk.kind);maxOffset=Math.max(maxOffset,road.distance);maxEdges=Math.max(maxEdges,course.edges.length);maxRoll=Math.max(maxRoll,Math.abs(state.bodyRoll));
  assert.ok(Number.isFinite(state.position.y)&&!state.tipped,'actual truck remains stable');
  assert.ok(road.distance<road.edge.width*.5,'driver traverses the drivable mainline, not the off-road fallback');
  const ahead=endlessHighwayPoint(course,s+16+Math.max(0,state.speed)*.65);
  const heading=Math.atan2(ahead.x-state.position.x,ahead.z-state.position.z),error=Math.atan2(Math.sin(heading-state.heading),Math.cos(heading-state.heading));
  const target=isEndlessLoadingZone(s)?21:28;
  const x=state.position.x,z=state.position.z,e=2;
  const h=terrainHeight(course,x,z),nx=terrainHeight(course,x-e,z)-terrainHeight(course,x+e,z),nz=terrainHeight(course,x,z-e)-terrainHeight(course,x,z+e),len=Math.hypot(nx,4,nz);
  truck.input({throttle:clamp((target-state.speed)*.65,0,1),brake:clamp((state.speed-target)*.16,0,1),steer:clamp(error*2.1-state.yawRate*.55,-1,1),surface:'road',surfaceGrip:1.06,roadClass:'paved-highway',roadMaterial:'paved',groundHeight:h,groundNormal:{x:nx/len,y:4/len,z:nz/len}});
  engine.tick(dt);
  const after=truck.getState(),events=journey.tick({dt,active:true,position:after.position,speed:after.speed,heading:after.heading,grounded:after.grounded,collisionCount:0});
  for(const event of events){if(event.type==='cargo-picked-up')pickups++;if(event.type==='cargo-delivered')deliveries++;}
  const freight=journey.getState(),cargoKey=freight.cargo?.id??null;
  if(cargoKey!==previousCargo){truck.setCargo(freight.cargo);previousCargo=cargoKey;if(cargoKey)loads.add(cargoKey);}
  if(advanceEndlessHighway(course,after.position).changed)updates++;
}
const final=journey.getState(),state=truck.getState();
assert.ok(deliveries>=5 && pickups>=deliveries,'repeated physical gate crossings settle freight');
assert.ok(seen.size>=9,'sustained run visits varied road features');
assert.ok(maxEdges<=20 && course.nodes.length===13,'retained road data stays bounded');
assert.equal(final.lost,0,'normal safe-route traversal preserves cargo');
console.log(JSON.stringify({status:'PASS',scope:'600 seconds of actual engine/product simulation with analog test driver; no browser or video',simulationSeconds:600,ticks:36000,metres:-state.position.z,features:[...seen],cargoProfiles:[...loads],pickups,deliveries,lost:final.lost,earnedCash:final.earnedCash,maxOffset,maxRoll,maxEdges,updates}));
