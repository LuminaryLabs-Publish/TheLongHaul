import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighwayInterchange,applyInterchangeDeckSpan,validateHighwayInterchange} from '../src/game/highway-interchange.mjs';
const segment=(index,{curve=0,grade=0}={})=>{
 const start=index*320;
 const samples=Array.from({length:65},(_,i)=>{
  const progress=start+i*5, t=progress-start;
  return {x:curve*Math.sin(progress/800),z:-progress,y:10+grade*progress,progress,
    width:28,bank:0,nx:1,nz:0,heading:Math.PI,grade};
 });
 return {id:`endless:highway:${index}`,from:`endless:node:${index}`,to:`endless:node:${index+1}`,
   branchId:'trunk',type:'endless-highway',sectionIndex:index,startProgress:start,endProgress:start+320,samples};
};
const course=[segment(2),segment(3),segment(4),segment(5)];
test('builds a physical lower road and curved entrance ramp',()=>{
 const entry=createHighwayInterchange(course,3);
 assert.ok(entry);assert.equal(entry.edges.length,3);
 assert.deepEqual(validateHighwayInterchange(entry),[]);
 assert.ok(entry.edges[1].samples.length>60);
 assert.ok(entry.clearance>=8);
});
test('ramp ends at exact mainline node and elevation',()=>{
 const entry=createHighwayInterchange(course,3);
 const end=entry.edges[1].samples.at(-1),main=course[1].samples.at(-1);
 assert.deepEqual({x:end.x,y:end.y,z:end.z},{x:main.x,y:main.y,z:main.z});
 assert.equal(entry.edges[1].to,course[1].to);
});
test('underpass has a fixed clearance below road',()=>{
 const entry=createHighwayInterchange(course,3);
 const low=entry.edges[0].samples[48];
 assert.ok(entry.crossing.y-low.y>=9);
 assert.ok(entry.clearance>=5.5);
});
test('bridge only spans actual underpass crossing',()=>{
 const entry=createHighwayInterchange(course,3);
 const updated=applyInterchangeDeckSpan(course,entry);
 const center=updated[1].samples.find(p=>Math.abs(p.progress-entry.crossProgress)<2.5);
 assert.equal(center.structure,'bridge');
 assert.equal(updated[1].samples.at(0).structure,undefined);
 assert.equal(updated[1].samples.at(-1).structure,undefined);
 assert.equal(course[1].samples.find(p=>Math.abs(p.progress-entry.crossProgress)<2.5).structure,undefined);
});
test('returns null when no complete trunk segment exists',()=>assert.equal(createHighwayInterchange([],3),null));
test('rejects impossible short steep ramp',()=>assert.equal(createHighwayInterchange(course,3,{underpassDrop:70}),null));
test('deterministic repeated construction',()=>{
 const a=createHighwayInterchange(course,3),b=createHighwayInterchange(course,3);
 assert.deepEqual(a,b);
});
test('different highway index creates different stable identities',()=>{
 const additional=[...course,segment(6)];const a=createHighwayInterchange(additional,3),b=createHighwayInterchange(additional,4);
 assert.ok(a&&b);assert.notEqual(a.id,b.id);
});
test('gentle curvature preserves join',()=>{
 const curved=[segment(2,{curve:20}),segment(3,{curve:20}),segment(4,{curve:20})];
 const r=createHighwayInterchange(curved,3);
 assert.ok(r);assert.deepEqual(validateHighwayInterchange(r),[]);
});
test('sloped highway preserves maximum permitted grade',()=>{
 const sloped=[segment(2,{grade:.012}),segment(3,{grade:.012}),segment(4,{grade:.012})];
 const r=createHighwayInterchange(sloped,3);
 assert.ok(r);assert.ok(r.maxGrade<=.12);
});
test('bridge piers leave the crossing corridor clear',async()=>{
 const {bridgePierAllowed}=await import('../src/game/highway-interchange.mjs');
 const item=createHighwayInterchange(course,3);
 assert.equal(bridgePierAllowed(item.crossing.x,item.crossing.z,[item]),false);
 assert.equal(bridgePierAllowed(item.crossing.x+100,item.crossing.z+100,[item]),true);
});

test('lower road rises toward surrounding terrain rather than ending in a trench',()=>{
 const site=createHighwayInterchange(course,3,{naturalHeight:()=>12});
 assert.ok(site);
 const west=site.edges[0].samples[0],east=site.edges[2].samples.at(-1);
 assert.ok(Math.abs(west.y-12.15)<1e-6);
 assert.ok(Math.abs(east.y-12.15)<1e-6);
 assert.ok(site.maxGrade<=.12);
 assert.deepEqual(validateHighwayInterchange(site),[]);
});
test('ramp-side guardrail opens only at the merge',async()=>{
 const {bridgeRailAllowed}=await import('../src/game/highway-interchange.mjs');
 const item=createHighwayInterchange(course,3);
 assert.equal(bridgeRailAllowed(1,item.merge.x,item.merge.z,[item]),false);
 assert.equal(bridgeRailAllowed(-1,item.merge.x,item.merge.z,[item]),true);
 assert.equal(bridgeRailAllowed(1,item.merge.x+100,item.merge.z,[item]),true);
});
