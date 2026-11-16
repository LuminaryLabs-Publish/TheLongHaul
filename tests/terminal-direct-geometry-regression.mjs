import test from 'node:test';
import assert from 'node:assert/strict';
import {straightTerminalRoadPoints,validateStraightTerminalRoad,isDirectTerminalRun} from '../src/game/terminal-direct-road.mjs';
const start={x:0,y:0.2,z:-132},merge={x:177,y:.34,z:-474};
test('new terminal-direct seed and legacy saves distinct',()=>{
 assert.equal(isDirectTerminalRun('haul-terminal-direct-abcdef'),true);
 assert.equal(isDirectTerminalRun('haul-winding-ground-abcdef'),false);
});
test('single straight road connects terminal spawn to highway merge exactly',()=>{
 const road=straightTerminalRoadPoints(start,merge);
 assert.deepEqual(road[0],start);assert.deepEqual(road.at(-1),merge);
 assert.deepEqual(validateStraightTerminalRoad(road),[]);
});
test('all sampled road segments have matching direction',()=>{
 const road=straightTerminalRoadPoints(start,merge);
 const heading=Math.atan2(merge.x-start.x,merge.z-start.z);
 for(let i=1;i<road.length;i++){
  const a=road[i-1],b=road[i];
  assert.ok(Math.abs(Math.atan2(b.x-a.x,b.z-a.z)-heading)<1e-8);
 }
});
test('no cliff or abrupt grade occurs at the terminal exit',()=>{
 assert.deepEqual(validateStraightTerminalRoad(straightTerminalRoadPoints(start,merge),{maxGrade:.12}),[]);
});
test('reject impossible steep exit instead of declaring it drivable',()=>{
 const road=straightTerminalRoadPoints(start,{...merge,y:120});
 assert.ok(validateStraightTerminalRoad(road).includes('grade-or-spacing'));
});
test('40 seeded transforms retain straight connected road',()=>{
 for(let i=0;i<40;i++){
  const a={x:Math.sin(i)*70,y:i*.01,z:-132-i*3};
  const b={x:a.x+177,y:a.y+.3,z:a.z-342};
  assert.deepEqual(validateStraightTerminalRoad(straightTerminalRoadPoints(a,b)),[]);
 }
});
