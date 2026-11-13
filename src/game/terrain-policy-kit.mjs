const clone = (value) => value === undefined ? undefined : structuredClone(value);

import {WORLD_PROFILE} from './scene-profiles.mjs';
export const DEFAULT_TERRAIN_POLICY=WORLD_PROFILE.terrain;

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
