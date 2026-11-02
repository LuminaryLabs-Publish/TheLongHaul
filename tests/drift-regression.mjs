import assert from "node:assert/strict";
import * as N from "../vendor/nexusengine.mjs";
import { createLongHaulTruckDynamicsProfileKit } from "../src/game/truck-dynamics-profile-kit.mjs";
import { createLongHaulTruckKit } from "../src/game/truck-kit.mjs";

const ground = { surface: "road", surfaceGrip: 1, roadMaterial: "paved", groundHeight: 0, groundNormal: { x: 0, y: 1, z: 0 } };
function rig(speed = 30, profile = {}) {
  const dynamics = createLongHaulTruckDynamicsProfileKit(N, { profile });
  const truck = createLongHaulTruckKit(N, { dynamicsProfileResource: dynamics.resources.TruckDynamicsProfileState });
  const engine = N.createEngine({ kits: [dynamics.kit, truck.kit], tick: { maxDelta: 1 / 15 } });
  engine.world.__longHaulScene = "driving";
  const api = engine.n.longHaulTruck;
  api.teleport({ x: 0, y: 0.92, z: 0, heading: 0, speed, ...ground }); engine.tick(0);
  const frame = (input = {}, delta = 1 / 60) => {
    // Fixture payload changes use the same setCargo owner as live freight;
    // normal driving input never creates a competing mass authority.
    const { cargoMass, ...driving } = input;
    if (cargoMass !== undefined) api.setCargo(cargoMass > 0 ? { profileId: "heavy", massKg: cargoMass } : null);
    api.input({ ...ground, ...driving }); engine.tick(delta); return api.getState();
  };
  const drive = (seconds, input = {}, delta = 1 / 60) => {
    for (let i = 0; i < Math.round(seconds / delta); i++) frame(input, delta);
    return api.getState();
  };
  return { engine, api, frame, drive, state: () => api.getState() };
}
const planar = (state) => Math.hypot(state.velocity.x, state.velocity.z);

const driftRig = rig();
const slide = driftRig.drive(0.75, { brake: 1, steer: 1 });
assert.ok(slide.drift.active, "S plus steering initiates the dedicated drift");
assert.ok(slide.drift.momentum > 5 && slide.drift.charge > 0.2, "braking stores a visible finite reserve");
assert.ok(slide.speed < 18 && planar(slide) < 30, "sliding spends forward and total speed");
assert.ok(Math.abs(slide.lateralSpeed) > 3 && Math.abs(slide.driftAngle) > 0.2, "lateral velocity and heading remain independent");
assert.ok(slide.weightTransfer > 0.2 && slide.bodyPitch > 0, "braking pitches weight toward the front");
let release = slide;
for (let i = 0; i < 120 && !release.drift.releaseSequence; i++) release = driftRig.frame({ steer: -1 });
assert.equal(release.drift.releaseSequence, 1, "sharp opposite steering releases one maneuver");
assert.ok(release.speed > slide.speed * 1.5, "countersteer produces a noticeable directional exit");
assert.ok(planar(release) <= 30 * 0.96 + 1e-8, "release remains below maneuver entry energy");
assert.ok(Math.abs(release.lateralSpeed) < 0.1, "released velocity follows the realigned heading");
assert.equal(release.drift.momentum, 0, "release consumes the entire reserve");
assert.equal(release.drift.lastManeuver.countersteer, true);
assert.ok(release.drift.lastManeuver.distance > 10);
assert.ok(release.drift.lastManeuver.reserve > 5);
driftRig.drive(1, { steer: -1 });
assert.equal(driftRig.state().drift.releaseSequence, 1, "held countersteer cannot award repeated releases");

const explicit = rig(24).drive(0.6, { drift: true, steer: -0.8 });
assert.ok(explicit.drift.active && explicit.drift.direction === -1, "Shift can start a left drift without S");
assert.ok(explicit.speed < 24 && explicit.drift.momentum > 0, "explicit drift spends and stores existing motion");

const stop = rig(15);
stop.drive(0.4, { brake: 1, steer: 0.6 });
assert.ok(stop.state().drift.momentum > 1);
let stopped;
for (let i = 0; i < 180; i++) {
  stopped = stop.frame({ brake: 1, handbrake: true });
  if (stopped.longitudinalSpeed < 0.2) break;
}
assert.equal(stopped.drift.momentum, 0, "complete braking expires the launch reserve");
assert.equal(stopped.drift.active, false);
stop.drive(0.5, { steer: -1 });
assert.equal(stop.state().drift.releaseSequence, 0, "countersteering after stopping cannot resurrect a reserve");

const empty = rig(30), loaded = rig(30);
const emptyBrake = empty.drive(0.5, { brake: 1, steer: 0.7 });
const loadedBrake = loaded.drive(0.5, { brake: 1, steer: 0.7, cargoMass: 12000 });
assert.ok(loadedBrake.speed > emptyBrake.speed, "heavy cargo increases braking distance");
assert.ok(Math.abs(loadedBrake.heading) < Math.abs(emptyBrake.heading), "cargo adds steering inertia");
assert.equal(loadedBrake.cargoShift, 0, "secured heavy cargo retains the authoritative no-shift behavior");
const unsecured = rig(30); unsecured.api.setCargo("unstable");
assert.ok(Math.abs(unsecured.drive(0.6, { brake: 1, steer: 0.7 }).cargoShift) > 0.05, "unsecured cargo shifts under drift weight transfer");
assert.equal(loadedBrake.totalMass, 19800);
assert.ok(rig(0).drive(2, { throttle: 1, cargoMass: 12000 }).speed < rig(0).drive(2, { throttle: 1 }).speed * 0.75, "loaded acceleration changes mechanically");

// Matrix covers distinct speeds, road grip, cargo and steering angles. Low
// speed/weak-angle attempts are allowed to end without a successful launch.
let cases = 0, successful = 0;
for (const speed of [14, 25, 38]) for (const surfaceGrip of [0.35, 0.65, 1]) for (const cargoMass of [0, 12000]) for (const steer of [0.4, 1]) {
  const test = rig(speed);
  let current;
  const sample = { surfaceGrip, cargoMass, roadMaterial: surfaceGrip < 0.5 ? "gravel" : "paved" };
  for (let i = 0; i < 36; i++) {
    current = test.frame({ ...sample, brake: 1, steer });
    assert.ok(Number.isFinite(current.heading) && Number.isFinite(current.speed));
    assert.ok(current.drift.charge >= 0 && current.drift.charge <= 1);
    if (current.drift.maxAngle >= 0.3 && current.drift.duration >= 0.35) break;
  }
  for (let i = 0; i < 150 && !current.drift.releaseSequence; i++) current = test.frame({ ...sample, steer: -steer });
  assert.ok(planar(current) <= speed + 1e-6, "no surface/cargo/angle combination generates free speed");
  assert.equal(current.tipped, false, "intentional drifting alone never rolls the truck");
  successful += current.drift.releaseSequence > 0 ? 1 : 0;
  cases++;
}
assert.ok(successful >= 24, "the control maneuver remains achievable across representative conditions");

const cargoOwner = rig(25);
cargoOwner.api.setCargo("heavy");
cargoOwner.api.input({ ...ground, throttle: 1, cargoMass: 0 }); cargoOwner.engine.tick(1 / 60);
assert.equal(cargoOwner.state().cargoMass, 6200, "stale input mass cannot override freight-owned cargo");
assert.equal(cargoOwner.state().totalMass, cargoOwner.state().effectiveMass);

const flat = rig(25).drive(0.6, { drift: true, steer: 0.4 });
const uphill = rig(25).drive(0.6, { drift: true, steer: 0.4, groundNormal: { x: 0, y: 0.98, z: -0.2 } });
assert.ok(planar(uphill) < planar(flat), "road grade still affects a drifting truck");

for (const damage of [-1, 1]) {
  const damaged = rig(25);
  const pulling = damaged.drive(1, { throttle: 1, steeringDamage: damage });
  assert.equal(Math.sign(pulling.heading), damage, "steering damage pulls predictably in its configured direction");
  const corrected = damaged.drive(1, { throttle: 1, steeringDamage: damage, steer: -damage });
  assert.equal(Math.sign(corrected.yawRate), -damage, "opposing steering can still overcome maximum damage");
  const repaired = damaged.drive(3, { throttle: 1, steeringDamage: 0 });
  assert.ok(Math.abs(repaired.yawRate) < 0.001, "repair removes the pull without a latched input state");
  assert.equal(repaired.steeringDamage, 0);
}

const pause = rig(); pause.drive(0.4, { brake: 1, steer: 1 });
const paused = pause.state(); pause.engine.world.__longHaulScene = "upgrade";
pause.drive(2, { drift: true, steer: -1 });
assert.deepEqual(pause.state().drift, paused.drift, "upgrade pause freezes reserve, decay and maneuver timers");
assert.deepEqual(pause.state().velocity, paused.velocity, "upgrade pause preserves exact velocity");
pause.engine.world.__longHaulScene = "driving";
pause.api.teleport({ x: 0, y: 0.92, z: 0, heading: 0, speed: 0, ...ground }); pause.engine.tick(0);
assert.equal(pause.state().drift.momentum, 0, "recovery/teleport clears all stored energy");
assert.equal(pause.state().drift.sequence, paused.drift.sequence, "recovery does not reuse maneuver identities");

const exploit = rig(38);
let priorMaximum = 38;
for (let cycle = 0; cycle < 30; cycle++) {
  exploit.drive(0.35, { drift: true, steer: 1 });
  exploit.drive(0.65, { steer: -1 });
  exploit.drive(0.5);
  const state = exploit.state();
  assert.ok(planar(state) <= priorMaximum + 1e-6, "repeated drift activation cannot compound free acceleration");
  priorMaximum = planar(state);
}

function maneuver(delta) {
  const test = rig(30);
  test.drive(0.6, { brake: 1, steer: 0.8 }, delta);
  return test.drive(0.8, { steer: -0.8 }, delta);
}
const sixty = maneuver(1 / 60), thirty = maneuver(1 / 30);
assert.ok(Math.hypot(sixty.position.x - thirty.position.x, sixty.position.z - thirty.position.z) < 0.1, "drift/countersteer remains independent of display rate");
assert.equal(sixty.drift.releaseSequence, thirty.drift.releaseSequence);
console.log(`Drift regressions passed: ${cases} condition combinations (${successful} countersteer exits), stop expiration, conserved reserve, cargo/slope response, damage recovery and pause/rate invariance.`);
