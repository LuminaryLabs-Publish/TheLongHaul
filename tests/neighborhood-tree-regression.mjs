import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {createNeighborhoodTree} from '../src/game/neighborhood-tree.mjs';
const bytes=readFileSync(new URL('../assets/neighborhood/Tree_Maple.glb',import.meta.url));
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const model=createNeighborhoodTree(THREE,buffer,18.613),group=new THREE.Group();
for(const p of model.parts){assert.ok(p.geometry.attributes.normal);assert.equal(p.material.userData.lhCelKind,'foliage');assert.equal(p.material.transparent,false);group.add(new THREE.Mesh(p.geometry,p.material));}
const bounds=new THREE.Box3().setFromObject(group);
assert.ok(Math.abs(bounds.min.y)<.001);assert.ok(Math.abs(bounds.max.y-18.613)<.001);
assert.equal(model.triangles,292);assert.equal(model.parts.length,5);
for(const p of model.parts)assert.ok(p.geometry.boundingSphere.radius>0);
const bad=buffer.slice(0);new DataView(bad).setUint32(0,0,true);assert.throws(()=>createNeighborhoodTree(THREE,bad,18));
console.log('PASS neighborhood maple: actual GLB, scale, ground pivot, normals, opaque colored materials, bounds and invalid header');
