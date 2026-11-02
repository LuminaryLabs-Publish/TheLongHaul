// Career XP is independent of delivery cash and the temporary arcade multiplier.
// The host supplies completed, physical maneuvers; this ledger owns qualification,
// deduplication, milestone points, purchases, and the compatible save payload.
export const SKILL_LIMITS = Object.freeze({
  maxLevel: 1_000_000,
  maxTier: 10_000,
  maxSeenIds: 4096,
  maxRevision: Number.MAX_SAFE_INTEGER - 1,
});

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const integer = (value, fallback = 0, maximum = Number.MAX_SAFE_INTEGER) =>
  Number.isFinite(value) && value >= 0 ? Math.min(maximum, Math.floor(value)) : fallback;
const bounded = (value, low, high) => Math.max(low, Math.min(high, value));
const copy = value => structuredClone(value);
const validId = value => typeof value === 'string' && value.trim().length > 0 &&
  value.trim().length <= 160 && !/[\u0000-\u001f]/.test(value);

export function skillLevelThreshold(level) {
  const n = Math.max(0, integer(level, 1, SKILL_LIMITS.maxLevel) - 1);
  return 80 * n + 20 * n * n;
}

const MAX_XP = skillLevelThreshold(SKILL_LIMITS.maxLevel);
function levelForXp(xp) {
  let level = Math.min(SKILL_LIMITS.maxLevel, Math.floor((Math.sqrt(6400 + 80 * xp) - 80) / 40) + 1);
  // Guard the square-root boundary against floating-point rounding at high levels.
  while (level < SKILL_LIMITS.maxLevel && skillLevelThreshold(level + 1) <= xp) level += 1;
  while (level > 1 && skillLevelThreshold(level) > xp) level -= 1;
  return level;
}

export const SKILL_UPGRADES = Object.freeze([
  { id: 'engine', kind: 'stat', label: 'Engine response', description: 'Accelerate harder and raise your controlled top speed.', component: 'exhaust' },
  { id: 'brakes', kind: 'stat', label: 'Brake balance', description: 'Slow down faster before corners and recover your line.', component: 'brakes' },
  { id: 'grip', kind: 'stat', label: 'Road tires', description: 'Gain traction and recover lateral slides more confidently.', component: 'tires' },
  { id: 'suspension', kind: 'stat', label: 'Load suspension', description: 'Settle cargo and body motion with greater stability.', component: 'suspension' },
  { id: 'armor', kind: 'stat', label: 'Reinforced body', description: 'Reduce collision damage while keeping roadside recovery.', component: 'bodywork' },
  { id: 'drift-reserve', kind: 'modifier', label: 'Momentum control', description: 'Retain more of an earned drift reserve for your countersteer exit.', requires: { grip: 1 } },
  { id: 'boost-tuning', kind: 'modifier', label: 'Rush tuning', description: 'Increase boost force; the existing recharge still applies.', requires: { engine: 1 } },
  { id: 'combo-focus', kind: 'modifier', label: 'Combo focus', description: 'Earn more skill XP and gain a longer safe combo window.' },
  { id: 'ability-charge', kind: 'modifier', label: 'Ability amplifier', description: 'Improve both equipped powers independently of their own tiers.', minimumLevel: 2 },
  { id: 'mini-trucks', kind: 'ability', label: 'Mini Trucks', description: 'Deploy a stronger convoy that clears obstacles ahead.', initialLevel: 1 },
  { id: 'road-shield', kind: 'ability', label: 'Road Shield', description: 'Improve your temporary protection from impacts.', initialLevel: 1 },
  { id: 'shockwave', kind: 'ability', label: 'Shockwave', description: 'Clear nearby obstacles with a radial burst. Choose Q or E to equip it.', initialLevel: 0, minimumLevel: 2 },
].map(item => Object.freeze({ ...item, requires: item.requires ? Object.freeze(item.requires) : undefined })));

const DEFINITIONS = new Map(SKILL_UPGRADES.map(item => [item.id, item]));
const groupFor = kind => kind === 'stat' ? 'stats' : kind === 'modifier' ? 'modifiers' : 'abilities';
const defaultsFor = kind => Object.fromEntries(SKILL_UPGRADES.filter(item => item.kind === kind).map(item => [item.id, item.initialLevel || 0]));
const purchasedCount = (definition, tier) => Math.max(0, tier - (definition.initialLevel || 0));

export function skillUpgradeCost(id, tier = 0) {
  const definition = DEFINITIONS.get(id);
  if (!definition) return null;
  return 1 + Math.floor(purchasedCount(definition, integer(tier, definition.initialLevel || 0, SKILL_LIMITS.maxTier)) / 4);
}

function investmentFor(definition, tier) {
  const n = purchasedCount(definition, tier), groups = Math.floor(n / 4), remainder = n % 4;
  return n + 2 * groups * (groups - 1) + groups * remainder;
}

/** Pure nested-save migration. Legacy cash, garage upgrades and earnings stay host-owned. */
export function normalizeSkillProgression(value) {
  const source = record(value), state = {
    version: 1,
    totalXp: integer(source.totalXp ?? source.xp, 0, MAX_XP),
    spentPoints: 0,
    stats: defaultsFor('stat'),
    modifiers: defaultsFor('modifier'),
    abilities: defaultsFor('ability'),
    slots: { q: 'mini-trucks', e: 'road-shield' },
    revision: integer(source.revision, 0, SKILL_LIMITS.maxRevision),
    runId: validId(source.runId) ? source.runId.trim() : '',
    seenIds: [],
    awards: integer(source.awards, 0),
    lastAward: null,
  };
  let minimumSpent = 0;
  for (const definition of SKILL_UPGRADES) {
    const group = groupFor(definition.kind), original = record(source[group]);
    const tier = Math.max(definition.initialLevel || 0, integer(original[definition.id], definition.initialLevel || 0, SKILL_LIMITS.maxTier));
    state[group][definition.id] = tier;
    minimumSpent += investmentFor(definition, tier);
  }
  // Reconstructing the minimum spend prevents malformed or old saves from
  // granting already-purchased tiers and the same spendable points again.
  state.spentPoints = Math.max(minimumSpent, integer(source.spentPoints, minimumSpent, Number.MAX_SAFE_INTEGER));
  const savedSlots = record(source.slots);
  for (const slot of ['q', 'e']) {
    const id = savedSlots[slot];
    if (typeof id === 'string' && own(state.abilities, id) && state.abilities[id] > 0) state.slots[slot] = id;
  }
  if (state.slots.q === state.slots.e) {
    state.slots.e = Object.keys(state.abilities).find(id => id !== state.slots.q && state.abilities[id] > 0);
  }
  if (state.runId && Array.isArray(source.seenIds)) {
    state.seenIds = [...new Set(source.seenIds.filter(validId).map(id => id.trim()))].slice(0, SKILL_LIMITS.maxSeenIds);
  }
  return state;
}

/** Optional host helper: preserves all legacy and unrelated career fields. */
export function migrateSkillSave(save) {
  const original = record(save);
  return { ...copy(original), skillProgression: normalizeSkillProgression(original.skillProgression) };
}

const growth = (tier, cap, half) => cap * tier / (tier + half);
function deriveEffects(state) {
  const s = state.stats, m = state.modifiers;
  return {
    accelerationMultiplier: 1 + growth(s.engine, 0.45, 5),
    speedMultiplier: 1 + growth(s.engine, 0.18, 7),
    gripMultiplier: 1 + growth(s.grip, 0.30, 5),
    brakeMultiplier: 1 + growth(s.brakes, 0.40, 5),
    stabilityMultiplier: 1 + growth(s.suspension, 0.35, 5),
    armorMultiplier: 1 - growth(s.armor, 0.50, 6),
    driftReserveMultiplier: 1 + growth(m['drift-reserve'], 0.25, 5),
    boostMultiplier: 1 + growth(m['boost-tuning'], 0.45, 5),
    xpMultiplier: 1 + growth(m['combo-focus'], 0.75, 6),
    comboWindow: 4 + growth(m['combo-focus'], 3, 6),
    abilityEnhancement: growth(m['ability-charge'], 0.60, 5),
    visual: {
      tires: 1 + growth(s.grip, 0.22, 3),
      exhaust: 1 + growth(s.engine, 0.35, 4),
      suspension: 1 + growth(s.suspension, 0.24, 4),
      bodywork: growth(s.armor, 1, 4),
      brakes: growth(s.brakes, 1, 4),
    },
  };
}

function practicalEffect(definition, state) {
  const before = deriveEffects(state), next = copy(state);
  next[groupFor(definition.kind)][definition.id] += 1;
  const after = deriveEffects(next);
  const percent = value => `${(value * 100).toFixed(1)}%`;
  if (definition.id === 'engine') return `Acceleration ${percent(before.accelerationMultiplier - 1)} → ${percent(after.accelerationMultiplier - 1)}; top speed ${percent(after.speedMultiplier - 1)} above stock.`;
  if (definition.id === 'brakes') return `Braking ${percent(before.brakeMultiplier - 1)} → ${percent(after.brakeMultiplier - 1)} above stock.`;
  if (definition.id === 'grip') return `Traction ${percent(before.gripMultiplier - 1)} → ${percent(after.gripMultiplier - 1)} above stock.`;
  if (definition.id === 'suspension') return `Stability ${percent(before.stabilityMultiplier - 1)} → ${percent(after.stabilityMultiplier - 1)} above stock.`;
  if (definition.id === 'armor') return `Impact damage reduction ${percent(1 - before.armorMultiplier)} → ${percent(1 - after.armorMultiplier)}.`;
  if (definition.id === 'drift-reserve') return `Drift reserve retention ${percent(before.driftReserveMultiplier - 1)} → ${percent(after.driftReserveMultiplier - 1)} above stock; entry-speed safety cap remains.`;
  if (definition.id === 'boost-tuning') return `Boost force ${percent(before.boostMultiplier - 1)} → ${percent(after.boostMultiplier - 1)} above stock.`;
  if (definition.id === 'combo-focus') return `Skill XP +${percent(after.xpMultiplier - 1)}; safe combo window ${after.comboWindow.toFixed(1)} seconds.`;
  if (definition.id === 'ability-charge') return `Equipped ability enhancement ${percent(before.abilityEnhancement)} → ${percent(after.abilityEnhancement)}.`;
  if (state.abilities[definition.id] === 0) return definition.description;
  return `${definition.description} Tier ${state.abilities[definition.id]} → ${state.abilities[definition.id] + 1}.`;
}

function qualifies(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { reason: 'invalid-event' };
  if (!validId(input.id)) return { reason: 'invalid-id' };
  if (!Number.isFinite(input.speed) || input.speed < 0 ||
      ['duration', 'distance', 'angle', 'reserve', 'exitSpeed', 'clearance', 'airTime', 'count', 'xpMultiplier'].some(key => input[key] !== undefined && !Number.isFinite(input[key])) ||
      ['active', 'forward', 'clean'].some(key => input[key] !== undefined && typeof input[key] !== 'boolean')) return { reason: 'invalid-evidence' };
  if (input.active === false) return { reason: 'inactive' };
  if (input.forward === false) return { reason: 'reverse' };
  if (input.clean === false) return { reason: 'unclean' };
  const { kind, speed } = input;
  if (kind === 'drift' || kind === 'countersteer') {
    if (speed < 8 || !(input.duration >= 0.5) || !(input.distance >= 4) || !(Math.abs(input.angle) >= 0.12)) return { reason: 'insufficient-drift' };
    if (kind === 'countersteer' && (!(input.reserve >= 0.1) || (input.exitSpeed !== undefined && input.exitSpeed < 2))) return { reason: 'unreleased-reserve' };
    return { baseXp: Math.min(kind === 'countersteer' ? 100 : 80, (kind === 'countersteer' ? 40 : 20) + Math.floor(Math.min(input.duration, 5) * 8) + Math.floor(Math.min(input.distance, 100) / 5)) };
  }
  if (kind === 'near-miss') {
    if (speed < 12 || !(input.clearance > 0.05 && input.clearance <= 1.8)) return { reason: 'unsafe-pass' };
    return { baseXp: 35 };
  }
  if (kind === 'landing' || kind === 'stunt' || kind === 'jump') {
    if (speed < 10 || !(input.airTime >= 0.6) || !(input.distance >= 8)) return { reason: 'unsafe-landing' };
    return { baseXp: Math.min(90, 40 + Math.floor(Math.min(input.airTime, 3) * 10) + Math.floor(Math.min(input.distance, 100) / 10)) };
  }
  if (kind === 'combo') {
    if (speed < 10 || !(input.count >= 3) || !Number.isInteger(input.count) || !(input.duration >= 3)) return { reason: 'insufficient-combo' };
    return { baseXp: Math.min(90, 15 * input.count) };
  }
  if (kind === 'destruction') {
    if (speed < 10) return { reason: 'unsafe-destruction' };
    return { baseXp: 10 };
  }
  return { reason: 'invalid-kind' };
}

export function createSkillProgression(saved) {
  let state = normalizeSkillProgression(saved), active = true;
  let seen = new Set(state.seenIds);
  state.seenIds = [];
  const revision = () => { state.revision = Math.min(SKILL_LIMITS.maxRevision, state.revision + 1); };
  const pointBalance = () => Math.max(0, levelForXp(state.totalXp) - 1 - state.spentPoints);
  function snapshot() {
    const level = levelForXp(state.totalXp), threshold = skillLevelThreshold(level);
    const nextLevelXp = level < SKILL_LIMITS.maxLevel ? skillLevelThreshold(level + 1) : MAX_XP;
    return {
      ...copy(state), seenIds: [...seen], level,
      points: Math.max(0, level - 1 - state.spentPoints),
      earnedPoints: level - 1,
      nextLevelXp, xpIntoLevel: state.totalXp - threshold,
      xpToNext: Math.max(0, nextLevelXp - state.totalXp),
      levelSpan: nextLevelXp - threshold,
    };
  }
  function startRun(id) {
    if (!validId(id)) return { accepted: false, reason: 'invalid-run' };
    const next = id.trim();
    if (next !== state.runId) { state.runId = next; seen.clear(); state.lastAward = null; revision(); }
    return { accepted: true, runId: state.runId };
  }
  function event(input) {
    const proof = qualifies(input);
    if (proof.reason) return { accepted: false, xp: 0, reason: proof.reason };
    if (!active) return { accepted: false, xp: 0, reason: 'inactive' };
    if (!state.runId) return { accepted: false, xp: 0, reason: 'no-run' };
    const id = input.id.trim();
    if (seen.has(id)) return { accepted: false, xp: 0, reason: 'duplicate' };
    if (seen.size >= SKILL_LIMITS.maxSeenIds) return { accepted: false, xp: 0, reason: 'session-capacity' };
    const pickupMultiplier = bounded(input.xpMultiplier ?? 1, 1, 1.35);
    const xp = Math.min(MAX_XP - state.totalXp, Math.round(proof.baseXp * deriveEffects(state).xpMultiplier * pickupMultiplier));
    if (xp <= 0) return { accepted: false, xp: 0, reason: 'progression-capacity' };
    const previousLevel = levelForXp(state.totalXp);
    seen.add(id);
    state.totalXp += xp;
    state.awards = Math.min(Number.MAX_SAFE_INTEGER, state.awards + 1);
    const level = levelForXp(state.totalXp), pointsEarned = level - previousLevel;
    state.lastAward = { id, kind: input.kind, xp, level, pointsEarned };
    revision();
    return { accepted: true, ...copy(state.lastAward), totalXp: state.totalXp, points: pointBalance() };
  }
  function eligibility(definition) {
    const tier = state[groupFor(definition.kind)][definition.id];
    if (tier >= SKILL_LIMITS.maxTier) return 'max-tier';
    if (levelForXp(state.totalXp) < (definition.minimumLevel || 1)) return 'level-required';
    if (Object.entries(definition.requires || {}).some(([id, minimum]) => state.stats[id] < minimum)) return 'prerequisite';
    return null;
  }
  function describe(definition) {
    const level = state[groupFor(definition.kind)][definition.id], cost = skillUpgradeCost(definition.id, level);
    return {
      id: definition.id, kind: definition.kind, label: definition.label, title: definition.label,
      description: definition.description, effectText: practicalEffect(definition, state),
      level, nextLevel: level + 1, cost, affordable: pointBalance() >= cost,
      requiresSlot: definition.kind === 'ability' && level === 0,
      component: definition.component || null,
      prerequisites: copy(definition.requires || {}),
    };
  }
  function candidates(options = {}) {
    const count = bounded(integer(options.count, 3), 1, 3), page = integer(options.page, 0, 1_000_000);
    const rotation = Math.max(0, levelForXp(state.totalXp) - 2) + page;
    const groups = ['stat', 'modifier', 'ability'].map(kind => SKILL_UPGRADES.filter(item => item.kind === kind && !eligibility(item)));
    const selected = [];
    // One from each available family keeps the offer useful, while page rotation
    // exposes every eligible item. Purchases never lock a player into a family.
    for (const group of groups) if (group.length && selected.length < count) selected.push(group[rotation % group.length]);
    const remainder = SKILL_UPGRADES.filter(item => !eligibility(item) && !selected.includes(item));
    while (selected.length < count && remainder.length) selected.push(remainder.shift());
    return selected.map(describe);
  }
  function purchase(id, options = {}) {
    const definition = DEFINITIONS.get(id);
    if (!definition) return { accepted: false, reason: 'unknown-upgrade' };
    if (options.expectedRevision !== undefined && options.expectedRevision !== state.revision) return { accepted: false, reason: 'stale-choice' };
    const unavailable = eligibility(definition);
    if (unavailable) return { accepted: false, reason: unavailable };
    const group = groupFor(definition.kind), tier = state[group][id], cost = skillUpgradeCost(id, tier);
    if (pointBalance() < cost) return { accepted: false, reason: 'insufficient-points', cost };
    const discovery = definition.kind === 'ability' && tier === 0;
    if (discovery && !['q', 'e'].includes(options.slot)) return { accepted: false, reason: 'slot-required' };
    state.spentPoints += cost;
    state[group][id] += 1;
    let replaced = null;
    if (discovery) { replaced = state.slots[options.slot]; state.slots[options.slot] = id; }
    revision();
    return { accepted: true, id, level: state[group][id], cost, slot: discovery ? options.slot : null, replaced, revision: state.revision, points: pointBalance() };
  }
  function equip(id, slot) {
    if (!['q', 'e'].includes(slot)) return { accepted: false, reason: 'invalid-slot' };
    if (!own(state.abilities, id) || state.abilities[id] < 1) return { accepted: false, reason: 'undiscovered-ability' };
    const other = slot === 'q' ? 'e' : 'q';
    if (state.slots[other] === id) return { accepted: false, reason: 'already-equipped' };
    const replaced = state.slots[slot];
    if (replaced !== id) { state.slots[slot] = id; revision(); }
    return { accepted: true, id, slot, replaced, revision: state.revision };
  }
  return {
    snapshot, serialize: snapshot, startRun, event, candidates, purchase, equip,
    effects: () => deriveEffects(state),
    setActive: value => { active = value === true; },
  };
}
