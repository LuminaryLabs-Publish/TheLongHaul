import assert from "node:assert/strict";
import * as N from "../vendor/nexusengine.mjs";
import { createLongHaulTruckDynamicsProfileKit, DEFAULT_TRUCK_DYNAMICS_PROFILE } from "../src/game/truck-dynamics-profile-kit.mjs";
import { createLongHaulTruckKit } from "../src/game/truck-kit.mjs";
import { createForwardBoost } from "../src/game/forward-boost.mjs";

// These checks exercise the shipped NexusEngine scheduler and product kits.
// Rendering, input timing and subjective feel are separate gameplay gates.
const ground = { surface: "road", surfaceGrip: 1, roadMaterial: "paved", groundHeight: 0, groundNormal: { x: 0, y: 1, z: 0 } };
function rig(profile = {}) {
  const dynamics = createLongHaulTruckDynamicsProfileKit(N, { profile });
  const truck = createLongHaulTruckKit(N, { dynamicsProfileResource: dynamics.resources.TruckDynamicsProfileState });
  const engine = N.createEngine({ tick: { maxDelta: 1 / 15, rejectReentry: true }, kits: [dynamics.kit, truck.kit] });
  engine.world.__longHaulScene = "driving";
  const api = engine.n.longHaulTruck;
  const tick = (delta = 1 / 60) => engine.tick(delta);
  api.reset({ x: 0, y: 0.92, z: 0, heading: 0 }); tick(0);
  const drive = (seconds, intent = {}, delta = 1 / 60) => {
    for (let frame = 0; frame < Math.round(seconds / delta); frame += 1) { api.input({ ...ground, ...intent }); tick(delta); }
    return api.getState();
  };
  return { engine, api, tick, drive, state: () => api.getState() };
}

const partial = rig({ steering: { response: 15 }, air: { gravity: 12 }, boost: { forceMultiplier: 2 } });
const partialProfile = partial.engine.n.longHaulTruckDynamicsProfile.getState();
assert.equal(partialProfile.steering.wheelbase, DEFAULT_TRUCK_DYNAMICS_PROFILE.steering.wheelbase, "partial tuning preserves steering contract");
assert.equal(partialProfile.air.maximumSubsteps, 8, "partial tuning preserves substeps");
assert.equal(partialProfile.boost.rushSpeedMultiplier, 1.8, "garage tuning retains rush limits");

const accelerationRig = rig();
const accelerated = accelerationRig.drive(2, { throttle: 1 });
assert.ok(accelerated.speed > 10, "the loaded rig reaches useful speed within two seconds");
assert.ok(accelerated.position.z > 10, "acceleration produces real movement");
assert.equal(accelerated.grounded, true);
assert.ok(Math.abs(accelerated.position.y - 0.92) < 1e-6, "flat contact remains stable");

const normal = rig().drive(3, { throttle: 1 });
const heldBoost = rig().drive(3, { throttle: 1, boost: true });
const rush = rig().drive(3, { throttle: 1, boost: true, rush: true });
assert.ok(heldBoost.speed > normal.speed * 1.3, "held boost provides a meaningful acceleration gain");
assert.ok(rush.speed > heldBoost.speed * 1.3, "a timed burst is materially stronger than held boost");
assert.ok(rush.speed <= DEFAULT_TRUCK_DYNAMICS_PROFILE.maximumForwardSpeed * 1.8 + 0.01, "rush stays bounded");

const brakingRig = rig();
brakingRig.api.teleport({ x: 0, y: 0.92, z: 0, heading: 0, speed: 24, ...ground }); brakingRig.tick(0);
let stoppingTime = 0;
for (; stoppingTime < 3; stoppingTime += 1 / 60) {
  brakingRig.drive(1 / 60, { brake: 1 });
  if (brakingRig.state().speed <= 0.45) break;
}
assert.ok(stoppingTime < 2, "brakes arrest a fast truck promptly");
assert.ok(brakingRig.state().position.z < 25, "stopping distance is controllable");

for (const steer of [-1, 1]) {
  const turning = rig();
  turning.api.teleport({ x: 0, y: 0.92, z: 0, heading: 0, speed: 32, ...ground }); turning.tick(0);
  let peakLean = 0;
  for (let frame = 0; frame < 600; frame += 1) {
    turning.drive(1 / 60, { throttle: 1, steer, boost: true, rush: true });
    const state = turning.state();
    peakLean = Math.max(peakLean, Math.abs(state.bodyRoll));
    assert.equal(state.tipped, false, "steering alone never rolls the rig");
    assert.ok(Math.abs(state.bodyRoll) <= 0.620001, "dramatic lean remains bounded");
    assert.ok(Number.isFinite(state.heading));
  }
  assert.ok(peakLean > 0.46, "hard steering retains visible scrape lean");
  const released = turning.drive(4, { throttle: 1 });
  assert.ok(Math.abs(released.bodyRoll) < 0.01, "releasing steering self-rights the body");
}

const flying = rig();
flying.api.teleport({ x: 0, y: 0.92, z: 0, heading: 0, speed: 28, ...ground }); flying.tick(0);
flying.api.impulse({ kind: "launch", y: 12, speedDelta: 2 }); flying.tick(0);
let peakHeight = 0, maximumAirTime = 0;
for (let frame = 0; frame < 480; frame += 1) {
  const state = flying.drive(1 / 60, { throttle: 1 });
  peakHeight = Math.max(peakHeight, state.position.y - 0.92);
  maximumAirTime = Math.max(maximumAirTime, state.airTime);
}
const landed = flying.state();
assert.ok(peakHeight > 5.5, "a ramp-sized impulse creates a substantial jump");
assert.ok(maximumAirTime > 1.8, "the jump is a ballistic arc, not a cosmetic hop");
assert.equal(landed.landingSequence, 1, "one launch produces one scored landing despite rebound");
assert.ok(landed.lastLanding.airTime > 1.8);
assert.ok(landed.lastLanding.impactSpeed > 10);
assert.ok(landed.lastLanding.distance > 50);
assert.ok(landed.lastLanding.height > 5.5);
assert.equal(landed.impactSequence, 0, "launches are not reported as crashes");
assert.equal(landed.grounded, true);
assert.ok(Math.abs(landed.position.y - 0.92) < 1e-6);
assert.ok(Math.abs(landed.suspensionCompression) < 0.01, "landing suspension settles instead of accumulating energy");
assert.ok(Math.abs(landed.suspensionVelocity) < 0.01);

// Road grade, slippery pavement and held boost cannot propel an airborne truck.
const flatFlight = rig(), slopedFlight = rig();
for (const value of [flatFlight, slopedFlight]) { value.api.teleport({ x: 0, y: 25, z: 0, heading: 0, speed: 25, grounded: false, ...ground }); value.tick(0); }
const flat = flatFlight.drive(1, { throttle: 1, boost: true, rush: true });
const slope = slopedFlight.drive(1, { throttle: 1, boost: true, rush: true, surfaceGrip: 0.3, groundNormal: { x: 0, y: 0.7, z: -0.7 } });
assert.ok(Math.abs(flat.position.z - slope.position.z) < 1e-8, "air motion ignores the road below");
assert.ok(flat.speed < 25 && flat.speed > 24, "air drag is bounded and does not invent thrust");

const crashed = rig();
crashed.api.teleport({ x: 0, y: 0.92, z: 0, heading: 0, speed: 25, ...ground }); crashed.tick(0);
crashed.api.impulse({ kind: "traffic", speedDelta: -12, rollDelta: 2, y: 1.2 }); crashed.tick();
assert.equal(crashed.state().tipped, true, "a deliberate severe collision can roll the truck");
assert.equal(crashed.state().impactSequence, 1);
assert.equal(crashed.state().lastImpact.kind, "traffic");
crashed.api.teleport({ x: 5, y: 0.92, z: 5, heading: Math.PI / 2, speed: 0, ...ground }); crashed.tick(0);
assert.equal(crashed.state().tipped, false);
assert.deepEqual(crashed.state().velocity, { x: 0, y: 0, z: 0 }, "recovery clears residual momentum");
assert.equal(crashed.state().flightOrigin, null);
assert.equal(crashed.state().lastLanding, null, "recovery cannot replay a previous landing reward");

const safe = rig();
safe.api.teleport({ x: 0, y: 0.92, z: 0, heading: 0, speed: 40, ...ground }); safe.tick(0);
safe.drive(2, { throttle: 1, boost: true });
assert.ok(safe.state().lastSafe.z > 60, "high-speed safe travel refreshes the recovery pose");
const frozen = safe.state(); safe.engine.world.__longHaulScene = "paused";
safe.drive(1, { throttle: 1, steer: 1, rush: true });
assert.deepEqual(safe.state().position, frozen.position, "paused scenes freeze vehicle position");
assert.deepEqual(safe.state().velocity, frozen.velocity, "paused scenes freeze momentum");

const sixty = rig().drive(6, { throttle: 1, steer: 0.3 }, 1 / 60);
const thirty = rig().drive(6, { throttle: 1, steer: 0.3 }, 1 / 30);
assert.ok(Math.hypot(sixty.position.x - thirty.position.x, sixty.position.z - thirty.position.z) < 0.2, "substeps preserve driving across display rates");
assert.ok(Math.abs(sixty.speed - thirty.speed) < 0.1);

const boost = createForwardBoost();
assert.equal(boost.tap("KeyW", 0), false);
assert.equal(boost.tap("ArrowUp", 100), false, "mixed keys do not complete a double tap");
assert.equal(boost.tap("KeyW", 200), true);
assert.equal(boost.remaining, 5);
assert.equal(boost.tap("KeyW", 250), false, "active bursts cannot be extended");
boost.advance(5);
assert.equal(boost.remaining, 0);
assert.equal(boost.cooldown, 3);
assert.equal(boost.tap("KeyW", 6000), false, "recharging rejects new bursts");
boost.reset({ preserveCooldown: true });
assert.equal(boost.cooldown, 3, "menus cannot skip recharge");
boost.advance(3);
assert.equal(boost.ready, true);
assert.equal(boost.tap("KeyW", 9000), false, "blocked taps are not retained through recharge");
assert.equal(boost.tap("KeyW", 9000), false, "duplicate event times do not count as two presses");
assert.equal(boost.tap("KeyW", 9200), true);
boost.advance(0, { cancel: true });
assert.equal(boost.remaining, 0);
assert.equal(boost.cooldown, 3, "braking an active burst retains its recharge cost");
boost.reset();
assert.deepEqual(boost.snapshot(), { remaining: 0, cooldown: 0, ready: true }, "new runs reset both clocks");
assert.equal(boost.tap("Space", 10000), false);
assert.equal(boost.tap("KeyW", NaN), false);
boost.tap("KeyW", 10000); boost.tap("KeyW", 10200); boost.advance(6);
assert.equal(boost.cooldown, 2, "a large simulation step correctly spans burst and recharge");

console.log("Vehicle feel regressions passed: real NexusEngine physics, flight, impacts, pause, rate invariance and boost lifecycle.");
