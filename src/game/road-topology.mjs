import { createEdge, edgeLength, segmentsIntersect } from "./shared.mjs";

const BYPASS_PROFILE = Object.freeze({
  id: "optional-bypass",
  name: "River Loop Bypass",
  roadClass: "paved-regional",
  surface: "paved",
  width: 10,
  laneCount: 2,
  laneWidth: 3.4,
  roughness: 0.1
});

function makeBypassEdge(id, from, to, kind, samples = null, length = null) {
  const edge = samples
    ? { ...createEdge(id, from, to, BYPASS_PROFILE), samples }
    : createEdge(id, from, to, BYPASS_PROFILE);
  edge.branchId = BYPASS_PROFILE.id;
  edge.branchName = BYPASS_PROFILE.name;
  edge.type = kind;
  edge.roadClass = BYPASS_PROFILE.roadClass;
  edge.surface = BYPASS_PROFILE.surface;
  edge.width = BYPASS_PROFILE.width;
  edge.laneCount = BYPASS_PROFILE.laneCount;
  edge.laneWidth = BYPASS_PROFILE.laneWidth;
  edge.roughness = BYPASS_PROFILE.roughness;
  edge.speedLimit = 17;
  edge.optional = true;
  edge.length = length ?? edgeLength(edge);
  return edge;
}

function pointSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSquared));
  return Math.hypot(point.x - (a.x + dx * t), point.z - (a.z + dz * t));
}

function segmentDistance(a, b, c, d) {
  if (segmentsIntersect(a, b, c, d)) return 0;
  return Math.min(
    pointSegmentDistance(a, c, d),
    pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b),
    pointSegmentDistance(d, a, b)
  );
}

export function roadsHaveClearance(candidate, existing, clearance = 2) {
  const required = (candidate.width + existing.width) * 0.5 + clearance;
  for (let candidateIndex = 1; candidateIndex < candidate.samples.length; candidateIndex += 1) {
    const a = candidate.samples[candidateIndex - 1];
    const b = candidate.samples[candidateIndex];
    for (let existingIndex = 1; existingIndex < existing.samples.length; existingIndex += 1) {
      const c = existing.samples[existingIndex - 1];
      const d = existing.samples[existingIndex];
      if (segmentDistance(a, b, c, d) < required) return false;
    }
  }
  return true;
}

/** Adds a connected, optional bypass loop to a generated highway course. */
export function addOptionalBypass(course) {
  const upstream = course.nodes.find((node) => node.id === "trunk-node-1");
  const downstream = course.nodes.find((node) => node.id === "trunk-node-3");
  if (!upstream || !downstream) return null;

  const dx = downstream.x - upstream.x;
  const dz = downstream.z - upstream.z;
  const span = Math.hypot(dx, dz);
  if (span < 240) return null;
  const tangent = { x: dx / span, z: dz / span };
  const normal = { x: -tangent.z, z: tangent.x };
  const radius = 54;
  const midpoint = { x: (upstream.x + downstream.x) * 0.5, z: (upstream.z + downstream.z) * 0.5 };
  let placement = null;

  // Branches and connector roads vary with the seed. Try both sides and a
  // bounded set of offsets so a valid layout does not silently lose its
  // optional route just because the first placement intersects a road.
  for (const side of [1, -1]) {
    // Prefer a generous gap from the five-lane highway, then vary the offset
    // in small deterministic steps. The bypass is reserved before branches
    // are generated, leaving those later roads to route around this corridor.
    for (const offset of [110, 125, 140, 155, 170, 185, 200, 215, 230]) {
      const center = {
        x: midpoint.x + normal.x * side * offset,
        z: midpoint.z + normal.z * side * offset
      };
      const pointAt = (angle) => ({
        x: center.x + tangent.x * Math.cos(angle) * radius + normal.x * Math.sin(angle) * radius,
        z: center.z + tangent.z * Math.cos(angle) * radius + normal.z * Math.sin(angle) * radius
      });
      const ringNodes = Array.from({ length: 8 }, (_, index) => ({
        id: `bypass-roundabout-${index}`,
        ...pointAt(index * Math.PI / 4),
        branchId: BYPASS_PROFILE.id
      }));
      const entry = ringNodes[4];
      const exit = ringNodes[0];
      const entryRamp = makeBypassEdge("bypass-off-ramp", upstream, entry, "bypass-off-ramp");
      const exitRamp = makeBypassEdge("bypass-on-ramp", exit, downstream, "bypass-on-ramp");
      const bypassEdges = [entryRamp, exitRamp];

      for (let index = 0; index < ringNodes.length; index += 1) {
        const next = (index + 1) % ringNodes.length;
        const startAngle = index * Math.PI / 4;
        const endAngle = (index + 1) * Math.PI / 4;
        const samples = Array.from({ length: 5 }, (_, sampleIndex) => {
          const point = pointAt(startAngle + (endAngle - startAngle) * sampleIndex / 4);
          return { ...point, y: 0 };
        });
        const arcLength = radius * Math.PI / 4;
        bypassEdges.push(makeBypassEdge(
          `bypass-roundabout-edge-${index}`,
          ringNodes[index],
          ringNodes[next],
          "roundabout",
          samples,
          arcLength
        ));
      }

      const badEdgeLength = bypassEdges.some((edge) => edge.length < 40 || edge.length > 280);
      const crossesExistingRoad = bypassEdges.some((candidate) => course.edges.some((existing) => {
        if ([existing.from, existing.to].some((id) => id === candidate.from || id === candidate.to)) return false;
        return !roadsHaveClearance(candidate, existing);
      }));
      const overlapsBypassRoad = bypassEdges.some((candidate, index) => bypassEdges.slice(index + 1).some((existing) => {
        if ([existing.from, existing.to].some((id) => id === candidate.from || id === candidate.to)) return false;
        return !roadsHaveClearance(candidate, existing, 1.5);
      }));
      if (badEdgeLength || crossesExistingRoad || overlapsBypassRoad) continue;
      placement = { center, ringNodes, entry, exit, entryRamp, exitRamp, bypassEdges };
      break;
    }
    if (placement) break;
  }

  if (!placement) return null;
  const { center, ringNodes, entry, exit, entryRamp, exitRamp, bypassEdges } = placement;

  course.nodes.push(...ringNodes);
  course.edges.push(...bypassEdges);
  const addSign = (id, edge, title, subtitle) => {
    const a = edge.samples[1], b = edge.samples[2];
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    course.signs.push({ id, x: a.x + Math.cos(heading) * 10, z: a.z - Math.sin(heading) * 10,
      heading: heading + Math.PI, title, subtitle, color: "#e6b747" });
  };
  // Put the choice sign before the fork, on the side where the ramp leaves
  // the highway, so drivers can decide before reaching the junction.
  const approachEdge = course.edges.find((edge) => edge.branchId === "trunk" && edge.to === upstream.id);
  if (approachEdge && approachEdge.samples.length >= 2) {
    const index = Math.max(0, approachEdge.samples.length - 4);
    const a = approachEdge.samples[index], b = approachEdge.samples[index + 1];
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    const right = { x: Math.cos(heading), z: -Math.sin(heading) };
    const side = (entry.x - upstream.x) * right.x + (entry.z - upstream.z) * right.z >= 0 ? 1 : -1;
    const distance = approachEdge.width * 0.5 + 6;
    course.signs.push({ id: "bypass-exit-sign", x: a.x + right.x * side * distance, z: a.z + right.z * side * distance,
      heading: heading + Math.PI, title: "River Loop", subtitle: "Off-ramp ahead · roundabout", arrow: side > 0 ? "↗" : "↖", color: "#e6b747" });
  } else {
    addSign("bypass-exit-sign", entryRamp, "River Loop", "Off-ramp · roundabout");
  }
  addSign("bypass-return-sign", exitRamp, "Highway", "On-ramp · rejoin route");

  const approach = (id, node, from) => {
    const heading = Math.atan2(node.x - from.x, node.z - from.z);
    return { id, node: { x: node.x, z: node.z }, from: { x: from.x, z: from.z }, heading, yield: true };
  };
  const roundabout = {
    id: "bypass-roundabout",
    center: { x: center.x, z: center.z },
    radius,
    choice: "bypass-or-highway",
    approaches: [
      approach(entryRamp.id, entry, upstream),
      approach(exitRamp.id, exit, downstream)
    ]
  };
  course.roundabouts = [...(course.roundabouts ?? []), roundabout];
  course.routeChoices = [
    ...(course.routeChoices ?? []),
    {
      id: "bypass-choice",
      kind: "optional-bypass",
      label: "River Loop Bypass",
      entryEdgeId: entryRamp.id,
      exitEdgeId: exitRamp.id,
      roundaboutEdgeIds: ringNodes.map((_, index) => `bypass-roundabout-edge-${index}`),
      fallbackEdgeIds: course.edges.filter((edge) => edge.branchId === "trunk").map((edge) => edge.id),
      junctionId: roundabout.id
    }
  ];

  return {
    id: BYPASS_PROFILE.id,
    name: BYPASS_PROFILE.name,
    junction: "roundabout",
    center: roundabout.center,
    radius,
    roadWidth: BYPASS_PROFILE.width,
    roundaboutId: roundabout.id,
    entryEdgeId: entryRamp.id,
    exitEdgeId: exitRamp.id,
    entryNodeId: entry.id,
    exitNodeId: exit.id,
    approaches: roundabout.approaches,
    roundaboutEdgeIds: ringNodes.map((_, index) => `bypass-roundabout-edge-${index}`),
    speedLimit: 17
  };
}
