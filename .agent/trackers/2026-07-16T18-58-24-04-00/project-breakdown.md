# Project breakdown: runtime-frame fault containment and retirement

**Timestamp:** `2026-07-16T18-58-24-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed repository head:** `a756b21caee440a818bd23fd6e8556a9b3cb2426`  
**Status:** `runtime-frame-fault-containment-retirement-authority-audited`

## Summary

The full current Publish inventory contains 11 repositories. Ten are eligible after excluding `LuminaryLabs-Publish/TheCavalryOfRome`. All ten have central ledger records, root `.agent` state and synchronized heads. No repository was new, ledger-missing, root-agent-missing, undocumented or runtime-ahead, so TheLongHaul was selected by the oldest documented timestamp rule.

The focused finding is the runtime fault path. The main RAF schedules its successor before executing generation, input, simulation, streaming, presentation and render work. Any exception is caught and projected through `showBootError()`, but the scheduled loop is not retired. There is no fault generation, phase receipt, stale-callback rejection, input/audio/world retirement, partial-frame settlement or first terminal-fault-frame acknowledgement.

## Intent

Make one frame failure settle as a bounded terminal result before another frame can mutate gameplay or presentation state.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 0

TheLongHaul       2026-07-16T14-01-02-04-00 selected
PrehistoricRush   2026-07-16T14-39-29-04-00
TheOpenAbove      2026-07-16T14-59-39-04-00
IntoTheMeadow     2026-07-16T15-38-27-04-00
HorrorCorridor    2026-07-16T16-00-12-04-00
ZombieOrchard     2026-07-16T16-40-45-04-00
TheUnmappedHouse  2026-07-16T16-58-39-04-00
PhantomCommand    2026-07-16T17-40-04-04-00
AetherVale        2026-07-16T18-00-35-04-00
MyCozyIsland      2026-07-16T18-41-23-04-00
TheCavalryOfRome  excluded
```

## Complete interaction loop

```txt
page load
  -> import Three.js and pinned Nexus Engine
  -> load bootstrap plus eleven ordered application chunks
  -> install 8 Core kits and 10 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

Start the Haul
  -> choose a seed
  -> generate and validate a five-branch course
  -> create/verify the Core Data course envelope
  -> prepare and prime initial world cells
  -> reset Truck, Run, Delivery, Wildlife and meters
  -> register the Core World provider
  -> enter driving

Driving frame
  -> schedule the next RAF before current-frame work
  -> submit browser input and gameplay requests
  -> advance engine, simulation, delivery and world streaming
  -> update truck, wildlife, camera, HUD, map and audio
  -> render one Three.js frame
  -> clear one-shot input

Fault path
  -> any phase throws
  -> catch calls showBootError()
  -> failure overlay becomes visible
  -> already-scheduled RAF continues
  -> no fault generation, scheduler retirement or partial-frame settlement

Outcome
  -> valid depot completes the run
  -> failure routes to loss
  -> retry same seed, generate a new course or return to title
```

## Domains in use

```txt
browser startup and ordered modules
browser document, RAF, resize, keyboard and storage lifecycle
Core Scene
Core World
Core Input
Core Data
Core Simulation
Core Camera
Core Graphics
Core Transaction Ledger
Long Haul World Profile
Long Haul Road Class Catalog
Long Haul Terrain Policy
Long Haul Truck Dynamics Profile
Long Haul Delivery Contract Catalog
Long Haul Truck
Long Haul Course
Long Haul Run
Long Haul Delivery
Long Haul Wildlife
procedural course generation
course-cell and terrain generation
patch preparation and world-provider lifecycle
Three.js WebGL presentation
Canvas2D map projection
DOM menu, HUD, outcome and fault projection
WebAudio
browser storage
runtime frame scheduling and fault containment
Node smoke validation
GitHub Actions and Pages deployment
repo-local and central audit governance
```

## Engine-installed kits and services

| Kit | Offered services |
|---|---|
| `core-scene-kit` | Scene registry, current-scene state, exit validation, transition requests and transition identity. |
| `core-world-domain` | World registration/removal, uniform-grid partitioning, focus, active-cell lifecycle, ordered providers, validation and snapshots. |
| `long-haul-input` | Semantic actions, keyboard bindings, contexts, driving intent and reset. |
| `core-data-kit` | Course schema, envelopes, digest verification, named random streams and random snapshot/restore. |
| `core-simulation-kit` | Fuel, truck/cargo condition and remaining-time meters, bounds, rates, locks, thresholds and reset. |
| `core-camera-kit` | Camera target, position/look/FOV smoothing, snap, mode and portable descriptors. |
| `core-graphics-kit` | Instance-batch registration, cell replacement/removal, matrix writes, flush, bounds and release receipts. |
| `core-transaction-ledger-kit` | Apply-once operations, duplicate classification, metadata and snapshots. |
| `long-haul-world-profile-kit` | World/disk/cell/horizon/atlas policy, configure, snapshot and reset. |
| `long-haul-road-class-catalog-kit` | Road width, grip, grade, curvature and jump-weight records; get/list/register and snapshot/reset. |
| `long-haul-terrain-policy-kit` | Terrain octaves, hill/ridge/valley density, road flattening/smoothing and jump profiles. |
| `long-haul-truck-dynamics-profile-kit` | Powertrain, drag, resistance, steering, grip, suspension, air control and boost policy. |
| `long-haul-delivery-contract-catalog-kit` | Seven contract types, get/list/register and snapshot/reset. |
| `long-haul-truck-kit` | Truck state, input, road kinematics, surface grip, impulses, teleport, recovery pose and snapshot/load. |
| `long-haul-course-kit` | Course package, exploration, depot discovery, nearest-road/depot queries, samples and snapshot/load. |
| `long-haul-run-kit` | Clock, distance, speed, off-road time, penalties, collisions, stuck/recovery, outcomes and snapshot/load. |
| `long-haul-delivery-kit` | Candidate/valid depots, depot checks, duplicate classification, accepted/rejected delivery result and snapshot/load. |
| `long-haul-wildlife-kit` | Deterministic hazards, crossing motion, damage/radius/direction and snapshot/load. |

## Providers, controllers, adapters and proof surfaces

| Surface | Offered services |
|---|---|
| `long-haul-course-provider` | Prepared-cell admission, update/release, effect descriptor and patch snapshot/restore/reset. |
| `long-haul-world-patch-preparation-controller` | Focus, desired/prefetch sets, generation/activation budgets, cache, prime, release and snapshot/reset. |
| `ordered-module-bootstrap-adapter` | Import-map bootstrap, global dependency publication, ordered eleven-chunk loading and boot-failure projection. |
| `procedural-course-generator` | Seeded five-branch graph, depots, wildlife, scoring and validation. |
| `course-cell-descriptor-generator` | Terrain, roads, signs, depots, vegetation, grass, rocks and obstacles. |
| `browser-keyboard-input-adapter` | Keydown/up, held state, one-shot state and per-frame clear. |
| `three-webgl-presentation-adapter` | Renderer, scene, camera, streamed cells, instance batches, truck/wildlife rigs, resize, RAF and render. |
| `dom-scene-hud-adapter` | Title, help, settings, generation, HUD, pause, outcomes, toast and failure overlay. |
| `canvas-map-adapter` | Explored roads, depots, rejected yards, truck marker and DPR resizing. |
| `web-audio-adapter` | Context unlock, engine/wind loops, cues and gain updates. |
| `browser-storage-adapter` | Settings and best-score persistence. |
| `long-haul-game-smoke` | 100-seed generation, cell cloneability, truck motion and delivery evaluation. |
| `static-shell-smoke-and-ci` | Provider pin, single-tick, syntax and source-pattern checks on main. |
| `github-pages-deployment` | Static-root publication from main. |

```txt
engine-installed kits: 18
Core World effect providers: 1
standalone controllers: 1
browser/product adapters: 9
proof/deployment adapters: 3
total source-backed surfaces: 32
render surfaces: 3
planned runtime-fault authority surfaces: 19
```

## Source-backed finding

```txt
next RAF scheduled before phase execution: yes
outer frame try/catch: yes
failure overlay projection: yes
generation-local error capture: yes

terminal runtime fault state: no
fault generation or revision: no
phase-specific execution receipt: no
scheduler cancellation/retirement: no
stale callback rejection: no
held/one-shot input retirement on fault: no
audio suspension on fault: no
world/provider retirement on fault: no
partial-frame mutation settlement: no
repeated-error suppression: no
RuntimeFrameFaultResult: no
FirstFaultFrameAck: no
```

The main loop calls `requestAnimationFrame(frame)` before entering its `try` block. When a later phase throws, the catch only calls `showBootError(error)`. Because a successor callback is already queued and no failed-generation flag is set, the game can repeatedly execute the same failing path.

Generation failures are also projected without retiring the surrounding frame scheduler. A generation step marks `generation.error`, but the frame continues to tick the engine, update UI and render on later callbacks.

If a failure occurs after simulation, transaction, world or DOM mutation but before `pressed.clear()`, the next callback can observe a partially advanced frame and stale one-shot input. This is a source-backed containment gap, not a claim that a production crash has been reproduced.

## Required authority

`the-long-haul-runtime-frame-fault-containment-retirement-authority-domain`

```txt
RuntimeFrameExecutionCommand
  -> bind document, session, run, scene, scheduler and frame revisions
  -> admit one frame generation
  -> execute named phases with phase receipts
  -> reject stale or retired callbacks
  -> publish RuntimeFrameExecutionResult

RuntimeFrameFaultCommand
  -> classify phase, error and partial-mutation evidence
  -> atomically retire the failed scheduler generation
  -> clear held and one-shot input
  -> mute active audio
  -> cancel or retire generation and world work
  -> prohibit continuation from indeterminate partial state
  -> publish RuntimeFrameFaultResult
  -> project one accessible terminal fault surface
  -> publish FirstFaultFrameAck

RuntimeRestartAdmissionCommand
  -> require explicit user action
  -> choose reload or clean-run restart policy
  -> create a fresh runtime generation
  -> reject callbacks and resources from the failed generation
```

## Proposed surfaces

```txt
runtime-frame-execution-kit
runtime-frame-phase-boundary-kit
runtime-fault-classification-kit
runtime-fault-generation-kit
frame-scheduler-retirement-kit
stale-frame-callback-rejection-kit
input-evidence-fault-retirement-kit
audio-fault-suspension-kit
world-provider-fault-retirement-kit
generation-fault-settlement-kit
partial-frame-mutation-journal-kit
runtime-frame-fault-result-kit
runtime-retirement-result-kit
first-fault-ui-frame-ack-kit
runtime-restart-admission-kit
repeated-fault-suppression-kit
fault-diagnostic-redaction-kit
runtime-fault-browser-fixture-kit
runtime-fault-artifact-pages-fixture-kit
```

## Checklist

- [x] Compare the full 11-repository Publish inventory with central tracking.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible central ledgers and root `.agent` states.
- [x] Compare every eligible documented head with `main`.
- [x] Select only TheLongHaul by the oldest synchronized timestamp.
- [x] Identify the complete interaction loop.
- [x] Identify every active domain.
- [x] Preserve all 18 kits and 14 provider/controller/adapter/proof surfaces with their services.
- [x] Inspect bootstrap, generation, input, gameplay, world, audio, UI and frame-loop fault paths.
- [x] Define one parent runtime-fault authority and 18 coordinating surfaces.
- [x] Add the timestamped root `.agent` audit family.
- [x] Keep runtime, tests, workflow and deployment unchanged.
- [ ] Implement scheduler retirement, phase receipts and explicit restart admission.
- [ ] Add deterministic browser, artifact and Pages fault fixtures.

## Validation boundary

This is documentation-only work. No runtime JavaScript, HTML, CSS, gameplay, generation, simulation, rendering, input, audio, storage, package, test, workflow or deployment behavior is changed. No crash recovery, fault isolation, partial-frame rollback, stale-callback rejection, fault-frame convergence, artifact parity, Pages parity or production-readiness claim is made.
