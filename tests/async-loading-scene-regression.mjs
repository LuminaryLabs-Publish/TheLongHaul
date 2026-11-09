import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const source=await read('src/app/async-loading-scene.js');
const html=await read('index.html');
const generation=await read('src/app/app-chunk-6.js');
const preview=await read('src/app/menu-attract-host.js');
assert.match(html,/id="async-loading-scene"/);
assert.match(html,/id="async-loading-door"/);
assert.match(html,/id="async-loading-truck"/);
assert.match(html,/tlh-rivets/);
assert.match(generation,/LongHaulAsyncLoading\?\.begin\(\{kind:"course"\}\)/);
assert.match(generation,/loader\.finish\(\{commit:complete/);
assert.match(generation,/progress:ratio/);
assert.match(preview,/LongHaulAsyncLoading\?\.finishBoot/);

const trace=[],timers=new Map(),waits=[];
let nextTimer=1,now=1000;
class Node{
  constructor(id){this.id=id;this.hidden=false;this.style={};this.attributes={};this.parentElement=null;this.textContent='';}
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAnimations(){return [];}
  animate(frames,options){
    trace.push('animate:'+this.id);
    const motion={cancelled:false,cancel(){this.cancelled=true;},finished:Promise.resolve()};
    return motion;
  }
}
const elements=Object.fromEntries(['async-loading-scene','async-loading-door','async-loading-truck',
  'async-loading-phase','async-loading-progress'].map(id=>[id,new Node(id)]));
elements['async-loading-progress'].parentElement=new Node('meter');
const context={
  document:{getElementById:id=>elements[id]??null},
  window:{matchMedia:()=>({matches:false})},
  performance:{now:()=>now},
  AbortController,
  requestAnimationFrame:callback=>queueMicrotask(()=>callback(now)),
  setTimeout(callback,ms){
    waits.push(ms);
    const id=nextTimer++;
    timers.set(id,callback);
    queueMicrotask(()=>{if(timers.has(id)){timers.delete(id);callback();}});
    return id;
  },
  clearTimeout:id=>timers.delete(id)
};
vm.runInNewContext(source,context,{filename:'async-loading-scene.js'});
const api=context.window.LongHaulAsyncLoading;
assert.ok(api,'host must register immediately for first-paint boot');
assert.equal(api.getState().kind,'boot');
assert.equal(api.getState().minimumMs,500);
assert.equal(await api.finishBoot(),true);
assert.ok(waits.some(ms=>ms>=500),'boot remains at least 500ms');
assert.equal(elements['async-loading-scene'].hidden,true);
assert.equal(api.getState().committed,1);

trace.length=0;waits.length=0;now+=100;
const course=api.begin({kind:'course'});
api.report(undefined,{progress:.425,phase:'Shaping terrain'});
assert.equal(elements['async-loading-progress'].style.width,'43%');
assert.equal(elements['async-loading-phase'].textContent,'Shaping terrain');
assert.equal(await api.finish({operation:course,commit:()=>trace.push('commit')}),true);
assert.deepEqual(trace,['animate:async-loading-truck','commit','animate:async-loading-door'],
  'commit must occur behind intact trailer door');
assert.ok(waits.some(ms=>ms>=500));
assert.equal(api.getState().active,false);

now+=250;trace.length=0;
const p=api.run({kind:'retry',prepare:async ({signal,report})=>{
  assert.equal(signal.aborted,false);report({phase:'Preparing truck',progress:.3});
},commit:()=>trace.push('retry:commit')});
assert.equal(await p,true);
assert.ok(trace.includes('retry:commit'));

const pending=api.begin({kind:'resume'});
const waiting=api.finish({operation:pending,commit:()=>trace.push('cancelled:commit')});
assert.equal(api.cancel(pending),true);
assert.equal(await waiting,false);
assert.ok(!trace.includes('cancelled:commit'));
assert.equal(api.getState().active,false);

await assert.rejects(api.run({
  kind:'failed',prepare:async ()=>{throw Error('asset-failure');},commit:()=>trace.push('failure:commit')
}),/asset-failure/);
assert.equal(api.getState().active,false);
assert.ok(!trace.includes('failure:commit'));
console.log('PASS async trailer scene: immediate boot, minimum hold, real progress, ordered reveal, reuse, cancellation and failure');
