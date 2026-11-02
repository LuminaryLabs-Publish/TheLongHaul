// Game-owned risk/reward accounting. Time advances only with the active simulation.
const RULES = Object.freeze({
  safeSeconds: 4,
  crashCooldown: 1.2,
  awardInterval: 0.15,
  maxStep: 0.25,
  maxIds: 4096,
  maxDestructionAwards: 8,
});

const LABELS = Object.freeze({
  "near-miss": "NEAR MISS",
  stunt: "AIRTIME",
  landing: "AIRTIME",
  destruction: "SMASH",
});

/**
 * One ledger per run. Only reset() admits the same encounter ID in a new run.
 * The host supplies real collision/pass/landing evidence; this ledger validates
 * thresholds, lifetime deduplication, pacing, active time, and settlement.
 */
export function createArcadeScore() {
  const seen = new Set();
  let multiplier;
  let pending;
  let banked;
  let events;
  let comboEvents;
  let destructionEvents;
  let remaining;
  let bestMultiplier;
  let lastEvent;
  let lastPoints;
  let cooldown;
  let awardCooldown;
  let active;
  let bankCount;
  let lostTotal;

  function snapshot() {
    return {
      multiplier, pending, banked, events, comboEvents, destructionEvents,
      remaining, bestMultiplier, lastEvent, lastPoints, cooldown,
      awardCooldown, active, bankCount, lostTotal, seenIds: seen.size,
    };
  }

  function reset() {
    seen.clear();
    multiplier = bestMultiplier = 1;
    pending = banked = events = comboEvents = destructionEvents = 0;
    remaining = cooldown = awardCooldown = bankCount = lostTotal = 0;
    lastEvent = "";
    lastPoints = 0;
    active = true;
    return snapshot();
  }

  function reject(reason) {
    return { accepted: false, points: 0, reason, multiplier };
  }

  function event(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return reject("invalid-event");
    const { id, kind, speed, clearance, airTime, distance } = input;
    const forward = input.forward === undefined ? true : input.forward;
    const clean = input.clean === undefined ? true : input.clean;
    if (typeof id !== "string" || !id.trim() || id.trim().length > 160 || /[\u0000-\u001f]/.test(id)) {
      return reject("invalid-id");
    }
    const key = id.trim();
    if (typeof kind !== "string" || !Object.hasOwn(LABELS, kind)) return reject("invalid-kind");
    if (!Number.isFinite(speed) || speed < 0 ||
        [clearance, airTime, distance].some(value => value !== undefined && !Number.isFinite(value)) ||
        typeof forward !== "boolean" || typeof clean !== "boolean" ||
        (input.active !== undefined && typeof input.active !== "boolean")) return reject("invalid-evidence");
    if (!active || input.active === false) return reject("inactive");
    if (!forward) return reject("reverse");
    if (seen.has(key)) return reject("duplicate");
    if (seen.size >= RULES.maxIds) return reject("session-capacity");
    if (cooldown > 0) return reject("crash-cooldown");
    if (awardCooldown > 0) return reject("event-spacing");

    let basePoints;
    if (kind === "near-miss") {
      if (speed < 12 || !Number.isFinite(clearance) || clearance <= 0.05 || clearance > 1.8 || !clean) {
        return reject("unsafe-pass");
      }
      basePoints = 100;
    } else if (kind === "stunt" || kind === "landing") {
      if (speed < 10 || !Number.isFinite(airTime) || airTime < 0.6 ||
          !Number.isFinite(distance) || distance < 8 || !clean) return reject("unsafe-landing");
      basePoints = 150 + Math.round(Math.min(2.4, airTime - 0.6) * 50);
    } else {
      if (speed < 10 || !clean) return reject("unsafe-destruction");
      if (destructionEvents >= RULES.maxDestructionAwards) return reject("destruction-capacity");
      basePoints = 25;
      destructionEvents += 1;
    }

    seen.add(key);
    events += 1;
    comboEvents += 1;
    multiplier = Math.min(5, 1 + Math.floor(comboEvents / 2));
    bestMultiplier = Math.max(bestMultiplier, multiplier);
    const points = basePoints * multiplier;
    pending += points;
    remaining = RULES.safeSeconds;
    awardCooldown = RULES.awardInterval;
    lastEvent = LABELS[kind];
    lastPoints = points;
    return { accepted: true, id: key, kind, points, basePoints, multiplier, pending, label: lastEvent };
  }

  function bank(reason = "manual") {
    const points = pending;
    pending = remaining = comboEvents = 0;
    multiplier = 1;
    if (points <= 0) return null;
    banked += points;
    bankCount += 1;
    lastEvent = "BANKED";
    lastPoints = points;
    return { points, banked, reason, bankCount };
  }

  function tick(dt, options = {}) {
    active = (options?.active ?? true) === true;
    if (!active || !Number.isFinite(dt) || dt <= 0) return null;
    const step = Math.min(dt, RULES.maxStep);
    cooldown = Math.max(0, cooldown - step);
    awardCooldown = Math.max(0, awardCooldown - step);
    if (cooldown < 1e-9) cooldown = 0;
    if (awardCooldown < 1e-9) awardCooldown = 0;
    if (!pending) return null;
    remaining = Math.max(0, remaining - step);
    return remaining <= 1e-9 ? bank("safe") : null;
  }

  function crash(reason = "collision") {
    const lost = pending;
    pending = remaining = comboEvents = 0;
    multiplier = 1;
    cooldown = RULES.crashCooldown;
    awardCooldown = 0;
    lostTotal += lost;
    lastEvent = lost ? "COMBO LOST" : "RECOVER";
    lastPoints = 0;
    return { lost, banked, reason, cooldown };
  }

  reset();
  return { snapshot, event, tick, crash, bank, reset };
}
