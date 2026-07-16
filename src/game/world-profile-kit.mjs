const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const DEFAULT_LONG_HAUL_WORLD_PROFILE = Object.freeze({
  id: "massive-country",
  worldSeed: "long-haul",
  extent: "infinite",
  playableRadius: null,
  boundaryFadeWidth: 0,
  macroSectorSize: 1024,
  gameplayCellSize: 192,
  gameplayActiveRadius: 2,
  horizon: Object.freeze({
    rootBounds: Object.freeze({ minX: -24576, minZ: -24576, maxX: 24576, maxZ: 24576 }),
    maxDepth: 6,
    minCellSize: 768,
    refineRadius: 12000,
    curveStart: 650,
    curveEnd: 2600,
    visualRadius: 26000
  }),
  atlas: Object.freeze({
    targetSettlements: 112,
    targetRoads: 360,
    primaryRoadWeight: 0.18,
    secondaryRoadWeight: 0.52,
    trailWeight: 0.30
  })
});

function normalizeProfile(input = {}) {
  const horizon = { ...DEFAULT_LONG_HAUL_WORLD_PROFILE.horizon, ...(input.horizon ?? {}) };
  const atlas = { ...DEFAULT_LONG_HAUL_WORLD_PROFILE.atlas, ...(input.atlas ?? {}) };
  return {
    ...DEFAULT_LONG_HAUL_WORLD_PROFILE,
    ...clone(input),
    id: String(input.id ?? DEFAULT_LONG_HAUL_WORLD_PROFILE.id),
    extent: input.extent === "bounded" ? "bounded" : "infinite",
    playableRadius: input.extent === "bounded" ? Math.max(2000, Number(input.playableRadius ?? 22000)) : null,
    boundaryFadeWidth: input.extent === "bounded" ? Math.max(100, Number(input.boundaryFadeWidth ?? 2200)) : 0,
    macroSectorSize: Math.max(256, Number(input.macroSectorSize ?? DEFAULT_LONG_HAUL_WORLD_PROFILE.macroSectorSize)),
    gameplayCellSize: Math.max(64, Number(input.gameplayCellSize ?? DEFAULT_LONG_HAUL_WORLD_PROFILE.gameplayCellSize)),
    gameplayActiveRadius: Math.max(1, Math.floor(Number(input.gameplayActiveRadius ?? DEFAULT_LONG_HAUL_WORLD_PROFILE.gameplayActiveRadius))),
    horizon,
    atlas
  };
}

export function createLongHaulWorldProfileKit(N, options = {}) {
  const ProfileState = N.defineResource("long-haul.world-profile.state");
  const ConfigureProfile = N.defineEvent("long-haul.world-profile.configure.request");
  const initial = normalizeProfile(options.profile ?? options);
  const kit = N.defineDomainServiceKit({
    id: "long-haul-world-profile-kit",
    domain: "long-haul-world-profile",
    apiName: "longHaulWorldProfile",
    services: ["world-profile", "extent-policy", "lod-policy"],
    stability: "game-stable",
    version: "3.0.0",
    resources: { ProfileState },
    events: { ConfigureProfile },
    systems: [{ phase: "resolve", name: "longHaulWorldProfileSystem", system(world) {
      let state = world.getResource(ProfileState);
      for (const request of world.readEvents(ConfigureProfile)) state = normalizeProfile({ ...state, ...request });
      world.setResource(ProfileState, state);
    }}],
    initWorld({ world }) { world.setResource(ProfileState, clone(initial)); },
    createApi({ world }) {
      return {
        getState: () => clone(world.getResource(ProfileState)),
        configure(value = {}) { world.emit(ConfigureProfile, clone(value)); return clone(world.getResource(ProfileState)); },
        snapshot: () => clone(world.getResource(ProfileState)),
        reset() { world.setResource(ProfileState, clone(initial)); return clone(initial); }
      };
    }
  });
  return Object.freeze({ kit, resources: Object.freeze({ ProfileState }) });
}
