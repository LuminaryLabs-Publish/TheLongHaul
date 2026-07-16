import { clamp, hashText, segmentInfo } from "./shared.mjs";

export function nearestRoad(course, point) {
  let best = null;
  for (const edge of course?.edges ?? []) {
    for (let index = 1; index < edge.samples.length; index += 1) {
      const info = segmentInfo(point, edge.samples[index - 1], edge.samples[index]);
      if (!best || info.distance < best.distance) best = { ...info, edge, segmentIndex: index - 1 };
    }
  }
  return best;
}

export function nearestDepot(course, point) {
  let best = null;
  for (const depot of course?.depots ?? []) {
    const distance = Math.hypot(point.x - depot.x, point.z - depot.z);
    if (!best || distance < best.distance) best = { depot, distance };
  }
  return best;
}

export function terrainNoise(x, z, seed) {
  const sample = (sx, sz, salt) => {
    const h = hashText(`${seed}:${salt}:${sx}:${sz}`);
    return (h & 0xffff) / 0xffff;
  };
  const valueNoise = (px, pz, salt) => {
    const xi = Math.floor(px);
    const zi = Math.floor(pz);
    const tx = px - xi;
    const tz = pz - zi;
    const fade = (t) => t * t * (3 - 2 * t);
    const a = sample(xi, zi, salt);
    const b = sample(xi + 1, zi, salt);
    const c = sample(xi, zi + 1, salt);
    const d = sample(xi + 1, zi + 1, salt);
    const top = a + (b - a) * fade(tx);
    const bottom = c + (d - c) * fade(tx);
    return top + (bottom - top) * fade(tz);
  };
  const broad = (valueNoise(x * 0.0018, z * 0.0018, "broad") - 0.5) * 18;
  const medium = (valueNoise(x * 0.0065, z * 0.0065, "medium") - 0.5) * 5;
  const detail = (valueNoise(x * 0.019, z * 0.019, "detail") - 0.5) * 1.2;
  return broad + medium + detail - 1.5;
}

export function terrainHeight(course, x, z) {
  const natural = terrainNoise(x, z, course?.seed ?? "long-haul");
  const road = nearestRoad(course, { x, z });
  if (!road) return natural;
  const flattenRadius = road.edge.width * 0.75 + 14;
  const blend = clamp(1 - road.distance / flattenRadius, 0, 1);
  const smoothBlend = blend * blend * (3 - 2 * blend);
  return natural * (1 - smoothBlend);
}
