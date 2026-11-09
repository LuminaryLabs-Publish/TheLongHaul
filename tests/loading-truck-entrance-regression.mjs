import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=(await readFile(new URL('../src/app/loading-truck-3d.mjs',import.meta.url),'utf8'))
  .replace(/^import .*;\s*$/gm,'');
const queue=new Map();
let sequence=0,now=1000,renders=0,starts=0;
class Vec {
  constructor(){this.x=0;this.y=0;this.z=0}
  set(x,y,z){Object.assign(this,{x,y,z});return this}
}
class Node {
  constructor(){this.position=new Vec();this.rotation=new Vec();this.children=[]}
  add(node){this.children.push(node)}
  lookAt(){}
}
class Renderer {
  setClearColor(){} setPixelRatio(){} setSize(){} dispose(){}
  render(){renders++}
}
class Material {dispose(){}}
const THREE={
  Scene:Node,OrthographicCamera:class extends Node{updateProjectionMatrix(){}},
  HemisphereLight:Node,DirectionalLight:Node,
  DataTexture:Material,MeshToonMaterial:Material,WebGLRenderer:Renderer,
  RedFormat:1,NearestFilter:1
};
const canvas={},host={clientWidth:1280,clientHeight:720,style:{}};
const overlay={hidden:false,style:{display:'block'},clientWidth:1280,clientHeight:720};
let rig=null;
const window={
  devicePixelRatio:1,addEventListener(){},
  LongHaulAsyncLoading:{registerTruck3D(api){starts++;api.enter()}}
};
const context={
  THREE,window,performance:{now:()=>now},
  document:{getElementById:id=>({
    'async-loading-truck-3d':canvas,
    'async-loading-truck-3d-host':host,
    'async-loading-scene':overlay
  })[id]??null},
  createTruckGrounding(){},
  createHeroTruckMesh(){
    rig={root:new Node(),wheels:[{rotateY(){}}],
      heroSourceId:'long-haul:vehicle:hero-hauler:v1',heroRelease(){}};
    return rig;
  },
  requestAnimationFrame(callback){const id=++sequence;queue.set(id,callback);return id},
  cancelAnimationFrame(id){queue.delete(id)},
  console:{warn(e){throw Error(String(e))}}
};
vm.runInNewContext(source,context,{filename:'loading-truck-3d.mjs'});
const api=window.LongHaulLoadingTruck3D;
assert.equal(starts,1,'the boot host starts the truck exactly once');
assert.equal(api.getState().ready,true);
assert.equal(rig.root.position.x,-30,'the first rendered pose is completely offscreen left');
assert.equal(renders,1,'the starting offscreen position is rendered immediately');
function frame(time){
  now=time;
  const next=queue.entries().next().value;
  if(!next)return false;
  queue.delete(next[0]);next[1](time);
  return true;
}
frame(1000);frame(1030);
assert.ok(rig.root.position.x<0,'entrance begins offscreen left');
frame(8300);
assert.ok(rig.root.position.x<0,'a stalled frame cannot skip the full entrance');
for(let i=1;i<=25;i++)frame(8300+i*50);
assert.equal(api.getState().entered,true);
assert.equal(rig.root.position.x,0);
let exit=api.exit({aborted:false,addEventListener(){},removeEventListener(){}});
for(let i=1;i<=16;i++)frame(9600+i*50);
await exit;
assert.equal(rig.root.position.x,30);
assert.equal(api.getState().exited,true);

// With instant preparation, an early exit request must not bypass entrance.
now=11000;api.enter();
assert.equal(rig.root.position.x,-30);
exit=api.exit({aborted:false,addEventListener(){},removeEventListener(){}});
frame(11000);frame(11050);
assert.ok(rig.root.position.x<0);
for(let i=2;i<=28;i++)frame(11000+i*50);
assert.equal(api.getState().entered,true);
for(let i=29;i<=46;i++){if(!frame(11000+i*50))break;}
await exit;
assert.equal(api.getState().exited,true);
assert.equal(rig.root.position.x,30);
console.log('PASS loading truck: one entrance, offscreen first paint, skipped-frame pacing, early exit waits for entrance');
