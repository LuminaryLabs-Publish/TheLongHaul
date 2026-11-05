# The Long Haul — 200 m Authored Environment Tiles

**Project:** `LuminaryLabs-Publish/TheLongHaul`  
**Source ownership:** `n:authoring:project` (editable source); `n:authoring:mesh`, `n:authoring:material`, `n:authoring:assembly` and `n:authoring:art` (shape and art direction); The Long Haul (tile selection and presentation); existing NexusEngine World and Road Kits (streaming, road topography, physics and collisions).

## Outcome

A 100-template, four-variant (400 combination) illustrated environment library. Each source tile describes **exactly 200 m** of the Endless road journey, with regional props, roadside structures, non-collidable decorative road treatments, deterministic landmarks and high/low geometric detail. The 100 identities are ten regional palettes crossed with ten **distinct composition themes**, with a four-variant assembly contract for each. This is a reusable **parametric mesh/assembly library**, not 400 hand-modeled GLB files.

The game keeps its existing **160 m World cell partition and world-streaming queues**. A 200 m tile's physical world-space objects are assigned to the existing cell containing each asset's anchor. A tile straddling multiple World cells is split by ownership; it is not cut into new physics cells. Road geometry, lane topology, surface response, contact footprints, route signs, collision handling, economy, freight, traffic and run state are unchanged.

## Reusable Authoring content

- `src/game/environment-tile-catalog.mjs`: 10 biome palettes × 10 composition themes = **100** distinct template identities; `open`, `lush`, `signature` and `weathered` variants for each.
- `src/game/environment-tile-authoring.mjs`: mesh/material/assembly source recipes and semantic parts. Near/low-detail assets include faceted and bevelled vegetation, trunks and branches, rock striations, complex roadside shelters, poles, culverts, fences, rural buildings, industrial freight structures, windows, roofs, panels and hardware. Every instance is typed and versioned.
- `src/game/environment-tile-renderer.mjs`: a separate Three.js runtime adapter using the game's existing four-band toon ramp. It reuses shared bevelled/faceted geometries and palette materials, and groups each streamed cell's many parts into instanced drawing batches. Shared source assets are not recreated per cell.
- `manifests/environment-tiles-authoring.json`: all **400** source-bound assembly descriptors; regenerable by `node tools/build-environment-tile-library.mjs`.
- `src/game/environment-tile-planner.mjs`: deterministic 200 m sequence, 160 m ownership, snapped road-spline positions, local terrain-height sampling, shoulder clearance and conditionally placed road ink. Supports negative/continued world progress and same-seed reconstruction.
- `src/app/environment-tiles-host.js`: app integration. Hooks existing `decorateCell`, `releaseCell`, `applySettings` and cloud/frame callback without replacing the gameplay scheduler or the road renderer. Cell plans resolve **one 200 m tile per decoration pass**, then author a few source instances per pass, then submit a few reusable GPU draw batches per pass. Distant visual cells defer expensive model construction until within the near-scenic band.

## World streaming, compatibility and safety

- Tile length: **200 m of progress**, not a 200 × 200 m World partition.
- Existing cell size: **160 × 160 m**, unchanged.
- All 3D extra props are visual overlays outside the main canonical road/shoulder clearance. When attached to an actual course, `nearestRoad` also checks bypass roads and adjusts or rejects risky placements. Road visuals are low-profile paint/road-stud details only on compatible straight, sweep and hill sections. Bridge, tunnel, junction, freight gate, construction, pickup and hazard collisions stay with existing authoritative gameplay Kits.
- Existing LOD/horizon objects and legacy save games are preserved. The new tile layer is enabled only on `long-haul-endless-v2` courses; old generator saves use original scenery.
- Freshly built geometry is not globally marked to cast shadows. The existing budgeted lighting controller may select nearby structural batches while controlling actual shadow-map draw counts.
- Failure of an individual tile planner or mesh batch falls back to original world scenery rather than crashing physics or corrupting saves. Streaming unload and quality changes free per-cell instance buffers; one shared cached library remains bounded per page session.

## Run checks

```sh
node tools/build-environment-tile-library.mjs
node tests/environment-tile-contract-regression.mjs
node tests/environment-tile-renderer-regression.mjs
node tests/environment-tile-streaming-regression.mjs
npm run build:host
npm test
npm run validate:visuals
```

The first four checks can be run without WebGL on a compatible Node host. The renderer and streaming tests use a **Three.js compatibility fixture**, and contract tests use a simplified road fixture only when the real game source is unavailable. In the actual repository, they resolve the authoritative road modules. They are **not** independent proof that the complete browser game or native `n:authoring` export works.

## Acceptance gates still required

1. Run the complete repo regression suite using the exact modified source and committed pinned vendor assets; verify a freshly built WebGL page boots and reaches an uninterrupted Endless run.
2. Inspect the near/far 200 m tile seams in all ten biomes at 30–90 mph; review 100 distinct motif/biome combinations and all four variant types for silhouettes, proportions, material palette and road height matching.
3. Inspect road signs/visibility, under-bridge clearance, offroad placement, collision overlap and road-choice legibility on at least 30 seeded roads.
4. Check draw-call, triangle, memory and GPU frame-time budgets on target hardware with low/high quality and the 1024/512 local shadows; record initial, 10-minute and recovery/restart states.
5. Native Nexus Authoring Project storage, typed operation receipts, mesh/export validation and `.glb` authoring delivery remain **not performed** in this sandbox. The authored runtime recipes and 400 descriptors must not be mislabeled as canonical native `n:authoring` Project snapshots or production-approved GLB packs.

**Important:** A procedural assembly manifest provides repeatable authored asset specifications. Artistic approval requires an actual rendered image; true physical interaction with new roadside scenery would require a separate, authorized Gameplay/Collision task rather than quietly adding ad hoc colliders.
