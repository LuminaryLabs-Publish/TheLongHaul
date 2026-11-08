import { ROAD_V3_VERSION, roadV3TerrainHeight } from './road-v3-geometry.mjs';
import { roadV3Project } from './road-v3-journey.mjs';
import { landscapeRelief, roadV3NaturalHeight } from './landscape-style.mjs';
import { roadCrossSection, roadPlaneHeight, roadTerrainHeight } from "./road-surface.mjs";
import { candidateRoadSegments, terrainRoadSegments } from "./road-spatial-index.mjs";
import { clamp, hashText, segmentInfo } from "./shared.mjs";

export function nearestRoad(course, point) {
  if (course?.generatorVersion === ROAD_V3_VERSION) {
    const hit = roadV3Project(course, point, {hint:point.progressHint??null});
    if (!hit) return null;
    const edge = course.edges.find(entry => entry.id === hit.edgeId);
    if (!edge) return null;
    const a = edge.samples[hit.segmentIndex], b = edge.samples[hit.segmentIndex+1];
    const t = Math.max(0, Math.min(1, (hit.progress-a.progress)/(b.progress-a.progress||1)));
    return {...hit, edge, t, heading:Math.atan2(b.x-a.x,b.z-a.z)};
  }
  let best = null;
  for (const {a,b,edge,segmentIndex} of candidateRoadSegments(course,point)) {
    const info=segmentInfo(point,a,b);
    if(!best||info.distance<best.distance)best={...info,edge,segmentIndex};
  }
  if (best?.edge.modular) { const cross = roadCrossSection(best.edge, best.segmentIndex, best.t); best.edge = { ...best.edge, width: cross.width }; }
  return best;
}


// V3 road deck contact uses the same sampled mesh frame as rendering, including
// banked lanes and multi-level bridges. Natural terrain remains the fallback.
// V2 never calls this path and retains its historical ground query.
export function roadV3GroundContact(course, position) {
  if (course?.generatorVersion !== ROAD_V3_VERSION) return null;
  const road=nearestRoad(course,position);
  if(!road || !Number.isFinite(road.y) || road.distance > road.edge.width*.55+1.4) return null;
  const a=road.edge.samples[road.segmentIndex],b=road.edge.samples[road.segmentIndex+1];
  if(!a||!b)return null;
  const t=road.t, grade=a.grade+(b.grade-a.grade)*t,
    bank=(a.bank??0)+((b.bank??0)-(a.bank??0))*t;
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,
    fx=dx/len,fz=dz/len,nx=fz,nz=-fx;
  const x=-grade*fx-bank*nx,z=-grade*fz-bank*nz,m=Math.hypot(x,1,z);
  return {height:road.y,normal:{x:x/m,y:1/m,z:z/m},road};
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
  if (road.edge?.modular) return roadPlaneHeight(road);
  const base = terrainNoise(road.x, road.z, course?.seed ?? "long-haul") * 0.72;
  // Endless sections share an absolute phase. Edge-local phases produce a
  // small but repeated suspension kick whenever a generated boundary is crossed.
  if (course?.endless && road.edge?.endless) return base + Math.sin(-road.z * 0.025) ** 4 * 0.08;
  const phase = Number(road.segmentIndex ?? 0) + Number(road.t ?? 0);
  const seedPhase = (hashText(road.edge?.id ?? "road") % 6283) / 1000;
  const wave = Math.max(0, Math.sin(phase * 0.9 + seedPhase));
  const surface = road.edge?.surface ?? (road.edge?.type === "rough-shortcut" ? "dirt" : "paved");
  const rough = surface === "dirt";
  const gravel = surface === "gravel";
  const crest = rough ? Math.pow(wave, 8) * 2.5 : gravel ? Math.pow(wave, 10) * 0.72 : Math.pow(wave, 14) * 0.12;
  return base + crest;
}

export function naturalTerrainHeight(course, x, z) {
  const seed = course?.seed ?? "long-haul";
  if (course?.generatorVersion === ROAD_V3_VERSION && course?.terrainAware) return roadV3NaturalHeight(seed, x, z);
  return terrainNoise(x, z, seed) + (['long-haul-endless-v2',ROAD_V3_VERSION].includes(course?.generatorVersion) ? landscapeRelief(seed, x, z) : 0);
}

export function terrainHeight(course, x, z) {
  const natural = naturalTerrainHeight(course, x, z);
  if (course?.generatorVersion === ROAD_V3_VERSION) return roadV3TerrainHeight(natural, course, {x,z});
  let road = null;
  for(const {a,b,edge,segmentIndex} of terrainRoadSegments(course,{x,z})) {
    const info=segmentInfo({x,z},a,b);
    if(!road||info.distance<road.distance)road={...info,edge,segmentIndex};
  }
  if (!road) return natural;
  if (road.edge?.modular) return roadTerrainHeight(natural, road, x, z);
  const flattenRadius = road.edge.width * 0.78 + 16;
  if (road.distance >= flattenRadius) return natural;
  const blend = clamp(1 - road.distance / flattenRadius, 0, 1);
  const smoothBlend = blend * blend * (3 - 2 * blend);
  return natural + (roadElevation(course, road) - natural) * smoothBlend;
}
