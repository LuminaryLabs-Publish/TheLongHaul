import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const source=await read('src/app/async-loading-scene.js');
const truck3D=await read('src/app/loading-truck-3d.mjs');
const html=await read('index.html');
const generation=await read('src/app/app-chunk-6.js');
const preview=await read('src/app/menu-attract-host.js');
assert.match(html,/id="async-loading-scene"/);
assert.ok(html.indexOf('./src/app/async-loading-scene.js')<
          html.indexOf('./src/app/bootstrap.mjs'),'boot art mounts before engine startup');
assert.match(html,/id="async-loading-door-left"/);
assert.match(html,/id="async-loading-door-right"/);
assert.match(html,/id="async-loading-truck-3d-host"/);
assert.match(html,/id="async-loading-truck-3d"/);
assert.doesNotMatch(html,/id="async-loading-truck"(?:\s|>)/);
assert.doesNotMatch(html,/id="async-loading-door"(?:\s|>)/);
assert.match(html,/lh-door-left-bolts/);
assert.match(html,/lh-door-right-bolts/);
assert.match(html,/id="async-loading-scene"[\s\S]*?background:transparent/);
assert.match(html,/id="async-loading-door-left"/);
assert.match(html,/id="async-loading-door-right"/);
const doorStart=html.indexOf('id="async-loading-door-left"');
const rightDoor=html.indexOf('id="async-loading-door-right"');
const truckStart=html.indexOf('id="async-loading-truck-3d-host"');
const phaseStart=html.indexOf('id="async-loading-phase"');
const meterStart=html.indexOf('id="async-loading-progress"');
assert.ok(doorStart>=0&&doorStart<rightDoor&&rightDoor<truckStart);
assert.ok(truckStart<phaseStart&&phaseStart<meterStart);
assert.match(html,/transform-origin:100% 50%/);
assert.match(html,/transform-origin:0% 50%/);
assert.doesNotMatch(html,/stroke="url\(#tlh-steel\)"/);
assert.match(truck3D,/new THREE\.WebGLRenderer/);
assert.match(truck3D,/createHeroTruckMesh\(\{THREE,materials,createTruckGrounding\}\)/);
assert.match(truck3D,/entryDuration=\.42/);
assert.match(source,/rotateY\(-105deg\)/);
assert.match(source,/rotateY\(105deg\)/);
assert.match(preview,/loading\.style\.background='transparent'/);
assert.match(preview,/loading\.firstElementChild\.style\.visibility='hidden'/);
assert.match(generation,/LongHaulAsyncLoading\?\.begin\(\{kind:"course"\}\)/);
assert.match(generation,/loader\.finish\(\{commit:complete/);
assert.match(generation,/scenes\.loadScene\("driving"/);
assert.match(generation,/transition\("ready"/);
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
const elements=Object.fromEntries(['async-loading-scene','async-loading-door-left','async-loading-door-right','async-loading-caption',
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
let enterCalls=0, exitCalls=0;
api.registerTruck3D({
  enter(){enterCalls++;return true;},
  async exit(signal){assert.equal(signal.aborted,false);exitCalls++;trace.push('truck:exit');},
  getState:()=>({ready:true,entered:true})
});
assert.equal(api.getState().kind,'boot');
assert.equal(api.getState().minimumMs,500);
assert.equal(await api.finishBoot(),true);
assert.equal(exitCalls,1);
assert.ok(waits.some(ms=>ms>=500),'boot remains at least 500ms');
assert.equal(elements['async-loading-scene'].hidden,true);
assert.equal(api.getState().committed,1);

trace.length=0;waits.length=0;now+=100;
const course=api.begin({kind:'course'});
api.report(undefined,{progress:.425,phase:'Shaping terrain'});
assert.equal(elements['async-loading-progress'].style.width,'43%');
assert.equal(elements['async-loading-phase'].textContent,'Shaping terrain');
assert.equal(await api.finish({operation:course,commit:()=>trace.push('commit')}),true);
assert.deepEqual(trace,['truck:exit','commit','animate:async-loading-door-left','animate:async-loading-door-right'],
  'the 3D truck must exit, then commit, then the hinged doors swing');
assert.ok(waits.some(ms=>ms>=500));
assert.equal(api.getState().active,false);
assert.equal(api.getState().visualMode,'swing-doors');
assert.equal(api.getState().doorsOpened,true);
assert.ok(enterCalls>=2);

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
