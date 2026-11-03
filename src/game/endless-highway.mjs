// Product-owned, deterministic highway topology. World and rendering kits still
// own patch realization; this module only retains the nearby drivable corridor.
import { hashText, edgeLength } from './shared.mjs';
import { ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION, ROAD_LIMITS, roadChunkAt, roadChunkSample, roadChunkContract } from './road-chunks.mjs';
const roadVersion = value => typeof value === 'object' ? value.generatorVersion ?? ROAD_GENERATOR_VERSION : ROAD_GENERATOR_VERSION;
const modular = value => roadVersion(value) === ROAD_GENERATOR_VERSION;

export const ENDLESS_HIGHWAY_RULES = Object.freeze({
  sectionLength: 320,
  sectionsBehind: 4,
  sectionsAhead: 7,
  sampleSpacing: 10,
  stationSpacing: 960,
  firstStationProgress: 480,
  stationHalfSpan: 160,
  safeWidth: 28,
  riskyWidth: 10,
  safeDetour: 44
});

const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nodeId = index => index === 0 ? 'origin' : `endless:node:${index}`;
const edgeId = index => `endless:highway:${index}`;
const stationId = index => `endless:station:${index}`;

function baseX(seed, progress) {
  const phase = (hashText(`${seed}:highway-bend`) % 6283) / 1000;
  const second = (hashText(`${seed}:highway-detail`) % 6283) / 1000;
  // No accumulated coordinates or stateful RNG: any distant section can be
  // rebuilt exactly after pruning or reload. Z remains strictly monotonic.
  return 34 * (Math.sin(progress / 1050 + phase) - Math.sin(phase))
    + 18 * (Math.sin(progress / 440 + second) - Math.sin(second));
}

function stationIndexAtProgress(progress) {
  const r = ENDLESS_HIGHWAY_RULES;
  const index = Math.round((progress - r.firstStationProgress) / r.stationSpacing);
  return index >= 0 && Math.abs(progress - (r.firstStationProgress + index * r.stationSpacing)) <= r.stationHalfSpan ? index : -1;
}

function centerX(seed, progress, route = 'safe') {
  const index = stationIndexAtProgress(progress);
  let x = baseX(seed, progress);
  if (index >= 0 && route !== 'risky') {
    const center = ENDLESS_HIGHWAY_RULES.firstStationProgress + index * ENDLESS_HIGHWAY_RULES.stationSpacing;
    const t = (progress - center + ENDLESS_HIGHWAY_RULES.stationHalfSpan) / (ENDLESS_HIGHWAY_RULES.stationHalfSpan * 2);
    x -= ENDLESS_HIGHWAY_RULES.safeDetour * Math.sin(Math.PI * t) ** 2;
  }
  return x;
}

/** World position and forward heading at an absolute highway metre. */
export function endlessHighwayPoint(courseOrSeed, progress, lateral = 0, route = 'safe') {
  const seed = typeof courseOrSeed === 'object' ? courseOrSeed.seed : String(courseOrSeed ?? 'long-haul');
  const s = number(progress);
  if (modular(courseOrSeed)) {
    const p = roadChunkSample(seed, s, route), offset = number(lateral);
    return { ...p, x: p.x + p.nx * offset, y: p.y + p.bank * offset, z: (p.z + p.nz * offset) || 0 };
  }
  const x = centerX(seed, s, route), z = -s;
  const dx = centerX(seed, s + 0.25, route) - centerX(seed, s - 0.25, route);
  const heading = Math.atan2(dx, -0.5), offset = number(lateral);
  return { x: x + Math.cos(heading) * offset, z: z - Math.sin(heading) * offset, heading, progress: s };
}

/** Exact forward progress for both branches; lateral travel cannot add metres. */
export function endlessHighwayProgress(course, position) {
  if (!course?.endless || !Number.isFinite(Number(position?.z))) return 0;
  return -Number(position.z) || 0;
}

function makeEdge(courseOrSeed, index, route = 'safe') {
  const seed = typeof courseOrSeed === 'object' ? courseOrSeed.seed : String(courseOrSeed);
  const isModular = modular(courseOrSeed);
  const r = ENDLESS_HIGHWAY_RULES, start = index * r.sectionLength, end = start + r.sectionLength;
  const stationIndex = stationIndexAtProgress((start + end) / 2);
  const risky = route === 'risky';
  const id = risky ? `${stationId(stationIndex)}:shortcut` : edgeId(index);
  const spacing = isModular ? ROAD_LIMITS.sampleSpacing : r.sampleSpacing;
  const samples = Array.from({ length: r.sectionLength / spacing + 1 }, (_, i) => {
    const point = endlessHighwayPoint(courseOrSeed, start + i * spacing, 0, route);
    return isModular ? point : { x: point.x, y: 0, z: point.z };
  });
  const edge = {
    id, from: nodeId(index), to: nodeId(index + 1),
    branchId: risky ? `${stationId(stationIndex)}:express` : 'trunk',
    branchName: risky ? 'Express Loading Cut' : 'Continuous Highway',
    type: risky ? 'loading-shortcut' : 'endless-highway',
    roadClass: risky ? 'paved-regional' : 'paved-highway',
    surface: 'paved', width: risky ? r.riskyWidth : r.safeWidth,
    laneCount: risky ? 2 : 5, laneWidth: 3.4, roughness: risky ? 0.065 : 0.025,
    optional: risky, endless: true, sectionIndex: index,
    startProgress: start, endProgress: end,
    stationId: stationIndex >= 0 ? stationId(stationIndex) : null,
    samples, length: 0,
    ...(isModular ? { modular: true, generatorVersion: ROAD_GENERATOR_VERSION, chunk: roadChunkAt(seed, (start + end) / 2) } : {})
  };
  edge.length = edgeLength(edge);
  return edge;
}

/** Generate a station independently of the current window, e.g. for a contract. */
export function endlessLoadingStation(courseOrSeed, index) {
  const seed = typeof courseOrSeed === 'object' ? courseOrSeed.seed : String(courseOrSeed ?? 'long-haul');
  const r = ENDLESS_HIGHWAY_RULES, i = Math.max(0, Math.floor(number(index)));
  const progress = r.firstStationProgress + i * r.stationSpacing;
  const entryProgress = progress - r.stationHalfSpan, exitProgress = progress + r.stationHalfSpan;
  const sectionIndex = Math.round(entryProgress / r.sectionLength), id = stationId(i);
  const safePoint = endlessHighwayPoint(courseOrSeed, progress), riskyPoint = endlessHighwayPoint(courseOrSeed, progress, 0, 'risky');
  const safeEdge = makeEdge(courseOrSeed, sectionIndex), riskyEdge = makeEdge(courseOrSeed, sectionIndex, 'risky');
  return {
    id, index: i, progress, name: `Freight Relay ${i + 1}`,
    entryProgress, exitProgress, warningProgress: entryProgress - 220,
    exclusion: { start: entryProgress - 100, end: exitProgress + 100 },
    entry: endlessHighwayPoint(courseOrSeed, entryProgress), exit: endlessHighwayPoint(courseOrSeed, exitProgress),
    safe: { point: safePoint, width: r.safeWidth, halfWidth: 11, length: 44, routeLength: safeEdge.length, edgeIds: [safeEdge.id], clearance: { width: 24, height: 7 } },
    risky: { point: riskyPoint, width: r.riskyWidth, halfWidth: 3.2, length: 32, routeLength: riskyEdge.length, edgeIds: [riskyEdge.id], clearance: { width: 6.4, height: 5.5 } },
    // The loaded truck always has a wide, paved fallback. These side gates
    // describe the express challenge without placing a blocker on either road.
    challenge: { minForwardSpeed: 9, maxLateralError: 3.2, cleanRequired: true },
    rewardIdentity: `${id}:express-complete`
  };
}

/** First reachable station after a minimum warning distance. */
export function nextEndlessLoadingStation(course, progress, minimumLead = 220) {
  const r = ENDLESS_HIGHWAY_RULES;
  const target = number(progress) + Math.max(0, number(minimumLead, 220)) + r.stationHalfSpan;
  const index = Math.max(0, Math.ceil((target - r.firstStationProgress) / r.stationSpacing));
  return endlessLoadingStation(course, index);
}

export const endlessHighwayStation = endlessLoadingStation;

/** Station approaches are protected even before their station enters the window. */
export function isEndlessLoadingZone(progress) {
  if (!Number.isFinite(progress)) return false;
  const r = ENDLESS_HIGHWAY_RULES;
  const index = Math.max(0, Math.round((progress - r.firstStationProgress) / r.stationSpacing));
  const center = r.firstStationProgress + index * r.stationSpacing;
  return Math.abs(progress - center) < r.stationHalfSpan + 100;
}

/** A bounded, rarely recentered distant-terrain root for an unbounded journey. */
export function endlessHorizonBounds(position, { halfSize = 24576 } = {}) {
  const radius = Math.max(4096, number(halfSize, 24576));
  const step = radius * 1.5;
  const x = Math.round(number(position?.x) / step) * step;
  const z = Math.round(number(position?.z) / step) * step;
  // Every position is at least radius/4 from the root edge. The 49 km root
  // therefore moves only once per ~37 km, without growing LOD storage.
  return { minX: x - radius, maxX: x + radius, minZ: z - radius, maxZ: z + radius };
}

function rebuildWindow(course, centerSection) {
  const r = ENDLESS_HIGHWAY_RULES;
  const first = centerSection - r.sectionsBehind, last = centerSection + r.sectionsAhead;
  const oldEdges = new Map((course.edges ?? []).map(edge => [edge.id, edge]));
  const nodes = [], edges = [], stations = [], signs = [], routeChoices = [];
  for (let index = first; index <= last + 1; index++) {
    const point = endlessHighwayPoint(course, index * r.sectionLength);
    nodes.push({ id: nodeId(index), x: point.x, z: point.z, branchId: 'trunk', progress: index * r.sectionLength });
  }
  for (let index = first; index <= last; index++) {
    const main = oldEdges.get(edgeId(index)) ?? makeEdge(course, index);
    edges.push(main);
    const stationIndex = stationIndexAtProgress((index + 0.5) * r.sectionLength);
    if (stationIndex < 0) continue;
    const station = endlessLoadingStation(course, stationIndex);
    const risky = oldEdges.get(station.risky.edgeIds[0]) ?? makeEdge(course, index, 'risky');
    // Keep trunk order uninterrupted for buildArcadeRoutes. Branches append below.
    stations.push({ ...station, riskyEdge: risky });
  }
  for (const station of stations) {
    edges.push(station.riskyEdge);
    delete station.riskyEdge;
    routeChoices.push({ id: `${station.id}:choice`, kind: 'loading-route', label: station.name,
      stationId: station.id, entryEdgeId: station.risky.edgeIds[0], exitEdgeId: station.risky.edgeIds[0],
      fallbackEdgeIds: station.safe.edgeIds, safeEdgeIds: station.safe.edgeIds, riskyEdgeIds: station.risky.edgeIds,
      entryProgress: station.entryProgress, exitProgress: station.exitProgress });
    const point = endlessHighwayPoint(course, station.warningProgress, -20);
    signs.push({ id: `${station.id}:approach`, x: point.x, z: point.z, heading: point.heading + Math.PI,
      title: 'Freight ahead', subtitle: 'WIDE LEFT / EXPRESS RIGHT', color: '#67d9c0', stationId: station.id });
  }
  const chunks = [];
  if (modular(course)) {
    const seen = new Set();
    for (const edge of edges.filter(e => !e.optional)) {
      const chunk = edge.chunk;
      if (seen.has(chunk.id)) continue;
      seen.add(chunk.id);
      chunks.push({ ...chunk, entry: roadChunkContract(course.seed, chunk), exit: roadChunkContract(course.seed, chunk, true) });
      const entrance = Math.round(chunk.start / r.sectionLength), exit = Math.round(chunk.end / r.sectionLength);
      // Only realize whole optional features when both joins are retained.
      // The 1.28 km rear / 2.24 km forward windows exceed the feature length.
      if (chunk.branch && entrance >= first && exit <= last + 1) {
        const id = `${chunk.id}:bypass`, samples = [];
        for (let p = chunk.start; p <= chunk.end; p += ROAD_LIMITS.sampleSpacing) samples.push(roadChunkSample(course.seed, p, 'branch'));
        const branch = oldEdges.get(id) ?? { id, from: nodeId(entrance), to: nodeId(exit), branchId: id,
          branchName: chunk.name, type: 'scenic-bypass', roadClass: chunk.kind === 'gravel-detour' ? 'gravel' : 'paved-regional',
          surface: chunk.kind === 'gravel-detour' ? 'gravel' : 'paved', width: 12, laneCount: 2, laneWidth: 3.4,
          roughness: chunk.kind === 'gravel-detour' ? .18 : .04, optional: true, endless: true, modular: true,
          generatorVersion: ROAD_GENERATOR_VERSION, chunk, samples, startProgress: chunk.start, endProgress: chunk.end };
        branch.length = edgeLength(branch); edges.push(branch);
        routeChoices.push({ id: `${id}:choice`, kind: 'scenic-bypass', label: chunk.name,
          entryEdgeId: id, exitEdgeId: id, fallbackEdgeIds: edges.filter(e => !e.optional && e.startProgress >= chunk.start && e.endProgress <= chunk.end).map(e => e.id),
          entryProgress: chunk.start, exitProgress: chunk.end });
      }
      if (chunk.index >= 0 && chunk.kind !== 'freight') {
        const p = endlessHighwayPoint(course, chunk.start + 35, -21);
        signs.push({ id: `${chunk.id}:sign`, x: p.x, z: p.z, heading: p.heading + Math.PI,
          title: chunk.name, subtitle: chunk.branch ? 'OPTIONAL ROUTE / HIGHWAY OPEN' : chunk.kind === 'lane-transition' || chunk.kind === 'construction' ? 'LANES MERGE / KEEP CLEAR' : 'DRIVE THE NEXT HORIZON', color: '#e6b747' });
      }
    }
  }
  course.roadChunks = chunks;
  const depots = stations.map(station => {
    const point = endlessHighwayPoint(course, station.progress, 68);
    return { id: `${station.id}:relay`, nodeId: nodeId(Math.round(station.entryProgress / r.sectionLength)),
      branchId: 'trunk', stationId: station.id, name: station.name, kind: 'endless-relay',
      x: point.x, z: point.z, heading: point.heading, radius: 18 };
  });
  // Initial and all forward windows contain multiple relays; this fallback is
  // for valid negative-window reconstruction during recovery/testing.
  if (!depots.length) {
    const point = endlessHighwayPoint(course, centerSection * r.sectionLength, 68);
    depots.push({ id: `endless:relay:${centerSection}`, nodeId: nodeId(centerSection), branchId: 'trunk', name: 'Freight relay', kind: 'endless-relay', x: point.x, z: point.z, heading: point.heading, radius: 18 });
  }
  const xs = [...nodes.map(n => n.x), ...depots.map(d => d.x), ...edges.flatMap(e => e.samples.map(p => p.x))];
  course.nodes = nodes;
  course.edges = edges; // Replacing the array invalidates the existing spatial index.
  course.loadingStations = stations;
  course.routeChoices = routeChoices;
  course.signs = signs;
  course.depots = depots;
  course.validDepotId = depots[0].id;
  course.hub = nodes[r.sectionsBehind];
  course.branches = [{ id: 'trunk', name: 'Continuous Highway', roadClass: 'paved-highway', surface: 'paved', width: r.safeWidth,
    nodeIds: nodes.map(n => n.id), edgeIds: edges.filter(e => !e.optional).map(e => e.id), length: edges.filter(e => !e.optional).reduce((sum, edge) => sum + edge.length, 0) }];
  course.optionalRoads = edges.filter(e => e.type === 'scenic-bypass').map(e => ({ id: e.id, name: e.branchName, entryNodeId: e.from, exitNodeId: e.to, entryEdgeId: e.id, exitEdgeId: e.id }));
  course.branches.push(...edges.filter(e => e.type === 'scenic-bypass').map(e => ({ id: e.branchId, name: e.branchName, nodeIds: [e.from, e.to], edgeIds: [e.id], length: e.length, optional: true })));
  course.bounds = { minX: Math.min(...xs) - 180, maxX: Math.max(...xs) + 180, minZ: -(last + 1) * r.sectionLength - 180, maxZ: -first * r.sectionLength + 180 };
  course.endless = { ...course.endless, centerSection, firstSection: first, lastSection: last,
    windowStart: first * r.sectionLength, windowEnd: (last + 1) * r.sectionLength,
    revision: (course.endless.revision ?? 0) + 1 };
  const currentIds = new Set(edges.map(edge => edge.id));
  return { changed: true, revision: course.endless.revision,
    addedEdgeIds: edges.filter(edge => !oldEdges.has(edge.id)).map(edge => edge.id),
    removedEdgeIds: [...oldEdges.keys()].filter(id => !currentIds.has(id)),
    edgeCount: edges.length, nodeCount: nodes.length, stationCount: stations.length };
}

/** A course-compatible bounded window, without a finite destination terminus. */
export function createEndlessHighway(seed, { progress = 0, generatorVersion = ROAD_GENERATOR_VERSION } = {}) {
  if (![ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION].includes(generatorVersion)) throw new Error('Unsupported highway generator version');
  const text = String(seed ?? 'long-haul'), initialProgress = number(progress);
  const spawn = endlessHighwayPoint({ seed: text, generatorVersion }, 0);
  const course = {
    schema: 'long-haul.course-package/1', packageId: `endless-${hashText(text).toString(36)}`,
    seed: text, generatorVersion,
    origin: { id: 'origin', x: spawn.x, z: spawn.z, heading: spawn.heading }, hub: null,
    nodes: [], edges: [], branches: [], depots: [], signs: [], optionalRoads: [], roundabouts: [], routeChoices: [], wildlife: [],
    validDepotId: null, scoring: { parTimeSeconds: 600, parDistance: ENDLESS_HIGHWAY_RULES.stationSpacing }, bounds: null,
    endless: { schema: 'long-haul.endless-highway/1', sectionLength: ENDLESS_HIGHWAY_RULES.sectionLength,
      stationSpacing: ENDLESS_HIGHWAY_RULES.stationSpacing, revision: 0, furthestProgress: Math.max(0, initialProgress), maximumProgress: Math.max(0, initialProgress) },
    validation: { valid: true, issues: [], contract: 'bounded-continuous-highway' }
  };
  rebuildWindow(course, Math.floor(initialProgress / ENDLESS_HIGHWAY_RULES.sectionLength));
  return course;
}

/** Advance ahead of streaming. Moving backwards also regenerates retired road. */
export function advanceEndlessHighway(course, positionOrProgress) {
  if (!course?.endless) return { changed: false, revision: 0 };
  const progress = typeof positionOrProgress === 'number'
    ? number(positionOrProgress) : endlessHighwayProgress(course, positionOrProgress);
  const section = Math.floor(progress / ENDLESS_HIGHWAY_RULES.sectionLength);
  course.endless.furthestProgress = Math.max(course.endless.furthestProgress ?? 0, progress);
  course.endless.maximumProgress = course.endless.furthestProgress;
  if (section === course.endless.centerSection) return { changed: false, revision: course.endless.revision };
  return rebuildWindow(course, section);
}
