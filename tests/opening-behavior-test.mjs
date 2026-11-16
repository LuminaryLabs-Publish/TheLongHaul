import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { removeOpeningBridgeSpan } from '../src/game/opening-access.mjs';

const source=readFileSync(new URL('../src/app/freight-terminal-host.js',import.meta.url),'utf8');
const start=source.indexOf('  generateEndlessCourse=function(seed){');
const end=source.indexOf('  };',start);
assert.ok(start>=0&&end>start);
const wrapper=source.slice(start,end+4);
function invoke(seed,loaded,saved){
 const observed=[];
 const context={
  loaded,freightResumeCheckpoint:saved,FREIGHT_TERMINAL_VERSION:'terminal-v1',
  priorGenerate:seed=>({seed,endless:true,origin:{id:'origin',x:0,z:0}}),
  attachFreightTerminalStart:(course,{enabled})=>{observed.push(enabled);return {...course,hasTerminal:enabled};}
 };
 vm.runInNewContext(wrapper,context);
 const result=context.generateEndlessCourse(seed);
 return {enabled:observed[0],result};
}
test('brand-new opening never chooses a terminal ramp, regardless of GLB load timing',()=>{
 for(const loaded of [true,false]){
  assert.equal(invoke('haul-winding-ground-abc',loaded,null).enabled,false);
 }
});
test('older-seed new runs retain their existing terminal behavior',()=>{
 assert.equal(invoke('haul-winding-abc',true,null).enabled,true);
 assert.equal(invoke('haul-winding-abc',false,null).enabled,false);
});
test('resume explicitly saved with terminal retains its start road',()=>{
 assert.equal(invoke('haul-winding-ground-old',true,{freightTerminal:'terminal-v1'}).enabled,true);
 assert.equal(invoke('haul-winding-ground-old',false,{freightTerminal:'terminal-v1'}).enabled,false);
 assert.equal(invoke('haul-winding-ground-old',true,{freightTerminal:null}).enabled,false);
});
test('initial 960m trunk bridge tags clear, without removing later bridges',()=>{
 const edges=Array.from({length:6},(_,i)=>({id:`edge${i}`,type:'endless-highway',branchId:'trunk',
   startProgress:i*320,endProgress:i*320+320,
   samples:Array.from({length:3},(_,j)=>({progress:i*320+j*160,structure:'bridge'}))}));
 const result=removeOpeningBridgeSpan(edges,2);
 for(const edge of result){
   for(const p of edge.samples){assert.equal(p.structure,p.progress<=960?null:'bridge');}
 }
 assert.equal(edges[0].samples[0].structure,'bridge');
});
