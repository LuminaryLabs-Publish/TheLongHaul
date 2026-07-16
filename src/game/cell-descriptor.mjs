import { CELL_SIZE, TAU, clone, clamp, hashText, segmentInfo } from "./shared.mjs";
import { terrainNoise } from "./world-base.mjs";

export function createCourseCellDescriptor(course, cell) {
  const bounds = cell.bounds;
  const [cx, cz] = cell.coordinates;
  const terrainSegments = 24;
  const terrainRoadSegments = [];
  const ownedRoadSegments = [];
  for (const edge of course.edges) {
    for (let index = 1; index < edge.samples.length; index += 1) {
      const a = edge.samples[index - 1];
      const b = edge.samples[index];
      const segment = {
        id: `${edge.id}:${index - 1}`,
        edgeId: edge.id,
        branchId: edge.branchId,
        branchName: edge.branchName,
        type: edge.type,
        width: edge.width,
        roughness: edge.roughness,
        a: { x: a.x, y: 0.08, z: a.z },
        b: { x: b.x, y: 0.08, z: b.z }
      };
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minZ = Math.min(a.z, b.z);
      const maxZ = Math.max(a.z, b.z);
      if (maxX >= bounds.minX - 32 && minX <= bounds.maxX + 32 && maxZ >= bounds.minZ - 32 && minZ <= bounds.maxZ + 32) terrainRoadSegments.push(segment);
      const midpointX = (a.x + b.x) * 0.5;
      const midpointZ = (a.z + b.z) * 0.5;
      if (midpointX >= bounds.minX && midpointX < bounds.maxX && midpointZ >= bounds.minZ && midpointZ < bounds.maxZ) ownedRoadSegments.push(segment);
    }
  }

  function localNearestRoad(point) {
    let best = null;
    for (const road of terrainRoadSegments) {
      const info = segmentInfo(point, road.a, road.b);
      if (!best || info.distance < best.distance) best = { ...info, edge: road };
    }
    return best;
  }

  function localHeight(x, z) {
    const natural = terrainNoise(x, z, course.seed);
    const road = localNearestRoad({ x, z });
    if (!road) return natural;
    const flattenRadius = road.edge.width * 0.75 + 14;
    const blend = clamp(1 - road.distance / flattenRadius, 0, 1);
    const smoothBlend = blend * blend * (3 - 2 * blend);
    return natural * (1 - smoothBlend);
  }

  const heights = [];
  const colors = [];
  for (let iz = 0; iz <= terrainSegments; iz += 1) {
    for (let ix = 0; ix <= terrainSegments; ix += 1) {
      const x = bounds.minX + (ix / terrainSegments) * CELL_SIZE;
      const z = bounds.minZ + (iz / terrainSegments) * CELL_SIZE;
      const y = localHeight(x, z);
      heights.push(y);
      const moisture = (hashText(`${course.seed}:moisture:${Math.floor(x / 16)}:${Math.floor(z / 16)}`) & 0xffff) / 0xffff;
      const elevation = clamp((y + 10) / 24, 0, 1);
      colors.push({
        r: 0.22 + moisture * 0.1 + elevation * 0.05,
        g: 0.35 + moisture * 0.18 - elevation * 0.03,
        b: 0.18 + moisture * 0.06 + elevation * 0.04
      });
    }
  }

  const roads = ownedRoadSegments;
  const depots = course.depots.filter((depot) => depot.x >= bounds.minX && depot.x < bounds.maxX && depot.z >= bounds.minZ && depot.z < bounds.maxZ);
  const signs = course.signs.filter((sign) => sign.x >= bounds.minX && sign.x < bounds.maxX && sign.z >= bounds.minZ && sign.z < bounds.maxZ);

  const vegetation = [];
  const grass = [];
  const rocks = [];
  const seedOffset = hashText(`${course.seed}:${cx}:${cz}`);
  const randomAt = (index, salt) => ((hashText(`${seedOffset}:${salt}:${index}`) & 0xffffff) / 0xffffff);
  const clusterCount = 5 + Math.floor(randomAt(0, "clusters") * 5);
  for (let cluster = 0; cluster < clusterCount; cluster += 1) {
    const centerX = bounds.minX + 18 + randomAt(cluster, "cx") * (CELL_SIZE - 36);
    const centerZ = bounds.minZ + 18 + randomAt(cluster, "cz") * (CELL_SIZE - 36);
    const clusterSize = 3 + Math.floor(randomAt(cluster, "count") * 7);
    for (let item = 0; item < clusterSize; item += 1) {
      const index = cluster * 17 + item;
      const angle = randomAt(index, "angle") * TAU;
      const radius = Math.sqrt(randomAt(index, "radius")) * (12 + randomAt(cluster, "spread") * 24);
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      if (x < bounds.minX + 3 || x > bounds.maxX - 3 || z < bounds.minZ + 3 || z > bounds.maxZ - 3) continue;
      const road = localNearestRoad({ x, z });
      if (road && road.distance < road.edge.width * 0.7 + 15) continue;
      if (course.depots.some((depot) => Math.hypot(depot.x - x, depot.z - z) < 60)) continue;
      const y = localHeight(x, z);
      const height = 8 + randomAt(index, "height") * 10;
      vegetation.push({
        id: `${cell.id}:tree:${index}`,
        variant: randomAt(index, "variant") > 0.55 ? "b" : "a",
        position: [x, y, z],
        scale: [0.75 + randomAt(index, "width") * 0.5, height / 12, 0.75 + randomAt(index, "width2") * 0.5],
        rotation: randomAt(index, "rotation") * TAU,
        obstacleRadius: 1.4 + height * 0.05
      });
    }
  }

  for (let index = 0; index < 90; index += 1) {
    const x = bounds.minX + randomAt(index, "grass-x") * CELL_SIZE;
    const z = bounds.minZ + randomAt(index, "grass-z") * CELL_SIZE;
    const road = localNearestRoad({ x, z });
    if (road && road.distance < road.edge.width * 0.65 + 5) continue;
    const y = localHeight(x, z);
    grass.push({
      id: `${cell.id}:grass:${index}`,
      position: [x, y, z],
      scale: [0.7 + randomAt(index, "grass-sx") * 0.8, 0.7 + randomAt(index, "grass-sy") * 0.8, 0.7 + randomAt(index, "grass-sz") * 0.8],
      rotation: randomAt(index, "grass-r") * TAU
    });
  }

  for (const road of roads.filter((entry) => entry.type === "rough-shortcut")) {
    if (randomAt(hashText(road.id), "rock") < 0.75) continue;
    const t = 0.25 + randomAt(hashText(road.id), "rock-t") * 0.5;
    const x = road.a.x + (road.b.x - road.a.x) * t;
    const z = road.a.z + (road.b.z - road.a.z) * t;
    const headingValue = Math.atan2(road.b.x - road.a.x, road.b.z - road.a.z);
    const side = randomAt(hashText(road.id), "rock-side") > 0.5 ? 1 : -1;
    const px = x + Math.cos(headingValue) * road.width * 0.35 * side;
    const pz = z - Math.sin(headingValue) * road.width * 0.35 * side;
    rocks.push({ id: `${road.id}:rock`, x: px, y: localHeight(px, pz), z: pz, radius: 1.5 });
  }

  return {
    schema: "long-haul.course-cell/2",
    cellId: cell.id,
    coordinates: [cx, cz],
    bounds: clone(bounds),
    terrain: { segments: terrainSegments, heights, colors },
    roads,
    depots: clone(depots),
    signs: clone(signs),
    vegetation,
    grass,
    rocks
  };
}
