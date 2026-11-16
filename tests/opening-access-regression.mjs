import test from 'node:test';
import assert from 'node:assert/strict';
import {createGroundLevelAccess,validateGroundLevelAccess,removeOpeningBridgeSpan} from '../src/game/opening-access.mjs';
const section=i=>({id:`endless:highway:${i}`,type:'endless-highway',branchId:'trunk',
  from:`endless:node:${i}`,to:`endless:node:${i+1}`,startProgress:i*320,endProgress:(i+1)*320,width:28,
  samples:Array.from({length:65},(_,k)=>({x:0,y:0,z:-(i*320+k*5),progress:i*320+k*5,
    width:28,heading:Math.PI,nx:-1,nz:0,grade:0,bank:0,structure:'bridge'}))});
const edges=Array.from({length:6},(_,i)=>section(i));
test('first access is at ground level with no overpass',()=>{
 const site=createGroundLevelAccess(edges,3,{naturalHeight:()=>0});
 assert.ok(site);assert.equal(site.kind,'ground-access');assert.equal(site.edges.length,2);
 assert.equal(site.crossing,undefined);assert.deepEqual(validateGroundLevelAccess(site),[]);
});
test('ramp merges on exact existing trunk vertex',()=>{
 const site=createGroundLevelAccess(edges,3,{naturalHeight:()=>0});
 assert.ok(site);const end=site.edges[1].samples.at(-1);
 assert.equal(end.x,edges[3].samples.at(-1).x);assert.equal(end.y,0);
 assert.equal(end.z,edges[3].samples.at(-1).z);
 assert.equal(site.edges[1].to,edges[3].to);
});
test('side access begins at terrain height',()=>{
 const site=createGroundLevelAccess(edges,3,{naturalHeight:()=>2});
 assert.ok(site);assert.equal(site.edges[0].samples[0].y,2.15);
 assert.ok(site.maxGrade<=.12);
});
test('extreme terrain uses bounded local grading rather than missing entrance',()=>{
 const site=createGroundLevelAccess(edges,3,{naturalHeight:()=>90});
 assert.ok(site);assert.ok(site.maxGrade<=.12);
 assert.ok(site.edges[0].samples[0].y<=6);
});
test('opening mainline does not create a bridge barrier',()=>{
 const updated=removeOpeningBridgeSpan(edges,3);
 assert.equal(updated[3].samples[10].structure,null);
 assert.equal(updated[4].samples[10].structure,'bridge');
 assert.equal(edges[3].samples[10].structure,'bridge');
});
test('later interchanges untouched and deterministic',()=>{
 const first=createGroundLevelAccess(edges,3,{naturalHeight:()=>0});
 const second=createGroundLevelAccess(edges,3,{naturalHeight:()=>0});
 assert.deepEqual(first,second);
 assert.equal(createGroundLevelAccess(edges,12),null);
});
test('natural grade follows road instead of abrupt rise',()=>{
 const site=createGroundLevelAccess(edges,3,{naturalHeight:(x,z)=>1.2*Math.sin(x/120)});
 assert.ok(site);assert.ok(site.maxGrade<.12);
});
test('60 varied terrain samples all create a connected opening',()=>{
 const curved=Array.from({length:7},(_,i)=>({type:'endless-highway',branchId:'trunk',
   from:`n${i}`,to:`n${i+1}`,startProgress:i*320,endProgress:(i+1)*320,width:28,
   samples:Array.from({length:65},(_,j)=>({x:70*Math.sin((i*320+j*5)/1400),y:2*Math.sin((i*320+j*5)/1100),
     z:-(i*320+j*5),progress:i*320+j*5,width:28,structure:null}))}));
 for(let i=0;i<60;i++){
  const site=createGroundLevelAccess(curved,3,{naturalHeight:(x,z)=>Math.sin(x*.011+i)*4+Math.cos(z*.008+i*.4)*3});
  assert.ok(site,`Missing first entrance on terrain seed ${i}`);
  assert.deepEqual(validateGroundLevelAccess(site),[],`Bad merge on terrain seed ${i}`);
 }
});
