export const clone = (value) => value === undefined ? undefined : structuredClone(value);
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export const TAU = Math.PI * 2;

export const WORLD_ID = "long-haul-course";
export const CELL_SIZE = 192;
export const ACTIVE_RADIUS = 1;
export const TIME_LIMIT_SECONDS = 300;
export const PAR_TIME_SECONDS = 240;

export const BRANCH_PROFILES = Object.freeze([
  Object.freeze({ id: "short-narrow", name: "Pine Pass", depotName: "Mile 9 Logging", depotKind: "logging", width: 12, steps: 5, stepLength: 92, turnBias: 0.2, roughness: 0.18, wildlife: 0.08, color: "#d99f45", subtitle: "Short · Narrow" }),
  Object.freeze({ id: "long-safe", name: "Easy Miles", depotName: "Coldwater Storage", depotKind: "cold-storage", width: 23, steps: 7, stepLength: 104, turnBias: 0.1, roughness: 0.04, wildlife: 0.04, color: "#7ca675", subtitle: "Wide · Long" }),
  Object.freeze({ id: "rough-shortcut", name: "Old Cut", depotName: "Red Cedar Co-op", depotKind: "farm", width: 16, steps: 5, stepLength: 96, turnBias: 0.28, roughness: 0.82, wildlife: 0.08, color: "#b87346", subtitle: "Rough · Direct" }),
  Object.freeze({ id: "wildlife-heavy", name: "Deer Run", depotName: "Hollow Creek Transfer", depotKind: "rail", width: 19, steps: 6, stepLength: 100, turnBias: 0.18, roughness: 0.2, wildlife: 0.65, color: "#7a925d", subtitle: "Wildlife Crossing" }),
  Object.freeze({ id: "confusing-junction", name: "Five Forks", depotName: "Bramble Industrial", depotKind: "industrial", width: 18, steps: 7, stepLength: 94, turnBias: 0.36, roughness: 0.24, wildlife: 0.12, color: "#bc8d52", subtitle: "Many Turns" })
]);

export function hashText(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function segmentInfo(point, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const length2 = abx * abx + abz * abz || 1;
  const t = clamp(((point.x - a.x) * abx + (point.z - a.z) * abz) / length2, 0, 1);
  const x = a.x + abx * t;
  const z = a.z + abz * t;
  return {
    x,
    z,
    t,
    distance: Math.hypot(point.x - x, point.z - z),
    heading: Math.atan2(abx, abz),
    length: Math.sqrt(length2)
  };
}

export function segmentsIntersect(a, b, c, d) {
  const orient = (p, q, r) => (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x);
  const ab1 = orient(a, b, c);
  const ab2 = orient(a, b, d);
  const cd1 = orient(c, d, a);
  const cd2 = orient(c, d, b);
  return ab1 * ab2 < -0.0001 && cd1 * cd2 < -0.0001;
}

export function pointKey(point, size = 48) {
  return `${Math.round(point.x / size)}:${Math.round(point.z / size)}`;
}

export function edgeLength(edge) {
  return edge.samples.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - edge.samples[index].x, point.z - edge.samples[index].z), 0);
}

export function sampleQuadratic(a, control, b, count = 12) {
  const points = [];
  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const u = 1 - t;
    points.push({
      x: u * u * a.x + 2 * u * t * control.x + t * t * b.x,
      z: u * u * a.z + 2 * u * t * control.z + t * t * b.z,
      y: 0
    });
  }
  return points;
}

export function createEdge(id, from, to, profile, controlOffset = 0) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dz) || 1;
  const nx = -dz / length;
  const nz = dx / length;
  const control = {
    x: (from.x + to.x) * 0.5 + nx * controlOffset,
    z: (from.z + to.z) * 0.5 + nz * controlOffset
  };
  const samples = sampleQuadratic(from, control, to, Math.max(8, Math.ceil(length / 20)));
  return {
    id,
    from: from.id,
    to: to.id,
    branchId: profile.id,
    branchName: profile.name,
    type: profile.id,
    width: profile.width,
    roughness: profile.roughness,
    samples,
    length: 0
  };
}

export function deriveCourseBounds(course) {
  const points = [course.origin, ...course.nodes, ...course.depots];
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  return {
    minX: Math.min(...xs) - 180,
    maxX: Math.max(...xs) + 180,
    minZ: Math.min(...zs) - 180,
    maxZ: Math.max(...zs) + 180
  };
}

export function validateCourse(course) {
  const issues = [];
  if (course.branches.length !== 5) issues.push("branch-count");
  if (course.depots.length !== 5) issues.push("depot-count");
  if (new Set(course.depots.map((depot) => depot.id)).size !== 5) issues.push("duplicate-depot-id");
  if (!course.depots.some((depot) => depot.id === course.validDepotId)) issues.push("missing-valid-depot");

  const adjacency = Object.fromEntries(course.nodes.map((node) => [node.id, []]));
  for (const edge of course.edges) {
    if (!adjacency[edge.from] || !adjacency[edge.to]) {
      issues.push(`missing-node:${edge.id}`);
      continue;
    }
    adjacency[edge.from].push(edge.to);
    adjacency[edge.to].push(edge.from);
    if (edge.length < 40 || edge.length > 220) issues.push(`bad-edge-length:${edge.id}`);
  }

  const visited = new Set();
  const queue = [course.origin.id];
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    for (const next of adjacency[id] ?? []) if (!visited.has(next)) queue.push(next);
  }
  for (const depot of course.depots) if (!visited.has(depot.nodeId)) issues.push(`unreachable:${depot.id}`);

  for (let left = 0; left < course.edges.length; left += 1) {
    const a = course.edges[left];
    for (let right = left + 1; right < course.edges.length; right += 1) {
      const b = course.edges[right];
      if (a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to) continue;
      for (let ai = 1; ai < a.samples.length; ai += 1) {
        for (let bi = 1; bi < b.samples.length; bi += 1) {
          if (segmentsIntersect(a.samples[ai - 1], a.samples[ai], b.samples[bi - 1], b.samples[bi])) {
            issues.push(`road-crossing:${a.id}:${b.id}`);
            ai = a.samples.length;
            break;
          }
        }
      }
    }
  }

  return { valid: issues.length === 0, issues, visitedCount: visited.size };
}
