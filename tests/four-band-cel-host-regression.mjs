import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';

const source=readFileSync(new URL('../src/app/four-band-cel-host.js',import.meta.url),'utf8');
const bootstrap=readFileSync(new URL('../src/app/bootstrap.mjs',import.meta.url),'utf8');
const scene=new THREE.Scene(),worldRoot=new THREE.Group();scene.add(worldRoot);
const camera=new THREE.PerspectiveCamera(58,16/9,.1,1800);
const sun=new THREE.DirectionalLight(0xffffff,1);sun.position.set(-40,140,-80);
const solid=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshStandardMaterial({color:0xb31d20,roughness:.65}));
const toon=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshToonMaterial({color:0x5b912d}));
const horizon=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({color:0x7c8c72}));
const clouds=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshLambertMaterial({transparent:true,opacity:.3}));
const sign=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:new THREE.Texture()}));
const shaderCloud=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({vertexShader:'void main(){}',fragmentShader:'void main(){}'}));
const group=new THREE.Group();group.add(solid,toon,horizon,clouds,sign,shaderCloud);worldRoot.add(group);
let calls=0;const renderer={render(){calls++;}};
const context={THREE,scene,worldRoot,camera,sun,renderer,window:{}};
vm.runInNewContext(source,context,{timeout:2000});
let state=context.window.LongHaulCelShading.getState();
assert.equal(state.enabled,true);assert.equal(state.bands,4);
assert.deepEqual([...state.levels],[.025,.12,.50,.98]);
assert.deepEqual([...state.thresholds],[.20,.49,.76]);
assert.ok(bootstrap.indexOf("./four-band-cel-host.js")>=0);
assert.ok(bootstrap.indexOf("./four-band-cel-host.js")<bootstrap.indexOf("./sobel-outline-host.js"),
  'cel shading runs before Sobel compositing');
renderer.render(scene,camera);
assert.equal(calls,1,'single existing renderer remains in use');
assert.equal(state.materials,0,'snapshot should not mutate');
state=context.window.LongHaulCelShading.getState();
assert.equal(state.materials,3,'lit truck, toon scenery and opaque basic horizon are patched');
assert.equal(clouds.material.onBeforeCompile,THREE.Material.prototype.onBeforeCompile,'translucent clouds unaffected');
assert.equal(sign.material.onBeforeCompile,THREE.Material.prototype.onBeforeCompile,'textured sign remains readable');
assert.equal(shaderCloud.material.onBeforeCompile,THREE.Material.prototype.onBeforeCompile,'sky/weather shaders unaffected');
function shaderFor(material,name){
 const shader={uniforms:{},vertexShader:THREE.ShaderLib[name].vertexShader,
   fragmentShader:THREE.ShaderLib[name].fragmentShader};
 material.onBeforeCompile(shader,renderer);
 assert.ok(shader.uniforms.uLHFourBandSun,'lighting direction tied to camera-relative sun');
 assert.ok(shader.vertexShader.includes('vLHFourBandNormal'));
 assert.ok(shader.fragmentShader.includes('lhPigment*0.025'));
 assert.ok(shader.fragmentShader.includes('lhPigment*0.12'));
 assert.ok(shader.fragmentShader.includes('lhPigment*0.50'));
 assert.ok(shader.fragmentShader.includes('mix(lhPigment,vec3(0.98),.92)'));
 assert.equal((shader.fragmentShader.match(/#include <opaque_fragment>/g)||[]).length,1);
 return shader;
}
shaderFor(solid.material,'standard');shaderFor(toon.material,'toon');shaderFor(horizon.material,'basic');
const lazy=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0x1188ee}));
worldRoot.add(lazy);renderer.render(scene,camera);
assert.equal(context.window.LongHaulCelShading.getState().materials,4,'later streamed meshes are included');
shaderFor(lazy.material,'lambert');
renderer.render(new THREE.Scene(),camera);
assert.equal(context.window.LongHaulCelShading.getState().frames,2,'other scenes remain untouched');
const snapshot=context.window.LongHaulCelShading.getState();
snapshot.levels[0]=100;
assert.equal(context.window.LongHaulCelShading.getState().levels[0],.025,'snapshot is immutable-by-copy');
console.log(JSON.stringify({status:'PASS',materials:4,bands:state.levels,scope:'four-band shader injection and Sobel order with HUD/cloud exclusion'}));
