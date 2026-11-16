import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableRoadV3Course} from '../src/game/road-v3-playable-course.mjs';
import {attachFreightTerminalStart} from '../src/game/freight-terminal-start.mjs';
import {roadRibbonData} from '../src/game/road-surface.mjs';
import {terminalExitSegments,overheadTerminalExit,clearOverheadRoadTriangles} from '../src/game/terminal-merge-clearance.mjs';
for(let seedNo=0;seedNo<5;seedNo++){
 test(`real V3 seed ${seedNo}: depot exit reaches highway at grade without overhead road geometry`,()=>{
  const c=attachFreightTerminalStart(createPlayableRoadV3Course(`haul-terminal-cohesive-${seedNo}`));
  const terminal=c.edges.find(e=>e.id==='terminal:start-ramp');
  const highway=c.edges.find(e=>e.id==='endless:highway:1');
  assert.ok(terminal&&highway);
  const last=terminal.samples.at(-1),first=highway.samples[0];
  assert.ok(Math.hypot(last.x-first.x,last.z-first.z)<1e-6);
  assert.ok(Math.abs(last.y-first.y)<1e-6);
  const segments=terminalExitSegments(c);
  const roads=c.edges.filter(e=>e.id!==terminal.id).flatMap(edge=>edge.samples.slice(1).map((b,i)=>({a:edge.samples[i],b,modular:true})));
  const data=clearOverheadRoadTriangles(roadRibbonData(roads),segments);
  for(let i=0;i<data.indices.length;i++){
   const at=data.indices[i]*3;
   assert.equal(overheadTerminalExit(segments,data.positions[at],data.positions[at+1],data.positions[at+2]),false);
  }
 });
}
