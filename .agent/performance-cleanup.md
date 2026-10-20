# Performance cleanup implementation

Date: 2026-10-19. Scope: The Long Haul repository only. Upstream Nexus Engine source and deployment files are unchanged. Existing local game/UI work is preserved with its required modules.

## Outcome

The major measured CPU/rendering problems from [the original audit](performance-audit.md) have been addressed locally. The final high-quality moving capture holds at most 81 nearby scenery hosts, a 104-patch cache, and 219-292 draw calls at its checkpoints, compared with roughly 280-300 hosts and 1,900-2,300 calls in the original Endless captures. This is a substantial workload reduction, not a claim that all rendering is free or every MacBook will sustain 60 FPS.

### Changes by audit finding

| Original finding | Implemented remedy |
| --- | --- |
| 1, full-route scenery retention | Remove route-wide preload; 160 m cells, 9 physical targets, bounded 81/49 high/low visual targets, 104 descriptors. Drain ready/released notifications. |
| 2, expensive world snapshots | Existence uses `getWorldDefinition`; active descriptors cached at focus changes. |
| 3, transmission pass | Ordinary tinted transparent glass replaces physical transmission. |
| 4, absent feature domains | Remove unused exception-driven feature compilation; active procedural terrain is explicit. |
| 5, synchronous generation | Worker prepares cell descriptors, near/far tree arrays and normals; incremental fallback and run cancellation. GPU realization is staged with a cooperative 2 ms budget. |
| 6, unchanged structural work | Target planning changes only on cell, quantized heading or quality changes. Dirty membership queues, bounded outstanding jobs and cached terrain coverage. |
| 7, road draw calls | Instance repeated road markings, posts, poles and reflectors by shared geometry/material. Traffic remains a bounded pool of independent vehicle roots. |
| 8, expensive trees | Retain measured tree profiles and one mesh per cell; distant trees use fewer leaf clusters and no branches. |
| 9-13, state reads, upgrades, traffic, route/terrain work | Borrow immediate committed product resources in the host; retain public snapshot contracts. Cache upgrades, use elapsed traffic dt, binary-search cumulative route lengths, bound terrain road queries and prepare terrain normals once. |
| 14, repeated obstacle scans | One nearby obstacle grid query and authoritative impact path; wildlife indexed by ID. Existing vehicle footprints and separate near-miss thresholds remain. |
| 15, horizon failures | Working procedural provider, staged queue, max 32 rendered hosts, distance/detail bounds, no provider failures in captures. Shader excludes the complete near-terrain footprint so far terrain cannot cover the road. |
| 16, weak quality budgets | High/low visual windows and foliage detail, absolute 2,304,000/1,036,800 drawing-buffer pixel caps, existing DPR caps and 16:9 fit. |
| 17, vegetation overdraw | Depth-writing alpha-cutout grass with reduced low-quality density. Preserve the accepted three alpha-noise cloud layers at 50/100/200 m. |
| 18, idle work | 60 FPS driving/loading, 30 FPS menus, hidden-page render suspension, blur key clearing, pause on visibility loss, zero simulation time outside driving. |
| 19, startup graph | Local pinned curated Nexus bundle, local Three.js, one ordered classic app bundle; committed generated artifacts and version/hash manifest. |
| 20, misleading telemetry | Raw interval percentiles and bounded phase timing history with explicit reset; expose cell, queue, descriptor, geometry, draw and triangle counts. CPU submission remains separate from GPU timer measurements. |
| 21, garage ownership | Single initialization promise, dispose model materials/geometries, stop hidden preview scheduling, 30 FPS preview. |
| 22, presentation work | Cache DOM nodes, HUD/map refresh at 15 Hz, cache map background by course/discovery/delivery/size; moving truck marker is separate. |
| 23, title traffic | Pool initializes hidden; title renders only intended objects. |
| 24, stale checks | Update existing static-shell expectations to current tree ownership and local bundles; extend existing gameplay/domain regression coverage. No new unit/smoke test files. |
| 25, stale boot blocker | Successful initialization clears delayed-loading overlay. Local assets remove the broad runtime CDN graph. |

## Files and ownership

- `src/app/`: bounded streaming, batching, render/update scheduling, terrain, UI and lifecycle integration. Existing host order and single driving engine remain.
- `src/game/patch-worker*.mjs`, `patch-geometry.mjs`, `tree-mesh-builder.mjs`: transferable patch geometry, deterministic worker/fallback generation.
- `src/game/`: local road queries, route cache/timeout, state queries, telemetry, teleport velocity and pause gating.
- `campaign.html`, `index.html`, `styles.css`: preserve prior UI improvements, local runtime entry, garage lifecycle and windowed fit.
- `tools/build-runtime.mjs`, `vendor/`, package manifest/lock: pinned local build and served artifacts. `tools/capture-performance.mjs`: repeatable moving capture using installed Chrome.
- Existing tests, intent ledger, repository memory and this evidence record. Deployment workflow/configuration files are excluded from the changes.

## Validation

### Final-source measurement

[90-second Retina report](performance-cleanup/final-moving-retina-90s.json), [capture](performance-cleanup/final-moving-retina.png). Runtime SHA-256: `6115914083d5375f2c12e84bca25370d907c03a489d067d35c1f6d283183bb60`.

- Apple M2 Pro, Chrome ANGLE Metal, viewport 1280 x 800, 1280 x 720 stage, 1600 x 900 drawing buffer matching the baseline, high quality, seed `haul-1nwc3cl-12goa01`. Script steers along the road and retries every 42 seconds.
- Five checkpoint timing windows: maximum p95 16.8 ms, maximum p99 16.8 ms, largest sampled interval 33.3 ms. Buffers hold up to 1,800 frames and reset on retry; this does not retain every interval of the entire run.
- Checkpoint draw calls 219-292, triangles 115,230-199,794, hosts 72-81, cache at most 104. No application errors, blocking boot overlay or failed horizon providers. Ready notifications drained to zero.
- Streaming phase largest atomic sample 15.6 ms. A cooperative budget cannot interrupt a single Three.js mesh upload; rare streaming spikes remain possible.
- JS heap checkpoint range about 177-216 MB, with collection between samples. These values exclude total browser/GPU memory and do not prove leak freedom.
- Warm/cached-context boot 0.280 seconds. This is not a fresh-network download benchmark.

A separate [90-second 1280 x 720 output run](performance-cleanup/final-moving-90s.json) uses the same final runtime. It recorded p95/p99 at most 16.8 ms, largest sampled interval 16.8 ms, and an 18.1 ms streaming-phase maximum. Its lower drawing-buffer resolution is recorded separately from the baseline-equivalent Retina run.

### Extended repeat and retry check

[600-second report](performance-cleanup/endless-repeat-600s.json): 39 checkpoint windows, no application errors or failed horizon providers, maximum p95 16.8 ms, largest sampled interval 33.4 ms, cache at most 104. This used 1280 x 720 output pixels and the preceding runtime (`5b8d5c46...`), before final notification draining, coverage/map caching and fallback-pending accounting. It exposed accumulating ready notifications, which the final-source run fixes. The tool originally hashed the disk file at report completion; the report records that provenance correction separately. The final source has its own 90-second validation, not a 600-second claim. This repeated the initial road section with a retry every 42 seconds; temperature and battery draw were not measured.

### Behavior checks

[Structured browser results](performance-cleanup/browser-checks.json), [standalone client state](performance-cleanup/client-state.json), [visually inspected client screenshot](performance-cleanup/client-gameplay.png).

- `npm run build`, all three existing `npm test` suites, syntax/source checks and scoped `git diff --check` pass. Pinned/generated vendor files retain upstream whitespace and concatenation formatting and are excluded from whitespace-only checks.
- Prescribed web-game client reaches driving, accepts input and captures gameplay without console/runtime errors.
- Worker and fallback tree arrays match, normals are finite, retiring a worker rejects pending work. Disabling Worker still reaches driving.
- Campaign traffic travels the same 6 m over one second at 30/60 updates. Existing collider regressions pass.
- Pause holds position exactly. Fresh/retry launch uses 50% normal maximum, heading-aligned velocity; upgrade check observed 19.4 m/s of 38.8 m/s. Resume and recovery do not relaunch.
- Stage sizes are 1280 x 720, 640 x 360 and 480 x 270 for the tested windows, with no document overflow.
- Repeated unchanged map draws add zero static-layer strokes. Cached NJ-PA geometry reloads 165 edges with zero fetch calls when fetch is blocked.
- A Campaign focus transition settles at 49 low-quality hosts, 26 horizon hosts, zero ready/pending work and zero failed horizon providers.
- Eight garage vehicle switches retain 8 geometries and one program; hidden preview scheduling stops. An actual upgrade purchase persists across reload and changes launch speed. Delivery-terminal fixture advances career/reward, then restores the previous test save.
- Separate low-quality Campaign asynchronous GPU sample: 301 valid results, mean 0.641 ms, p95 0.827 ms, max 1.358 ms at 1088 x 612 pixels. This differs from the original high-quality Endless conditions, so no direct GPU speedup ratio is claimed. Wrappers were removed after capture.

## Remaining limits

- This does not certify Safari, every MacBook model, external 4K displays, low-power/battery behavior or a complete naturally played Campaign route. No power/temperature instrumentation was used.
- Repeated-route driving and retries exercise ownership/streaming but do not cover every branch, route or naturally occurring collision. The delivery check is a terminal fixture, not a complete human playthrough.
- Individual terrain/mesh uploads and far-world reconciliation remain synchronous atomic work; the recorded 15.6 ms streaming maximum is evidence of that limit. Traffic mesh parts and horizon props retain some independent draw calls.
- Fog stays disabled. Clouds retain the requested three-layer look; visual density was not reduced without an artistic need.
- First uncached Campaign routing still needs OSRM; hosted fonts and map-boundary data are external presentation resources. Worker failure uses a slower incremental fallback.
- Deployment files are byte-for-byte unchanged. Pushing main uses whatever publishing behavior the repository already has; no deployment configuration is added or changed.
