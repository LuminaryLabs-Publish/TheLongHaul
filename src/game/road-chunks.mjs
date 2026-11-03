// Product geometry only: no renderer, mutable RNG or unbounded journey history.
import { hashText } from './shared.mjs';

export const ROAD_GENERATOR_VERSION = 'long-haul-endless-v2';
export const LEGACY_ROAD_VERSION = 'long-haul-endless-v1';
export const ROAD_CHUNKS = Object.freeze({
  straight: { name: 'Open Highway', intensity: 0 },
  sweep: { name: 'Sweeping Bend', intensity: 1 },
  hill: { name: 'Rolling Summit', intensity: 1 },
  'lane-transition': { name: 'Lane Taper', intensity: 1 },
  'split-merge': { name: 'Scenic Bypass', intensity: 1, branch: true },
  bridge: { name: 'Valley Viaduct', intensity: 1, structure: 'bridge' },
  tunnel: { name: 'Mountain Gallery', intensity: 1, structure: 'tunnel' },
  'gravel-detour': { name: 'Gravel Detour', intensity: 1, branch: true },
  construction: { name: 'Road Works', intensity: 1 },
  freight: { name: 'Freight Relay', intensity: 0 }
});
export const ROAD_LIMITS = Object.freeze({ section: 320, travel: 640, cycle: 960,
  width: 28, minimumWidth: 21.2, sampleSpacing: 5, maxGrade: .16, maxCurvature: .018,
  maxBank: .035, cacheEntries: 64 });
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const unit = (seed, key) => hashText(`${seed}:roads-v2:${key}`) / 4294967295;
const smooth = t => { t = clamp(t, 0, 1); return t * t * t * (10 + t * (-15 + 6 * t)); };
// Position, first derivative and second derivative all vanish at both ends.
const bump = t => { t = clamp(t, 0, 1); return 64 * t ** 3 * (1 - t) ** 3; };
const cache = new Map();
const cached = (key, make) => {
  if (cache.has(key)) return cache.get(key);
  const value = Object.freeze(make()); cache.set(key, value);
  if (cache.size > ROAD_LIMITS.cacheEntries) cache.delete(cache.keys().next().value);
  return value;
};
export const roadChunkCacheSize = () => cache.size;

// Each 12-feature district contains every family, interspersed with recovery
// straights. Hash sorting gives variety without order-dependent RNG state.
function family(seed, index) {
  if (index < 0) return 'straight';
  const slot = index % 12;
  if (slot === 2 || slot === 5 || slot === 8 || slot === 11) return 'straight';
  const district = Math.floor(index / 12);
  const choices = cached(`${seed}:deck:${district}`, () =>
    Object.keys(ROAD_CHUNKS).filter(k => !['straight', 'freight'].includes(k))
      .sort((a, b) => unit(seed, `${district}:${a}`) - unit(seed, `${district}:${b}`) || a.localeCompare(b)));
  return choices[slot - Math.floor(slot / 3)];
}

export function roadChunkAt(seed, progress) {
  if (!Number.isFinite(progress)) throw new TypeError('Road progress must be finite');
  const station = Math.floor((progress - 320) / 960);
  const stationStart = 320 + station * 960;
  if (station >= 0 && progress < stationStart + 320) {
    return cached(`${seed}:station:${station}`, () => ({ id: `road:freight:${station}`,
      index: station, kind: 'freight', start: stationStart, end: stationStart + 320, length: 320,
      curve: 0, rise: 0, branchSide: -1, ...ROAD_CHUNKS.freight }));
  }
  const index = Math.floor((progress - 640) / 960);
  const start = index < 0 ? -320 + Math.min(0, Math.floor((progress + 320) / 960)) * 960 : 640 + index * 960;
  // Negative reconstruction is a simple shared base corridor, not a station.
  if (progress < 320) return { id: `road:approach:${Math.floor(progress / 640)}`, index: -1,
    kind: 'straight', start: Math.floor(progress / 640) * 640, end: (Math.floor(progress / 640) + 1) * 640,
    length: 640, curve: 0, rise: 0, branchSide: -1, ...ROAD_CHUNKS.straight };
  return cached(`${seed}:travel:${index}`, () => {
    const kind = family(seed, index), sign = unit(seed, `${index}:side`) < .5 ? -1 : 1;
    return { id: `road:travel:${index}`, index, kind, start, end: start + 640, length: 640,
      curve: kind === 'sweep' ? sign * (27 + unit(seed, `${index}:curve`) * 18) : 0,
      rise: kind === 'hill' ? (unit(seed, `${index}:valley`) < .35 ? -1 : 1) * (9 + unit(seed, `${index}:rise`) * 4) : kind === 'bridge' ? 10 : 0,
      branchSide: sign, ...ROAD_CHUNKS[kind] };
  });
}

function base(seed, progress, axis) {
  const span = 3840, i = Math.floor(progress / span), t = (progress - i * span) / span;
  const anchor = n => n === 0 ? 0 : (unit(seed, `${axis}:${n}`) - .5) * (axis === 'x' ? 150 : 16);
  return anchor(i) + (anchor(i + 1) - anchor(i)) * smooth(t);
}
function center(seed, s, route) {
  const chunk = roadChunkAt(seed, s), t = (s - chunk.start) / chunk.length;
  const b = bump(t);
  let x = base(seed, s, 'x') + chunk.curve * b;
  let y = base(seed, s, 'y') + chunk.rise * b;
  let width = 28, laneFactor = 5;
  if (chunk.kind === 'freight' && route !== 'risky') x -= 44 * b;
  if (route === 'branch' && chunk.branch) x += chunk.branchSide * 62 * b;
  if (['lane-transition', 'construction'].includes(chunk.kind)) {
    const taper = smooth((t - .12) / .25) * smooth((.88 - t) / .25);
    width -= 6.8 * taper; laneFactor -= 2 * taper;
  }
  if (route === 'risky' && chunk.kind === 'freight') { width = 28 - 18 * bump(t); laneFactor = 5 - 3 * bump(t); }
  if (route === 'branch' && chunk.branch) { width = 28 - 16 * bump(t); laneFactor = 5 - 3 * bump(t); }
  return { x, y, width, laneFactor, chunk, t };
}

/** Canonical cross-section used by descriptors, collision and road meshes. */
export function roadChunkSample(seed, progress, route = 'safe') {
  const p = center(seed, progress, route), h = .05;
  const a = center(seed, progress - h, route), b = center(seed, progress + h, route);
  const dx = (b.x - a.x) / (2 * h), dy = (b.y - a.y) / (2 * h);
  const dxx = (b.x - 2 * p.x + a.x) / (h * h);
  const heading = Math.atan2(dx, -1), curvature = dxx / (1 + dx * dx) ** 1.5;
  const bank = p.chunk.kind === 'sweep' ? clamp(-curvature * 14, -.035, .035) * bump(p.t) : 0;
  return { x: p.x, y: p.y, z: -progress, heading, nx: Math.cos(heading), nz: -Math.sin(heading),
    width: p.width, laneFactor: p.laneFactor, bank, grade: dy / Math.hypot(dx, 1), curvature,
    progress, chunkId: p.chunk.id, kind: p.chunk.kind,
    structure: p.t >= .22 && p.t <= .78 ? p.chunk.structure ?? null : null };
}

export function roadChunkContract(seed, chunk, atEnd = false, route = 'safe') {
  const s = atEnd ? chunk.end : chunk.start;
  const p = roadChunkSample(seed, s, route);
  return { position: { x: p.x, y: p.y, z: p.z }, heading: p.heading, curvature: p.curvature,
    grade: p.grade, width: p.width, lanes: p.laneFactor, bank: p.bank };
}

export function validateRoadChunk(seed, chunk) {
  const issues = [];
  for (let s = chunk.start; s <= chunk.end; s += 5) {
    const p = roadChunkSample(seed, s);
    if (![p.x, p.y, p.z, p.width, p.grade, p.curvature].every(Number.isFinite)) issues.push('nonfinite');
    if (Math.abs(p.grade) > ROAD_LIMITS.maxGrade) issues.push('grade');
    if (Math.abs(p.curvature) > ROAD_LIMITS.maxCurvature) issues.push('curvature');
    if (p.width < ROAD_LIMITS.minimumWidth - 1e-6) issues.push('width');
  }
  return { valid: !issues.length, issues: [...new Set(issues)] };
}
