import { clone, clamp, finite } from "./shared.mjs";

export function createLongHaulWildlifeKit(N, RunState) {
  const WildlifeState = N.defineResource("long-haul.wildlife.state");
  const WildlifeLoad = N.defineEvent("long-haul.wildlife.load.request");
  const WildlifeReset = N.defineEvent("long-haul.wildlife.reset.request");
  const initialWildlife = () => ({ hazards: [], elapsed: 0, sequence: 0 });
  const wildlifeKit = N.defineDomainServiceKit({
    id: "long-haul-wildlife-kit",
    domain: "long-haul-wildlife",
    apiName: "longHaulWildlife",
    services: ["wildlife-motion"],
    stability: "game-stable",
    version: "2.0.0",
    resources: { WildlifeState },
    events: { WildlifeLoad, WildlifeReset },
    systems: [{
      phase: "simulate",
      name: "longHaulWildlifeSystem",
      system(world) {
        let state = world.getResource(WildlifeState);
        for (const request of world.readEvents(WildlifeReset)) state = initialWildlife();
        for (const request of world.readEvents(WildlifeLoad)) state = { hazards: clone(request.hazards), elapsed: 0, sequence: state.sequence + 1 };
        const run = world.getResource(RunState);
        const dt = run?.status === "running" ? clamp(finite(world.__nexusClock?.delta), 0, 1 / 15) : 0;
        if (dt > 0) {
          const elapsed = state.elapsed + dt;
          const hazards = state.hazards.map((hazard) => {
            const cycle = (hazard.phase + elapsed * hazard.speed) % 1;
            const ping = cycle < 0.5 ? cycle * 2 : (1 - cycle) * 2;
            return {
              ...hazard,
              x: hazard.start.x + (hazard.end.x - hazard.start.x) * ping,
              z: hazard.start.z + (hazard.end.z - hazard.start.z) * ping,
              direction: cycle < 0.5 ? 1 : -1
            };
          });
          state = { ...state, hazards, elapsed, sequence: state.sequence + 1 };
        }
        world.setResource(WildlifeState, state);
      }
    }],
    initWorld({ world }) { world.setResource(WildlifeState, initialWildlife()); },
    createApi({ world }) {
      const get = () => clone(world.getResource(WildlifeState));
      return {
        getState: get,
        load(hazards) { world.emit(WildlifeLoad, { hazards: clone(hazards) }); return get(); },
        reset() { world.emit(WildlifeReset, {}); return get(); },
        snapshot: get,
        loadSnapshot(snapshot = {}) { world.setResource(WildlifeState, { ...initialWildlife(), ...clone(snapshot) }); return get(); }
      };
    }
  });

  return Object.freeze({ kit: wildlifeKit, resources: Object.freeze({WildlifeState}) });
}
