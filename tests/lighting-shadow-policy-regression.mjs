import assert from 'node:assert/strict';
import {LIGHTING_SOURCE, LIGHTING_SHADOW_PRESETS, lightingPreset, shadowAnchor, shouldRefresh, selectClosest, profileSummary} from '../src/game/lighting-shadow-policy.mjs';
assert.equal(LIGHTING_SOURCE.engine,'unchanged');
for(const quality of [true,false]) {
  const p=lightingPreset(quality),s=profileSummary(quality);
  assert.ok(p.mapSize<=1024&&p.mapSize>=512);
  assert.ok(p.trafficVehicles<=3&&p.heroCasters<=18&&p.staticCasters<=16&&p.treeCasters<=2);
  assert.ok(s.casterCap<=54&&s.occlusionCap<=46);
  const a=shadowAnchor({heading:Math.PI/2,position:{x:42.1,y:0.9,z:12}},p);
  assert.ok(Math.abs(a.x-54.1)<=p.texelSnap);
  assert.ok(Math.abs(a.z-12)<=p.texelSnap);
  assert.equal(shouldRefresh(0,10,a,a,p),false);
  assert.equal(shouldRefresh(0,100,a,a,p),true);
  assert.equal(shouldRefresh(-Infinity,0,null,a,p),true);
  assert.equal(shouldRefresh(0,1,a,{...a,x:a.x+6},p),true);
  assert.deepEqual(selectClosest([{position:{x:9,z:0},id:'9'},{position:{x:1,z:0},id:'1'},{position:{x:200,z:0},id:'far'}],{x:0,z:0},10,2).map(x=>x.id),['1','9']);
}
assert.notEqual(LIGHTING_SHADOW_PRESETS.high.mapSize,LIGHTING_SHADOW_PRESETS.low.mapSize);
console.log('PASS lighting/shadow budgets: 1 moving sun map, bounded casters and contact decals, 24/15 Hz, deterministic snap and selection');
