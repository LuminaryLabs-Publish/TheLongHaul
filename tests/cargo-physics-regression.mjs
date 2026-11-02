import assert from "node:assert/strict";
import * as N from "../vendor/nexusengine.mjs";
import { createLongHaulTruckDynamicsProfileKit } from "../src/game/truck-dynamics-profile-kit.mjs";
import { createLongHaulTruckKit } from "../src/game/truck-kit.mjs";
import { CARGO_PROFILES, cargoDamageMultiplier, getCargoProfile, normalizeCargoLoad } from "../src/game/cargo-profiles.mjs";

// Product integration tests use the shipped engine and real vehicle updates.
const ground = { surface: "road", surfaceGrip: 1, roadMaterial: "paved", groundHeight: 0, groundNormal: { x: 0, y: 1, z: 0 } };
function rig(cargo = null, profile = {}) {
  const dynamics = createLongHaulTruckDynamicsProfileKit(N, { profile });
  const truck = createLongHaulTruckKit(N, { dynamicsProfileResource: dynamics.resources.TruckDynamicsProfileState });
  const engine = N.createEngine({ tick: { maxDelta: 1 / 15, rejectReentry: true }, kits: [dynamics.kit, truck.kit] });
  engine.world.__longHaulScene = "driving";
  const api = engine.n.longHaulTruck;
  api.reset({ x: 0, y: 0.92, z: 0, heading: 0 }); engine.tick(0);
  api.setCargo(cargo);
  const step = (intent = {}, dt = 1 / 60) => { api.input({ ...ground, ...intent }); engine.tick(dt); return api.getState(); };
  const drive = (seconds, intent = {}, dt = 1 / 60) => { for (let i = 0; i < Math.round(seconds / dt); i++) step(intent, dt); return api.getState(); };
  const place = (speed = 28, extra = {}) => { api.teleport({ x: 0, y: 0.92, z: 0, heading: 0, speed, ...ground, ...extra }); engine.tick(0); };
  return { api, engine, step, drive, place, state: () => api.getState() };
}

assert.deepEqual(Object.keys(CARGO_PROFILES), ["standard", "fragile", "heavy", "hazardous", "unstable"]);
assert.equal(getCargoProfile("invented"), null);
assert.equal(getCargoProfile("__proto__"), null);
assert.equal(getCargoProfile("constructor"), null);
assert.equal(normalizeCargoLoad({}), null);
assert.equal(normalizeCargoLoad({ profileId: "invented", massKg: 100 }), null);
assert.equal(normalizeCargoLoad({ profileId: "heavy", massKg: Infinity }).massKg, 6200);
assert.equal(normalizeCargoLoad({ profileId: "heavy", massKg: -100 }).massKg, 250);
assert.ok(cargoDamageMultiplier("fragile", "bad-landing") > cargoDamageMultiplier("standard", "bad-landing") * 2);
assert.ok(cargoDamageMultiplier("heavy", "major-impact") < cargoDamageMultiplier("standard", "major-impact"));
assert.equal(cargoDamageMultiplier("fragile", "roadside-recovery"), 1);
assert.ok(cargoDamageMultiplier("unstable", "cargo-shift") > cargoDamageMultiplier("standard", "cargo-shift"));
assert.equal(cargoDamageMultiplier(null, "traffic-impact"), 0);
assert.ok(getCargoProfile("hazardous").hazardousFailureDamage > 0);

const empty = rig().drive(3, { throttle: 1 });
const light = rig("fragile").drive(3, { throttle: 1 });
const heavy = rig("heavy").drive(3, { throttle: 1 });
assert.ok(heavy.speed < empty.speed * 0.7, "the same engine visibly accelerates a heavy payload more slowly");
assert.ok(light.speed > heavy.speed * 1.3, "light and heavy cargo are distinct in actual driving");
assert.equal(heavy.effectiveMass, 14000);
assert.equal(empty.effectiveMass, 7800);
assert.ok(heavy.suspensionCompression > light.suspensionCompression + 0.08, "loaded suspension carries the extra weight");

function brakeDistance(cargo) {
  const value = rig(cargo); value.place(28);
  for (let i = 0; i < 240; i++) if (value.step({ brake: 1 }).speed <= 0.45) break;
  assert.ok(value.state().speed <= 0.45, "even a heavy truck can stop within the bounded trial");
  return value.state().position.z;
}
const emptyBrake = brakeDistance(null), heavyBrake = brakeDistance("heavy");
assert.ok(heavyBrake > emptyBrake * 1.3, "payload needs more braking distance with the same brakes");
const hill = { throttle: 1, groundNormal: { x: 0, y: 0.98, z: -0.2 } };
assert.ok(rig("heavy").drive(3, hill).speed < rig().drive(3, hill).speed * 0.6, "uphill driving exposes limited loaded tractive force");

const normalHeavy = rig("heavy").drive(3, { throttle: 1 });
const boostedHeavy = rig("heavy").drive(3, { throttle: 1, boost: true, rush: true });
assert.ok(boostedHeavy.speed > normalHeavy.speed * 2, "rush works while loaded");
const upgradedHeavy = rig("heavy", { engineAcceleration: 8.8, brakeForce: 19 }).drive(3, { throttle: 1 });
assert.ok(upgradedHeavy.speed > normalHeavy.speed * 1.3, "engine upgrades retain their benefit under load");

const moving = rig(); moving.place(25, { verticalSpeed: 2, grounded: false, y: 6 });
const beforeLoad = moving.state();
const afterLoad = moving.api.setCargo({ profileId: "heavy", massKg: 6200, condition: 73 });
assert.deepEqual(afterLoad.position, beforeLoad.position, "drive-through loading cannot teleport");
assert.deepEqual(afterLoad.velocity, beforeLoad.velocity, "drive-through loading cannot erase momentum");
assert.equal(afterLoad.cargo.condition, 73);
assert.equal(afterLoad.effectiveMass, 14000, "mass changes before the next simulation tick");
moving.api.setCargo(null);
assert.deepEqual(moving.state().velocity, beforeLoad.velocity, "unloading preserves velocity too");
assert.equal(moving.state().effectiveMass, 7800);

const emptyImpact = rig(), heavyImpact = rig("heavy");
for (const value of [emptyImpact, heavyImpact]) { value.place(28); value.api.impulse({ kind: "traffic", speedDelta: -10, allowTip: false }); value.engine.tick(0); }
assert.ok(heavyImpact.state().velocity.z > emptyImpact.state().velocity.z + 2, "same external impact changes heavy momentum less");
assert.ok(heavyImpact.state().lastImpact.energy > emptyImpact.state().lastImpact.energy, "impact telemetry accounts for effective mass");

function jump(cargo) {
  const value = rig(cargo); value.place(28); value.api.impulse({ kind: "launch", y: 12 }); value.engine.tick(0);
  let apex = 0;
  for (let i = 0; i < 240; i++) { const s = value.step({ throttle: 1 }); apex = Math.max(apex, s.position.y - 0.92); }
  const result = value.state();
  assert.equal(result.landingSequence, 1, "one launched load makes one landing event");
  assert.equal(result.grounded, true);
  return { apex, landing: result.lastLanding };
}
const emptyJump = jump(null), heavyJump = jump("heavy");
assert.ok(heavyJump.apex < emptyJump.apex * 0.7, "the same ramp impulse cannot give extra mass free jump energy");
assert.ok(heavyJump.landing.distance < emptyJump.landing.distance * 0.85);
assert.equal(heavyJump.landing.effectiveMass, 14000);
assert.ok(heavyJump.landing.energy > 0);

function corner(cargo, steer) {
  const value = rig(cargo); value.place(26);
  let stress = 0;
  for (let i = 0; i < 120; i++) { const s = value.step({ throttle: 1, steer }); stress = Math.max(stress, s.loadStress); assert.equal(s.tipped, false); }
  return { value, state: value.state(), stress };
}
const stableCorner = corner("standard", 0.55), looseCorner = corner("unstable", 0.55), mirrorCorner = corner("unstable", -0.55);
assert.equal(stableCorner.state.loadShift.x, 0, "secured loads do not invent lateral shifts");
assert.ok(Math.abs(looseCorner.state.loadShift.x) > 0.4, "unsecured load follows sustained lateral force");
assert.ok(looseCorner.stress > 0.1, "unsafe load motion is visible to the cargo-condition authority");
assert.ok(Math.abs(looseCorner.state.loadShift.x + mirrorCorner.state.loadShift.x) < 1e-8, "load shift mirrors steering deterministically");
assert.ok(Math.abs(looseCorner.state.position.x + mirrorCorner.state.position.x) < 1e-7, "load shift never invents a random steering direction");
const beforeCondition = looseCorner.value.state();
looseCorner.value.api.setCargo({ profileId: "unstable", condition: 81 });
assert.deepEqual(looseCorner.value.state().loadShift, beforeCondition.loadShift, "condition refresh cannot reset moving cargo");
assert.deepEqual(looseCorner.value.state().loadShiftVelocity, beforeCondition.loadShiftVelocity);
const restored = rig(); restored.api.loadSnapshot(looseCorner.value.api.snapshot());
assert.deepEqual(restored.state().cargo, looseCorner.value.state().cargo);
assert.deepEqual(restored.state().loadShift, looseCorner.value.state().loadShift);
assert.deepEqual(restored.state().velocity, looseCorner.value.state().velocity);
const settled = looseCorner.value.drive(5, {});
assert.ok(Math.abs(settled.loadShift.x) < 0.02, "smooth straight travel lets the load settle");
assert.ok(Math.abs(settled.bodyRoll) < 0.02, "load response recovers without a permanent lean penalty");

const paused = restored.state(); restored.engine.world.__longHaulScene = "pause";
restored.drive(1, { throttle: 1, steer: 1 });
assert.deepEqual(restored.state().loadShift, paused.loadShift, "pause freezes the load's physical state");
assert.deepEqual(restored.state().position, paused.position);
const rate60 = rig("unstable").drive(5, { throttle: 1, steer: 0.35 }, 1 / 60);
const rate30 = rig("unstable").drive(5, { throttle: 1, steer: 0.35 }, 1 / 30);
assert.ok(Math.hypot(rate60.position.x - rate30.position.x, rate60.position.z - rate30.position.z) < 0.01, "loaded dynamics remain consistent across frame rates");
assert.ok(Math.abs(rate60.loadShift.x - rate30.loadShift.x) < 1e-6);

console.log(JSON.stringify({ result: "PASS", cargoProfiles: Object.keys(CARGO_PROFILES).length, accelerationSpeeds: { empty: empty.speed, light: light.speed, heavy: heavy.speed }, stoppingDistance: { empty: emptyBrake, heavy: heavyBrake }, jumpApex: { empty: emptyJump.apex, heavy: heavyJump.apex }, unstableShift: looseCorner.state.loadShift, peakLoadStress: looseCorner.stress }, null, 2));
