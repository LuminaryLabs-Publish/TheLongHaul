import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/app/menu-attract-host.js',import.meta.url),'utf8');
const markup=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
assert.match(markup,/id="start-btn"[^>]*title-endless/);
assert.match(markup,/id="campaign-coming-soon"[^>]*disabled/);
assert.match(markup,/id="settings-btn"[^>]*title-settings/);
assert.match(css,/#title-screen \.title-card\{[^}]*justify-self:center/);
for(const asset of ['logo','endless','campaign','settings']){
  assert.match(css+markup,new RegExp('art/menu/'+asset+'\\.webp'));
  assert.ok(fs.statSync(new URL('../art/menu/'+asset+'.webp',import.meta.url)).size>1000);
}
assert.match(source,/createPatchWorkerClient\(previewCourse/);
assert.match(source,/createTerrainMesh\(patch\)/);
assert.match(source,/_lhRoadMesh\(group/);
assert.match(source,/_lhRoadLine\(group/);
assert.match(source,/environmentCellPlanSteps\(/);
assert.match(source,/renderPreview\?\./);
assert.doesNotMatch(source,/requestAnimationFrame\(/);
assert.doesNotMatch(source,/localStorage\.setItem/);

let scene='title',now=0,frames=0,disposed=0,roadMeshes=0,terrainMeshes=0,treeDraws=0;
let generationRequests=0,worldSaves=0;
class Node{
  constructor(){
    this.visible=true;this.children=[];this.style={};this.parent=null;this.userData={};
    this.position={x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z})}};
    this.rotation={set(){}};
  }
  add(...nodes){for(const node of nodes){node.removeFromParent?.();node.parent=this;this.children.push(node)}}
  removeFromParent(){if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null}}
  getObjectByName(){return null}
}
class Geometry {dispose(){disposed++}}
const title=new Node(),loading=new Node(),worldRoot=new Node(),cellRoot=new Node(),dynamicRoot=new Node();
const titleClasses=new Set(['active','menu-screen']);
title.classList={contains:x=>titleClasses.has(x),remove:x=>titleClasses.delete(x)};
loading.firstElementChild=new Node();
worldRoot.add(cellRoot,dynamicRoot);
const bodyClasses=new Set();
const previewPoint=(_,p)=>({x:Math.sin(p/200)*6,y:0,z:-p,progress:p});
const material={},treeGeometry=new Geometry();
const context={
  THREE:{Group:Node,Mesh:Node,BufferGeometry:Geometry,BufferAttribute:class{}},
  document:{
    querySelector:id=>id==='#title-screen'?title:loading,
    body:{classList:{add(...keys){keys.forEach(key=>bodyClasses.add(key))},
      remove(...keys){keys.forEach(key=>bodyClasses.delete(key))}}}
  },
  worldRoot,cellRoot,dynamicRoot,camera:{position:{set(){}},lookAt(){}},
  WORLD_ID:'cinematic-test',CELL_SIZE:160,ROAD_GENERATOR_VERSION:'v2',
  _lhAsphaltMaterial:material,_lhPavedShoulderMaterial:material,
  _lhGravelMaterial:material,_lhGravelShoulderMaterial:material,
  _lhDirtMaterial:material,_lhDirtShoulderMaterial:material,
  createEndlessHighway:(seed,{generatorVersion})=>({seed,generatorVersion,endless:{revision:0}}),
  createTerrainMesh:()=>{terrainMeshes++;return {mesh:new Node(),geometry:new Geometry()}},
  _lhRoadMesh:()=>{roadMeshes++},_lhRoadLine:()=>{},
  _lhWhiteLineMaterial:material,_lhYellowLineMaterial:material,_lhAddRoadside:()=>{},
  environmentCellPlanSteps:function*(){yield {processedTiles:1};return {objects:[]}},
  createEnvironmentTileRenderer:()=>({
    startCell:()=>({}),queueObject(){},finalizeStep:()=>({finished:true}),releaseCell(){}
  }),
  createPatchWorkerClient:()=>({
    prepare:cell=>{
      generationRequests++;
      return Promise.resolve({cellId:cell.id,coordinates:cell.coordinates,bounds:cell.bounds,
        terrain:{},roads:[{surface:'paved'}],nearTrees:{positions:[]},vegetation:[]});
    },updateCourse(){},dispose(){disposed++}
  }),
  createHeroTruckMesh:()=>({root:new Node(),wheels:[]}),createTruckGrounding:()=>({}),
  materials:{tree:material},settings:{quality:true,motion:true},
  terrainHeight:()=>0,nearestRoad:()=>null,
  endlessHighwayPoint:previewPoint,
  advanceEndlessHighway:()=>({changed:false,revision:0}),
  currentScene:()=>scene,
  window:{
    matchMedia:()=>({matches:false}),
    LongHaulPrebuiltTrees:{renderPreview(){treeDraws++;return true}}
  },
  arcadeVisualFrame:()=>{frames++},
  console:{warn(error){throw Error(String(error))}}
};
vm.runInNewContext(source,context,{filename:'menu-attract-host.js'});
const api=context.window.LongHaulTitleAttract;
assert.ok(api);assert.equal(titleClasses.has('menu-screen'),false);
const tick=async(milliseconds)=>{
  now=milliseconds;context.arcadeVisualFrame(now);
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
};
for(let i=0;i<24;i++)await tick(i*70);
let state=api.getState();
assert.equal(state.active,true);
assert.equal(state.mode,'title');
assert.equal(state.previewOnly,true);
assert.equal(state.canonicalRoads,true);
assert.ok(state.meshCount>0&&state.meshCount<=25);
assert.ok(terrainMeshes>0&&roadMeshes>0&&treeDraws>0);
assert.equal(worldSaves,0);
assert.equal(bodyClasses.has('world-visible'),true);
assert.equal(cellRoot.visible,false);
assert.equal(dynamicRoot.visible,false);
const progress=state.progress;
context.settings.motion=false;await tick(now+100);
assert.equal(api.getState().progress,progress);
context.settings.motion=true;
scene='generating';await tick(now+100);
state=api.getState();assert.equal(state.mode,'generating');
assert.equal(state.active,true);
assert.equal(loading.style.background,'rgba(5,12,17,.20)');
scene='driving';await tick(now+100);
state=api.getState();
assert.equal(state.active,false);
assert.equal(state.meshCount,0);
assert.equal(cellRoot.visible,true);
assert.equal(dynamicRoot.visible,true);
assert.ok(disposed>0&&frames>10);
assert.equal(state.saveWrites,0);
scene='title';await tick(now+100);await tick(now+100);
assert.equal(api.getState().active,true);
assert.ok(generationRequests>0);
console.log('PASS cinematic title + loading cutover: real patch/road/environment hosts, camera, reduced motion, generation, cleanup, reentry, no save writes');
