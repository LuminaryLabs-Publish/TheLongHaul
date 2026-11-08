// V3 authored scenery follows the *actual* terrain-road corridor rather than
// the V2 -Z world axis. This proves deterministic 200 m tile/160 m cell data,
// not browser rendering or final GLB asset availability.
import assert from 'node:assert/strict';
import {createPlayableRoadV3Course,playableRoadV3Point} from '../src/game/road-v3-playable-course.mjs';
import {roadChunkAt} from '../src/game/road-chunks.mjs';
import {createCourseCellDescriptor} from '../src/game/cell-descriptor.mjs';
import {planEnvironmentCell} from '../src/game/environment-tile-planner.mjs';
import {nearestRoad,terrainHeight} from '../src/game/world-base.mjs';
const seed='road-v3-env-cell',course=createPlayableRoadV3Course(seed),seen=new Set();
let total=0,checked=0;const propIds=new Set();
const pointAt=s=>{const p=playableRoadV3Point(course,s),chunk=roadChunkAt(seed,s);
  return {...p,kind:chunk.kind,chunkId:chunk.id};};
for(let s=320;s<2900;s+=140){
 const p=pointAt(s),cx=Math.floor(p.x/160),cz=Math.floor(p.z/160),id=`${cx}:${cz}`;
 if(seen.has(id))continue;seen.add(id);
 const bounds={minX:cx*160,maxX:(cx+1)*160,minZ:cz*160,maxZ:(cz+1)*160};
 const patch=createCourseCellDescriptor(course,{id,coordinates:[cx,cz],bounds},{terrainSegments:8});
 if(!patch.roads.length)continue;
 const values=patch.roads.flatMap(r=>[r.a.progress,r.b.progress]);
 const options={quality:true,terrainHeight:(x,z)=>terrainHeight(course,x,z),
  roadPoint:pointAt,roadProgressBounds:{min:Math.min(...values),max:Math.max(...values)},
  roadSafety:(x,z,margin)=>{const hit=nearestRoad(course,{x,z});return !hit||hit.distance>=hit.edge.width/2+margin}};
 const a=planEnvironmentCell(seed,bounds,options),b=planEnvironmentCell(seed,bounds,options);
 assert.deepEqual(a,b,'V3 authored tile stream is deterministic');
 for(const obj of a.objects){
   assert.ok(obj.position.x>=bounds.minX&&obj.position.x<bounds.maxX);
   assert.ok(obj.position.z>=bounds.minZ&&obj.position.z<bounds.maxZ);
   assert.ok(Number.isFinite(obj.position.y));
   assert.ok(!propIds.has(obj.id),'each authored prop has one owning cell');propIds.add(obj.id);
 }
 total+=a.objects.length;checked++;
}
assert.ok(checked>=6,'representative V3 world cells have owned road geometry');
assert.ok(total>0,'authored scenery follows V3 driving corridor');
console.log(JSON.stringify({status:'PASS',scope:'V3 road-aligned 200m environment overlays with 160m cell ownership',checked,total}));
