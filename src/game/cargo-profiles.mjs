import { clamp, finite } from "./shared.mjs";

// Product-owned load data. Physics consumes mass and placement; the freight
// lifecycle owns condition, payouts and hazardous-cargo failure consequences.
import {GAMEPLAY_PROFILE} from './scene-profiles.mjs';
export const CARGO_PROFILES=Object.freeze(Object.fromEntries(GAMEPLAY_PROFILE.cargo.map(profile=>[profile.id,profile])));

export function getCargoProfile(id = "standard") {
  const key = String(id);
  return Object.hasOwn(CARGO_PROFILES, key) ? CARGO_PROFILES[key] : null;
}

export function normalizeCargoLoad(value) {
  if (!value) return null;
  const source = typeof value === "string" ? { profileId: value } : value;
  const profileId = source.profileId ?? source.id;
  if (typeof profileId !== "string") return null;
  const profile = getCargoProfile(profileId);
  if (!profile) return null;
  return {
    ...profile,
    profileId: profile.id,
    // A bad save cannot introduce negative mass, infinite inertia or a new
    // anonymous load. Contracts can still specify a legitimate part load.
    massKg: clamp(finite(source.massKg, profile.massKg), 250, 12000),
    condition: clamp(finite(source.condition, 100), 0, 100)
  };
}

export function cargoDamageMultiplier(load, kind = "impact") {
  const cargo = normalizeCargoLoad(load);
  if (!cargo) return 0;
  const reason = String(kind);
  if (/landing|landed/.test(reason)) return cargo.landingDamageMultiplier;
  if (/cargo-shift|load-shift/.test(reason)) return cargo.shiftDamageMultiplier;
  // Rescue fees are condition costs, rather than an extra fragile impact.
  if (/recovery|rescue/.test(reason)) return 1;
  return cargo.damageMultiplier;
}

export function cargoDynamics(profile, load) {
  const cargo = normalizeCargoLoad(load);
  const tuning = profile.load ?? {};
  const baseMass = clamp(finite(profile.mass, 7800), 1500, 45000);
  const cargoMass = cargo?.massKg ?? 0;
  const effectiveMass = baseMass + cargoMass;
  const massRatio = baseMass / effectiveMass;
  const payloadFraction = cargoMass / effectiveMass;
  const baseHeight = Math.max(0.5, finite(tuning.baseCenterOfMassHeight, 1.35));
  const centerOfMassHeight = (baseMass * baseHeight + cargoMass * (cargo?.centerOfMassHeight ?? baseHeight)) / effectiveMass;
  const heightRatio = centerOfMassHeight / baseHeight;
  return {
    baseMass, cargoMass, effectiveMass, massRatio, payloadFraction, centerOfMassHeight,
    // Profile accelerations describe forces available to the configured empty
    // truck. Payload adds inertia but does not magically upgrade its engine.
    forceScale: massRatio,
    brakeScale: (baseMass + cargoMass * clamp(finite(tuning.loadedBrakeAssist, 0.28), 0, 0.7)) / effectiveMass,
    momentumScale: Math.pow(massRatio, 0.65),
    gripScale: 1 / (1 + cargoMass / baseMass * 0.2),
    yawScale: 1 / (1 + cargoMass / baseMass * 0.18 + Math.max(0, heightRatio - 1) * 0.25),
    rollScale: (1 + payloadFraction * 0.55) * heightRatio,
    launchScale: Math.sqrt(massRatio),
    airControlScale: Math.pow(massRatio, 0.4),
    springScale: massRatio,
    dampingScale: Math.sqrt(massRatio),
    staticCompression: clamp(cargoMass / Math.max(1000, finite(tuning.ratedPayload, 6500)) * finite(tuning.suspensionSag, 0.14), 0, 0.3),
    rearPitch: cargo ? cargo.rearOffset * payloadFraction * 0.065 : 0,
    shiftStrength: cargo?.loadShiftStrength ?? 0
  };
}
