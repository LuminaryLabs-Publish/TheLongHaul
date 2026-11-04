import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import { createLongHaulTruckDynamicsProfileKit } from '../src/game/truck-dynamics-profile-kit.mjs';
import { createLongHaulTruckKit } from '../src/game/truck-kit.mjs';
import { createEndlessHighway, advanceEndlessHighway, endlessHighwayPoint } from '../src/game/endless-highway.mjs';
import { nearestRoad, terrainHeight } from '../src/game/world-base.mjs';
import { roadChunkAt } from '../src/game/road-chunks.mjs';

// Intentional, isolated driving fixtures: each starts at a seeded road position
// and then uses real NexusEngine steering, traction, suspension and progress.
// No positions or scores are injected during the drive. Not a filmed journey.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const seed='road-matrix-1';
const scenes=[{name:'freight-wide',at:240,end:730,route:'safe',target:18},
  {name:'freight-express',at:240,end:730,route:'risky',target:18}];
for(let p=640;p<23500;p+=960){const c=roadChunkAt(seed,p+1);if(!c.branch||scenes.filter(s=>s.name.includes(c.kind)).length)continue; scenes.push({name:`${c.kind}-highway`,at:c.start-60,end:c.end+40,route:'safe',target:18});scenes.push({name:`${c.kind}-optional`,at:c.start-60,end:c.end+40,route:'branch',target:c.kind==='gravel-detour'?14:17});if(scenes.length>=6)break;}
assert.equal(scenes.length,6,'cover freight, scenic and gravel alternatives');
let results=[];
for(const config of scenes){
 const course=createEndlessHighway(seed,{progress:config.at}),dt=1/60;
 const dyn=createLongHaulTruckDynamicsProfileKit(N),kit=createLongHaulTruckKit(N,{dynamicsProfileResource:dyn.resources.TruckDynamicsProfileState});
 const engine=N.createEngine({tick:{maxDelta:1/15,rejectReentry:true},kits:[dyn.kit,kit.kit]});engine.world.__longHaulScene='driving';
 const truck=engine.n.longHaulTruck,point=endlessHighwayPoint(course,config.at,0,config.route);
 truck.reset({x:point.x,y:point.y+.92,z:point.z,heading:point.heading});engine.tick(0);
 let maxRoadOffset=0, maxEdgeRatio=0, offRoadTicks=0, samples=0, uniqueFeatures=new Set(), steeringReversals=0, lastSteer=0, updates=0, selectedRouteTicks=0;
 const maxTicks=4400;
 for(let tick=0;tick<maxTicks;tick++){
   const state=truck.getState(),s=-state.position.z;
   if(s>=config.end)break;
   const near=nearestRoad(course,state.position);
   if(near){maxRoadOffset=Math.max(maxRoadOffset,near.distance);maxEdgeRatio=Math.max(maxEdgeRatio,near.distance/(near.edge.width*.5));if(near.distance>near.edge.width*.5)offRoadTicks++;}
   const chunk=roadChunkAt(seed,s);uniqueFeatures.add(chunk.kind);
   const featureCenter=config.name.includes('freight')?480:Math.floor(config.at/960)*960+960;
   // The chosen road (not simply a nearby paved surface) must own the
   // truck during the physically separated centre of the route.
   if(Math.abs(s-featureCenter)<70 && near) {
     const selected = config.route==='risky' ? near.edge.type==='loading-shortcut'
       : config.route==='branch' ? near.edge.type==='scenic-bypass'
       : near.edge.type==='endless-highway';
     if(selected)selectedRouteTicks++;
   }
   // Look a modest distance ahead and damp measured yaw; neither the road
   // profile nor the truck position is authored by the tester.
   const look=endlessHighwayPoint(course,s+16+Math.max(0,state.speed)*.62,0,config.route);
   const heading=Math.atan2(look.x-state.position.x,look.z-state.position.z),error=Math.atan2(Math.sin(heading-state.heading),Math.cos(heading-state.heading));
   const steer=clamp(error*2.1-state.yawRate*.6,-1,1);
   if(Math.sign(steer)!==Math.sign(lastSteer)&&Math.abs(steer)>.2&&Math.abs(lastSteer)>.2)steeringReversals++;
   lastSteer=steer;
   const x=state.position.x,z=state.position.z,dx=2;
   const y=terrainHeight(course,x,z),nx=terrainHeight(course,x-dx,z)-terrainHeight(course,x+dx,z),nz=terrainHeight(course,x,z-dx)-terrainHeight(course,x,z+dx),len=Math.hypot(nx,4,nz);
   truck.input({throttle:clamp((config.target-state.speed)*.65,0,1),brake:clamp((state.speed-config.target)*.16,0,1),steer,surface:near?.edge.surface||'road',surfaceGrip:1,roadClass:near?.edge.roadClass,roadMaterial:near?.edge.surface||'paved',groundHeight:y,groundNormal:{x:nx/len,y:4/len,z:nz/len}});
   engine.tick(dt);samples++;
   const after=truck.getState();
   if(!Number.isFinite(after.position.x+after.position.y+after.position.z)||after.tipped)throw Error(`${config.name} truck broke at ${s.toFixed(1)}`);
   if(advanceEndlessHighway(course,after.position).changed)updates++;
 }
 const final=truck.getState(),end=-final.position.z;
 const r={name:config.name,progressMetres:Math.round(end-config.at),endProgress:end,goal:config.end,maxRoadOffset,maxEdgeRatio,offRoadTicks,samples,selectedRouteTicks,steeringReversals,updates,features:[...uniqueFeatures]};
 results.push(r);
 assert.ok(end>=config.end,`${config.name} reached ${end}, expected ${config.end}`);
 assert.ok(maxEdgeRatio<1,`${config.name} stays within the marked physical road; max ${maxEdgeRatio}`);
 assert.equal(offRoadTicks,0,`${config.name} does not fall off the chosen road`);
 assert.ok(selectedRouteTicks>=100,`${config.name} physically follows the intended route through its centre: ${selectedRouteTicks}`);
}
console.log(JSON.stringify({status:'PASS',scope:'NexusEngine input-driven fixtures, six route cases; no browser/video',results}));
