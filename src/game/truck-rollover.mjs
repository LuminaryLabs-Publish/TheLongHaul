import { clamp, finite } from "./shared.mjs";

// One bounded stability state governs both visible wheel unloading and the
// actual rollover. No random wobble, second clock, or fake wheel-height input.
export function advanceTruckRollover(previous, motion, dt, profile) {
  const roll = profile.roll ?? {};
  const load = motion.load;
  const grounded = Boolean(motion.grounded);
  const tippedBefore = Boolean(previous.tipped);
  const speed = Math.hypot(motion.longitudinal, motion.lateral);
  const maxLean = clamp(finite(roll.maximumAngle, 0.95), 0.55, 1.12);
  const lateralAcceleration = finite(motion.yawRate) * finite(motion.longitudinal);
  const outward = clamp(
    -lateralAcceleration * finite(roll.lateralScale, 0.034) * load.rollScale
      + motion.loadShift.x * load.payloadFraction * 0.32,
    -maxLean, maxLean
  );
  // A qualified slide shifts the body into the slide instead of using the
  // ordinary outside-of-turn pose. The wheels and body use this same angle.
  const drift = motion.drift ?? {};
  const slideLean = drift.active
    ? Math.sign(drift.direction) * clamp(0.16 + Math.abs(motion.lateral) * 0.033, 0.16, 0.46)
    : 0;
  const target = clamp(drift.active ? outward * 0.14 + slideLean * 0.86 : outward, -maxLean, maxLean);
  const spring = Math.max(0.01, finite(roll.spring, 19) * load.springScale);
  const damping = tippedBefore ? finite(roll.damping, 8.8) : Math.max(finite(roll.damping, 8.8), 2 * Math.sqrt(spring));
  const settledAngle = finite(roll.settledAngle, 1.48);
  let rollAngle = finite(previous.rollAngle);
  let rollVelocity = finite(previous.rollVelocity);
  const desired = tippedBefore ? Math.sign(rollAngle || rollVelocity || 1) * settledAngle : grounded ? target : rollAngle;
  rollVelocity += ((desired - rollAngle) * spring - rollVelocity * damping) * dt;
  rollAngle += rollVelocity * dt;
  if (!tippedBefore) {
    rollAngle = clamp(rollAngle, -maxLean, maxLean);
    if (Math.abs(rollAngle) >= maxLean && Math.sign(rollVelocity) === Math.sign(rollAngle)) rollVelocity = 0;
  }
  const wrongLean = drift.active && Math.sign(drift.direction) * rollAngle < -0.14 ? 0.48 : 0;
  const violentCountersteer = drift.active && drift.phase === "countersteer"
    && motion.yawRate * drift.direction < -0.32 ? 0.36 : 0;
  const risk = Math.abs(lateralAcceleration) * 0.026 * (1 + load.payloadFraction * 0.25)
    + Math.abs(motion.loadShift.x) * 0.2
    + Math.max(0, Math.abs(rollAngle) - 0.35) * 0.85
    + Math.abs(rollVelocity) * 0.11 + wrongLean + violentCountersteer;
  let exposure = clamp(finite(previous.rolloverExposure), 0, 1.5);
  const atRisk = grounded && speed > 9 && Math.abs(rollAngle) > 0.46 && risk > 1.05;
  exposure = clamp(exposure + (atRisk ? dt * clamp(risk / 1.05, 1, 2.4) : -dt * 2.5), 0, 1.5);
  const tipped = tippedBefore || exposure >= clamp(finite(roll.tipExposure, 0.36), 0.2, 0.9);
  if (tipped) rollAngle = clamp(rollAngle, -settledAngle * 1.05, settledAngle * 1.05);
  // Per-side lift is a presentation/telemetry consequence of roll angle;
  // the model never lifts the center contact sphere to create fake energy.
  const lift = grounded ? Math.max(0, Math.sin(Math.abs(rollAngle)) * 1.52 - 0.35) : 0;
  return {
    rollAngle, rollVelocity, tipped,
    rolloverExposure: exposure,
    rolloverRisk: Number.isFinite(risk) ? risk : 0,
    wheelLiftLeft: rollAngle < 0 ? lift : 0,
    wheelLiftRight: rollAngle > 0 ? lift : 0,
    rollMode: tipped ? "tipped" : atRisk ? "critical" : lift > 0.12 ? "wheel-lift" : drift.active ? "controlled-drift" : "planted"
  };
}
