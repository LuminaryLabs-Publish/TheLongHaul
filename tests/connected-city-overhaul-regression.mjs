import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createEndlessHighway,advanceEndlessHighway} from '../src/game/endless-highway.mjs';
import {createPlayableRoadV3Course} from '../src/game/road-v3-playable-course.mjs';
import {connectedTownReachability,CITY_DISTRICT_OFFSET_METERS} from '../src/game/connected-settlements.mjs';
let remote=0,maxOffset=0;
for(let i=0;i<24;i++){
  const seed='extended-settlement-'+i,course=createEndlessHighway(seed,{progress:6400});
  assert.ok(connectedTownReachability(course));
  for(const town of course.towns){
    assert.equal(town.parcels.length,17);
    if(!town.outerDistrictId)continue;
    remote++;
    assert.equal(town.outlyingParcels.length,13);
    assert.equal(town.trees.length,30);
    assert.equal(town.roadIds.length,8);
    const branch=course.branches.find(b=>b.id===town.outerDistrictId);
    assert.ok(branch&&branch.edgeIds.length===4&&branch.nodeIds.length===5);
    const roads=branch.edgeIds.map(id=>course.edges.find(e=>e.id===id));
    assert.ok(roads.every(Boolean));
    assert.ok(roads.every(e=>e.optional&&e.samples.length===41));
    const p=roads[0].samples[0],q=roads[1].samples.at(-1);
    maxOffset=Math.max(maxOffset,Math.hypot(q.x-p.x,q.z-p.z));
    for(const b of town.outlyingParcels){
      const road=roads.find(e=>e.id===b.roadEdgeId);
      assert.ok(road);
      assert.equal(b.zone,road.districtZone);
      assert.ok(b.progress>=road.startProgress+16&&b.progress<=road.endProgress-16);
    }
  }
  const snapshot=JSON.stringify(course.towns);
  advanceEndlessHighway(course,9000);advanceEndlessHighway(course,6400);
  assert.equal(JSON.stringify(course.towns),snapshot);
}
assert.ok(remote>0&&maxOffset>500&&CITY_DISTRICT_OFFSET_METERS>=700);
const v3=createPlayableRoadV3Course('haul-winding-outer-city',{progress:6400});
assert.ok(connectedTownReachability(v3));
for(const town of v3.towns)if(town.outerDistrictId){
  assert.equal(town.outlyingParcels.length,13);assert.equal(town.trees.length,30);
}
const host=readFileSync(new URL('../src/app/connected-town-host.js',import.meta.url),'utf8');
assert.match(host,/HERO_BUILDINGS/);assert.match(host,/LH_TOWN_MAPLE/);
console.log(JSON.stringify({result:'PASS',remote,maxOffset,visualVerified:false}));
