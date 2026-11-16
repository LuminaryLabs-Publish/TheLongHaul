import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isDirectTerminalRun,straightTerminalRoadPoints,validateStraightTerminalRoad} from '../src/game/terminal-direct-road.mjs';
const p=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('new terminal seed retains distinct save identity',()=>{
 assert.ok(isDirectTerminalRun('haul-terminal-direct-new'));
 assert.ok(!isDirectTerminalRun('haul-winding-ground-old'));
});
test('one straight and connected exit, no steep grade',()=>{
 const start={x:0,y:.2,z:-132},merge={x:177,y:.34,z:-474};
 const road=straightTerminalRoadPoints(start,merge);
 assert.deepEqual(road[0],start);assert.deepEqual(road.at(-1),merge);
 assert.deepEqual(validateStraightTerminalRoad(road),[]);
});
test('terminal orientation aligns the exit tangent with the highway tangent',()=>{
 const local=Math.atan2(177,-342),wrap=v=>Math.atan2(Math.sin(v),Math.cos(v));
 for(const heading of [-Math.PI,-2.6,-.5,0,1.7,Math.PI]){
  const yaw=heading-local,c=Math.cos(yaw),s=Math.sin(yaw);
  const x=c*177+s*(-342),z=-s*177+c*(-342);
  assert.ok(Math.abs(wrap(Math.atan2(x,z)-heading))<1e-10);
 }
});
test('terminal always owns fresh direct run independent of art load',()=>{
 const src=p('src/app/freight-terminal-host.js');
 assert.match(src,/const directStart=!saved && seed\.startsWith\('haul-terminal-direct-'\)/);
 assert.match(src,/directStart\|\|restoreDirect\|\|legacyAllowed/);
});
test('authored curved ramp stays only for legacy saves',()=>{
 const src=p('src/game/freight-terminal-start.mjs');
 assert.match(src,/straightTerminalRoadPoints\(terminalWorldPoint\(site,LOCAL_SPAWN\)/);
 assert.match(src,/:RAMP_LOCAL\.map\(p=>terminalWorldPoint\(site,p\)\)/);
});
test('no duplicate first interchange; later procedural road continues',()=>{
 const src=p('src/game/road-v3-playable-course.mjs');
 assert.match(src,/if\(directTerminal&&index===3\)continue/);
 const terrain=p('src/game/road-v3-terrain-route.mjs');
 assert.match(terrain,/seed\.startsWith\('haul-terminal-direct-'\)/);
});
test('browser runtime regenerated from newest source',()=>{
 const runtime=p('vendor/app-runtime.js'),seed=p('src/app/app-chunk-5.js');
 assert.match(seed,/haul-terminal-direct-\$\{values\[0\]/);
 assert.match(runtime,/haul-terminal-direct-\$\{values\[0\]/);
 assert.match(runtime,/applyWorldContact\(worldContactPrevious,dt\)/);
});
