import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import {ROAD_V3_LIMITS} from '../src/game/road-v3-geometry.mjs';
import {createRoadV3Stream,extendRoadV3Stream,ensureRoadV3Ahead,roadV3Project,roadV3PointAt,roadV3WorldStreaming} from '../src/game/road-v3-journey.mjs';
import {createLongHaulRoadV3Kit} from '../src/game/road-v3-kit.mjs';

let maxCurvature=0, maxSeamAngle=0;
for(let seedIndex=0;seedIndex<30;seedIndex++){
  const seed=`v3-stream-acceptance-${seedIndex}`;
  let graph=createRoadV3Stream(seed,{initialMountains:3});
  assert.equal(graph.directory.length,3);
  assert.deepEqual(graph,createRoadV3Stream(seed,{initialMountains:3}));
  for(let i=3;i<16;i++) {
    graph=extendRoadV3Stream(graph,{addMountains:1,focusProgress:graph.totalProgress-500});
    assert.equal(graph.directory.length,i+1);
    assert.ok(graph.edges.length<=12,'bounded active geometry window');
    assert.equal(graph.persistence.mountains,i+1);
    const old=graph.directory.at(-2),last=graph.directory.at(-1);
    assert.ok(last.startProgress>=old.endProgress-1e-5);
    assert.ok(last.endProgress>last.loopStartProgress);
    for(let j=1;j<graph.edges.length;j++){
      const p=graph.edges[j-1].samples.at(-1),q=graph.edges[j].samples[0];
      if(graph.edges[j-1].endProgress!==graph.edges[j].startProgress)throw new Error('Road progress seam');
      assert.ok(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<1e-5,'road position seam');
      const dh=Math.abs(Math.atan2(Math.sin(p.heading-q.heading),Math.cos(p.heading-q.heading)));
      maxSeamAngle=Math.max(maxSeamAngle,dh);
      assert.ok(dh<.025,'smooth connector heading');
    }
    for(const edge of graph.edges)for(let j=2;j<edge.samples.length;j++){
      const a=edge.samples[j-1],b=edge.samples[j];
      const d=Math.hypot(b.x-a.x,b.z-a.z),dh=Math.abs(Math.atan2(Math.sin(b.heading-a.heading),Math.cos(b.heading-a.heading)));
      maxCurvature=Math.max(maxCurvature,dh/d);
      assert.ok(dh/d<=ROAD_V3_LIMITS.maxCurvature+1e-5,'drivable curvature');
      assert.ok(Math.abs(b.grade)<=ROAD_V3_LIMITS.maxGrade,'legal grade');
    }
    assert.ok(graph.crossings.length>0,'mountain crossings persist in active window');
  }
  const persisted=structuredClone(graph.directory),priorDistance=graph.totalProgress;
  const oldProgress=graph.directory[2].loopStartProgress+200;
  const earlier=ensureRoadV3Ahead(graph,oldProgress,{lead:2000});
  assert.ok(earlier.activeRegionRange.from<=2&&earlier.activeRegionRange.to>=2,'old region rehydrates');
  assert.equal(earlier.totalProgress,priorDistance);
  assert.deepEqual(earlier.directory,persisted,'committed road directory unchanged by revisits');
  const point=roadV3PointAt(earlier,oldProgress);
  const found=roadV3Project(earlier,point,{hint:oldProgress});
  assert.ok(found&&Math.abs(found.progress-oldProgress)<4,'world-space return progress');
  assert.ok(roadV3WorldStreaming(earlier,point).visibleEdges.includes(found.edgeId));
  const after=ensureRoadV3Ahead(earlier,priorDistance-450,{lead:2600});
  assert.ok(after.directory.length>persisted.length,'road growth continues');
  assert.deepEqual(after.directory.slice(0,persisted.length),persisted,'growth cannot rewrite previous roads');
}
const component=createLongHaulRoadV3Kit(N);
const engine=N.createEngine({kits:[component.kit]});
engine.n.longHaulRoadV3.prepareStream('driver-route');engine.tick(0);
assert.equal(engine.n.longHaulRoadV3.getState().graph.directory.length,3);
const before=engine.n.longHaulRoadV3.getState().graph.totalProgress;
engine.n.longHaulRoadV3.ensureAhead(before-200,{lead:2500});engine.tick(0);
assert.ok(engine.n.longHaulRoadV3.getState().graph.totalProgress>before,'domain service extends committed route');
console.log(JSON.stringify({status:'PASS',seeds:30,mountainsPerSeed:16,maximumCurvature:maxCurvature,maximumSeamAngle:maxSeamAngle,roadGrowth:'bounded and deterministic',returnReconstruction:true,kitLifecycle:true}));
