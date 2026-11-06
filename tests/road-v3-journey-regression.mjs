import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import {createLongHaulTruckDynamicsProfileKit} from '../src/game/truck-dynamics-profile-kit.mjs';
import {createLongHaulTruckKit} from '../src/game/truck-kit.mjs';
import {createRoadV3Journey,roadV3PointAt,roadV3Project,roadV3WorldStreaming,roadV3SceneryDescriptor} from '../src/game/road-v3-journey.mjs';
import {createLongHaulRoadV3Kit} from '../src/game/road-v3-kit.mjs';
import {ROAD_V3_LIMITS,ROAD_V3_VERSION} from '../src/game/road-v3-geometry.mjs';

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const seed='road-v3-journey-proof';
const simulationSeconds=process.argv.includes('--full')?600:25;
const graph=createRoadV3Journey(seed,{mountains:12});
assert.equal(graph.generatorVersion,ROAD_V3_VERSION);
assert.ok(graph.totalProgress>=12000,'supports a full 600-second route at 20m/s');
assert.equal(graph.crossings.length,12);
assert.deepEqual(graph.persistence,{seed,version:ROAD_V3_VERSION,layoutRevision:1,mountains:12});
assert.deepEqual(graph,createRoadV3Journey(seed,{mountains:12}), 'deterministic reconstruction');
const roadKit=createLongHaulRoadV3Kit(N),roadEngine=N.createEngine({kits:[roadKit.kit]});
assert.equal(roadEngine.n.longHaulRoadV3.getState().graph,null);
roadEngine.n.longHaulRoadV3.prepareJourney(seed,{mountains:12});roadEngine.tick(0);
assert.equal(roadEngine.n.longHaulRoadV3.getState().graph.totalProgress,graph.totalProgress);
assert.ok(roadEngine.n.longHaulRoadV3.sample(400));
assert.ok(roadEngine.n.longHaulRoadV3.locate(roadV3PointAt(graph,400),{hint:400}));
assert.equal(roadEngine.n.longHaulRoadV3.stream(roadV3PointAt(graph,400)).active.length,9);
assert.equal(roadEngine.n.longHaulRoadV3.scenery(400).tileIndex,2);
roadEngine.n.longHaulRoadV3.prepareJourney(seed,{mountains:100});roadEngine.tick(0);
assert.ok(roadEngine.n.longHaulRoadV3.getState().error,'invalid candidate rejected');
assert.equal(roadEngine.n.longHaulRoadV3.getState().graph.totalProgress,graph.totalProgress,'good graph retained after invalid request');
roadEngine.n.longHaulRoadV3.reset();roadEngine.tick(0);
assert.equal(roadEngine.n.longHaulRoadV3.getState().graph,null);

for (let i=1;i<graph.edges.length;i++) {
  const previous=graph.edges[i-1].samples.at(-1),next=graph.edges[i].samples[0];
  assert.ok(Math.hypot(previous.x-next.x,previous.y-next.y,previous.z-next.z)<1e-5,'no gap at segment seam');
  assert.ok(next.progress>=previous.progress);
}
for(const crossing of graph.crossings){
  assert.equal(crossing.kind,'bridge');
  assert.ok(crossing.clearance>=ROAD_V3_LIMITS.crossingClearance);
  const lower=roadV3PointAt(graph,crossing.lowerProgress),upper=roadV3PointAt(graph,crossing.upperProgress);
  assert.ok(Math.hypot(lower.x-upper.x,lower.z-upper.z)<4);
  assert.ok(upper.y-lower.y>=ROAD_V3_LIMITS.crossingClearance);
  const atLow=roadV3Project(graph,{...lower,y:lower.y+.85},{hint:crossing.lowerProgress});
  const atHigh=roadV3Project(graph,{...upper,y:upper.y+.85},{hint:crossing.upperProgress});
  assert.ok(Math.abs(atLow.progress-crossing.lowerProgress)<15);
  assert.ok(Math.abs(atHigh.progress-crossing.upperProgress)<15);
  assert.ok(Math.abs(atLow.progress-atHigh.progress)>150,'two road levels remain distinguishable');
  const coverage=roadV3WorldStreaming(graph,upper,{visualRadius:3});
  assert.ok(coverage.active.length===9&&coverage.visibleEdges.includes(lower.edgeId)&&coverage.visibleEdges.includes(upper.edgeId), 'return visit retains both road levels');
}
for(let second=0;second<=600;second+=5){
  const progress=Math.min(graph.totalProgress,second*20),position=roadV3PointAt(graph,progress);
  const located=roadV3Project(graph,{...position,y:position.y+.85},{hint:progress});
  assert.ok(located&&Math.abs(located.progress-progress)<15,'10-minute deterministic journey reprojects');
  const coverage=roadV3WorldStreaming(graph,position);
  assert.ok(coverage.visibleEdges.length&&coverage.active.length===9);
  const glb=roadV3SceneryDescriptor(graph,progress);
  assert.equal(glb.sceneIndex>=0&&glb.sceneIndex<=3,true);
  assert.match(glb.file,/^LH-ENV-\d{3}__.+\.glb$/);
}
const start=roadV3PointAt(graph,0),dynamics=createLongHaulTruckDynamicsProfileKit(N);
const truckKit=createLongHaulTruckKit(N,{dynamicsProfileResource:dynamics.resources.TruckDynamicsProfileState});
const engine=N.createEngine({tick:{maxDelta:1/15,rejectReentry:true},kits:[dynamics.kit,truckKit.kit]});
engine.world.__longHaulScene='driving';
const truck=engine.n.longHaulTruck;truck.reset({x:start.x,y:start.y+.92,z:start.z,heading:start.heading});engine.tick(0);
let progress=0,minOnRoad=Infinity,offroadTicks=0,maxLateral=0;
for(let tick=0;tick<simulationSeconds*60;tick++){
  const state=truck.getState();
  const hit=roadV3Project(graph,state.position,{hint:progress,radius:40});
  assert.ok(hit,'physical truck must remain near a valid road');
  progress=hit.progress;
  maxLateral=Math.max(maxLateral,hit.distance);
  if(hit.distance>ROAD_V3_LIMITS.width*.5)offroadTicks++;
  const ahead=roadV3PointAt(graph,progress+17+Math.max(0,state.speed)*.5);
  const heading=Math.atan2(ahead.x-state.position.x,ahead.z-state.position.z);
  const error=Math.atan2(Math.sin(heading-state.heading),Math.cos(heading-state.heading));
  const steer=clamp(error*2.1-state.yawRate*.6,-1,1);
  const targetSpeed=11;
  const surface=roadV3PointAt(graph,hit.progress);
  truck.input({throttle:clamp((targetSpeed-state.speed)*.65,0,1),brake:clamp((state.speed-targetSpeed)*.16,0,1),steer,
    surface:'paved',surfaceGrip:1,roadClass:'country-road',roadMaterial:'paved',
    groundHeight:surface.y,groundNormal:{x:0,y:1,z:0}});
  engine.tick(1/60);
  const next=truck.getState();
  assert.ok(Number.isFinite(next.position.x+next.position.y+next.position.z)&&!next.tipped,'truck state finite and upright');
}
assert.ok(progress>simulationSeconds*9,'truck physically progresses with NexusEngine input');
assert.equal(offroadTicks,0,'physical truck stays within candidate road envelope');
console.log(JSON.stringify({status:'PASS',mode:'V3 candidate graph + actual NexusEngine truck simulation; no browser/video or default cutover',routeMetres:graph.totalProgress,crossings:graph.crossings.length,simulatedTruckSeconds:simulationSeconds,physicalProgress:progress,offroadTicks,maxLateral}));
