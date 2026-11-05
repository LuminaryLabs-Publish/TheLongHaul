import { clamp, finite } from './shared.mjs';

// Movement V2's single reactive rigid-body cross-section. The box is never
// rendered. Its bottom and upper corner contacts provide torque, so lying on
// a side is an ordinary orientation/contact outcome, not a rollover mode.
const G = 9.81;
const identity = () => ({ x: 0, y: 0, z: 0, w: 1 });

function normalized(q = identity()) {
  const x = finite(q.x), y = finite(q.y), z = finite(q.z), w = finite(q.w, 1);
  const inv = 1 / (Math.hypot(x, y, z, w) || 1);
  return { x: x * inv, y: y * inv, z: z * inv, w: w * inv };
}
function rotated(q, x, y, z) {
  const tx = 2 * (q.y * z - q.z * y);
  const ty = 2 * (q.z * x - q.x * z);
  const tz = 2 * (q.x * y - q.y * x);
  return {
    x: x + q.w * tx + q.y * tz - q.z * ty,
    y: y + q.w * ty + q.z * tx - q.x * tz,
    z: z + q.w * tz + q.x * ty - q.y * tx
  };
}
function integrate(q, wx, wz, dt) {
  // Angular velocity belongs to the truck's yaw-relative world frame.
  return normalized({
    x: q.x + 0.5 * (wx * q.w - wz * q.y) * dt,
    y: q.y + 0.5 * (wz * q.x - wx * q.z) * dt,
    z: q.z + 0.5 * (wx * q.y + wz * q.w) * dt,
    w: q.w - 0.5 * (wx * q.x + wz * q.z) * dt
  });
}
export function createReactiveBodyState(value = {}, centerHeight = 1.35) {
  return {
    quaternion: normalized(value.quaternion),
    angularVelocity: { x: clamp(finite(value.angularVelocity?.x), -6, 6), z: clamp(finite(value.angularVelocity?.z), -6, 6) },
    centerY: clamp(finite(value.centerY, centerHeight), 0.2, 8),
    verticalVelocity: clamp(finite(value.verticalVelocity), -20, 20),
    massCenterHeight: clamp(finite(value.massCenterHeight, centerHeight), 0.5, 3.5)
  };
}

// This is a bounded semi-implicit rigid-body step, not a posture controller.
// Normal forces are resolved at actual box corners. A supporting contact's
// r x F torque both arrests falls and lets gravity continue one past balance.
export function advanceReactiveBody(previous, spring, acceleration, load, profile, dt, onGround = true) {
  const step = clamp(finite(dt), 0, 1 / 60);
  const mass = clamp(finite(load?.effectiveMass, 7800), 1500, 60000);
  const height = clamp(finite(load?.centerOfMassHeight, 1.35), 0.5, 3.5);
  const cfg = profile.springMass ?? {};
  const halfWidth = clamp(finite(profile.roll?.halfTrack, 1.68), 1.1, 2.4);
  const halfLength = clamp(finite(profile.steering?.wheelbase, 6.1) * 0.54, 2.3, 4.3);
  const boxHeight = clamp(finite(cfg.boxHeight, 4.7), height + 0.35, 6);
  const width = 2 * halfWidth, length = 2 * halfLength;
  const inertiaPitch = mass * (boxHeight ** 2 + length ** 2) / 12;
  const inertiaRoll = mass * (boxHeight ** 2 + width ** 2) / 12;
  const body = createReactiveBodyState(previous, height);
  // Loading moves the COM within the same physical box, not the rendered rig.
  body.centerY += height - body.massCenterHeight;
  body.massCenterHeight = height;
  const q = body.quaternion;
  const frequency = clamp(finite(cfg.contactFrequencyHz, 1.6), 1.5, 5);
  const omegaContact = 2 * Math.PI * frequency;
  const springK = mass * omegaContact ** 2 / 4; // Four lower support corners.
  const shockC = mass * omegaContact * clamp(finite(cfg.contactDampingRatio, 0.92), 0.5, 1.3) / 4;
  let normalTotal = 0, rollTorque = 0, pitchTorque = 0;
  let bottomLeft = 0, bottomRight = 0, bodyContact = 0;
  let leftClearance = Infinity, rightClearance = Infinity;
  // Rotated box corners are the only chassis contact shape. No special side
  // collision or roll angle threshold; any face may support the truck.
  for (const x of [-halfWidth, halfWidth]) for (const z of [-halfLength, halfLength]) {
    for (const localY of [-height, boxHeight - height]) {
      const r = rotated(q, x, localY, z);
      const gap = body.centerY + r.y;
      if (localY === -height) {
        if (x < 0) leftClearance = Math.min(leftClearance, gap);
        else rightClearance = Math.min(rightClearance, gap);
      }
      if (!onGround || gap >= 0) continue;
      const verticalSpeed = body.verticalVelocity + body.angularVelocity.z * r.x - body.angularVelocity.x * r.z;
      const normal = clamp(springK * -gap - shockC * verticalSpeed, 0, mass * G * 6);
      normalTotal += normal;
      rollTorque += r.x * normal;
      pitchTorque -= r.z * normal;
      if (localY === -height) {
        if (x < 0) bottomLeft += normal;
        else bottomRight += normal;
      } else bodyContact += normal;
    }
  }
  // Split the original truck's mass; there is no additional invisible weight.
  // Tires supply acceleration at the road, below the COM. The rigid fraction
  // contributes instantaneous inertia and the compliant share contributes the
  // *spring reaction*. At steady acceleration they sum to mass * acceleration.
  const rigidMass = mass - clamp(finite(spring?.sprungMass), 0, mass);
  const inertialX = rigidMass * clamp(finite(acceleration?.x), -35, 35) - finite(spring?.reaction?.x);
  const inertialZ = rigidMass * clamp(finite(acceleration?.z), -35, 35) - finite(spring?.reaction?.z);
  if (onGround) {
    rollTorque += inertialX * height;
    pitchTorque -= inertialZ * height;
  }
  const drag = Math.exp(-(onGround ? 0.18 : 0.06) * step);
  const wx = clamp((body.angularVelocity.x + pitchTorque / inertiaPitch * step) * drag, -5, 5);
  const wz = clamp((body.angularVelocity.z + rollTorque / inertiaRoll * step) * drag, -5, 5);
  body.angularVelocity = { x: wx, z: wz };
  body.quaternion = integrate(q, wx, wz, step);
  if (onGround) {
    body.verticalVelocity = clamp(body.verticalVelocity + (normalTotal / mass - G) * step, -15, 15);
    body.centerY = clamp(body.centerY + body.verticalVelocity * step, 0.15, 7);
  }
  const up = rotated(body.quaternion, 0, 1, 0).y;
  const forward = rotated(body.quaternion, 0, 0, 1);
  const right = rotated(body.quaternion, 1, 0, 0);
  const pitch = Math.atan2(-forward.y, Math.max(1e-5, Math.hypot(forward.x, forward.z)));
  const roll = Math.atan2(right.y, up);
  const wheelLoad = bottomLeft + bottomRight;
  const gripRatio = onGround ? clamp((wheelLoad / (mass * G)) * clamp(up, 0, 1), 0, 1) : 0;
  const leftLift = Math.max(0, leftClearance - clamp(finite(cfg.freeWheelTravel, 0.18), 0.05, 0.35));
  const rightLift = Math.max(0, rightClearance - clamp(finite(cfg.freeWheelTravel, 0.18), 0.05, 0.35));
  // Backwards-compatible HUD/roadside labels are derived from orientation,
  // never latched or read by the dynamics to make the body fall.
  const tipped = up < 0.25;
  return {
    body, rollAngle: roll, rollVelocity: wz,
    bodyPitch: pitch, bodyRoll: roll, tipped,
    rolloverRisk: Math.max(0, 1 - gripRatio), rolloverExposure: 0,
    driveTraction: gripRatio, wheelLiftLeft: leftLift, wheelLiftRight: rightLift,
    contactLoads: { left: bottomLeft, right: bottomRight, body: bodyContact },
    rollMode: tipped ? 'tipped' : gripRatio < 0.35 ? 'critical' : Math.max(leftLift, rightLift) > 0.12 ? 'wheel-lift' : 'planted'
  };
}
