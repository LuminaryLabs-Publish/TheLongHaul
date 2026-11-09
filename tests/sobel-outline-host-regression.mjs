import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
const content=readFileSync(new URL('../src/app/sobel-outline-host.js',import.meta.url),'utf8');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(58,16/9,.1,1800);
const calls=[];let target=null,fail=false;
const renderer={
 setRenderTarget(t){target=t;calls.push(['target',!!t])},getRenderTarget(){return target},
 render(s,c){calls.push(['render',s===scene]);if(fail&&target)throw new Error('broken offscreen render')},
 getDrawingBufferSize(v){return v.set(800,450)}
};
const context={THREE,renderer,scene,camera,console,window:{}};
vm.runInNewContext(content,context,{timeout:2000});
assert.equal(context.window.LongHaulOutlines.getState().enabled,true);
renderer.render(scene,camera);
assert.deepEqual(calls,[['target',true],['render',true],['target',false],['render',false]],
 'world rendered into depth target, then fullscreen Sobel composite to canvas');
assert.equal(renderer.getRenderTarget(),null);
assert.equal(context.window.LongHaulOutlines.getState().draws,1);
assert.equal(context.window.LongHaulOutlines.getState().width,800);
assert.equal(context.window.LongHaulOutlines.getState().height,450);
const length=calls.length;
renderer.render(new THREE.Scene(),camera);
assert.equal(calls.length,length+1,'other scenes are rendered normally');
assert.equal(calls.at(-1)[0],'render');
fail=true;
renderer.render(scene,camera);
assert.equal(context.window.LongHaulOutlines.getState().enabled,false,'failure safely disables Sobel');
assert.equal(renderer.getRenderTarget(),null,'failure restores default framebuffer');
assert.ok(context.window.LongHaulOutlines.getState().fallback.includes('broken offscreen render'));
console.log(JSON.stringify({status:'PASS',scope:'depth-and-color Sobel, single renderer, target resize, fallback'}));
