# Current audit: near-world streaming desired-set cadence and work budget

**Timestamp:** `2026-07-18T15-38-25-04-00`  
**Reviewed runtime source revision:** `753488e40e69fc13471df42959628ef3052e5992`  
**Reviewed pre-audit repository head:** `2c21dbcd06f823633b2bad3d9977ab1ebe6bcbdd`  
**Status:** `near-world-streaming-desired-set-cadence-work-budget-authority-audited`

## Summary

The current runtime and recorded documentation heads were synchronized before this run. TheLongHaul was selected as the oldest eligible documented repository after the complete Publish inventory comparison.

The near-world streaming host reconstructs and resubmits preparation state on every driving frame. Core World focus/update and `reconcileCells()` are gated by a changed 192-unit cell key, but preparation focus, desired membership, two pumps and three manual prefetch requests are not.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing or undocumented: 0
runtime-ahead: 0
selected: LuminaryLabs-Publish/TheLongHaul
selection class: oldest synchronized eligible repository
prior central timestamp: 2026-07-18T03-43-36-04-00
reviewed runtime source revision: 753488e40e69fc13471df42959628ef3052e5992
reviewed pre-audit repository head: 2c21dbcd06f823633b2bad3d9977ab1ebe6bcbdd
```

## Complete interaction loop

```txt
page load
  -> ordered 13-chunk bootstrap
  -> install 8 Core and 12 product kits
  -> create browser, WebGL, Canvas2D, DOM, audio and storage adapters

start
  -> generate and verify course
  -> prepare the initial 3x3 near-field window
  -> register near uniform-grid Core World
  -> register distant quadtree horizon Core World
  -> build truck and wildlife
  -> enter driving

driving
  -> collect intent
  -> sample road, terrain height and terrain normal
  -> tick simulation
  -> update near-world preparation every frame
      -> set preparation focus
      -> reconstruct nine active cell descriptors
      -> reconstruct nine desired request descriptors
      -> update desired membership
      -> pump up to six jobs
      -> request three manual prefetch cells
      -> pump up to two jobs
  -> on near-cell key transition
      -> update near Core World focus
      -> update active cells
      -> reconcile near Three.js hosts and batches
  -> update distant horizon world
  -> update truck, camera, wildlife, HUD, map and audio
  -> render

delivery
  -> evaluate candidate yard
  -> settle completion or penalty
  -> build result
  -> show results and best-run storage
  -> retry, fresh course or title
```

## Domains in use

Browser startup/lifecycle; Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger; World Profile, World Atlas, Horizon LOD, Road Classes, Terrain Policy, Truck Dynamics, Delivery Contracts, Truck, Course, Run, Delivery and Wildlife; finite-course generation; near-field patch generation and preparation; near-world desired-window, prefetch and pump cadence; macro-sector and curved-horizon generation; terrain-normal continuity; WebGL, Canvas2D, DOM, WebAudio, storage, Node smoke, Actions, Pages and governance.

## Kit and service census

All kit IDs and offered services are enumerated in `trackers/2026-07-18T15-38-25-04-00/project-breakdown.md` and `kit-registry.json`.

```txt
engine-installed kits: 20
world providers: 2
controllers: 1
browser/product adapters: 9
proof/deployment adapters: 4
total source-backed surfaces: 36
proposed streaming-cadence surfaces: 20
```

## Source-backed findings

1. `frame()` invokes `updateWorldStreaming()` during every driving frame.
2. `ACTIVE_RADIUS` is `1`, so the active desired window is nine cells.
3. Every call reconstructs the active-window cell descriptors and mapped request descriptors.
4. Every call invokes `preparation.setFocus()` and `preparation.updateDesired()`.
5. Every call invokes `preparation.pump()` twice.
6. Every call constructs and submits three manual forward-strip prefetch requests.
7. Only `coreWorld.setFocus()`, `coreWorld.updateWorld()` and `reconcileCells()` are gated by `key !== lastCellKey`.
8. The pinned controller's `setFocus()` rebuilds and structured-clones focus state.
9. The pinned controller's `updateDesired()` creates new active/prefetch sets, recomputes built-in prefetch, repopulates membership, runs eviction array/filter/sort work and returns a fresh statistics snapshot.
10. The controller is configured with `prefetchDistance: 3` while the product also issues a separate three-cell prefetch strip.
11. The host ignores every controller result from focus, desired, request and pump calls.
12. No streaming generation, focus key, direction key, desired-window digest, canonical prefetch plan, pump-admission result or first matching-frame acknowledgement exists.

## Conservative caller-owned floor

```txt
minimum source-visible objects/arrays per driving frame: 56
conditional at 60 displayed frames/second: 3,360 per second
conditional at that cadence for one minute: 201,600
```

The count excludes controller-owned clones, sets, arrays, statistics, diagnostics, request clones, pump results, callback objects, patch generation, Three.js work and browser internals. It is not a measured allocation-byte or performance result.

## Required authority

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

## Audit boundary

Documentation only. Runtime JavaScript, HTML, CSS, gameplay, rendering, tests, workflows and deployment were unchanged. No visible defect, frame-time regression, GC pause, memory leak, allocation-byte amount, artifact mismatch, Pages mismatch or production failure is claimed without executable evidence.