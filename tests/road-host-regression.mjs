import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import { ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION, roadChunkAt, roadChunkSample } from '../src/game/road-chunks.mjs';
import { roadRibbonData } from '../src/game/road-surface.mjs';
import { resolveRoadStructureContact } from '../src/game/road-structure-contact.mjs';
import {createEndlessHighway, endlessHighwayPoint, endlessHighwayProgress, advanceEndlessHighway} from '../src/game/endless-highway.mjs';
import {ROAD_V3_VERSION} from '../src/game/road-v3-geometry.mjs';
import {createPlayableRoadV3Course,advancePlayableRoadV3Course,playableRoadV3Point,playableRoadV3Progress} from '../src/game/road-v3-playable-course.mjs';
import { createCourseCellDescriptor } from '../src/game/cell-descriptor.mjs';
// Unit test of the actual host adapter with real Three.js geometry. The base
// host/service boundaries below are explicit doubles; this is NOT a browser,
// pixel, end-to-end or WebGL acceptance result.
const counters = { base: 0, refresh: 0, batch: 0, traffic: 0, post: 0, damage: 0 };
let frozen=false, truck, rawTime=1;
const c = {
  THREE, ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION, roadChunkAt, roadChunkSample,
  roadRibbonData, resolveRoadStructureContact, createEndlessHighway,
  ROAD_V3_VERSION, endlessHighwayPoint, endlessHighwayProgress, advanceEndlessHighway,
  createPlayableRoadV3Course,advancePlayableRoadV3Course,playableRoadV3Point,playableRoadV3Progress,
  location:{search:''},
  course: createEndlessHighway('road-matrix-1'), freightResumeCheckpoint: null,
  runKey: 'run-1', cameraMode:0, cameraTarget:null, smoothing:{setTarget:(_id,value)=>c.cameraTarget=value}, updateCameraTarget:()=>{}, clamp: (n,a,b)=>Math.max(a,Math.min(b,n)),
  generateEndlessCourse: () => { throw Error('old generator unexpectedly called'); },
  ribbonGeometry: () => 'legacy-geometry', _lhRoadLine: ()=> 'legacy-line',
  cellHosts: new Map(), geometries: { box:new THREE.BoxGeometry(), cone:new THREE.ConeGeometry() },
  materials: {yellow:new THREE.MeshBasicMaterial({color:0xffcc00})},
  mesh(geometry, material, position, scale, rotation={}) {
    const m=new THREE.Mesh(geometry,material);m.position.set(position.x,position.y,position.z);
    m.scale.set(scale.x,scale.y,scale.z);m.rotation.y=rotation.y??0;return m;
  },
  realizeCell(patch) {
    counters.base++;const group=new THREE.Group(),owned={geometries:[]},entry={group,owned,obstacles:[]};
    const geometry=c.ribbonGeometry(patch.roads,1,.12);owned.geometries.push(geometry);
    group.add(new THREE.Mesh(geometry,c.materials.yellow));
    for(const road of patch.roads) c._lhRoadLine(group,road,1.7,.12,c.materials.yellow,true);
    c.cellHosts.set(patch.cellId,entry);
  },
  refreshObstacles:()=>counters.refresh++, batchCellStatics:()=>counters.batch++,
  planFreightEncounters:()=>c.events, freightProtectedProgress:()=>false,
  arcadeGarageSite:()=>({allowed:true}), arcadeVehicles:[],arcadeEncounters:[],
  arcadeTrafficUpdate:()=>counters.traffic++, simulationFrozen:()=>frozen,
  postTickGameplay:()=>counters.post++, currentScene:()=>'driving',
  readTruck:()=>truck,readRun:()=>({rawTime}),
  engine:{n:{longHaulRoadV3:{buildPlayable:createPlayableRoadV3Course},longHaulTruck:{snapshot:()=>truck,loadSnapshot:s=>{truck=s;}}}},
  spendTruckDamage:()=>counters.damage++,spendCargoDamage:()=>{},resetArcadeCombo:()=>{},audio:{hit:()=>{}},arcadeRecord:()=>{},
  realizeHorizonCell:()=>{},horizonHosts:new Map(), render_game_to_text:()=>JSON.stringify({scene:'driving'})
};
c.window=c;vm.runInNewContext(readFileSync(new URL('../src/app/endless-roads.js',import.meta.url),'utf8'),c,{timeout:1000});
assert.equal(c.__longHaulRoadsReady,true);
assert.equal(c.generateEndlessCourse('new').generatorVersion,ROAD_GENERATOR_VERSION);
c.freightResumeCheckpoint={journey:{progress:1500},truck:{position:{x:11,z:-1500},heading:3}};
assert.equal(c.generateEndlessCourse('old').generatorVersion,LEGACY_ROAD_VERSION);
assert.equal(c.generateEndlessCourse('old').origin.x,11);c.freightResumeCheckpoint=null;
assert.equal(c.ribbonGeometry([{modular:false}],1,.12),'legacy-geometry');
let structures=0,paint=0;const featureProgress={};
for(let i=0;i<12;i++) {
  const p=960+i*960,chunk=roadChunkAt(c.course.seed,p);featureProgress[chunk.kind]=p;
  c.course=createEndlessHighway('road-matrix-1',{progress:p});const point=roadChunkSample(c.course.seed,p);
  const cx=Math.floor(point.x/160),cz=Math.floor(point.z/160);
  const patch=createCourseCellDescriptor(c.course,{id:`${cx}:${cz}`,coordinates:[cx,cz],bounds:{minX:cx*160,maxX:(cx+1)*160,minZ:cz*160,maxZ:(cz+1)*160}},{terrainSegments:8});
  const original=JSON.stringify(patch);c.realizeCell(patch);assert.equal(JSON.stringify(patch),original,'host does not mutate worker descriptors');
  const entry=c.cellHosts.get(patch.cellId);assert.ok(entry.group.isGroup);assert.ok(entry.owned.geometries.length>=1);
  assert.equal(entry.group.userData.roadPaint,undefined,'paint batches released after realization');
  for(const geom of entry.owned.geometries) {
    const attr=geom.getAttribute('position');assert.ok(attr&&[...attr.array].every(Number.isFinite));
    assert.ok(geom.boundingSphere.radius>0);paint++;
  }
  if(['tunnel','bridge'].includes(chunk.kind)){assert.ok(entry.group.children.length>5,'solid structure geometry instantiated');structures++;}
  if(chunk.kind==='construction')assert.ok(entry.obstacles.length>0,'visible cones have actual hazard contacts');
  entry.group.traverse(node=>{if(node.isMesh) assert.ok(node.material&&node.geometry,'all objects own real Three.js assets');});
  for(const geom of entry.owned.geometries)geom.dispose();c.cellHosts.delete(patch.cellId);
}
assert.equal(structures,2);
c.events=Object.entries(featureProgress).map(([kind,p])=>({kind:'ramp',absoluteProgress:p,sourceKind:kind}));
assert.ok(c.planFreightEncounters().every(e=>!['bridge','tunnel','lane-transition','construction'].includes(e.sourceKind)));
for(const kind of ['bridge','tunnel','lane-transition','construction'])assert.equal(c.arcadeGarageSite({modular:true,chunk:{kind}}),null);
assert.ok(c.arcadeGarageSite({modular:true,chunk:{kind:'straight'}}));
const group=new THREE.Group();group.visible=true;group.position.z=-featureProgress.sweep;
c.arcadeVehicles=[{active:true,id:'vehicle-1',path:'p',progress:300,lane:6.2,direction:1,group}];
c.arcadeEncounters=[{kind:'roadblock',path:'p',distance:320}];c.arcadeTrafficUpdate(1/60);
assert.equal(c.arcadeVehicles[0].lane,6.2,'hazard escape lane survives');
c.arcadeVehicles[0].id='vehicle-2';c.arcadeEncounters=[];c.arcadeTrafficUpdate(1/60);
assert.ok(Math.abs(c.arcadeVehicles[0].lane)<=3.4,'quiet road cars use through lanes');
frozen=true;c.arcadeVehicles[0].id='vehicle-3';c.arcadeVehicles[0].lane=6.2;c.arcadeTrafficUpdate(1/60);assert.equal(c.arcadeVehicles[0].lane,6.2);frozen=false;
const p=roadChunkSample(c.course.seed,featureProgress.tunnel);
c.updateCameraTarget({position:p,velocity:{x:0,z:-25}},{});
assert.ok(c.cameraTarget.position[1] < p.y+8.2 && c.cameraTarget.position[1] > p.y+4.7,'chase camera enters gallery, below roof and above truck');

truck={position:{x:p.x+p.nx*12,y:p.y+.5,z:p.z+p.nz*12},velocity:{x:p.nx*8,y:0,z:-20},heading:p.heading};
c.postTickGameplay({},1/60);truck.position={x:p.x+p.nx*14,y:p.y+.5,z:p.z+p.nz*14};c.postTickGameplay({},1/60);
assert.equal(counters.damage,1,'structure impact reaches existing damage authority');
c.runKey='run-2';rawTime=.1;truck.position={x:p.x+p.nx*12,y:p.y+.5,z:p.z+p.nz*12};c.postTickGameplay({},1/60);
truck.velocity={x:p.nx*8,y:0,z:-20};truck.position={x:p.x+p.nx*14,y:p.y+.5,z:p.z+p.nz*14};c.postTickGameplay({},1/60);
assert.equal(counters.damage,2,'new run does not inherit old impact cooldown');
assert.ok(JSON.parse(c.render_game_to_text()).road.generatorVersion===ROAD_GENERATOR_VERSION);
assert.equal(counters.base,12);assert.equal(counters.batch,12);
console.log(JSON.stringify({status:'PASS',scope:'actual host adapter + real Three geometry; explicit base-service doubles; no rendering',features:12,structures,geometryChecks:paint,...counters}));
