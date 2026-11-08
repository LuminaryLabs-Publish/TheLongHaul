// Product-owned art direction. The same functions feed worker terrain and
// distant terrain; the driving surface remains owned by the road generator.
import { hashText } from './shared.mjs';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a, b, t) => a + (b - a) * t;
export function smoothRange(a, b, x) { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); }
function noise(seed, x, z, salt) {
  const ix = Math.floor(x), iz = Math.floor(z), u = smoothRange(0, 1, x - ix), v = smoothRange(0, 1, z - iz);
  const h = (a, b) => (hashText(`${seed}:land:${salt}:${a}:${b}`) >>> 0) / 4294967295;
  return mix(mix(h(ix, iz), h(ix + 1, iz), u), mix(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
}
export const ATMOSPHERE_PROFILE = Object.freeze({ clearNear: 240, clearFar: 1600,
  rainNear: 200, rainFar: 1280, rollStart: 1000, rollEnd: 2800, visualRadius: 68000,
  cloudBanks: 24, cloudLayers: 3, cloudBanksPerLayer: 8, shadowLift: .07 });

export function landscapeRelief(seed, x, z) {
  // The v2 mainline and bypass envelope stays within 180 m of the axis.
  // Keep that valley clear; no per-vertex road reconstruction is required.
  // The entire freight fork and optional bypass lie within the clear corridor.
  // Hills emerge outside it rather than obstructing roads or changing grades.
  const corridor = smoothRange(180, 420, Math.abs(x));
  if (corridor === 0) return 0;
  const province = noise(seed, x / 3400, z / 3400, 'province');
  const broad = noise(seed, x / 1000, z / 1250, 'ridge');
  const ridge = 1 - Math.abs(2 * broad - 1);
  const hills = Math.pow(ridge, 1.7) * (55 + province * 130);
  const rolling = noise(seed, x / 340, z / 420, 'rolling') * 18;
  return corridor * (hills + rolling);
}

// Natural terrain authority for the opt-in V3 world. Unlike the V2 illustrated
// relief, it never clears an artificial straight corridor at x=0: the highway
// must choose a route through the pre-existing landscape. Pure world-coordinate
// sampling allows chunk-independent reconstruction with no mutable RNG.
export function roadV3NaturalHeight(seed, x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z)) throw new TypeError('V3 terrain requires finite world coordinates');
  const province = noise(seed, x / 5200, z / 5600, 'v3-province');
  const shoulder = noise(seed, x / 2600, z / 2900, 'v3-shoulder');
  const ridgeBasis = noise(seed, x / 1450, z / 1700, 'v3-ridges');
  const ridge = Math.pow(1 - Math.abs(ridgeBasis * 2 - 1), 2.7);
  const valley = noise(seed, x / 2800, z / 3100, 'v3-valleys');
  const foothills = noise(seed, x / 760, z / 900, 'v3-foothills');
  const detail = noise(seed, x / 195, z / 230, 'v3-detail');
  const warped = (noise(seed, x / 2300, z / 2600, 'v3-warp') - .5) * 950;
  const mountainBelt = Math.pow(Math.max(0, Math.sin((x * .62 + z * .78 + warped) / 900)), 3);
  return -24 + mountainBelt * (45 + 105 * province) + (35 + 145 * province) * ridge + (shoulder - .5) * 55
    - 32 * Math.pow(valley, 2) + (foothills - .5) * 17 + (detail - .5) * 3.5;
}

export function landscapeTint(seed, x, z, height = 0) {
  const region = noise(seed, x / 2800, z / 3100, 'palette');
  const field = noise(seed, x / 230, z / 230, 'field');
  const ridge = smoothRange(75, 170, height);
  // Linear RGB. Broad color blocks, not a photo texture or per-vertex glitter.
  const meadow = [.25 + field * .10, .43 + field * .13, .19 + field * .06];
  const highland = [.23 + field * .07, .36 + field * .10, .28 + field * .06];
  const blend = smoothRange(.33, .72, region);
  return meadow.map((c, i) => mix(mix(c, highland[i], blend), [.50, .43, .32][i], ridge * .65));
}

export function atmosphericRollOff(distance) {
  if (!Number.isFinite(distance) || distance <= ATMOSPHERE_PROFILE.rollStart) return 0;
  const { rollStart, rollEnd, visualRadius } = ATMOSPHERE_PROFILE;
  return distance * distance / (2 * visualRadius) * smoothRange(rollStart, rollEnd, distance);
}

// Stable per-seed slots. Runtime offsets are derived from world travel,
// rather than accumulating frame deltas, so pauses and replay are deterministic.
export function wrapCloudOffset(value, period) {
  return ((value + period / 2) % period + period) % period - period / 2;
}
export function cloudBankDescriptors(seed = 'long-haul-sky') {
  const unit = (id, salt) => (hashText(`${seed}:cloud:${id}:${salt}`) >>> 0) / 4294967295;
  const types = ['cumulus','cumulonimbus','cirrus','stratus'];
  const dimensions = {cumulus:[260,140],cumulonimbus:[260,270],cirrus:[350,75],stratus:[390,88]};
  return Array.from({length:ATMOSPHERE_PROFILE.cloudBanks},(_,id)=>{
    const layer=Math.floor(id/ATMOSPHERE_PROFILE.cloudBanksPerLayer);
    const slot=id%ATMOSPHERE_PROFILE.cloudBanksPerLayer;
    const type=types[(slot+Math.floor(unit(layer,'type-offset')*4))%4];
    const [width,height]=dimensions[type];
    const band=[{distance:850,span:1650,follow:.95,wind:1.3},
      {distance:1180,span:2200,follow:.975,wind:.85},
      {distance:1480,span:2800,follow:.99,wind:.45}][layer];
    // Eight slots across each band, with a slight seeded jitter. Most clouds
    // remain forward-facing, with open gaps that let the sky and sun breathe.
    return {id,type,layer,width:width*(.85+unit(id,'size')*.35),height:height*(.85+unit(id,'height')*.3),
      lateral:((slot+.5)/ATMOSPHERE_PROFILE.cloudBanksPerLayer-.5)*band.span+(unit(id,'jitter')-.5)*band.span*.095,
      depth:band.distance+(unit(id,'depth')-.5)*band.distance*.32,
      altitude:[350,470,600][layer]+unit(id,'altitude')*[55,70,85][layer],
      span:band.span,follow:band.follow,wind:band.wind*(.65+unit(id,'wind')*.7),
      variation:unit(id,'variation')};
  });
}

export function freightHudModel(freight, position, cargoCondition, elapsed) {
  if (!freight) return null;
  const c = freight.contract, transition = ['delivered', 'cargo-lost'].includes(freight.status);
  const roadProgress=Number.isFinite(position?.progress)?position.progress:-(position?.z??0);
  const distance = Math.max(0, (freight.onboard ? c.deliveryProgress : c.pickupProgress) - roadProgress);
  return { transition, onboard: freight.onboard, urgent: Boolean(freight.onboard && c.remaining < 20),
    status: transition ? (freight.status === 'delivered' ? 'DELIVERY COMPLETE' : 'REPLACEMENT INCOMING') : freight.onboard ? 'DELIVER TO THE BLUE GATE' : 'PICK UP YOUR NEXT LOAD',
    next: transition ? 'Keep driving · next contract incoming' : `${freight.onboard ? 'Receiver' : 'Loading fork'} · ${Math.round(distance)} m`,
    mass: transition ? '' : freight.onboard ? `${(c.massKg / 1000).toFixed(1)} t onboard · ${Math.round(cargoCondition)}% cargo` : `${(c.massKg / 1000).toFixed(1)} t awaiting pickup`,
    timerLabel: freight.onboard ? 'Cargo deadline' : 'Journey', seconds: freight.onboard ? c.remaining : elapsed };
}
