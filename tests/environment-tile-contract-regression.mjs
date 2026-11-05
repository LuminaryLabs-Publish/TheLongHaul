import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ENVIRONMENT_TILE_CATALOG,ENVIRONMENT_TILE_BY_ID,ENV_TILE_VARIANTS,ENV_TILE_METERS,ENV_CELL_METERS} from '../src/game/environment-tile-catalog.mjs';
import {environmentTileIdentity,planEnvironmentTile,planEnvironmentCell,ENVIRONMENT_TILE_STREAMING} from '../src/game/environment-tile-planner.mjs';
import {authorEnvironmentTile,authoredEnvironmentObject,ENVIRONMENT_AUTHORING_SOURCE} from '../src/game/environment-tile-authoring.mjs';

assert.equal(ENV_TILE_METERS,200);assert.equal(ENV_CELL_METERS,160);
assert.equal(ENVIRONMENT_TILE_CATALOG.length,100);
assert.equal(ENVIRONMENT_TILE_BY_ID.size,100);
assert.equal(new Set(ENVIRONMENT_TILE_CATALOG.map(t=>t.name)).size,100);
assert.equal(new Set(ENVIRONMENT_TILE_CATALOG.map(t=>t.id)).size,100);
assert.equal(ENV_TILE_VARIANTS.length,4);
const pack=JSON.parse(await readFile(new URL('../manifests/environment-tiles-authoring.json',import.meta.url),'utf8'));
assert.equal(pack.authoredVariants,400);
assert.equal(pack.assemblies.length,400);
assert.equal(new Set(pack.assemblies.map(x=>x.id)).size,400);
for(const template of ENVIRONMENT_TILE_CATALOG){
 assert.equal(template.length,200);assert.equal(template.variants.length,4);
 for(const v of ENV_TILE_VARIANTS){
  const a=authorEnvironmentTile(template.id,v.id);
  assert.ok(pack.assemblies.some(x=>x.id===a.id));
  assert.equal(a.interfaces.occupancy,'existing-160m-cell-by-anchor');
  assert.equal(a.interfaces.onRoad,'paint-only');
 }
}
assert.equal(ENVIRONMENT_AUTHORING_SOURCE.authoringStatus,'native-project-export-not-yet-verified');
assert.equal(ENVIRONMENT_TILE_STREAMING.collisionWrites,0);
for(const seed of ['tile-world-a','tile-world-b']){
 const ids=Array.from({length:100},(_,i)=>environmentTileIdentity(seed,i));
 assert.equal(new Set(ids.map(x=>x.catalogId)).size,100,'each 20km district contains all 100 authored template identities');
 assert.deepEqual(ids,Array.from({length:100},(_,i)=>environmentTileIdentity(seed,i)));
 for(const index of [-105,-1,0,1,100,154]){
  const tile=planEnvironmentTile(seed,index,{terrainHeight:(x,z)=>.03*x-.01*z});
  assert.equal(tile.start,index*200);assert.equal(tile.end,(index+1)*200);
  assert.ok(tile.props.length>8&&tile.props.length<=48);
  assert.ok(tile.onRoad.length<=6);
  assert.equal(tile.authoring,'portable-recipe; native project not yet exported');
  for(const obj of [...tile.props,...tile.onRoad]){
   assert.ok(obj.progress>tile.start&&obj.progress<tile.end,'prop remains within 200m section');
   assert.ok([obj.position.x,obj.position.y,obj.position.z,obj.scale,obj.heading].every(Number.isFinite));
   assert.equal(obj.catalogId,tile.catalogId);assert.equal(obj.variantId,tile.variant.id);
   const near=authoredEnvironmentObject(obj,{lod:'near'});
   const far=authoredEnvironmentObject(obj,{lod:'far'});
   assert.ok(near.parts.length>0&&far.parts.length>0);
   assert.ok(near.parts.length>=far.parts.length);
   if(obj.role==='on-road-paint')assert.ok(near.parts.every(p=>!p.cast&&p.transparent),'on-road is visual ink only');
   else assert.ok(Math.abs(obj.lateral)>=24,'roadside objects clear canonical lane');
   for(const part of near.parts)assert.ok([...part.position,...part.scale,...part.rotation].every(Number.isFinite));
  }
 }
}
// The same prop is owned by exactly one existing 160m cell, including across
// road-tile boundaries at 200m and visual loading boundaries at 160m.
const seen=new Map(),seed='test-boundary-ownership';
for(let z=-7;z<=2;z++)for(let x=-2;x<=2;x++){
 const bounds={minX:x*160,maxX:(x+1)*160,minZ:z*160,maxZ:(z+1)*160};
 const plan=planEnvironmentCell(seed,bounds,{terrainHeight:()=>0});
 assert.equal(plan.existingCellBounds.minZ,bounds.minZ);
 assert.equal(plan.roadGeometryWrites,0);assert.equal(plan.collisionWrites,0);
 for(const obj of plan.objects){
  assert.ok(obj.position.x>=bounds.minX&&obj.position.x<bounds.maxX);
  assert.ok(obj.position.z>=bounds.minZ&&obj.position.z<bounds.maxZ);
  seen.set(obj.id,(seen.get(obj.id)||0)+1);
 }
}
assert.ok(seen.size>30);
assert.ok([...seen.values()].every(n=>n===1),'no duplicated objects across adjacent 160m streaming cells');
console.log('PASS 100 environment templates, 400 editable assembly descriptors, 200m/160m ownership, road safety, variants and deterministic seeded reconstruction');
