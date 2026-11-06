import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const file=new URL('../src/app/menu-attract-host.js',import.meta.url);
const source=fs.readFileSync(file,'utf8');
const markup=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
assert.match(markup,/id="start-btn"[^>]*title-endless/);
assert.match(markup,/id="campaign-coming-soon"[^>]*disabled/);
assert.match(markup,/id="settings-btn"[^>]*title-settings/);
assert.match(css,/#title-screen \.title-card\{[^}]*justify-self:center/);
assert.match(fs.readFileSync(new URL('../src/app/app-chunk-11.js',import.meta.url),'utf8'),/startGeneration\(newSeed\(\), false, \"start\"\)/);
for(const asset of ['logo','endless','campaign','settings']) {
 assert.match(css+markup,new RegExp(`art/menu/${asset}\\.webp`));
 assert.ok(fs.statSync(new URL(`../art/menu/${asset}.webp`,import.meta.url)).size>1000);
}
let disposed=0, originalFrames=0, scene='title', now=0;
class Node {constructor(){this.children=[];this.visible=true;this.position={x:0,y:0,z:0,set:(x,y,z)=>Object.assign(this.position,{x,y,z})};this.rotation={x:0,y:0,z:0,set:(x,y,z)=>Object.assign(this.rotation,{x,y,z})};this.scale={set:()=>{}};this.rotateY=()=>{};this.isDirectionalLight=false;}add(x){this.children.push(x);x.parent=this;}removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)}getObjectByName(){return null;}}
class Geometry {setAttribute(){}setIndex(){}computeVertexNormals(){}dispose(){disposed++}}
class Mesh extends Node{constructor(geometry,material){super();this.geometry=geometry;this.material=material}}
const THREE={Group:Node,Mesh,BufferGeometry:Geometry,Float32BufferAttribute:class{},MeshLambertMaterial:class{},MeshBasicMaterial:class{},DoubleSide:2};
const worldRoot=new Node();const title=new Node();title.classList={contains:v=>v==='active'};
const arcadeMenuTruck=new Node(),camera={position:{set(){}},lookAt(){}},geometries={plane:new Geometry()};
const point=(_,s)=>({progress:s,x:Math.sin(s/2200)*12,y:0,z:-s,nx:1,nz:0,width:28,bank:0,kind:'straight'});
const context={THREE,document:{querySelector:()=>title},worldRoot,geometries,arcadeMenuTruck,camera,materials:{},createTruckGrounding:()=>({}),createHeroTruckMesh:()=>({root:new Node()}),roadChunkSample:point,roadRibbonData:segments=>({positions:[0,0,0,1,0,0,0,0,1],uvs:[0,0,1,0,0,1],indices:[0,1,2]}),currentScene:()=>scene,settings:{motion:true},window:{matchMedia:()=>({matches:false})},console:{warn(e){throw Error(e)}} ,arcadeVisualFrame:()=>{originalFrames++}};
vm.runInNewContext(source,context,{filename:'menu-attract-host.js'});
const api=context.window.LongHaulTitleAttract;assert.ok(api);
for(let i=0;i<3000;i++){now=i*100;context.arcadeVisualFrame(now)}
let state=api.getState();assert.equal(state.active,true);assert.ok(state.progress < -3500);assert.ok(state.roadRebuilds > 5);assert.ok(state.meshCount <= 9);assert.equal(state.saveWrites,0);
const p=state.progress;context.settings.motion=false;context.arcadeVisualFrame(now+100);assert.equal(api.getState().progress,p);
scene='driving';context.arcadeVisualFrame(now+200);state=api.getState();assert.equal(state.active,false);assert.equal(state.meshCount,0);assert.ok(disposed>0);assert.ok(originalFrames>3000);
console.log('PASS cinematic title: assets, centered controls, 300-second bounded road sample, reduced motion, cleanup and no save writes');
