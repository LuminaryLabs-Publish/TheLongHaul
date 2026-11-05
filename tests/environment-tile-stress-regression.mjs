import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {environmentTileIdentity,planEnvironmentCell,planEnvironmentTile,environmentCellPlanSteps} from '../src/game/environment-tile-planner.mjs';
import {ENVIRONMENT_TILE_CATALOG,ENV_TILE_VARIANTS} from '../src/game/environment-tile-catalog.mjs';
const start=performance.now();
const seeds=['fh-portal','long-haul-release','highway-seed-31'];
let tiles=0,objects=0,marks=0;
for(const seed of seeds){
 const groups=new Map();
 for(let i=-150;i<350;i++){
  const id=environmentTileIdentity(seed,i);
  const district=Math.floor(i/100),set=groups.get(district)??new Set();set.add(id.catalogId);groups.set(district,set);
  assert.equal(id.length,200);assert.equal(id.start,i*200);assert.equal(id.end,(i+1)*200);
  const plan=planEnvironmentTile(seed,i,{terrainHeight:(x,z)=>Math.sin(x/300)*2+Math.cos(z/240)});
  tiles++;objects+=plan.props.length;marks+=plan.onRoad.length;
  assert.ok(plan.props.length>0);assert.ok(plan.props.length<=32);
  assert.ok(plan.onRoad.length<=6);
  assert.ok(plan.props.every(p=>p.progress>=id.start&&p.progress<id.end));
 }
 for(const [district,set] of groups){if(district<0||district>=3)continue;
  assert.equal(set.size,100,`seed ${seed} district ${district} must contain all 100 designs`);}
}
assert.equal(ENVIRONMENT_TILE_CATALOG.length*ENV_TILE_VARIANTS.length,400);
// No geometry or contact writes, negative positions, partial-cell overlap
// and both complete and incremental planners agree under seeded height rules.
for(let z=-1200;z<=1200;z+=160){
 const bounds={minX:-160,maxX:0,minZ:z,maxZ:z+160};
 const options={quality:z%320===0,terrainHeight:(x,p)=>.002*x+.003*p,
   roadSafety:(x,p,margin)=>Math.abs(x)>margin};
 const normal=planEnvironmentCell('stress',bounds,options),steps=environmentCellPlanSteps('stress',bounds,options);
 let stage,checks=0;do{stage=steps.next();checks++;}while(!stage.done);
 assert.ok(checks<=5,'each World cell intersects at most a few 200 m tiles');
 assert.deepEqual(normal,stage.value);
 assert.ok(normal.objects.every(obj=>obj.position.x>=bounds.minX&&obj.position.x<bounds.maxX));
 assert.equal(normal.collisionWrites,0);assert.equal(normal.roadGeometryWrites,0);
}
console.log(`PASS 1,500 seeded 200m tile runs, ${objects} authored prop placements, ${marks} safe road treatments, unique 100-family districts; ${(performance.now()-start).toFixed(1)}ms fixture`);
