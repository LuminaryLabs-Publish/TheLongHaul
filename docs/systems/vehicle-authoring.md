# Hero Truck Authoring — Source and Art Contract
> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

**Owners:** `src/game/hero-truck-authoring.mjs`, `src/game/vehicle-collider.mjs`, `src/app/hero-truck-host.js` and actual GLBs in `assets/`. Relevant asset family LH-01-001 is recorded in the existing Asset Master List under LUM-000162.
**Requirements:** consistent local forward +Z, wheel/steering pivots, cab/chassis scale, silhouette and actual collider compatibility; reusable geometry/materials; correct cargo and camera alignment. A reference PNG is not a Blender scene, edited GLB or verified runtime asset.
**Acceptance:** unique asset ID/source, editable authoring reference or verified source, exported GLB, runtime load, physics mesh alignment, visual review and performance. Use `tests/hero-truck-authoring-regression.mjs` plus in-game captured frames. Retain `docs/hero-truck-authoring.md` as original implementation history.
