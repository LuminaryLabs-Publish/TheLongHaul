import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const source=await read('src/app/async-loading-scene.js');
const html=await read('index.html');
const generation=await read('src/app/app-chunk-6.js');
const preview=await read('src/app/menu-attract-host.js');
assert.match(html,/id="async-loading-scene"/);
assert.ok(html.indexOf('./src/app/async-loading-scene.js')<
          html.indexOf('./src/app/bootstrap.mjs'),'boot art mounts before engine startup');
assert.match(html,/id="async-loading-door-left"/);
assert.match(html,/id="async-loading-door-right"/);
assert.doesNotMatch(html,/id="async-loading-truck(?:-3d(?:-host)?)?"/);
assert.doesNotMatch(html,/loading-truck-3d\.mjs/);
assert.match(html,/async-loading-scene\.js\?v=tlh-load-005/);
assert.doesNotMatch(source,/rotateY\(|scale\(|translateX\(/);
assert.match(html,/lh-door-left-bolts/);
assert.match(html,/lh-door-right-bolts/);
assert.match(html,/id="async-loading-scene"[\s\S]*?background:transparent/);
assert.match(html,/id="async-loading-door-left"[^>]*[\s\S]*?width:50%;min-width:50%;max-width:50%;transform:none;scale:1;translate:0px 0px;will-change:translate/);
assert.match(html,/id="async-loading-door-right"[^>]*[\s\S]*?width:50%;min-width:50%;max-width:50%;transform:none;scale:1;translate:0px 0px;will-change:translate/);
assert.doesNotMatch(html,/stroke="url\(#tlh-steel\)"/);
assert.match(source,/\{translate:'-104% 0px'\}/);
assert.match(source,/\{translate:'104% 0px'\}/);
assert.doesNotMatch(source,/registerTruck3D|truck3D|truckEntered|truckExited/);
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
  animate(frames){
    trace.push('animate:'+this.id+':'+frames.at(-1).translate);
    return {cancel(){},finished:Promise.resolve()};
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
assert.ok(api,'boot loading presentation must register immediately');
assert.equal(api.getState().kind,'boot');
assert.equal(api.getState().minimumMs,500);
assert.equal(await api.finishBoot(),true);
assert.ok(waits.some(ms=>ms>=500),'boot remains visible at least 500ms');
assert.equal(elements['async-loading-scene'].hidden,true);
assert.equal(api.getState().committed,1);
assert.equal(api.getState().visualMode,'translate-only-doors');

trace.length=0;waits.length=0;now+=100;
const course=api.begin({kind:'course'});
api.report(undefined,{progress:.425,phase:'Shaping terrain'});
assert.equal(elements['async-loading-progress'].style.width,'43%');
assert.equal(elements['async-loading-phase'].textContent,'Shaping terrain');
assert.equal(elements['async-loading-door-left'].style.left,'0%');
assert.equal(elements['async-loading-door-left'].style.translate,'0px 0px');
assert.equal(elements['async-loading-door-left'].style.width,'50%');
assert.equal(elements['async-loading-door-right'].style.right,'0%');
assert.equal(elements['async-loading-door-right'].style.translate,'0px 0px');
assert.equal(elements['async-loading-door-right'].style.width,'50%');
assert.equal(await api.finish({operation:course,commit:()=>trace.push('commit')}),true);
assert.deepEqual(trace,[
  'commit',
  'animate:async-loading-door-left:-104% 0px',
  'animate:async-loading-door-right:104% 0px'
],'destination must commit before both doors slide offscreen');
assert.equal(elements['async-loading-door-left'].style.width,'50%');
assert.equal(elements['async-loading-door-right'].style.width,'50%');
assert.equal(elements['async-loading-door-left'].style.scale,'1');
assert.equal(elements['async-loading-door-right'].style.scale,'1');
assert.ok(waits.some(ms=>ms>=500));
assert.equal(api.getState().active,false);
assert.equal(api.getState().doorsOpened,true);

now+=250;trace.length=0;
const p=api.run({kind:'retry',prepare:async ({signal,report})=>{
  assert.equal(signal.aborted,false);report({phase:'Checking course',progress:.3});
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
console.log('PASS async trailer: no truck, sliding halves, boot hold, commit sequence, retries, cancellation and failures');


// Optional scenery must never hold the main menu hostage. Reproduce a tree
// library that never finishes and a town-host script that has not downloaded.
const bootstrap=await read('src/app/bootstrap.mjs');
const optionalStart=bootstrap.indexOf('// Tree meshes are optional visual assets.');
const optionalEnd=bootstrap.indexOf('// V2 remains opt-in',optionalStart);
assert.ok(optionalStart>=0&&optionalEnd>optionalStart,'optional scenery boot boundary exists');
const optionalBlock=bootstrap.slice(optionalStart,optionalEnd);
assert.doesNotMatch(optionalBlock,/await\s+(?:window\.)?LongHaul(?:Towns|PrebuiltTrees)/,
  'optional GLB readiness cannot gate the Start button');
const never=new Promise(()=>{}), appended=[];
const startupContext={
  URL,
  window:{LongHaulPrebuiltTrees:{readyPromise:never},LongHaulTowns:{readyPromise:never}},
  console:{warn(){}},
  document:{createElement:()=>({}),head:{append:script=>appended.push(script)}}
};
const asynchronousSnippet=optionalBlock.replaceAll('import.meta.url',JSON.stringify('https://example.invalid/src/app/bootstrap.mjs'));
const didNotWait=await Promise.race([
  vm.runInNewContext(`(async()=>{${asynchronousSnippet}})()`,startupContext),
  new Promise(resolve=>setTimeout(()=>resolve(false),300))
]);
assert.notEqual(didNotWait,false,'unresolved decoration loads never delay menu activation');
assert.equal(appended.length,1);
assert.equal(appended[0].async,true,'optional town presenter loads without a script gate');
assert.match(appended[0].src,/connected-town-host\.js$/);
assert.doesNotThrow(()=>appended[0].onerror(new Error('offline')),
  'optional scenery script failure cannot block the menu');
assert.match(bootstrap,/entryButtons\.forEach\(button => button\.disabled = false\)/,
  'bootstrap still enables Start after the required engine hosts load');
console.log('PASS menu startup: GLB delays and town-host failures cannot block Endless Drive');
