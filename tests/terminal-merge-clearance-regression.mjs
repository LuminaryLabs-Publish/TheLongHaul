import test from 'node:test';
import assert from 'node:assert/strict';
import {terminalExitSegments,overheadTerminalExit,clearOverheadRoadTriangles} from '../src/game/terminal-merge-clearance.mjs';
const samples=Array.from({length:33},(_,i)=>({x:0,y:1,z:-i*10,progress:i*10}));
const course={freightTerminal:{},edges:[{id:'terminal:start-ramp',samples}]};
const segments=terminalExitSegments(course);
test('fresh and saved terminal roads both get clearance',()=>{assert.equal(segments.length,32);assert.equal(terminalExitSegments({edges:course.edges}).length,0);});
test('road above the depot exit is removed',()=>assert.equal(overheadTerminalExit(segments,0,5,-150),true));
test('at-grade mainline and roadside terrain remain',()=>{assert.equal(overheadTerminalExit(segments,0,1.1,-150),false);assert.equal(overheadTerminalExit(segments,20,9,-150),false);});
test('road beyond the merge is untouched',()=>assert.equal(overheadTerminalExit(segments,0,8,-319),false));
test('triangles above exit are removed without changing source buffers',()=>{
 const data={positions:[-1,5,-140,1,5,-140,0,5,-145, 15,5,-140,17,5,-140,16,5,-145],indices:[0,1,2,3,4,5],uvs:[]};
 const out=clearOverheadRoadTriangles(data,segments);
 assert.deepEqual(out.indices,[3,4,5]);assert.equal(data.indices.length,6);
});
test('no terminal does not clip ordinary roads',()=>{const data={positions:[0,10,0],indices:[0,0,0]};assert.equal(clearOverheadRoadTriangles(data,[]),data);});

test('wide overhead slab spanning the exit is removed even when vertices lie outside',()=>{
 const data={positions:[-18,8,-150,18,8,-150,18,8,-160],indices:[0,1,2]};
 assert.deepEqual(clearOverheadRoadTriangles(data,segments).indices,[]);
});
