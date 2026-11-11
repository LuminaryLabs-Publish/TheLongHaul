import assert from 'node:assert/strict';
import vm from 'node:vm';
import {TOON_STYLE} from '../src/game/toon-style.mjs';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
const source=readFileSync(new URL('../src/app/sobel-outline-host.js',import.meta.url),'utf8');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(58,16/9,.1,1800);
const calls=[];let target=null,fail=false;
const renderer={
 setRenderTarget(t){target=t;calls.push(['target',!!t])},getRenderTarget(){return target},
 render(s,c){calls.push(['render',s===scene]);if(fail&&target)throw new Error('broken offscreen render')},
 getDrawingBufferSize(v){return v.set(800,450)}
};
const context={LongHaulToonStyle:TOON_STYLE,THREE,renderer,scene,camera,console,window:{}};
vm.runInNewContext(source,context,{timeout:2000});
assert.equal(context.window.LongHaulOutlines.getState().enabled,true);
renderer.render(scene,camera);
assert.deepEqual(calls,[['target',true],['render',true],['target',false],['render',false]],
 'scene rendered into a depth target, followed by a single fullscreen compositing pass');
assert.equal(renderer.getRenderTarget(),null);
assert.equal(context.window.LongHaulOutlines.getState().draws,1);
assert.equal(context.window.LongHaulOutlines.getState().width,800);
assert.equal(context.window.LongHaulOutlines.getState().height,450);
assert.ok(source.includes('shapeInk=smoothstep')&&source.includes('shapeInk*=1.0-.7*smoothstep'),
 'depth silhouettes fade distant foliage');
assert.ok(!source.includes('materialInk')&&!source.includes('colorEdge'),'no texture or transparency color outlines');
assert.ok(source.includes('strength:{value:inkStyle.strength}'));
assert.ok(!source.includes('float a=luminance'),'no redundant color-edge fetches');
const count=calls.length;renderer.render(new THREE.Scene(),camera);
assert.equal(calls.length,count+1,'other scenes are unmodified');
fail=true;renderer.render(scene,camera);
assert.equal(context.window.LongHaulOutlines.getState().enabled,false,'fallback disables Sobel');
assert.equal(renderer.getRenderTarget(),null,'fallback resets default framebuffer');
assert.ok(context.window.LongHaulOutlines.getState().fallback.includes('broken offscreen render'));
console.log(JSON.stringify({status:'PASS',scope:'depth-prioritized Sobel, no sky color-noise ink, one renderer, buffer resize, fallback'}));
