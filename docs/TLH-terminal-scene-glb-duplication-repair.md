# The Long Haul — terminal scene construction repair

## Source identity and observed failure

- Base: `LuminaryLabs-Publish/TheLongHaul` main `328b262c4cde8568b3f539c68aa4d5e6c61fc092`.
- Actual successful Pages deployment: workflow `43815778664`, artifact `14202501506`.
- Screenshot defect: a curved road and elevated highway appear alongside the actual freight-terminal exit even after road geometry repairs.
- **Root cause verified from the deployed asset:** `assets/freight-terminal/terminal-yard.glb` combines the terminal yard with a *demonstration highway, terrain and decorative props*. The runtime attempted to exclude short material names such as `dark_asphalt` and `road_yellow`, while the actual GLB has names such as `TLH_V1_darkAsphalt` and `TLH_V1_roadYellow`. This allowed obsolete roads to render over separately generated NexusEngine World/Road geometry.

## Integrated fix

1. Normalize `TLH_V1_` and `V1F_` names before selecting terminal art. Exclude demonstration asphalt, road markings, terrain and legacy vegetation.
2. Trim mixed mesh batches to the actual terminal yard rectangle, local coordinates `x[-320,42]`, `z[-233,226]`; clip triangles rather than merely omitting mesh centers.
3. Remove imported decorative geometry occupying the generated exit's truck corridor along `(0,-132) -> (177,-474)`, `7.5 m` clearance and body elevations `0.5–6.2 m` after the parking spot.
4. Keep the constructed warehouse, containers, yard pavement, parking, and modeled terminal. Preserve the independent procedural straight exit, highway, terrain, traffic, existing save layouts and GLB source.
5. Expose `window.LongHaulFreightTerminal.getState().scenePruning` for runtime inspection and version the browser's bootstrap and imported scene adapter to avoid stale module loading.

This is a presentation/scene-assembly repair; no second terrain or collision authority is created.

## Evidence and validation

The real GLB contains **47 mesh batches / 83,496 triangles**. The filtered runtime group contains **38 retained yard batches / 63,080 triangles** with zero vertices outside the terminal yard bounds or inside the checked exit-lane driving volume. Its original GLB bytes were not modified.

- `tests/freight-terminal-scene-regression.mjs` — **5/5 PASS** against the exact deployed GLB (source materials, preserved terminal, clipping, clear exit, repeatability).
- `tests/freight-terminal-start-regression.mjs` — PASS after correcting two old test assumptions about GLB material names.
- `tests/freight-terminal-host-regression.mjs` — PASS with the actual terminal GLB.
- `tests/terminal-cohesive-terrain-regression.mjs` — **7/7 PASS**.
- `npm run build:host`, `tests/runtime-bundle-parity-regression.mjs`, `tests/menu-startup-regression.mjs` — PASS with unchanged pinned runtime checksums.
- 67-test consumer matrix: **59 PASS, 8 FAIL**; all eight failures reproduced identically on the *unmodified Pages artifact* (baseline problems, not introduced by this patch).
- Real browser HTML and 103 game resource requests loaded via offline interception, but **WebGL context creation failed** (`BindToCurrentSequence failed`). Standalone WebGL modes also failed. The terminal source geometry was inspected in an offscreen VTK before/after render, **not an actual gameplay framebuffer**.

## Luminary Framework routes

- GUIDE-090 [Nexus Engine: A Guide to Building Game Environments](https://docs.google.com/document/d/1eODSzBvblglW-0suiKgjSf27NaPo0NG88hY-qOTQL6Q/edit) — navigable scene with one authoritative terrain and road geometry.
- GUIDE-085 [Nexus Engine: Design Authoring Guide](https://docs.google.com/document/d/1YQQn4RZmBv2Ie3Nzr0sczwUo2-BdYeUZ5u5-TNnK7Ls/edit) — clear path, readable junction and gameplay camera.
- GUIDE-095 [Nexus Engine: Regression Testing Guide](https://docs.google.com/document/d/1itQnIO_zEFovn8nK7at7Ui0FkiUm4oFNyusGy-GLDgE/edit) — exact source, real consumer tests and baseline comparison.
- GUIDE-010 [Sandbox Rendering & Validation Guide](https://docs.google.com/document/d/1IFtHym0GLOMAqKBZUN-PNPsVBDuGz4H8Q1wFN0WJluQ/edit) — distinguish geometry evidence from browser/WebGL acceptance.

## Outstanding acceptance gate

Perform a real new-run drive in the deployed browser from the terminal through its straight generated exit and onto the ground-level highway. Verify the duplicate curved road and elevated demo highway are absent from the chase-camera view and that the terrain is continuous. Do not call this accepted gameplay before that validation.

No GitHub Actions modifications, GLB asset rewriting, or changes to NexusEngine Core are included.
