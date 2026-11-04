import assert from "node:assert/strict";
import { advanceTruckRollover } from "../src/game/truck-rollover.mjs";
import { DEFAULT_TRUCK_DYNAMICS_PROFILE } from "../src/game/truck-dynamics-profile-kit.mjs";

const load = { rollScale: 1, springScale: 1, payloadFraction: 0.3 };
const profile = { roll: { spring: 19, damping: 8.8, lateralScale: 0.034, maximumAngle: 0.95, settledAngle: 1.48, tipExposure: 0.36 } };
const baseline = { tipped: false, rollAngle: 0, rollVelocity: 0, rolloverExposure: 0 };
function step(previous, changes = {}) {
  return advanceTruckRollover(previous, {
    grounded: true, longitudinal: 24, lateral: 0, yawRate: 0,
    drift: { active: false, direction: 0, phase: "idle" },
    loadShift: { x: 0 }, load, ...changes
  }, 1 / 120, profile);
}
function simulate(frames, changes, initial = baseline) {
  let current = { ...initial };
  for (let i = 0; i < frames; i++) current = step(current, changes);
  return current;
}
const straight = simulate(240);
assert.equal(straight.tipped, false);
assert.equal(straight.wheelLiftLeft + straight.wheelLiftRight, 0);
assert.equal(straight.rollMode, "planted");

const leftTurn = simulate(100, { yawRate: 0.45 });
assert.ok(leftTurn.rollAngle < 0, "normal right turn leans outward");
const cleanDrift = simulate(120, { longitudinal: 20, lateral: -5, yawRate: 0.2, drift: { active: true, direction: 1, phase: "sliding" } });
assert.ok(cleanDrift.rollAngle > 0, "controlled right drift leans into the slide");
assert.equal(cleanDrift.tipped, false, "controlled drift does not automatically tip");
assert.ok(cleanDrift.wheelLiftRight >= 0 && cleanDrift.wheelLiftLeft === 0);

const aggressive = simulate(250, { longitudinal: 45, yawRate: 1.1, load: { ...load, payloadFraction: 0.75 } });
assert.equal(aggressive.tipped, true, "sustained high-speed cornering must be able to roll");
assert.ok(aggressive.rolloverExposure >= profile.roll.tipExposure);

const wrongCountersteer = simulate(100, {
  longitudinal: 38, lateral: 8, yawRate: -1.1,
  drift: { active: true, direction: 1, phase: "countersteer" }
}, { ...baseline, rollAngle: -0.74, rollVelocity: -0.2, rolloverExposure: 0.21 });
assert.ok(wrongCountersteer.tipped || wrongCountersteer.rolloverRisk > 1.05,
  "wrong-way lean and abrupt countersteer create genuine rollover risk");

const nearly = simulate(40, { longitudinal: 34, yawRate: 0.9 });
const corrected = simulate(150, { longitudinal: 12, yawRate: 0 }, nearly);
assert.equal(corrected.tipped, false, "driver can recover by settling the weight");
assert.equal(corrected.rolloverExposure, 0, "recovered exposure decays rather than latching");
assert.ok(Number.isFinite(corrected.rollAngle) && Number.isFinite(corrected.rollVelocity));

const paused = step({ ...baseline, rolloverExposure: 0.19 }, { grounded: false });
assert.ok(paused.rolloverExposure <= 0.19, "airborne contact cannot accumulate grounded rollover exposure");
// Rebound is a damped physical angular-momentum response, not an extra
// animation lerp. Measured from a deliberately displaced, still-moving rig.
const settledLoad = { ...load, effectiveMass: 9400, centerOfMassHeight: 1.42, payloadFraction: 0.17 };
const releaseMotion = {
  grounded: true, longitudinal: 17, lateral: 0, yawRate: 0,
  drift: { active: false, direction: 0, phase: "idle" },
  loadShift: { x: 0 }, load: settledLoad
};
function settleAtRate(delta) {
  let state = { ...baseline, rollAngle: 0.48 };
  let time = null, crossing = 0, wheelClear = null;
  let lastSign = 1;
  for (let index = 0; index < Math.round(1.5 / delta); index += 1) {
    state = advanceTruckRollover(state, releaseMotion, delta, DEFAULT_TRUCK_DYNAMICS_PROFILE);
    const sign = Math.sign(state.rollAngle || lastSign);
    if (sign !== lastSign) crossing++;
    lastSign = sign;
    if (wheelClear === null && state.wheelLiftLeft + state.wheelLiftRight === 0) wheelClear = (index + 1) * delta;
    if (time === null && Math.abs(state.rollAngle) <= 0.02 && Math.abs(state.rollVelocity) <= 0.06) time = (index + 1) * delta;
    assert.ok(Number.isFinite(state.rollAngle) && Number.isFinite(state.rollVelocity) && Number.isFinite(state.rolloverRisk));
    assert.equal(state.tipped, false, "release from a recoverable lean must not tip at constant, straight speed");
  }
  return { time, crossing, wheelClear, state };
}
const fineSettle = settleAtRate(1 / 120), coarseSettle = settleAtRate(1 / 30);
assert.ok(fineSettle.time >= 0.4 && fineSettle.time <= 0.75, "shocks flatten the rig within the intended 0.4–0.75 second window");
assert.equal(fineSettle.crossing, 0, "the loaded truck never overshoots level during rebound");
assert.ok(fineSettle.wheelClear < fineSettle.time, "ground contact returns before the body finishes settling");
assert.ok(Math.abs(fineSettle.time - coarseSettle.time) <= 0.1, "settling is stable across display frame rates");
assert.ok(Math.abs(fineSettle.state.rollAngle) < 0.0001, "rebound cannot leave a permanent tilt");

console.log("Rollover regressions passed: outward cornering, inward drift, heavy high-speed tip, wrong countersteer, recovery and bounded telemetry.");
