import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('src/app/settings-native-ui.js');
const runtime=read('vendor/app-runtime.js');
const manifest=JSON.parse(read('vendor/manifest.json'));
assert.equal(createHash('sha256').update(runtime).digest('hex'),manifest.sha256['app-runtime.js']);
assert.match(read('index.html'),/src\/app\/settings-native-ui\.js/);
assert.match(runtime,/settingsNativeUI\?\.render\(\)/);
const icons=JSON.parse(read('assets/ui/settings/icon-manifest.json'));
assert.equal(icons.icons.length,34);
for(let i=1;i<=34;i++){
  const file=read('assets/ui/settings/icons/ui-'+String(i).padStart(3,'0')+'.svg');
  assert.match(file,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.doesNotMatch(file,/background-image|data:image|<image /);
}
const draw={};
for(const key of ['clearRect','save','restore','translate','scale','drawImage','fillText','fillRect','beginPath','roundRect','fill','stroke','arc']) draw[key]=()=>{};
function Element(){this.handlers={};this.addEventListener=(k,v)=>{this.handlers[k]=v};this.removeEventListener=()=>{};this.getBoundingClientRect=()=>({left:0,top:0,width:1600,height:900})}
const canvasEl=new Element(),docEvents={};
const document={createElement:()=>({width:0,height:0,getContext:()=>draw}),addEventListener:(k,v)=>{docEvents[k]=v},removeEventListener:()=>{}};
const window={addEventListener:()=>{},removeEventListener:()=>{},open:()=>{}};
const THREE={
 CanvasTexture:class{dispose(){}},MeshBasicMaterial:class{dispose(){}},
 Scene:class{constructor(){this.children=[]}add(v){this.children.push(v)}},
 Mesh:class{constructor(g,m){this.geometry=g;this.material=m}},
 PlaneGeometry:class{dispose(){}},
 OrthographicCamera:class{constructor(){this.position={z:0}}}
};
THREE.SRGBColorSpace='srgb';
const r={domElement:canvasEl,autoClear:true,renderCount:0,clearDepth(){},render(){this.renderCount++}};
const Image=class{set src(v){this.url=v}};
vm.runInNewContext(source,{window,document,Image,console},{timeout:2000});
assert.equal(typeof window.createLongHaulSettingsUI,'function');
const settings={steering:100,motion:true,hitStop:1,sound:true,masterVolume:100,musicVolume:100,effectsVolume:100,
 graphicsQuality:'High',quality:true,renderResolution:'Balanced',uiScale:100,fov:58,reducedEffects:false};
let scene='settings',saves=0,applies=0,resizes=0,back=0;
const camera={fov:58,updateProjectionMatrix(){}};
const audio={master:{gain:{value:.55}},ensure(){}};
const ui=window.createLongHaulSettingsUI({THREE,renderer:r,settings,currentScene:()=>scene,saveSettings:()=>saves++,applySettings:()=>applies++,resize:()=>resizes++,audio,camera,onBack:()=>back++,onCreditsBack:()=>back++});
assert.equal(ui.descriptors.Gameplay.length,4);
assert.equal(ui.descriptors.Audio.length,4);
assert.equal(ui.descriptors.Video.length,5);
ui.render();assert.equal(r.renderCount,1);
const pointer=(x,y)=>canvasEl.handlers.pointerdown({clientX:x,clientY:y,preventDefault(){}});
pointer(1100,350);assert.ok(settings.steering>100);assert.ok(saves>0);
pointer(690,220);assert.equal(ui.getState().tab,'Audio');
pointer(1200,350);assert.equal(settings.sound,false);
pointer(1000,630);assert.ok(settings.effectsVolume<100);
const unavailable=settings.musicVolume;pointer(1050,537);assert.equal(settings.musicVolume,unavailable);
pointer(1030,220);assert.equal(ui.getState().tab,'Video');
pointer(1270,350);assert.equal(settings.graphicsQuality,'Low');assert.equal(settings.quality,false);
pointer(1130,630);assert.equal(settings.fov,90);assert.equal(camera.fov,90);
pointer(1220,720);assert.equal(settings.reducedEffects,true);
scene='credits';ui.render();assert.equal(r.renderCount,2);
pointer(340,817);assert.equal(back,1);
assert.ok(saves>=5&&applies>=5);
assert.match(read('src/app/sobel-outline-host.js'),/settings\.reducedEffects/);
ui.dispose();
console.log('Settings UI descriptors, 34 transparent vectors, input, settings bindings, and runtime hash verified');
