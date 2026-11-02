import { clamp, finite } from "./shared.mjs";

// The reserve is stored *dissipated* kinetic energy per unit mass, never a
// second engine. Momentum/charge are presentation values derived from it.
export function createDriftState(previous = {}, preserveHistory = false) {
  return {
    active: false, phase: "idle", direction: 0, energy: 0, momentum: 0,
    charge: 0, duration: 0, distance: 0, entrySpeed: 0, maxAngle: 0,
    counterTime: 0, releaseGrace: 0, cooldown: 0,
    sequence: preserveHistory ? Math.max(0, finite(previous.sequence)) : 0,
    releaseSequence: preserveHistory ? Math.max(0, finite(previous.releaseSequence)) : 0,
    lastManeuver: preserveHistory ? previous.lastManeuver ?? null : null
  };
}

function finish(drift, speed, countersteer, reason) {
  const result = createDriftState(drift, true);
  result.cooldown = 0.45;
  result.phase = countersteer ? "released" : "idle";
  result.releaseSequence += countersteer ? 1 : 0;
  if (drift.duration >= 0.22 && drift.maxAngle >= 0.08) {
    result.lastManeuver = {
      sequence: drift.sequence, duration: drift.duration, distance: drift.distance,
      entrySpeed: drift.entrySpeed, exitSpeed: speed, maxAngle: drift.maxAngle,
      reserve: drift.momentum, countersteer, reason, releaseSequence: result.releaseSequence
    };
  }
  return result;
}

export function prepareDrift(previous, input, context, delta) {
  const dt = clamp(finite(delta), 0, 1 / 15);
  const drift = { ...createDriftState(), ...previous };
  drift.cooldown = Math.max(0, finite(drift.cooldown) - dt);
  if (drift.phase === "released" && drift.cooldown <= 0) drift.phase = "idle";
  const speed = Math.max(0, finite(context.speed));
  if (!context.grounded || context.tipped) {
    const cleared = createDriftState(drift, true);
    cleared.cooldown = Math.max(drift.cooldown, 0.2);
    return cleared;
  }
  if (speed < 1 || context.longitudinal <= 0.2) {
    return drift.active ? finish(drift, speed, false, "stopped") : createDriftState(drift, true);
  }
  const requested = input.drift || input.brake > 0.12;
  if (!drift.active && drift.cooldown <= 0 && speed >= 5.5 && context.longitudinal > 3 && requested && Math.abs(input.steer) >= 0.16) {
    Object.assign(drift, createDriftState(drift, true), {
      active: true, phase: "sliding", direction: Math.sign(input.steer),
      entrySpeed: speed, sequence: drift.sequence + 1
    });
  }
  if (!drift.active) return drift;
  drift.duration += dt;
  drift.distance += speed * dt;
  drift.maxAngle = Math.max(drift.maxAngle, Math.abs(finite(context.slipAngle)));
  const opposite = input.steer * drift.direction < -0.24;
  if (opposite) {
    drift.counterTime += dt;
    drift.phase = "countersteer";
  } else if (drift.phase === "countersteer" && input.steer * drift.direction > 0.24) {
    drift.counterTime = 0;
    drift.phase = "sliding";
  }
  drift.releaseGrace = requested || opposite ? 0 : drift.releaseGrace + dt;
  if (drift.duration > 7 || drift.releaseGrace > 1.05) return finish(drift, speed, false, "settled");
  return drift;
}

export function resolveDrift(drift, context, delta, profile = {}) {
  const dt = clamp(finite(delta), 0, 1 / 15);
  let speed = Math.max(0, finite(context.speed));
  if (!drift.active) return { drift, speed, released: false };
  if (speed < 1 || context.longitudinal <= 0.2) return { drift: finish(drift, speed, false, "stopped"), speed, released: false };
  const maximumReserve = clamp(finite(profile.maximumReserveSpeed, 17), 3, 22);
  const efficiency = clamp(finite(profile.reserveEfficiency, 0.72), 0.1, 0.9);
  // Every stored joule was removed from motion in this integration step.
  // Decay and the entry-speed cap make repeated toggling strictly lossy.
  const dissipated = Math.max(0, finite(context.previousSpeed) ** 2 - speed ** 2) * 0.5;
  const energy = clamp(finite(drift.energy) * Math.exp(-0.12 * dt) + dissipated * efficiency, 0, maximumReserve ** 2 * 0.5);
  drift = { ...drift, energy, momentum: Math.sqrt(energy * 2), charge: Math.sqrt(energy * 2) / maximumReserve,
    maxAngle: Math.max(drift.maxAngle, Math.abs(finite(context.slipAngle))) };
  const aligned = Math.abs(finite(context.slipAngle)) <= 0.115;
  if (drift.phase === "countersteer" && drift.counterTime >= 0.065 && drift.duration >= 0.22 && drift.maxAngle >= 0.12 && aligned && energy >= 0.8) {
    speed = Math.max(speed, Math.min(drift.entrySpeed * 0.96, Math.sqrt(speed ** 2 + 2 * energy)));
    return { drift: finish(drift, speed, true, "countersteer"), speed, released: true };
  }
  return { drift, speed, released: false };
}
