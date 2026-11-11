import assert from 'node:assert/strict';
import { createReactiveBodyState, advanceReactiveBody, chassisHeading } from '../src/game/truck-reactive-body.mjs';
import { DEFAULT_TRUCK_DYNAMICS_PROFILE as profile } from '../src/game/truck-dynamics-profile-kit.mjs';

// Source-pinned Phase 2 fixture. Exercises the real V2 rigid-body contact code,
// not a separate physics mock, and makes no graphics or deployment claims.
const load = { effectiveMass: 7800, centerOfMassHeight: 1.35 };
const spring = { sprungMass: 0, reaction: { x: 0, z: 0 } };
const zero = { x: 0, y: 0, z: 0 };
const fixed = 1 / 120;
function advance(body, contact = {}) {
  return advanceReactiveBody(body, spring, zero, load, profile, fixed, true, { normal: { x: 0, y: 1, z: 0 }, ...contact });
}
function run(body, count, contact = {}) {
  let result;
  for (let i = 0; i < count; i++) { result = advance(body, contact); body = result.body; }
  return result;
}
const rest = run(createReactiveBodyState(), 240);
assert.ok(Number.isFinite(rest.body.centerY));
assert.ok(rest.body.centerY > 0.9 && rest.body.centerY < 1.5, 'contact springs support real weight');
assert.ok(Math.abs(rest.body.verticalVelocity) < 2, 'suspension converges without height snapping');
assert.ok(rest.contactLoads.front > 0 && rest.contactLoads.rear > 0, 'front and rear wheel reactions exist');

const yaw = run(createReactiveBodyState(), 90, { yawAcceleration: 0.7 });
assert.ok(Math.abs(chassisHeading(yaw.body.quaternion)) > 0.05, 'yaw is part of one quaternion');
assert.ok(Math.abs(yaw.body.angularVelocity.y) > 0.05, 'yaw is integrated as angular velocity');

const tipped = run(createReactiveBodyState({ angularVelocity: { x: 0, y: 0, z: 4.5 } }), 180);
assert.ok(Math.abs(tipped.body.quaternion.z) > 0.03 || Math.abs(tipped.body.quaternion.x) > 0.03,
  'impact spin changes rigid orientation');
assert.ok(tipped.body.quaternion && ['x','y','z','w'].every(k => Number.isFinite(tipped.body.quaternion[k])),
  'quaternion remains finite');

const airborne = createReactiveBodyState({ centerY: 5, verticalVelocity: 0 });
const falling = run(airborne, 24);
assert.ok(falling.body.centerY < 5 && falling.body.verticalVelocity < 0,
  'gravity acts while suspension is out of contact');
console.log('Unified six-degree truck body regression passed');
