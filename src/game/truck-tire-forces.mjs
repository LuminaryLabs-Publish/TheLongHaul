import { clamp, finite } from './shared.mjs';
import { DEFAULT_TRUCK_DYNAMICS_PROFILE } from './truck-dynamics-profile-kit.mjs';

// Movement V2: two equivalent tire axles drive the *same* truck body. The
// six rendered wheels need no additional collider/rigid-body state. Positive
// x is truck-right, positive z is forward and positive yaw turns right.
// Steering changes the tire contact direction, never the chassis yaw directly.
export function resolveTruckTireForces(motion, load, profile, contact = {}) {
  const mass = clamp(finite(load?.effectiveMass, 7800), 1500, 60000);
  const steering = profile.steering ?? {};
  const wheelbase = clamp(finite(steering.wheelbase, 6.1), 3, 9);
  const frontArm = wheelbase * 0.48;
  const rearArm = wheelbase - frontArm;
  const trackWidth = 2 * clamp(finite(profile.roll?.halfTrack, 1.68), 1.1, 2.4);
  const inertiaYaw = mass * (Math.pow(wheelbase * 1.22, 2) + trackWidth * trackWidth) / 12;
  const speed = finite(motion.longitudinal);
  const sideways = finite(motion.lateral);
  const yaw = finite(motion.yawRate);
  const steer = clamp(finite(motion.steeringAngle), -0.75, 0.75);

  // Contact normals/rigid box determine whether traction exists. A higher
  // effective COM affects box balance, but does not manufacture extra grip.
  const support = contact.grounded ? clamp(finite(contact.traction, 0), 0, 1) : 0;
  // Keep garage tire upgrades and road profiles effective. These historical
  // coefficients described damping, so map their *relative* changes to modest
  // physical friction changes rather than treating them as a new friction law.
  const kind = String(contact.gripKey ?? 'road');
  const baselineGrip = finite(DEFAULT_TRUCK_DYNAMICS_PROFILE.grip[kind], 5.8);
  const configuredGrip = finite(profile.grip?.[kind], baselineGrip);
  const tireUpgrade = clamp(0.6 + 0.4 * configuredGrip / Math.max(0.1, baselineGrip), 0.5, 1.45);
  const grip = clamp(finite(profile.springMass?.tireGripG, 1.13), 0.35, 1.4)
    * clamp(finite(contact.surfaceGrip, 1), 0, 1.2)
    * clamp(finite(load?.gripScale, 1), 0.35, 1.2) * tireUpgrade;
  // Braking moves support forward. This is the existing single compliant mass,
  // not a second spring or independently simulated cargo weight.
  const springZ = clamp(finite(contact.springDisplacementZ), -0.3, 0.3);
  const measuredFront = Math.max(0, finite(contact.contactLoads?.front));
  const measuredRear = Math.max(0, finite(contact.contactLoads?.rear));
  const measuredTotal = measuredFront + measuredRear;
  const frontShare = measuredTotal > mass * 9.81 * 0.03
    ? clamp(measuredFront / measuredTotal, 0.05, 0.95)
    : clamp(0.48 + springZ * 0.34, 0.36, 0.6);
  const normalFront = mass * 9.81 * frontShare * support;
  const normalRear = mass * 9.81 * (1 - frontShare) * support;
  const activeSlide = Boolean(contact.driftActive);
  const handbrake = Boolean(contact.handbrake);
  const frontMu = grip * (handbrake ? 0.9 : 1);
  // The handbrake and explicit drift reduce *rear* traction; normal steering
  // does not switch the entire truck into a low-grip animation mode.
  const slideGrip = clamp(0.5 + finite(profile.drift?.gripMultiplier, 0.16), 0.55, 0.95);
  const rearMu = grip * (handbrake ? 0.35 : activeSlide ? slideGrip : 1);

  // Contact-point velocity includes yaw motion: v_contact = v_com + omega x r.
  // Project the front contact sideways onto the wheel's steering direction.
  const frontSideSpeed = (sideways + yaw * frontArm) * Math.cos(steer) - speed * Math.sin(steer);
  const rearSideSpeed = sideways - yaw * rearArm;
  // Saturating tire forces: small slip gives a strong restoring force; large
  // slip cannot exceed friction. This permits ordinary turning and understeer.
  const slipSpeed = clamp(finite(profile.springMass?.tireSlipSpeed, 2.6), 0.7, 6);
  const frontForce = -frontMu * normalFront * Math.tanh(frontSideSpeed / slipSpeed);
  const rearForce = -rearMu * normalRear * Math.tanh(rearSideSpeed / slipSpeed);
  const lateralForce = frontForce * Math.cos(steer) + rearForce;
  const forwardForce = -frontForce * Math.sin(steer);
  const yawTorque = frontArm * frontForce * Math.cos(steer) - rearArm * rearForce;
  return {
    lateralAcceleration: lateralForce / mass,
    forwardAcceleration: forwardForce / mass,
    yawAcceleration: yawTorque / inertiaYaw,
    frontForce, rearForce, frontSideSpeed, rearSideSpeed,
    frontNormal: normalFront, rearNormal: normalRear,
    traction: support
  };
}
