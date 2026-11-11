import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {TOON_STYLE} from '../src/game/toon-style.mjs';
const scene=new THREE.Scene(),worldRoot=new THREE.Group(),camera=new THREE.PerspectiveCamera(),sun=new THREE.DirectionalLight();scene.add(worldRoot,sun);sun.position.set(2,4,3);
const renderer={render(){}};const ctx={THREE,scene,worldRoot,camera,sun,renderer,window:{},LongHaulToonStyle:TOON_STYLE};
vm.runInNewContext(readFileSync(new URL('../src/app/four-band-cel-host.js',import.meta.url),'utf8'),ctx);
const cases=[['terrain','standard',new THREE.MeshStandardMaterial({vertexColors:true,map:new THREE.Texture()})],
 ['road','standard',new THREE.MeshStandardMaterial()],['vehicle','toon',new THREE.MeshToonMaterial()],
 ['foliage','standard',new THREE.MeshStandardMaterial({alphaTest:.36,side:THREE.DoubleSide,map:new THREE.Texture()})],
 ['metal','physical',new THREE.MeshPhysicalMaterial({metalness:1,roughness:.3})],
 ['glass','lambert',new THREE.MeshLambertMaterial({transparent:true,opacity:.4,depthWrite:false})],
 ['smoke','toon',new THREE.MeshToonMaterial({transparent:true,opacity:.6,depthWrite:false})],
 ['structure','standard',new THREE.MeshStandardMaterial({emissive:0xff2200,emissiveIntensity:1.2})]];
for(const [kind,,m]of cases){m.userData.lhCelKind=kind;scene.add(new THREE.Mesh(new THREE.BoxGeometry(),m));}
renderer.render(scene,camera);
assert.equal(ctx.window.LongHaulCelShading.getState().materials,8,'all scene-level categories reached');
for(const [kind,name,m]of cases){
 const before={map:m.map,alpha:m.alphaTest,side:m.side,opacity:m.opacity,depthWrite:m.depthWrite};
 const shader={uniforms:{},...THREE.ShaderLib[name]};m.onBeforeCompile(shader,renderer);
 assert.equal(shader.uniforms.uLHRim.value,TOON_STYLE.roles[kind].rim);
 assert.deepEqual(before,{map:m.map,alpha:m.alphaTest,side:m.side,opacity:m.opacity,depthWrite:m.depthWrite});
 assert.ok(shader.fragmentShader.includes('#include <normal_fragment_maps>'),'keep fragment normal maps');
 assert.ok(shader.fragmentShader.includes('#include <shadowmap_pars_fragment>'),'keep actual shadows');
 assert.ok(shader.vertexShader.includes('#include <skinnormal_vertex>'),'preserve skin normals');
 assert.ok(shader.vertexShader.includes('#include <morphnormal_vertex>'),'preserve morph normals');
 assert.ok(shader.fragmentShader.includes('totalEmissiveRadiance'));
 if(name==='toon')assert.ok(!shader.fragmentShader.includes('#include <gradientmap_pars_fragment>'),'single lighting quantization');
}
const count=ctx.window.LongHaulCelShading.getState().materials;
renderer.render(scene,camera);assert.equal(ctx.window.LongHaulCelShading.getState().materials,count,'no patch or material allocation each frame');
const streamed=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshLambertMaterial(),2);worldRoot.add(streamed);
renderer.render(scene,camera);assert.equal(ctx.window.LongHaulCelShading.getState().materials,count+1);
const shader={uniforms:{},...THREE.ShaderLib.lambert};streamed.material.onBeforeCompile(shader,renderer);
assert.ok(shader.vertexShader.includes('#include <defaultnormal_vertex>'));
assert.ok(THREE.ShaderChunk.defaultnormal_vertex.includes('USE_INSTANCING'));
const old=streamed.material.customProgramCacheKey();renderer.render(scene,camera);assert.equal(streamed.material.customProgramCacheKey(),old);
assert.equal(ctx.window.LongHaulCelShading.getState().errors,0);
const presentation=readFileSync(new URL('../src/app/visual-presentation.js',import.meta.url),'utf8');
assert.ok(presentation.includes('map:old.map,normalMap:old.normalMap'),'replacement preserves original texture identity');
assert.ok(presentation.includes('toonLevels')&&presentation.includes('min(silverRim,toonRimLimit)'),'clouds use bounded style');
assert.ok(presentation.includes('skyUniforms.sunDirection.value.copy(cloudUniforms.sunDirection.value)'),'sky and cloud light align');
console.log(JSON.stringify({status:'PASS',categories:cases.map(c=>c[0]),scope:'actual Three material hooks, streamed instancing, skin/morph shader preservation, textures, alpha, emission, shared style; not GPU compilation or visual acceptance'}));
