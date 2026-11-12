import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import * as THREE from '../vendor/three.module.js';
import {createEndlessHighway} from '../src/game/endless-highway.mjs';
import {parseSettlementGlb,createSettlementGeometry} from '../src/game/settlement-glb.mjs';
const course=createEndlessHighway('haul-winding-test',{progress:2800});
const parcel=course.towns[0].parcels[0],position={x:parcel.x,y:parcel.y,z:parcel.z};
let active='driving',frameCalls=0;
const hostUrl=new URL('../src/app/connected-town-host.js',import.meta.url);
const ctx={THREE,worldRoot:new THREE.Group(),document:{currentScript:{src:hostUrl.href}},
  URL,console,parseSettlementGlb,createSettlementGeometry,course,
  currentScene:()=>active,readTruck:()=>({position}),
  terrainHeight:()=>0,obstacleCandidates:()=>[],
  arcadeVisualFrame:()=>{frameCalls++;},window:{},
  fetch:async target=>{
    const path=fileURLToPath(String(target));const bytes=readFileSync(path);
    return {ok:true,status:200,json:async()=>JSON.parse(bytes.toString('utf8')),
      arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  }
};
vm.runInNewContext(readFileSync(hostUrl,'utf8'),ctx,{timeout:2000});
assert.equal(await ctx.window.LongHaulTowns.readyPromise,true,'actual 17 bundled GLBs load');
ctx.arcadeVisualFrame(1000);
const live=ctx.window.LongHaulTowns.getState();
assert.equal(live.loaded,17);assert.ok(live.visible>0&&live.visible<=17);
assert.equal(live.errors.length,0);assert.equal(frameCalls,1);
assert.equal(ctx.obstacleCandidates(position,30).filter(x=>x.kind==='town-building').length>0,true,'town solid candidates included');
active='paused';ctx.arcadeVisualFrame(2000);assert.equal(ctx.window.LongHaulTowns.getState().visible,0,'paused town models retire');
console.log(JSON.stringify({status:'PASS',models:live.loaded,instances:live.visible,loadedTriangles:live.triangles,interactions:'collision candidates and lifecycle',gpuVerified:false}));
