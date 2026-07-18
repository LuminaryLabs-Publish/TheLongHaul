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
  const broad = (valueNoise(x * 0.00085, z * 0.00085, "broad") - 0.5) * 34;
  const rolling = (valueNoise(x * 0.0028, z * 0.0028, "rolling") - 0.5) * 15;
  const medium = (valueNoise(x * 0.0075, z * 0.0075, "medium") - 0.5) * 5.5;
  const detail = (valueNoise(x * 0.022, z * 0.022, "detail") - 0.5) * 1.4;
  return broad + rolling + medium + detail - 2;
}

export function roadElevation(course, road) {
  if (!road) return 0;
  const base = terrainNoise(road.x, road.z, course?.seed ?? "long-haul") * 0.72;
  const phase = Number(road.segmentIndex ?? 0) + Number(road.t ?? 0);
  const seedPhase = (hashText(road.edge?.id ?? "road") % 6283) / 1000;
  const wave = Math.max(0, Math.sin(phase * 0.9 + seedPhase));
  const rough = road.edge?.type === "rough-shortcut";
  const country = road.edge?.type !== "long-safe";
  const crest = rough ? Math.pow(wave, 8) * 2.8 : country ? Math.pow(wave, 12) * 0.65 : 0;
  return base + crest;
}

export function terrainHeight(course, x, z) {
  const natural = terrainNoise(x, z, course?.seed ?? "long-haul");
  const road = nearestRoad(course, { x, z });
  if (!road) return natural;
  const flattenRadius = road.edge.width * 0.78 + 16;
  const blend = clamp(1 - road.distance / flattenRadius, 0, 1);
  const smoothBlend = blend * blend * (3 - 2 * blend);
  return natural + (roadElevation(course, road) - natural) * smoothBlend;
}
