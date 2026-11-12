# Traffic Fleet Authoring and Impacts
> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

**Owners:** `src/game/traffic-vehicle-authoring.mjs`, `vehicle-collider.mjs`, `impact-kit.mjs`, `destructible-vehicle-kit.mjs` and `src/app/traffic-vehicles-host.js` / `app-chunk-22.js`.
**Requirements:** recognizable vehicle geometry and LOD; aligned local axes and collision boxes; traffic lane behavior and escape windows; at-most-once contacts/damage; contact point and directional response; consistent toon visuals and pooled debris lifetime.
**Evidence:** `tests/traffic-vehicle-authoring-regression.mjs`, `tests/comic-impact-regression.mjs`, `tests/comic-crash-host-regression.mjs` and actual on-road crash footage. Legacy TLH references for fleet assets must be resolved via canonical LH-01 IDs; old prompt aliases are not live tasks. `docs/traffic-fleet-authoring.md` and `docs/TLH-043-comic-crashes.md` remain dated reports.
