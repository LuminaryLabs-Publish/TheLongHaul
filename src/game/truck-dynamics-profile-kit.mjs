const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const DEFAULT_TRUCK_DYNAMICS_PROFILE = Object.freeze({
  id: "arcade-freight",
  mass: 4200,
  maximumForwardSpeed: 38,
  maximumReverseSpeed: 10,
  engineAcceleration: 12.5,
  reverseAcceleration: 6.2,
  brakeForce: 17,
  aerodynamicDrag: 0.00105,
  rollingResistance: Object.freeze({ road: 0.48, shoulder: 1.15, offRoad: 1.9 }),
  steering: Object.freeze({ response: 9.5, lowSpeedAngle: 0.68, highSpeedAngle: 0.28, wheelbase: 5.2, yawResponse: 0.84 }),
  grip: Object.freeze({ highway: 4.0, road: 3.1, rough: 1.8, shoulder: 1.25, offRoad: 0.8, handbrake: 0.35 }),
  suspension: Object.freeze({ travel: 0.85, spring: 18, compressionDamping: 7.5, extensionDamping: 4.2, landingRestitution: 0.16 }),
  air: Object.freeze({ gravity: 8.6, steering: 0.14, pitchControl: 0.11, maximumSubsteps: 8, maximumSubstep: 1 / 120 }),
  boost: Object.freeze({ forceMultiplier: 1.18, speedMultiplier: 1.14 })
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
