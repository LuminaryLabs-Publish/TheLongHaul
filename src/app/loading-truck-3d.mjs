/* TLH-LOAD-002: independent 3D Presentation renderer for the real authored hauler.
 * No gameplay scene, simulation, input, or save ownership.
 * The loading overlay is ready before the large game runtime imports.
 */
import * as THREE from 'three';
import {createHeroTruckMesh} from '../game/hero-truck-authoring.mjs';
import {createTruckGrounding} from '../game/truck-presentation.mjs';

const canvas=document.getElementById('async-loading-truck-3d');
const host=document.getElementById('async-loading-truck-3d-host');
const overlay=document.getElementById('async-loading-scene');
if(canvas&&host&&overlay){
  let renderer=null,rig=null,disposed=false,raf=0,last=null;
  let phase='unstarted',phaseElapsed=0;
  let pendingExit=null,entryDone=false,exitDone=false;
  let loaded=false,renderCount=0;
  const entryDuration=1.2,exitDuration=.7;
  const entryListeners=new Set();
  const ENTRY_X=-30,EXIT_X=30;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-14,14,7.875,-7.875,.1,90);
  camera.position.set(0,8,30);
  camera.lookAt(0,1.2,0);
  scene.add(new THREE.HemisphereLight(0xe8f4ff,0x53413b,2.0));
  const sun=new THREE.DirectionalLight(0xffe2bb,2.4);
  sun.position.set(-12,18,16);scene.add(sun);
  const rim=new THREE.DirectionalLight(0xc9f1ff,1.25);rim.position.set(10,8,-12);scene.add(rim);
  const gradient=new THREE.DataTexture(new Uint8Array([65,112,170,255]),4,1,THREE.RedFormat);
  gradient.minFilter=gradient.magFilter=THREE.NearestFilter;
  gradient.generateMipmaps=false;gradient.needsUpdate=true;
  const color=(hex)=>new THREE.MeshToonMaterial({color:hex,gradientMap:gradient});
  const materials={
    truckRed:color(0xd94234),truckCream:color(0xf0dfbc),
    truckDark:color(0x28313a),wood:color(0x936347),
    crate:color(0xb48a5a),crateDark:color(0x70513d)
  };
  const ease=t=>{const p=Math.min(1,Math.max(0,t));return p*p*(3-2*p)};
  function cancelPending(){
    if(!pendingExit)return;
    const {reject,signal,abort,beginExit}=pendingExit;
    entryListeners.delete(beginExit);
    signal?.removeEventListener('abort',abort);
    pendingExit=null;
    reject(new Error('SCENE_LOAD_CANCELLED'));
  }
  function scheduleFrame(){
    if(!raf && !disposed && !overlay.hidden && overlay.style.display!=='none')
      raf=requestAnimationFrame(tick);
  }
  function resize(){
    if(!renderer)return;
    const w=Math.max(1,Math.floor(host.clientWidth||overlay.clientWidth||960));
    const h=Math.max(1,Math.floor(host.clientHeight||overlay.clientHeight||540));
    renderer.setSize(w,h,false);
    const span=8.2,aspect=w/h;
    camera.left=-span*aspect;camera.right=span*aspect;
    camera.top=span;camera.bottom=-span;
    camera.updateProjectionMatrix();
  }
  function tick(now){
    raf=0;
    if(disposed||!renderer||!rig)return;
    if(overlay.hidden||overlay.style.display==='none'){
      last=null;
      return;
    }
    // Advance only when an actual presentation frame is rendered. An async
    // import or a busy worker may delay frames; wall-clock time must never
    // teleport an unseen truck directly into its parked position.
    const dt=last===null?0:Math.min(.05,Math.max(0,(now-last)/1000));
    last=now;
    if(phase==='enter'||phase==='exit')phaseElapsed+=dt;
    let x=0;
    if(phase==='enter'){
      const p=ease(phaseElapsed/entryDuration);
      x=ENTRY_X*(1-p);
      if(p>=1){
        phase='idle';entryDone=true;x=0;
        for(const done of [...entryListeners])done();
        entryListeners.clear();
      }
    }else if(phase==='exit'){
      const p=ease(phaseElapsed/exitDuration);
      x=EXIT_X*p;
      if(p>=1){
        phase='offscreen';exitDone=true;x=EXIT_X;
        if(pendingExit){
          const {resolve,signal,abort}=pendingExit;
          signal?.removeEventListener('abort',abort);
          pendingExit=null;resolve();
        }
      }
    }else if(phase==='offscreen')x=EXIT_X;
    else if(phase==='unstarted')x=ENTRY_X;
    rig.root.position.set(x,-.7,0);
    rig.root.rotation.set(0,Math.PI/2,0);
    if(phase==='enter'||phase==='exit')
      for(const wheel of rig.wheels||[])wheel.rotateY(-dt*9);
    renderer.render(scene,camera);renderCount++;
    if(phase!=='offscreen')scheduleFrame();
  }
  function start(){
    if(disposed||!rig)return false;
    cancelPending();
    entryListeners.clear();
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    phase='enter';phaseElapsed=0;last=null;
    entryDone=false;exitDone=false;
    rig.root.position.set(ENTRY_X,-.7,0);
    rig.root.rotation.set(0,Math.PI/2,0);
    host.style.visibility='visible';host.style.opacity='1';
    // The initial pose is rendered explicitly, before any motion starts.
    // Loading starts the timeline only when the host becomes visible.
    renderer.render(scene,camera);renderCount++;
    scheduleFrame();
    return true;
  }
  function exit(signal){
    if(disposed||!rig||phase==='offscreen')return Promise.resolve();
    if(signal?.aborted)return Promise.reject(new Error('SCENE_LOAD_CANCELLED'));
    if(pendingExit)return pendingExit.promise;
    let resolveExit,rejectExit;
    const promise=new Promise((resolve,reject)=>{resolveExit=resolve;rejectExit=reject});
    const beginExit=()=>{
      if(!pendingExit||disposed||signal?.aborted)return;
      entryListeners.delete(beginExit);
      phase='exit';phaseElapsed=0;last=null;
      // Do not force the position to zero; entrance completion establishes
      // the actual center pose on a rendered frame.
      scheduleFrame();
    };
    const abort=()=>{
      if(!pendingExit)return;
      entryListeners.delete(beginExit);
      pendingExit=null;
      rejectExit(new Error('SCENE_LOAD_CANCELLED'));
    };
    pendingExit={promise,resolve:resolveExit,reject:rejectExit,signal,abort,beginExit};
    signal?.addEventListener('abort',abort,{once:true});
    if(entryDone)beginExit();
    else entryListeners.add(beginExit);
    return promise;
  }
  function dispose(){
    disposed=true;
    if(raf)cancelAnimationFrame(raf);
    cancelPending();
    rig?.heroRelease?.();
    for(const material of Object.values(materials))material.dispose();
    gradient.dispose();
    renderer?.dispose();
  }
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setClearColor(0x000000,0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
    rig=createHeroTruckMesh({THREE,materials,createTruckGrounding});
    scene.add(rig.root);
    resize();window.addEventListener('resize',resize,{passive:true});
    loaded=true;
    const api={enter:start,exit,dispose,getState:()=>({
      ready:loaded,source:rig.heroSourceId,authored:true,phase,
      entered:entryDone,exited:exitDone,renderCount,
      entranceProgress:entryDone?1:Math.min(1,phaseElapsed/entryDuration)
    })};
    window.LongHaulLoadingTruck3D=api;
    // The async host owns the loading timeline; registration starts the
    // current boot operation once. Never call start() again here.
    if(!window.LongHaulAsyncLoading?.registerTruck3D)
      start();
    else window.LongHaulAsyncLoading.registerTruck3D(api);
  }catch(error){
    renderer?.dispose();
    console.warn('Authored loading truck render unavailable',error);
    window.LongHaulLoadingTruck3D={enter:()=>false,exit:()=>Promise.resolve(),
      getState:()=>({ready:false,authored:false,reason:String(error)})};
  }
}
