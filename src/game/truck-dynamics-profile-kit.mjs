const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const DEFAULT_TRUCK_DYNAMICS_PROFILE = Object.freeze({
  id: "arcade-freight",
  mass: 7800,
  maximumForwardSpeed: 30.5,
  maximumReverseSpeed: 7.5,
  engineAcceleration: 3.6,
  reverseAcceleration: 2.6,
  brakeForce: 9.4,
  aerodynamicDrag: 0.00135,
  rollingResistance: Object.freeze({ road: 0.34, shoulder: 0.92, offRoad: 1.65 }),
  steering: Object.freeze({ response: 6.8, lowSpeedAngle: 0.55, highSpeedAngle: 0.13, wheelbase: 6.1, yawResponse: 0.72 }),
  grip: Object.freeze({ highway: 4.5, road: 3.8, rough: 2.15, shoulder: 1.55, offRoad: 0.92, handbrake: 0.48 }),
  suspension: Object.freeze({ travel: 0.92, spring: 15.5, compressionDamping: 8.8, extensionDamping: 5.6, landingRestitution: 0.1 }),
  roll: Object.freeze({ spring: 8.5, damping: 4.7, lateralScale: 0.043, slopeScale: 0.72, warningAngle: 0.58, tipAngle: 0.9, settledAngle: 1.43 }),
  air: Object.freeze({ gravity: 8.6, steering: 0.14, pitchControl: 0.11, maximumSubsteps: 8, maximumSubstep: 1 / 120 }),
  boost: Object.freeze({ forceMultiplier: 1.1, speedMultiplier: 1.08 })
});

export function createLongHaulTruckDynamicsProfileKit(N, options = {}) {
  const TruckDynamicsProfileState = N.defineResource("long-haul.truck-dynamics-profile.state");
  const ConfigureTruckDynamics = N.defineEvent("long-haul.truck-dynamics-profile.configure.request");
  const initial = { ...clone(DEFAULT_TRUCK_DYNAMICS_PROFILE), ...clone(options.profile ?? options) };
  const kit = N.defineDomainServiceKit({
    id: "long-haul-truck-dynamics-profile-kit",
    domain: "long-haul-truck-dynamics-profile",
    apiName: "longHaulTruckDynamicsProfile",
    services: ["powertrain-profile", "tire-profile", "suspension-profile", "air-control-profile"],
    stability: "game-stable",
    version: "3.0.0",
    resources: { TruckDynamicsProfileState },
    events: { ConfigureTruckDynamics },
    systems: [{ phase: "resolve", name: "longHaulTruckDynamicsProfileSystem", system(world) {
      let state = world.getResource(TruckDynamicsProfileState);
      for (const request of world.readEvents(ConfigureTruckDynamics)) state = {
        ...state,
        ...clone(request),
        steering: { ...(state.steering ?? {}), ...(clone(request.steering) ?? {}) },
        grip: { ...(state.grip ?? {}), ...(clone(request.grip) ?? {}) },
        suspension: { ...(state.suspension ?? {}), ...(clone(request.suspension) ?? {}) },
        roll: { ...(state.roll ?? {}), ...(clone(request.roll) ?? {}) },
        air: { ...(state.air ?? {}), ...(clone(request.air) ?? {}) },
        boost: { ...(state.boost ?? {}), ...(clone(request.boost) ?? {}) }
      };
      world.setResource(TruckDynamicsProfileState, state);
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
