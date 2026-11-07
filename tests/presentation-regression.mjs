import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cloudBankDescriptors, wrapCloudOffset, ATMOSPHERE_PROFILE, atmosphericRollOff, landscapeRelief, landscapeTint, freightHudModel } from '../src/game/landscape-style.mjs';
import { createEndlessHighway, endlessHighwayPoint } from '../src/game/endless-highway.mjs';
import { terrainHeight, naturalTerrainHeight, terrainNoise } from '../src/game/world-base.mjs';
import { buildTreeMeshData } from '../src/game/tree-mesh-builder.mjs';
import { createCourseCellDescriptor } from '../src/game/cell-descriptor.mjs';
import { CELL_SIZE } from '../src/game/shared.mjs';
const seed='presentation-acceptance-2026', course=createEndlessHighway(seed);
const clouds=cloudBankDescriptors(seed);
assert.deepEqual(clouds,cloudBankDescriptors(seed));assert.notDeepEqual(clouds,cloudBankDescriptors('other'));
assert.equal(clouds.length,24);assert.deepEqual([0,1,2].map(layer=>clouds.filter(c=>c.layer===layer).length),[8,8,8]);
assert.ok(clouds.every(c=>c.altitude>=350&&c.follow>=.95&&c.follow<1));
assert.ok(clouds.filter(c=>c.layer===0).every(c=>c.depth>700));
assert.ok(clouds.filter(c=>c.layer===1).every(c=>c.depth>900));
assert.ok(clouds.filter(c=>c.layer===2).every(c=>c.depth>1200));
assert.deepEqual([...new Set(clouds.map(c=>c.type))].sort(),['cirrus','cumulonimbus','cumulus','stratus']);
assert.ok(clouds.every(c=>c.width>0&&c.height>0));
assert.ok(clouds.filter(c=>c.layer===0).every(c=>c.follow<clouds[8].follow));
assert.ok(clouds.filter(c=>c.layer===2).every(c=>c.follow>clouds[8].follow));
assert.equal(clouds.every(c=>c.lateral>=-c.span/2&&c.lateral<=c.span/2),true);
assert.ok(clouds.every(c=>c.depth>0&&c.wind>0));
for(const sample of [0,12.5,1000,-1000,1000000]){
  const wrapped=wrapCloudOffset(sample,250);
  assert.ok(wrapped>=-125&&wrapped<125);
  assert.ok(Math.abs(wrapCloudOffset(sample+250,250)-wrapped)<1e-7);
}
const near=clouds[0],middle=clouds[8],far=clouds[16];
assert.ok((1-near.follow)>(1-middle.follow)&&(1-middle.follow)>(1-far.follow),'Parallax travel factors diminish by layer');
assert.equal(wrapCloudOffset(0,100),0);
assert.ok(Math.abs(wrapCloudOffset(120,100)-20)<1e-9);
assert.ok(Math.abs(wrapCloudOffset(-120,100)+20)<1e-9);
assert.equal(atmosphericRollOff(0),0);assert.equal(atmosphericRollOff(999),0);
let last=0;for(let d=1000;d<3000;d+=10){const drop=atmosphericRollOff(d);assert.ok(drop>=last&&Number.isFinite(drop));last=drop;}
assert.ok(ATMOSPHERE_PROFILE.rainNear>=180&&ATMOSPHERE_PROFILE.rainFar>1000);
for(let i=0;i<240;i++){
  const s=i*43, p=endlessHighwayPoint(course,s);
  assert.ok(Number.isFinite(naturalTerrainHeight(course,p.x+500,p.z)));
  assert.equal(landscapeRelief(seed,p.x,p.z),0,'Road corridor is not raised by scenic hills');
  assert.deepEqual(landscapeTint(seed,p.x,p.z,0),landscapeTint(seed,p.x,p.z,0));
  assert.ok(landscapeTint(seed,p.x,p.z,100).every(v=>v>0&&v<1));
  assert.equal(naturalTerrainHeight({seed,generatorVersion:'long-haul-endless-v1'},p.x+500,p.z),terrainNoise(p.x+500,p.z,seed),'Legacy ground unchanged');
}
// Adjacent worker cells share their exact terrain boundary; coarse/near color is
// sampled from one world-coordinate function rather than a separate palette.
const cell=x=>({id:`test:${x}`,coordinates:[x,0],bounds:{minX:x*CELL_SIZE,maxX:(x+1)*CELL_SIZE,minZ:0,maxZ:CELL_SIZE}});
const a=createCourseCellDescriptor(course,cell(2),{terrainSegments:20}),b=createCourseCellDescriptor(course,cell(3),{terrainSegments:20});
for(let i=0;i<=20;i++){assert.equal(a.terrain.heights[i*21+20],b.terrain.heights[i*21]);assert.deepEqual(a.terrain.colors[i*21+20],b.terrain.colors[i*21]);}
for(const variant of ['a','b']){
  const trees=Array.from({length:12},(_,i)=>({id:`tree-${i}`,variant,position:[i*20,0,0],scale:[1,1,1],rotation:0}));
  const mesh=buildTreeMeshData(trees,{}),far=buildTreeMeshData(trees,{visualOnly:true});
  assert.ok(mesh.positions.length>0&&far.positions.length>0);assert.ok(mesh.positions.every(Number.isFinite));
  assert.ok(far.indices.length<mesh.indices.length);assert.ok(mesh.indices.length/3/trees.length<350,'Stable broad canopies stay within a small geometry budget');
}
const freight={status:'delivered',onboard:false,contract:{id:'x',massKg:6200,deliveryProgress:1000,pickupProgress:480,remaining:80}};
let hud=freightHudModel(freight,{z:-1000},80,50);assert.equal(hud.transition,true);assert.equal(hud.mass,'');assert.match(hud.next,/next contract/);
hud=freightHudModel({...freight,status:'in-transit',onboard:true,contract:{...freight.contract,remaining:12}},{z:-900},74,50);assert.equal(hud.urgent,true);assert.equal(hud.next,'Receiver · 100 m');assert.match(hud.mass,/74% cargo/);
hud=freightHudModel({...freight,status:'awaiting-pickup'},{z:-300},100,50);assert.equal(hud.urgent,false);assert.match(hud.mass,/awaiting pickup/);
const host=await readFile(new URL('../src/app/visual-presentation.js',import.meta.url),'utf8');
assert.match(host,/cloudRoot\.removeFromParent/);assert.match(host,/new THREE\.Fog/);assert.doesNotMatch(host,/teleport|setCargo|meters\.set\(/);
assert.match(host,/ensureCloudLayout\(activeCloudSeed\(\)\)/,'Clouds combine the course with a run-specific visual seed');
assert.match(host,/if\(nextSeed===cloudSeed\)return/,'Unchanged worlds reuse the same GPU instance layout');
assert.match(host,/cloudMesh\.computeBoundingSphere\(\)/,'Changing a layout refreshes culling bounds');
assert.match(host,/cloudLayoutUpdates/,'Runtime exposes cloud update evidence');
assert.match(host,/cloudBankDescriptors, wrapCloudOffset/);
assert.match(host,/wrapCloudOffset/);assert.match(host,/positionClouds\(state,skillVisualTime\)/);
assert.match(host,/cloudEye\.copy\(camera\.position\)/);
assert.match(host,/cloudViewUp/);
assert.match(host,/cloudPositioning:'world-biased-high-sky'/);
assert.match(host,/const cloudTurnInfluence=\.02/);
assert.match(host,/cloudPosition\.y=Math\.max/);
assert.match(host,/gl_FragDepth=0\.999999/);
assert.match(host,/cloudForwardProgress=Math\.max\(0,-state\.position\.z\)/);
assert.doesNotMatch(host,/cloudTravelX|cloudTravelZ/);
assert.match(host,/cloudDepthPolicy:'background-depth'/);
assert.match(host,/cloudVisibilityScale:\[2\.8,3\.1,3\.4\]/);
assert.match(host,/clearCloud:new THREE.Color\(0xfffaf2\)/);
assert.match(host,/gl_FragColor=vec4\(base,coverage\*\(vType>1\.5\?\.94:1\.\)\)/);
assert.match(host,/const screenY=\.53/);
assert.match(host,/cloudLayers:cloudLayerCounts\.slice\(\)/);
assert.match(host,/startGeneration=function\(\.\.\.args\)/);
assert.match(host,/cloudRunSeed=makeCloudRunSeed\(\);cloudRunNumber\+\+/);
assert.match(host,/sky-run:/);
assert.match(host,/cloud-sdf-types/);assert.match(host,/sunFacing/);assert.match(host,/cloudSdfInstances:count/);
assert.match(host,/new THREE\.PlaneGeometry\(1,1\)/);assert.doesNotMatch(host,/new THREE\.SphereGeometry\(1,12,7\)/);
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/id="campaign-coming-soon"[^>]*disabled/);assert.match(html,/campaign.html#garage/);
console.log('PASS presentation: seeded clouds, 240 relief samples, legacy terrain, worker seams, broad canopy geometry, HUD transition/urgency, preserved Campaign boundary.');
