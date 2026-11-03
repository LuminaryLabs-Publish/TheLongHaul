import assert from "node:assert/strict";
import { advanceTruckRollover } from "../src/game/truck-rollover.mjs";

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
console.log("Rollover regressions passed: outward cornering, inward drift, heavy high-speed tip, wrong countersteer, recovery and bounded telemetry.");
