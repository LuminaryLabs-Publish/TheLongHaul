# MacBook Pro performance audit

Date: 2026-10-19, America/New_York. Result: **FAIL for reliably smooth 60 fps during loading and streaming; PARTIAL evidence for sustained steady-state performance.**

The largest measured problems are unnecessary world snapshots on the CPU, full-route scenery retention in Endless, and a transmission pass that almost doubles scene rendering. The Nexus Engine scheduler itself is a smaller measured cost. Lowering light intensity does not address these problems.

This audit covers the current locally modified checkout based on main commit `0136977e61`, plus a narrowly scoped rolling-start implementation. Existing local edits were preserved. The exact game dependency, Nexus Engine `b941c9b2995e3449c6987908657753e2cf2df242`, was downloaded to `/tmp/longhaul-performance-audit/` and inspected directly. No engine dependency or engine source was changed.

## Measurement conditions and limits

- Host: MacBook Pro, Apple M2 Pro, 12 CPU cores, 19 GPU cores, 16 GB unified memory.
- Browser: automated local Chrome using `ANGLE Metal Renderer: Apple M2 Pro`, not software rasterization, for the performance samples below.
- Viewport: 1280 x 800 CSS pixels; centered 1280 x 720 game stage; high quality; canvas buffer 1600 x 900. Map closed. Default vehicles and upgrades.
- Working budget: 60 fps, 16.67 ms between frames. A 120 Hz display has an 8.33 ms interval; there is currently no deliberate 60 fps cap.
- Campaign: actual NJ-to-PA OSRM route, 165 road edges, 14 active traffic vehicles. Warm 20-second interval capture at/near the start, without timing wrappers.
- Endless: procedural seed `haul-1nwc3cl-12goa01`, 61 edges, 251 route-preloaded cells, expanding scenery. Separate warm interval capture, 15-second function timing capture, 10-second CPU sampling, and 10-second asynchronous GPU timer capture.
- CPU function wrappers add overhead. Their measurements are inclusive and overlap; do not sum nested timings. `renderer.render` is CPU submission time, not GPU execution time. GPU measurements use `EXT_disjoint_timer_query_webgl2`, poll completion without blocking, and discard disjoint results.
- The warm Campaign interval is predominantly stationary. Endless streamed while moving/coasting and then settled. These are useful diagnosis samples, not a full-route driving or thermal endurance certification. No full-route autopilot, ten-minute thermal soak, Safari comparison, battery/low-power-mode comparison, full-resolution external-monitor test, or native memory/power trace was performed. JS heap samples do not measure total browser or GPU memory and do not prove a leak.
- Browser-only timing wrappers and diagnostic material changes were temporary and were cleared by navigation/restored immediately. No persistent optimization was included in this request.

## Measurements

| Sample | Findings |
| --- | --- |
| Campaign warm, 20.03 s, 1,803 frames | Mean interval 11.10 ms, p50 8.40 ms, p95 16.90 ms, p99 17.60 ms, max 24.40 ms; 102 intervals exceeded 16.8 ms, none exceeded 33.4 ms. 81 realized cells, 711 draw calls, 599,758 triangles at capture. |
| Endless initial streaming interval | 403 frames, mean 20.85 ms, p95 32.50 ms, p99 132.60 ms, max 141.60 ms; 16 intervals exceeded 33.4 ms. 296 realized cells, 2,303 draw calls, 2,064,558 submitted triangles at capture. A separate built-in CPU frame maximum reached 1,922 ms during generation/loading; this maximum is not a warm-frame percentile. |
| Endless warm, instrumented, 15.02 s, 980 frames | Mean interval 15.31 ms, p95 17.60 ms, p99 24.90 ms, max 33.70 ms. 280 realized cells, 1,931 draw calls, 1,718,734 triangles. |
| Same function timing sample | World `getWorld`: 3 calls/frame, 4.80 ms/frame total. `getActiveCells`: 1 call/frame, 1.20 ms/frame. Streaming: 4.49 ms/frame inclusive. Horizon update: 2.19 ms/frame inclusive despite zero horizon meshes. Engine tick: 0.88 ms/frame. Renderer CPU submission: 4.26 ms/frame. |
| Allocations/copies in same sample | 116,624 `structuredClone` calls across 980 frames, about 119/frame and 7,765/second. Clone calls consumed 4.99 ms/frame inclusive. This overlaps world-query and engine timings. |
| Terrain and wildlife in same sample | 26,460 global terrain-height calls, 27/frame, about 0.88 ms/frame total. Wildlife visual update 0.43 ms/frame. Truck visual update 0.24 ms/frame. Cloud transform update about 0.0014 ms/frame. |
| Endless GPU, 10 s, 81 valid timer samples | Mean 3.50 ms, p95 5.69 ms, maximum 7.81 ms. The GPU was not the dominant steady CPU-side cost in this particular viewport/sample. |
| Temporary glass-transmission A/B, later Endless run | Same scene and camera, manual render before/after changing only transmission: 2,349 to 1,179 draw calls; 2,058,910 to 1,035,014 triangles. Transmission was restored immediately. This measures submission counts, not a claimed twofold FPS gain. |
| Internal horizon health | 88 registered horizon cells, all 88 provider statuses failed; zero realized horizon meshes; 176 internal diagnostics. Error: `Long Haul world features require Core World child domains.` |
| Boot resource graph | 250 resource entries, 221 Nexus Engine module entries in the observed browser boot. Cross-origin transfer sizes lack complete timing permission, so transfer-byte sums are not a useful download-size measurement. |

Evidence: `performance-audit/campaign-baseline.json`, `performance-audit/endless-gpu.json`, `performance-audit/endless-instrumented.json`, `performance-audit/launch-validation.json`. Detailed timing results also remain in this chat's tool outputs. The built-in performance object is inadequate as the sole profiler; see finding 20.

## Ranked findings

### 1. Critical: Endless retains scenery for every branch of the entire course

**Confirmed, source and runtime.** `src/app/app-chunk-6.js:17` calculates every route cell plus its neighboring cells, generates all of them synchronously, and stores them in `preloadedRouteCells`. `src/app/app-chunk-8.js:7` adds all those cells to every subsequent desired/visual target list. This creates hundreds of scenery hosts even when the truck is near the origin. The 3 x 3 physics window is not the rendered-world limit. The 9 x 9 visual ring is not the actual limit either.

The observed 251 route cells grew to about 280-303 desired/realized/cached cells. `cacheLimit:104` cannot evict entries still marked desired. This is an application retention policy defeating the engine cache, not proof that Nexus Engine ignores eviction rules. Every branch costs generation, tree meshes, scene traversal, and GPU memory before the player chooses it.

**Fix:** stream only a bounded nearby window and a short road-ahead corridor. Keep route geometry/data separately from realized scenery. Enforce measurable caps on desired cells, realized cells, cached descriptors and GPU geometry bytes. Reuse the same cell content on retry without pinning all route scenery.

### 2. Critical: world-existence checks validate and copy the complete world state

**Confirmed, measured.** `src/app/app-chunk-8.js:7`, `app-chunk-5.js:8`, and `app-chunk-12.js:9` call `coreWorld.getWorld` in hot paths. The pinned engine's `src/core-domains/core-world-domain/kits/world-builder-runtime-kit/index.js:104` implements `readState()` by cloning the entire state containing all worlds. `getWorld` at line 565 then clones the selected world again. `getActiveCells` at line 569 first copies the whole state and then clones each returned cell.

`cloneWorldState` routes through `clonePortableValue` in `portable.js:63`: recursively validate every property, then call `structuredClone`. The game pays this cost just to ask whether a world exists, including the state and diagnostics of 88 failed horizon cells. `getWorld` plus `getActiveCells` used about 6 ms/frame in the instrumented Endless sample. CPU sampling also placed `portable.js`'s recursive `visit` high in the profile.

**Fix:** use the existing `getWorldDefinition(id)` for registration/existence checks, which reads the runtime map directly. Cache active-cell descriptors at actual world transitions. A later engine improvement should provide targeted read-only/versioned queries without serializing unrelated worlds. Preserve snapshot validation at serialization boundaries.

### 3. Critical: truck glass nearly doubles rendering submissions

**Confirmed with a temporary A/B.** `src/app/app-chunk-2.js` defines glass as a physical material with `transmission:.18`, even though it is already transparent. Three.js builds a transmission render target for this effect and renders the opaque scene for it. A tiny windshield can consequently add another draw of most terrain, roads, vegetation and props.

The observed A/B reduced 2,349 draw calls to 1,179 and 2.06 million triangles to 1.04 million. The shader/material setting was restored. This does not mean GPU time or FPS changes by exactly the same ratio.

**Fix:** use tinted opaque or ordinary transparent glass for these arcade trucks, or enable true transmission only in a tiny isolated garage scene where it has visible value. Re-measure GPU and CPU submission time afterward.

### 4. High: the game disables the engine domains that terrain code still calls

**Confirmed, source and runtime.** `src/app/app-chunk-1.js:14` composes `createCoreWorldDomain({childDomains:false})`. `worldFeatures` and `worldFoundation` are absent. `app-chunk-15.js:4` nevertheless calls the adapter's `compileCell()` on every terrain lookup and catches its error. The adapter's `requireCore()` in `src/game/world-feature-adapter-kit.mjs:173` throws every time. The legacy terrain calculation then runs anyway.

The horizon path in `app-chunk-16.js:3` calls the same compilation outside a protective fallback. Its provider fails, so distant terrain is absent while its state and diagnostics remain in world snapshots. The browser console can be clean because the world-provider API records failures internally.

**Fix:** explicitly choose the active terrain implementation. Gate absent feature domains before entering the hot path and stop registering a provider that cannot work. Enabling all child domains alone is not a complete repair: `compileCell` and adapter-state cloning must also leave per-height/per-vertex loops, or the enabled path can be more expensive still.

### 5. High: generation budgets count cells, not milliseconds

**Confirmed, source and spikes.** One `stepGeneration()` operation can construct hundreds of descriptors in `app-chunk-6.js:17`. Later, `preparation.pump({maximum:1})` executes its generator synchronously because no executor is configured. `reconcileCells(1)` can construct full tree/terrain geometry and flush instance data on the browser's main thread.

The earlier instrumented capture saw three realized cells take about 292 ms total, roughly 100 ms for the slowest cell. The loading maximum reached 1.922 seconds. A one-cell budget does not protect a 16.67 ms frame.

**Fix:** move serializable descriptor/tree-array generation to an executor/worker and give main-thread mesh realization and GPU uploads a time budget. Split large realization steps, prefetch before the boundary, and record queue/ready/activation latency. The pinned controller already exposes an executor hook; adding `Promise.resolve` around synchronous work would not move it off the main thread.

### 6. High: streaming repeats structural work every frame while the truck stays in one cell

**Confirmed.** `updateWorldStreaming()` recreates the 81-cell visual plan, sorts its frontier, maps fresh cell objects, reconstructs combined route targets, rebuilds Sets/Maps, updates desired records and scans current hosts every frame. `reconcileCells(0)` still scans/sorts the queues, and is called again with budget 1 when work is pending. The engine controller also rebuilds desired sets, checks `ready.includes` and runs eviction scans on every `updateDesired` call.

**Fix:** rebuild targets when the cell, relevant travel direction or route changes. Pump pending work separately on a small budget. Maintain membership sets and a dirty/version flag so steady frames avoid repeated list construction and sorting.

### 7. High: simple road decoration becomes hundreds of separate draw calls

**Confirmed in source and draw counts.** `src/app/app-chunk-17.js:18-21` creates separate meshes for lane lines, edge lines, posts and reflectors. Depots, poles, rocks and traffic parts are also many separate objects. Sharing geometry/materials saves storage but does not merge draw calls. Transmission amplifies these submissions.

**Fix:** batch markings into cell geometry or instances grouped by material, and instance repeated poles/markers/rocks. Keep independently moving traffic roots, but merge or instance their repeated parts. Measure visible object counts as well as triangle counts.

### 8. High: merged trees still carry substantial geometry and construction cost

**Confirmed in source; individual tree GPU cost not isolated.** `src/game/tree-mesh-builder.mjs` builds up to 96 leaf octahedra, a trunk and six branches per tree. Each full tree can exceed 1,000 triangles. Merging a cell's trees into one mesh reduces draw calls but does not reduce triangle count, CPU generation, typed-array allocation or GPU memory. Distant visual-only cells use fewer trees but retain detailed geometry for the trees that remain.

`app-chunk-5.js:4-5` builds arrays, converts them to typed arrays, computes normals/bounds and uploads each new mesh synchronously. Only whole-cell frustum culling is available once trees are merged. A partly visible cell submits all its merged trees.

**Fix:** keep near trees detailed, use much simpler distant templates/cluster meshes, cache reusable prototypes and build arrays off-thread. Use spatially bounded batches and an explicit foliage triangle budget. Preserve the data-derived shape intent.

### 9. High: far terrain queries can fall back to scanning the complete road network

**Confirmed in source.** `src/game/road-spatial-index.mjs:33` allocates a Set/list and scans expanding grid rings for every query. When no nearby road is found, it returns all route segments to preserve exact nearest-road semantics. That is reasonable for an exact nearest-road query, but expensive for terrain far enough away that road blending is already zero.

Terrain generation, camera clearance, wheel contact, traffic height and wildlife all ask for heights. `createTerrainMesh` in `app-chunk-13.js:1` recalculates four height samples per terrain vertex for normals. Those distant samples can trigger the full-road fallback. Replacing local terrain queries with the global function in presentation code bypasses savings already present in `cell-descriptor.mjs`.

**Fix:** add a bounded-distance road-influence query for terrain, derive normals from the existing height grid, and cache/interpolate collision heights for local truck/camera/traffic queries. Preserve an exact full fallback only for callers needing exact nearest-route semantics.

### 10. Medium-high: course exploration scans and copies route data every frame

**Confirmed in source.** `src/game/course-kit.mjs:27-35` scans every unexplored edge and its samples on each `sample` request. The public `sample()` returns `get()`, which deep-copies the course and exploration state even though its caller discards that return. Extra `getState()` calls for HUD/map duplicate the course again. The 165-edge Campaign and five-branch procedural course scale this overhead with route size.

**Fix:** spatially restrict exploration checks and expose a small exploration/status view. Use full course snapshots for saves/debug/export, not unused command return values.

### 11. Medium-high: garbage creation throughout simulation and presentation

**Confirmed, measured collectively.** Roughly 119 structured clones per frame were recorded. Truck, run, input, course, wildlife and profile getters repeatedly return fresh snapshots. Input is cloned before updates and again for return values. The truck simulation creates new state/vector objects on each substep. Wheel visuals build several temporary arrays and run `map/filter/reduce` every frame. Sampling showed garbage collection activity.

**Fix:** establish one small frame snapshot per subsystem; pass it through presentation, skip unused command snapshots, and reuse hot-path vectors/arrays. Keep ownership-safe snapshots at external boundaries. The current evidence does not prove any one tiny allocation is the primary bottleneck; world snapshots dominate the measured copies.

### 12. Medium: traffic speed and appearance depend on display frame rate

**Confirmed.** `src/app/app-chunk-18.js:134` calls `arcadeTrafficUpdate(1/60)` once per rendered frame. At 120 rendered fps cars advance twice as far per wall-clock second as at 60; at 30 fps they advance half as far. The main truck uses actual `dt`, producing inconsistent relative speeds and collision/near-miss opportunities. This is a simulation defect that also prevents fair performance comparisons.

**Fix:** pass the authoritative frame delta, or use a fixed simulation accumulator with render interpolation. Recheck collision tunneling at the highest relative speeds. Fourteen rectangular colliders are not themselves an obvious dominant performance problem.

### 13. Medium: traffic repeatedly walks the route and reads storage

**Confirmed.** Every active car calls `arcadeRoutePosition()`, which scans from the first edge to find its segment. This becomes O(cars x edges) late in long routes. `arcadeUpgradeState()` parses localStorage in the fuel path and again in traffic every driving frame. Local storage is synchronous and upgrade values do not change during the present drive.

**Fix:** precompute cumulative edge lengths and use a cursor/binary search. Cache the purchased upgrades when a run begins or a purchase occurs. Keep the existing vehicle pool rather than rebuilding vehicles each frame.

### 14. Medium: collision and camera code repeatedly scans all active obstacles

**Confirmed.** `app-chunk-17.js:27` scans obstacle/wildlife collisions, then calls the original `postTickGameplay` in chunk 8, which scans them again. Camera avoidance scans obstacles too. Wildlife visuals use a linear hazard search for each animal.

**Fix:** query a local obstacle grid once, run one authoritative collision pass, and index wildlife by ID. Preserve heading-aligned vehicle colliders and independent near-miss rules. This is not currently as costly as world copies or rendering.

### 15. Medium: a failed distant-world system still has large update spikes and state

**Confirmed now; larger repair risk in source.** Horizon focus changes in 960 m steps. `registerHorizonWorld()` / `updateWorld()` synchronously reconcile a quadtree covering roughly 49 km with 88 active cells in the observed case. Providers fail and collect diagnostics. If repaired by enabling child domains, many cells could start compiling features and building terrain together at those focus changes. `reconcileHorizon` also uses an O(n²) containment test.

**Fix:** bound and budget far-world updates, cache sectors, and avoid preparing content well beyond the render distance. Test both sides of a horizon-focus boundary after restoring the provider. Do not assume the currently missing horizon is free just because it has zero meshes.

### 16. Medium: quality settings mainly change pixel density

**Confirmed.** `app-chunk-10.js:13` switches the pixel-ratio cap between 1.25 and 0.85. Terrain resolution, desired-cell count, tree detail, traffic detail and most CPU work remain unchanged. Full-window rendering also has no absolute pixel-area budget. A larger window or external monitor can multiply fill cost while leaving the major CPU costs untouched.

**Fix:** use quality tiers with real world/foliage/traffic budgets, a maximum drawing-buffer area, and optionally measured resolution adjustment. Preserve the 16:9 stage. Measure at each target window size rather than treating a DPR cap as a frame guarantee.

### 17. Medium: transparent vegetation and clouds create avoidable overdraw

**Source-backed rendering risk, not isolated as the dominant GPU cost.** Grass combines alpha testing with `transparent:true`, double-sided drawing and disabled depth writes, giving overlapping blades repeated fragment shading and transparent sorting. The three 1800 m cloud sheets blend over one another with no depth writes. These layers are especially sensitive to output pixel count and viewing angle.

The cloud transform update itself measured negligible CPU time. Their noise textures are generated once at startup, not every frame. Three layers are not enough evidence to blame clouds for the observed CPU bottleneck.

**Fix:** test opaque alpha-cutout/depth-writing grass, distant grass reduction, and cheaper cloud materials/coverage while retaining the accepted 50/100/200 m layers. Isolate each with GPU timer A/B captures before changing its artistic density.

### 18. Medium: idle, pause, results and menus keep running/rendering

**Confirmed.** The main loop ticks and renders on every requestAnimationFrame in all scenes. `preTickIdle` still sends input and, when a course exists, samples ground. Pause does not gate the truck domain's simulation; the truck is teleported to zero speed but can continue settling/drifting. A high-refresh MacBook may do this work around 120 times per second while the player is reading a menu.

**Fix:** explicitly suspend gameplay simulation outside driving, retain UI animation only where needed, and render static views on demand or at a bounded rate. Handle page visibility/focus. This should reduce heat and battery drain; sustained power savings were not measured.

### 19. Medium: boot imports an unnecessarily broad engine graph

**Confirmed request graph; cold-network latency not fully measured.** `index.html:10` imports the engine root index from a CDN, whose export graph loads 221 engine module resources in the observed boot. `bootstrap.mjs` then loads 18 classic app scripts sequentially. No local build/bundle is provided. Every new context depends on network/cache behavior; repeated parse/compile and round trips can make a tiny game feel slow to start.

**Fix:** create a small, pinned, bundled runtime entry containing the installed kits; serve it locally with the game. Cache route data and provide a declared loading/failure policy. Keep dependency provenance. This is primarily startup reliability/latency, not an explanation for every slow warm frame.

### 20. Medium: existing performance telemetry conceals important failures

**Confirmed.** `app-chunk-11.js` calculates `fps` from `dt` after clamping it to 1/15, so long stalls can appear as 15 fps instead of their true interval. `avgFrameMs` measures JavaScript callback work including submission, excludes asynchronous GPU execution and display wait, and uses a history-weighted average. Its maximum includes title/loading with no sample reset. `streamingStalls` is initialized to zero and never incremented. There are no percentiles, GPU costs or failed-provider counts in the public stats.

**Fix:** keep raw frame intervals, phase-specific timers, warm-up/reset boundaries, p50/p95/p99/maximum, long-task counts, cell/queue budgets and provider failures. Sample GPU time asynchronously. A clean console or a momentary FPS number is insufficient acceptance evidence.

### 21. Medium-low: repeated garage rebuilds leak material ownership

**Confirmed missing disposal; growth magnitude not measured.** `campaign.html:211-228` creates new paint/dark/glass materials on each truck preview rebuild, but removes the old model by disposing geometry only. The renderer retains compiled/material resources until correctly disposed. `initGaragePreview` also sets its initialized flag only after awaiting a module import, allowing rapid calls while the import is pending to start multiple initialization attempts. Its animation callback remains scheduled when the garage is hidden, although it correctly skips rendering in that state.

**Fix:** share stable preview materials or dispose owned materials, guard initialization with one promise, and stop/restart animation scheduling with visibility. Verify counts across repeated purchases/selection/reentry. Do not mistake a single heap sample for proof of a material leak's size.

### 22. Medium-low: HUD and map do avoidable presentation work

**Confirmed.** `app-chunk-9.js:7` repeatedly queries elements and rewrites HUD text/styles every frame. Arcade adds a second overlapping stat HUD and its own state reads. When open, `drawMap()` measures DOM bounds and redraws all visible map geometry every frame even if roads/discovery did not change. Selected-route pulsing and backdrop filters can add browser compositor work.

**Fix:** cache nodes, update changed values, refresh numeric UI at 10-20 Hz, cache static map layers and animate only markers that move. Map rendering already returns immediately when closed, so the closed map is not a major measured cost.

### 23. Low but confirmed: title renders the whole traffic pool at the origin

All 14 traffic groups are constructed visible before generation; `arcadeTrafficUpdate` is only called during Campaign driving. The title therefore renders overlapped traffic bodies along with the title truck until generation hides the groups. The title sample had 179 draw calls for a very small scene, and the client screenshot visibly showed overlapping vehicles.

**Fix:** initialize pooled traffic hidden and toggle it explicitly by mode. The title should pay only for its intended preview and background.

### 24. Validation gap: source-shape smoke tests do not establish performance

The atomic-domain and gameplay smoke suites passed. `tests/static-shell-smoke.mjs` fails at its existing literal-regex expectation of inline `vegetation=visualOnly?...`; the current tree builder already owns this selection. This failure predates the rolling-start edits. Even a passing version of that source-string test would not detect 300 scenery hosts, failed horizon providers, transmission's extra render pass, material retention or frame-time spikes.

**Fix:** preserve existing meaningful checks, reconcile the stale expectation when touching tree tests, and add runtime performance acceptance around budgets and provider health in a dedicated follow-up. No new test file or unrelated test rewrite was added here.

### 25. High startup reliability issue: a slow boot can permanently block a successfully loaded game

**Confirmed in the separate cold-context web-game client.** `index.html` shows a blocking boot-failure panel after 12 seconds if the boot flag is still false. If the broad CDN module graph eventually finishes and sets the flag true, the success path does not remove that panel. The test client reached a working title state and `render_game_to_text`, but its Start click was intercepted by the stale boot-failure overlay. A slow connection or cold cache can therefore look like an app failure even after loading succeeds. No gameplay exception was required to trigger it.

**Fix:** distinguish delayed loading from a terminal error; clear a loading-timeout panel on successful initialization and provide retry/cancel behavior. Bundle the dependency graph to reduce the trigger. The ordinary cached Metal browser path successfully exercised launch, retry and resume; the cold CDN path is a separate failing lifecycle case.

## What is already sensible

Shadows and antialiasing are disabled, pixel density is capped, there is one driving engine, road lookup has a spatial index, traffic objects are pooled, grass uses instancing, tree draws are merged per cell, and streamed cell geometry/textures/materials track ownership for disposal. These choices are useful. Their benefit is currently undermined by retention policy, world snapshot reads, per-cell generation spikes and the transmission pass. The directional sun's lower intensity changes appearance, not the number of lighting/shadow passes; shadows are already disabled.

## Recommended repair order

1. Remove snapshot getters from existence checks; gate disabled feature services and repair or bypass the failed horizon provider.
2. Stop Endless full-route scenery retention and enforce bounded cell/memory budgets.
3. Replace gameplay glass transmission, then batch road markings and repeated scenery.
4. Put descriptor/tree generation behind the existing executor hook and time-budget realization/uploads.
5. Fix traffic delta time, cache upgrades/route cursors, remove duplicate collision passes and minimize frame snapshots/terrain queries.
6. Add meaningful quality tiers, visibility-aware simulation/rendering, locally bundled dependencies and honest runtime telemetry.
7. Repeat equivalent moving runs and focus-boundary crossings, then do a thermal/battery soak at the intended window size. Require steady p95 intervals near the 16.67 ms target and explicit acceptable spike bounds before claiming the MacBook Pro performance problem is fixed.

## Rolling-start change and validation

The launch uses half the active configured `maximumForwardSpeed`. Campaign applies fleet/upgrades during Preparing truck so that the value is ready before launch. Ready queues a teleport at the starting pose with the requested speed. The truck kit now converts nonzero teleport speed into heading-aligned X/Z velocity, so the following physics step preserves motion rather than recomputing a zero speed from zero velocity.

- Campaign first observed simulation frame: 17.986 m/s against a 36 m/s normal maximum, ratio 0.49961. The queued value is exactly 18 m/s; ordinary drag/rolling resistance apply in the first tick.
- Endless first observed frame: 15.240 m/s against a 30.5 m/s normal maximum, ratio 0.49966. The queued value is exactly 15.25 m/s.
- Endless retry observed 15.233 m/s against 30.5 m/s. Pause/resume observed approximately zero speed, so resume does not reapply launch velocity.
- Inline domain checks passed for teleport velocity at headings 0, pi/2, pi and -pi/2, plus zero-speed recovery behavior.
- Existing domain and gameplay smoke suites passed; static-shell failure above remains. Syntax checks for all changed runtime files and `git diff --check` passed.
- The prescribed standalone web-game client was run through a temporary adapter to reuse the available Playwright package and installed Chrome. Its fresh context was blocked by the existing boot-failure overlay, including a retry serving the exact pinned engine source from the temporary local download. Its title screenshots were inspected; it does not constitute a passing standalone gameplay check. Those software-rendered client runs were excluded from the earlier Metal performance samples. Hardware-backed browser interactions independently verified the launch, retry and resume behavior above.
- `render_game_to_text` now exposes scene/mode, player pose/velocity/speed and normal maximum, run state and fuel for behavior checks.

The performance audit is complete at the stated evidence level. The ranked performance remedies remain unimplemented; this change does not claim a performance improvement.


## Subsequent implementation

The historical findings and measurements above describe the pre-cleanup state. The authorized local remedies, final-source measurements, validation and remaining limits are recorded in [performance-cleanup.md](performance-cleanup.md).
