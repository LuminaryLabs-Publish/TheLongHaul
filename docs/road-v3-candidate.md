# The Long Haul — Road V3 candidate boundary (November 2026)

Status: **implemented candidate geometry and Domain Service Kit; not yet a playable road cutover**.

## Ownership
- NexusEngine existing World/Simulation/Graphics Kits retain streaming, simulation and rendering.
- `src/game/road-v3-geometry.mjs` owns deterministic candidate 3D samples, self-crossing analysis, bridge designation, 3D surface lookups and road-aware terrain sampling.
- `src/game/road-v3-kit.mjs` is the experimental Domain Service Kit controlling candidate graph state.
- The existing world/terrain/road/product Kit ownership is unchanged. V1 and V2 road generation, saves, freight, truck and game host are unmodified.
- GLBs in Drive remain **candidate content**, not actively streamed by V3. The existing 160m World cells and 200m scenery descriptors remain unchanged.

## What this first cutover slice proves
1. A seeded figure-eight mountain demonstration can loop back across the same X/Z coordinates.
2. A later portion can be elevated to clear an earlier road and labeled as a bridge.
3. Both levels remain individually addressable in 3D queries.
4. Bridge decks do not flatten terrain underneath.
5. The new service is registered as a candidate-only DSK; generation never mutates the active game course.

## Next gates before enabling V3 for playable journeys
- Implement general route-growth rather than this deliberately bounded mountain-loop demonstration.
- Adapt `endlessHighwayProgress`, freight/traffic and camera to 3D graph position; V2 currently assumes progress equals `-z`.
- Terrain carving and structure meshes must use the existing Road/World authority, with collision surfaces, legal grades, supports, clearance and tunnel portals.
- Integrate the 100 GLBs through the existing environment host with proper scene selection, road-deck suppression, LOD and disposal.
- Browser/physics long-drive validation, streaming return visits, save/resume and target GPU profiling are required before changing the default version.

Check: `node tests/road-v3-regression.mjs` (added to `npm test`).
