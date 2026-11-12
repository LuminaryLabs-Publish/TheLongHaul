import assert from 'node:assert/strict';
import {readFile,readFileSync} from 'node:fs';
import {createEndlessHighway,endlessHighwayPoint,advanceEndlessHighway} from '../src/game/endless-highway.mjs';
import {connectedTownReachability,generateConnectedTown,TOWN_ASSET_IDS} from '../src/game/connected-settlements.mjs';
import {createPlayableRoadV3Course,playableRoadV3Point} from '../src/game/road-v3-playable-course.mjs';
import {parseSettlementGlb,createSettlementGeometry} from '../src/game/settlement-glb.mjs';
import * as THREE from '../vendor/three.module.js';
const base=new URL('../assets/settlements/low-poly-neighborhood/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',base),'utf8'));
assert.equal(manifest.buildings.length,17);
assert.deepEqual(manifest.buildings.map(b=>b.id).sort(),[...TOWN_ASSET_IDS].sort());
let triangles=0;
for(const asset of manifest.buildings){
  const b=readFileSync(new URL(asset.file,base));const bytes=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
  const parsed=parseSettlementGlb(bytes);assert.ok(parsed.triangles>=asset.primitives*2,'authored model includes valid indexed triangles');
  const geometry=createSettlementGeometry(THREE,parsed);
  assert.ok(geometry.boundingBox.max.y>geometry.boundingBox.min.y);geometry.dispose();
  triangles+=parsed.triangles;
}
assert.throws(()=>parseSettlementGlb(new ArrayBuffer(100)),/Invalid settlement GLB/);
let towns=0,edges=0;
for(let i=0;i<100;i++){
  const seed=`connected-${i}`;
  const a=createEndlessHighway(seed,{progress:2800});
  const b=createEndlessHighway(seed,{progress:2800});
  assert.ok(a.towns.length>=1,'town in streaming window');
  assert.ok(connectedTownReachability(a),'all roads return to highway');
  assert.deepEqual(a.towns,b.towns,'seeded assemblies remain deterministic');
  for(const town of a.towns){
    towns++;assert.equal(town.parcels.length,manifest.buildings.length);
    assert.equal(new Set(town.parcels.map(p=>p.assetId)).size,manifest.buildings.length);
    const branch=a.branches.find(x=>x.id===`town:${town.id.split(':')[1]}:loop`);
    assert.ok(branch&&branch.nodeIds.length===5&&branch.edgeIds.length===4);
    for(const id of branch.edgeIds){const e=a.edges.find(e=>e.id===id);assert.ok(e && e.optional && e.samples.length===33);edges++;}
    const first=a.edges.find(e=>e.id===branch.edgeIds[0]);const last=a.edges.find(e=>e.id===branch.edgeIds.at(-1));
    assert.deepEqual([first.from,last.to],[town.entryNodeId,town.exitNodeId]);
  }
  const original=JSON.stringify(a.towns);
  advanceEndlessHighway(a,5400);
  advanceEndlessHighway(a,2800);
  assert.equal(JSON.stringify(a.towns),original,'revisit exactly reconstructs a released town');
}
const modern=createPlayableRoadV3Course('haul-winding-connected-v3',{progress:2800});
assert.equal(modern.generatorVersion,'long-haul-endless-v3');
assert.ok(modern.towns.length&&connectedTownReachability(modern));
assert.equal(modern.towns[0].parcels.length,17);
const centerline=[0,320,640,960,1280,1600,1920,2240,2560,2880,3200,3520,3840,4160,4480,4800].map(progress=>playableRoadV3Point(modern,progress).x);
assert.ok(Math.max(...centerline)-Math.min(...centerline)>250,'new terrain-following default has substantial curves');
for(const town of modern.towns)for(const parcel of town.parcels)assert.ok([parcel.x,parcel.y,parcel.z,parcel.heading].every(Number.isFinite));
const host=readFileSync(new URL('../src/app/connected-town-host.js',import.meta.url),'utf8');
assert.match(host,/parseSettlementGlb/);assert.match(host,/obstacleCandidates/);assert.match(host,/MAX_VISIBLE_DISTANCE/);
const bootstrap=readFileSync(new URL('../src/app/bootstrap.mjs',import.meta.url),'utf8');
assert.match(bootstrap,/connected-town-host\.js/);
const roadAdapter=readFileSync(new URL('../src/app/endless-roads.js',import.meta.url),'utf8');
assert.match(roadAdapter,/roadV2Fallback \? ROAD_GENERATOR_VERSION : ROAD_V3_VERSION/);
console.log(JSON.stringify({status:'PASS',models:manifest.buildings.length,modelTriangles:triangles,seededTowns:towns,townRoadEdges:edges,legacyPreserved:true,v3Ready:true,visualGpuVerified:false}));
