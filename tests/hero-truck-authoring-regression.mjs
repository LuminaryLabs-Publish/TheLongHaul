import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createHeroTruckMesh, HERO_TRUCK_SOURCE } from '../src/game/hero-truck-authoring.mjs';

// A headless contract fixture, not a substitute for actual Three/WebGL render.
class V3 {
  constructor(x=0,y=0,z=0){ this.x=x;this.y=y;this.z=z; }
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  setScalar(s){return this.set(s,s,s);}
  clone(){return new V3(this.x,this.y,this.z);}
}
class Obj {
  constructor(){this.name='';this.position=new V3();this.rotation=new V3();this.scale=new V3(1,1,1);this.children=[];this.userData={};this.parent=null;this.matrix={mock:true};}
  add(...items){for(const it of items){if(it.parent){it.parent.remove(it)}this.children.push(it);it.parent=this}return this;}
  remove(o){this.children=this.children.filter(x=>x!==o);o.parent=null;}
  clear(){for(const x of this.children)x.parent=null;this.children=[];}
  removeFromParent(){this.parent?.remove(this)}
  updateMatrix(){}
  traverseVisible(cb){cb(this);for(const x of this.children)x.traverseVisible(cb)}
}
class Geometry {
  constructor(kind,...args){this.kind=kind;this.args=args;this.attributes={};this.disposed=false;}
  translate(){return this} computeBoundingBox(){return this}computeVertexNormals(){return this}dispose(){this.disposed=true}
  setAttribute(k,v){this.attributes[k]=v;return this}setIndex(i){this.index=i;return this}
}
class Shape {constructor(){this.points=[]}moveTo(x,y){this.points.push([x,y])}lineTo(x,y){this.points.push([x,y])}quadraticCurveTo(x1,y1,x2,y2){this.points.push([x1,y1],[x2,y2])}closePath(){}}
class Mat {constructor(opt={}){Object.assign(this,opt);this.disposed=false}dispose(){this.disposed=true}}
class Mesh extends Obj {constructor(geom,mat){super();this.geometry=geom;this.material=mat;this.isMesh=true}}
class InstancedMesh extends Mesh {constructor(geom,mat,count){super(geom,mat);this.count=count;this.instanceMatrix={needsUpdate:false};this.matrices=[]}setMatrixAt(i,m){this.matrices[i]=m}computeBoundingSphere(){}}
const THREE={ Group:Obj, Object3D:Obj, Shape, Mesh, InstancedMesh, MeshToonMaterial:Mat, DoubleSide:2,
  ExtrudeGeometry: class extends Geometry{constructor(...p){super('extrude',...p)}},
  CylinderGeometry: class extends Geometry{constructor(...p){super('cylinder',...p)}},
  TorusGeometry: class extends Geometry{constructor(...p){super('torus',...p)}},
  BufferGeometry:class extends Geometry{constructor(){super('buffer')}},
  Float32BufferAttribute:class {constructor(array,size){this.array=array;this.itemSize=size}}
};
const gradientMap={name:'four-band-toon'};
const materials=Object.fromEntries(['truckRed','truckCream','truckDark','wood','crate','crateDark'].map(n=>[n,{name:n,gradientMap}]));
const ground=(three,body,options)=>{
 assert.equal(three,THREE);assert.equal(options.heroSupportOnly,true);
 const supports=[];body.traverseVisible(x=>{if(x.isMesh&&x.userData.heroGroundingSupport)supports.push(x)});
 assert.ok(supports.length>=10, 'cab, bed, wheels, chassis are grounding supports');
 return {resolve(){},points:[]};
};
const rig=createHeroTruckMesh({THREE,materials,createTruckGrounding:ground});
assert.equal(rig.heroAuthored,true);
assert.equal(rig.root.name,'LH_HeroHauler');
assert.equal(rig.wheels.length,6);
assert.equal(rig.steering.length,2);
assert.equal(rig.crates.length,6);
assert.ok(rig.heroStats.meshCount>120,'authored detail exceeds legacy primitive count');
assert.ok(rig.heroStats.geometryCount<120,'geometry cache avoids too many repeated GPU buffers');
assert.ok(rig.heroStats.materialCount>12);
const nodes=[];rig.root.traverseVisible(o=>{if(o.isMesh)nodes.push(o)});
for(const key of ['cab_shell','hood_sculpt','grille_recess','windscreen_middle_mullion','fender_L','fender_R','fuel_L_tank','fuel_R_tank','rear_bumper','freight_bed_base','tail_gate','wheel_L_2.55_tire','wheel_R_2.55_tire']){
 assert.ok(nodes.some(n=>n.name===`LH_${key}`),`missing visual part ${key}`);
}
assert.equal(nodes.filter(x=>x instanceof InstancedMesh).length,12,'wheel bolt/tread details are batched');
assert.equal(nodes.filter(x=>x.name.includes('exhaust')).length,4);
assert.equal(nodes.filter(x=>x.name.includes('windshield')&&x.name.includes('glass')).length,2);
assert.equal(nodes.filter(x=>x.name.includes('side_cab')&&x.name.includes('window')).length,6);
assert.ok(nodes.every(o=>o.material),'every rendered mesh has an authored material');
assert.equal(HERO_TRUCK_SOURCE.gameCollider,'unchanged:LONG_HAUL_TRUCK_COLLIDER');
assert.equal(rig.heroStats.toon,true);
const meshCount=nodes.length;
rig.heroRelease();
assert.ok(nodes.every(n=>n.material.disposed||Object.values(materials).includes(n.material)),'disposal retains shared game material ownership');

// The classic host must replace *only* buildTruck and leave a fallback path.
const host=await readFile(new URL('../src/app/hero-truck-host.js',import.meta.url),'utf8');
const window={};const dynamicRoot=new Obj();let fallback=0;
const sandbox={window,THREE,materials,createTruckGrounding:ground,createHeroTruckMesh,HERO_TRUCK_SOURCE,dynamicRoot,
  buildTruck:()=>{fallback++;return {root:new Obj()}},truckRig:null,console};
vm.runInNewContext(host,sandbox);
const replaced=sandbox.buildTruck();
assert.equal(replaced.heroAuthored,true);
assert.equal(sandbox.truckRig,replaced);
assert.equal(window.LongHaulHeroTruck.getState().status,'authored');
assert.equal(window.LongHaulHeroTruck.getState().meshCount,meshCount);
assert.equal(fallback,0);
assert.equal(dynamicRoot.children.length,1);
const next=sandbox.buildTruck();
assert.equal(dynamicRoot.children.length,1,'rebuild removes stale assembled rig');
assert.equal(next.heroAuthored,true);
// clearWorld removes the mesh and sets truckRig=null; our host must still
// remember and release the last GPU authoring resources on the next run.
dynamicRoot.clear();sandbox.truckRig=null;
const third=sandbox.buildTruck();
assert.equal(third.heroAuthored,true);
assert.equal(dynamicRoot.children.length,1);
assert.ok(next.root.children.length>0);
console.log(`PASS authored hero truck source/host: ${meshCount} meshes, ${rig.heroStats.geometryCount} shared geometries, six wheels, two steering slots, six cargo placeholders, twelve GPU instanced detail meshes.`);
