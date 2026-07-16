import { BRANCH_PROFILES, PAR_TIME_SECONDS, hashText, normalizeAngle, pointKey, createEdge, edgeLength, deriveCourseBounds, validateCourse, segmentsIntersect } from "./shared.mjs";

function createCourseAttempt(random, seed, attempt) {
  const course = {
    schema: "long-haul.course-package/1",
    packageId: `course-${hashText(`${seed}:${attempt}`).toString(36)}`,
    seed: String(seed),
    generatorVersion: "long-haul-v2",
    origin: { id: "origin", x: 0, z: 0 },
    hub: null,
    nodes: [],
    edges: [],
    branches: [],
    depots: [],
    signs: [],
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
  for (let index = 1; index <= 3; index += 1) {
    const distance = 105 + random.range("course-layout", -8, 8);
    heading += random.range("course-layout", -0.08, 0.08);
    const node = {
      id: `trunk-node-${index}`,
      x: previous.x + Math.sin(heading) * distance,
      z: previous.z + Math.cos(heading) * distance,
      branchId: "trunk"
    };
    addNode(node);
    const edge = createEdge(`trunk-edge-${index}`, previous, node, { id: "trunk", name: "Dispatch Road", width: 22, roughness: 0.08 }, random.range("course-layout", -8, 8));
    edge.length = edgeLength(edge);
    course.edges.push(edge);
    previous = node;
  }
  course.hub = previous;

  const baseAngles = [-1.08, -0.55, 0, 0.55, 1.08].map((offset) => Math.PI + offset);
  for (let branchIndex = 0; branchIndex < BRANCH_PROFILES.length; branchIndex += 1) {
    const profile = BRANCH_PROFILES[branchIndex];
    const stream = `branch-${profile.id}`;
    if (!random.hasStream(stream)) random.fork("course-layout", profile.id, { id: stream });
    let current = course.hub;
    let branchHeading = baseAngles[branchIndex] + random.range(stream, -0.08, 0.08);
    const nodeIds = [];
    let length = 0;

    for (let step = 0; step < profile.steps; step += 1) {
      let chosen = null;
      for (let attemptIndex = 0; attemptIndex < 32 && !chosen; attemptIndex += 1) {
        const turnChoices = [-1, -0.5, 0, 0, 0, 0.5, 1];
        const turn = random.choose(stream, turnChoices) * profile.turnBias;
        const nextHeading = normalizeAngle(branchHeading + turn);
        const distance = profile.stepLength * random.range(stream, 0.88, 1.12);
        const candidate = {
          id: `${profile.id}-node-${step}`,
          x: current.x + Math.sin(nextHeading) * distance,
          z: current.z + Math.cos(nextHeading) * distance,
          branchId: profile.id
        };
        const key = pointKey(candidate);
        const radial = Math.hypot(candidate.x - course.hub.x, candidate.z - course.hub.z);
        if (occupied.has(key) || radial > 1150) continue;
        const tooNear = course.nodes.some((node) => node.id !== current.id && Math.hypot(node.x - candidate.x, node.z - candidate.z) < 24);
        if (tooNear) continue;
        const probe = { ...candidate };
        const crosses = course.edges.some((edge) => {
          if (edge.from === current.id || edge.to === current.id) return false;
          return edge.samples.slice(1).some((point, sampleIndex) => segmentsIntersect(current, probe, edge.samples[sampleIndex], point));
        });
        if (crosses) continue;
        chosen = { candidate, nextHeading };
      }
      if (!chosen) return null;
      addNode(chosen.candidate);
      nodeIds.push(chosen.candidate.id);
      const edge = createEdge(`${profile.id}-edge-${step}`, current, chosen.candidate, profile, random.range(stream, -profile.width * 0.65, profile.width * 0.65));
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
      course.signs.push({
        id: `sign-${profile.id}`,
        x: point.x + Math.cos(firstEdge.samples.length > 1 ? Math.atan2(firstEdge.samples[1].z - firstEdge.samples[0].z, firstEdge.samples[1].x - firstEdge.samples[0].x) : 0) * (profile.width + 5),
        z: point.z,
        heading: firstEdge.samples.length > 1 ? Math.atan2(firstEdge.samples[1].x - firstEdge.samples[0].x, firstEdge.samples[1].z - firstEdge.samples[0].z) : 0,
        title: profile.name,
        subtitle: profile.subtitle,
        color: profile.color
      });
    }
  }

  const linkPairs = [[0, 1], [3, 4]];
  for (const [leftIndex, rightIndex] of linkPairs) {
    const left = course.branches[leftIndex];
    const right = course.branches[rightIndex];
    const leftNode = course.nodes.find((node) => node.id === left.nodeIds[Math.floor(left.nodeIds.length * 0.55)]);
    const rightNode = course.nodes.find((node) => node.id === right.nodeIds[Math.floor(right.nodeIds.length * 0.55)]);
    if (!leftNode || !rightNode || Math.hypot(leftNode.x - rightNode.x, leftNode.z - rightNode.z) > 310) continue;
    const profile = { id: `link-${left.id}-${right.id}`, name: "Connector", width: 14, roughness: 0.3 };
    const edge = createEdge(profile.id, leftNode, rightNode, profile, random.range("course-layout", -30, 30));
    edge.length = edgeLength(edge);
    const crosses = course.edges.some((existing) => {
      if ([existing.from, existing.to].includes(leftNode.id) || [existing.from, existing.to].includes(rightNode.id)) return false;
      return edge.samples.slice(1).some((point, index) => existing.samples.slice(1).some((other, otherIndex) => segmentsIntersect(edge.samples[index], point, existing.samples[otherIndex], other)));
    });
    if (!crosses) course.edges.push(edge);
  }

  course.validDepotId = random.choose("valid-depot", course.depots.map((depot) => depot.id));
  const routeDistance = course.edges.reduce((sum, edge) => sum + edge.length, 0);
  course.scoring.parDistance = Math.round((routeDistance * 0.42) / 25) * 25;
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
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 32));
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    random.setWorldSeed(`${seed}:attempt:${attempt}`);
    for (const stream of ["course-layout", "valid-depot", "terrain", "vegetation", "wildlife", "materials", "presentation"]) random.createStream(stream, { replace: true });
    const course = createCourseAttempt(random, seed, attempt);
    if (course) return course;
  }
  throw new Error("Unable to generate a valid course within the bounded attempt limit.");
}
