import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {MOCK_THREE} from './environment-tile-renderer-regression.mjs';
import {createEnvironmentTileRenderer,ENVIRONMENT_RENDER_LIMITS} from '../src/game/environment-tile-renderer.mjs';
import {planEnvironmentCell,environmentCellPlanSteps} from '../src/game/environment-tile-planner.mjs';
import {ENV_TILE_METERS,ENV_CELL_METERS,ENV_TILE_VARIANTS,ENVIRONMENT_TILE_CATALOG} from '../src/game/environment-tile-catalog.mjs';
import {ENVIRONMENT_AUTHORING_SOURCE} from '../src/game/environment-tile-authoring.mjs';
import {ROAD_GENERATOR_VERSION} from '../src/game/road-chunks.mjs';
import {ROAD_V3_VERSION} from '../src/game/road-v3-geometry.mjs';
class Node {
 constructor(){this.children=[];this.parent=null;}
 add(n){this.children.push(n);n.parent=this;}
 remove(n){this.children=this.children.filter(x=>x!==n);n.parent=null;}
}
const seed='world-streaming-integration',cellHosts=new Map(),cellDecorationQueue=[],settings={quality:true};
const truckPosition={x:0,y:0,z:-230};
const course={seed,generatorVersion:ROAD_GENERATOR_VERSION};
function addEntry(id,bounds,visualOnly=false){
 const entry={decorationStage:0,patch:{cellId:id,bounds},visualOnly,group:new Node(),owned:{instances:[]}};
 cellHosts.set(id,entry);cellDecorationQueue.push({id,entry});return entry;
}
const root=addEntry('world:0:0',{minX:0,maxX:160,minZ:-320,maxZ:-160});
const second=addEntry('world:-1:0',{minX:-160,maxX:0,minZ:-320,maxZ:-160});
const output={log:[],warn(...args){this.log.push(args.map(String).join(' '));}};
const win={};
const sandbox={
 window:win,console:output,course,settings,cellHosts,cellDecorationQueue,
 CELL_SIZE:160,
 ENVIRONMENT_AUTHORING_SOURCE,ENVIRONMENT_TILE_CATALOG,ENV_TILE_METERS,ENV_CELL_METERS,ENV_TILE_VARIANTS,ENVIRONMENT_RENDER_LIMITS,
 ROAD_GENERATOR_VERSION,ROAD_V3_VERSION,materials:{truckRed:{gradientMap:{id:'toon'}}},THREE:MOCK_THREE,
 planEnvironmentCell,environmentCellPlanSteps,createEnvironmentTileRenderer,terrainHeight:()=>0,
 nearestRoad:()=>({distance:100,edge:{width:28}}),
 readTruck:()=>({position:truckPosition}),updateCloudLayers:()=>{},
 decorateCell(job){const e=cellHosts.get(job.id);if(e!==job.entry)return;
   if(e.decorationStage++===0)cellDecorationQueue.push(job);
 },
 releaseCell(id){cellHosts.delete(id);},
 applySettings(){return true;}
};
const source=await readFile(new URL('../src/app/environment-tiles-host.js',import.meta.url),'utf8');
vm.runInNewContext(source,sandbox,{timeout:2500});
assert.equal(win.LongHaulEnvironmentTiles.getState().status,'authored');
function drain(){let steps=0;
 while(cellDecorationQueue.length){const job=cellDecorationQueue.shift();sandbox.decorateCell(job);
  assert.ok(++steps<400,'progressive scene authoring respects frame batches');}
 return steps;
}
const ticks=drain();assert.ok(ticks>2);
assert.ok(root.environmentTileState?.applied&&second.environmentTileState?.applied);
assert.ok(root.environmentTileState.render.meshCount>0);
assert.ok(root.group.children.length>0);
assert.ok(win.LongHaulEnvironmentTiles.getState().renderer.activeCells===2);
const seen=new Set();for(const entry of [root,second])for(const obj of entry.environmentTileState.plan.objects){
 assert.ok(!seen.has(obj.id),'neighbour cells do not duplicate procedural prop');seen.add(obj.id);
}
const previous=root.environmentTileState.render.meshes.slice();
settings.quality=false;sandbox.applySettings();const lowTicks=drain();
assert.ok(lowTicks>0);assert.equal(root.environmentTileState.quality,false);
assert.ok(previous.every(x=>x.disposed),'quality switch disposes obsolete per-cell instance buffers');
assert.equal(win.LongHaulEnvironmentTiles.getState().renderer.activeCells,2);
// A distant visual cell is deferred and later planned through the existing
// decoration queue only when it reaches the near scenic radius.
const remote=addEntry('remote',{minX:0,maxX:160,minZ:-1600,maxZ:-1440},true);
drain();assert.equal(remote.environmentTileDeferred,true);
assert.equal(remote.environmentTileState,undefined);
truckPosition.z=-1490;sandbox.updateCloudLayers({position:truckPosition},1000);
assert.equal(remote.environmentTilePending,true);drain();
assert.equal(remote.environmentTileState?.applied,true);
sandbox.releaseCell(remote.patch.cellId);
assert.equal(win.LongHaulEnvironmentTiles.getState().renderer.activeCells,2);
sandbox.releaseCell(root.patch.cellId);sandbox.releaseCell(second.patch.cellId);
assert.equal(win.LongHaulEnvironmentTiles.getState().renderer.activeCells,0);
assert.equal(root.group.children.length,0);
const legacy=addEntry('legacy',{minX:0,maxX:160,minZ:0,maxZ:160});course.generatorVersion='long-haul-endless-v1';
drain();assert.equal(legacy.environmentTileState,undefined);
assert.equal(win.LongHaulEnvironmentTiles.getState().status,'authored');
assert.deepEqual([...win.LongHaulEnvironmentTiles.getState().errors],[]);
console.log(`PASS world streaming: ${ticks} progressive high-quality steps, ${lowTicks} low-quality rebuild steps, 160m owners, 200m templates, lifecycle release, unchanged legacy`);
