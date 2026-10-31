import { TREE_POINT_PROFILES } from "./tree-point-profiles.mjs";

const LEAF_RING_SIDES = 6;
const LEAF_BLOB = [
  [0, 1, 0], [0, -1, 0],
  ...Array.from({ length: LEAF_RING_SIDES }, (_, index) => {
    const angle = index / LEAF_RING_SIDES * Math.PI * 2;
    return [Math.cos(angle), 0, Math.sin(angle)];
  })
];
const LEAF_BLOB_FACES = [];
for (let side = 0; side < LEAF_RING_SIDES; side += 1) {
  const current = side + 2, next = (side + 1) % LEAF_RING_SIDES + 2;
  LEAF_BLOB_FACES.push(0, next, current, 1, current, next);
}

function hash(value) {
  let result = 2166136261;
  for (const character of String(value)) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

function randomUnit(seed, index) {
  let value = (seed + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

function pushColor(colors, color) {
  colors.push(color[0], color[1], color[2]);
}

function addLeafBlob(positions, colors, indices, center, radius, sourceColor, tint, seed) {
  const base = positions.length / 3;
  const jitter = 0.86 + randomUnit(seed, base) * 0.28;
  const yaw = randomUnit(seed, base + 41) * Math.PI * 2;
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  for (let index = 0; index < LEAF_BLOB.length; index += 1) {
    const vertex = LEAF_BLOB[index];
    const variation = 0.9 + randomUnit(seed, base + index + 7) * 0.2;
    const x = vertex[0] * radius[0] * variation * jitter;
    const z = vertex[2] * radius[2] * variation * jitter;
    positions.push(
      center[0] + cos * x + sin * z,
      center[1] + vertex[1] * radius[1] * variation * jitter,
      center[2] - sin * x + cos * z
    );
    const shade = tint * (0.88 + randomUnit(seed, base + index + 19) * 0.24);
    pushColor(colors, [sourceColor[0] * shade, sourceColor[1] * shade, sourceColor[2] * shade]);
  }
  for (const vertex of LEAF_BLOB_FACES) indices.push(base + vertex);
}

function addBranch(positions, colors, indices, start, end, radius, seed) {
  const dx = end[0] - start[0], dy = end[1] - start[1], dz = end[2] - start[2];
  const length = Math.hypot(dx, dy, dz);
  if (length < 0.08) return;
  const axis = [dx / length, dy / length, dz / length];
  const helper = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const right = [axis[1] * helper[2] - axis[2] * helper[1], axis[2] * helper[0] - axis[0] * helper[2], axis[0] * helper[1] - axis[1] * helper[0]];
  const rightLength = Math.hypot(...right) || 1;
  right.forEach((value, index) => { right[index] = value / rightLength; });
  const forward = [axis[1] * right[2] - axis[2] * right[1], axis[2] * right[0] - axis[0] * right[2], axis[0] * right[1] - axis[1] * right[0]];
  const base = positions.length / 3;
  const ringSides = 5;
  for (const [along, taper] of [[0, 1], [0.55, 0.63], [1, 0.1]]) {
    const center = [start[0] + dx * along, start[1] + dy * along, start[2] + dz * along];
    for (let side = 0; side < ringSides; side += 1) {
      const angle = (side / ringSides) * Math.PI * 2;
      const offsetA = Math.cos(angle) * radius * taper;
      const offsetB = Math.sin(angle) * radius * taper;
      positions.push(center[0] + right[0] * offsetA + forward[0] * offsetB,
        center[1] + right[1] * offsetA + forward[1] * offsetB,
        center[2] + right[2] * offsetA + forward[2] * offsetB);
      pushColor(colors, [0.105, 0.053, 0.027]);
    }
  }
  for (let ring = 0; ring < 2; ring += 1) {
    for (let side = 0; side < ringSides; side += 1) {
      const next = (side + 1) % ringSides;
      const a = base + ring * ringSides + side;
      const b = base + ring * ringSides + next;
      const c = base + (ring + 1) * ringSides + side;
      const d = base + (ring + 1) * ringSides + next;
      indices.push(a, b, c, b, d, c);
    }
  }
}

function toWorld(tree, profile, point, height, cos, sin) {
  const localX = point[0] * height * tree.scale[0] * profile.widthScale;
  const localZ = point[2] * height * tree.scale[2] * profile.widthScale;
  return [
    tree.position[0] + cos * localX + sin * localZ,
    tree.position[1] + point[1] * height,
    tree.position[2] - sin * localX + cos * localZ
  ];
}

function addTrunk(positions, colors, indices, tree, profile, height, cos, sin, seed) {
  const stem = height * profile.trunkRadius;
  const crownBase = height * profile.crownBase;
  const root = [tree.position[0], tree.position[1], tree.position[2]];
  const trunkTop = [
    tree.position[0] + sin * height * 0.006,
    tree.position[1] + crownBase,
    tree.position[2] + cos * height * 0.006
  ];
  addBranch(positions, colors, indices, root, trunkTop, stem, seed);
}

export function* buildTreeMeshSteps(trees, { visualOnly = false, pointLimit = 96 } = {}) {
  const positions = [], colors = [], indices = [];
  const candidates = visualOnly ? trees.filter((_, index) => index % 6 === 0) : trees;
  const barkAnchors = [];

  for (const tree of candidates) {
    const profile = TREE_POINT_PROFILES[tree.variant === "b" ? "cedar" : "oak"];
    if (!profile?.points?.length) continue;
    const height = tree.scale[1] * 12;
    const seed = hash(tree.id);
    const rotation = Number(tree.rotation) || 0;
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    const tint = 0.78 + randomUnit(seed, 3) * 0.32;
    const leafRadius = height * profile.leafRadius;
    const pointCount = Math.min(visualOnly ? 12 : pointLimit, profile.points.length);
    const stride = profile.points.length / pointCount;
    const used = [];

    for (let index = 0; index < pointCount; index += 1) {
      const point = profile.points[Math.floor(index * stride)];
      if (point[1] < profile.crownBase * 0.72) continue;
      const anchor = toWorld(tree, profile, point, height, cos, sin);
      const radius = leafRadius * (0.82 + randomUnit(seed, index + 31) * 0.42);
      const sourceColor = [point[3], point[4], point[5]];
      addLeafBlob(positions, colors, indices, anchor,
        [radius * tree.scale[0], radius * 0.78, radius * tree.scale[2]], sourceColor, tint, seed + index * 13);
      used.push(point);
    }

    addTrunk(positions, colors, indices, tree, profile, height, cos, sin, seed);
    for (let branchIndex = 0; branchIndex < (visualOnly ? 0 : 6); branchIndex += 1) {
      const point = used[Math.floor((branchIndex + 0.5) * used.length / 6)];
      if (!point) continue;
      const endpoint = toWorld(tree, profile, point, height, cos, sin);
      const startHeight = Math.max(profile.crownBase * 1.2, point[1] * (0.38 + randomUnit(seed, branchIndex + 101) * 0.2));
      const start = [tree.position[0] + sin * height * 0.006, tree.position[1] + height * startHeight, tree.position[2] + cos * height * 0.006];
      barkAnchors.push([start, endpoint, Math.max(0.035, height * profile.trunkRadius * 0.38), seed + branchIndex]);
    }
    yield;
  }

  for (const [start, end, radius, seed] of barkAnchors) addBranch(positions, colors, indices, start, end, radius, seed);
  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    indices: positions.length / 3 <= 65535 ? new Uint16Array(indices) : new Uint32Array(indices),
    treeCount: candidates.length
  };
}

export function buildTreeMeshData(trees,options) {
 const steps=buildTreeMeshSteps(trees,options);let next;do{next=steps.next()}while(!next.done);return next.value;
}
