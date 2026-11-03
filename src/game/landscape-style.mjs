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
  cloudBanks: 10, lobesPerBank: 7, shadowLift: .07 });

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

export function cloudBankDescriptors(seed = 'long-haul-sky') {
  const unit = (id, salt) => (hashText(`${seed}:cloud:${id}:${salt}`) >>> 0) / 4294967295;
  return Array.from({ length: ATMOSPHERE_PROFILE.cloudBanks }, (_, id) => {
    const angle = id / ATMOSPHERE_PROFILE.cloudBanks * Math.PI * 2 + .16 * unit(id, 'angle');
    const radius = 610 + unit(id, 'distance') * 290;
    return { id, x: Math.sin(angle) * radius, z: Math.cos(angle) * radius,
      y: 210 + unit(id, 'height') * 155, yaw: unit(id, 'yaw') * Math.PI,
      // One connected bank: four broad base lobes and three taller billows.
      // Overlap is intentional; a straight row of flattened ellipsoids reads
      // as separate flying disks instead of an illustrated cloud silhouette.
      lobes: [[-70,0,0,43,20,29],[-25,2,0,52,24,33],[25,0,0,50,22,32],[67,0,0,39,19,27],
        [-35,22,3,38,31,29],[8,34,0,41,39,33],[46,23,2,34,29,27]].map(([x,y,z,sx,sy,sz],j) => ({
          x, y: y + (unit(id * 9 + j,'rise') - .5) * 5,
          z: z + (unit(id * 9 + j,'z') - .5) * 8,
          sx: sx * (.95 + unit(id * 9 + j,'sx') * .1),
          sy: sy * (.95 + unit(id * 9 + j,'sy') * .1),
          sz: sz * (.95 + unit(id * 9 + j,'sz') * .1),
        })) };
  });
}

export function freightHudModel(freight, position, cargoCondition, elapsed) {
  if (!freight) return null;
  const c = freight.contract, transition = ['delivered', 'cargo-lost'].includes(freight.status);
  const distance = Math.max(0, (freight.onboard ? c.deliveryProgress : c.pickupProgress) + position.z);
  return { transition, onboard: freight.onboard, urgent: Boolean(freight.onboard && c.remaining < 20),
    status: transition ? (freight.status === 'delivered' ? 'DELIVERY COMPLETE' : 'REPLACEMENT INCOMING') : freight.onboard ? 'DELIVER TO THE BLUE GATE' : 'PICK UP YOUR NEXT LOAD',
    next: transition ? 'Keep driving · next contract incoming' : `${freight.onboard ? 'Receiver' : 'Loading fork'} · ${Math.round(distance)} m`,
    mass: transition ? '' : freight.onboard ? `${(c.massKg / 1000).toFixed(1)} t onboard · ${Math.round(cargoCondition)}% cargo` : `${(c.massKg / 1000).toFixed(1)} t awaiting pickup`,
    timerLabel: freight.onboard ? 'Cargo deadline' : 'Journey', seconds: freight.onboard ? c.remaining : elapsed };
}
