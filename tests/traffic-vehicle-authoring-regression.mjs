import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createTrafficVehicleFactory,TRAFFIC_FLEET_PROFILES,TRAFFIC_FLEET_SOURCE,trafficVariantForClass} from '../src/game/traffic-vehicle-authoring.mjs';
// A minimal geometry-bearing Three fixture for source and lifecycle contracts.
// Real Chromium/WebGL and physical GPU are separate, not claimed here.
class Attr {
 constructor(array,itemSize){this.array=Float32Array.from(array);this.itemSize=itemSize;this.count=this.array.length/itemSize}
 getX(i){return this.array[i*this.itemSize]}
 getY(i){return this.array[i*this.itemSize+1]}
 getZ(i){return this.array[i*this.itemSize+2]}
}
class BufferGeometry {
 constructor(){this.attributes={};this.index=null;this.uuid=`fixture-${++geoId}`;this.disposed=false}
 setAttribute(name,attribute){this.attributes[name]=attribute;return this}
 getAttribute(name){return this.attributes[name]}
 setIndex(values){this.index={array:values};return this}
 computeVertexNormals(){return this}
 computeBoundingSphere(){return this}
 translate(x,y,z){const a=this.attributes.position?.array;if(a)for(let i=0;i<a.length;i+=3){a[i]+=x;a[i+1]+=y;a[i+2]+=z}return this}
 dispose(){this.disposed=true}
}
let geoId=0;
function geometry(positions,indices){return new BufferGeometry().setAttribute('position',new Attr(positions,3)).setIndex(indices)}
class Shape {
 constructor(){this.points=[]}
 moveTo(x,y){this.points.push([x,y])}
 lineTo(x,y){this.points.push([x,y])}
 quadraticCurveTo(cx,cy,x,y){this.points.push([(cx+x)/2,(cy+y)/2],[x,y])}
 closePath(){}
}
class ExtrudeGeometry extends BufferGeometry {
 constructor(shape,{depth=.04}={}){super();let pts=shape.points,n=pts.length;if(n>0&&pts.at(-1).every((v,i)=>v===pts[0][i])){pts=pts.slice(0,-1);n--}
  const positions=[],indices=[];
  for(const z of [0,depth])for(const [x,y] of pts)positions.push(x,y,z);
  for(let i=1;i<n-1;i++){indices.push(0,i+1,i, n,n+i,n+i+1)}
  for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,j,n+i,j,n+j,n+i)}
  this.setAttribute('position',new Attr(positions,3));this.setIndex(indices);
 }
}
class CylinderGeometry extends BufferGeometry {
 constructor(top,bottom,depth,segments=12){super();let positions=[],indices=[];
  for(const [y,r] of [[-depth/2,bottom],[depth/2,top]])for(let k=0;k<segments;k++){
   const a=2*Math.PI*k/segments;positions.push(Math.cos(a)*r,y,Math.sin(a)*r);
  }
  for(let k=0;k<segments;k++){const j=(k+1)%segments;indices.push(k,j,k+segments,j,j+segments,k+segments)}
  for(let k=1;k<segments-1;k++){indices.push(0,k,k+1,segments,segments+k+1,segments+k)}
  this.setAttribute('position',new Attr(positions,3));this.setIndex(indices);
 }
}
class TorusGeometry extends BufferGeometry {
 constructor(radius,tube,tubeSegments=5,radialSegments=18){super();let pos=[],index=[];
  for(let i=0;i<radialSegments;i++)for(let j=0;j<tubeSegments;j++){
   const a=2*Math.PI*i/radialSegments,b=2*Math.PI*j/tubeSegments;
   pos.push((radius+tube*Math.cos(b))*Math.cos(a),(radius+tube*Math.cos(b))*Math.sin(a),tube*Math.sin(b));
  }
  for(let i=0;i<radialSegments;i++)for(let j=0;j<tubeSegments;j++){
   const a=i*tubeSegments+j,b=((i+1)%radialSegments)*tubeSegments+j,c=i*tubeSegments+(j+1)%tubeSegments,d=((i+1)%radialSegments)*tubeSegments+(j+1)%tubeSegments;
   index.push(a,b,c,b,d,c);
  }
  this.setAttribute('position',new Attr(pos,3));this.setIndex(index);
 }
}
class Vector3 {constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}
class Obj {
 constructor(){this.children=[];this.parent=null;this.visible=true;this.position=new Vector3();this.scale=new Vector3(1,1,1);this.rotation=new Vector3();this.userData={};this.name='';}
 add(...items){for(const i of items){i.removeFromParent?.();this.children.push(i);i.parent=this}return this}
 remove(o){this.children=this.children.filter(x=>x!==o);o.parent=null}
 removeFromParent(){this.parent?.remove(this)}
 updateMatrix(){this.matrix={position:{...this.position},rotation:{...this.rotation}}}
 traverse(callback){callback(this);for(const c of this.children)c.traverse(callback)}
}
class Group extends Obj {}
class Mesh extends Obj {constructor(geo,mat){super();this.geometry=geo;this.material=mat;this.isMesh=true;}}
class InstancedMesh extends Mesh {constructor(geo,mat,count){super(geo,mat);this.count=count;this.instanceMatrix={needsUpdate:false};this.instances=[];}
 setMatrixAt(i,m){this.instances[i]=m}
 computeBoundingSphere(){}
}
class MeshToonMaterial {constructor(p){Object.assign(this,p);this.isMeshToonMaterial=true}}
class ThreeObject extends Obj {}
const THREE={BufferGeometry,Float32BufferAttribute:Attr,Shape,ExtrudeGeometry,CylinderGeometry,TorusGeometry,
  Group,Mesh,InstancedMesh,MeshToonMaterial,Object3D:ThreeObject,DoubleSide:2};
const gradient={id:'game-four-tone-gradient'};
const factory=createTrafficVehicleFactory({THREE,materials:{truckRed:{gradientMap:gradient}}});
assert.deepEqual(TRAFFIC_FLEET_SOURCE.vehicleIds,['sedan','muscle','pickup','van','suv','box']);
assert.equal(TRAFFIC_FLEET_SOURCE.authoringPaths.includes('n:authoring:assembly'),true);
const collider=[{width:2.5,length:4.82},{width:2.68,length:5.9},{width:2.76,length:7.55},{width:3.02,length:10.9}];
for(const p of Object.values(TRAFFIC_FLEET_PROFILES)){
 assert.ok(p.length<=collider[p.kind].length&&p.width<=collider[p.kind].width,`${p.id} within existing collision footprint`);
}
assert.equal(trafficVariantForClass(0,0,2),'sedan');
assert.equal(trafficVariantForClass(3,3,5),'box');
assert.notEqual(trafficVariantForClass(1,1,0),trafficVariantForClass(1,1,2));
assert.notEqual(trafficVariantForClass(2,2,0),trafficVariantForClass(2,2,2));
const now=performance.now();factory.prewarm();const info=factory.stats();
assert.equal(info.templates,12);
assert.ok(info.primitives>10);
assert.equal(info.variants.length,6);
for(const desc of info.variants){
 assert.ok(desc.nearParts>=55,`${desc.id} has materially authored individual pieces (${desc.nearParts})`);
 assert.ok(desc.nearTriangles>desc.farTriangles*1.35,`${desc.id} near/far triangle difference`);
 assert.ok(desc.renderMeshesNear<=18,`${desc.id} material merging limits GPU draw calls`);
 assert.ok(desc.renderMeshesFar<=16,`${desc.id} far LOD rendering bounded`);
 const v=factory.createVehicle(desc.id);assert.equal(v.profile.id,desc.id);assert.equal(v.root.children.length,2);
 assert.ok(v.rotors.length>=4);assert.ok(v.authoring.parts.some(x=>x.includes('grille')));
 assert.ok(v.authoring.parts.some(x=>x.includes('headlamp')));
 assert.ok(v.authoring.parts.some(x=>x.includes('windshield')));
 assert.ok(v.authoring.parts.some(x=>x.includes('glass')));
 assert.ok(v.authoring.parts.some(x=>x.includes('livery')));
 assert.ok(v.authoring.parts.some(x=>x.includes('sculpted'))||desc.id==='van');
 const meshes=[];v.root.traverse(x=>{if(x.isMesh)meshes.push(x)});
 assert.ok(meshes.every(x=>x.material.isMeshToonMaterial&&x.material.gradientMap===gradient),'all visuals inherit game four-band toon ramp');
 v.setDistance(220);assert.equal(v.lod,'far');const before=v.rotors[0].rotation.x;
 v.spin(.2,12);assert.equal(v.rotors[0].rotation.x,before,'distant wheel motion skips invisible rig');
 v.setDistance(12);v.spin(.2,12);assert.notEqual(v.rotors[0].rotation.x,before);
 assert.ok(v.root.children[0].children.length<=desc.renderMeshesNear+v.rotors.length+1);
 const vertexBounds={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity,minY:Infinity,maxY:-Infinity};
 for(const mesh of v.root.children[0].children){if(!mesh.isMesh)continue;
  const positions=mesh.geometry.getAttribute('position');for(let j=0;j<positions.count;j++){
   const x=positions.getX(j),y=positions.getY(j),z=positions.getZ(j);
   assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z),'all baked coordinates finite');
   vertexBounds.minX=Math.min(vertexBounds.minX,x);vertexBounds.maxX=Math.max(vertexBounds.maxX,x);
   vertexBounds.minZ=Math.min(vertexBounds.minZ,z);vertexBounds.maxZ=Math.max(vertexBounds.maxZ,z);
   vertexBounds.minY=Math.min(vertexBounds.minY,y);vertexBounds.maxY=Math.max(vertexBounds.maxY,y);
  }
 }
 assert.ok(vertexBounds.minX>=-collider[v.profile.kind].width*.5-.15 && vertexBounds.maxX<=collider[v.profile.kind].width*.5+.15,
   `${desc.id} visual width bounded by collision class`);
 assert.ok(vertexBounds.minZ>=-collider[v.profile.kind].length*.5-.16 && vertexBounds.maxZ<=collider[v.profile.kind].length*.5+.16,
   `${desc.id} visual length bounded by collision class`);
 assert.ok(vertexBounds.minY>=-.02,`${desc.id} chassis avoids ground penetration`);
 assert.ok(vertexBounds.maxY<=v.profile.height+.16,`${desc.id} matches intended height`);

}
// Build actual host against the same fixture: 14 legacy collision records must
// keep their identity, kind, collider, speed, and update semantics after swap.
const trafficRoot=new Group();
const vehicles=Array.from({length:14},(_,i)=>{const group=new Group();trafficRoot.add(group);return{
 group,kind:i%4,collider:collider[i%4],speed:12+i,direction:1,hit:false,active:false,id:null
}});
const metadata=vehicles.map(x=>({kind:x.kind,collider:x.collider,speed:x.speed}));
let trafficTicks=0;const state={position:{x:0,z:0}};
const sandbox={THREE,materials:{truckRed:{gradientMap:gradient}},createTrafficVehicleFactory,
 TRAFFIC_FLEET_SOURCE,trafficVariantForClass,arcadeVehicles:vehicles,arcadeTrafficRoot:trafficRoot,
 window:{},readTruck:()=>state,simulationFrozen:()=>false,
 arcadeTrafficUpdate(dt){trafficTicks++;trafficRoot.visible=true;
   for(let i=0;i<4;i++){const v=vehicles[i];v.active=true;v.id=`traffic:${trafficTicks+i}`;v.group.visible=true;
    v.group.position.set(i*3,0,20+i*10);}
   return 18;
 },console};
vm.runInNewContext(await readFile(new URL('../src/app/traffic-vehicles-host.js',import.meta.url),'utf8'),sandbox);
assert.equal(sandbox.window.LongHaulTrafficArt.getState().status,'authored');
assert.equal(sandbox.window.LongHaulTrafficArt.getState().pool,14);
const poolGroups=vehicles.map(x=>x.group);
assert.equal(trafficRoot.children.length,14,'legacy geometry replaced, not duplicated');
assert.equal(sandbox.arcadeTrafficUpdate(1/60),18);
assert.equal(trafficTicks,1);
for(let i=0;i<14;i++){
 assert.equal(vehicles[i].group,poolGroups[i],'traffic physics keeps its original visual group identity');
 assert.equal(vehicles[i].kind,metadata[i].kind);assert.equal(vehicles[i].collider,metadata[i].collider);
 assert.equal(vehicles[i].speed,metadata[i].speed);
}
assert.equal(sandbox.window.LongHaulTrafficArt.getState().active.length,4);
state.position.z=500;sandbox.arcadeTrafficUpdate(1/60);
assert.equal(sandbox.window.LongHaulTrafficArt.getState().active.every(x=>x.lod==='far'),true);
// A later traffic spawn may replace the variant but never changes collision.
for(let i=0;i<5;i++)sandbox.arcadeTrafficUpdate(1/60);
assert.equal(trafficRoot.children.length,14);
const types=new Set();for(let i=0;i<12;i++){sandbox.arcadeTrafficUpdate(1/60);for(const x of sandbox.window.LongHaulTrafficArt.getState().active)types.add(x.type)}
assert.ok(types.has('sedan')&&types.has('box'));
assert.ok([...types].some(x=>x==='muscle'||x==='suv'));
assert.ok([...types].some(x=>x==='pickup'||x==='van'));
console.log(JSON.stringify(info.variants));console.log(`PASS traffic authoring ${info.variants.map(x=>`${x.id}:${x.nearParts}`).join(', ')}; 12 baked LODs, ${info.primitives} shared shapes, ${info.materials} 4-band materials, 14 preserved collider slots, host integration (${Math.round(performance.now()-now)} ms in geometry-bearing fixture).`);