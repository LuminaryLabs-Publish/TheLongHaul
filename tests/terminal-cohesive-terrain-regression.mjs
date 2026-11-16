import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  cohesiveOpeningElevation,cohesiveOpeningWidth,cohesiveTerminalSoilHeight,
  isCohesiveTerminalRun,isDirectTerminalRun,straightTerminalRoadPoints,validateStraightTerminalRoad
} from '../src/game/terminal-direct-road.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const near=(a,b,e=.0001)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('only new cohesive seeds replace legacy first section',()=>{
 assert.equal(isCohesiveTerminalRun('haul-terminal-cohesive-abc'),true);
 assert.equal(isCohesiveTerminalRun('haul-terminal-direct-abc'),false);
 assert.equal(isDirectTerminalRun('haul-terminal-direct-abc'),true);
 assert.equal(isDirectTerminalRun('haul-terminal-cohesive-abc'),true);
 const adapter=read('src/game/road-v3-playable-course.mjs');
 assert.match(adapter,/if\(isCohesiveTerminalRun\(seed\)\)edges=edges\.filter/);
 assert.match(adapter,/edge\.endProgress<=320/);
});
test('new highway begins at terminal merge grade',()=>{
 near(cohesiveOpeningElevation(0,12,27),12);
 near(cohesiveOpeningElevation(320,12,27),12);
 near(cohesiveOpeningElevation(440,12,27),12);
 near(cohesiveOpeningElevation(960,12,27),27);
 for(let p=0;p<1200;p+=.05)
   assert.ok(Math.abs(cohesiveOpeningElevation(p+.05,12,27)-cohesiveOpeningElevation(p,12,27))<.005);
});
test('standard additional merge lane disappears smoothly',()=>{
 near(cohesiveOpeningWidth(320,28),31.6);
 near(cohesiveOpeningWidth(540,28),28);
 for(let p=320;p<540;p++)
   assert.ok(cohesiveOpeningWidth(p+1,28)<=cohesiveOpeningWidth(p,28)+1e-6);
});
const site={x:0,y:12,z:0,yaw:0},start={x:0,y:12.2,z:-132},end={x:177,y:12.34,z:-474};
test('terminal apron and exit share terrain floor',()=>{
 near(cohesiveTerminalSoilHeight(site,start,end,0,-132,50),12.035);
 const soil=cohesiveTerminalSoilHeight(site,start,end,177,-474,50);
 assert.ok(soil<end.y-.15 && soil>end.y-1.2);
});
test('procedural terrain remains unchanged outside terminal grading',()=>{
 near(cohesiveTerminalSoilHeight(site,start,end,700,700,37),37);
 assert.equal(cohesiveTerminalSoilHeight({...site,z:undefined},start,end,0,0,15),15);
});
test('straight terminal road is seamless and grade-safe',()=>{
 const points=straightTerminalRoadPoints(start,end);
 assert.deepEqual(points.at(0),start);
 assert.deepEqual(points.at(-1),end);
 assert.deepEqual(validateStraightTerminalRoad(points),[]);
});
test('runtime and startup require correct terminal presentation',()=>{
 const host=read('src/app/freight-terminal-host.js'),bootstrap=read('src/app/bootstrap.mjs');
 const runtime=read('vendor/app-runtime.js'),menu=read('index.html');
 assert.match(host,/haul-terminal-cohesive-/);
 assert.match(bootstrap,/freight terminal model did not load/);
 assert.match(menu,/bootstrap\.mjs\?v=tlh-roadside-props-pass2-01/);
 assert.match(runtime,/haul-procedural-safe-\$\{values\[0\]/);
});
