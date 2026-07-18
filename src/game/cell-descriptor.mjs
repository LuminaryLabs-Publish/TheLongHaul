import { CELL_SIZE, TAU, clone, clamp, hashText } from "./shared.mjs";
import { terrainHeight } from "./world-base.mjs";

export function createCourseCellDescriptor(course, cell) {
  const bounds = cell.bounds;
  const [cx, cz] = cell.coordinates;
  const terrainSegments = 32;
  const terrainRoadSegments = [];
  const ownedRoadSegments = [];

  for (const edge of course.edges) {
    for (let index = 1; index < edge.samples.length; index += 1) {
      const sourceA = edge.samples[index - 1];
      const sourceB = edge.samples[index];
      const a = { x: sourceA.x, y: terrainHeight(course, sourceA.x, sourceA.z) + 0.12, z: sourceA.z };
      const b = { x: sourceB.x, y: terrainHeight(course, sourceB.x, sourceB.z) + 0.12, z: sourceB.z };
      const segment = {
        id: `${edge.id}:${index - 1}`,
        edgeId: edge.id,
        branchId: edge.branchId,
        branchName: edge.branchName,
        type: edge.type,
        width: edge.width,
        roughness: edge.roughness,
        a,
        b
      };
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minZ = Math.min(a.z, b.z);
      const maxZ = Math.max(a.z, b.z);
      if (maxX >= bounds.minX - 36 && minX <= bounds.maxX + 36 && maxZ >= bounds.minZ - 36 && minZ <= bounds.maxZ + 36) terrainRoadSegments.push(segment);
      const midpointX = (a.x + b.x) * 0.5;
      const midpointZ = (a.z + b.z) * 0.5;
      if (midpointX >= bounds.minX && midpointX < bounds.maxX && midpointZ >= bounds.minZ && midpointZ < bounds.maxZ) ownedRoadSegments.push(segment);
    }
  }

  const localHeight = (x, z) => terrainHeight(course, x, z);

  const heights = [];
  const colors = [];
  for (let iz = 0; iz <= terrainSegments; iz += 1) {
    for (let ix = 0; ix <= terrainSegments; ix += 1) {
      const x = bounds.minX + (ix / terrainSegments) * CELL_SIZE;
      const z = bounds.minZ + (iz / terrainSegments) * CELL_SIZE;
      const y = localHeight(x, z);
      heights.push(y);
      const moisture = (hashText(`${course.seed}:moisture:${Math.floor(x / 24)}:${Math.floor(z / 24)}`) & 0xffff) / 0xffff;
      const elevation = clamp((y + 18) / 46, 0, 1);
      colors.push({
        r: 0.19 + moisture * 0.1 + elevation * 0.09,
        g: 0.32 + moisture * 0.19 - elevation * 0.035,
        b: 0.15 + moisture * 0.07 + elevation * 0.07
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
  const randomAt = (index, salt) => (hashText(`${seedOffset}:${salt}:${index}`) & 0xffffff) / 0xffffff;
  const clusterCount = 8 + Math.floor(randomAt(0, "clusters") * 8);

  for (let cluster = 0; cluster < clusterCount; cluster += 1) {
    const centerX = bounds.minX + 18 + randomAt(cluster, "cx") * (CELL_SIZE - 36);
    const centerZ = bounds.minZ + 18 + randomAt(cluster, "cz") * (CELL_SIZE - 36);
    const clusterSize = 4 + Math.floor(randomAt(cluster, "count") * 9);
    const biomeOpen = randomAt(cluster, "open") > 0.78;
    if (biomeOpen) continue;
    for (let item = 0; item < clusterSize; item += 1) {
      const index = cluster * 23 + item;
      const angle = randomAt(index, "angle") * TAU;
      const radius = Math.sqrt(randomAt(index, "radius")) * (10 + randomAt(cluster, "spread") * 30);
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      if (x < bounds.minX + 3 || x > bounds.maxX - 3 || z < bounds.minZ + 3 || z > bounds.maxZ - 3) continue;
      const nearRoad = terrainRoadSegments.some((road) => {
        const dx = road.b.x - road.a.x;
        const dz = road.b.z - road.a.z;
        const length2 = dx * dx + dz * dz || 1;
        const t = clamp(((x - road.a.x) * dx + (z - road.a.z) * dz) / length2, 0, 1);
        return Math.hypot(x - (road.a.x + dx * t), z - (road.a.z + dz * t)) < road.width * 0.7 + 15;
      });
      if (nearRoad) continue;
      if (course.depots.some((depot) => Math.hypot(depot.x - x, depot.z - z) < 70)) continue;
      const y = localHeight(x, z);
      const height = 8 + randomAt(index, "height") * 13;
      vegetation.push({
        id: `${cell.id}:tree:${index}`,
        variant: randomAt(index, "variant") > 0.52 ? "b" : "a",
        position: [x, y, z],
        scale: [0.72 + randomAt(index, "width") * 0.62, height / 12, 0.72 + randomAt(index, "width2") * 0.62],
        rotation: randomAt(index, "rotation") * TAU,
        obstacleRadius: 1.4 + height * 0.05
      });
    }
  }

  for (let index = 0; index < 150; index += 1) {
    const x = bounds.minX + randomAt(index, "grass-x") * CELL_SIZE;
    const z = bounds.minZ + randomAt(index, "grass-z") * CELL_SIZE;
    const nearRoad = terrainRoadSegments.some((road) => {
      const dx = road.b.x - road.a.x;
      const dz = road.b.z - road.a.z;
      const length2 = dx * dx + dz * dz || 1;
      const t = clamp(((x - road.a.x) * dx + (z - road.a.z) * dz) / length2, 0, 1);
      return Math.hypot(x - (road.a.x + dx * t), z - (road.a.z + dz * t)) < road.width * 0.65 + 5;
    });
    if (nearRoad) continue;
    const y = localHeight(x, z);
    grass.push({
      id: `${cell.id}:grass:${index}`,
      position: [x, y, z],
      scale: [0.65 + randomAt(index, "grass-sx") * 1.05, 0.65 + randomAt(index, "grass-sy") * 1.1, 0.65 + randomAt(index, "grass-sz") * 1.05],
      rotation: randomAt(index, "grass-r") * TAU
    });
  }

  for (const road of roads.filter((entry) => entry.type === "rough-shortcut")) {
    if (randomAt(hashText(road.id), "rock") < 0.58) continue;
    const t = 0.22 + randomAt(hashText(road.id), "rock-t") * 0.56;
    const x = road.a.x + (road.b.x - road.a.x) * t;
    const z = road.a.z + (road.b.z - road.a.z) * t;
    const headingValue = Math.atan2(road.b.x - road.a.x, road.b.z - road.a.z);
    const side = randomAt(hashText(road.id), "rock-side") > 0.5 ? 1 : -1;
    const px = x + Math.cos(headingValue) * road.width * 0.35 * side;
    const pz = z - Math.sin(headingValue) * road.width * 0.35 * side;
    rocks.push({ id: `${road.id}:rock`, x: px, y: localHeight(px, pz), z: pz, radius: 1.5 });
  }

  return {
    schema: "long-haul.course-cell/3",
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
