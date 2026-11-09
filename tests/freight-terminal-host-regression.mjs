import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {createEndlessHighway,endlessHighwayProgress,advanceEndlessHighway} from '../src/game/endless-highway.mjs';
import {nearestRoad} from '../src/game/world-base.mjs';
import {attachFreightTerminalStart,terminalObstacleVolumes,FREIGHT_TERMINAL_VERSION,terminalWorldPoint,terminalLocalPoint,freightTerminalGroundHeight} from '../src/game/freight-terminal-start.mjs';
import {parseFreightTerminalGlb,createFreightTerminalThreeObject} from '../src/game/freight-terminal-glb.mjs';
import {FREIGHT_TERMINAL_TRAFFIC,evaluateFreightTerminalTraffic,terminalTrafficCollisionProxies} from '../src/game/freight-terminal-activity.mjs';
import {createTrafficVehicleFactory} from '../src/game/traffic-vehicle-authoring.mjs';
const bytes=readFileSync(new URL('../assets/freight-terminal/terminal-yard.glb',import.meta.url));
const asset=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const group=new THREE.Group(),hosts=new Map();let refresh=0,driving=0;
const c={
  THREE,URL,console,worldRoot:group,createTrafficVehicleFactory,
  evaluateFreightTerminalTraffic,terminalTrafficCollisionProxies,FREIGHT_TERMINAL_TRAFFIC,
  simulationFrozen:()=>false,
  obstacleCandidates:()=>[],
  materials:{truckRed:{gradientMap:new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1)}},
  document:{currentScript:{src:'https://example.invalid/src/app/freight-terminal-host.js'}},
  fetch:async()=>({ok:true,arrayBuffer:async()=>asset}),
  createEndlessHighway,attachFreightTerminalStart,terminalObstacleVolumes,FREIGHT_TERMINAL_VERSION,
  terminalWorldPoint,terminalLocalPoint,freightTerminalGroundHeight,
  parseFreightTerminalGlb,createFreightTerminalThreeObject,nearestRoad,endlessHighwayProgress,advanceEndlessHighway,
  freightResumeCheckpoint:null,course:null,readTruck:()=>({position:c.course?.origin||{x:0,z:0}}),
  generateEndlessCourse:seed=>createEndlessHighway(seed),
  realizeCell(patch){hosts.set(patch.cellId,{obstacles:[]})},cellHosts:hosts,
  refreshObstacles:()=>refresh++,preTickDriving(){driving++},preTickIdle(){},
};c.window=c;
vm.runInNewContext(readFileSync(new URL('../src/app/freight-terminal-host.js',import.meta.url),'utf8'),c,{timeout:2000});
assert.equal(await c.LongHaulFreightTerminal.readyPromise,true,'actual static GLB loads');
assert.equal(c.LongHaulFreightTerminal.getState().ready,true);
assert.ok(group.children[0].children.length>=30,'terminal material batches render without duplicate highway/terrain');
const fresh=c.generateEndlessCourse('real-host-new');
assert.equal(fresh.freightTerminal.id,FREIGHT_TERMINAL_VERSION);
assert.ok(fresh.edges.some(e=>e.id==='terminal:start-ramp'));
c.course=fresh;c.preTickDriving(1/60);
assert.equal(driving,1);assert.equal(group.children[0].visible,true,'actual terminal visible at player spawn');
assert.equal(c.LongHaulFreightTerminal.getState().traffic.length,3,'three authored moving freight trucks are initialized');
for(let i=0;i<20*60;i++)c.preTickDriving(1/60);
assert.ok(c.LongHaulFreightTerminal.getState().movingTrucks>0,'trucks enter and exit the freight terminal');
const dynamic=c.obstacleCandidates(c.course.origin,1200).filter(o=>o.kind==='terminal-moving-truck');
assert.ok(dynamic.length>=3,'moving freight trucks expose current collision volumes');
const site=fresh.freightTerminal,volume=terminalObstacleVolumes(site)[0];
const cellX=Math.floor(volume.x/160),cellZ=Math.floor(volume.z/160);
c.realizeCell({cellId:`${cellX}:${cellZ}`,bounds:{minX:cellX*160,maxX:(cellX+1)*160,minZ:cellZ*160,maxZ:(cellZ+1)*160}},{});
assert.ok(hosts.get(`${cellX}:${cellZ}`).obstacles.length>0,'world cell owns real terminal colliders');
assert.ok(refresh>0,'collision index refreshed');
const old=c.course;const oldCount=old.edges.length;
c.advanceEndlessHighway(old,900);
assert.ok(old.edges.some(e=>e.id==='terminal:start-ramp'),'ramp survives world window rebuild');
assert.ok(old.edges.length>0&&oldCount>0);
// Resume a pre-terminal V2 checkpoint without changing its geography.
c.freightResumeCheckpoint={freightTerminal:null,journey:{progress:0},truck:{position:{x:0,y:0,z:0},heading:3}};
assert.equal(c.generateEndlessCourse('old-save').freightTerminal,undefined);
// Saved terminal haul restores the same graph start on reload.
c.freightResumeCheckpoint={freightTerminal:FREIGHT_TERMINAL_VERSION,journey:{progress:0},truck:{position:{x:0,y:0,z:0},heading:3}};
assert.equal(c.generateEndlessCourse('new-save').freightTerminal.id,FREIGHT_TERMINAL_VERSION);
console.log(JSON.stringify({status:'PASS',assets:group.children[0].children.length,collisionOwners:hosts.size,hostReady:true,oldSaveUnchanged:true}));
