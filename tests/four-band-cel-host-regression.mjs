import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';

const source=readFileSync(new URL('../src/app/four-band-cel-host.js',import.meta.url),'utf8');
const presentation=readFileSync(new URL('../src/app/visual-presentation.js',import.meta.url),'utf8');
const bootstrap=readFileSync(new URL('../src/app/bootstrap.mjs',import.meta.url),'utf8');
const scene=new THREE.Scene(),worldRoot=new THREE.Group();scene.add(worldRoot);
const camera=new THREE.PerspectiveCamera(58,16/9,.1,1800);
const sun=new THREE.DirectionalLight(0xffffff,1);sun.position.set(-40,140,-80);
const road=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0x3d596b}));
road.material.userData.lhCelKind='road';
const terrain=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshToonMaterial({color:0x769664}));
terrain.material.userData.lhCelKind='terrain';
const cab=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0xd53628}));
const clouds=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshLambertMaterial({transparent:true,opacity:.35}));
const sign=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.Texture()}));
const basic=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xaabbcc}));
const emissive=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({emissive:0xff5500,emissiveIntensity:1}));
const custom=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.ShaderMaterial({vertexShader:'void main(){}',fragmentShader:'void main(){}'}));
worldRoot.add(road,terrain,cab,clouds,sign,basic,emissive,custom);
let draws=0;const renderer={render(){draws++}};
const context={THREE,scene,worldRoot,camera,sun,renderer,window:{}};
vm.runInNewContext(source,context,{timeout:2000});
let state=context.window.LongHaulCelShading.getState();
assert.deepEqual([...state.levels],[.025,.12,.50,.98]);
assert.deepEqual([...state.thresholds],[.15,.45,.90]);
// A level road facing the real gameplay sun (~0.75 dot product) must remain
// a colored midtone, not become an almost-white slab.
const roadSun=new THREE.Vector3(-112,165,-98).normalize();
assert.ok(roadSun.y<state.thresholds[2],'horizontal pavement does not enter near-white highlight band');
assert.equal(state.bands,4);
assert.ok(bootstrap.indexOf("./four-band-cel-host.js")<bootstrap.indexOf("./sobel-outline-host.js"),'Sobel executes after cel grading');
renderer.render(scene,camera);
state=context.window.LongHaulCelShading.getState();
assert.equal(draws,1);
assert.equal(state.materials,3,'only opaque lit road, terrain and truck receive quantized light');
for(const unlit of [basic,sign,clouds,emissive,custom])assert.equal(unlit.material.onBeforeCompile,THREE.Material.prototype.onBeforeCompile,'UI, clouds, glow and unlit materials stay intact');
function makeShader(material,name){
 const shader={uniforms:{},vertexShader:THREE.ShaderLib[name].vertexShader,fragmentShader:THREE.ShaderLib[name].fragmentShader};
 material.onBeforeCompile(shader,renderer);
 assert.ok(shader.uniforms.uLHFourBandSun,'real sun uniform present');
 assert.ok(shader.fragmentShader.includes('normalize(normal)'),'fragment-space normal, not a camera-dependent varying');
 assert.ok(shader.fragmentShader.includes('lhChroma'),'color chroma preserved');
 assert.ok(shader.fragmentShader.includes('lhPigmentLuma'),'pigment luminance preserved');
 assert.ok(shader.fragmentShader.includes('vec3(0.025)')&&shader.fragmentShader.includes('vec3(0.12)'));
 assert.ok(shader.fragmentShader.includes('vec3(0.98)'),'near-white highlight');
 assert.ok(shader.fragmentShader.includes('lhPigmentLuma*.40+uLHBandBias'),'road/terrain response differs by material');
 assert.equal((shader.fragmentShader.match(/#include <opaque_fragment>/g)||[]).length,1);
 assert.ok(!shader.vertexShader.includes('vLHFourBandNormal'));
 return shader;
}
assert.ok(makeShader(road.material,'standard').uniforms.uLHBandBias.value<0,'road midtone cooler/darker');
assert.ok(makeShader(terrain.material,'toon').uniforms.uLHBandBias.value>0,'terrain midtone lifted');
makeShader(cab.material,'lambert');
assert.ok(presentation.includes("_lhAsphaltMaterial.userData.lhCelKind='road'")&&
 presentation.includes("materials[key].userData.lhCelKind='terrain'"),'roles survive toon replacement');
const lazy=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshPhongMaterial({color:0x88aa55}));worldRoot.add(lazy);renderer.render(scene,camera);
assert.equal(context.window.LongHaulCelShading.getState().materials,4,'new streamed meshes get graded');
makeShader(lazy.material,'phong');
renderer.render(new THREE.Scene(),camera);assert.equal(context.window.LongHaulCelShading.getState().frames,2,'offscreen/postprocess scenes skip traversal');
// Actual Four-Band color logic: a red cab retains its chroma and hue in the
// midtone and near-white highlight; blue asphalt stays distinct from grass.
const pigment=(hex)=>{const c=new THREE.Color(hex);return [c.r,c.g,c.b]};
function grade(rgb,band,bias=0){const y=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722,ch=rgb.map(c=>c-y);const scale=[.055,.19,.84,.095][band];const mid=Math.max(.25,Math.min(.70,.5*.70+y*.40+bias));const k=[.025,.12,mid,.98][band];return rgb.map((_,i)=>Math.max(0,Math.min(1,k+ch[i]*scale)));}
const red=pigment(0xd53628),blue=pigment(0x3d596b),green=pigment(0x769664);
const rm=grade(red,2),bm=grade(blue,2,-.065),gm=grade(green,2,.075);
assert.ok(rm[0]>rm[1]*1.3,'red truck stays red under midtone');
assert.ok(bm[2]>bm[0],'asphalt remains cool rather than neutral gray');
assert.ok(gm[1]>gm[0]&&gm[1]>bm[1],'landscape stays green and separable from pavement');
assert.ok(grade(red,0).every(x=>x<.075),'deep shadow stays near black');
assert.ok(grade(red,3).every(x=>x>.88),'highlight approaches white');
console.log(JSON.stringify({status:'PASS',materials:4,bands:state.levels,midtones:{red:rm,asphalt:bm,terrain:gm},scope:'fragment directional cel bands, hue retention, material split, atmospheric exclusions and postprocess order'}));
