import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('src/app/startup-controller.js');
const bootstrap=read('src/app/bootstrap.mjs');
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function harness({finishBoot=async()=>true}={}) {
  const listeners=new Map(), timers=new Map(), scripts=[], buttons=[];
  let serial=0,released=0;
  const events={
    addEventListener(type,fn){const set=listeners.get(type)??new Set();set.add(fn);listeners.set(type,set);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
    dispatchEvent(event){for(const fn of [...listeners.get(event.type)??[]])fn(event);}
  };
  const button=(id,disabled=false)=>{const x={id,disabled,closest:()=>x};buttons.push(x);return x;};
  const start=button('start-btn'), originallyDisabled=button('freight-resume-btn',true);
  const panel={classList:{shown:false,add(){this.shown=true;},remove(){this.shown=false;}}};
  const status={hidden:true},error={textContent:''};
  const document={...events,
    querySelectorAll:()=>buttons,
    getElementById:id=>({'boot-failure':panel,'startup-status':status,'boot-error':error}[id]),
    createElement:()=>({remove(){this.removed=true;}}),
    head:{append(script){scripts.push(script);h.onScript?.(script);}}
  };
  const window={...events,LongHaulAsyncLoading:{finishBoot,releaseBoot(){released++;},report(){}}};
  const context={document,window,URL,Event,console:{warn(){}},
    setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},
    clearTimeout(id){timers.delete(id);}};
  const h={context,window,document,start,originallyDisabled,button,scripts,panel,status,error,timers,listeners,
    fire(ms){for(const [id,t] of [...timers])if(t.ms===ms){timers.delete(id);t.fn();}},
    released:()=>released};
  vm.runInNewContext(source,context);h.api=window.LongHaulStartup;return h;
}
{
 const h=harness();assert.equal(h.start.disabled,true);
 let stopped=false;h.document.dispatchEvent({type:'click',target:h.start,preventDefault(){},stopImmediatePropagation(){stopped=true;}});
 assert.equal(stopped,true);h.fire(12000);
 assert.equal(h.status.hidden,false);assert.equal(h.panel.classList.shown,false,'slow is not failed');
 h.api.runtimeReady();assert.equal(h.window.__longHaulBooted,false,'runtime initialized is not menu ready');
 const resume=h.button('freight-resume-btn');
 const first=h.api.complete();assert.equal(h.api.complete(),first,'completion is idempotent');
 assert.equal(await first,true);assert.equal(h.start.disabled,false);assert.equal(resume.disabled,false);
 assert.equal(h.originallyDisabled.disabled,true,'do not enable a control disabled by its owner');
 assert.equal(h.api.getState().status,'ready');assert.equal(h.window.__longHaulBooted,true);
 assert.equal(h.listeners.get('click').size,0);assert.equal(h.listeners.get('error').size,0);
 assert.equal(h.timers.size,0);assert.equal(h.api.fail(Error('late')),false);
}
{
 const h=harness();h.api.runtimeReady();h.api.fail(Error('required-host-failure'));
 assert.equal(h.api.getState().status,'failed');assert.equal(h.start.disabled,true);
 assert.equal(h.panel.classList.shown,true);assert.match(h.error.textContent,/required-host-failure/);
 assert.equal(h.listeners.get('click').size,0);assert.equal(h.timers.size,0);
 assert.equal(await h.api.complete(),false);assert.equal(h.window.__longHaulBooted,false);
}
{
 const h=harness({finishBoot:()=>new Promise(()=>{})});h.api.runtimeReady();const done=h.api.complete();
 await flush();h.fire(3000);assert.equal(await done,true);
 assert.equal(h.released(),1,'bounded reveal releases only the boot operation');
}
{
 const h=harness();const p=h.api.loadScript('https://example.invalid/runtime.js');
 const rejected=assert.rejects(p,/syntax-error/);
 h.window.dispatchEvent({type:'error',filename:h.scripts[0].src,error:Error('syntax-error')});
 await rejected;assert.equal(h.api.getState().status,'failed','script onload alone is not execution proof');
}
{
 const h=harness();const p=h.api.loadScript('https://example.invalid/tree.js',{optional:true,timeoutMs:8000});
 h.fire(8000);assert.equal(await p,false);assert.equal(h.api.getState().status,'loading');
 const q=h.api.loadScript('https://example.invalid/required.js');const rejected=assert.rejects(q,/Could not load/);
 h.scripts.at(-1).onerror();await rejected;
 h.api.fail(Error('required.js'));assert.equal(h.api.getState().status,'failed');
}
{
 const h=harness();h.window.dispatchEvent({type:'unhandledrejection',reason:Error('import-failure')});
 assert.equal(h.api.getState().status,'failed');assert.equal(h.released(),1);
}
{
 const h=harness();h.fire(60000);assert.equal(h.api.getState().status,'failed');
 assert.match(h.error.textContent,/game modules/);assert.equal(h.start.disabled,true);
}
// Failure during an in-flight reveal cannot become a later success.
{
 let release;const h=harness({finishBoot:()=>new Promise(resolve=>{release=resolve;})});
 h.api.runtimeReady();const done=h.api.complete();h.api.fail(Error('fatal-during-reveal'));
 release(true);assert.equal(await done,false);assert.equal(h.window.__longHaulBooted,false);
 assert.equal(h.start.disabled,true);assert.equal(h.listeners.get('click').size,0);
}
{
 const h=harness();const p=h.api.loadScript('https://example.invalid/preview.js',{optional:true});
 h.window.dispatchEvent({type:'error',filename:h.scripts[0].src,error:Error('optional-syntax-error')});
 assert.equal(await p,false);assert.equal(h.api.getState().status,'loading');h.api.fail(Error('end fixture'));
}
{
 const h=harness();const overlay={hidden:false,style:{pointerEvents:'auto'},setAttribute(){}};
 const get=h.document.getElementById;h.document.getElementById=id=>id==='async-loading-scene'?overlay:get(id);
 delete h.window.LongHaulAsyncLoading;h.api.runtimeReady();assert.equal(await h.api.complete(),true);
 assert.equal(overlay.hidden,true);assert.equal(overlay.style.pointerEvents,'none','missing loader script cannot leave a click shield');
}

// Execute the actual outer bootstrap, not a text-only readiness check. Optional
// scripts and GLBs intentionally never settle; required hosts alone release entry.
const program=bootstrap.slice(bootstrap.indexOf('// One controller owns entry readiness.'))
 .replaceAll('import.meta.url',JSON.stringify('https://example.invalid/src/app/bootstrap.mjs'));
for(const broken of [null,'endless-roads.js','runtime-silent-failure']){
 const h=harness();h.onScript=script=>{
  if(/prebuilt-tree-host|connected-town-host|menu-attract-host/.test(script.src))return;
  if(broken==='endless-roads.js'&&script.src.endsWith(broken)){script.onerror();return;}
  if(script.src.endsWith('app-runtime.js')&&broken!=='runtime-silent-failure')h.api.runtimeReady();
  if(script.src.endsWith('endless-roads.js'))h.window.__longHaulRoadsReady=true;
  if(script.src.endsWith('visual-presentation.js'))h.window.__longHaulVisualsReady=true;
  if(script.src.endsWith('freight-terminal-host.js'))h.window.LongHaulFreightTerminal={readyPromise:Promise.resolve(false)};
  script.onload();
 };
 await vm.runInNewContext(`(async()=>{${program}})()`,h.context);
 assert.equal(h.api.getState().status,broken?'failed':'ready');
 assert.equal(h.start.disabled,Boolean(broken));assert.equal(h.listeners.get('click').size,0);
}
// The actual shipped launch wrapper must accept zero or one payout nodes.
// The previous generated bundle used $ instead of $$ here and threw before
// reaching course generation. Test source and rebuilt deliverable separately.
for(const path of ['src/app/app-chunk-18.js','vendor/app-runtime.js'])for(const hasPayout of [false,true]){
 const line=read(path).split('\n').find(line=>line.trim().startsWith('startGeneration=function(...args){const sceneId='));
 assert.ok(line);let started=0,removed=0;
 const payout={remove(){removed++;}},elements=new Map();
 const c={engine:{n:{coreScene:{getCurrentScene:()=>({id:'title'})}}},generation:null,
  arcadeStartGeneration(){started++;c.generation={ready:false,error:null};},
  arcadeGaragePanel:{},arcadeTrafficRoot:{children:[]},arcadeVehicles:[],
  $:selector=>selector==='#arcade-endless-payout'?(hasPayout?payout:null):
    selector==='#arcade-loss-payout'?null:(elements.get(selector)??elements.set(selector,{}).get(selector)),
  $$:()=>hasPayout?[payout]:[],crypto:{randomUUID:()=> 'test-launch'}};
 vm.runInNewContext(line,c);c.startGeneration('fixture',false,'start');
 assert.equal(started,1,`${path}: must reach generation without a payout element`);
 assert.equal(removed,hasPayout?1:0);
 c.startGeneration('fixture',false,'start');assert.equal(started,1,'double click cannot start another course');
}
console.log('PASS menu startup: actual bootstrap, optional stalls, required failures, reveal timeout, dynamic Resume, cleanup, shipped launch wrapper');
