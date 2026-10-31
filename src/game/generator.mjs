import { BRANCH_PROFILES, PAR_TIME_SECONDS, hashText, normalizeAngle, pointKey, createEdge, edgeLength, deriveCourseBounds, validateCourse, segmentsIntersect } from "./shared.mjs";
import { addOptionalBypass, roadsHaveClearance } from "./road-topology.mjs";

function createCourseAttempt(random, seed, attempt, options = {}) {
  const deterministicLayout = options.deterministicLayout === true;
  const course = {
    schema: "long-haul.course-package/1",
    packageId: `course-${hashText(`${seed}:${attempt}`).toString(36)}`,
    seed: String(seed),
    generatorVersion: "long-haul-v3",
    origin: { id: "origin", x: 0, z: 0 },
    hub: null,
    nodes: [],
    edges: [],
    branches: [],
    depots: [],
    signs: [],
    optionalRoads: [],
    roundabouts: [],
    routeChoices: [],
    wildlife: [],
    validDepotId: null,
    scoring: { parTimeSeconds: PAR_TIME_SECONDS, parDistance: 1 },
    bounds: null,
    validation: null
  };

  const occupied = new Set();
  const addNode = (node) => {
    const key = pointKey(node);
    if (occupied.has(key)) return false;
    occupied.add(key);
    course.nodes.push(node);
    return true;
  };

  addNode(course.origin);
  let previous = course.origin;
  let heading = Math.PI;
  for (let index = 1; index <= 6; index += 1) {
    const distance = deterministicLayout ? 185 : 185 + random.range("course-layout", -12, 12);
    if (!deterministicLayout) heading += random.range("course-layout", -0.045, 0.045);
    const node = {
      id: `trunk-node-${index}`,
      x: previous.x + Math.sin(heading) * distance,
      z: previous.z + Math.cos(heading) * distance,
      branchId: "trunk"
    };
    addNode(node);
    const edge = createEdge(`trunk-edge-${index}`, previous, node, { id: "trunk", name: "Dispatch Highway", roadClass: "paved-highway", surface: "paved", width: 28, laneCount: 5, laneWidth: 3.4, roughness: 0.025 }, deterministicLayout ? 0 : random.range("course-layout", -5, 5));
    edge.laneCount = 5;
    edge.laneWidth = 3.4;
    edge.length = edgeLength(edge);
    course.edges.push(edge);
    previous = node;
  }
  course.hub = previous;

  // Reserve the optional bypass before destination branches are laid out.
  // Branch placement checks this reserved route for crossing and road-width
  // clearance, so the bypass has room before destination branches consume it.
  const optionalBypass = addOptionalBypass(course);
  if (!optionalBypass) return null;
  course.optionalRoads = [optionalBypass];

  const baseAngles = [-1.08, -0.55, 0, 0.55, 1.08].map((offset) => Math.PI + offset);
  for (let branchIndex = 0; branchIndex < BRANCH_PROFILES.length; branchIndex += 1) {
    const profile = BRANCH_PROFILES[branchIndex];
    const stream = `branch-${profile.id}`;
    if (!random.hasStream(stream)) random.fork("course-layout", profile.id, { id: stream });
    let current = course.hub;
    let branchHeading = baseAngles[branchIndex] + (deterministicLayout ? 0 : random.range(stream, -0.08, 0.08));
    const nodeIds = [];
    let length = 0;

    for (let step = 0; step < profile.steps; step += 1) {
      let chosen = null;
      for (let attemptIndex = 0; attemptIndex < 32 && !chosen; attemptIndex += 1) {
        const turnChoices = deterministicLayout ? [0] : [-1, -0.5, 0, 0, 0, 0.5, 1];
        const turn = (deterministicLayout ? 0 : random.choose(stream, turnChoices)) * profile.turnBias;
        const nextHeading = normalizeAngle(branchHeading + turn);
        const distance = deterministicLayout ? profile.stepLength : profile.stepLength * random.range(stream, 0.88, 1.12);
        const candidate = {
          id: `${profile.id}-node-${step}`,
          x: current.x + Math.sin(nextHeading) * distance,
          z: current.z + Math.cos(nextHeading) * distance,
          branchId: profile.id
        };
        const key = pointKey(candidate);
        const radial = Math.hypot(candidate.x - course.hub.x, candidate.z - course.hub.z);
        if (occupied.has(key) || radial > 4200) continue;
        const tooNear = course.nodes.some((node) => node.id !== current.id && Math.hypot(node.x - candidate.x, node.z - candidate.z) < 24);
        if (tooNear) continue;
        const candidateEdge = createEdge(`${profile.id}-edge-${step}`, current, candidate, profile, deterministicLayout ? 0 : random.range(stream, -profile.width * 0.65, profile.width * 0.65));
        const crosses = course.edges.some((existing) => {
          if (existing.from === current.id || existing.to === current.id) return false;
          return candidateEdge.samples.slice(1).some((point, sampleIndex) =>
            existing.samples.slice(1).some((existingPoint, existingIndex) =>
              segmentsIntersect(candidateEdge.samples[sampleIndex], point, existing.samples[existingIndex], existingPoint)));
        });
        const overlapsBypass = course.edges.some((existing) => existing.branchId === optionalBypass.id && !roadsHaveClearance(candidateEdge, existing));
        if (crosses || overlapsBypass) continue;
        chosen = { candidate, nextHeading, edge: candidateEdge };
      }
      if (!chosen) return null;
      addNode(chosen.candidate);
      nodeIds.push(chosen.candidate.id);
      const edge = chosen.edge;
      edge.length = edgeLength(edge);
      course.edges.push(edge);
      length += edge.length;
      current = chosen.candidate;
      branchHeading = chosen.nextHeading;
    }

    const depotHeading = branchHeading;
    const depot = {
      id: `depot-${branchIndex + 1}`,
      nodeId: current.id,
      name: profile.depotName,
      kind: profile.depotKind,
      branchId: profile.id,
      x: current.x + Math.sin(depotHeading) * 30,
      z: current.z + Math.cos(depotHeading) * 30,
      heading: depotHeading,
      radius: 28
    };
    course.depots.push(depot);
    course.branches.push({ ...profile, nodeIds, endNodeId: current.id, length });

    const firstEdge = course.edges.find((edge) => edge.branchId === profile.id);
    if (firstEdge) {
      const point = firstEdge.samples[Math.min(3, firstEdge.samples.length - 1)];
      const roadHeading = firstEdge.samples.length > 1 ? Math.atan2(firstEdge.samples[1].x - firstEdge.samples[0].x, firstEdge.samples[1].z - firstEdge.samples[0].z) : 0;
      const signOffset = profile.width * 0.5 + 5;
      course.signs.push({
        id: `sign-${profile.id}`,
        x: point.x + Math.cos(roadHeading) * signOffset,
        z: point.z - Math.sin(roadHeading) * signOffset,
        heading: roadHeading + Math.PI,
        title: profile.name,
        subtitle: `${profile.subtitle} · ${(length / 1609.344).toFixed(1)} mi`,
        color: profile.color
      });
    }
  }

  // Keep the recovery layout to five separated radial routes; optional
  // county connectors remain part of randomized courses only.
  const linkPairs = deterministicLayout ? [] : [[0, 1], [3, 4]];
  for (const [leftIndex, rightIndex] of linkPairs) {
    const left = course.branches[leftIndex];
    const right = course.branches[rightIndex];
    const leftNode = course.nodes.find((node) => node.id === left.nodeIds[Math.floor(left.nodeIds.length * 0.55)]);
    const rightNode = course.nodes.find((node) => node.id === right.nodeIds[Math.floor(right.nodeIds.length * 0.55)]);
    if (!leftNode || !rightNode || Math.hypot(leftNode.x - rightNode.x, leftNode.z - rightNode.z) > 520) continue;
    const profile = { id: `link-${left.id}-${right.id}`, name: "County Connector", roadClass: "gravel", surface: "gravel", width: 16, roughness: 0.3 };
    const edge = createEdge(profile.id, leftNode, rightNode, profile, deterministicLayout ? 0 : random.range("course-layout", -30, 30));
    edge.length = edgeLength(edge);
    const crosses = course.edges.some((existing) => {
      if ([existing.from, existing.to].includes(leftNode.id) || [existing.from, existing.to].includes(rightNode.id)) return false;
      return edge.samples.slice(1).some((point, index) => existing.samples.slice(1).some((other, otherIndex) => segmentsIntersect(edge.samples[index], point, existing.samples[otherIndex], other)));
    });
    const overlapsBypass = course.edges.some((existing) => existing.branchId === optionalBypass.id && !roadsHaveClearance(edge, existing));
    if (!crosses && !overlapsBypass) course.edges.push(edge);
  }

  course.validDepotId = random.choose("valid-depot", course.depots.map((depot) => depot.id));
  const targetDepot = course.depots.find((depot) => depot.id === course.validDepotId);
  const targetBranch = course.branches.find((branch) => branch.id === targetDepot?.branchId);
  const highwayDistance = course.edges.filter((edge) => edge.branchId === "trunk").reduce((sum, edge) => sum + edge.length, 0);
  const routeDistance = highwayDistance + (targetBranch?.length ?? 0) + 30;
  course.scoring.parDistance = Math.max(25, Math.round(routeDistance / 25) * 25);
  course.bounds = deriveCourseBounds(course);

  const wildlifeEdges = course.edges.filter((edge) => edge.branchId === "wildlife-heavy");
  for (let index = 0; index < 12; index += 1) {
    const edge = wildlifeEdges[index % wildlifeEdges.length];
    const segmentIndex = 1 + (index * 3) % Math.max(1, edge.samples.length - 2);
    const center = edge.samples[segmentIndex];
    const next = edge.samples[Math.min(edge.samples.length - 1, segmentIndex + 1)];
    const headingValue = Math.atan2(next.x - center.x, next.z - center.z);
    const side = index % 2 ? 1 : -1;
    const offset = edge.width * 0.8 * side;
    const start = { x: center.x + Math.cos(headingValue) * offset, z: center.z - Math.sin(headingValue) * offset };
    const end = { x: center.x - Math.cos(headingValue) * offset, z: center.z + Math.sin(headingValue) * offset };
    course.wildlife.push({
      id: `wildlife-${index + 1}`,
      kind: index === 9 ? "elk" : "deer",
      start,
      end,
      speed: random.range("wildlife", 0.055, 0.11),
      phase: random.next("wildlife"),
      radius: index === 9 ? 2.6 : 1.8,
      damage: index === 9 ? 12 : random.range("wildlife", 5, 8),
      branchId: "wildlife-heavy"
    });
  }

  course.validation = validateCourse(course);
  return course.validation.valid ? course : null;
}

export function generateCourse(engine, seed, options = {}) {
  const random = engine?.n?.coreData?.random;
  if (!random) throw new Error("Course generation requires Core Data random streams.");
  random.setWorldSeed(String(seed));
  for (const stream of ["course-layout", "valid-depot", "terrain", "vegetation", "wildlife", "materials", "presentation"]) {
    if (!random.hasStream(stream)) random.createStream(stream);
  }
  const requestedAttempts = Number(options.maxAttempts ?? 32);
  const maxAttempts = Number.isFinite(requestedAttempts)
    ? Math.max(1, Math.min(64, Math.floor(requestedAttempts)))
    : 32;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    random.setWorldSeed(`${seed}:attempt:${attempt}`);
    for (const stream of ["course-layout", "valid-depot", "terrain", "vegetation", "wildlife", "materials", "presentation"]) random.createStream(stream, { replace: true });
    const course = createCourseAttempt(random, seed, attempt);
    if (course) return course;
  }

  // A final fixed layout prevents random branch placement from exhausting
  // retries. Straight radial branches leave clear space around the reserved
  // highway bypass and preserve the same five-destination course contract.
  random.setWorldSeed(`${seed}:deterministic-fallback`);
  for (const stream of ["course-layout", "valid-depot", "terrain", "vegetation", "wildlife", "materials", "presentation"]) {
    random.createStream(stream, { replace: true });
  }
  const fallback = createCourseAttempt(random, seed, maxAttempts, { deterministicLayout: true });
  if (fallback) return fallback;
  throw new Error("Unable to generate a valid course within the bounded attempt limit.");
}
