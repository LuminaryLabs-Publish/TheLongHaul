# TLH-001 — Connected World and Neighborhood Milestone (2026-11-12)

This is a **bounded first implementation milestone** of the existing The Long Haul 43-goal world expansion plan, not completion of the entire plan. Source revision recorded by the release commit.

## Scope and ownership

- **Game repository** owns route choice, terrain-aligned road shape, town placement policy, garage interaction, freight rules and web Three.js rendering.
- **Pinned Nexus Engine** `b941c9b2995e3449c6987908657753e2cf2df242` owns Core World streaming and existing camera/simulation state. No Engine Core, Engine dependency or GitHub Actions changes.
- **Asset provenance:** Shared-drive Luminary Assets > Low Poly Neighborhood > 05 - Delivery > Generic > `LowPolyNeighborhood-GLB-OBJ-v0.9.0-rc1.zip` (Drive ID `1ESmhh2pcFsDQrarGe_HbJl_nOHVhoAGX`). The 17 building GLBs are installed at `assets/settlements/low-poly-neighborhood/`, with file identity and hashes in `manifest.json`. The source package also contains unintegrated road/furniture pieces.
- No replacement of legacy freight or save data; new sessions use winding terrain-aware V3, explicit `?road=v2` retains the previous V2 fallback, and saved journeys use their persisted generator version. Only new `haul-winding-` seeds receive the modified winding V3 corridor policy.

## Implemented

1. **Winding main road:** New run seeds select broad, smoothly sampled terrain-first curves in the existing V3 sampler, preserving earlier seeds and checkpoint projection.
2. **Deterministic town connections:** One side-road town loop is generated in the active highway window, with separate physical entry and return connections to existing trunk nodes, real geometry, four linked subedges, coherent routing, signs, and bounded deterministic recomputation.
3. **Playable layout:** 17 building parcels per neighborhood, stable model identities and transform placements, one GLB instance batch per model, a bounded set of building collision candidates, and a detached garage stop reusing existing game transactions.
4. **Active streaming:** The installed world lifecycle remains authoritative for road/terrain cells. A presentation-only host culls town building geometry and updates its bound instances without new game physics or a second world system.
5. **Compatibility:** Old V2, explicit V2 fallback, V3 saved checkpoints, traffic, freight, road streaming and the existing Nexus World pin stay in place. No upgrade to the newer standalone World/Presentation/Authoring/Agent Goal runtime is represented as installed in the game.

## Evidence and limits

- `npm run build:host`: PASS, generated runtime and vendor manifest regenerated from source against the fixed vendored Nexus/Three versions.
- `node tests/connected-world-regression.mjs`: PASS; 17 GLBs, 6,500 combined model triangles, 100 deterministic course seeds, 400 connected town subedges, revisit reconstruction, V3 terrain sample and legacy compatibility.
- `node tests/connected-town-host-regression.mjs`: PASS; actually decodes all 17 GLBs, instantiates 17 Three models in the existing host contract, verifies bounded instances, building collision queries, and hidden-scene retirement. No WebGL shader/pixel claim.
- `node tests/endless-highway-regression.mjs`, `tests/road-chunks-regression.mjs`, `tests/road-host-regression.mjs`, `tests/road-v3-terrain-route-regression.mjs`, `tests/road-v3-playable-course-regression.mjs`, `tests/road-v3-save-recovery-regression.mjs`, `tests/static-shell-smoke.mjs`, `tests/presentation-regression.mjs`, `tests/environment-tile-streaming-regression.mjs`, `tests/road-v3-environment-streaming-regression.mjs`, `tests/freight-terminal-host-regression.mjs`: PASS independently in sandbox.
- Typical sampled V3 town-loop max absolute grade across 25 seeds: ~6.5%; road curvature and route topology require actual driving feel review.
- Real Chromium/Playwright local WebGL game validation: BLOCKED by `net::ERR_BLOCKED_BY_ADMINISTRATOR` on `http://127.0.0.1:8769`. The HTTP dev server was started, but the browser could not navigate, so zero authentic game pixels were captured.
- Full-suite baseline at previous `5fcc5616`: pre-existing `tests/freight-terminal-start-regression.mjs` "yard pavement preserved" failure; no new full-suite PASS claimed. This is distinct from passing focused tests.
- Actual 600-second gameplay input, visual acceptance, measured target GPU performance and full 43-goal acceptance: **NOT RUN / NOT ACCEPTED**.

## Remaining world expansion goals

The whole plan requires separate review and implementation of fully navigable urban street grids, greater city/district types, additional valid source assets and source-specific licenses, richer traffic turn choices and route planning, persistent town services/deliveries, calibrated highway merging and signage, environment/skyline authoring, runtime frame-time evidence, saves/recovery across extended route choices, and a full drive-through visual acceptance. Keep the existing TLH-001 and LUM-000162 asset dependency open until this evidence is collected. New Engine Authoring and Agent Goal kits remain a separate compatible-migration question, not a prerequisite to shipping the old-pinned game.

**Status:** source candidate integrated / focused tests passed / browser visual and long-run gameplay acceptance pending. Do not mark the full task Done on commit alone.
