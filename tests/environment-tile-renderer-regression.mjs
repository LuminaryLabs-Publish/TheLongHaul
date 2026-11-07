import assert from 'node:assert/strict';
import {createEnvironmentTileRenderer,ENVIRONMENT_RENDER_LIMITS} from '../src/game/environment-tile-renderer.mjs';
import {planEnvironmentTile} from '../src/game/environment-tile-planner.mjs';
class MockShape{moveTo(){}lineTo(){}quadraticCurveTo(){}}
class MockGeometry{
 constructor(...args){this.args=args;this.attributes={position:{count:12}};this.uuid=String(MockGeometry.next++);}
 computeVertexNormals(){}computeBoundingSphere(){}translate(){return this;}
}
MockGeometry.next=1;
class MockMaterial{constructor(opts){Object.assign(this,opts);this.isMaterial=true;}}
class MockVec{
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;this.order='XYZ'}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
}
class MockObj{
 constructor(){this.position=new MockVec();this.rotation=new MockVec();this.scale=new MockVec(1,1,1);this.children=[];this.parent=null;this.matrix={};this.name='';this.userData={};}
 add(child){if(child.parent)child.removeFromParent();this.children.push(child);child.parent=this;}
 remove(child){this.children=this.children.filter(x=>x!==child);child.parent=null;}
 removeFromParent(){this.parent?.remove(this);}
 updateMatrix(){this.matrix={pos:[this.position.x,this.position.y,this.position.z],scale:[this.scale.x,this.scale.y,this.scale.z],rotation:[this.rotation.x,this.rotation.y,this.rotation.z]};}
}
class MockInstanced extends MockObj{
 constructor(geometry,material,count){super();this.geometry=geometry;this.material=material;this.count=count;this.matrices=new Array(count);this.colors=new Array(count);this.instanceMatrix={setUsage(){},needsUpdate:false};}
 setMatrixAt(i,value){this.matrices[i]={...value};}
 setColorAt(i,color){this.colors[i]=color;}
 computeBoundingSphere(){this.boundsCalculated=true;}
 dispose(){this.disposed=true;}
}
class MockColor{constructor(r,g,b){this.r=r;this.g=g;this.b=b;}}
export const MOCK_THREE={InstancedMesh:MockInstanced,MeshToonMaterial:MockMaterial,MeshBasicMaterial:MockMaterial,
 BoxGeometry:MockGeometry,PlaneGeometry:MockGeometry,IcosahedronGeometry:MockGeometry,
 CylinderGeometry:MockGeometry,ConeGeometry:MockGeometry,TorusGeometry:MockGeometry,
 Shape:MockShape,ExtrudeGeometry:MockGeometry,Object3D:MockObj,Color:MockColor,DoubleSide:2,StaticDrawUsage:35044};
const renderer=createEnvironmentTileRenderer({THREE:MOCK_THREE,materials:{truckRed:{gradientMap:{id:'toon-4-band'}}}});
const batch=renderer.startCell({quality:true});
const tile=planEnvironmentTile('tile-high-fidelity',0,{terrainHeight:()=>0});
const assemblyParts=[];
for(const object of [...tile.props,...tile.onRoad]){
 renderer.queueObject(batch,object);
 assemblyParts.push(object);
}
assert.ok(batch.objectCount>=12);
assert.ok(batch.instanceCount>batch.objectCount*2,'multi-part high fidelity objects, not one primitive per object');
assert.ok(batch.instanceCount<=ENVIRONMENT_RENDER_LIMITS.highInstancesPerCell);
assert.ok(batch.buckets.size<=ENVIRONMENT_RENDER_LIMITS.batchKeysPerCell);
const root=new MockObj();let runs=0;
while(!renderer.finalizeStep(batch,root).finished){runs++;assert.ok(runs<30,'frame budget finite');}
assert.ok(batch.meshCount>5&&batch.meshCount<=ENVIRONMENT_RENDER_LIMITS.batchKeysPerCell);
assert.ok(root.children.every(x=>x instanceof MockInstanced&&x.boundsCalculated));
assert.ok(root.children.every(x=>x.castShadow===false),'sun-shadow caster eligibility stays centrally budgeted');
assert.ok(root.children.some(x=>x.material.gradientMap),'4-band materials are used');
assert.ok(root.children.some(x=>x.material.transparent),'road paint is separate');
assert.ok(root.children.some(x=>x.matrices.every(m=>m&&m.pos.every(Number.isFinite))));
assert.ok(root.children.flatMap(x=>x.colors).every(c=>[c.r,c.g,c.b].every(Number.isFinite)));
const stats1=renderer.stats();
const far=renderer.startCell({quality:false,visualOnly:true});
for(const object of tile.props.slice(0,10))renderer.queueObject(far,object);
const back=new MockObj();while(!renderer.finalizeStep(far,back).finished){}
assert.ok(far.instanceCount<=ENVIRONMENT_RENDER_LIMITS.lowInstancesPerCell);
assert.ok(far.instanceCount<batch.instanceCount);
const stats2=renderer.stats();assert.equal(stats2.activeCells,2);
assert.ok(stats2.sharedGeometryCount<45);assert.ok(stats2.sharedMaterialCount<30);
renderer.releaseCell(batch);renderer.releaseCell(far);
assert.equal(renderer.stats().activeCells,0);
assert.ok(root.children.length===0&&back.children.length===0);
assert.ok(batch.meshCount>0&&batch.meshes.length===0);
console.log(`PASS GPU fixture: ${stats1.sharedGeometryCount} reusable shapes, ${stats2.sharedMaterialCount} toon materials, ${batch.meshCount} instanced near draws, ${far.instanceCount} distant instances, release clean`);
