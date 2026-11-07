import assert from 'node:assert/strict';
import { createRoadV3Stream, roadV3PointAt, roadV3WorldStreaming } from '../src/game/road-v3-journey.mjs';
import { roadV3SurfacesAt, roadV3TerrainHeight, ROAD_V3_LIMITS } from '../src/game/road-v3-geometry.mjs';
import { nearestRoad, naturalTerrainHeight, terrainHeight } from '../src/game/world-base.mjs';
import { createCourseCellDescriptor } from '../src/game/cell-descriptor.mjs';
import { createEndlessHighway } from '../src/game/endless-highway.mjs';
const near=(a,b,tolerance=.5)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} vs ${b}`);
for(let i=0;i<25;i++){
  const graph=createRoadV3Stream('v3-world:'+i);
  // The World Kit consumes the authoritative 3D graph without inventing another road.
  Object.assign(graph,{depots:[],signs:[],roundabouts:[],optionalRoads:[]});
  const crossing=graph.crossings[0];
  assert.ok(crossing?.kind==='bridge');
  const lower=roadV3PointAt(graph,crossing.lowerProgress),upper=roadV3PointAt(graph,crossing.upperProgress);
  near(lower.x,upper.x,1);near(lower.z,upper.z,1);
  const groundNear=nearestRoad(graph,{...lower,progressHint:crossing.lowerProgress});
  const bridgeNear=nearestRoad(graph,{...upper,progressHint:crossing.upperProgress});
  assert.ok(groundNear&&bridgeNear&&groundNear.edge.id===bridgeNear.edge.id);
  near(groundNear.progress,crossing.lowerProgress,3);
  near(bridgeNear.progress,crossing.upperProgress,3);
  // Height must prevent the stale route hint from snapping to the other deck.
  near(nearestRoad(graph,{...lower,progressHint:crossing.upperProgress}).progress,crossing.lowerProgress,3);
  near(nearestRoad(graph,{...upper,progressHint:crossing.lowerProgress}).progress,crossing.upperProgress,3);
  const levels=roadV3SurfacesAt(graph,{x:crossing.x,z:crossing.z},15);
  assert.ok(levels.some(v=>v.structure==='bridge')&&levels.some(v=>v.structure!== 'bridge'));
  const natural=naturalTerrainHeight(graph,crossing.x,crossing.z);
  const groundbed=roadV3TerrainHeight(natural,graph,{x:crossing.x,z:crossing.z});
  near(groundbed,lower.y-.4,.6);
  near(terrainHeight(graph,crossing.x,crossing.z),groundbed,.01);
  assert.ok(upper.y-groundbed>=ROAD_V3_LIMITS.crossingClearance,'upper bridge must not flatten terrain beneath');
  near(terrainHeight(graph,90000,90000),naturalTerrainHeight(graph,90000,90000),.01);
  const x=Math.floor(crossing.x/160),z=Math.floor(crossing.z/160);
  const cell={id:`world:${x}:${z}`,coordinates:[x,z],bounds:{minX:x*160,maxX:(x+1)*160,minZ:z*160,maxZ:(z+1)*160}};
  const patch=createCourseCellDescriptor(graph,cell,{terrainSegments:16});
  assert.ok(patch.roads.length>=2,'lower and upper surfaces share one spatial cell');
  assert.ok(patch.roads.every(r=>Number.isFinite(r.laneFactor)&&r.laneFactor===3));
  // A crossing on a cell boundary can assign its upper/lower road segments
  // to neighboring owners. The complete active neighborhood must retain both.
  const neighborhood=[];
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
    const cx=x+dx,cz=z+dz;
    neighborhood.push(...createCourseCellDescriptor(graph,{id:`world:${cx}:${cz}`,
      coordinates:[cx,cz],bounds:{minX:cx*160,maxX:(cx+1)*160,minZ:cz*160,maxZ:(cz+1)*160}},
      {terrainSegments:8}).roads);
  }
  assert.ok(neighborhood.some(r=>r.a.structure==='bridge'||r.b.structure==='bridge'),
    'upper crossing deck must have a spatial owner');
  assert.ok(neighborhood.some(r=>r.a.structure!=='bridge'&&r.b.structure!=='bridge'),
    'lower crossing deck must have a spatial owner');
  assert.ok(patch.terrain.heights.every(Number.isFinite));
  assert.ok(roadV3WorldStreaming(graph,lower).visibleEdges.includes(groundNear.edge.id));
  assert.ok(roadV3WorldStreaming(graph,upper).visibleEdges.includes(bridgeNear.edge.id));
}
// Regression guard: the V2 generator and roadbed remain unchanged by V3 routing.
const legacy=createEndlessHighway('v2-legacy');
assert.equal(legacy.generatorVersion,'long-haul-endless-v2');
assert.ok(Number.isFinite(terrainHeight(legacy,0,-400)));
console.log('PASS Road V3 World contract: 25 bridge cases, 3D road levels, terrain carving, cell ownership, V2 preservation');
