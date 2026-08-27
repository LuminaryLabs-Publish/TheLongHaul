import { CELL_SIZE, TAU, clone, clamp, hashText, segmentInfo } from "./shared.mjs";
import { roadElevation, terrainNoise } from "./world-base.mjs";

export function createCourseCellDescriptor(course, cell, options = {}) {
  const bounds = cell.bounds;
  const [cx, cz] = cell.coordinates;
  const terrainSegments = Math.max(8, Math.floor(Number(options.terrainSegments ?? 20)));
  const suppliedSampleHeight = typeof options.sampleHeight === "function" ? options.sampleHeight : null;
  const sampleSurface = typeof options.sampleSurface === "function" ? options.sampleSurface : null;
  const terrainRoadSegments = [];
  const ownedRoadSegments = [];
  const localRoadSamples = [];

  for (const edge of course.edges) {
    for (let index = 1; index < edge.samples.length; index += 1) {
      const sourceA = edge.samples[index - 1];
      const sourceB = edge.samples[index];
      const minX = Math.min(sourceA.x, sourceB.x), maxX = Math.max(sourceA.x, sourceB.x), minZ = Math.min(sourceA.z, sourceB.z), maxZ = Math.max(sourceA.z, sourceB.z);
      if (maxX < bounds.minX - 48 || minX > bounds.maxX + 48 || maxZ < bounds.minZ - 48 || minZ > bounds.maxZ + 48) continue;
      const segmentIndex = index - 1;
      const heightAtRoadPoint = (point, t) => suppliedSampleHeight?.(point.x, point.z) ?? roadElevation(course, { x: point.x, z: point.z, t, distance: 0, edge, segmentIndex });
      const a = { x: sourceA.x, y: heightAtRoadPoint(sourceA, 0) + 0.12, z: sourceA.z };
      const b = { x: sourceB.x, y: heightAtRoadPoint(sourceB, 1) + 0.12, z: sourceB.z };
      const segment = { id: `${edge.id}:${index - 1}`, edgeId: edge.id, branchId: edge.branchId, branchName: edge.branchName, type: edge.type, roadClass: edge.roadClass ?? "paved-regional", surface: edge.surface ?? (edge.type === "rough-shortcut" ? "dirt" : "paved"), width: edge.width, roughness: edge.roughness, a, b };
      terrainRoadSegments.push(segment);
      localRoadSamples.push({ a: sourceA, b: sourceB, edge, segmentIndex });
      const midpointX = (a.x + b.x) * 0.5, midpointZ = (a.z + b.z) * 0.5;
      if (midpointX >= bounds.minX && midpointX < bounds.maxX && midpointZ >= bounds.minZ && midpointZ < bounds.maxZ) ownedRoadSegments.push(segment);
    }
  }

  const localHeight = suppliedSampleHeight ?? ((x, z) => {
    const natural = terrainNoise(x, z, course?.seed ?? "long-haul");
    let best = null;
    for (const road of localRoadSamples) {
      const info = segmentInfo({ x, z }, road.a, road.b);
      if (!best || info.distance < best.distance) best = { ...info, edge: road.edge, segmentIndex: road.segmentIndex };
    }
    if (!best) return natural;
    const flattenRadius = best.edge.width * 0.78 + 16;
    const blend = clamp(1 - best.distance / flattenRadius, 0, 1);
    const smoothBlend = blend * blend * (3 - 2 * blend);
    return natural + (roadElevation(course, best) - natural) * smoothBlend;
  });
  const localSurface = (x, z) => sampleSurface?.(x, z) ?? null;
  const heights = [];
  const colors = [];
  for (let iz = 0; iz <= terrainSegments; iz += 1) {
    for (let ix = 0; ix <= terrainSegments; ix += 1) {
      const x = bounds.minX + (ix / terrainSegments) * CELL_SIZE;
      const z = bounds.minZ + (iz / terrainSegments) * CELL_SIZE;
      const y = localHeight(x, z);
      heights.push(y);
      const surface = localSurface(x, z);
      const moisture = (hashText(`${course.seed}:moisture:${Math.floor(x / 24)}:${Math.floor(z / 24)}`) & 0xffff) / 0xffff;
      const elevation = clamp((y + 18) / 46, 0, 1);
      const roadTint = surface?.surface === "road" ? 0.045 : surface?.surface === "shoulder" ? 0.02 : 0;
      colors.push({ r: 0.19 + moisture * 0.1 + elevation * 0.09 + roadTint, g: 0.32 + moisture * 0.19 - elevation * 0.035 - roadTint * 0.7, b: 0.15 + moisture * 0.07 + elevation * 0.07 - roadTint * 0.5 });
    }
  }

  const roads = ownedRoadSegments;
  const depots = course.depots.filter((depot) => depot.x >= bounds.minX && depot.x < bounds.maxX && depot.z >= bounds.minZ && depot.z < bounds.maxZ);
  const signs = course.signs.filter((sign) => sign.x >= bounds.minX && sign.x < bounds.maxX && sign.z >= bounds.minZ && sign.z < bounds.maxZ);
  const vegetation = [];
  const grass = [];
  const rocks = [];
  const scenery = [];
  const seedOffset = hashText(`${course.seed}:${cx}:${cz}`);
  const randomAt = (index, salt) => (hashText(`${seedOffset}:${salt}:${index}`) & 0xffffff) / 0xffffff;
  const clusterCount = 5 + Math.floor(randomAt(0, "clusters") * 6);

  const blockedByRoad = (x, z, extra = 0) => {
    const semantic = localSurface(x, z);
    if (semantic?.surface === "road" || semantic?.surface === "shoulder") return true;
    return terrainRoadSegments.some((road) => {
      const dx = road.b.x - road.a.x, dz = road.b.z - road.a.z, length2 = dx * dx + dz * dz || 1;
      const t = clamp(((x - road.a.x) * dx + (z - road.a.z) * dz) / length2, 0, 1);
      return Math.hypot(x - (road.a.x + dx * t), z - (road.a.z + dz * t)) < road.width * 0.7 + extra;
    });
  };

  for (let cluster = 0; cluster < clusterCount; cluster += 1) {
    const centerX = bounds.minX + 18 + randomAt(cluster, "cx") * (CELL_SIZE - 36);
    const centerZ = bounds.minZ + 18 + randomAt(cluster, "cz") * (CELL_SIZE - 36);
    const clusterSize = 4 + Math.floor(randomAt(cluster, "count") * 9);
    if (randomAt(cluster, "open") > 0.78) continue;
    for (let item = 0; item < clusterSize; item += 1) {
      const index = cluster * 23 + item;
      const angle = randomAt(index, "angle") * TAU;
      const radius = Math.sqrt(randomAt(index, "radius")) * (10 + randomAt(cluster, "spread") * 30);
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      if (x < bounds.minX + 3 || x > bounds.maxX - 3 || z < bounds.minZ + 3 || z > bounds.maxZ - 3 || blockedByRoad(x, z, 15)) continue;
      if (course.depots.some((depot) => Math.hypot(depot.x - x, depot.z - z) < 70)) continue;
      const y = localHeight(x, z);
      const height = 8 + randomAt(index, "height") * 13;
      vegetation.push({ id: `${cell.id}:tree:${index}`, variant: randomAt(index, "variant") > 0.52 ? "b" : "a", position: [x, y, z], scale: [0.72 + randomAt(index, "width") * 0.62, height / 12, 0.72 + randomAt(index, "width2") * 0.62], rotation: randomAt(index, "rotation") * TAU, obstacleRadius: 1.4 + height * 0.05 });
    }
  }

  for (let index = 0; index < 96; index += 1) {
    const x = bounds.minX + randomAt(index, "grass-x") * CELL_SIZE;
    const z = bounds.minZ + randomAt(index, "grass-z") * CELL_SIZE;
    if (blockedByRoad(x, z, 5)) continue;
    const y = localHeight(x, z);
    grass.push({ id: `${cell.id}:grass:${index}`, position: [x, y, z], scale: [0.65 + randomAt(index, "grass-sx") * 1.05, 0.65 + randomAt(index, "grass-sy") * 1.1, 0.65 + randomAt(index, "grass-sz") * 1.05], rotation: randomAt(index, "grass-r") * TAU });
  }

  for (const road of roads.filter((entry) => entry.type === "rough-shortcut")) {
    if (randomAt(hashText(road.id), "rock") < 0.58) continue;
    const t = 0.22 + randomAt(hashText(road.id), "rock-t") * 0.56;
    const x = road.a.x + (road.b.x - road.a.x) * t, z = road.a.z + (road.b.z - road.a.z) * t;
    const headingValue = Math.atan2(road.b.x - road.a.x, road.b.z - road.a.z);
    const side = randomAt(hashText(road.id), "rock-side") > 0.5 ? 1 : -1;
    const px = x + Math.cos(headingValue) * road.width * 0.35 * side, pz = z - Math.sin(headingValue) * road.width * 0.35 * side;
    rocks.push({ id: `${road.id}:rock`, x: px, y: localHeight(px, pz), z: pz, radius: 1.5 });
  }

  for (const road of roads) {
    const code = hashText(`${course.seed}:${road.id}:roadside`);
    const dx = road.b.x - road.a.x, dz = road.b.z - road.a.z, length = Math.hypot(dx, dz) || 1;
    const nx = -dz / length, nz = dx / length;
    const heading = Math.atan2(dx, dz);
    const x = (road.a.x + road.b.x) * 0.5, z = (road.a.z + road.b.z) * 0.5;
    if (road.surface === "paved" && (code & 1) === 0) {
      for (const side of [-1, 1]) {
        const offset = road.width * 0.58 + 1.8;
        const px = x + nx * offset * side, pz = z + nz * offset * side;
        scenery.push({ id: `${road.id}:marker:${side}`, kind: "road-marker", x: px, y: localHeight(px, pz), z: pz, heading, side });
      }
    }
    if ((code & 7) === 3) {
      const side = code & 8 ? 1 : -1, offset = road.width * 0.65 + 6;
      const px = x + nx * offset * side, pz = z + nz * offset * side;
      scenery.push({ id: `${road.id}:pole`, kind: "utility-pole", x: px, y: localHeight(px, pz), z: pz, heading, side });
    }
    if (road.surface !== "paved" && (code & 5) === 1) {
      const side = code & 16 ? 1 : -1, offset = road.width * 0.7 + 4;
      const px = x + nx * offset * side, pz = z + nz * offset * side;
      scenery.push({ id: `${road.id}:boulder`, kind: "roadside-boulder", x: px, y: localHeight(px, pz), z: pz, heading, side });
    }
  }

  return { schema: "long-haul.course-cell/4", cellId: cell.id, coordinates: [cx, cz], bounds: clone(bounds), foundationRevision: Number(options.foundationRevision ?? 0), terrain: { segments: terrainSegments, heights, colors }, roads, depots: clone(depots), signs: clone(signs), vegetation, grass, rocks, scenery };
}
