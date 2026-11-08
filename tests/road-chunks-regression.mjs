import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import { ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION, ROAD_CHUNKS, roadChunkAt, roadChunkSample, roadChunkContract, validateRoadChunk, roadChunkCacheSize } from '../src/game/road-chunks.mjs';
import { createEndlessHighway, advanceEndlessHighway, endlessHighwayPoint, endlessHighwayStation } from '../src/game/endless-highway.mjs';
import { nearestRoad, terrainHeight } from '../src/game/world-base.mjs';
import { createCourseCellDescriptor } from '../src/game/cell-descriptor.mjs';
import { roadRibbonData } from '../src/game/road-surface.mjs';
import { resolveRoadStructureContact } from '../src/game/road-structure-contact.mjs';
import { indexDriveSurface, sampleDriveSurface } from '../src/game/truck-presentation.mjs';
import { createFreightJourney } from '../src/game/freight-journey.mjs';
const near = (a,b,t=1e-5) => assert.ok(Math.abs(a-b)<=t, `${a} != ${b} (tolerance ${t})`);
let chunks=0, seams=0, maxGrade=0, maxCurve=0, maxMeshError=0;
const families=new Set();
for(let seedIndex=0;seedIndex<30;seedIndex++) {
  const seed=`road-matrix-${seedIndex}`;
  const seen=new Set();
  for(let i=0;i<24;i++) {
    const chunk=roadChunkAt(seed, 960+i*960); seen.add(chunk.kind); families.add(chunk.kind); chunks++;
    assert.equal(validateRoadChunk(seed,chunk).valid,true, `${seed} ${chunk.kind} valid geometry`);
    for(const s of [chunk.start,chunk.end,chunk.start+320]) {
      const a=roadChunkSample(seed,s-.001), b=roadChunkSample(seed,s+.001);
      near(a.x,b.x,.003); near(a.y,b.y,.001); near(a.width,b.width,.001);
      near(Math.sin(a.heading),Math.sin(b.heading),.0001); near(a.grade,b.grade,.0001); near(a.curvature,b.curvature,.0001); near(a.bank,b.bank,.00001); seams++;
    }
    for(let s=chunk.start;s<chunk.end;s+=5){const p=roadChunkSample(seed,s);maxGrade=Math.max(maxGrade,Math.abs(p.grade));maxCurve=Math.max(maxCurve,Math.abs(p.curvature));}
    const next=roadChunkAt(seed,chunk.end+1);
    const exit=roadChunkContract(seed,chunk,true), entrance=roadChunkContract(seed,next);
    assert.deepEqual(exit,entrance,'both features reference one boundary contract');
  }
  for(const key of Object.keys(ROAD_CHUNKS).filter(k=>k!=='freight')) assert.ok(seen.has(key),`${seed} covers ${key}`);
  const course=createEndlessHighway(seed,{progress:4000});
  for(let i=0;i<8;i++) {
    const station=endlessHighwayStation(course,i);
    near(station.safe.point.width,28); assert.ok(station.safe.routeLength>station.risky.routeLength+8);
    assert.ok(Math.abs(station.safe.point.x-station.risky.point.x)>40);
  }
  // Real world-space signs and metadata must agree with the two physical
  // freight routes; a generic straight arrow is not valid wayfinding.
  const first = createEndlessHighway(seed);
  const station = first.loadingStations.find(station => station.index === 0);
  assert.ok(station,'initial freight station is in the streaming window');
  const freightChoice = first.routeChoices.find(choice => choice.stationId === station.id);
  assert.equal(freightChoice.safeSide,'left'); assert.equal(freightChoice.riskySide,'right');
  assert.deepEqual(freightChoice.signIds,[`${station.id}:approach`,`${station.id}:approach:express`]);
  for(const [side,id,arrow,expectedSide] of [
    ['safe',freightChoice.signIds[0],'↖',1],['risky',freightChoice.signIds[1],'↗',-1]
  ]) {
    const sign=first.signs.find(sign=>sign.id===id);
    assert.ok(sign && sign.arrow===arrow && sign.stationId===station.id);
    near(sign.progress,station.warningProgress);
    const center=endlessHighwayPoint(first,sign.progress);
    const signedDistance=(sign.x-center.x)*center.nx+(sign.z-center.z)*center.nz;
    assert.ok(expectedSide*signedDistance>20,'freight sign stays on the correct roadside');
    assert.ok(station.entryProgress-sign.progress>=200,'driver gets a long advance warning');
  }
  // Each generated optional bypass must physically rejoin the main road,
  // retain a usable highway fallback, and display its ACTUAL branching side.
  for(let i=0;i<24;i++) {
    const chunk=roadChunkAt(seed,960+i*960);
    if(!chunk.branch)continue;
    const section=createEndlessHighway(seed,{progress:chunk.start+80});
    const id=`${chunk.id}:bypass`,branch=section.edges.find(e=>e.id===id);
    const choice=section.routeChoices.find(x=>x.entryEdgeId===id),sign=section.signs.find(x=>x.id===`${chunk.id}:sign`);
    assert.ok(branch && choice && sign,`${seed} ${chunk.id}: route, choice and sign are present`);
    assert.ok(section.nodes.some(n=>n.id===branch.from)&&section.nodes.some(n=>n.id===branch.to));
    assert.equal(choice.side,chunk.branchSide<0?'left':'right');
    assert.equal(sign.side,choice.side); assert.equal(sign.arrow,choice.side==='left'?'↖':'↗');
    assert.ok(choice.fallbackEdgeIds.length>=2 && choice.fallbackEdgeIds.every(id=>section.edges.some(e=>e.id===id&&!e.optional)));
    assert.deepEqual(choice.signIds,[sign.id]);near(sign.progress,choice.warningProgress);
    assert.ok(sign.subtitle.includes(choice.side.toUpperCase()) && !sign.subtitle.includes('OPTIONAL ROUTE'));
    const center=endlessHighwayPoint(section,sign.progress),lateral=(sign.x-center.x)*center.nx+(sign.z-center.z)*center.nz;
    assert.ok((choice.side==='left'?1:-1)*lateral>21,'bypass warning is placed outside the correct shoulder');
    const gate=endlessHighwayPoint(section,chunk.start+chunk.length*.2,'branch');
    const detour=endlessHighwayPoint(section,chunk.start+chunk.length*.2,0,'branch');
    const highway=endlessHighwayPoint(section,chunk.start+chunk.length*.2);
    assert.ok(sign.progress<chunk.start+chunk.length*.2,'sign appears before useful route divergence');
    assert.ok(Math.hypot(detour.x-highway.x,detour.z-highway.z)>12,'the optional branch is real');
    for(const [progress,idx] of [[chunk.start,0],[chunk.end,branch.samples.length-1]]) {
      const p=endlessHighwayPoint(section,progress),q=branch.samples[idx];near(p.x,q.x,.001);near(p.z,q.z,.001);
    }
    assert.ok(gate && Number.isFinite(gate.x));
  }
}
for (const progress of [0,319.999,320,640,960,1280,3840,99123,-800,1000000]) {
  const a=createEndlessHighway('rebuild',{progress});
  const original=JSON.stringify(a.edges);
  advanceEndlessHighway(a,progress+20000); advanceEndlessHighway(a,progress);
  assert.equal(JSON.stringify(a.edges),original,'regeneration independent of visited order');
  assert.ok(a.edges.length<=20 && a.nodes.length===13);
}
// Pixel path and physical path share actual triangle heights, including banking.
for(let i=0;i<12;i++) {
  const seed='road-matrix-1', progress=960+i*960, course=createEndlessHighway(seed,{progress});
  for(let s=progress-260;s<=progress+260;s+=20) {
    const p=endlessHighwayPoint(course,s), cx=Math.floor(p.x/160), cz=Math.floor(p.z/160);
    const descriptors=[];
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)descriptors.push(createCourseCellDescriptor(course,{id:`${cx+dx}:${cz+dz}`,coordinates:[cx+dx,cz+dz],bounds:{minX:(cx+dx)*160,maxX:(cx+dx+1)*160,minZ:(cz+dz)*160,maxZ:(cz+dz+1)*160}},{terrainSegments:8}));
    const data=roadRibbonData(descriptors.flatMap(d=>d.roads),1,.12), geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geometry.setIndex(data.indices);
    const triangles=indexDriveSurface(geometry);
    for(const lateral of [-4,0,4]) {
      const point=endlessHighwayPoint(course,s,lateral);
      const height=sampleDriveSurface(triangles,point.x,point.z,-Infinity), physics=terrainHeight(course,point.x,point.z);
      assert.ok(Number.isFinite(height),'rendered road exists');
      maxMeshError=Math.max(maxMeshError,Math.abs(height-physics)); near(height,physics,.04);
    }
    geometry.dispose();
  }
}
const legacy=createEndlessHighway('legacy',{generatorVersion:LEGACY_ROAD_VERSION});
assert.equal(legacy.generatorVersion,LEGACY_ROAD_VERSION);assert.equal(legacy.roadChunks.length,0);
assert.equal(legacy.signs.filter(s=>s.stationId===legacy.loadingStations[0].id).length,1,'legacy save keeps its original single freight approach sign');
assert.equal(legacy.signs.find(s=>s.id===`${legacy.loadingStations[0].id}:approach`)?.title,'Freight ahead');
assert.equal(legacy.routeChoices.find(choice=>choice.stationId===legacy.loadingStations[0].id)?.safeSide,undefined,'legacy route metadata unchanged');
const v1=createFreightJourney({seed:'legacy',sessionId:'legacy-haul',generatorVersion:LEGACY_ROAD_VERSION});
const old=v1.snapshot();delete old.generatorVersion;
const restored=createFreightJourney({seed:'legacy',sessionId:'legacy-haul',snapshot:old});
assert.equal(restored.snapshot().generatorVersion,LEGACY_ROAD_VERSION);
assert.deepEqual(restored.getState().pickupStation.safe.point,endlessHighwayStation(legacy,0).safe.point);
assert.throws(()=>createEndlessHighway('invalid',{generatorVersion:'future'}));
assert.throws(()=>createFreightJourney({seed:'legacy',sessionId:'legacy-haul',snapshot:old,generatorVersion:ROAD_GENERATOR_VERSION}));
assert.ok(roadChunkCacheSize()<=64);
// Solid side contacts, jump-over-rail eligibility and roof impact.
const road={x:0,y:0,z:0,nx:-1,nz:0,width:28,heading:Math.PI,bank:0,structure:'tunnel'};
const truck={position:{x:13.5,y:.5,z:0},velocity:{x:8,y:0,z:-20},heading:Math.PI};
const hit=resolveRoadStructureContact(truck,{x:12,y:.5,z:1},road);assert.ok(hit?.contacts.includes('wall'));assert.ok(hit.velocity.x<0);
const roof=resolveRoadStructureContact({...truck,position:{x:0,y:4,z:0},velocity:{x:0,y:8,z:-20}},{x:0,y:3,z:1},road);
assert.ok(roof?.contacts.includes('roof'));near(roof.position.y,3.5);
assert.equal(resolveRoadStructureContact({...truck,position:{x:13.5,y:3,z:0}},{x:12,y:3,z:1},{...road,structure:'bridge'}),null);
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(index, /id="campaign-coming-soon"[^>]*disabled/);assert.match(index, /aria-label="Campaign \u2014 Coming Soon"/);assert.match(index, /visually-hidden">Campaign \u2014 Coming Soon/);
assert.ok(readFileSync(new URL('../campaign.html',import.meta.url),'utf8').includes('loadGeographicCourse'));
new Function(readFileSync(new URL('../src/app/endless-roads.js',import.meta.url),'utf8'));
console.log(JSON.stringify({status:'PASS',chunks,seams,families:[...families],maxGrade,maxCurve,maxMeshError,cache:roadChunkCacheSize()}));
