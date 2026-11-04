import { clamp, finite } from "./shared.mjs";

// Movement V2: one invisible spring-mass representing compliant sprung weight.
// The moving mass is a *partition* of cargoDynamics.effectiveMass, not extra mass.
// Its reaction only controls existing chassis pose/balance; it cannot create
// thrust, alter travel speed, or duplicate cargo impulse energy.
export function createTruckSpringMassState(value = {}) {
  const axis = (v) => ({ x: clamp(finite(v?.x), -1.5, 1.5), y: clamp(finite(v?.y), -1.5, 1.5), z: clamp(finite(v?.z), -1.5, 1.5) });
  return { displacement: axis(value.displacement), velocity: {
    x: clamp(finite(value.velocity?.x), -20, 20),
    y: clamp(finite(value.velocity?.y), -20, 20),
    z: clamp(finite(value.velocity?.z), -20, 20)
  } };
}

export function advanceTruckSpringMass(previous, acceleration, load, dt, settings = {}) {
  const step = clamp(finite(dt), 0, 1 / 60);
  const mass = clamp(finite(load?.effectiveMass, 7800), 1500, 60000);
  // The other share is rigid chassis; the COM/mass used by the drivetrain
  // remains authoritative and no extra kilograms are introduced.
  const participation = clamp(finite(settings.participation, 0.8), 0.15, 0.95);
  const sprungMass = mass * participation;
  const frequency = clamp(finite(settings.frequencyHz, 1.8), 0.7, 4);
  const omega = 2 * Math.PI * frequency;
  const dampingRatio = clamp(finite(settings.dampingRatio, 1.0), 0.75, 1.45);
  // The spring has one fixed physical tension at the stock truck mass.
  // Added freight increases inertia/deflection rather than silently making
  // the spring stiffer by exactly the added mass.
  const referenceMass = 7800 * participation;
  const stiffness = referenceMass * omega * omega;
  const damping = 2 * dampingRatio * Math.sqrt(stiffness * sprungMass);
  const maxDisplacement = clamp(finite(settings.maxDisplacement, 0.9), 0.2, 1.5);
  const state = createTruckSpringMassState(previous);
  const reaction = { x: 0, y: 0, z: 0 };
  const forces = { x: 0, y: 0, z: 0 };
  const input = {
    x: clamp(finite(acceleration?.x), -35, 35),
    y: clamp(finite(acceleration?.y), -25, 25),
    z: clamp(finite(acceleration?.z), -35, 35)
  };
  for (const axis of ['x', 'y', 'z']) {
    // Spring force on the mass plus inertial pseudo-force of the moving
    // chassis; reaction on the chassis is the equal/opposite spring force.
    const force = -stiffness * state.displacement[axis] - damping * state.velocity[axis];
    let velocity = state.velocity[axis] + (force / sprungMass - input[axis]) * step;
    let displacement = state.displacement[axis] + velocity * step;
    if (Math.abs(displacement) > maxDisplacement) {
      displacement = Math.sign(displacement) * maxDisplacement;
      if (velocity * displacement > 0) velocity = 0; // No energy-injecting bounce.
    }
    state.displacement[axis] = displacement;
    state.velocity[axis] = velocity;
    forces[axis] = -stiffness * displacement - damping * velocity;
    reaction[axis] = -forces[axis];
  }
  // Mechanical energy, in the truck's accelerated frame, is observable and
  // finite. With zero acceleration and nonnegative damping it must decay.
  const energy = 0.5 * sprungMass * (state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2)
    + 0.5 * stiffness * (state.displacement.x ** 2 + state.displacement.y ** 2 + state.displacement.z ** 2);
  return { ...state, reaction, energy, sprungMass, stiffness, damping };
}

export function springBodyState(previous, spring, acceleration, load, profile, grounded, speed, dt) {
  const cfg = profile.springMass ?? {};
  const centerHeight = clamp(finite(load.centerOfMassHeight, 1.35), 0.5, 3.5);
  const halfTrack = clamp(finite(profile.roll?.halfTrack, 1.68), 1.1, 2.4);
  const halfWheelbase = clamp(finite(profile.steering?.wheelbase, 6.1) * 0.5, 2, 4);
  const compliance = clamp(finite(cfg.rollCompliance, 4.5), 1, 8);
  const pitchCompliance = clamp(finite(cfg.pitchCompliance, 3.0), 1, 6);
  const maxLean = clamp(finite(cfg.maximumLean, 0.97), 0.4, 1.15);
  const settledAngle = clamp(finite(profile.roll?.settledAngle, 1.48), 1.2, 1.6);
  // A high center of mass increases the leverage of the spring reaction.
  // The fixed chassis pivot is independent of cargo height, so a top-heavy
  // load creates more roll instead of being divided by a taller COM height.
  const chassisCenter = 1.35;
  const heightLeverage = centerHeight / chassisCenter;
  const rollAngle = previous.tipped ? Math.sign(previous.rollAngle || 1) * settledAngle
    : grounded ? clamp(Math.atan2(spring.displacement.x * compliance * heightLeverage, chassisCenter), -maxLean, maxLean)
    : finite(previous.rollAngle);
  const pitch = grounded ? clamp(Math.atan2(spring.displacement.z * pitchCompliance, halfWheelbase), -0.42, 0.42)
    : finite(previous.bodyPitch);
  // Effective gravity line through the combined COM and spring displacement.
  // Lose balance when lateral inertia pushes it beyond the existing tire track.
  const gShift = grounded ? -acceleration.x * centerHeight / 9.81 : 0;
  const projected = centerHeight * Math.tan(rollAngle) + spring.displacement.x + gShift;
  const stability = Math.abs(projected) / halfTrack;
  const wheelLift = grounded ? Math.max(0, Math.abs(Math.sin(rollAngle)) * halfTrack - 0.32) : 0;
  let exposure = clamp(finite(previous.rolloverExposure), 0, 1.5);
  exposure = clamp(exposure + (grounded && speed > 8 && stability > 1 ? dt * (stability - 1) * 1.3 : -dt * 2.0), 0, 1.5);
  const tipped = Boolean(previous.tipped) || exposure > clamp(finite(cfg.tipExposure, 0.28), 0.12, 0.65);
  return {
    rollAngle: tipped ? Math.sign(rollAngle || 1) * settledAngle : rollAngle,
    rollVelocity: (rollAngle - finite(previous.rollAngle)) / Math.max(dt, 1e-6),
    bodyPitch: pitch,
    tipped, rolloverExposure: exposure, rolloverRisk: stability,
    wheelLiftLeft: rollAngle < 0 ? wheelLift : 0,
    wheelLiftRight: rollAngle > 0 ? wheelLift : 0,
    rollMode: tipped ? 'tipped' : stability > 1 ? 'critical' : wheelLift > 0.12 ? 'wheel-lift' : 'planted'
  };
}
