import assert from "node:assert/strict";
import { ABILITY_DEFINITIONS, ABILITY_LIMITS, createActiveAbilities, sweptAbilityContact } from "../src/game/active-abilities.mjs";

const truck = { position: { x: 0, y: 1, z: 0 }, heading: 0, speed: 28, grounded: true, tipped: false };
const context = (overrides = {}) => ({ active: true, truck, obstacles: [], ...overrides });
const obstacle = (id, x, z, overrides = {}) => ({ id, x, z, radius: 1, destructible: true, kind: "crate", ...overrides });
function advance(abilities, seconds, options = {}) {
  const events = [];
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += 0.05) events.push(...abilities.tick(Math.min(0.05, seconds - elapsed), context(options)).events);
  return events;
}

// Equipment is progression-owned, while cooldowns stay attached to abilities.
{
  const abilities = createActiveAbilities();
  assert.deepEqual(abilities.snapshot().slots, { q: "mini-trucks", e: "road-shield" });
  assert.equal(abilities.activate("Q", context()).abilityId, "mini-trucks");
  assert.equal(abilities.activate("q", context()).reason, "cooldown");
  assert.equal(abilities.activate("E", context()).abilityId, "road-shield");
  assert.equal(abilities.snapshot().miniTrucks.length, 3);
  const before = abilities.snapshot();
  for (const configuration of [
    { slots: { q: "shockwave", e: "road-shield" } },
    { slots: { q: "road-shield", e: "road-shield" } },
    { slots: { q: "constructor", e: "road-shield" } },
    { slots: { q: "mini-trucks", e: "road-shield", r: "shockwave" } },
    { levels: { "mini-trucks": Infinity } },
    { levels: { "mini-trucks": -1 } },
    { levels: { "mini-trucks": "2" } },
    { levels: { "mini-trucks": 1.5 } },
    { levels: { fake: 1 } },
    null,
  ]) {
    assert.equal(abilities.configure(configuration).accepted, false);
    assert.deepEqual(abilities.snapshot(), before);
  }
  assert.equal(abilities.configure({ slots: { q: "road-shield", e: "mini-trucks" } }).accepted, true);
  assert.equal(abilities.activate("e", context()).reason, "cooldown");
  assert.equal(abilities.configure({ levels: { shockwave: 1 }, slots: { q: "shockwave", e: "mini-trucks" } }).accepted, true);
  assert.equal(abilities.activate("q", context()).abilityId, "shockwave");
  assert.equal(abilities.activate("e", context()).reason, "cooldown");
  assert.equal(abilities.snapshot().pulses.length, 1);
}

// Pause/menu/focus inactivity never changes positions, timers, charges or counters.
{
  const abilities = createActiveAbilities();
  abilities.activate("q", context());
  abilities.activate("e", context());
  const before = abilities.snapshot();
  for (const dt of [0.1, 100, NaN, Infinity, -1, "0.1"]) {
    assert.deepEqual(abilities.tick(dt, context({ active: false })).events, []);
    assert.deepEqual(abilities.snapshot(), before);
  }
  assert.equal(abilities.activate("q", context({ active: false })).reason, "inactive");
  assert.equal(abilities.absorbDamage(20, { active: false }).damage, 20);
  assert.deepEqual(abilities.snapshot(), before);
  for (const dt of [0, NaN, Infinity, -1, "0.1"]) abilities.tick(dt, context());
  abilities.tick(1, context({ truck: {} }));
  assert.deepEqual(abilities.snapshot(), before);
  abilities.tick(100, context());
  assert.equal(abilities.snapshot().clock, ABILITY_LIMITS.maxStep);
  assert.equal(abilities.snapshot().cooldowns["mini-trucks"], 11.75);
  const publicState = abilities.snapshot();
  publicState.miniTrucks[0].x = 1_000_000;
  publicState.cooldowns["mini-trucks"] = 0;
  assert.notEqual(abilities.snapshot().miniTrucks[0].x, 1_000_000);
  assert.equal(abilities.activate("q", context()).reason, "cooldown");
}

// Bad inputs and unavailable physical states cannot consume cooldowns.
{
  const abilities = createActiveAbilities();
  assert.equal(abilities.activate("q", context({ truck: { ...truck, grounded: false } })).reason, "airborne");
  assert.equal(abilities.activate("q", context({ truck: { ...truck, tipped: true } })).reason, "unavailable");
  assert.equal(abilities.activate("q", context({ truck: { ...truck, heading: Infinity } })).reason, "unavailable");
  for (const key of ["r", "", null, "constructor", {}]) assert.equal(abilities.activate(key, context()).reason, "invalid-slot");
  assert.equal(abilities.snapshot().activations, 0);
  assert.equal(abilities.activate("e", context({ truck: { ...truck, grounded: false } })).accepted, true);
}

// Mini Trucks spawn ahead, run in the intended direction, sweep through thin
// hazards at high speed, and produce one destruction receipt for each object.
{
  assert.equal(sweptAbilityContact({ x: 0, z: 0 }, { x: 0, z: 20 }, obstacle("thin", 0, 10, { radius: 0.1 }), 0.7), 0.46);
  assert.equal(sweptAbilityContact({ x: 0, z: 0 }, { x: 0, z: 0 }, obstacle("overlap", 0, 0)), 0);
  assert.equal(sweptAbilityContact({ x: 0, z: 0 }, { x: 0, z: 20 }, obstacle("outside", 5, 10)), null);
  const abilities = createActiveAbilities();
  abilities.activate("q", context({ truck: { ...truck, speed: 70 } }));
  const initial = abilities.snapshot().miniTrucks;
  assert.equal(initial.length, 3);
  assert(initial.every(mini => mini.z === 6 && mini.remaining > 0 && mini.speed > 70));
  const obstacles = initial.map((mini, index) => obstacle(`thin-${index}`, mini.x, 12, { radius: 0.1 }));
  const events = abilities.tick(0.25, context({ obstacles })).events.filter(event => event.kind === "ability-hit");
  assert.equal(events.length, 3);
  assert.equal(new Set(events.map(event => event.obstacleId)).size, 3);
  assert(events.every(event => event.destroy && event.position.z < 12 && event.abilityId === "mini-trucks"));
  assert.equal(abilities.snapshot().miniTrucks.length, 0);
  assert.equal(advance(abilities, 1, { obstacles }).filter(event => event.kind === "ability-hit").length, 0);

  abilities.reset();
  abilities.activate("q", context({ truck: { ...truck, heading: Math.PI / 2 } }));
  const turned = abilities.snapshot().miniTrucks;
  assert(turned.every(mini => Math.abs(mini.x - 6) < 1e-9));
  abilities.tick(0.1, context());
  assert(abilities.snapshot().miniTrucks.every(mini => mini.x > 6));
}

// Traffic is pushed, not destroyed; stale or duplicate streamed obstacles cannot
// cause repeated hits, and all mini entities retire within bounded active time.
{
  const abilities = createActiveAbilities();
  abilities.activate("q", context());
  const traffic = obstacle("traffic", 0, 12, { radius: 2.8, destructible: false, kind: "traffic" });
  const first = abilities.tick(0.25, context({ obstacles: [traffic, traffic] })).events.filter(event => event.kind === "ability-hit");
  assert.equal(first.length, 1);
  assert.equal(first[0].destroy, false);
  assert(first[0].push > 0 && first[0].disabledSeconds > 0);
  assert.equal(advance(abilities, 6, { obstacles: [traffic] }).filter(event => event.kind === "ability-hit").length, 0);
  assert.equal(abilities.snapshot().miniTrucks.length, 0);
  advance(abilities, 10);
  assert.equal(abilities.snapshot().recentHits, 0);
  assert.equal(abilities.snapshot().cooldowns["mini-trucks"], 0);
  assert.equal(abilities.activate("q", context()).accepted, true);
  abilities.tick(0.1, context({ truck: { ...truck, position: { x: 1000, z: 1000 } } }));
  assert.equal(abilities.snapshot().miniTrucks.length, 0);
}

// Steering correction and height use the host's actual road samples. Losing a
// streamed target clears its identity instead of retaining an obsolete object.
{
  const abilities = createActiveAbilities();
  abilities.activate("q", context());
  abilities.tick(0.1, context({ roadHeadingAt: () => 0.2, groundHeightAt: () => 12 }));
  assert(abilities.snapshot().miniTrucks.every(mini => mini.heading > 0 && mini.heading <= 0.0751 && mini.y === 12));
  abilities.tick(0.1, context({ obstacles: [obstacle("target", 1, 45)] }));
  assert(abilities.snapshot().miniTrucks.some(mini => mini.targetId === "target"));
  abilities.tick(0.1, context());
  assert(abilities.snapshot().miniTrucks.every(mini => mini.targetId === null));
}

// Road Shield absorbs concrete damage, deduplicates the same impact even when
// its last charge was spent, and expires using simulation time only.
{
  const abilities = createActiveAbilities();
  abilities.activate("e", context());
  assert.equal(abilities.snapshot().shield.charges, 2);
  const first = abilities.absorbDamage(12, { active: true, id: "impact-1" });
  assert.equal(first.damage, 0);
  assert.equal(first.absorbed, 12);
  assert.equal(abilities.snapshot().shield.charges, 1);
  assert.equal(abilities.absorbDamage(12, { active: true, id: "impact-1" }).duplicate, true);
  assert.equal(abilities.snapshot().shield.charges, 1);
  assert.equal(abilities.absorbDamage(5, { active: true, id: "impact-2" }).damage, 0);
  assert.equal(abilities.snapshot().shield.charges, 0);
  assert.equal(abilities.absorbDamage(5, { active: true, id: "impact-2" }).damage, 0);
  assert.equal(abilities.absorbDamage(8, { active: true, id: "impact-3" }).damage, 8);
  abilities.reset();
  abilities.activate("e", context());
  advance(abilities, 6);
  assert.equal(abilities.snapshot().shield.charges, 0);
  assert.equal(abilities.absorbDamage(9, { active: true }).damage, 9);
}

// Acquired Shockwave expands into nearby hazards once each, and does not clear
// objects beyond its radius. Re-equipping never refreshes its cooldown.
{
  const abilities = createActiveAbilities({ levels: { shockwave: 1 }, slots: { q: "shockwave", e: "road-shield" } });
  abilities.activate("q", context());
  const obstacles = [obstacle("near", 3, 5), obstacle("edge", 0, 12), obstacle("far", 0, 20), obstacle("car", -4, 0, { destructible: false })];
  const events = advance(abilities, 0.7, { obstacles }).filter(event => event.kind === "ability-hit");
  assert.deepEqual(events.map(event => event.obstacleId).sort(), ["car", "edge", "near"]);
  assert.equal(events.find(event => event.obstacleId === "car").destroy, false);
  assert.equal(abilities.snapshot().pulses.length, 0);
  abilities.configure({ slots: { q: "road-shield", e: "shockwave" } });
  assert.equal(abilities.activate("e", context()).reason, "cooldown");
}

// Upgrade and pickup scaling is noticeable but bounded even at extreme tiers.
{
  const base = createActiveAbilities();
  const upgraded = createActiveAbilities({ levels: { "mini-trucks": ABILITY_LIMITS.maxLevel, "road-shield": ABILITY_LIMITS.maxLevel } });
  base.activate("q", context());
  upgraded.activate("q", context({ enhancement: 1e12 }));
  assert(upgraded.snapshot().miniTrucks.length > base.snapshot().miniTrucks.length);
  assert(upgraded.snapshot().miniTrucks.length <= ABILITY_LIMITS.maxMiniTrucks);
  assert(upgraded.snapshot().miniTrucks[0].remaining > base.snapshot().miniTrucks[0].remaining);
  assert(upgraded.snapshot().cooldowns["mini-trucks"] < base.snapshot().cooldowns["mini-trucks"]);
  assert(upgraded.snapshot().cooldowns["mini-trucks"] >= ABILITY_DEFINITIONS["mini-trucks"].minimumCooldown);
  upgraded.activate("e", context({ enhancement: 100 }));
  assert.equal(upgraded.snapshot().shield.charges, 5);
  assert(upgraded.snapshot().shield.remaining <= 12);
  advance(upgraded, 12);
  assert.equal(upgraded.snapshot().miniTrucks.length, 0);
  assert.equal(upgraded.snapshot().shield.remaining, 0);
  upgraded.reset();
  assert.equal(upgraded.snapshot().levels["mini-trucks"], ABILITY_LIMITS.maxLevel);
  assert.equal(upgraded.snapshot().cooldowns["mini-trucks"], 0);
  assert.equal(upgraded.snapshot().activations, 0);
}

// Freight reload restores the cooldown/protection contract without replaying a
// traveling projectile or pulse, and malformed saves cannot partly apply.
{
  const abilities = createActiveAbilities();
  abilities.activate("q", context());
  abilities.activate("e", context());
  advance(abilities, 1);
  abilities.absorbDamage(12, { active: true, id: 'checkpoint-impact' });
  const checkpoint = abilities.checkpoint();
  assert.equal(checkpoint.schema, 'long-haul.ability-checkpoint/1');
  assert.deepEqual(Object.keys(checkpoint).sort(), ['cooldowns', 'schema', 'shield']);
  assert.equal(checkpoint.shield.charges, 1);
  const resumed = createActiveAbilities();
  resumed.activate('q', context());
  assert(resumed.snapshot().miniTrucks.length > 0);
  assert.equal(resumed.restoreCheckpoint(JSON.parse(JSON.stringify(checkpoint))).accepted, true);
  assert.deepEqual(resumed.snapshot().cooldowns, abilities.snapshot().cooldowns);
  assert.deepEqual(resumed.snapshot().shield, abilities.snapshot().shield);
  assert.equal(resumed.snapshot().miniTrucks.length, 0);
  assert.equal(resumed.snapshot().pulses.length, 0);
  assert.equal(resumed.activate('q', context()).reason, 'cooldown');
  const before = resumed.snapshot();
  for (const invalid of [
    null, [], {}, { ...checkpoint, schema: 'future' },
    { ...checkpoint, cooldowns: { 'mini-trucks': 0 } },
    { ...checkpoint, cooldowns: { ...checkpoint.cooldowns, fake: 0 } },
    ...[NaN, Infinity, -1, '5', 1000].map(value => ({ ...checkpoint, cooldowns: { ...checkpoint.cooldowns, 'mini-trucks': value } })),
    ...[NaN, Infinity, -1, '5', 13].map(value => ({ ...checkpoint, shield: { ...checkpoint.shield, remaining: value } })),
    ...[-1, 1.5, 6, '1'].map(value => ({ ...checkpoint, shield: { ...checkpoint.shield, charges: value } })),
    { ...checkpoint, shield: { ...checkpoint.shield, remaining: 0 } },
    { ...checkpoint, shield: { ...checkpoint.shield, charges: 0 } },
    { ...checkpoint, shield: { ...checkpoint.shield, reduction: 2 } },
  ]) {
    assert.equal(resumed.restoreCheckpoint(invalid).accepted, false);
    assert.deepEqual(resumed.snapshot(), before);
  }
  checkpoint.cooldowns['mini-trucks'] = 0;
  checkpoint.shield.charges = 0;
  assert.deepEqual(resumed.snapshot(), before);
  advance(resumed, 5);
  assert.equal(resumed.snapshot().shield.charges, 0);
}

console.log("active abilities regression: passed (slots, pause, cooldowns, swept collisions, streaming cleanup, shield, shockwave, scaling, checkpoint validation)");
