import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPlayableRoadV3Course, advancePlayableRoadV3Course, playableRoadV3Point } from '../src/game/road-v3-playable-course.mjs';
import { ROAD_V3_VERSION } from '../src/game/road-v3-geometry.mjs';
import { roadV3GroundContact, terrainHeight } from '../src/game/world-base.mjs';
import { roadSceneryPositionAllowed } from '../src/game/road-junction-clearance.mjs';
import { resolveRoadStructureContact } from '../src/game/road-structure-contact.mjs';
import { createEndlessHighway } from '../src/game/endless-highway.mjs';
import { isProceduralSafeRun,validateProceduralRoads,selectProceduralCourseEdges } from '../src/game/procedural-road-safety.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const seed=i=>`haul-procedural-safe-validation-${i}`;
const near=(actual,expected,tolerance=.15)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} ≠ ${expected}`);
test('new sessions own an all-procedural versioned identity; historical checkpoints unchanged',()=>{
 assert.ok(isProceduralSafeRun(seed(1)));
 assert.ok(!isProceduralSafeRun('haul-terminal-cohesive-123'));
 const fresh=createPlayableRoadV3Course(seed(1));
 assert.equal(fresh.generatorVersion,ROAD_V3_VERSION);
 assert.equal(fresh.persistence.layoutRevision,5);
 assert.equal(fresh.freightTerminal,undefined);
 assert.equal(fresh.origin.id,'origin');
 assert.equal(fresh.origin.structure,null);
 assert.ok(fresh.edges.some(e=>e.id==='endless:highway:0'));
 assert.ok(!fresh.edges.some(e=>e.id==='terminal:start-ramp'));
 const legacy=createPlayableRoadV3Course('haul-terminal-cohesive-123');
 assert.notEqual(legacy.persistence.layoutRevision,5);
 assert.ok(!legacy.edges.some(e=>e.id==='endless:highway:0'));
 assert.ok(createEndlessHighway('haul-winding-old-snapshot').edges.length>0);
});
test('32 seeded endless journeys stay traversable for 6.4km and across stream rebuilds',()=>{
 for(let i=0;i<32;i++){
  const graph=createPlayableRoadV3Course(seed(i));
  for(let progress=0;progress<=6400;progress+=320){
   advancePlayableRoadV3Course(graph,progress);
   assert.deepEqual(graph.roundabouts,[]);
   assert.deepEqual(graph.interchanges,[]);
   assert.deepEqual(graph.optionalRoads,[]);
   assert.deepEqual(validateProceduralRoads(graph.edges),[],`${i} / ${progress}`);
   assert.ok(graph.edges.every(e=>e.samples.every(p=>p.structure===null)),`${i}: no overhead road`);
   const sample=playableRoadV3Point(graph,progress);
   assert.equal(sample.structure,null);
   const contact=roadV3GroundContact(graph,{...sample,y:sample.y+.92});
   assert.ok(contact,`${i}/${progress}: missing tire support`);
   near(contact.height,sample.y,.25);
   assert.equal(roadSceneryPositionAllowed(graph,sample.x,sample.z,2),false);
   // Previously the simulated rail/roof contact used an unfiltered point
   // rather than the accepted road edge and blocked the depot even when invisible.
   const truck={position:{x:sample.x,y:sample.y+.92,z:sample.z},velocity:{x:0,y:0,z:-12},heading:sample.heading};
   assert.equal(resolveRoadStructureContact(truck,{...truck.position,z:truck.position.z+1},sample),null);
  }
 }
});
test('invalid or disconnected road sections fail closed before world creation',()=>{
 const basic={type:'endless-highway',id:'a',branchId:'trunk',from:'n0',to:'n1',startProgress:0,endProgress:100,
  samples:[{x:0,y:0,z:0,width:20,progress:0,structure:null},{x:0,y:0,z:-100,width:20,progress:100,structure:null}]};
 assert.deepEqual(validateProceduralRoads([basic]),[]);
 assert.ok(validateProceduralRoads([{...basic,samples:[basic.samples[0],{...basic.samples[1],y:40}]}]).some(s=>s.startsWith('excess-grade:')));
 assert.ok(validateProceduralRoads([{...basic,samples:[basic.samples[0],{...basic.samples[1],structure:'bridge'}]}]).some(s=>s.startsWith('obstructing-structure:')));
 assert.ok(validateProceduralRoads([basic,{...basic,id:'b',from:'n1',to:'n2',startProgress:100,endProgress:200,
  samples:[{x:12,y:0,z:-100,width:20,progress:100},{x:12,y:0,z:-200,width:20,progress:200}]}]).some(s=>s.startsWith('broken-trunk-join:')));
 assert.deepEqual(selectProceduralCourseEdges([basic,{...basic,id:'optional',type:'scenic-bypass',optional:true}]).map(e=>e.id),['a']);
});
test('procedural starts do not attach Campaign terminal or static terminal colliders',()=>{
 const host=read('src/app/freight-terminal-host.js');
 const adapter=read('src/game/road-v3-playable-course.mjs');
 assert.match(host,/const proceduralOnly=seed\.startsWith\('haul-procedural-safe-'\)/);
 assert.match(host,/const enable=Boolean\(!proceduralOnly/);
 assert.match(adapter,/if\(safeProcedural\)edges=selectProceduralCourseEdges\(edges\)/);
 assert.match(read('src/game/freight-terminal-start.mjs'),/FREIGHT_TERMINAL_COLLIDERS/);
 assert.match(read('src/game/freight-terminal-glb.mjs'),/createFreightTerminalThreeObject/);
});
test('static highway obstacles and accidental road events are excluded before collision',()=>{
 const body=read('src/app/app-chunk-5.js');
 const host=read('src/app/endless-roads.js');
 assert.match(body,/roadSceneryPositionAllowed\(course,obstacle\.x,obstacle\.z/);
 assert.match(host,/!safeProcedural\(\) && segment\.chunk\?\.kind === 'construction'/);
 assert.match(host,/if\(safeProcedural\(\)\)return events\.filter\(e=>!\['ramp','roadblock','weave'\]/);
});

test('procedural soil remains below all accepted pavement at generated sections',()=>{
 for(let i=0;i<12;i++){
  const course=createPlayableRoadV3Course(seed(i));
  for(const edge of course.edges.filter(e=>e.startProgress>=0))for(const sample of edge.samples){
   const soil=terrainHeight(course,sample.x,sample.z);
   assert.ok(soil<sample.y-.06,`terrain above drivable pavement: ${i} ${edge.id} ${sample.progress}`);
  }
 }
});
test('Campaign freight-terminal asset and parser remain preserved',async()=>{
 const {statSync,readFileSync}=await import('node:fs');
 const {parseFreightTerminalGlb}=await import('../src/game/freight-terminal-glb.mjs');
 const url=new URL('../assets/freight-terminal/terminal-yard.glb',import.meta.url);
 assert.ok(statSync(url).size>1_000_000);
 const data=readFileSync(url),binary=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
 const parsed=parseFreightTerminalGlb(binary);
 assert.ok(parsed.meshes.length>=15);
 assert.ok(parsed.triangles>0);
});
test('freight-terminal host explicitly avoids attaching terminal on new procedural starts',async()=>{
 const vm=await import('node:vm');
 const source=read('src/app/freight-terminal-host.js');
 const start=source.indexOf('  generateEndlessCourse=function(seed){');
 const end=source.indexOf('  };',start);
 assert.ok(start>=0&&end>start);
 const context={loaded:true,freightResumeCheckpoint:null,FREIGHT_TERMINAL_VERSION:'terminal',
  priorGenerate:seed=>({seed,endless:true}),
  attachFreightTerminalStart:(course,{enabled})=>({...course,enabled})};
 vm.runInNewContext(source.slice(start,end+4),context);
 assert.equal(context.generateEndlessCourse(seed(3)).enabled,false);
 assert.equal(context.generateEndlessCourse('haul-terminal-cohesive-old').enabled,true);
});
