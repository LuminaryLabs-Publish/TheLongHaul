// Real NexusEngine truck inputs against opt-in V3's playable course adapter.
// This proves simulation and road-contact behavior, not WebGL/browser playback.
import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import {createLongHaulTruckDynamicsProfileKit} from '../src/game/truck-dynamics-profile-kit.mjs';
import {createLongHaulTruckKit} from '../src/game/truck-kit.mjs';
import {createPlayableRoadV3Course,advancePlayableRoadV3Course,playableRoadV3Point,playableRoadV3Progress} from '../src/game/road-v3-playable-course.mjs';
import {nearestRoad,terrainHeight} from '../src/game/world-base.mjs';
import {ROAD_V3_VERSION} from '../src/game/road-v3-geometry.mjs';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const duration=process.argv.includes('--full')?600:30;
const seed='v3-playable-driving-proof';
const course=createPlayableRoadV3Course(seed);
const dynamics=createLongHaulTruckDynamicsProfileKit(N);
const kit=createLongHaulTruckKit(N,{dynamicsProfileResource:dynamics.resources.TruckDynamicsProfileState});
const engine=N.createEngine({tick:{maxDelta:1/15,rejectReentry:true},kits:[dynamics.kit,kit.kit]});
engine.world.__longHaulScene='driving';
const truck=engine.n.longHaulTruck;
const start=playableRoadV3Point(course,0);
truck.reset({x:start.x,y:start.y+.92,z:start.z,heading:start.heading});engine.tick(0);
let progress=0,offroad=0,rebuilds=0,maxLateral=0,minGrade=Infinity,maxGrade=-Infinity;
for(let tick=0;tick<duration*60;tick++){
  const state=truck.getState();
  const road=nearestRoad(course,{...state.position,progressHint:progress});
  assert.ok(road,`road query at tick ${tick}`);
  progress=road.progress;
  assert.ok(Number.isFinite(progress),`progress at tick ${tick}`);
  maxLateral=Math.max(maxLateral,road.distance);
  if(road.distance>(road.edge?.width??25)*.5)offroad++;
  const ahead=playableRoadV3Point(course,progress+22+Math.max(0,state.speed)*.4);
  assert.ok(ahead,`lookahead at tick ${tick}`);
  const heading=Math.atan2(ahead.x-state.position.x,ahead.z-state.position.z);
  const error=Math.atan2(Math.sin(heading-state.heading),Math.cos(heading-state.heading));
  const steer=clamp(error*2-state.yawRate*.7,-1,1);
  const surface=playableRoadV3Point(course,progress);
  minGrade=Math.min(minGrade,surface.grade);maxGrade=Math.max(maxGrade,surface.grade);
  const normal={x:-surface.grade*Math.sin(surface.heading)-surface.bank*surface.nx,y:1,z:-surface.grade*Math.cos(surface.heading)-surface.bank*surface.nz};
  const m=Math.hypot(normal.x,normal.y,normal.z);normal.x/=m;normal.y/=m;normal.z/=m;
  truck.input({throttle:clamp((13-state.speed)*.65,0,1),brake:clamp((state.speed-13)*.17,0,1),steer,
    surface:'paved',surfaceGrip:1,roadClass:'paved-highway',roadMaterial:'paved',
    groundHeight:road.y,groundNormal:normal});
  engine.tick(1/60);
  const next=truck.getState();
  assert.ok(Number.isFinite(next.position.x+next.position.y+next.position.z),'truck state must remain finite');
  assert.equal(next.tipped,false,'truck must not tip in bounded highway curvature');
  if(tick%60===0){
    const growth=advancePlayableRoadV3Course(course,progress);
    if(growth.changed)rebuilds++;
    const height=terrainHeight(course,surface.x,surface.z);
    assert.ok(Number.isFinite(height));
    const roundTrip=playableRoadV3Progress(course,surface,progress);
    assert.ok(Number.isFinite(roundTrip)&&Math.abs(roundTrip-progress)<3,'nearest section and progress agree');
  }
}
assert.equal(course.generatorVersion,ROAD_V3_VERSION);
assert.ok(progress>duration*9,`truck should move (progress ${progress} in ${duration}s)`);
assert.equal(offroad,0,`vehicle strayed from the main highway ${offroad} ticks`);
console.log(JSON.stringify({status:'PASS',mode:'NexusEngine opt-in playable V3 simulation; NOT WebGL gameplay',seed,seconds:duration,progress,offroad,maxLateral,minGrade,maxGrade,rebuilds,edges:course.edges.length}));
