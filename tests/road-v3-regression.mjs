import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import {createLongHaulRoadV3Kit} from '../src/game/road-v3-kit.mjs';
import {generateRoadV3,roadV3Crossings,roadV3SurfacesAt,roadV3TerrainHeight,ROAD_V3_VERSION,ROAD_V3_LIMITS} from '../src/game/road-v3-geometry.mjs';
import {createEndlessHighway} from '../src/game/endless-highway.mjs';
import {ROAD_GENERATOR_VERSION} from '../src/game/road-chunks.mjs';

for(const seed of ['mountain-alpha','mountain-beta','mountain-gamma']){
  const graph=generateRoadV3(seed);
  assert.equal(graph.generatorVersion,ROAD_V3_VERSION);
  assert.deepEqual(graph,generateRoadV3(seed),'same seed creates identical graph');
  assert.ok(graph.crossings.length>0,'must cross an earlier part of road');
  assert.ok(graph.crossings.every(c=>c.kind==='bridge'&&c.clearance>=ROAD_V3_LIMITS.crossingClearance));
  assert.ok(graph.edges[0].samples.some(s=>s.structure==='bridge'));
  const samples=graph.edges[0].samples;
  assert.ok(samples.length>300);
  for(let i=1;i<samples.length;i++){
    assert.ok(samples[i].progress>samples[i-1].progress);
    assert.ok(Math.abs(samples[i].grade)<=ROAD_V3_LIMITS.maxGrade);
  }
  const crossing=graph.crossings[0],lower=roadV3SurfacesAt(graph,{x:crossing.x,z:crossing.z,y:8},13);
  assert.ok(lower.length>=2,'multiple levels remain spatially visible');
  const low=lower.reduce((a,b)=>a.y<b.y?a:b),high=lower.reduce((a,b)=>a.y>b.y?a:b);
  assert.ok(high.y-low.y>=ROAD_V3_LIMITS.crossingClearance-0.1);
  assert.ok(roadV3TerrainHeight(2,graph,{x:crossing.x,z:crossing.z})<high.y-3,'upper deck never carves lower terrain');
  assert.equal(roadV3TerrainHeight(2,graph,{x:9999,z:9999}),2);
  assert.deepEqual(roadV3Crossings(samples),graph.crossings,'crossings are regenerated exactly');
}
assert.throws(()=>generateRoadV3('',{}),TypeError);
assert.throws(()=>generateRoadV3('test',{rise:0,maxRise:0}),RangeError);
assert.equal(createEndlessHighway('old-version').generatorVersion,ROAD_GENERATOR_VERSION,'existing default remains V2');
const installed=createLongHaulRoadV3Kit(N);
const engine=N.createEngine({kits:[installed.kit]});
assert.equal(engine.n.longHaulRoadV3.getState().revision,0);
engine.n.longHaulRoadV3.generate('mountain-alpha');engine.tick(0);
assert.equal(engine.n.longHaulRoadV3.getState().revision,1);
assert.ok(engine.n.longHaulRoadV3.getState().graph.crossings.length);
engine.n.longHaulRoadV3.reset();engine.tick(0);
assert.equal(engine.n.longHaulRoadV3.getState().graph,null);
console.log('PASS V3 candidate road graph: deterministic loops, bridges, 3D levels, terrain, DSK and V2 isolation');
