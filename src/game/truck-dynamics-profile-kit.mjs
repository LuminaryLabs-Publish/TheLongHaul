const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const DEFAULT_TRUCK_DYNAMICS_PROFILE = Object.freeze({
  id: "arcade-freight",
  mass: 7800,
  load: Object.freeze({ baseCenterOfMassHeight: 1.35, ratedPayload: 6500, loadedBrakeAssist: 0.28, suspensionSag: 0.14, shiftResponse: 3.4, shiftDamping: 4.8 }),
  maximumForwardSpeed: 34,
  maximumReverseSpeed: 7.5,
  engineAcceleration: 6.1,
  reverseAcceleration: 3.2,
  brakeForce: 14,
  aerodynamicDrag: 0.00085,
  rollingResistance: Object.freeze({ road: 0.32, shoulder: 0.72, offRoad: 1.2 }),
  steering: Object.freeze({ response: 11, lowSpeedAngle: 0.6, highSpeedAngle: 0.155, wheelbase: 6.1, yawResponse: 0.84, maximumYawRate: 1.1 }),
  grip: Object.freeze({ highway: 6.5, road: 5.8, rough: 3.8, shoulder: 3, offRoad: 2, handbrake: 0.65 }),
  drift: Object.freeze({ gripMultiplier: 0.16, turnMultiplier: 1.55, reserveEfficiency: 0.72, maximumReserveSpeed: 17 }),
  suspension: Object.freeze({ travel: 0.92, spring: 38, compressionDamping: 15, extensionDamping: 20, landingRestitution: 0.065, maximumRebound: 1 }),
  roll: Object.freeze({ restoringStiffness: 6.5, dampingRatio: 1.0, tireForceGain: 2.1, slipForceGain: 1.85, halfTrack: 1.68, maximumAngle: 0.62, slopeScale: 0.72, warningAngle: 0.52, tipAngle: 0.9, settledAngle: 1.48 }),
  air: Object.freeze({ gravity: 11.5, steering: 0.72, pitchControl: 0.24, velocitySteering: 0.18, drag: 0.025, maximumSubsteps: 8, maximumSubstep: 1 / 120 }),
  boost: Object.freeze({ forceMultiplier: 1.65, speedMultiplier: 1.22, rushForceMultiplier: 3.8, rushSpeedMultiplier: 1.8 })
});

const profileGroups = ["load", "rollingResistance", "steering", "grip", "drift", "suspension", "roll", "air", "boost"];
function mergeProfile(previous, request = {}) {
  const result = { ...clone(previous), ...clone(request) };
  for (const key of profileGroups) result[key] = { ...(previous[key] ?? {}), ...(clone(request[key]) ?? {}) };
  return result;
}

export function createLongHaulTruckDynamicsProfileKit(N, options = {}) {
  const TruckDynamicsProfileState = N.defineResource("long-haul.truck-dynamics-profile.state");
  const ConfigureTruckDynamics = N.defineEvent("long-haul.truck-dynamics-profile.configure.request");
  const initial = mergeProfile(DEFAULT_TRUCK_DYNAMICS_PROFILE, options.profile ?? options);
  const kit = N.defineDomainServiceKit({
    id: "long-haul-truck-dynamics-profile-kit",
    domain: "long-haul-truck-dynamics-profile",
    apiName: "longHaulTruckDynamicsProfile",
    services: ["powertrain-profile", "tire-profile", "suspension-profile", "air-control-profile"],
    stability: "game-stable",
    version: "4.1.0",
    resources: { TruckDynamicsProfileState },
    events: { ConfigureTruckDynamics },
    systems: [{ phase: "resolve", name: "longHaulTruckDynamicsProfileSystem", system(world) {
      const previousState = world.getResource(TruckDynamicsProfileState);
      let state = previousState;
      for (const request of world.readEvents(ConfigureTruckDynamics)) state = mergeProfile(state, request);
      if (state !== previousState) world.setResource(TruckDynamicsProfileState, state);
    }}],
    initWorld({ world }) { world.setResource(TruckDynamicsProfileState, clone(initial)); },
    createApi({ world }) {
      const read = () => world.getResource(TruckDynamicsProfileState);
      return {
        getState: () => clone(read()),
        configure(value = {}) { world.emit(ConfigureTruckDynamics, clone(value)); return clone(read()); },
        snapshot: () => clone(read()),
        reset() { world.setResource(TruckDynamicsProfileState, clone(initial)); return clone(initial); }
      };
    }
  });
  return Object.freeze({ kit, resources: Object.freeze({ TruckDynamicsProfileState }) });
}
