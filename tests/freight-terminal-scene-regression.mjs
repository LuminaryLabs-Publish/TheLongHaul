import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {parseFreightTerminalGlb,createFreightTerminalThreeObject,
  normalizedTerminalMaterial,TERMINAL_YARD_BOUNDS} from '../src/game/freight-terminal-glb.mjs';
const original=readFileSync(new URL('../assets/freight-terminal/terminal-yard.glb',import.meta.url));
const source=parseFreightTerminalGlb(original.buffer.slice(original.byteOffset,original.byteOffset+original.byteLength));
const rendered=createFreightTerminalThreeObject(THREE,source);
const demo=new Set(['darkasphalt','roadwhite','roadyellow','lawn','lawn2','grasslight','forest','pine','treetrunk']);
test('actual Blender material prefixes normalize correctly, avoiding legacy filter bug',()=>{
  assert.equal(normalizedTerminalMaterial('TLH_V1_darkAsphalt'),'darkasphalt');
  assert.equal(normalizedTerminalMaterial('TLH_V1_roadYellow'),'roadyellow');
  assert.equal(normalizedTerminalMaterial('V1F_YardAsphalt'),'yardasphalt');
  assert.ok(source.materials.some(m=>m.name==='TLH_V1_darkAsphalt'));
  assert.ok(source.materials.some(m=>m.name==='V1F_YardAsphalt'));
});
test('demonstration highway and terrain materials absent from actual terminal scene',()=>{
  for(const mesh of rendered.children)assert.equal(demo.has(normalizedTerminalMaterial(mesh.material.name)),false,mesh.material.name);
  assert.ok(rendered.children.length>25,'real terminal buildings and parking must remain');
  assert.ok(rendered.children.some(mesh=>mesh.name==='Batch_roof'));
  assert.ok(rendered.children.some(mesh=>mesh.name==='Batch_asphalt'));
});
test('shared GLB batches cannot extend into procedural highway or surrounding terrain',()=>{
  const b=TERMINAL_YARD_BOUNDS;
  assert.ok(source.meshes.some(m=>{const p=m.positions;return p.some((x,j)=>j%3===0&&x>b.maxX+100)}),'source contains extra highway geometry');
  let triangles=0;
  for(const mesh of rendered.children){
    const positions=mesh.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),z=positions.getZ(i);
      assert.ok(x>=b.minX-.0001&&x<=b.maxX+.0001,`${mesh.name}: x=${x}`);
      assert.ok(z>=b.minZ-.0001&&z<=b.maxZ+.0001,`${mesh.name}: z=${z}`);
    }
    triangles+=mesh.geometry.index.count/3;
  }
  assert.equal(triangles,rendered.userData.terminalYardPruning.retainedTriangles);
  assert.ok(triangles>=30000,'terminal detail must not be discarded');
  assert.ok(triangles<=source.triangles*.85,'demo scenery must actually be excluded');
});
test('no imported visual prop blocks the newly generated terminal exit',()=>{
  const sx=0,sz=-132,dx=177,dz=-342,dd=dx*dx+dz*dz;
  for(const mesh of rendered.children){
    const points=mesh.geometry.getAttribute('position');
    for(let i=0;i<points.count;i++){
      const x=points.getX(i),y=points.getY(i),z=points.getZ(i);
      const t=((x-sx)*dx+(z-sz)*dz)/dd;
      const lateral=Math.hypot(x-sx-dx*t,z-sz-dz*t);
      assert.equal(t>.05&&t<.98&&lateral<7.5&&y>.5&&y<6.2,false,
        `${mesh.name} has geometry inside the real truck exit at progress ${t.toFixed(3)}`);
    }
  }
});
test('repeated loads generate identical cropped geometry without editing original source',()=>{
  const again=createFreightTerminalThreeObject(THREE,source);
  assert.deepEqual(again.userData.terminalYardPruning,rendered.userData.terminalYardPruning);
  assert.equal(source.triangles,83496,'real source GLB unchanged');
  rendered.traverse(obj=>obj.geometry?.dispose?.());again.traverse(obj=>obj.geometry?.dispose?.());
});
