import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {readFileSync} from 'node:fs';
import {createPlayableRoadV3Course,playableRoadV3Point} from '../src/game/road-v3-playable-course.mjs';
import {createCourseCellDescriptor} from '../src/game/cell-descriptor.mjs';
import {terrainHeight} from '../src/game/world-base.mjs';
import {roadSceneryPositionAllowed} from '../src/game/road-junction-clearance.mjs';
import {authoredPropCollider} from '../src/game/world-contact.mjs';
import {ENV_TILE_METERS,ENV_CELL_METERS,ENV_TILE_VARIANTS,ENVIRONMENT_TILE_CATALOG} from '../src/game/environment-tile-catalog.mjs';
import {ENVIRONMENT_AUTHORING_SOURCE} from '../src/game/environment-tile-authoring.mjs';
import {environmentCellPlanSteps} from '../src/game/environment-tile-planner.mjs';
import {createEnvironmentTileRenderer,ENVIRONMENT_RENDER_LIMITS} from '../src/game/environment-tile-renderer.mjs';
import {planRoadsideUtilitiesForCell,utilityCableVertices} from '../src/game/roadside-utilities.mjs';
import {ROAD_GENERATOR_VERSION} from '../src/game/road-chunks.mjs';
import {ROAD_V3_VERSION} from '../src/game/road-v3-geometry.mjs';

const course=createPlayableRoadV3Course('haul-procedural-safe-pass2-host',{progress:0});
const settings={quality:true},cellHosts=new Map(),cellDecorationQueue=[];
const near=playableRoadV3Point(course,160),observer={x:near.x,y:near.y,z:near.z};
const grad=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
grad.needsUpdate=true;
const materials={truckRed:{gradientMap:grad}};
const cells=[];
for(let x=-320;x<=320;x+=160)for(let z=-640;z<=160;z+=160){
 const bounds={minX:x,maxX:x+160,minZ:z,maxZ:z+160};
 const utilities=planRoadsideUtilitiesForCell(course,bounds,{heightAt:(a,b)=>terrainHeight(course,a,b),roadSafety:(a,b,m)=>roadSceneryPositionAllowed(course,a,b,m)});
 if(utilities.poles.length&&utilities.spans.length){
  const patch=createCourseCellDescriptor(course,{id:`test:${x}:${z}`,bounds,coordinates:[x/160,z/160]},{terrainSegments:8});
  if(patch.roads.length)cells.push({patch,utilities});
 }
}
assert.ok(cells.length,'Need a real V3 cell containing utility poles and cables');
const chosen=cells[0];
const entry={patch:chosen.patch,visualOnly:false,decorationStage:0,group:new THREE.Group(),obstacles:[],owned:{instances:[]}};
cellHosts.set(entry.patch.cellId,entry);
cellDecorationQueue.push({id:entry.patch.cellId,entry});
const report={};
let refreshes=0;
const win={};
const context={window:win,console,course,settings,cellHosts,cellDecorationQueue,
 CELL_SIZE:160,ENV_TILE_METERS,ENV_CELL_METERS,ENV_TILE_VARIANTS,ENVIRONMENT_TILE_CATALOG,
 ENVIRONMENT_RENDER_LIMITS,ENVIRONMENT_AUTHORING_SOURCE,ROAD_GENERATOR_VERSION,ROAD_V3_VERSION,
 THREE,materials,planRoadsideUtilitiesForCell,utilityCableVertices,
 environmentCellPlanSteps,createEnvironmentTileRenderer,authoredPropCollider,
 terrainHeight:(c,a,b)=>terrainHeight(c,a,b),
 roadSceneryPositionAllowed:(c,a,b,m)=>roadSceneryPositionAllowed(c,a,b,m),
 roadChunkAt:()=>({kind:'straight',id:'test'}),
 playableRoadV3Point:(c,s)=>playableRoadV3Point(c,s),
 readTruck:()=>({position:observer}),
 truckRenderedGroundHeight:(a,b)=>terrainHeight(course,a,b),
 refreshObstacles:()=>{refreshes++;},
 updateCloudLayers:()=>{},
 decorateCell(job){const e=cellHosts.get(job.id);if(e!==job.entry)return;
   if(e.decorationStage++===0)cellDecorationQueue.push(job);
 },
 releaseCell(id){cellHosts.delete(id);},
 applySettings(){return true;}
};
vm.runInNewContext(readFileSync(new URL('../src/app/environment-tiles-host.js',import.meta.url),'utf8'),context,{timeout:5000});
let ticks=0;
while(cellDecorationQueue.length){
 const job=cellDecorationQueue.shift();context.decorateCell(job);
 assert.ok(++ticks<700,'Cell decoration must terminate');
}
const state=entry.environmentTileState;

test('real V3 environment cell contains the authored pole meshes and wire geometry',()=>{
 assert.equal(win.LongHaulEnvironmentTiles.getState().status,'authored');
 assert.ok(state.applied,'Cell assembly should finish');
 assert.ok(state.plan.objects.some(o=>o.kind==='pole'));
 assert.ok(entry.group.children.some(x=>x.name==='LH_ROADSIDE_WIND_CABLES'));
 assert.ok(state.render.meshes.some(m=>m.name.includes('LH_ENV_')));
 assert.ok(entry.obstacles.some(o=>o.kind==='pole'));
 assert.ok(refreshes>=1);
});
test('wind updates only cable vertices, not road or obstacles',()=>{
 const before=state.utilityWire.geometry.attributes.position.array.slice();
 const obstacles=entry.obstacles.map(o=>({...o}));
 context.updateCloudLayers({position:observer},5000);
 const after=state.utilityWire.geometry.attributes.position.array;
 assert.ok(after.some((v,i)=>Math.abs(v-before[i])>.01));
 assert.deepEqual(entry.obstacles,obstacles);
 assert.ok(state.utilityWire.mesh.isLineSegments);
});
test('streaming release removes wire and collider state',()=>{
 const wire=state.utilityWire;
 context.releaseCell(entry.patch.cellId);
 assert.equal(wire.mesh.parent,null);
 assert.equal(entry.environmentTileState,null);
 assert.equal(entry.obstacles.length,0);
 assert.equal(win.LongHaulEnvironmentTiles.getState().renderer.activeCells,0);
});
console.log(`PASS real-Three.js V3 utility host: ${ticks} scheduled steps, ${chosen.utilities.poles.length} poles, ${chosen.utilities.spans.length} spans`);
