import { clamp, finite } from './shared.mjs';

// The V2 truck has one physical orientation. The same quaternion drives
// chassis contacts, wheel loading, rollover telemetry and visual presentation.
const G = 9.81;
const identity = () => ({ x: 0, y: 0, z: 0, w: 1 });
const vec = (v = {}) => ({ x: finite(v.x), y: finite(v.y), z: finite(v.z) });
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
function normalized(q = identity()) {
  const x = finite(q.x), y = finite(q.y), z = finite(q.z), w = finite(q.w, 1);
  const inv = 1 / (Math.hypot(x, y, z, w) || 1);
  return { x: x * inv, y: y * inv, z: z * inv, w: w * inv };
}
function rotated(q, x, y, z) {
  const tx = 2 * (q.y * z - q.z * y), ty = 2 * (q.z * x - q.x * z), tz = 2 * (q.x * y - q.y * x);
  return { x: x + q.w * tx + q.y * tz - q.z * ty,
    y: y + q.w * ty + q.z * tx - q.x * tz,
    z: z + q.w * tz + q.x * ty - q.y * tx };
}
function integrate(q, w, dt) {
  // World-space quaternion derivative: qDot = 0.5 * omega * q.
  return normalized({
    x: q.x + 0.5 * ( w.x * q.w + w.y * q.z - w.z * q.y) * dt,
    y: q.y + 0.5 * (-w.x * q.z + w.y * q.w + w.z * q.x) * dt,
    z: q.z + 0.5 * ( w.x * q.y - w.y * q.x + w.z * q.w) * dt,
    w: q.w - 0.5 * ( w.x * q.x + w.y * q.y + w.z * q.z) * dt
  });
}
export function chassisHeading(q) {
  const f = rotated(normalized(q), 0, 0, 1);
  return Math.atan2(f.x, f.z);
}
export function createReactiveBodyState(value = {}, centerHeight = 1.35) {
  return {
    quaternion: normalized(value.quaternion),
    angularVelocity: {
      x: clamp(finite(value.angularVelocity?.x), -6, 6),
      y: clamp(finite(value.angularVelocity?.y), -6, 6),
      z: clamp(finite(value.angularVelocity?.z), -6, 6)
    },
    // Height of the rigid center of mass above the local ground reference.
    centerY: clamp(finite(value.centerY, centerHeight), -4, 15),
    verticalVelocity: clamp(finite(value.verticalVelocity), -40, 40),
    massCenterHeight: clamp(finite(value.massCenterHeight, centerHeight), 0.5, 3.5)
  };
}

// One integrated rigid-body orientation and vertical contact response.
// Road samples provide the local contact plane; individual wheel/corner
// reactions, not a pose target or spherical height clamp, support the truck.
export function advanceReactiveBody(previous, spring, acceleration, load, profile, dt, onGround = true, contact = {}) {
  const step = clamp(finite(dt), 0, 1 / 60);
  const mass = clamp(finite(load?.effectiveMass, 7800), 1500, 60000);
  const height = clamp(finite(load?.centerOfMassHeight, 1.35), 0.5, 3.5);
  const cfg = profile.springMass ?? {};
  const halfWidth = clamp(finite(profile.roll?.halfTrack, 1.68), 1.1, 2.4);
  const halfLength = clamp(finite(profile.steering?.wheelbase, 6.1) * 0.54, 2.3, 4.3);
  const boxHeight = clamp(finite(cfg.boxHeight, 4.7), height + 0.35, 6);
  const inertia = {
    x: mass * (boxHeight ** 2 + (2 * halfLength) ** 2) / 12,
    y: mass * ((2 * halfWidth) ** 2 + (2 * halfLength) ** 2) / 12,
    z: mass * (boxHeight ** 2 + (2 * halfWidth) ** 2) / 12
  };
  const body = createReactiveBodyState(previous, height);
  body.centerY += height - body.massCenterHeight;
  body.massCenterHeight = height;
  const q = body.quaternion;
  const surface = vec(contact.normal ?? { y: 1 });
  const invNormal = 1 / Math.max(1e-6, Math.hypot(surface.x, surface.y, surface.z));
  const normal = { x: surface.x * invNormal, y: Math.max(0.25, surface.y * invNormal), z: surface.z * invNormal };
  const frequency = clamp(finite(cfg.contactFrequencyHz, 1.6), 1.5, 5);
  const omega = 2 * Math.PI * frequency;
  const springK = mass * omega ** 2 / 4;
  const shockC = mass * omega * clamp(finite(cfg.contactDampingRatio, 0.92), 0.5, 1.3) / 4;
  let normalTotal = 0, bottomLeft = 0, bottomRight = 0, bodyContact = 0;
  let leftClearance = Infinity, rightClearance = Infinity;
  const torque = { x: 0, y: 0, z: 0 };
  // Four wheel footprint corners plus four chassis/roof corners are the
  // support geometry; upper contacts allow stable side/roof resting.
  for (const x of [-halfWidth, halfWidth]) for (const z of [-halfLength, halfLength]) {
    for (const localY of [-height, boxHeight - height]) {
      const r = rotated(q, x, localY, z);
      const gap = body.centerY + r.y + (normal.x * r.x + normal.z * r.z) / normal.y;
      if (localY === -height) {
        if (x < 0) leftClearance = Math.min(leftClearance, gap);
        else rightClearance = Math.min(rightClearance, gap);
      }
      if (!onGround || gap >= 0) continue;
      const atContact = cross(body.angularVelocity, r);
      const closingSpeed = dot({ x: atContact.x, y: body.verticalVelocity + atContact.y, z: atContact.z }, normal);
      const force = clamp(springK * -gap - shockC * closingSpeed, 0, mass * G * 6);
      normalTotal += force;
      const moment = cross(r, { x: normal.x * force, y: normal.y * force, z: normal.z * force });
      torque.x += moment.x; torque.y += moment.y; torque.z += moment.z;
      if (localY === -height) { if (x < 0) bottomLeft += force; else bottomRight += force; }
      else bodyContact += force;
    }
  }
  const rigidMass = mass - clamp(finite(spring?.sprungMass), 0, mass);
  const inertialX = rigidMass * clamp(finite(acceleration?.x), -35, 35) - finite(spring?.reaction?.x);
  const inertialZ = rigidMass * clamp(finite(acceleration?.z), -35, 35) - finite(spring?.reaction?.z);
  if (onGround) {
    const facing = rotated(q, 0, 0, 1), right = rotated(q, 1, 0, 0);
    const force = { x: right.x * inertialX + facing.x * inertialZ, y: 0, z: right.z * inertialX + facing.z * inertialZ };
    const moment = cross({ x: 0, y: -height, z: 0 }, force);
    torque.x += moment.x; torque.z += moment.z;
  }
  // Tire steering enters through the SAME angular velocity that supports
  // pitch and roll. No heading snap or separate yaw pose integration.
  torque.y += inertia.y * finite(contact.yawAcceleration);
  const damping = Math.exp(-(onGround ? 0.18 : 0.06) * step);
  body.angularVelocity = {
    x: clamp((body.angularVelocity.x + torque.x / inertia.x * step) * damping, -5, 5),
    y: clamp((body.angularVelocity.y + torque.y / inertia.y * step) * damping, -3, 3),
    z: clamp((body.angularVelocity.z + torque.z / inertia.z * step) * damping, -5, 5)
  };
  body.quaternion = integrate(q, body.angularVelocity, step);
  body.verticalVelocity = clamp(body.verticalVelocity + (normalTotal * normal.y / mass - G) * step, -40, 30);
  body.centerY = clamp(body.centerY + body.verticalVelocity * step, -4, 15);
  const up = rotated(body.quaternion, 0, 1, 0);
  const forward = rotated(body.quaternion, 0, 0, 1);
  const right = rotated(body.quaternion, 1, 0, 0);
  const pitch = Math.atan2(-forward.y, Math.max(1e-5, Math.hypot(forward.x, forward.z)));
  const roll = Math.atan2(right.y, up.y);
  const wheelLoad = bottomLeft + bottomRight;
  const gripRatio = onGround ? clamp((wheelLoad / (mass * G)) * clamp(up.y, 0, 1), 0, 1) : 0;
  const leftLift = Math.max(0, leftClearance - clamp(finite(cfg.freeWheelTravel, 0.18), 0.05, 0.35));
  const rightLift = Math.max(0, rightClearance - clamp(finite(cfg.freeWheelTravel, 0.18), 0.05, 0.35));
  const tipped = up.y < 0.25;
  return {
    body, rollAngle: roll, rollVelocity: body.angularVelocity.z, bodyPitch: pitch, bodyRoll: roll, tipped,
    rolloverRisk: Math.max(0, 1 - gripRatio), rolloverExposure: 0,
    driveTraction: gripRatio, wheelLiftLeft: leftLift, wheelLiftRight: rightLift,
    contactLoads: { left: bottomLeft, right: bottomRight, body: bodyContact },
    rollMode: tipped ? 'tipped' : gripRatio < 0.35 ? 'critical' : Math.max(leftLift, rightLift) > 0.12 ? 'wheel-lift' : 'planted'
  };
}
