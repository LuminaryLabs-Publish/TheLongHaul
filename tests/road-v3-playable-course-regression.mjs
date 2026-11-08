import assert from 'node:assert/strict';
import {createPlayableRoadV3Course,advancePlayableRoadV3Course,playableRoadV3Point,playableRoadV3Progress} from '../src/game/road-v3-playable-course.mjs';
import {createEndlessHighway} from '../src/game/endless-highway.mjs';
import {ROAD_V3_VERSION} from '../src/game/road-v3-geometry.mjs';
import {nearestRoad,terrainHeight,roadV3GroundContact} from '../src/game/world-base.mjs';
import {createCourseCellDescriptor} from '../src/game/cell-descriptor.mjs';
import {createFreightJourney,freightGateCrossing} from '../src/game/freight-journey.mjs';
import {buildArcadeRoutes,arcadePathPoint,arcadeRoadProgress} from '../src/game/arcade-encounters.mjs';

const near=(a,b,tol=1)=>assert.ok(Math.abs(a-b)<=tol,`${a} ≠ ${b} (limit ${tol})`);
for(let n=0;n<12;n++){
  const seed=`v3-playable:${n}`;
  const v2=createEndlessHighway(seed),v3=createPlayableRoadV3Course(seed);
  assert.equal(v3.generatorVersion,ROAD_V3_VERSION);
  assert.equal(v3.terrainAware,true);
  assert.equal(v3.endless.schema,v2.endless.schema);
  assert.deepEqual(v3.edges.slice(0,v2.edges.length).map(e=>e.id),v2.edges.map(e=>e.id));
  assert.deepEqual(v3.edges.slice(0,v2.edges.length).map(e=>e.type),v2.edges.map(e=>e.type));
  assert.deepEqual(v3.routeChoices.slice(0,v2.routeChoices.length),v2.routeChoices);
  assert.deepEqual(v3.branches.slice(0,v2.branches.length).map(b=>b.id),v2.branches.map(b=>b.id));
  assert.deepEqual(v3.loadingStations.map(s=>s.id),v2.loadingStations.map(s=>s.id));
  for(let s=0;s<=1600;s+=80){
    const p=playableRoadV3Point(v3,s,0);
    assert.ok(p&&Number.isFinite(p.x+p.y+p.z+p.heading));
    const hit=nearestRoad(v3,{...p,progressHint:s});
    assert.ok(hit,`near road at ${s}`);
    near(hit.progress,s,2);
    near(playableRoadV3Progress(v3,p,s),s,2);
    const contact=roadV3GroundContact(v3,p);
    assert.ok(contact&&Number.isFinite(contact.height)&&contact.normal.y>.85,'V3 source provides a road-surface normal');
    near(contact.height,p.y,.2);
    const h=terrainHeight(v3,p.x,p.z);
    assert.ok(Number.isFinite(h));
    if(hit.edge?.samples?.length)assert.ok(hit.edge.width>0);
  }
  assert.ok(v3.roundabouts.length>=1,'V3 presents a physical roundabout side road');
  for(const r of v3.roundabouts){
    const edges=v3.edges.filter(e=>e.id.startsWith(r.id+':'));
    assert.equal(edges.length,4);
    assert.ok(edges.every(e=>e.samples.length>2));
    assert.ok(edges.some(e=>e.type==='roundabout'));
    assert.ok(v3.optionalRoads.some(e=>e.roundaboutId===r.id));
    assert.ok(v3.routeChoices.some(e=>e.kind==='roundabout'&&e.id.startsWith(r.id)));
    assert.ok(edges[1].samples[0].x===edges[0].samples.at(-1).x);
    assert.ok(edges[2].samples[0].z===edges[1].samples.at(-1).z);
    // The roundabout is actual road-cell and collider data: center island and
    // entry yield marks must be materialized in the owning world cells.
    const cx=Math.floor(r.center.x/160),cz=Math.floor(r.center.z/160);
    const cell={id:`island:${cx}:${cz}`,coordinates:[cx,cz],
      bounds:{minX:cx*160,maxX:(cx+1)*160,minZ:cz*160,maxZ:(cz+1)*160}};
    const islandPatch=createCourseCellDescriptor(v3,cell,{terrainSegments:8});
    assert.ok(islandPatch.roundabouts.some(x=>x.id===r.id&&x.island&&x.island.radius>0),
      'physical roundabout island is in its owning cell');
    const yieldCells=new Set(r.approaches.filter(a=>a.yield).map(a=>`${Math.floor(a.node.x/160)}:${Math.floor(a.node.z/160)}`));
    assert.ok(yieldCells.size,'roundabout has a yield approach');
    for(const coord of yieldCells){
      const [ix,iz]=coord.split(':').map(Number);
      let found=false;
      for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
        const cell={id:`yield:${ix+dx}:${iz+dz}`,coordinates:[ix+dx,iz+dz],
          bounds:{minX:(ix+dx)*160,maxX:(ix+dx+1)*160,minZ:(iz+dz)*160,maxZ:(iz+dz+1)*160}};
        const patch=createCourseCellDescriptor(v3,cell,{terrainSegments:8});
        found ||= patch.roundabouts.some(x=>x.id===r.id&&x.yields.length>0);
      }
      assert.ok(found,'roundabout yield marking is materialized in a neighboring cell');
    }
  }
  const route=buildArcadeRoutes(v3);
  for(const roundabout of v3.roundabouts){
    const trafficPath=route.paths.find(path=>path.segments.some(part=>part.edge.id===`${roundabout.id}:ring-a`));
    assert.ok(trafficPath,'traffic network includes the drivable roundabout bypass');
    assert.ok(trafficPath.segments.some(part=>part.edge.id===`${roundabout.id}:approach`));
    assert.ok(trafficPath.segments.some(part=>part.edge.id===`${roundabout.id}:exit`));
    assert.ok(!trafficPath.segments.some(part=>part.edge.id===`${roundabout.id}:ring-b`),
      'traffic has a deterministic through-route, not an unbounded ring cycle');
    for(const part of trafficPath.segments){
      const point=arcadePathPoint(trafficPath,(part.start+part.end)/2,1);
      assert.ok(Number.isFinite(point.x+point.y+point.z+point.grade+point.bank));
    }
  }
  const p=playableRoadV3Point(v3,460);
  assert.ok(arcadeRoadProgress(nearestRoad(v3,p),route));
  const freight=createFreightJourney({seed,sessionId:`road-v3-session-${n}`,generatorVersion:ROAD_V3_VERSION,roadGraph:()=>v3});
  assert.ok(freight.snapshot().contract);
  const station=v3.loadingStations.find(s=>s.index===0);
  assert.ok(station&&Number.isFinite(station.safe.point.y));
  const pickup=freight.getState().pickupStation;
  assert.deepEqual(pickup.safe,station.safe,'freight uses real V3 safe loading road');
  assert.deepEqual(pickup.risky,station.risky,'freight uses actual V3 express branch');
  assert.ok(Math.hypot(pickup.safe.point.x-pickup.risky.point.x,
    pickup.safe.point.z-pickup.risky.point.z)>20,'freight gates remain separate physical routes');
  assert.ok(v3.edges.some(e=>pickup.risky.edgeIds.includes(e.id)),
    'risky pickup gate belongs to an actual V3 side-road edge');
  for(const route of ['safe','risky']) {
    const gate=pickup[route],point=gate.point,forward={x:Math.sin(point.heading),z:Math.cos(point.heading)};
    const before={x:point.x-forward.x*3,z:point.z-forward.z*3};
    const after={x:point.x+forward.x*3,z:point.z+forward.z*3};
    assert.equal(freightGateCrossing(before,after,gate,
      {speed:25,heading:point.heading,dt:0.12,grounded:true}),true,
      `${route} physical V3 pickup is enterable through its visible gate`);
    assert.equal(freightGateCrossing(after,before,gate,
      {speed:25,heading:point.heading,dt:0.12,grounded:true}),false,
      `${route} pickup rejects reverse travel`);
  }
  const cx=Math.floor(p.x/160),cz=Math.floor(p.z/160);
  const cell={id:`test:${cx}:${cz}`,coordinates:[cx,cz],bounds:{minX:cx*160,maxX:(cx+1)*160,minZ:cz*160,maxZ:(cz+1)*160}};
  const patch=createCourseCellDescriptor(v3,cell,{terrainSegments:8});
  assert.ok(patch.roads.length>0);
  assert.ok(patch.terrain.heights.every(Number.isFinite));
  // Advancing replaces the materialized window while preserving deterministic
  // terrain and source routes; backwards travel recreates the original area.
  const before=playableRoadV3Point(v3,600);
  const changed=advancePlayableRoadV3Course(v3,3500);
  assert.equal(changed.changed,true);
  assert.ok(v3.endless.windowStart>0);
  advancePlayableRoadV3Course(v3,600);
  assert.deepEqual(playableRoadV3Point(v3,600),before);
  const saved=freight.snapshot();
  assert.doesNotThrow(()=>createFreightJourney({seed,sessionId:`road-v3-session-${n}`,generatorVersion:ROAD_V3_VERSION,roadGraph:()=>v3,snapshot:saved}));
  assert.equal(createEndlessHighway(seed).generatorVersion,'long-haul-endless-v2');
  assert.equal(roadV3GroundContact(v2,playableRoadV3Point(v3,0)),null,'legacy truck contact logic remains unchanged');
}
console.log('PASS playable V3 course adapter: 12 seeded networks, lanes, traffic paths, freight, cells, return determinism, V2 parity');
