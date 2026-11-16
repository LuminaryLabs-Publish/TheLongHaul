import test from 'node:test';
import assert from 'node:assert/strict';
import { CELL_SIZE } from '../src/game/shared.mjs';
import { ROAD_V3_VERSION, roadV3TerrainHeight, roadV3SurfacesAt } from '../src/game/road-v3-geometry.mjs';
import {roadJunctionsInCell,intersectionTerrainSegments,roadStructurePositionAllowed,roadSceneryPositionAllowed,JUNCTION_TERRAIN_SEGMENTS} from '../src/game/road-junction-clearance.mjs';
import {createCourseCellDescriptor} from '../src/game/cell-descriptor.mjs';
import {sampleTerrainTriangle} from '../src/game/world-contact.mjs';
import {createRoadV3Stream,roadV3PointAt} from '../src/game/road-v3-journey.mjs';
import {createPlayableRoadV3Course} from '../src/game/road-v3-playable-course.mjs';
import {attachFreightTerminalStart} from '../src/game/freight-terminal-start.mjs';

function edge(id,points,{width=14,structure=null}={}){
 const samples=points.map((point,i)=>({x:point[0],y:point[1],z:point[2],structure,width,bank:0,
  nx:id==='cross-a'?0:1,nz:id==='cross-a'?-1:0,grade:0,progress:i*100}));
 return {id,from:id+':start',to:id+':end',width,branchId:id,type:'road',surface:'paved',modular:true,
  laneFactor:3,samples};
}
function graph(high=2){
 const a=edge('cross-a',[[15,0,-72],[145,0,-72]],{width:14});
 const b=edge('cross-b',[[72,high,-150],[72,high,-12]],{width:12});
 return {seed:'intersection-clearance-fixture',generatorVersion:ROAD_V3_VERSION,edges:[a,b],
  depots:[],signs:[],roundabouts:[],optionalRoads:[],towns:[],maxRoadWidth:14};
}
const bounds={minX:0,maxX:160,minZ:-160,maxZ:0};
const cell={id:'test:cross',coordinates:[0,-1],bounds};
const near=(a,b,tolerance=0.001)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);

test('all physical at-grade road intersections receive local clearance tessellation',()=>{
 const g=graph();const intersections=roadJunctionsInCell(g,bounds);
 assert.ok(intersections.some(p=>Math.hypot(p.x-72,p.z+72)<.01));
 assert.equal(intersectionTerrainSegments(g,bounds,16),JUNCTION_TERRAIN_SEGMENTS);
 assert.equal(intersectionTerrainSegments(g,{minX:500,maxX:660,minZ:500,maxZ:660},16),16);
});
test('terrain below the lowest drivable crossing plane, not the highest road',()=>{
 const g=graph(3);
 near(roadV3TerrainHeight(30,g,{x:72,z:-72}),-.55);
 for(const x of [69,71,72,73,75])for(const z of [-75,-73,-72,-71,-69]){
  const earth=roadV3TerrainHeight(27,g,{x,z});
  assert.ok(earth<=-.549,`Terrain protrudes into lower pavement at (${x},${z}): ${earth}`);
 }
});
test('actual streamed terrain triangles stay below both intersecting pavements',()=>{
 const g=graph(2.5),patch=createCourseCellDescriptor(g,cell,{terrainSegments:16});
 assert.equal(patch.terrain.segments,JUNCTION_TERRAIN_SEGMENTS);
 let worst=-Infinity;
 for(let x=68;x<=76;x+=1)for(let z=-76;z<=-68;z+=1){
  const earth=sampleTerrainTriangle(patch,x,z)?.height;
  assert.ok(Number.isFinite(earth));worst=Math.max(worst,earth);
  assert.ok(earth<=-.08,`Triangulated earth ${earth} covers at-grade road at ${x},${z}`);
 }
 assert.ok(worst<=-.08);
});
test('upper bridge deck remains, lower road gets clearance and bridge piers are excluded',()=>{
 const g=graph();g.edges[1]=edge('cross-b',[[72,10,-150],[72,10,-12]],{width:12,structure:'bridge'});
 near(roadV3TerrainHeight(20,g,{x:72,z:-72}),-.55);
 assert.equal(roadStructurePositionAllowed(g,{x:72,z:-72},{ownerEdgeId:'cross-b',kind:'rail',roadY:10}),true);
 assert.equal(roadStructurePositionAllowed(g,{x:72,z:-72},{ownerEdgeId:'cross-b',kind:'pier',roadY:10,verticalReach:11}),false);
});
test('valid bridge decks still cut shallow earth interference without erasing spans',()=>{
 const g=graph();g.edges=[edge('bridge-only',[[15,10,-72],[145,10,-72]],{width:14,structure:'bridge'})];
 const soil=roadV3TerrainHeight(10.5,g,{x:72,z:-72});
 assert.ok(soil<=9.6,`Existing bridge deck buried by ground ${soil}`);
});
test('at-grade rail and tunnel roof may not close another drivable lane',()=>{
 const g=graph(1.1);
 assert.equal(roadStructurePositionAllowed(g,{x:72,z:-72},{ownerEdgeId:'cross-b',kind:'rail',roadY:1.1}),false);
 assert.equal(roadStructurePositionAllowed(g,{x:72,z:-72},{ownerEdgeId:'cross-b',kind:'roof',roadY:1.1}),false);
 assert.equal(roadStructurePositionAllowed(g,{x:72,z:-72},{ownerEdgeId:'cross-b',kind:'wall',roadY:1.1}),false);
 assert.equal(roadStructurePositionAllowed(g,{x:130,z:-130},{ownerEdgeId:'cross-b',kind:'roof',roadY:1.1}),true);
});
test('roadside props never overlap either branch of a crossing',()=>{
 const g=graph();
 assert.equal(roadSceneryPositionAllowed(g,72,-72,5),false);
 assert.equal(roadSceneryPositionAllowed(g,72,-102,5),false); // Cross-road only.
 assert.equal(roadSceneryPositionAllowed(g,102,-72,5),false); // Highway only.
 assert.equal(roadSceneryPositionAllowed(g,145,-145,5),true);
});
test('V2 and distant terrain unchanged',()=>{
 const v2={...graph(),generatorVersion:'long-haul-endless-v2'};
 assert.equal(roadJunctionsInCell(v2,bounds).length,0);
 assert.equal(intersectionTerrainSegments(v2,bounds,16),16);
 near(roadV3TerrainHeight(11,graph(),{x:999,z:999}),11);
});
test('real V3 stream builds bounded detailed terrain at a grade-separated crossing',()=>{
 const g=createRoadV3Stream('v3-world:0');
 Object.assign(g,{depots:[],signs:[],roundabouts:[],optionalRoads:[]});
 const p=g.crossings[0],cx=Math.floor(p.x/CELL_SIZE),cz=Math.floor(p.z/CELL_SIZE);
 const cell={id:`real:${cx}:${cz}`,coordinates:[cx,cz],bounds:{minX:cx*CELL_SIZE,maxX:(cx+1)*CELL_SIZE,minZ:cz*CELL_SIZE,maxZ:(cz+1)*CELL_SIZE}};
 const patch=createCourseCellDescriptor(g,cell,{terrainSegments:16});
 assert.equal(patch.terrain.segments,JUNCTION_TERRAIN_SEGMENTS);
 const ground=sampleTerrainTriangle(patch,p.x,p.z)?.height;
 assert.ok(Number.isFinite(ground));
 const lowest=roadV3PointAt(g,g.crossings[0].lowerProgress),upper=roadV3PointAt(g,g.crossings[0].upperProgress);
 const surfaces=roadV3SurfacesAt(g,{x:p.x,z:p.z},15);
 assert.ok(surfaces.some(s=>s.structure==='bridge')); 
 assert.ok(ground<=lowest.y+.8,`Ground ${ground} rises above lower road ${lowest.y}`);
 assert.ok(ground<upper.y-1.5,'Bridge must retain headroom at the lower road');
});

test('real seeded terminal, merge, branch and town junctions contain no protruding earth triangles',()=>{
 let tested=0;
 for(let i=0;i<5;i++){
  const course=createPlayableRoadV3Course(`haul-terminal-cohesive-crossings-${i}`,{progress:1700});
  attachFreightTerminalStart(course);
  const patches=new Map();
  for(const node of course.nodes){
   if(!Number.isFinite(node.x)||!Number.isFinite(node.z))continue;
   const roads=roadV3SurfacesAt(course,{x:node.x,z:node.z},16)
     .filter(s=>s.structure!=='bridge'&&s.distance<s.width/2-1);
   if(new Set(roads.map(s=>s.edgeId)).size<2)continue;
   const cx=Math.floor(node.x/CELL_SIZE),cz=Math.floor(node.z/CELL_SIZE),key=`${cx}:${cz}`;
   if(!patches.has(key))patches.set(key,createCourseCellDescriptor(course,{id:key,coordinates:[cx,cz],
     bounds:{minX:cx*CELL_SIZE,maxX:(cx+1)*CELL_SIZE,minZ:cz*CELL_SIZE,maxZ:(cz+1)*CELL_SIZE}},
     {terrainSegments:16}));
   const earth=sampleTerrainTriangle(patches.get(key),node.x,node.z)?.height;
   const lowest=Math.min(...roads.map(r=>r.y+r.bank*((node.x-r.x)*r.nx+(node.z-r.z)*r.nz)));
   assert.ok(earth<=lowest-.07,`World soil ${earth} rises through road ${lowest} at ${node.id}`);
   tested++;
  }
 }
 assert.ok(tested>=70,`Insufficient real intersecting road nodes: ${tested}`);
});
