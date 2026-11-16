import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableRoadV3Course,advancePlayableRoadV3Course} from '../src/game/road-v3-playable-course.mjs';
import {createCourseCellDescriptor} from '../src/game/cell-descriptor.mjs';
import {terrainHeight} from '../src/game/world-base.mjs';
import {roadSceneryPositionAllowed} from '../src/game/road-junction-clearance.mjs';
import {planEnvironmentTile} from '../src/game/environment-tile-planner.mjs';
import {UTILITY_SPACING,utilityPoleAt,planRoadsideUtilitiesForCell,utilityCableVertices} from '../src/game/roadside-utilities.mjs';
import {authoredEnvironmentObject} from '../src/game/environment-tile-authoring.mjs';
import {authoredPropCollider} from '../src/game/world-contact.mjs';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const seed='haul-procedural-safe-pass2-test';
const course=createPlayableRoadV3Course(seed,{progress:0});
const heightAt=(x,z)=>terrainHeight(course,x,z);
const roadSafety=(x,z,margin)=>roadSceneryPositionAllowed(course,x,z,margin);
const options={heightAt,roadSafety};
const bounds=(x,z)=>({minX:x,maxX:x+160,minZ:z,maxZ:z+160});
const active=[];
for(let x=-320;x<=320;x+=160)for(let z=-1100;z<=160;z+=160){
 const b=bounds(x,z),plan=planRoadsideUtilitiesForCell(course,b,options);
 active.push({b,...plan});
}
const allPoles=active.flatMap(p=>p.poles);
const allSpans=active.flatMap(p=>p.spans);

test('V3 no longer produces legacy tree, grass, rock or telephone poles',()=>{
 const cell={id:'test:cell:0:0',coordinates:[0,0],bounds:bounds(0,0)};
 const patch=createCourseCellDescriptor(course,cell,{terrainSegments:8});
 for(const k of ['vegetation','grass','rocks','scenery'])assert.equal(patch[k].length,0,k);
 assert.ok(patch.roads.length>0,'The playable road remains present');
 assert.ok(patch.terrain.heights.length>0,'Procedural terrain remains present');
});
test('authored 200m environment tiles do not scatter competing random utility poles',()=>{
 for(let k=0;k<100;k++){
  const tile=planEnvironmentTile(seed,k,{quality:true,terrainHeight:()=>0});
  assert.ok(tile.props.every(p=>p.kind!=='pole'),`random pole in tile ${k}`);
 }
});
test('deterministic poles are owned once across adjacent 160m cells',()=>{
 assert.ok(allPoles.length>=9,`Expected roadside poles, got ${allPoles.length}`);
 assert.equal(new Set(allPoles.map(p=>p.id)).size,allPoles.length);
 assert.equal(new Set(allSpans.map(s=>s.id)).size,allSpans.length);
 for(const p of active)for(const pole of p.poles){
  assert.ok(pole.position.x>=p.b.minX&&pole.position.x<p.b.maxX);
  assert.ok(pole.position.z>=p.b.minZ&&pole.position.z<p.b.maxZ);
 }
});
test('pole height, orientation and clearance follow the actual highway',()=>{
 for(const p of allPoles){
  assert.ok(p.kind==='pole');
  assert.ok(Number.isFinite(p.position.y)&&Number.isFinite(p.heading));
  assert.ok(roadSafety(p.position.x,p.position.z,5),p.id);
  assert.ok(Math.abs(p.position.y-heightAt(p.position.x,p.position.z))<1e-5);
  assert.ok(Math.abs(p.progress/UTILITY_SPACING-Math.round(p.progress/UTILITY_SPACING))<1e-7);
  const assembled=authoredEnvironmentObject(p,{lod:'near'});
  assert.ok(assembled.parts.some(part=>part.shape==='column'));
  assert.ok(assembled.parts.some(part=>part.shape==='insulator'));
  const collider=authoredPropCollider(p,p.position.y);
  assert.ok(collider?.radius>0&&collider?.height>8);
 }
});
test('wires connect only adjacent accepted poles and are owned once',()=>{
 assert.ok(allSpans.length>=4,'Expected catenary spans');
 const ids=new Set(allPoles.map(x=>x.id));
 for(const s of allSpans){
  assert.ok(ids.has(s.from.id)&&ids.has(s.to.id));
  assert.ok(s.to.progress-s.from.progress<=UTILITY_SPACING+1e-6);
  assert.ok(Math.hypot(s.to.position.x-s.from.position.x,s.to.position.z-s.from.position.z)<UTILITY_SPACING*1.65);
 }
});
test('cables sag, sway gently in wind, and remain anchored to poles',()=>{
 const wire=allSpans[0];assert.ok(wire);
 const a=utilityCableVertices([wire],0),b=utilityCableVertices([wire],5700);
 assert.equal(a.length,3*10*2*3);assert.equal(a.length,b.length);
 for(let strand=0;strand<3;strand++){
  const begin=strand*10*6,end=begin+10*6-3;
  for(let k=0;k<3;k++){
   assert.ok(Math.abs(a[begin+k]-b[begin+k])<1e-5,'Anchor moved');
   assert.ok(Math.abs(a[end+k]-b[end+k])<1e-5,'Attachment moved');
  }
 }
 const deltas=Array.from(a,(v,i)=>Math.abs(v-b[i]));
 assert.ok(Math.max(...deltas)>.01,'Cable should animate');
 assert.ok(Math.max(...deltas)<.5,'Wind motion too strong');
 assert.ok(a[5*6+1] < (wire.from.position.y+wire.to.position.y)/2+9.27-.2,'Cable sag missing');
});
test('zero utility poles or wires for legacy non-V3 course',()=>{
 const old={...course,generatorVersion:'long-haul-endless-v2'};
 assert.deepEqual(planRoadsideUtilitiesForCell(old,bounds(0,0),options),{poles:[],spans:[],nearbyPoles:[]});
 assert.equal(utilityPoleAt(old,UTILITY_SPACING,options),null);
});
test('streaming host owns and releases utility wire geometry, without cable collision',()=>{
 const host=file('src/app/environment-tiles-host.js');
 assert.match(host,/planRoadsideUtilitiesForCell\(course,entry\.patch\.bounds/);
 assert.match(host,/utilityCableVertices\(wire\.spans,milliseconds\)/);
 assert.match(host,/state\.utilityWire\.geometry\.dispose\(\)/);
 assert.match(host,/state\.utilityWire\.material\.dispose\(\)/);
 assert.match(host,/mesh\.name='LH_ROADSIDE_WIND_CABLES'/);
 assert.match(host,/o\.kind==='pole'\?o\.position\.y/);
 assert.doesNotMatch(host,/utilityWire[^;\n]*entry\.obstacles\.push/);
});
test('Campaign terminal and its source are unchanged by Pass 2',()=>{
 const descriptor=file('src/game/cell-descriptor.mjs');
 assert.match(descriptor,/if \(course\.generatorVersion !== ROAD_V3_VERSION\)/);
 assert.match(file('src/game/freight-terminal-start.mjs'),/attachFreightTerminalStart/);
 assert.match(file('src/app/freight-terminal-host.js'),/FREIGHT_TERMINAL_VERSION/);
});

test('five procedural seeds retain utility clearance across three streamed road windows',()=>{
 let poles=0,spans=0;
 for(let i=0;i<5;i++){
  const graph=createPlayableRoadV3Course(`haul-procedural-safe-powerline-${i}`);
  for(const target of [0,3000,6400]){
   if(target)advancePlayableRoadV3Course(graph,target);
   const edge=graph.edges.find(e=>e.type==='endless-highway'&&e.startProgress<=target&&e.endProgress>target);
   assert.ok(edge,`Missing trunk at ${target}`);
   const middle=edge.samples[Math.floor(edge.samples.length/2)];
   const seen=new Set();
   for(const dx of [-160,0,160])for(const dz of [-160,0,160]){
    const x=Math.floor(middle.x/160)*160+dx,z=Math.floor(middle.z/160)*160+dz;
    const plan=planRoadsideUtilitiesForCell(graph,bounds(x,z),{
     heightAt:(x,z)=>terrainHeight(graph,x,z),
     roadSafety:(x,z,m)=>roadSceneryPositionAllowed(graph,x,z,m)});
    for(const pole of plan.poles){
     assert.ok(!seen.has(pole.id),`Duplicate pole ${pole.id}`);
     seen.add(pole.id);
     assert.ok(roadSceneryPositionAllowed(graph,pole.position.x,pole.position.z,5));
    }
    poles+=plan.poles.length;spans+=plan.spans.length;
   }
  }
 }
 assert.ok(poles>=45&&spans>=35,`Too few accepted poles/spans: ${poles}/${spans}`);
});

test('cables stay above real procedural roadside terrain on six seeded routes',()=>{
 let checked=0;
 for(let j=0;j<6;j++){
  const graph=createPlayableRoadV3Course(`haul-procedural-safe-cable-clearance-${j}`);
  for(let x=-320;x<=320;x+=160)for(let z=-1200;z<=0;z+=160){
   const plan=planRoadsideUtilitiesForCell(graph,bounds(x,z),{
    heightAt:(x,z)=>terrainHeight(graph,x,z),
    roadSafety:(x,z,m)=>roadSceneryPositionAllowed(graph,x,z,m)});
   for(const span of plan.spans){
    checked++;const coords=utilityCableVertices([span]);
    for(let at=0;at<coords.length;at+=6){
     const clearance=coords[at+1]-terrainHeight(graph,coords[at],coords[at+2]);
     assert.ok(clearance>5.5,`Cable enters terrain: seed ${j}, clearance ${clearance}`);
    }
   }
  }
 }
 assert.ok(checked>=40,`Too few cable spans sampled: ${checked}`);
});
