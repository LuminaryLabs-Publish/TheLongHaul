import assert from 'node:assert/strict';
import {
  ENDLESS_HIGHWAY_RULES as rules, createEndlessHighway, advanceEndlessHighway,
  endlessHighwayPoint, endlessHighwayProgress, endlessHighwayStation,
  nextEndlessLoadingStation, endlessHorizonBounds, isEndlessLoadingZone
} from '../src/game/endless-highway.mjs';
import { nearestRoad, terrainHeight, roadElevation } from '../src/game/world-base.mjs';
import { roadIndex } from '../src/game/road-spatial-index.mjs';
import { createCourseCellDescriptor } from '../src/game/cell-descriptor.mjs';
import { buildArcadeRoutes } from '../src/game/arcade-encounters.mjs';
import { createPatchWorkerClient } from '../src/game/patch-worker-client.mjs';
import { generateCourse } from '../src/game/generator.mjs';
import { createVehicleCollider, vehicleColliderOverlapsCircle, LONG_HAUL_TRUCK_COLLIDER } from '../src/game/vehicle-collider.mjs';
import { roadsHaveClearance } from '../src/game/road-topology.mjs';
import { pruneLongHaulContactLedger } from '../src/game/bounded-contact-ledger.mjs';
import * as N from '../vendor/nexusengine.mjs';

const course = createEndlessHighway('endless-acceptance');
assert.equal(isEndlessLoadingZone(4062.374),true,'future station protects a garage site before entering the retained road window');
for(let index=0;index<100;index++){
  const station=endlessHighwayStation(course,index);
  assert.equal(isEndlessLoadingZone(station.exclusion.start+1),true);
  assert.equal(isEndlessLoadingZone(station.exclusion.end-1),true);
  assert.equal(isEndlessLoadingZone(station.exclusion.start-1),false);
  assert.equal(isEndlessLoadingZone(station.exclusion.end+1),false);
}
assert.deepEqual(course, createEndlessHighway('endless-acceptance'), 'reproducible initial topology');
assert.equal(course.origin.x, 0);
assert.equal(course.origin.z, 0);
assert.ok(course.depots.length >= 1 && course.depots.length <= 5, 'course-envelope depot metadata remains valid');
const originalEdge = structuredClone(course.edges.find(edge => edge.id === 'endless:highway:1'));
let maxEdges = 0, maxNodes = 0, maxStations = 0, windows = 0, lastIndex = roadIndex(course);
for (let progress = 0; progress <= 102400; progress += 137) {
  const point = endlessHighwayPoint(course, progress);
  assert.equal(endlessHighwayProgress(course, point), progress, 'lateral motion does not count as forward route progress');
  const before = terrainHeight(course, point.x, point.z);
  const change = advanceEndlessHighway(course, point);
  const after = terrainHeight(course, point.x, point.z);
  assert.equal(before, after, 'window pruning cannot change the current drive surface');
  const road = nearestRoad(course, point);
  assert.ok(road && road.distance < 0.25, 'continuous road exists over 100 km of generated travel');
  assert.ok(course.endless.windowEnd - progress >= rules.sectionsAhead * rules.sectionLength, 'future topology exists well beyond rendered cells');
  assert.ok(progress - course.endless.windowStart >= rules.sectionsBehind * rules.sectionLength, 'retirement stays behind the visible world');
  if (change.changed) {
    windows++;
    const index = roadIndex(course);
    assert.notEqual(index, lastIndex, 'replaced topology invalidates the spatial index');
    lastIndex = index;
  }
  maxEdges = Math.max(maxEdges, course.edges.length);
  maxNodes = Math.max(maxNodes, course.nodes.length);
  maxStations = Math.max(maxStations, course.loadingStations.length);
  const nodes = new Set(course.nodes.map(node => node.id));
  for (const edge of course.edges) {
    assert.ok(nodes.has(edge.from) && nodes.has(edge.to), 'retained edges never reference pruned nodes');
    assert.ok(edge.samples.every(point => Number.isFinite(point.x + point.z)), 'finite drive geometry');
  }
}
assert.ok(windows > 300, 'test crosses hundreds of actual generated boundaries');
assert.ok(maxEdges <= 20 && maxNodes === 13 && maxStations <= 4, 'topology storage remains constant with journey length');
assert.ok(course.endless.maximumProgress >= 102000, 'forward high-water mark retained');
const maximum = course.endless.maximumProgress;
advanceEndlessHighway(course, 450);
assert.equal(course.endless.maximumProgress, maximum, 'backtracking does not reset difficulty or reward high-water mark');
assert.deepEqual(course.edges.find(edge => edge.id === originalEdge.id), originalEdge, 'retired road reconstructs exactly');
advanceEndlessHighway(course, -4000);
assert.ok(nearestRoad(course, endlessHighwayPoint(course, -4000)).distance < 0.1, 'reverse travel also regenerates highway');
assert.equal(course.endless.maximumProgress, maximum);

// Reload must prime terrain around the saved truck even after reversing beyond
// the original road window. Reverse position never earns forward progress.
const reverseResume = createEndlessHighway('reverse-resume', { progress: -2000 });
const reversePoint = endlessHighwayPoint(reverseResume, -2000);
assert.ok(nearestRoad(reverseResume, reversePoint).distance < 0.1, 'saved reverse position has road before terrain preparation');
assert.equal(reverseResume.endless.maximumProgress, 0);
assert.equal(reverseResume.endless.furthestProgress, 0);
const reverseDriven = createEndlessHighway('reverse-resume');
advanceEndlessHighway(reverseDriven, -2000);
const reverseX = Math.floor(reversePoint.x / 160), reverseZ = Math.floor(reversePoint.z / 160);
const reverseCell = { id: `${reverseX}:${reverseZ}`, coordinates: [reverseX, reverseZ], bounds: { minX: reverseX * 160, maxX: (reverseX + 1) * 160, minZ: reverseZ * 160, maxZ: (reverseZ + 1) * 160 } };
assert.deepEqual(createCourseCellDescriptor(reverseResume, reverseCell, { terrainSegments: 8 }), createCourseCellDescriptor(reverseDriven, reverseCell, { terrainSegments: 8 }), 'resumed road and rendered patch match continuously driven reverse terrain');

for (const seed of ['north', 'sand', 'ridge', 'rain', 'wide', 'freight', '11', '23']) {
  const value = createEndlessHighway(seed, { progress: 33000 });
  assert.deepEqual(value.edges, createEndlessHighway(seed, { progress: 33000 }).edges, 'distant load needs no retained historical graph');
  const trunk = value.edges.filter(edge => !edge.optional);
  const network = buildArcadeRoutes(value);
  assert.equal(network.paths[0].segments.length, 12, 'main highway remains one connected traffic path');
  for (let index = 1; index < trunk.length; index++) {
    const left = trunk[index - 1], right = trunk[index];
    assert.equal(left.to, right.from);
    assert.deepEqual(left.samples.at(-1), right.samples[0], 'adjacent section endpoints exactly agree');
    const point = left.samples.at(-1);
    const a = roadElevation(value, { ...point, edge: left, segmentIndex: left.samples.length - 2, t: 1 });
    const b = roadElevation(value, { ...point, edge: right, segmentIndex: 0, t: 0 });
    assert.equal(a, b, 'no section-local road-height discontinuity');
  }
  for (const station of value.loadingStations) {
    assert.ok(station.safe.routeLength > station.risky.routeLength + 8, 'express cut is an actual shorter route');
    assert.ok(station.safe.width >= 24, 'heavy vehicles retain a wide fallback');
    assert.ok(station.risky.clearance.width > 3.25 + 2, 'express route remains truck-passable');
    assert.ok(Math.hypot(station.safe.point.x - station.risky.point.x, station.safe.point.z - station.risky.point.z) > 40, 'pickup zones are spatially distinct');
    const safe = nearestRoad(value, station.safe.point), risky = nearestRoad(value, station.risky.point);
    assert.equal(safe.edge.id, station.safe.edgeIds[0]);
    assert.equal(risky.edge.id, station.risky.edgeIds[0]);
    assert.ok(safe.distance < 0.001 && risky.distance < 0.001, 'pickup triggers sit on drivable geometry');
    assert.ok(station.exclusion.start < station.entryProgress && station.exclusion.end > station.exitProgress, 'encounters can reserve the complete loading maneuver');
    assert.deepEqual(endlessHighwayStation(value, station.index), station, 'assignment lookup matches streamed station descriptors');
  }
  const station = nextEndlessLoadingStation(value, 33000, 220);
  assert.ok(station.entryProgress >= 33220, 'replacement station leaves a readable approach before the fork');
}

const samplingCourse = createEndlessHighway('patch-continuity', { progress: 3200 });
const point = endlessHighwayPoint(samplingCourse, 3200);
const cx = Math.floor(point.x / 160), cz = Math.floor(point.z / 160);
const cell = { id: `${cx}:${cz}`, coordinates: [cx, cz], bounds: { minX: cx * 160, maxX: (cx + 1) * 160, minZ: cz * 160, maxZ: (cz + 1) * 160 } };
const patchBefore = createCourseCellDescriptor(samplingCourse, cell, { terrainSegments: 8 });
advanceEndlessHighway(samplingCourse, 3520);
const patchAfter = createCourseCellDescriptor(samplingCourse, cell, { terrainSegments: 8 });
assert.deepEqual(patchBefore, patchAfter, 'already visible patch content stays stable when the window advances');

const originalHorizon = endlessHorizonBounds({ x: 0, z: 0 });
assert.deepEqual(originalHorizon, { minX: -24576, maxX: 24576, minZ: -24576, maxZ: 24576 });
assert.deepEqual(endlessHorizonBounds({ x: 123, z: -18000 }), originalHorizon, 'nearby driving does not thrash the horizon root');
assert.notDeepEqual(endlessHorizonBounds({ x: 123, z: -19000 }), originalHorizon, 'horizon moves before the old world edge');
for (let index = -50; index <= 50; index++) {
  const position = { x: index * 4319, z: index * 21670 }, bounds = endlessHorizonBounds(position);
  assert.equal(bounds.maxX - bounds.minX, 49152, 'distant extent remains bounded');
  assert.equal(bounds.maxZ - bounds.minZ, 49152);
  assert.ok(position.x - bounds.minX >= 6144 && bounds.maxX - position.x >= 6144);
  assert.ok(position.z - bounds.minZ >= 6144 && bounds.maxZ - position.z >= 6144, 'horizon always covers visible terrain beyond a million metres');
}

// Preserve the finite procedural mode's optional bypass and roundabout. This
// uses the shipped engine random service, not a second generator implementation.
const generationEngine = N.createEngine({ kits: [N.createCoreDataKit({ random: { seed: 'finite-topology-audit', maxStreams: 64 } })] });
for (let index = 0; index < 24; index++) {
  const finite = generateCourse(generationEngine, `finite-after-endless-${index}`, index % 2 ? { maxAttempts: 1 } : {});
  assert.equal(finite.validation.valid, true);
  assert.equal(finite.endless, undefined);
  const bypass = finite.optionalRoads[0], roundabout = finite.roundabouts[0];
  const entry = finite.edges.find(edge => edge.id === bypass.entryEdgeId), exit = finite.edges.find(edge => edge.id === bypass.exitEdgeId);
  assert.ok(entry && exit && finite.nodes.some(node => node.id === entry.from) && finite.nodes.some(node => node.id === exit.to));
  const ring = finite.edges.filter(edge => edge.type === 'roundabout');
  assert.equal(ring.length, 8);
  const radius = roundabout.radius - Math.max(10 * 0.55 + 1.4, 10 * 0.5) - 1.6;
  for (const edge of ring) for (let sample = 1; sample < edge.samples.length; sample++) {
    const a = edge.samples[sample - 1], b = edge.samples[sample], position = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    assert.equal(vehicleColliderOverlapsCircle(createVehicleCollider(position, heading, LONG_HAUL_TRUCK_COLLIDER), roundabout.center.x, roundabout.center.z, radius), false, 'full truck footprint clears the ring island');
    assert.ok(nearestRoad(finite, position).distance < 0.001, 'ring road sampling follows the rendered chord');
  }
  const bypassEdges = finite.edges.filter(edge => edge.branchId === bypass.id);
  for (const edge of bypassEdges) for (const other of finite.edges) {
    if (other.branchId === bypass.id || [edge.from, edge.to].some(id => id === other.from || id === other.to)) continue;
    assert.ok(roadsHaveClearance(edge, other), 'bypass width does not intrude into unrelated highway or destination roads');
  }
}

const ledgerEngine = N.createEngine({ kits: [N.createCoreTransactionLedgerKit()] });
const ledger = ledgerEngine.n.coreTransactionLedger;
ledger.applyOnce('long-haul:continuous', 'truck-tip', () => ({ penalty: 15 }));
ledger.applyOnce('long-haul:continuous', 'obstacle:active:1', () => ({ penalty: 8 }));
ledger.applyOnce('long-haul:campaign', 'delivery:complete', () => ({ cash: 1000 }));
for (let index = 0; index < 2000; index++) ledger.applyOnce('long-haul:continuous', `off-road:${index}`, () => ({ penalty: 8 }));
const pruned = pruneLongHaulContactLedger(ledgerEngine, 'continuous', { limit: 256, activeContacts: ['obstacle:active'] });
assert.equal(pruned.retained, 256);
assert.equal(pruned.pruned, 1746);
assert.equal(ledger.has('long-haul:continuous', 'truck-tip'), true, 'pruning does not charge an existing rollover again');
assert.equal(ledger.has('long-haul:continuous', 'obstacle:active:1'), true, 'latest operation of current contact is retained');
assert.equal(ledger.has('long-haul:continuous', 'off-road:1999'), true);
assert.equal(ledger.has('long-haul:continuous', 'off-road:0'), false);
assert.equal(ledger.has('long-haul:campaign', 'delivery:complete'), true, 'finite payout ledger remains untouched');
assert.equal(ledger.applyOnce('long-haul:continuous', 'truck-tip', () => { throw new Error('duplicate tip applied'); }).duplicate, true);
assert.equal(pruneLongHaulContactLedger(ledgerEngine, 'continuous').pruned, 0, 'bounded history update is idempotent');

// Existing worker ownership remains one worker per run. Updating its source
// course must not retire valid requests or leak a worker at every section.
const OriginalWorker = globalThis.Worker;
const instances = [];
class FakeWorker {
  constructor() { this.messages = []; instances.push(this); }
  postMessage(message) { this.messages.push(message); if (message.id) queueMicrotask(() => this.onmessage({ data: { id: message.id, patch: { cellId: message.cell.id } } })); }
  terminate() { this.terminated = true; }
}
try {
  globalThis.Worker = FakeWorker;
  const client = createPatchWorkerClient(createEndlessHighway('worker'));
  assert.equal(client.updateCourse(samplingCourse), true);
  assert.equal(instances.length, 1);
  assert.equal(instances[0].messages[1].type, 'update-course');
  assert.equal(instances[0].messages[1].course, samplingCourse);
  assert.deepEqual(await client.prepare(cell), { cellId: cell.id });
  assert.equal(client.getState().pending, 0);
  client.dispose();
  assert.equal(client.updateCourse(course), false);
  assert.ok(instances[0].terminated);
} finally {
  if (OriginalWorker === undefined) delete globalThis.Worker;
  else globalThis.Worker = OriginalWorker;
}

console.log(`Endless topology, surface/worker continuity, 24 finite bypass seeds, horizon recentering and 2,002-contact ledger retention passed (${windows} windows; max ${maxEdges} edges, ${maxNodes} nodes, ${maxStations} stations).`);
