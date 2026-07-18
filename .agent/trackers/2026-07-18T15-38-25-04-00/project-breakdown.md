# Project breakdown: near-world streaming cadence and work budget

**Timestamp:** `2026-07-18T15-38-25-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed runtime source revision:** `753488e40e69fc13471df42959628ef3052e5992`  
**Reviewed pre-audit repository head:** `2c21dbcd06f823633b2bad3d9977ab1ebe6bcbdd`  
**Selection:** oldest synchronized eligible Publish repository  
**Status:** `near-world-streaming-desired-set-cadence-work-budget-authority-audited`

## Summary

The complete 11-repository `LuminaryLabs-Publish` inventory was compared with the ten eligible central ledgers and root `.agent` states. `LuminaryLabs-Publish/TheCavalryOfRome` was excluded. No eligible repository was new, ledger-missing, root-agent-missing, undocumented, or runtime-ahead. TheLongHaul had the oldest synchronized central timestamp and was the only selected project.

The focused audit isolates the near-world streaming path. During every driving frame, `updateWorldStreaming()` reconstructs the same 3x3 active window while the truck remains in one 192-unit cell, republishes focus, calls `updateDesired()`, pumps generation, issues three additional prefetch requests, and pumps again. Only the Core World focus/update/reconciliation block is gated by a cell-key change.

With `ACTIVE_RADIUS = 1`, the product caller creates a conservative minimum of 56 source-visible objects or arrays per driving frame before controller-owned clones, sets, arrays, statistics, queue results, or generator work. At a hypothetical 60 displayed frames per second this is 3,360 caller-owned constructions per second, or 201,600 per minute. This is source arithmetic, not a heap profile, GC trace, frame-time measurement, or demonstrated production regression.

## Selection comparison

```txt
accessible LuminaryLabs-Publish repositories: 11
excluded: LuminaryLabs-Publish/TheCavalryOfRome
eligible repositories: 10
central ledgers present: 10
root .agent states present: 10
new or ledger-missing: 0
root-agent-missing or undocumented: 0
runtime-ahead: 0
selected: LuminaryLabs-Publish/TheLongHaul
selection class: oldest synchronized eligible repository
selected prior central timestamp: 2026-07-18T03-43-36-04-00
projects modified: 1
```

## Interaction loop

```txt
page load
  -> import Three.js and pinned Nexus Engine
  -> expose dependencies to ordered host chunks
  -> install 8 Core kits and 12 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

start
  -> generate and verify one five-branch delivery course
  -> prepare the initial 3x3 near-field terrain window
  -> register the near-field uniform-grid Core World
  -> register the distant quadtree horizon Core World
  -> build truck and wildlife rigs
  -> enter driving

driving frame
  -> collect keyboard intent
  -> sample road, terrain height and terrain normal
  -> tick truck, run, delivery, wildlife and meters
  -> call updateWorldStreaming()
      -> publish preparation focus
      -> reconstruct nine active cell descriptors
      -> reconstruct nine desired-set request descriptors
      -> call updateDesired()
      -> pump up to six queued patches
      -> issue three manual forward-strip prefetch requests
      -> pump up to two queued patches
      -> only on near-cell key change: update Core World and reconcile hosts
  -> update distant horizon focus and hosts
  -> update truck, wildlife, camera, HUD, map and audio
  -> render one WebGL frame

delivery
  -> reject decoy yards or accept the valid yard
  -> build terminal RunResult
  -> project results and reduced best-run persistence
  -> retry, generate a new course or return to title
```

## Domains in use

1. Browser startup and ordered script loading.
2. Browser document, RAF, resize, keyboard, focus, storage and audio lifecycle.
3. Core Scene.
4. Core World with a near uniform-grid world and distant quadtree world.
5. Core Input.
6. Core Data.
7. Core Simulation.
8. Core Camera.
9. Core Graphics.
10. Core Transaction Ledger.
11. Long Haul World Profile.
12. Long Haul World Atlas.
13. Long Haul Horizon LOD Policy.
14. Long Haul Road Class Catalog.
15. Long Haul Terrain Policy.
16. Long Haul Truck Dynamics Profile.
17. Long Haul Delivery Contract Catalog.
18. Long Haul Truck.
19. Long Haul Course.
20. Long Haul Run.
21. Long Haul Delivery.
22. Long Haul Wildlife.
23. Seeded finite-course generation.
24. Infinite near-field cell generation and preparation.
25. Near-world desired-window and prefetch planning.
26. Near-world generation and activation budgeting.
27. Macro-sector generation.
28. Curved-horizon terrain generation.
29. Terrain-normal and road-elevation continuity.
30. Three.js WebGL presentation.
31. Canvas2D map projection.
32. DOM menu, HUD, result and fault projection.
33. WebAudio presentation.
34. Browser settings and best-run storage.
35. Node smoke validation.
36. GitHub Actions and Pages deployment.
37. Agent governance and central reconciliation.

## Complete kit and service census

### Core and product DSKs installed in the engine

| Kit | Domain | Services offered |
|---|---|---|
| `core-scene-kit` | Core Scene | scene registry; current scene; transition request; exit validation; transition identity; snapshot |
| `core-world-domain` | Core World | world register/remove; uniform-grid and quadtree partitions; focus; active-cell lifecycle; provider ordering; validation; snapshot |
| `long-haul-input` | Core Input | semantic actions; keyboard bindings; contexts; driving intent; reset |
| `core-data-kit` | Core Data | course schema; package envelope; digest verification; named random streams; random snapshot/restore |
| `core-simulation-kit` | Core Simulation | fuel, truck-condition, cargo-condition and remaining-time meters; bounds; rates; locks; thresholds; reset |
| `core-camera-kit` | Core Camera | camera target; position/look/FOV smoothing; snap; mode; portable descriptor |
| `core-graphics-kit` | Core Graphics | instance-batch registration; cell replace/remove; flush; bounds; release receipt |
| `core-transaction-ledger-kit` | Core Transaction Ledger | ledger identity; apply-once; duplicate classification; metadata; snapshot |
| `long-haul-world-profile-kit` | World Profile | world profile; extent policy; gameplay-cell policy; horizon policy; atlas targets; configure; snapshot; reset |
| `long-haul-world-atlas-kit` | World Atlas | macro-sector generation; biome density; settlement registry; edge portals; road registry; sector query; snapshot; reset |
| `long-haul-horizon-lod-policy-kit` | Horizon LOD | terrain resolution; forest mode; road mode; settlement mode; collision policy; configure; snapshot; reset |
| `long-haul-road-class-catalog-kit` | Road Classes | road-class catalog; surface policy; grade/curvature policy; jump weighting; get/list/register; snapshot/reset |
| `long-haul-terrain-policy-kit` | Terrain Policy | octave policy; landform density; road flattening; jump profiles; configure; snapshot/reset |
| `long-haul-truck-dynamics-profile-kit` | Truck Dynamics | powertrain; drag; steering; grip; suspension; air control; boost; configure; snapshot/reset |
| `long-haul-delivery-contract-catalog-kit` | Delivery Contracts | contract catalog; job policy; get/list/register; snapshot/reset |
| `long-haul-truck-kit` | Truck | truck state; road kinematics; drift; ground contact; suspension; air control; input; impulse; teleport; recovery pose; snapshot/load |
| `long-haul-course-kit` | Course | course state; exploration; discovered depots; route query; sample; reset; snapshot/load |
| `long-haul-run-kit` | Run | clock; distance; max speed; off-road time; penalties; collisions; stuck detection; recovery; completion; failure; snapshot/load |
| `long-haul-delivery-kit` | Delivery | candidate depots; valid depot; evaluation; duplicate check; result; reset; snapshot/load |
| `long-haul-wildlife-kit` | Wildlife | hazard load; crossing motion; damage radius; direction; reset; snapshot/load |

### Core World effect providers

| Provider | Phase | Services offered |
|---|---|---|
| `long-haul-course-provider` | foundation | prepared-cell admission; update; release; effect descriptor; patch snapshot/restore; reset |
| `long-haul-horizon-provider` | presentation | quadtree cell preparation/update; curved-horizon patch generation; active patch registry; release; descriptor; snapshot; reset |

### Controller

| Controller | Services offered |
|---|---|
| `long-haul-world-patch-preparation-controller` | focus normalization; desired active-set settlement; built-in forward prefetch; request deduplication; queue priority; generation budget; activation budget; cache/eviction; prime; ready/released queues; diagnostics; statistics; snapshot/reset |

### Browser and product adapters

| Adapter | Services offered |
|---|---|
| `ordered-module-bootstrap-adapter` | import-map bootstrap; global dependency publication; ordered 13-chunk loading; load failure projection |
| `procedural-course-generator` | seeded five-branch graph; depots; wildlife; par; validation |
| `course-cell-descriptor-generator` | world-coordinate terrain; conformed roads; signs; depots; vegetation; grass; rocks; obstacles |
| `browser-keyboard-input-adapter` | keydown; keyup; held state; one-shot state; frame clear |
| `three-webgl-presentation-adapter` | renderer; scene; near-field batches; streamed terrain; horizon hosts; truck rig; wildlife rig; resize; RAF; render; disposal |
| `dom-scene-hud-adapter` | title; help; settings; generation progress; HUD; pause; results; loss; toast; failure overlay |
| `canvas-map-adapter` | course-bounds transform; roads; depots; rejected yards; truck marker; DPR resize |
| `web-audio-adapter` | context unlock; engine loop; wind loop; cues; gain update |
| `browser-storage-adapter` | settings; best score; global adjusted-time comparison; reduced record write |

### Proof and deployment adapters

| Adapter | Services offered |
|---|---|
| `atomic-domain-kits-smoke` | product composition; profile policy; catalog policy; macro-sector generation; truck dynamics |
| `long-haul-game-smoke` | 100-seed generation; cloneability; distant determinism; seam equality; truck motion; delivery evaluation |
| `static-shell-smoke-and-ci` | engine pin; single tick; syntax; horizon and grounding source markers; main-push CI |
| `github-pages-deployment` | static-root publication; main-source delivery |

## Census

```txt
Core kits: 8
product DSKs: 12
engine-installed kits: 20
Core World effect providers: 2
standalone controllers: 1
browser/product adapters: 9
proof/deployment adapters: 4
total source-backed surfaces: 36
render surfaces: 3
proposed streaming-cadence surfaces: 20
```

## Source-backed work calculation

`ACTIVE_RADIUS` is `1`, so the active window contains `(1 * 2 + 1)^2 = 9` cells.

The caller-owned minimum inside one `updateWorldStreaming()` invocation is:

```txt
forward vector object                                      1
setFocus envelope + position + velocity                   3
desired array                                              1
9 cellFromCoordinates results × (cell + coordinates + bounds) 27
mapped desired array + 9 request descriptors              10
two pump option objects                                    2
3 manual prefetch cells × (cell + coordinates + bounds)    9
3 manual request option objects                            3
                                                         ----
minimum caller-owned objects/arrays per driving frame      56
```

Conditional arithmetic:

```txt
56 × 60 frames/second = 3,360 constructions/second
3,360 × 60 seconds     = 201,600 constructions/minute
```

This excludes controller-owned focus clones, `Set` creation, prefetch coordinate objects, enqueue option objects, eviction arrays, status objects, diagnostic arrays, returned request clones, pump results, callbacks, patch generation, Three.js work, browser internals and garbage-collection behavior.

## Main finding

`updateWorldStreaming()` runs every driving frame. It gates only the final Core World focus/update/reconciliation block with `key !== lastCellKey`. Preparation focus publication, desired-window reconstruction, `updateDesired()`, both pumps and manual prefetch requests continue even when the truck remains in the same near-world cell and the active window is unchanged.

The pinned controller performs non-trivial settlement on every call: `setFocus()` rebuilds and clones focus state; `updateDesired()` creates new active/prefetch sets, recomputes built-in prefetch, releases and repopulates desired memberships, executes eviction array/filter/sort work, and returns a freshly constructed statistics snapshot. The host ignores that result. Each pump sorts the queue and returns a result even when no queued work exists.

The controller is configured with `prefetchDistance: 3`, while the product also issues a separate three-cell forward strip. These policies are not represented by one immutable prefetch plan or overlap-settlement result.

## Proposed authority

**Proposed, not implemented:**

`the-long-haul-near-world-streaming-desired-set-cadence-work-budget-authority-domain`

```txt
StreamingGenerationAdmissionCommand
  -> StreamingGenerationAdmissionResult

StreamingFocusAdmissionCommand
  -> StreamingFocusAdmissionResult

DesiredWindowSettlementCommand
  -> DesiredWindowSettlementResult

PrefetchPlanCommand
  -> PrefetchPlanResult

PatchPreparationPumpCommand
  -> PatchPreparationPumpResult

StreamingProjectionCommitCommand
  -> NearWorldStreamingDigest
  -> FirstNearWorldStreamingBoundFrameAck
```

### Proposed surfaces

1. `near-world-streaming-generation-kit`
2. `near-world-focus-key-kit`
3. `near-world-direction-key-kit`
4. `near-world-desired-window-plan-kit`
5. `near-world-desired-window-cache-kit`
6. `near-world-desired-window-diff-kit`
7. `near-world-prefetch-policy-kit`
8. `near-world-prefetch-plan-kit`
9. `near-world-prefetch-overlap-settlement-kit`
10. `near-world-patch-queue-state-kit`
11. `near-world-pump-admission-kit`
12. `near-world-pump-budget-kit`
13. `near-world-stale-work-rejection-kit`
14. `near-world-work-diagnostics-kit`
15. `near-world-streaming-work-digest-kit`
16. `near-world-frame-digest-kit`
17. `first-near-world-streaming-bound-frame-ack-kit`
18. `near-world-cadence-fixture-kit`
19. `near-world-allocation-profile-fixture-kit`
20. `pages-near-world-streaming-parity-fixture-kit`

## Validation boundary

This run changed documentation only. Runtime JavaScript, HTML, CSS, gameplay, rendering, tests, workflows and deployment were not modified. Source inspection establishes unconditional per-driving-frame preparation calls and conservative caller-owned construction arithmetic. It does not prove a user-visible performance defect, memory leak, GC pause, frame-time regression, artifact mismatch, Pages mismatch or production failure without executable evidence.