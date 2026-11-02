// Game-owned ability execution. The host owns obstacle removal, vehicle impulses
// and rendering; this module owns eligibility, active-time cooldowns and hit proof.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const number = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const copy = value => structuredClone(value);
const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const own = (object, key) => Object.hasOwn(object, key);

export const ABILITY_DEFINITIONS = Object.freeze({
  "mini-trucks": Object.freeze({
    id: "mini-trucks", name: "Mini Trucks", shortName: "MINIS", icon: "▰",
    description: "Launch three miniature trucks ahead. They smash crates and shove traffic aside.",
    upgradeDescription: "More trucks, longer reach and a shorter recharge.",
    cooldown: 12, minimumCooldown: 5, requiresGround: true,
  }),
  "road-shield": Object.freeze({
    id: "road-shield", name: "Road Shield", shortName: "SHIELD", icon: "◇",
    description: "Absorb the next two impacts for six seconds, protecting cargo and steering.",
    upgradeDescription: "More protected impacts, longer protection and a shorter recharge.",
    cooldown: 18, minimumCooldown: 8, requiresGround: false,
  }),
  shockwave: Object.freeze({
    id: "shockwave", name: "Shockwave", shortName: "PULSE", icon: "◉",
    description: "Clear nearby breakable hazards and push surrounding traffic away.",
    upgradeDescription: "A wider clearing radius, stronger push and a shorter recharge.",
    cooldown: 16, minimumCooldown: 7, requiresGround: false,
  }),
});

export const ABILITY_LIMITS = Object.freeze({
  maxStep: 0.25,
  maxMiniTrucks: 12,
  maxPulses: 3,
  maxObstacles: 256,
  maxLevel: 1_000_000,
  maxDistanceFromPlayer: 230,
  maxRecentHits: 512,
});

const DEFAULT_SLOTS = Object.freeze({ q: "mini-trucks", e: "road-shield" });
const DEFAULT_LEVELS = Object.freeze({ "mini-trucks": 1, "road-shield": 1, shockwave: 0 });

function poseOf(truck) {
  const position = truck?.position;
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z) || !Number.isFinite(truck.heading)) return null;
  return {
    x: position.x, y: number(position.y), z: position.z,
    heading: truck.heading, speed: clamp(Math.abs(number(truck.speed)), 0, 100),
    grounded: truck.grounded !== false, tipped: truck.tipped === true,
  };
}

function validId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 160 && !/[\u0000-\u001f]/.test(value);
}

function obstaclesOf(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  const ids = new Set();
  for (const item of value.slice(0, ABILITY_LIMITS.maxObstacles)) {
    if (!item || !validId(item.id) || ids.has(item.id) || !Number.isFinite(item.x) || !Number.isFinite(item.z) || item.active === false) continue;
    ids.add(item.id);
    result.push({
      id: item.id, x: item.x, z: item.z, y: number(item.y),
      radius: clamp(number(item.radius, 1.5), 0.1, 16),
      destructible: item.destructible === true, kind: String(item.kind ?? "obstacle"),
    });
  }
  return result;
}

// First contact along the swept segment, including an initial overlap. This
// prevents a fast mini from passing straight through a thin streamed obstacle.
export function sweptAbilityContact(start, end, obstacle, radius = 0.7) {
  if (![start?.x, start?.z, end?.x, end?.z, obstacle?.x, obstacle?.z, obstacle?.radius, radius].every(Number.isFinite)) return null;
  const dx = end.x - start.x, dz = end.z - start.z;
  const ox = start.x - obstacle.x, oz = start.z - obstacle.z;
  const combinedRadius = Math.max(0, obstacle.radius) + Math.max(0, radius);
  const c = ox * ox + oz * oz - combinedRadius * combinedRadius;
  if (c <= 0) return 0;
  const a = dx * dx + dz * dz;
  if (a <= 1e-12) return null;
  const b = 2 * (ox * dx + oz * dz);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

/**
 * Slots and levels are persistent progression; this state is per-run execution.
 * Every mutating gameplay method requires context.active === true. The host
 * must call it only from the same simulation clock that advances truck motion.
 */
export function createActiveAbilities(options = {}) {
  let slots = { ...DEFAULT_SLOTS };
  let levels = { ...DEFAULT_LEVELS };
  let cooldowns = Object.fromEntries(Object.keys(ABILITY_DEFINITIONS).map(id => [id, 0]));
  let clock = 0, sequence = 0, run = 0;
  let miniTrucks = [], pulses = [];
  let shield = { remaining: 0, charges: 0, reduction: 1 };
  let activations = 0, hits = 0, expired = 0;
  const recentHits = new Map();
  const shieldReceipts = new Map();

  function snapshot() {
    return copy({ slots, levels, cooldowns, clock, miniTrucks, pulses, shield, activations, hits, expired, recentHits: recentHits.size });
  }

  // Only resumable timers/protection belong to a freight save. Traveling
  // projectiles and pulse contacts are deliberately retired when reloading.
  function checkpoint() {
    return copy({ schema: "long-haul.ability-checkpoint/1", cooldowns, shield });
  }

  function restoreCheckpoint(value) {
    const object = input => input && typeof input === "object" && !Array.isArray(input);
    if (!object(value) || value.schema !== "long-haul.ability-checkpoint/1" || !object(value.cooldowns) || !object(value.shield)) return { accepted: false, reason: "invalid-checkpoint" };
    if (Object.keys(value.cooldowns).length !== Object.keys(ABILITY_DEFINITIONS).length || Object.keys(value.cooldowns).some(id => !own(ABILITY_DEFINITIONS, id))) return { accepted: false, reason: "invalid-cooldowns" };
    for (const id of Object.keys(ABILITY_DEFINITIONS)) {
      const remaining = value.cooldowns[id];
      if (!Number.isFinite(remaining) || remaining < 0 || remaining > ABILITY_DEFINITIONS[id].cooldown) return { accepted: false, reason: "invalid-cooldowns" };
    }
    const protection = value.shield;
    if (!Number.isFinite(protection.remaining) || protection.remaining < 0 || protection.remaining > 12 ||
        !Number.isInteger(protection.charges) || protection.charges < 0 || protection.charges > 5 || protection.reduction !== 1 ||
        (protection.remaining > 0) !== (protection.charges > 0)) return { accepted: false, reason: "invalid-shield" };
    cooldowns = { ...value.cooldowns };
    shield = { remaining: protection.remaining, charges: protection.charges, reduction: 1 };
    miniTrucks = []; pulses = [];
    recentHits.clear(); shieldReceipts.clear();
    return { accepted: true };
  }

  function configure(value = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return { accepted: false, reason: "invalid-configuration" };
    const nextLevels = { ...levels };
    if (value.levels !== undefined) {
      if (!value.levels || typeof value.levels !== "object" || Array.isArray(value.levels)) return { accepted: false, reason: "invalid-levels" };
      for (const [id, level] of Object.entries(value.levels)) {
        if (!own(ABILITY_DEFINITIONS, id) || !Number.isSafeInteger(level) || level < 0 || level > ABILITY_LIMITS.maxLevel) return { accepted: false, reason: "invalid-levels" };
        nextLevels[id] = level;
      }
    }
    const nextSlots = value.slots === undefined ? { ...slots } : { ...value.slots };
    if (!nextSlots || Object.keys(nextSlots).some(key => key !== "q" && key !== "e") ||
        !own(ABILITY_DEFINITIONS, nextSlots.q) || !own(ABILITY_DEFINITIONS, nextSlots.e) ||
        nextSlots.q === nextSlots.e || nextLevels[nextSlots.q] < 1 || nextLevels[nextSlots.e] < 1) {
      return { accepted: false, reason: "invalid-slots" };
    }
    levels = nextLevels;
    slots = nextSlots;
    return { accepted: true, slots: { ...slots }, levels: { ...levels } };
  }

  function reset(value = {}) {
    const configured = configure(value);
    if (!configured.accepted) return configured;
    cooldowns = Object.fromEntries(Object.keys(ABILITY_DEFINITIONS).map(id => [id, 0]));
    clock = sequence = activations = hits = expired = 0;
    run = run >= 1_000_000_000 ? 1 : run + 1;
    miniTrucks = []; pulses = [];
    shield = { remaining: 0, charges: 0, reduction: 1 };
    recentHits.clear(); shieldReceipts.clear();
    return snapshot();
  }

  function tuning(id, enhancement = 0) {
    const level = Math.max(0, levels[id] - 1);
    const tier = level / (level + 6);
    const bonus = clamp(number(enhancement), 0, 2);
    const definition = ABILITY_DEFINITIONS[id];
    return {
      tier, bonus,
      cooldown: Math.max(definition.minimumCooldown, definition.cooldown * (1 - tier * 0.45) / (1 + bonus * 0.2)),
      count: 3 + Math.min(2, Math.floor(level / 3)),
      lifetime: 4.5 + tier * 2 + bonus * 0.3,
      maxTravel: 160 + tier * 45 + bonus * 10,
      push: 8 + tier * 6 + bonus * 2,
    };
  }

  function activate(slot, context = {}) {
    if (context.active !== true) return { accepted: false, reason: "inactive", events: [] };
    const key = typeof slot === "string" ? slot.toLowerCase() : "";
    if (key !== "q" && key !== "e") return { accepted: false, reason: "invalid-slot", events: [] };
    const abilityId = slots[key];
    const pose = poseOf(context.truck);
    if (!pose || pose.tipped) return { accepted: false, reason: "unavailable", events: [] };
    if (ABILITY_DEFINITIONS[abilityId].requiresGround && !pose.grounded) return { accepted: false, reason: "airborne", events: [] };
    if (cooldowns[abilityId] > 1e-9) return { accepted: false, reason: "cooldown", abilityId, remaining: cooldowns[abilityId], events: [] };
    const spec = tuning(abilityId, context.enhancement);
    if (abilityId === "mini-trucks" && miniTrucks.length + spec.count > ABILITY_LIMITS.maxMiniTrucks) return { accepted: false, reason: "entity-capacity", events: [] };
    if (abilityId === "shockwave" && pulses.length >= ABILITY_LIMITS.maxPulses) return { accepted: false, reason: "entity-capacity", events: [] };

    sequence = sequence >= 1_000_000_000 ? 1 : sequence + 1;
    const id = `ability:${run}:${sequence}`;
    const position = { x: pose.x, y: pose.y, z: pose.z };
    cooldowns[abilityId] = spec.cooldown;
    activations += 1;
    if (abilityId === "mini-trucks") {
      const forward = { x: Math.sin(pose.heading), z: Math.cos(pose.heading) };
      for (let index = 0; index < spec.count; index += 1) {
        const side = (index - (spec.count - 1) / 2) * 2.1;
        miniTrucks.push({
          id: `${id}:mini:${index}`, abilityId,
          x: pose.x + forward.x * 6 + forward.z * side,
          y: pose.y, z: pose.z + forward.z * 6 - forward.x * side,
          heading: pose.heading, speed: Math.min(88, Math.max(22, pose.speed + 14) * (1 + spec.tier * 0.12 + spec.bonus * 0.05)),
          remaining: spec.lifetime, travel: 0, maxTravel: spec.maxTravel,
          push: spec.push, radius: 0.7, targetId: null,
        });
      }
    } else if (abilityId === "road-shield") {
      shield = {
        remaining: 6 + spec.tier * 4 + spec.bonus,
        charges: Math.min(5, 2 + Math.floor(Math.max(0, levels[abilityId] - 1) / 3) + Math.floor(spec.bonus)),
        reduction: 1,
      };
      shieldReceipts.clear();
    } else {
      pulses.push({ id, abilityId, ...position, radius: 0, maxRadius: 13 + spec.tier * 9 + spec.bonus * 2, remaining: 0.65, duration: 0.65, push: spec.push + 4, hitIds: [] });
    }
    return { accepted: true, abilityId, slot: key, cooldown: spec.cooldown, events: [{ id, kind: "ability-start", abilityId, position }] };
  }

  function rememberHit(id) {
    if (recentHits.has(id)) return false;
    if (recentHits.size >= ABILITY_LIMITS.maxRecentHits) return false;
    recentHits.set(id, clock + 8);
    return true;
  }

  function hitEvent(abilityId, entity, obstacle, position) {
    hits += 1;
    return {
      id: `${entity.id}:hit:${obstacle.id}`, kind: "ability-hit", abilityId,
      obstacleId: obstacle.id, obstacleKind: obstacle.kind, position,
      destroy: obstacle.destructible, damage: 1,
      push: entity.push, disabledSeconds: obstacle.destructible ? 0 : 1.5,
      direction: { x: Math.sin(entity.heading ?? Math.atan2(obstacle.x - entity.x, obstacle.z - entity.z)), z: Math.cos(entity.heading ?? Math.atan2(obstacle.x - entity.x, obstacle.z - entity.z)) },
    };
  }

  function tick(dt, context = {}) {
    if (context.active !== true || !Number.isFinite(dt) || dt <= 0) return { events: [] };
    const pose = poseOf(context.truck);
    if (!pose) return { events: [] };
    const step = Math.min(dt, ABILITY_LIMITS.maxStep);
    clock += step;
    const events = [];
    const obstacles = obstaclesOf(context.obstacles);
    for (const id of Object.keys(cooldowns)) {
      cooldowns[id] = Math.max(0, cooldowns[id] - step);
      if (cooldowns[id] < 1e-9) cooldowns[id] = 0;
    }
    for (const [id, until] of recentHits) if (until <= clock) recentHits.delete(id);
    for (const [id, receipt] of shieldReceipts) if (receipt.until <= clock) shieldReceipts.delete(id);
    if (shield.remaining > 0) {
      shield.remaining = Math.max(0, shield.remaining - step);
      if (shield.remaining < 1e-9) shield.remaining = 0;
      if (!shield.remaining) {
        shield.charges = 0;
        events.push({ kind: "ability-end", abilityId: "road-shield", reason: "expired" });
      }
    }

    const nextMinis = [];
    for (const mini of miniTrucks) {
      if (!mini.remaining || mini.travel >= mini.maxTravel || Math.hypot(mini.x - pose.x, mini.z - pose.z) > ABILITY_LIMITS.maxDistanceFromPlayer) {
        expired += 1;
        events.push({ id: mini.id, kind: "ability-end", abilityId: mini.abilityId, reason: "expired" });
        continue;
      }
      // Seek only nearby targets in a forward cone. Keeping turn rate bounded
      // makes movement readable, and absent streamed targets never remain held.
      let target = null, targetDistance = Infinity;
      for (const obstacle of obstacles) {
        if (recentHits.has(obstacle.id)) continue;
        const dx = obstacle.x - mini.x, dz = obstacle.z - mini.z;
        const distance = Math.hypot(dx, dz);
        if (distance > 55 || distance < 0.01 || Math.abs(angleDifference(Math.atan2(dx, dz), mini.heading)) > 0.42) continue;
        if (distance < targetDistance) { target = obstacle; targetDistance = distance; }
      }
      mini.targetId = target?.id ?? null;
      let desiredHeading = target ? Math.atan2(target.x - mini.x, target.z - mini.z) : mini.heading;
      if (!target && typeof context.roadHeadingAt === "function") {
        const roadHeading = context.roadHeadingAt(mini.x, mini.z, mini.heading);
        if (Number.isFinite(roadHeading) && Math.abs(angleDifference(roadHeading, mini.heading)) < 1.2) desiredHeading = roadHeading;
      }
      const moveStep = Math.min(step, mini.remaining, Math.max(0, mini.maxTravel - mini.travel) / mini.speed);
      mini.remaining = Math.max(0, mini.remaining - step);
      mini.heading += clamp(angleDifference(desiredHeading, mini.heading), -0.75 * moveStep, 0.75 * moveStep);
      const start = { x: mini.x, z: mini.z };
      const distance = mini.speed * moveStep;
      const end = { x: mini.x + Math.sin(mini.heading) * distance, z: mini.z + Math.cos(mini.heading) * distance };
      let contact = null, contactTime = Infinity;
      for (const obstacle of obstacles) {
        if (recentHits.has(obstacle.id)) continue;
        const time = sweptAbilityContact(start, end, obstacle, mini.radius);
        if (time !== null && time < contactTime) { contact = obstacle; contactTime = time; }
      }
      if (contact) {
        if (rememberHit(contact.id)) {
          const position = { x: start.x + (end.x - start.x) * contactTime, y: mini.y, z: start.z + (end.z - start.z) * contactTime };
          events.push(hitEvent(mini.abilityId, mini, contact, position));
        }
        continue;
      }
      mini.x = end.x; mini.z = end.z; mini.travel += distance;
      if (typeof context.groundHeightAt === "function") {
        const height = context.groundHeightAt(mini.x, mini.z);
        if (Number.isFinite(height)) mini.y = height;
      }
      if (mini.remaining > 1e-9 && mini.travel < mini.maxTravel - 1e-9) nextMinis.push(mini);
      else {
        expired += 1;
        events.push({ id: mini.id, kind: "ability-end", abilityId: mini.abilityId, reason: "expired" });
      }
    }
    miniTrucks = nextMinis;

    const nextPulses = [];
    for (const pulse of pulses) {
      pulse.remaining = Math.max(0, pulse.remaining - step);
      if (pulse.remaining < 1e-9) pulse.remaining = 0;
      pulse.radius = pulse.maxRadius * (1 - pulse.remaining / pulse.duration);
      for (const obstacle of obstacles) {
        if (pulse.hitIds.includes(obstacle.id) || recentHits.has(obstacle.id) || Math.hypot(obstacle.x - pulse.x, obstacle.z - pulse.z) > pulse.radius + obstacle.radius) continue;
        if (!rememberHit(obstacle.id)) continue;
        pulse.hitIds.push(obstacle.id);
        events.push(hitEvent(pulse.abilityId, pulse, obstacle, { x: obstacle.x, y: obstacle.y, z: obstacle.z }));
      }
      if (pulse.remaining > 0) nextPulses.push(pulse);
      else events.push({ id: pulse.id, kind: "ability-end", abilityId: pulse.abilityId, reason: "expired" });
    }
    pulses = nextPulses;
    return { events };
  }

  function absorbDamage(amount, context = {}) {
    const damage = Number.isFinite(amount) && amount > 0 ? amount : 0;
    if (context.active !== true || !damage) return { damage, absorbed: 0, shielded: false, events: [] };
    const id = validId(context.id) ? context.id : null;
    if (id && shieldReceipts.has(id)) return { ...copy(shieldReceipts.get(id).result), duplicate: true, events: [] };
    if (!shield.charges || !shield.remaining) return { damage, absorbed: 0, shielded: false, events: [] };
    shield.charges -= 1;
    const result = {
      damage: damage * (1 - shield.reduction), absorbed: damage * shield.reduction, shielded: true,
      events: [{ kind: "shield-hit", abilityId: "road-shield", absorbed: damage * shield.reduction, remaining: shield.charges }],
    };
    if (!shield.charges) shield.remaining = 0;
    if (id && shieldReceipts.size < 64) shieldReceipts.set(id, { until: clock + 2, result: copy(result) });
    return result;
  }

  reset();
  configure(options);
  return { snapshot, checkpoint, restoreCheckpoint, configure, reset, activate, tick, absorbDamage };
}
