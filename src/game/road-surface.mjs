// Shared sampled-road geometry. Rendering and physical height queries use
// the same cross-sections; no independent worker or collision spline is used.
const mix = (a, b, t) => a + (b - a) * t;
export function roadCrossSection(edge, segmentIndex = 0, t = 0) {
  const a = edge?.samples?.[segmentIndex], b = edge?.samples?.[segmentIndex + 1] ?? a;
  if (!a || !b || !Number.isFinite(a.width)) return null;
  return { width: mix(a.width, b.width, t), laneFactor: mix(a.laneFactor, b.laneFactor, t),
    y: mix(a.y, b.y, t), bank: mix(a.bank, b.bank, t), nx: mix(a.nx, b.nx, t), nz: mix(a.nz, b.nz, t) };
}
export function roadRibbonData(roads, widthScale = 1, yOffset = 0) {
  const positions = [], uvs = [], indices = [];
  for (const road of roads) {
    const start = positions.length / 3;
    for (const p of [road.a, road.b]) {
      const half = p.width * widthScale / 2;
      for (const side of [-1, 1]) {
        const offset = half * side;
        positions.push(p.x + p.nx * offset, p.y + yOffset + p.bank * offset, p.z + p.nz * offset);
        uvs.push((side + 1) / 2, p.progress / 10);
      }
    }
    indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
  }
  return { positions, uvs, indices };
}
export function roadPlaneHeight(road, x = road.x, z = road.z) {
  const p = roadCrossSection(road.edge, road.segmentIndex, road.t);
  return p ? p.y + ((x - road.x) * p.nx + (z - road.z) * p.nz) * p.bank : null;
}
export function roadTerrainHeight(natural, road, x, z, bedOnly = false, meshMargin = 0) {
  const p = roadCrossSection(road.edge, road.segmentIndex, road.t);
  if (!p) return null;
  // A grass grid triangle may span past the edge of the paved footprint.
  // Extend ONLY its subgrade flattening by one mesh-cell diagonal so no
  // interpolated earth triangle can rise through the canonical driving deck.
  // Physical road/shoulder sampling stays exactly on the existing contract.
  const half = p.width * .68 + (bedOnly ? Math.max(0, meshMargin) : 0), radius = half + 22;
  const q = Math.max(0, Math.min(1, (road.distance - half) / (radius - half)));
  const blend = 1 - q * q * (3 - 2 * q);
  const height = roadPlaneHeight(road, x, z);
  // The deck stays at its canonical height; only the visible valley floor is
  // lowered. Gameplay still samples the rendered deck inside its footprint.
  const a = road.edge.samples[road.segmentIndex], b = road.edge.samples[road.segmentIndex + 1];
  const bridge = a?.structure === 'bridge' && b?.structure === 'bridge';
  const valley = Math.min(natural, height - 9);
  if (bridge && !bedOnly && road.distance > half) return natural + (valley - natural) * blend;
  const bed = bedOnly ? (bridge ? valley : height - .45) : height;
  return natural + (bed - natural) * blend;
}
