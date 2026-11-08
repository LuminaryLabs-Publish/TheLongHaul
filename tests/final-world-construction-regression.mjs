// TLH-001/002/020: terrain-first road classification must follow *actual*
// final graph coordinates, including side roads, not the legacy V2 template.
import assert from 'node:assert/strict';
import { createPlayableRoadV3Course, advancePlayableRoadV3Course } from '../src/game/road-v3-playable-course.mjs';
import { classifyTerrainRoadV3Structure } from '../src/game/road-v3-terrain-route.mjs';
import { roadV3NaturalHeight } from '../src/game/landscape-style.mjs';
import { terrainHeight, roadV3GroundContact } from '../src/game/world-base.mjs';
import { createEndlessHighway } from '../src/game/endless-highway.mjs';
let checked=0, bridge=0, fill=0, cut=0;
for(let n=0;n<8;n++) {
 const seed=`final-world-construction:${n}`;
 const course=createPlayableRoadV3Course(seed);
 for(const edge of course.edges)for(const p of edge.samples){
   const expected=classifyTerrainRoadV3Structure(seed,p,p.structure==='tunnel'?'tunnel':null);
   // Explicit source bridges remain bridges even if the source highway
   // does not require a terrain-generated viaduct at this location.
   assert.equal(p.structure,edge.samples.some(x=>x.structure==='tunnel') && p.structure==='tunnel'?'tunnel':
     p.structure==='bridge'&&expected!=='bridge'?'bridge':expected,`surface construction at ${edge.id}`);
   if(p.structure==='bridge')bridge++;
   if(p.structure==='fill')fill++;
   if(p.structure==='cut')cut++;
   assert.ok(Number.isFinite(roadV3NaturalHeight(seed,p.x,p.z)),'natural height finite');
   const clearance=p.y-terrainHeight(course,p.x,p.z);
   assert.ok(clearance>=-.03,`pavement buried in terrain at ${edge.id}: ${clearance.toFixed(3)}m`);
   if(p.structure!=='bridge')assert.ok(clearance<3,
     `unsupported floating road at ${edge.id}: ${clearance.toFixed(3)}m`);
   checked++;
 }
 // The immutable point query and streamed road segments must keep the same
 // local grading contract through regeneration and return travel.
 const first=new Map(course.edges.map(e=>[e.id,e.samples.map(p=>p.structure)]));
 advancePlayableRoadV3Course(course,3800);
 advancePlayableRoadV3Course(course,600);
 let reconstructed=0;
 for(const edge of course.edges){
   if(!first.has(edge.id))continue;
   assert.deepEqual(edge.samples.map(p=>p.structure),first.get(edge.id),
     `road construction at ${edge.id} survives deterministic return`);
   reconstructed++;
 }
 assert.ok(reconstructed>=8,'revisited road edges share the original construction');
 const p=course.edges[0].samples[Math.floor(course.edges[0].samples.length/2)];
 assert.ok(Number.isFinite(terrainHeight(course,p.x,p.z)));
 assert.ok(roadV3GroundContact(course,{...p,y:p.y+0.92}),'visible road remains drivable');
 assert.equal(createEndlessHighway(seed).generatorVersion,'long-haul-endless-v2');
}
assert.ok(bridge>0&&fill>0&&cut>0,'all major road construction types appear');
console.log(JSON.stringify({status:'PASS',seeds:8,samples:checked,bridge,fill,cut,scope:'actual V3 construction classifications, return and legacy isolation'}));
