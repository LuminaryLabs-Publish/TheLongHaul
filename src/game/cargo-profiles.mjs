import { clamp, finite } from "./shared.mjs";

// Product-owned load data. Physics consumes mass and placement; the freight
// lifecycle owns condition, payouts and hazardous-cargo failure consequences.
export const CARGO_PROFILES = Object.freeze(Object.fromEntries([
  { id: "standard", label: "General freight", massKg: 1600, centerOfMassHeight: 1.55, rearOffset: -0.3, damageMultiplier: 1, landingDamageMultiplier: 1, shiftDamageMultiplier: 1, hazardousFailureDamage: 0, loadShiftStrength: 0, handlingHint: "Balanced load", color: "#7bd8bd" },
  { id: "fragile", label: "Fragile glass", massKg: 800, centerOfMassHeight: 1.7, rearOffset: -0.15, damageMultiplier: 2.2, landingDamageMultiplier: 2.7, shiftDamageMultiplier: 1.5, hazardousFailureDamage: 0, loadShiftStrength: 0, handlingHint: "Land gently · avoid impacts", color: "#81c9ff" },
  { id: "heavy", label: "Heavy machinery", massKg: 6200, centerOfMassHeight: 1.45, rearOffset: -0.55, damageMultiplier: 0.72, landingDamageMultiplier: 0.9, shiftDamageMultiplier: 0.8, hazardousFailureDamage: 0, loadShiftStrength: 0, handlingHint: "Brake early · use wide turns", color: "#ffca78" },
  { id: "hazardous", label: "Hazardous drums", massKg: 3200, centerOfMassHeight: 1.8, rearOffset: -0.3, damageMultiplier: 1.35, landingDamageMultiplier: 1.55, shiftDamageMultiplier: 1.2, hazardousFailureDamage: 14, loadShiftStrength: 0.22, handlingHint: "Protect the load · spills damage truck", color: "#ff9e68" },
  { id: "unstable", label: "Unsecured salvage", massKg: 3900, centerOfMassHeight: 2.5, rearOffset: -0.45, damageMultiplier: 1.15, landingDamageMultiplier: 1.45, shiftDamageMultiplier: 1.8, hazardousFailureDamage: 0, loadShiftStrength: 1, handlingHint: "Smooth steering · load can shift", color: "#dab4ff" }
].map((profile) => [profile.id, Object.freeze(profile)])));

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
