import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {
  TREE_SPECIES,TREE_ENVIRONMENT_KINDS,parsePrebuiltTreeGlb,
  speciesForTree,selectTreeLod,selectVisibleTreeInstances,
  isTreeEnvironmentObject,createPrebuiltTreeMeshes
} from '../src/game/prebuilt-tree-library.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const base=resolve(here,'../assets/trees');
let checked=0;
const sums=new Map();
for(const species of TREE_SPECIES){
  const triangleCounts=[];
  for(let lod=0;lod<3;lod++){
    const data=await readFile(resolve(base,species.files[lod]));
    const buffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
    const parsed=parsePrebuiltTreeGlb(buffer);
    assert.equal(parsed.primitives.length,2);
    assert.equal(parsed.images.length,2);
    assert.equal(parsed.json.materials.filter(m=>m.alphaMode==='MASK'&&m.doubleSided).length,1);
    assert.ok(parsed.triangles>500&&parsed.triangles<=30_000);
    assert.ok(parsed.primitives.every(p=>p.position.array.every(Number.isFinite)));
    assert.ok(parsed.primitives.every(p=>p.indices.array.every(i=>i<p.position.count)));
    assert.ok(parsed.json.images.every(i=>i.mimeType==='image/png'));
    assert.ok(parsed.primitives.every(p=>p.normal.count===p.uv.count&&p.normal.count===p.position.count));
    triangleCounts.push(parsed.triangles);checked++;
  }
  assert.ok(triangleCounts[0]>triangleCounts[1]&&triangleCounts[1]>triangleCounts[2]);
  sums.set(species.id,triangleCounts);
}
assert.equal(checked,9);
assert.equal(new Set(TREE_SPECIES.map(s=>s.id)).size,3);
assert.equal(speciesForTree({kind:'willow',id:'tile'}),'weeping_willow');
assert.equal(speciesForTree({kind:'maple',id:'tile'}),'red_maple');
assert.equal(speciesForTree({kind:'pine',id:'tile'}),'paper_birch');
assert.equal(speciesForTree({id:'cell:12',variant:'a'}),speciesForTree({id:'cell:12',variant:'a'}));
assert.ok(TREE_ENVIRONMENT_KINDS.includes('tree'));
assert.equal(isTreeEnvironmentObject({kind:'maple',role:'roadside'}),true);
assert.equal(isTreeEnvironmentObject({kind:'grass',role:'roadside'}),false);
assert.equal(isTreeEnvironmentObject({kind:'tree',role:'on-road-paint'}),false);
assert.equal(selectTreeLod(30,true),0);assert.equal(selectTreeLod(155,true),1);assert.equal(selectTreeLod(400,true),2);
const candidates=Array.from({length:280},(_,i)=>({id:`tree-${i}`,position:[i*2,0,0],height:10,species:'red_maple'}));
const view=selectVisibleTreeInstances(candidates,[0,0,0],{quality:true});
assert.equal(view.length,240);assert.equal(view[0].id,'tree-0');
assert.ok(view.every(x=>Number.isFinite(x.distance)));
const malformed=await readFile(resolve(base,TREE_SPECIES[0].files[0]));
const wrong=new Uint8Array(malformed);wrong[0]=0;
assert.throws(()=>parsePrebuiltTreeGlb(wrong.buffer),/Invalid glTF/);
// Decode real geometry and alpha materials using a lightweight Three-compatible
// stub: this exercises all BufferGeometry/Attribute ownership without WebGL.
const FakeTHREE={DoubleSide:2,FrontSide:0,SRGBColorSpace:'sRGB',
  BufferGeometry:class {attributes={};setAttribute(k,v){this.attributes[k]=v;}setIndex(x){this.index=x;}computeBoundingSphere(){}},
  BufferAttribute:class {constructor(a,n){this.array=a;this.itemSize=n;}},
  MeshStandardMaterial:class {constructor(opts){Object.assign(this,opts);}}
};
const first=await readFile(resolve(base,TREE_SPECIES[0].files[0]));
const p=parsePrebuiltTreeGlb(first.buffer.slice(first.byteOffset,first.byteOffset+first.byteLength));
const fakeTexture={flipY:false,colorSpace:'sRGB'};
const created=await createPrebuiltTreeMeshes(FakeTHREE,p,[new FakeTHREE.MeshStandardMaterial({map:fakeTexture}),new FakeTHREE.MeshStandardMaterial({map:fakeTexture,alphaTest:.36,side:2})]);
assert.equal(created.parts.length,2);
assert.ok(created.parts[0].geometry.index.array.length>0);
assert.equal(created.parts[1].material.alphaTest,.36);
console.log('PASS: 9 source GLBs, 3 decreasing LOD chains, embedded alpha-mask textures, deterministic placement and geometry decoder.');
console.log(Object.fromEntries(sums));