import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {
  PREBUILT_TREE_VERSION,TREE_SPECIES,parsePrebuiltTreeGlb,
  speciesForTree,isTreeEnvironmentObject,selectVisibleTreeInstances,
  createPrebuiltTreeMeshes
} from '../src/game/prebuilt-tree-library.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const fakeMaterial={tree:{id:'old-procedural-tree'}};
class Group {
  constructor(){this.children=[];this.parent=null;this.name='';this.userData={};}
  add(obj){obj.removeFromParent?.();this.children.push(obj);obj.parent=this;}
  remove(obj){const i=this.children.indexOf(obj);if(i>=0){this.children.splice(i,1);obj.parent=null;}}
  removeFromParent(){this.parent?.remove(this);}
  clear(){for(const c of [...this.children])this.remove(c);}
}
class Geo{
  attributes={};disposed=false;
  setAttribute(key,value){this.attributes[key]=value;}
  setIndex(index){this.index=index;}
  computeBoundingSphere(){}
  dispose(){this.disposed=true;}
}
class Attr{constructor(array,size){this.array=array;this.itemSize=size;}}
class Mat{constructor(props){Object.assign(this,props);}dispose(){}}
class FakeTextureLoader{load(url,callback){const t={url,dispose(){}};queueMicrotask(()=>callback(t));return t;}}
class FakeInstance extends Group{
  constructor(g,m,capacity){super();this.geometry=g;this.material=m;this.capacity=capacity;this.count=capacity;this.isMesh=true;this.matrix=[];this.instanceMatrix={setUsage(){},needsUpdate:false};this.layers={mask:1,set(n){this.mask=1<<n}};}
  setMatrixAt(i,m){this.matrix[i]=m;}
  dispose(){}
}
class Dummy{
  position={set:(...a)=>this.p=a};rotation={set:(...a)=>this.r=a};scale={set:(...a)=>this.s=a};
  updateMatrix(){this.matrix={p:this.p,r:this.r,s:this.s};}
}
const THREE={Group,InstancedMesh:FakeInstance,Object3D:Dummy,BufferGeometry:Geo,BufferAttribute:Attr,
  MeshStandardMaterial:Mat,TextureLoader:FakeTextureLoader,FrontSide:0,DoubleSide:2,
  DynamicDrawUsage:'dynamic',SRGBColorSpace:'sRGB'};
const cellRoot=new Group(),group=new Group();
const entry={group,owned:{geometries:[]},visualOnly:false,decorationStage:0,
  patch:{cellId:'test-cell',bounds:{minX:-80,maxX:80,minZ:-80,maxZ:80},
    vegetation:[{id:'world-a',position:[10,0,25],variant:'a',rotation:.3,scale:[1,1,1]},
      {id:'world-b',position:[20,0,55],variant:'b',rotation:.7,scale:[1,1,1]}]},
  environmentTileState:{plan:{objects:[{id:'tile-maple',kind:'maple',role:'roadside',position:{x:25,y:0,z:40},heading:0,scale:1}]}}};
const cells=new Map([['test-cell',entry]]);
const loaded=new Set();
const fetch=async url=>{
  const name=url.split('/').at(-1),path=resolve(root,'assets/trees',name),bin=await readFile(path);
  loaded.add(name);
  return {ok:true,arrayBuffer:async()=>bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.byteLength)};
};
const window={};
const target={
  window,document:{currentScript:{src:'https://example.test/TheLongHaul/src/app/prebuilt-tree-host.js'}},
  THREE,PREBUILT_TREE_VERSION,TREE_SPECIES,parsePrebuiltTreeGlb,
  speciesForTree,isTreeEnvironmentObject,selectVisibleTreeInstances,createPrebuiltTreeMeshes,
  URL,Blob,fetch,AbortController,performance,setTimeout,clearTimeout,console,
  cellRoot,cellHosts:cells,materials:fakeMaterial,
  readTruck:()=>({position:{x:0,y:0,z:0}}),settings:{quality:true},
  decorateCell(job){const e=cells.get(job.id);if(e.decorationStage++===0){
    const g=new Geo();const mesh=new Group();mesh.isMesh=true;mesh.material=fakeMaterial.tree;mesh.geometry=g;e.owned.geometries.push(g);e.group.add(mesh);
  }},
  releaseCell(id){cells.delete(id)},clearWorld(){cells.clear();cellRoot.clear()},
  updateCloudLayers(){return 'original update result';}
};
const script=await readFile(resolve(root,'src/app/prebuilt-tree-host.js'),'utf8');
vm.runInNewContext(script,target,{filename:'prebuilt-tree-host.js',timeout:15_000});
assert.equal(await window.LongHaulPrebuiltTrees.readyPromise,true);
assert.equal(window.LongHaulPrebuiltTrees.ready,true);
assert.equal(loaded.size,9);
assert.equal(target.cellRoot.children.length,1);
const modelRoot=target.cellRoot.children[0];
assert.equal(modelRoot.children.length,24,'18 display batches plus 6 bounded LOD0 shadow batches');
const job={id:'test-cell',entry};
target.decorateCell(job);
assert.equal(entry.group.children.some(x=>x.material===fakeMaterial.tree),false);
assert.equal(entry.owned.geometries.length,0);
assert.equal(target.updateCloudLayers(null,1200),'original update result');
const status=window.LongHaulPrebuiltTrees.getState();
assert.equal(status.visible,3);
assert.ok(status.triangles>0);
assert.equal(modelRoot.children.filter(x=>!x.name.startsWith('LH_TREE_SHADOW_')).reduce((n,x)=>n+x.count,0),6,'display batches have two materials per tree');
assert.equal(modelRoot.children.filter(x=>x.name.startsWith('LH_TREE_SHADOW_')).reduce((n,x)=>n+x.count,0),6,'only selected near shadow batches cast');
assert.ok(modelRoot.children.every(x=>x.count<=240));
target.clearWorld();
assert.equal(window.LongHaulPrebuiltTrees.getState().visible,0);
assert.equal(modelRoot.children.reduce((n,x)=>n+x.count,0),0);
console.log('PASS: host loaded nine GLBs, built 18 shared batches, replaced old trees, preserved entry/clear lifecycle and immutable placement.');