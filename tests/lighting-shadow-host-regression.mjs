import assert from 'node:assert/strict';
import vm from 'node:vm';
import {TOON_STYLE} from '../src/game/toon-style.mjs';
import {readFileSync} from 'node:fs';
import {lightingPreset,LIGHTING_SHADOW_PRESETS,LIGHTING_SOURCE,shadowAnchor,shouldRefresh,selectClosest,planarDistanceSquared,profileSummary} from '../src/game/lighting-shadow-policy.mjs';
class V3 {constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this}copy(v){return this.set(v.x,v.y,v.z)}}
class Color {set(v){this.value=v;return this}}
class Obj {
 constructor(){this.position=new V3();this.scale=new V3(1,1,1);this.rotation=new V3();this.children=[];this.parent=null;this.visible=true;this.name='';this.userData={}}
 add(...nodes){for(const n of nodes){n.parent=this;this.children.push(n)}return this}
 remove(node){this.children=this.children.filter(n=>n!==node);node.parent=null}
 traverse(cb){cb(this);for(const child of this.children)child.traverse(cb)}
 traverseVisible(cb){if(!this.visible)return;cb(this);for(const child of this.children)child.traverseVisible(cb)}
 getWorldPosition(result){return result.copy(this.position)}
 getObjectByName(name){let found=null;this.traverse(x=>{if(!found&&x.name===name)found=x});return found}
 setMatrixAt(index,value){(this.transforms??=[])[index]=value}
 updateMatrix(){this.matrix={updated:true}}
 updateMatrixWorld(){}
}
class Mesh extends Obj {constructor(material){super();this.isMesh=true;this.material=material;this.castShadow=true;this.receiveShadow=false}}
class InstancedMesh extends Obj {constructor(geometry,material,count){super();this.isMesh=true;this.material=material;this.count=count;this.instanceMatrix={needsUpdate:false}}}
class BasicMaterial {constructor(options){Object.assign(this,options);this.isMeshBasicMaterial=true}}
class Plane {rotateX(){return this}}
class CanvasTexture {constructor(canvas){this.canvas=canvas}}
const THREE={Vector3:V3,Object3D:Obj,InstancedMesh,MeshBasicMaterial:BasicMaterial,PlaneGeometry:Plane,CanvasTexture,DoubleSide:2,PCFSoftShadowMap:3};
const gradient={addColorStop(){}}, canvas={width:0,height:0,getContext:()=>({createRadialGradient:()=>gradient,fillRect(){}})};
const worldRoot=new Obj(),sun=new Obj(),fill=new Obj(),hemi={color:new Color(),groundColor:new Color(),intensity:1};
sun.isDirectionalLight=true;sun.color=new Color();sun.castShadow=false;sun.target=new Obj();
sun.shadow={camera:{updateProjectionMatrix(){}},mapSize:new V3(),map:null,bias:0};
fill.isDirectionalLight=true;fill.color=new Color();worldRoot.add(sun,fill);
const hero=new Obj();for(let i=0;i<24;i++){const o=new Mesh({isMeshBasicMaterial:false});o.name='LH_cab_shell_part_'+i;hero.add(o)}
const truckRig={root:hero};
const materials={terrain:{},tree:{},road:{},grass:{}};
const cellGroup=new Obj(),nearRock=new Mesh({isMeshBasicMaterial:false}),tree=new Mesh(materials.tree);
nearRock.position.set(10,1,0);nearRock.scale.set(1,2,1);cellGroup.add(nearRock,tree);
const cellHosts=new Map([['cell',{visualOnly:false,group:cellGroup,patch:{bounds:{minX:-50,maxX:50,minZ:-50,maxZ:50},roads:[{a:{x:5,z:5,structure:'bridge'}}]},obstacles:[{x:2,z:3,radius:1,kind:'tree'}]}]]);
const arcadeTrafficRoot=new Obj(),arcadeVehicles=[];
for(let i=0;i<14;i++){const group=new Obj();group.position.set(i*8,0,0);arcadeTrafficRoot.add(group);arcadeVehicles.push({group,active:false,kind:i%4,collider:{width:2.5},speed:10,id:'traffic:'+i})}
const renderer={shadowMap:{enabled:false,type:null,autoUpdate:true,needsUpdate:false}};
const course={},settings={quality:true},state={position:{x:0,y:1,z:0},heading:0},window={};
let scene='driving',originalFrames=0;
const context={THREE,window,document:{createElement:()=>canvas},renderer,worldRoot,sun,hemi,
 settings,lightingPreset,LIGHTING_SHADOW_PRESETS,LIGHTING_SOURCE,shadowAnchor,
 shouldRefresh,selectClosest,planarDistanceSquared,profileSummary,
 clamp:(a,l,h)=>Math.max(l,Math.min(a,h)),lerp:(a,b,t)=>a+(b-a)*t,
 arcadeWeatherAmount:0,course,currentScene:()=>scene,readTruck:()=>state,
 materials,cellHosts,arcadeTrafficRoot,arcadeVehicles,truckRig,terrainHeight:()=>0,
 realizeCell:()=>{},decorateCell:()=>{},buildTruck:()=>truckRig,
 arcadeVisualFrame:()=>{originalFrames++},
 arcadeTrafficUpdate:()=>{
   for(let i=0;i<5;i++){const v=arcadeVehicles[i];if(v.active)continue;v.active=true;
     for(let j=0;j<9;j++){const m=new Mesh({isMeshBasicMaterial:false});m.name='LH_sedan_near_'+j;v.group.add(m)}
   }
 },console};
const source=readFileSync(new URL('../src/app/lighting-shadow-host.js',import.meta.url),'utf8');
vm.runInNewContext(source,context,{timeout:2000});
context.LongHaulToonStyle=TOON_STYLE;
vm.runInNewContext(readFileSync(new URL('../src/app/lighting-host.js',import.meta.url),'utf8'),context,{timeout:2000});
assert.equal(renderer.shadowMap.enabled,true);assert.equal(renderer.shadowMap.autoUpdate,false);
assert.equal(sun.castShadow,true);assert.equal(fill.castShadow,false);
assert.equal(sun.shadow.mapSize.x,1024);
context.arcadeTrafficUpdate(1/60);
assert.ok(arcadeVehicles.slice(0,5).every(v=>v.group.children.every(m=>m.castShadow===false)),'lazy traffic casting disabled before render');
context.arcadeVisualFrame(0);
assert.equal(originalFrames,1);
let metrics=window.LongHaulLighting.getState();
assert.equal(metrics.shadowMapEnabled,true);
assert.ok(metrics.shadowCasters>0&&metrics.shadowCasters<=54);
assert.ok(metrics.occlusionInstances>0&&metrics.occlusionInstances<=46);
assert.equal(metrics.shadowUpdates,1);
assert.equal(sun.position.x,-112+shadowAnchor(state,lightingPreset(true)).x);
assert.equal(window.LongHaulIllumination.getState().owner,'long-haul:lighting-host');
context.arcadeVisualFrame(10);
assert.equal(window.LongHaulLighting.getState().shadowUpdates,1);
context.arcadeVisualFrame(80);
assert.ok(window.LongHaulLighting.getState().shadowUpdates>=2);
settings.quality=false;
context.arcadeVisualFrame(160);
metrics=window.LongHaulLighting.getState();
assert.equal(metrics.mapSize,512);
assert.ok(metrics.shadowCasters<=profileSummary(false).casterCap);
assert.ok(metrics.occlusionInstances<=22);
scene='title';context.arcadeVisualFrame(180);
assert.equal(worldRoot.getObjectByName('LH_BudgetedAmbientContact').visible,false);
assert.equal(originalFrames,5);
assert.ok(!/\.github\/workflows|spendTruckDamage|vehicle\.speed\s*=|engine\.tick|wallet/.test(source));
console.log('PASS lighting host: 1024/512 maps, single sun, bounded casters and AO, lazy traffic and quality lifecycle');
