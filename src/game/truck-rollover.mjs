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
  // A qualified slide shifts the body into the slide instead of using the
  // ordinary outside-of-turn pose. The wheels and body use this same angle.
  const drift = motion.drift ?? {};
  // A single rotational degree of freedom: tire side-force and moving cargo
  // generate moments about the truck's center of mass. Suspension roll
  // stiffness and a critically damped shock resist those moments.  There is
  // no separate pose easing or free-standing cosmetic roll animation.
  const mass = clamp(finite(load.effectiveMass, 7800), 1500, 60000);
  const centerHeight = clamp(finite(load.centerOfMassHeight, 1.35), 0.5, 3.5);
  const halfTrack = clamp(finite(roll.halfTrack, 1.68), 1.1, 2.4);
  const momentOfInertia = mass * ((2 * halfTrack) ** 2 / 12 + centerHeight ** 2 * 0.2);
  const stiffness = mass * 9.81 * halfTrack * clamp(finite(roll.restoringStiffness, 6.5), 2, 9);
  const dampingRatio = clamp(finite(roll.dampingRatio, 1), 0.7, 1.4);
  const dampingTorque = 2 * dampingRatio * Math.sqrt(stiffness * momentOfInertia);
  // Sliding greatly reduces road-tire side force, while the drifting wheels
  // still transmit a force set by their real sideways velocity. A controlled
  // drift therefore leans inward; mistimed countersteer can still overload it.
  const cornerForce = -mass * centerHeight * lateralAcceleration
    * clamp(finite(roll.tireForceGain, 2.1), 0.8, 3) * (drift.active ? 0.22 : 1);
  const slideForce = drift.active ? Math.sign(drift.direction) * mass * centerHeight
    * clamp(3.5 + Math.abs(motion.lateral) * 1.3, 3.5, 10)
    * clamp(finite(roll.slipForceGain, 1.85), 0.75, 2.5) : 0;
  const shiftedLoad = mass * 9.81 * centerHeight * motion.loadShift.x * load.payloadFraction * 0.65;
  const settledAngle = finite(roll.settledAngle, 1.48);
  let rollAngle = finite(previous.rollAngle);
  let rollVelocity = finite(previous.rollVelocity);
  const rollMoment = tippedBefore
    ? -stiffness * (rollAngle - Math.sign(rollAngle || rollVelocity || 1) * settledAngle)
    : grounded ? cornerForce + slideForce + shiftedLoad - stiffness * Math.sin(rollAngle)
      : 0;
  const angularAcceleration = (rollMoment - dampingTorque * rollVelocity) / momentOfInertia;
  rollVelocity += angularAcceleration * dt;
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
  const lift = grounded ? Math.max(0, Math.sin(Math.abs(rollAngle)) * halfTrack - 0.32) : 0;
  return {
    rollAngle, rollVelocity, tipped,
    rolloverExposure: exposure,
    rolloverRisk: Number.isFinite(risk) ? risk : 0,
    wheelLiftLeft: rollAngle < 0 ? lift : 0,
    wheelLiftRight: rollAngle > 0 ? lift : 0,
    rollMode: tipped ? "tipped" : atRisk ? "critical" : lift > 0.12 ? "wheel-lift" : drift.active ? "controlled-drift" : "planted"
  };
}
