import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import {roadV3NaturalHeight} from '../src/game/landscape-style.mjs';
import {createRoadV3Stream,extendRoadV3Stream,ensureRoadV3Ahead,
  roadV3PointAt,roadV3Project} from '../src/game/road-v3-journey.mjs';
import {ROAD_V3_LIMITS} from '../src/game/road-v3-geometry.mjs';
import {createLongHaulRoadV3Kit} from '../src/game/road-v3-kit.mjs';
import {createLongHaulTruckKit} from '../src/game/truck-kit.mjs';
import {createLongHaulTruckDynamicsProfileKit} from '../src/game/truck-dynamics-profile-kit.mjs';
import {terrainHeight, naturalTerrainHeight} from '../src/game/world-base.mjs';
import {createCourseCellDescriptor} from '../src/game/cell-descriptor.mjs';
import {createEndlessHighway} from '../src/game/endless-highway.mjs';

const near=(a,b,tolerance=1e-5)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);
let maxGrade=0,maxCurvature=0,maxBank=0,realBridges=0,cut=0,fill=0,lateral=0;
for(let i=0;i<16;i++){
  const seed=`terrain-first-acceptance:${i}`;
  const original=createRoadV3Stream(seed,{terrainAware:true});
  assert.deepEqual(original,createRoadV3Stream(seed,{terrainAware:true}),'same seed and options reproduce identical terrain-first stream');
  assert.equal(original.persistence.layoutRevision,3);
  assert.equal(original.edges[0].laneCount,5,'preserve five-lane highway contract');
  assert.equal(original.generatorVersion,'long-haul-endless-v3');
  let graph=original;
  for(let region=3;region<12;region++){
    graph=extendRoadV3Stream(graph,{addMountains:1,focusProgress:graph.totalProgress-150});
    assert.ok(graph.edges.length<=6,'bounded active road section window');
    assert.equal(graph.directory.length,region+1);
    for(let e=0;e<graph.edges.length;e++){
      const edge=graph.edges[e];
      assert.equal(edge.samples.length,65);
      for(let j=1;j<edge.samples.length;j++){
        const a=edge.samples[j-1],b=edge.samples[j];
        assert.ok(b.progress>a.progress&&Number.isFinite(b.y));
        const ds=Math.hypot(b.x-a.x,b.z-a.z);
        const bend=Math.abs(Math.atan2(Math.sin(b.heading-a.heading),Math.cos(b.heading-a.heading)))/ds;
        maxCurvature=Math.max(maxCurvature,bend);
        maxGrade=Math.max(maxGrade,Math.abs(b.grade));maxBank=Math.max(maxBank,Math.abs(b.bank));
        realBridges+=b.structure==='bridge'?1:0;
        cut+=b.structure==='cut'?1:0;fill+=b.structure==='fill'?1:0;
        lateral=Math.max(lateral,Math.abs(b.x));
        assert.ok(bend<=ROAD_V3_LIMITS.maxCurvature+1e-5,'horizontal road curvature limit');
        assert.ok(Math.abs(b.grade)<=ROAD_V3_LIMITS.maxGrade,'vertical road grade limit');
        assert.ok(Math.abs(b.bank)<=.085+1e-6,'superelevation limit');
      }
      if(e){
        const a=graph.edges[e-1].samples.at(-1),b=edge.samples[0];
        near(a.x,b.x,1e-4);near(a.y,b.y,1e-4);near(a.z,b.z,1e-4);near(a.bank,b.bank,1e-4);
        near(a.progress,b.progress,1e-4);
      }
    }
  }
  const oldProgress=graph.directory[2].startProgress+220;
  const old=ensureRoadV3Ahead(graph,oldProgress,{lead:1000});
  assert.equal(old.totalProgress,graph.totalProgress,'return cannot grow when far behind');
  assert.deepEqual(old.directory,graph.directory,'revisit cannot change committed road decisions');
  const p=roadV3PointAt(old,oldProgress);
  assert.ok(p,'region reconstructs to a valid road point');
  const projection=roadV3Project(old,p,{hint:oldProgress});
  assert.ok(projection&&Math.abs(projection.progress-oldProgress)<3,'3D projection returns the original progress');
  const left=roadV3PointAt(old,oldProgress,8),right=roadV3PointAt(old,oldProgress,-8);
  near(left.y-right.y,p.bank*16,.1);
  const outside={x:p.x+1000,z:p.z+1000};
  near(terrainHeight(old,outside.x,outside.z),naturalTerrainHeight(old,outside.x,outside.z),1e-5);
  if(p.structure!=='bridge')near(terrainHeight(old,p.x,p.z),p.y-.4,.6);
  const cx=Math.floor(p.x/160),cz=Math.floor(p.z/160);
  const cell={id:`world:${cx}:${cz}`,coordinates:[cx,cz],
    bounds:{minX:cx*160,maxX:(cx+1)*160,minZ:cz*160,maxZ:(cz+1)*160}};
  const patch=createCourseCellDescriptor(old,cell,{terrainSegments:8});
  assert.ok(patch.roads.length>0,'world-cell host can materialize terrain-aware geometry');
  assert.ok(patch.terrain.heights.every(Number.isFinite),'terrain mesh samples are finite');
  const sampleHeight=roadV3NaturalHeight(seed,p.x,p.z);
  near(sampleHeight,naturalTerrainHeight(old,p.x,p.z),1e-5);
  const ahead=ensureRoadV3Ahead(old,graph.totalProgress-80,{lead:2500});
  assert.ok(ahead.directory.length>graph.directory.length,'highway continues beyond prior world window');
}
// Graph projection must return the actual banked driving surface at lane
// offsets, not the elevation of the road centerline. Both are consumed by
// collision/freight/camera code once a V3 host is accepted.
for (const offset of [-8, -4, 0, 4, 8]) {
  const graph=createRoadV3Stream('terrain-first-acceptance:0',{terrainAware:true});
  const progress=980;
  const point=roadV3PointAt(graph,progress,offset);
  assert.ok(Math.abs(point.bank)>.01,'fixture must exercise a banked turn');
  const projected=roadV3Project(graph,point,{hint:progress});
  assert.ok(projected,'banked driving lane must project onto a real road segment');
  near(projected.lateral,offset,.08);
  near(projected.y,point.y,.035);
  near(projected.progress,progress,.2);
}
assert.ok(lateral>30,'terrain-aware route must bend through actual geography');
assert.ok(realBridges>0&&cut>0&&fill>0,'terrain generates bridges, cuts and fills');
assert.ok(maxBank>0.002,'curvature produces measurable nonzero road banking');
const kit=createLongHaulRoadV3Kit(N),engine=N.createEngine({kits:[kit.kit]});
engine.n.longHaulRoadV3.prepareStream('terrain-first-dsk',{terrainAware:true});engine.tick(0);
assert.equal(engine.n.longHaulRoadV3.getState().graph.terrainAware,true,'existing DSK selects opt-in terrain-aware road');
const before=engine.n.longHaulRoadV3.getState().graph.totalProgress;
engine.n.longHaulRoadV3.ensureAhead(before-50);engine.tick(0);
assert.ok(engine.n.longHaulRoadV3.getState().graph.totalProgress>before);
assert.equal(createEndlessHighway('v2-safety').generatorVersion,'long-haul-endless-v2');
// The V3 geometry is not just visually connected: ordinary NexusEngine input
// must advance a physically simulated truck through the banked road corridor.
const terrainDrive=createRoadV3Stream('terrain-first-truck-drive',{terrainAware:true});
const dynamics=createLongHaulTruckDynamicsProfileKit(N);
const truckKit=createLongHaulTruckKit(N,{dynamicsProfileResource:dynamics.resources.TruckDynamicsProfileState});
const simulation=N.createEngine({tick:{maxDelta:1/15,rejectReentry:true},kits:[dynamics.kit,truckKit.kit]});
simulation.world.__longHaulScene='driving';
const player=simulation.n.longHaulTruck;
const start=roadV3PointAt(terrainDrive,0);
player.reset({x:start.x,y:start.y+.92,z:start.z,heading:start.heading});simulation.tick(0);
let traveled=0,offroadTicks=0;
for(let tick=0;tick<25*60;tick++){
  const state=player.getState();
  const hit=roadV3Project(terrainDrive,state.position,{hint:traveled,radius:40});
  assert.ok(hit,'real truck location must project onto a terrain-first highway');
  traveled=hit.progress;
  if(hit.distance>terrainDrive.edges[0].width/2)offroadTicks++;
  const target=roadV3PointAt(terrainDrive,traveled+25);
  const heading=Math.atan2(target.x-state.position.x,target.z-state.position.z);
  const error=Math.atan2(Math.sin(heading-state.heading),Math.cos(heading-state.heading));
  const steer=Math.max(-1,Math.min(1,error*2-state.yawRate*.7));
  const surface=roadV3PointAt(terrainDrive,traveled);
  const normal={x:-surface.grade*Math.sin(surface.heading)-surface.bank*surface.nx,
    y:1,z:-surface.grade*Math.cos(surface.heading)-surface.bank*surface.nz};
  const norm=Math.hypot(normal.x,normal.y,normal.z);normal.x/=norm;normal.y/=norm;normal.z/=norm;
  player.input({throttle:Math.max(0,Math.min(1,(12-state.speed)*.65)),
    brake:Math.max(0,Math.min(1,(state.speed-12)*.16)),steer,
    surface:'paved',surfaceGrip:1,roadClass:'paved-highway',roadMaterial:'paved',
    groundHeight:surface.y,groundNormal:normal});
  simulation.tick(1/60);
  const next=player.getState();
  assert.ok(Number.isFinite(next.position.x+next.position.y+next.position.z)&&!next.tipped,'real input produces stable vehicle state');
}
assert.ok(traveled>230,'truck progresses under real NexusEngine physics');
assert.equal(offroadTicks,0,'truck remains on terrain-aware road under input');
console.log(JSON.stringify({status:'PASS',mode:'opt-in terrain-first V3, default V2 unchanged',
  seeds:16,sectionsPerSeed:12,maxGrade,maxCurvature,maxBank,bridgeSamples:realBridges,
  cutSamples:cut,fillSamples:fill,maxLateral:lateral,returnReconstruction:true,
  cellDescriptor:true,domainServiceKit:true,simulatedTruckSeconds:25,physicalProgress:traveled,offroadTicks}));
