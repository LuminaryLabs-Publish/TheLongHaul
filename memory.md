# The Long Haul repository memory

## Purpose

The Long Haul is a browser-based trucking game evolving toward a 3D American highway arcade campaign. The intended player loop and current development priorities are recorded in [.agent/product-intent.md](.agent/product-intent.md).

## Architecture

- American Campaign owns route choice, career progression, and garage upgrades.
- The existing NexusEngine-powered driving runtime remains the single driving engine.
- Three.js presents the truck, traffic, terrain, camera, and scenery.
- Geographic road data defines highway alignment; procedural systems provide surrounding world content.
- `index.html` is the playable runtime; `campaign.html` is the campaign, map, and garage surface; runtime code is under `src/`.

## Durable decisions and conventions

- Prove a complete drive → earnings → garage → upgrade → retry loop before broad visual polish or content expansion.
- Treat reported implementation as unverified until exercised in the browser. Keep code presence, browser behavior, and performance evidence distinct.
- Keep the playable game presentation in a centered 16:9 frame. Letterbox/pillarbox unused viewport space, keep camera and canvas sizing matched to the frame, and preserve windowed play.
- Record new user intent and accepted product decisions in `.agent/product-intent.md`, retaining user wording as well as its cleaned-up interpretation.
- Avoid large refactors until the core game loop is reliable.
- Fresh drives and retries launch at 50% of the configured normal maximum forward speed, after Campaign vehicle upgrades apply. Pause/resume and roadside recovery do not trigger the launch boost. Teleport requests with a speed must set matching heading-aligned planar velocity.
- Campaign screens should use concise active-screen titles. The route map screen is titled `DISPATCH`; remove promotional side copy while keeping route/career information and controls.
- Campaign UI uses short game-style drop-in and staggered route-card motion, a restrained pulse for the selected route and primary action, and disables those effects for reduced-motion preference.
- The dispatch map is an immersive viewport-sized 2D map focused on the current and reachable states, with drag panning, modest zoom controls, a compact selected-haul card with Play, and a transparent back arrow instead of the map header banner. Keep route, progression, and garage access wired to existing campaign state.
- Startup opens with a short, skippable credits sequence, once per browser tab session: “Powered by Nexus Engine” and “Built by Luminary Labs.” The campaign footer attribution strip is removed; map-boundary source credit remains on the map itself.
- Vehicle impacts use heading-aligned 2D rectangular colliders sized to the player truck and each generated highway traffic type. Near-miss rewards continue to use a separate center-distance threshold.

- Tree shape templates are reduced from LSU Cloud Forest Library CC0 point clouds (White Oak and Japanese Cedar). `tools/build_tree_point_profiles.py` creates compact normalized profiles; `src/game/tree-mesh-builder.mjs` generates deterministic tree geometry, and `app-chunk-5.js` merges each streamed terrain cell’s trees into one vertex-colored mesh. Keep grass on the existing instanced batch.
- Clouds use three procedural alpha-noise planes at 50 m, 100 m, and 200 m relative to the truck's local ground position. Each layer has its own generated noise map, opacity, and slow drift; `app-chunk-11.js` updates them during driving.
- Scene fog is disabled; the weather-driven fog updater is removed. Horizon-detail cutoff uses a fixed 1,250 m distance rather than reading `scene.fog.far`.
- Daylight sun intensity is tuned separately from the sky shader glow; both are reduced to soften the sun without changing the overall sky palette.
- Windowed layout keeps the centered 16:9 stage and resizes the canvas to that stage. In short frames, cap the title card to the frame height and let it scroll; do not add viewport-relative top offsets that push it outside the frame.

## Performance architecture, 2026-10-19

- Runtime dependencies are pinned and served locally from `vendor/`; `npm run build` regenerates the curated Nexus Engine bundle, Three.js dependency, manifest hashes, and ordered classic host bundle after source edits. Commit generated vendor files because the existing static publishing workflow serves the checkout without building. Do not edit deployment files for this workflow.
- Keep Nexus Engine upstream unchanged. App hot paths borrow committed product resource views for immediate reads; public kit snapshot APIs retain their copy semantics. World existence uses `getWorldDefinition`, with active descriptors refreshed only when focus changes.
- Scenery uses 160 m cells, 9 physical cells, at most 81 high-quality or 49 low-quality visual targets, and a 104-descriptor cache. Drain preparation notifications, retire each run's worker, and dispose owned GPU resources on release. Far terrain has a separate bounded 32-host queue.
- Patch descriptors and deterministic near/far tree arrays are prepared by one module worker per run, with an incremental fallback. Main-thread realization has a cooperative time budget; individual uploads can exceed it. Tree normals are prepared with the geometry.
- Ordinary tinted glass avoids a transmission render pass. Road details use shared instance batches, grass uses depth-writing alpha cutout, and low quality reduces scenery and foliage as well as pixel density.
- Driving/loading target 60 FPS; menus and garage previews target 30 FPS. Hidden pages stop rendering and pause driving. Non-driving scenes gate truck simulation. HUD/map refresh at 15 Hz; map backgrounds cache by course, discovery, delivery and size.
- `npm test` runs the existing smoke suites. With the local server running on port 4173, `npm run perf -- --seconds=90` captures repeatable Chrome/Metal moving samples to `.cache/`; measurements and source hashes belong with the result. Browser acceptance and measured frame timing do not certify every route, browser, power mode or MacBook model.

- Double-tapping the same forward key (W or Up, within 300 ms) triggers a five-second timed forward burst. Keep it independent of keyboard repeat, do not refresh active bursts, retain Shift as the smaller held boost, and cancel timed bursts on braking/pause/focus loss/reset. Reduced motion disables burst streaks, edge focus and FOV changes but preserves the countdown and mechanics. Speed streaks share one preallocated line batch, avoiding a post-processing render pass.

- Truck ground support/steering stays upright and independent of `leanPivot`, which owns visible pitch and roll. Resolve visual clearance against cached streamed terrain heights and indexed road/shoulder triangles, including raised asphalt; do not reintroduce root roll or the old terrain-owned vehicle presentation override. Existing heading-aligned impact footprints remain independent. Hard leaning emits one bounded world-space spark batch from the low-side visual contact point.

## Luminary Framework

Reviewed 2026-10-27 through connected Google Drive: [00 - Luminary Framework](https://docs.google.com/document/d/1lZLgr2A99EBzMwoLl4iEY7NiFVFG6LjU8snI2eP3ZWI/edit). This is the company discovery and governance map, not a replacement for repository implementation history or project trackers. Keep work bounded, retain acceptance evidence, preserve access boundaries, and link authoritative records instead of duplicating live state. Project workspace organization uses the eleven lifecycle folders described there; do not restructure this repository to mirror Drive folders.

- Steering alone never enters the rollover state. Its lean is bounded and critically damped, returning to neutral when steering is released; ground alignment remains visual. Scrape sparks remain at hard lean. Severe collision impulses retain their existing rollover/recovery behavior.
