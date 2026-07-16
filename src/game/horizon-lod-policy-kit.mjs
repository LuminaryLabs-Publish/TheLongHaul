const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const DEFAULT_HORIZON_LOD_POLICY = Object.freeze({
  id: "long-haul-horizon",
  terrainResolution: Object.freeze({ 0: 24, 1: 16, 2: 10, 3: 6, 4: 4, 5: 3, 6: 2 }),
  forestMode: Object.freeze({ 0: "cluster-instances", 1: "canopy-clumps", 2: "forest-mass", 3: "silhouette", 4: "silhouette", 5: "none", 6: "none" }),
  roadMode: Object.freeze({ 0: "ribbon", 1: "thin-ribbon", 2: "line", 3: "line", 4: "none", 5: "none", 6: "none" }),
  settlementMode: Object.freeze({ 0: "low-detail", 1: "block-mass", 2: "silhouette", 3: "silhouette", 4: "none", 5: "none", 6: "none" }),
  collision: Object.freeze({ 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false })
});

export function createLongHaulHorizonLodPolicyKit(N, options = {}) {
  const HorizonLodPolicyState = N.defineResource("long-haul.horizon-lod-policy.state");
  const ConfigureHorizonLod = N.defineEvent("long-haul.horizon-lod-policy.configure.request");
  const initial = { ...clone(DEFAULT_HORIZON_LOD_POLICY), ...clone(options.policy ?? options) };
  const kit = N.defineDomainServiceKit({
    id: "long-haul-horizon-lod-policy-kit",
    domain: "long-haul-horizon-lod-policy",
    apiName: "longHaulHorizonLodPolicy",
    services: ["quadtree-content-policy", "horizon-lod-policy"],
    stability: "game-stable",
    version: "3.0.0",
    resources: { HorizonLodPolicyState },
    events: { ConfigureHorizonLod },
    systems: [{ phase: "resolve", name: "longHaulHorizonLodPolicySystem", system(world) {
      let state = world.getResource(HorizonLodPolicyState);
      for (const request of world.readEvents(ConfigureHorizonLod)) state = {
        ...state,
        ...clone(request),
        terrainResolution: { ...(state.terrainResolution ?? {}), ...(clone(request.terrainResolution) ?? {}) },
        forestMode: { ...(state.forestMode ?? {}), ...(clone(request.forestMode) ?? {}) },
        roadMode: { ...(state.roadMode ?? {}), ...(clone(request.roadMode) ?? {}) },
        settlementMode: { ...(state.settlementMode ?? {}), ...(clone(request.settlementMode) ?? {}) }
      };
      world.setResource(HorizonLodPolicyState, state);
    }}],
    initWorld({ world }) { world.setResource(HorizonLodPolicyState, clone(initial)); },
    createApi({ world }) {
      const read = () => world.getResource(HorizonLodPolicyState);
      return {
        getState: () => clone(read()),
        describeLevel(level = 0) {
          const key = String(Math.max(0, Math.floor(Number(level))));
          const state = read();
          return clone({ level: Number(key), terrainResolution: state.terrainResolution?.[key], forestMode: state.forestMode?.[key], roadMode: state.roadMode?.[key], settlementMode: state.settlementMode?.[key], collision: false });
        },
        configure(value = {}) { world.emit(ConfigureHorizonLod, clone(value)); return clone(read()); },
        snapshot: () => clone(read()),
        reset() { world.setResource(HorizonLodPolicyState, clone(initial)); return clone(initial); }
      };
    }
  });
  return Object.freeze({ kit, resources: Object.freeze({ HorizonLodPolicyState }) });
}
