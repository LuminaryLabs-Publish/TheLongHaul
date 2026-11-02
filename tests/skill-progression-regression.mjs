import assert from 'node:assert/strict';
import {
  createSkillProgression, migrateSkillSave, normalizeSkillProgression,
  SKILL_LIMITS, SKILL_UPGRADES, skillLevelThreshold, skillUpgradeCost,
} from '../src/game/skill-progression.mjs';

const pass = (id, overrides = {}) => ({ id, kind: 'near-miss', speed: 22, clearance: 0.8, ...overrides });
const slide = (id, overrides = {}) => ({ id, kind: 'drift', speed: 24, duration: 1.5, distance: 30, angle: 0.3, ...overrides });
const land = (id, overrides = {}) => ({ id, kind: 'landing', speed: 18, airTime: 1.2, distance: 24, ...overrides });
const progress = saved => { const result = createSkillProgression(saved); result.startRun('test-run'); return result; };
let checks = 0;
function check(name, fn) { fn(); checks += 1; console.log(`PASS ${name}`); }

check('legacy cash, upgrades, receipts and earnings survive migration unchanged', () => {
  const old = { cash: 8800, upgrades: { engine: 4, tires: 3 }, deliveries: 9, careerMiles: 71.25,
    completedCampaignAttempts: ['paid-1'], unknownFutureField: { enabled: true } };
  const migrated = migrateSkillSave(old);
  const { skillProgression, ...preserved } = migrated;
  assert.deepEqual(preserved, old);
  assert.equal(skillProgression.totalXp, 0);
  assert.deepEqual(skillProgression.slots, { q: 'mini-trucks', e: 'road-shield' });
  assert.equal(skillProgression.abilities.shockwave, 0);
  migrated.upgrades.engine = 0;
  assert.equal(old.upgrades.engine, 4, 'migration must not alias old mutable fields');
});

check('malformed numbers, arrays, duplicate slots and prototype names normalize safely', () => {
  for (const value of [null, [], 'bad', Infinity]) {
    assert.equal(createSkillProgression(value).snapshot().totalXp, 0);
  }
  const result = createSkillProgression({ totalXp: NaN, spentPoints: -3,
    stats: { engine: Infinity, brakes: -1, grip: '100' },
    modifiers: [], abilities: { 'mini-trucks': -1, 'road-shield': 1, shockwave: 2 },
    slots: { q: 'shockwave', e: 'shockwave' }, revision: Infinity });
  assert.deepEqual(result.snapshot().stats, { engine: 0, brakes: 0, grip: 0, suspension: 0, armor: 0 });
  assert.notEqual(result.snapshot().slots.q, result.snapshot().slots.e);
  assert.equal(result.purchase('constructor').reason, 'unknown-upgrade');
  assert.equal(result.equip('__proto__', 'q').reason, 'undiscovered-ability');
  for (const value of Object.values(result.effects()).filter(value => typeof value === 'number')) assert.ok(Number.isFinite(value));
});

check('XP qualifies actual driving and refuses invalid, stopped, reverse or paused evidence', () => {
  const skill = progress();
  const invalid = [
    null, [], pass(''), pass('x\nID'), pass('x'.repeat(161)), pass('a', { speed: '24' }),
    pass('b', { speed: NaN }), pass('c', { speed: Infinity }), pass('d', { clearance: 0 }),
    pass('e', { clearance: 1.81 }), pass('f', { clearance: 0.05 }), pass('g', { speed: 11.9 }),
    pass('h', { forward: false }), pass('i', { clean: false }), pass('j', { active: false }),
    pass('k', { clean: 'true' }), slide('l', { duration: 0.49 }), slide('m', { distance: 3.9 }),
    slide('n', { angle: 0.119 }), slide('o', { speed: 7.99 }), slide('p', { angle: Infinity }),
    land('q', { airTime: 0.59 }), land('r', { distance: 7.99 }), land('s', { clean: false }),
    slide('t', { kind: 'countersteer', reserve: 0 }), slide('u', { kind: 'countersteer', reserve: 2, exitSpeed: 0 }),
    { id: 'v', kind: 'combo', speed: 20, count: 2, duration: 5 },
    { id: 'w', kind: 'combo', speed: 20, count: 3, duration: 2.9 },
    { id: 'x', kind: 'combo', speed: 20, count: 3.5, duration: 5 },
    { id: 'y', kind: 'constructor', speed: 20 },
  ];
  for (const input of invalid) assert.equal(skill.event(input).accepted, false, JSON.stringify(input));
  assert.equal(skill.snapshot().totalXp, 0);
  const first = skill.event(pass('valid-pass'));
  assert.equal(first.xp, 35);
  skill.setActive(false);
  const frozen = skill.snapshot();
  assert.equal(skill.event(slide('paused')).reason, 'inactive');
  assert.deepEqual(skill.snapshot(), frozen);
  skill.setActive(true);
  assert.equal(skill.event(slide('paused')).accepted, true);
  assert.equal(createSkillProgression().event(pass('no-session')).reason, 'no-run');
});

check('all skill families award once per maneuver, including across save reload', () => {
  const skill = progress();
  const events = [slide('drift'), slide('countersteer', { kind: 'countersteer', reserve: 4, exitSpeed: 15 }),
    pass('near-miss'), land('jump'), { id: 'combo', kind: 'combo', speed: 22, count: 4, duration: 5 }];
  for (const input of events) {
    const receipt = skill.event(input);
    assert.equal(receipt.accepted, true, input.kind);
    assert.ok(receipt.xp > 0 && receipt.xp <= 100);
    assert.equal(skill.event(input).reason, 'duplicate');
  }
  assert.equal(skill.event({ ...events[0], kind: 'countersteer', reserve: 2, exitSpeed: 10 }).reason, 'duplicate', 'same maneuver cannot pay both slide and exit');
  assert.equal(skill.event({ ...events[3], kind: 'stunt' }).reason, 'duplicate', 'landing aliases are not separate rewards');
  const restored = createSkillProgression(JSON.parse(JSON.stringify(skill.serialize())));
  restored.startRun('test-run');
  for (const input of events) assert.equal(restored.event(input).reason, 'duplicate');
  assert.equal(restored.snapshot().totalXp, skill.snapshot().totalXp);
  restored.startRun('new-run');
  assert.equal(restored.event(events[0]).accepted, true, 'fresh run has its own maneuver identities');
  const snap = restored.snapshot(); snap.stats.engine = 999; snap.seenIds.length = 0;
  assert.equal(restored.snapshot().stats.engine, 0);
  assert.equal(restored.event(events[0]).reason, 'duplicate');
});

check('milestones grant points exactly once, without changing cash or combo multiplier', () => {
  const skill = progress();
  assert.equal(skill.snapshot().level, 1);
  assert.equal(skill.snapshot().xpToNext, 100);
  const receipts = [skill.event(pass('one')), skill.event(pass('two')), skill.event(pass('three'))];
  assert.deepEqual(receipts.map(item => item.pointsEarned), [0, 0, 1]);
  assert.equal(skill.snapshot().totalXp, 105);
  assert.equal(skill.snapshot().level, 2);
  assert.equal(skill.snapshot().points, 1);
  assert.equal(skill.snapshot().xpIntoLevel, 5);
  assert.equal(skill.snapshot().nextLevelXp, 240);
  const before = skill.snapshot();
  skill.event(pass('three'));
  assert.deepEqual(skill.snapshot(), before);
  assert.equal('cash' in before, false);
  assert.equal('multiplier' in before, false);
});

check('temporary pickup XP multiplies earned skill awards within a strict bound', () => {
  const skill = progress({ totalXp: 100, modifiers: { 'combo-focus': 1 } });
  const permanent = skill.effects().xpMultiplier;
  assert.equal(skill.event(pass('focus', { xpMultiplier: 1.35 })).xp, Math.round(35 * permanent * 1.35));
  assert.equal(skill.event(pass('too-large', { xpMultiplier: Number.MAX_VALUE })).xp, Math.round(35 * permanent * 1.35));
  assert.equal(skill.event(pass('negative', { xpMultiplier: -50 })).xp, Math.round(35 * permanent));
  for (const value of [NaN, Infinity, '1.2', null]) assert.equal(skill.event(pass('invalid-' + String(value), { xpMultiplier: value })).reason, 'invalid-evidence');
  assert.equal(skill.event(pass('ordinary')).xp, Math.round(35 * permanent));
});

check('purchases enforce costs, prerequisites and stale offers and visibly change effects', () => {
  const skill = progress({ totalXp: skillLevelThreshold(12) });
  const before = skill.effects(), revision = skill.snapshot().revision;
  assert.equal(skill.purchase('drift-reserve').reason, 'prerequisite');
  const bought = skill.purchase('engine', { expectedRevision: revision });
  assert.equal(bought.accepted, true);
  assert.equal(bought.cost, 1);
  assert.equal(skill.snapshot().points, 10);
  assert.ok(skill.effects().accelerationMultiplier > before.accelerationMultiplier * 1.07);
  assert.ok(skill.effects().visual.exhaust > before.visual.exhaust);
  assert.equal(skill.purchase('brakes', { expectedRevision: revision }).reason, 'stale-choice');
  assert.equal(skill.purchase('grip').accepted, true);
  assert.equal(skill.purchase('drift-reserve').accepted, true);
  assert.equal(skill.purchase('boost-tuning').accepted, true);
  assert.equal(skill.purchase('armor').accepted, true);
  assert.ok(skill.effects().armorMultiplier < 1);
  assert.ok(skill.effects().driftReserveMultiplier > 1);
  assert.ok(skill.effects().boostMultiplier > 1);
  const save = skill.serialize(), restored = createSkillProgression(JSON.parse(JSON.stringify(save)));
  assert.deepEqual(restored.snapshot().stats, save.stats);
  assert.deepEqual(restored.snapshot().modifiers, save.modifiers);
  assert.equal(restored.snapshot().points, save.points);
  assert.deepEqual(restored.effects(), skill.effects());
  const empty = progress();
  assert.equal(empty.purchase('engine').reason, 'insufficient-points');
  assert.equal(empty.snapshot().stats.engine, 0);
});

check('three deterministic choices rotate across independently purchasable families', () => {
  const skill = progress({ totalXp: skillLevelThreshold(8), stats: { engine: 1, grip: 1 } });
  assert.deepEqual(skill.candidates(), skill.candidates());
  const seen = new Set();
  for (let page = 0; page < 30; page += 1) {
    const choices = skill.candidates({ page });
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map(item => item.id)).size, 3);
    assert.deepEqual(new Set(choices.map(item => item.kind)), new Set(['stat', 'modifier', 'ability']));
    for (const item of choices) { seen.add(item.id); assert.ok(item.effectText.length > 20); }
  }
  assert.deepEqual(seen, new Set(SKILL_UPGRADES.map(item => item.id)));
  assert.equal(skill.purchase('engine').accepted, true);
  assert.equal(skill.purchase('combo-focus').accepted, true);
  assert.equal(skill.purchase('road-shield').accepted, true);
  assert.ok(skill.effects().xpMultiplier > 1);
  assert.ok(skill.effects().comboWindow > 4);
});

check('ability discovery explicitly replaces one slot and keeps two distinct powers', () => {
  const skill = progress({ totalXp: skillLevelThreshold(6) });
  assert.deepEqual(skill.snapshot().slots, { q: 'mini-trucks', e: 'road-shield' });
  const before = skill.snapshot();
  assert.equal(skill.purchase('shockwave').reason, 'slot-required');
  assert.deepEqual(skill.snapshot(), before, 'missing replacement must not spend points');
  const acquired = skill.purchase('shockwave', { slot: 'e' });
  assert.equal(acquired.accepted, true);
  assert.equal(acquired.replaced, 'road-shield');
  assert.deepEqual(skill.snapshot().slots, { q: 'mini-trucks', e: 'shockwave' });
  assert.equal(skill.equip('shockwave', 'q').reason, 'already-equipped');
  assert.equal(skill.equip('road-shield', 'q').accepted, true);
  assert.deepEqual(skill.snapshot().slots, { q: 'road-shield', e: 'shockwave' });
  assert.equal(skill.snapshot().abilities['mini-trucks'], 1, 'replaced abilities remain discovered');
  assert.equal(skill.equip('road-shield', 'r').reason, 'invalid-slot');
  const restored = createSkillProgression(skill.serialize());
  assert.deepEqual(restored.snapshot().slots, skill.snapshot().slots);
  assert.equal(restored.snapshot().points, skill.snapshot().points);
});

check('upgrade costs scale while high tiers and XP remain finite and bounded', () => {
  assert.equal(skillUpgradeCost('engine', 0), 1);
  assert.equal(skillUpgradeCost('engine', 4), 2);
  assert.equal(skillUpgradeCost('engine', 40), 11);
  const skill = progress({ totalXp: Number.MAX_SAFE_INTEGER,
    stats: Object.fromEntries(SKILL_UPGRADES.filter(item => item.kind === 'stat').map(item => [item.id, 1e100])),
    modifiers: Object.fromEntries(SKILL_UPGRADES.filter(item => item.kind === 'modifier').map(item => [item.id, 1e100])) });
  assert.equal(skill.snapshot().level, SKILL_LIMITS.maxLevel);
  assert.equal(skill.snapshot().xpToNext, 0);
  assert.ok(Number.isSafeInteger(skill.snapshot().totalXp));
  assert.equal(skill.event(pass('max-xp')).reason, 'progression-capacity');
  assert.equal(skill.purchase('engine').reason, 'max-tier');
  const effects = skill.effects();
  for (const value of Object.values(effects).filter(value => typeof value === 'number')) assert.ok(Number.isFinite(value));
  assert.ok(effects.accelerationMultiplier <= 1.45 && effects.speedMultiplier <= 1.18);
  assert.ok(effects.gripMultiplier <= 1.3 && effects.brakeMultiplier <= 1.4);
  assert.ok(effects.armorMultiplier >= 0.5 && effects.driftReserveMultiplier <= 1.5);
  assert.ok(effects.boostMultiplier <= 1.45 && effects.xpMultiplier <= 1.75);
  assert.ok(effects.comboWindow <= 7 && effects.abilityEnhancement <= 0.6);
  for (const level of [1, 2, 3, 10, 1000, 100000, SKILL_LIMITS.maxLevel]) {
    const xp = skillLevelThreshold(level);
    assert.equal(createSkillProgression({ totalXp: xp }).snapshot().level, level);
    if (level > 1) assert.equal(createSkillProgression({ totalXp: xp - 1 }).snapshot().level, level - 1);
  }
});

check('dedupe capacity fails closed and saved investment cannot duplicate available points', () => {
  const skill = progress({ totalXp: 100, stats: { engine: 1 }, spentPoints: 0 });
  assert.equal(skill.snapshot().points, 0);
  assert.equal(skill.purchase('brakes').reason, 'insufficient-points');
  const ids = Array.from({ length: SKILL_LIMITS.maxSeenIds }, (_, i) => `event-${i}`);
  const full = createSkillProgression({ runId: 'long-run', seenIds: ids });
  assert.equal(full.event(pass('extra')).reason, 'session-capacity');
  assert.equal(full.event(pass('event-0')).reason, 'duplicate');
  full.startRun('long-run');
  assert.equal(full.event(pass('extra')).reason, 'session-capacity');
  full.startRun('fresh-run');
  assert.equal(full.event(pass('extra')).accepted, true);
  assert.equal(normalizeSkillProgression({ runId: 'x', seenIds: [...ids, 'overflow'] }).seenIds.length, SKILL_LIMITS.maxSeenIds);
});

console.log(`Skill progression: ${checks} scenario groups passed.`);
