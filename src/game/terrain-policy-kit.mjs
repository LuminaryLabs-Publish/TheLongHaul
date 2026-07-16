const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const DEFAULT_TERRAIN_POLICY = Object.freeze({
  id: "rolling-country",
  octaves: Object.freeze([
    Object.freeze({ frequency: 0.0008, amplitude: 26 }),
    Object.freeze({ frequency: 0.0024, amplitude: 12 }),
    Object.freeze({ frequency: 0.0070, amplitude: 4 }),
    Object.freeze({ frequency: 0.0240, amplitude: 1.2 })
  ]),
  hillDensity: 0.62,
  ridgeDensity: 0.18,
  valleyDensity: 0.22,
  roadCrossSectionFlatten: 0.88,
  roadLongitudinalSmoothing: 0.74,
  jumpProfiles: Object.freeze({
    softCrest: Object.freeze({ height: [0.7, 1.8], length: [18, 34], takeoffSharpness: 1.0, landingSharpness: 0.72 }),
    drainageRise: Object.freeze({ height: [0.5, 1.2], length: [12, 22], takeoffSharpness: 1.2, landingSharpness: 0.85 }),
    erodedRamp: Object.freeze({ height: [1.2, 2.8], length: [12, 26], takeoffSharpness: 1.55, landingSharpness: 0.68 }),
    tabletop: Object.freeze({ height: [1.4, 2.5], length: [22, 38], takeoffSharpness: 1.35, landingSharpness: 0.8 }),
    bridgeApproach: Object.freeze({ height: [0.8, 1.7], length: [20, 32], takeoffSharpness: 1.1, landingSharpness: 0.9 })
  })
});

export function createLongHaulTerrainPolicyKit(N, options = {}) {
  const TerrainPolicyState = N.defineResource("long-haul.terrain-policy.state");
  const ConfigureTerrainPolicy = N.defineEvent("long-haul.terrain-policy.configure.request");
  const initial = { ...clone(DEFAULT_TERRAIN_POLICY), ...clone(options.policy ?? options) };
  const kit = N.defineDomainServiceKit({
    id: "long-haul-terrain-policy-kit",
    domain: "long-haul-terrain-policy",
    apiName: "longHaulTerrainPolicy",
    services: ["terrain-field-policy", "road-grade-policy", "jump-profile-catalog"],
    stability: "game-stable",
    version: "3.0.0",
    resources: { TerrainPolicyState },
    events: { ConfigureTerrainPolicy },
    systems: [{ phase: "resolve", name: "longHaulTerrainPolicySystem", system(world) {
      let state = world.getResource(TerrainPolicyState);
      for (const request of world.readEvents(ConfigureTerrainPolicy)) state = { ...state, ...clone(request), jumpProfiles: { ...(state.jumpProfiles ?? {}), ...(clone(request.jumpProfiles) ?? {}) } };
      world.setResource(TerrainPolicyState, state);
    }}],
    initWorld({ world }) { world.setResource(TerrainPolicyState, clone(initial)); },
    createApi({ world }) {
      const read = () => world.getResource(TerrainPolicyState);
      return {
        getState: () => clone(read()),
        getJumpProfile: (id) => clone(read()?.jumpProfiles?.[String(id)] ?? null),
        configure(value = {}) { world.emit(ConfigureTerrainPolicy, clone(value)); return clone(read()); },
        snapshot: () => clone(read()),
        reset() { world.setResource(TerrainPolicyState, clone(initial)); return clone(initial); }
      };
    }
  });
  return Object.freeze({ kit, resources: Object.freeze({ TerrainPolicyState }) });
}
