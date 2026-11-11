import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import * as N from '../vendor/nexusengine.mjs';
import {createComicCrashKits}from '../src/game/destructible-vehicle-kit.mjs';
import {createImpactClock}from '../src/game/impact-kit.mjs';
import {createTrafficVehicleFactory}from '../src/game/traffic-vehicle-authoring.mjs';
const engine=N.createEngine({kits:createComicCrashKits(N)}),impulses=[];engine.n.longHaulTruck={impulse:x=>impulses.push(x)};engine.n.longHaulRun={penalty(){}};
const nodes=[],stage={append:n=>nodes.push(n),getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})};
const node=()=>({style:{},dataset:{},hidden:true,setAttribute(){}});
let damage=0,cargo=0,scene='driving';const truck={position:{x:0,y:0,z:0},velocity:{x:0,y:0,z:30},heading:0,speed:30,effectiveMass:6500};
const seen=new Set(),worldRoot=new THREE.Group(),camera=new THREE.PerspectiveCamera(60,16/9,.1,1000);camera.position.set(0,8,-24);camera.lookAt(0,1,0);
const sandbox={THREE,N,engine,createImpactClock,window:{addEventListener(){}},document:{createElement:node,addEventListener(){},hidden:false},worldRoot,camera,
 $:s=>s==='#game-stage'?stage:null,readTruck:()=>truck,runKey:'run1',course:{seed:'test'},settings:{motion:true,hitStop:1},arcadeVehicles:[],
 resetArcadeOverhaul(){},mapOpen:false,skillMenuOpen:()=>false,arcadeGaragePanel:{hidden:true},launchIntro:{active:false},currentScene:()=>scene,
 clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),finite:(x,f=0)=>Number.isFinite(Number(x))?Number(x):f,
 spendTruckDamage:n=>{damage+=n;return n;},spendCargoDamage:n=>{cargo+=n;},
 applyLongHaulOperationOnce:(e,r,id,fn)=>{if(seen.has(id))return{applied:false};seen.add(id);fn();return{applied:true};},arcadeRecord(){},audio:{hit(){}}
};
vm.createContext(sandbox);vm.runInContext(readFileSync(new URL('../src/app/app-chunk-22.js',import.meta.url),'utf8'),sandbox);
const factory=createTrafficVehicleFactory({THREE,materials:{truckRed:{}}}),visual=factory.createVehicle('sedan');const vehicle={id:'a',kind:0,group:visual.root,comicBreakup:()=>factory.createBreakup('sedan')};vehicle.group.visible=true;worldRoot.add(vehicle.group);sandbox.arcadeVehicles.push(vehicle);engine.n.longHaulDestructibles.register('a');
sandbox.beginComicCrashFrame(1/60,'driving'); // reset run-local state first
engine.n.longHaulDestructibles.register('a');vehicle.comicBreakup=()=>factory.createBreakup('sedan');
const event={id:'e1',tick:1,targetId:'a',point:{x:0,y:1,z:2},normal:{x:.6,z:-.8},closingSpeed:30,response:{tier:'heavy',severity:1,truckDamage:20,cargoDamage:4,targetDamage:300,hitStop:.09,impulse:{x:3,z:-5,headingDelta:.1}}};
sandbox.applyComicTrafficImpact(vehicle,event,{x:0,z:10});
assert.equal(damage,20);assert.equal(cargo,4);assert.equal(impulses.length,1);assert.equal(vehicle.group.visible,false);assert.equal(engine.n.longHaulDestructibles.get('a').state,'destroyed');
sandbox.applyComicTrafficImpact(vehicle,event,{x:0,z:10});assert.equal(damage,20);assert.equal(impulses.length,1,'no duplicate shove');
sandbox.beginComicCrashFrame(1/60,'driving');assert.equal(sandbox.window.LongHaulComicCrashes.getState().held,true);
sandbox.updateComicCrashPresentation(1/60,'driving',false);let state=sandbox.window.LongHaulComicCrashes.getState();assert.ok(state.fragments>0&&state.fragments<=80);assert.ok(state.bursts>0);assert.ok(nodes.some(n=>n.textContent==='KAPOW!'||n.textContent==='WHAM!'));
for(let i=0;i<30;i++)sandbox.presentComicImpact({...event,id:'burst'+i},true);
state=sandbox.window.LongHaulComicCrashes.getState();assert.ok(state.puffs<=24&&state.bursts<=4);
for(let i=0;i<260;i++){sandbox.beginComicCrashFrame(1/60,'driving');sandbox.updateComicCrashPresentation(1/60,'driving',true);}
state=sandbox.window.LongHaulComicCrashes.getState();assert.equal(state.fragments,0);assert.equal(state.puffs,0);assert.equal(state.bursts,0);assert.equal(engine.n.longHaulDestructibles.get('a').state,'retired');
sandbox.presentComicImpact(event);sandbox.beginComicCrashFrame(.01,'paused');assert.equal(sandbox.window.LongHaulComicCrashes.getState().held,false);
sandbox.settings.motion=false;sandbox.presentComicImpact(event);assert.equal(sandbox.window.LongHaulComicCrashes.getState().remaining,0);
sandbox.resetArcadeOverhaul();state=sandbox.window.LongHaulComicCrashes.getState();assert.equal(state.fragments,0);assert.equal(state.vehicles.length,0);assert.equal(state.impact.contacts,0);
console.log('PASS crash host: one damage/impulse, six-part-source breakup, destruction visibility, hit-stop, pooled saturation, timed retirement, pause/reduced motion/reset. Geometry-bearing CPU fixture; NOT WebGL gameplay.');
// Ten minutes of deterministic host-time stress. This measures transient CPU
// lifetime/clock behavior; it deliberately makes no WebGL or hardware claim.
sandbox.settings.motion=true;sandbox.settings.hitStop=1;sandbox.runKey='stress';sandbox.beginComicCrashFrame(0,'driving');
let simulated=0,heldFrames=0,peakFragments=0,peakPuffs=0,peakBursts=0;const started=performance.now();
for(let frame=0;frame<36000;frame++){
 sandbox.beginComicCrashFrame(1/60,'driving');
 const held=sandbox.window.LongHaulComicCrashes.getState().held;
 if(held)heldFrames++;else simulated+=1/60;
 if(frame%120===0){if(vehicle.id)engine.n.longHaulDestructibles.remove(vehicle.id);vehicle.id='stress-'+frame;vehicle.group.visible=true;vehicle.comicBreakup=()=>factory.createBreakup('sedan');engine.n.longHaulDestructibles.register(vehicle.id);
  sandbox.applyComicTrafficImpact(vehicle,{...event,id:'stress-'+frame,targetId:vehicle.id,tick:frame},{x:0,z:10});}
 sandbox.updateComicCrashPresentation(1/60,'driving',!held);
 const current=sandbox.window.LongHaulComicCrashes.getState();peakFragments=Math.max(peakFragments,current.fragments);peakPuffs=Math.max(peakPuffs,current.puffs);peakBursts=Math.max(peakBursts,current.bursts);
 assert.ok(current.fragments<=80&&current.puffs<=24&&current.bursts<=4&&current.vehicles.length<=14);
}
assert.ok(heldFrames>0&&Math.abs(simulated-(600-heldFrames/60))<1e-6);sandbox.resetArcadeOverhaul();assert.equal(sandbox.window.LongHaulComicCrashes.getState().fragments,0);
console.log(JSON.stringify({status:'PASS',scope:'600 simulated seconds; CPU host fixture, NOT actual gameplay',crashes:300,heldFrames,simulatedSeconds:simulated,peakFragments,peakPuffs,peakBursts,cpuMilliseconds:Math.round(performance.now()-started)}));
