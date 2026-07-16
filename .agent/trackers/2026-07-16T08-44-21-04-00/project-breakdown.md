# Project breakdown: browser-focus held-input release

**Timestamp:** `2026-07-16T08-44-21-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Reviewed pre-audit head:** `d46394b3a848d769fac1228731e820990dbeb1f4`  
**Selection:** runtime-ahead priority  
**Status:** `browser-focus-held-input-release-authority-audited`

## Summary

TheLongHaul is now a modular static browser freight game. Forty-four commits after the previous documented head replaced the 2,114-line single-file host with `index.html`, `styles.css`, an ES-module bootstrap, eleven ordered application chunks, eight Core kits, five game DSKs, a Core World provider, a patch controller, smoke tests, package scripts, and CI.

The current composition materially adopts the earlier promoted-Core profile. The focused unresolved gap is browser-focus input retirement: held and one-shot keyboard evidence has no generation-bound clear path when focus, visibility, page, route, or run ownership changes.

## Plan ledger

**Goal:** document the full current game and define one lifecycle authority that neutralizes stale input before simulation and presentation can consume it.

- [x] Enumerate all 11 accessible Publish repositories.
- [x] Exclude `TheCavalryOfRome`.
- [x] Compare ten eligible ledgers and root `.agent` states.
- [x] Identify TheLongHaul as the only runtime-ahead repository.
- [x] Compare `f9cf4fa...` with `d46394b...` and inspect all changed files.
- [x] Identify the interaction loop.
- [x] Identify every domain in use.
- [x] Identify every kit and offered service.
- [x] Identify providers, controllers, adapters, proof surfaces, and deployment surfaces.
- [x] Trace keyboard evidence through simulation and rendering.
- [x] Define the missing input-lifecycle authority.
- [x] Add required root `.agent` output.
- [x] Keep runtime and deployment unchanged.
- [ ] Implement and execute the authority and browser fixtures.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledgers: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 1

selected: LuminaryLabs-Publish/TheLongHaul
previous documented head: f9cf4fa71c2a76cd23202787f63c5ff5b2d1f6be
reviewed pre-audit head: d46394b3a848d769fac1228731e820990dbeb1f4
ahead by: 44 commits
changed files: 30
oldest fallback not used: ZombieOrchard at 2026-07-16T03-41-28-04-00
```

## Interaction loop

```txt
page load
  -> HTML import map pins Three.js and Nexus Engine
  -> bootstrap imports engine/game modules
  -> bootstrap publishes imports into the shared host scope
  -> bootstrap loads eleven ordered classic-script chunks
  -> chunks create settings, scenes, engine, renderer and adapters
  -> boot route transitions to title

start
  -> create a fresh seed
  -> title transitions to generating
  -> clear prior world/run state
  -> generate five route branches and five depots
  -> select one valid depot with named Core Data randomness
  -> create and verify a Core Data course envelope
  -> load Course and Delivery DSK state
  -> create patch-preparation controller
  -> generate and prime nine initial cell descriptors
  -> load Wildlife DSK state
  -> reset Truck, Run, Delivery, meters and transaction context
  -> register Core World with the course provider
  -> activate initial cells and realize Three.js resources
  -> start run, unlock timer and snap Core Camera
  -> transition to driving

driving
  -> keydown/keyup update host input stores
  -> derive throttle, brake, steer and boost
  -> publish Core Input intent
  -> submit Truck, Course and Run requests
  -> spend fuel and settle idempotent impacts/recovery
  -> tick Nexus Engine once
  -> resolve delivery, penalties, meters, failure and completion
  -> update patch-preparation desired/prefetch sets
  -> update Core World focus and streamed cells
  -> update truck and wildlife rigs
  -> read Core Camera descriptor
  -> update HUD, map and WebAudio
  -> submit one Three.js frame

delivery/outcome
  -> stop at a depot and press E
  -> Delivery DSK accepts or rejects the depot
  -> wrong depot applies one transaction and penalty
  -> valid depot creates a scored result and completes Run DSK
  -> terminal route shows results or loss
  -> retry same seed or generate a fresh seed
```

## Domains in use

1. **Browser startup:** import maps, module bootstrap, ordered chunk loading, error timeout.
2. **Browser input:** keydown, keyup, held state, one-shot state, action derivation.
3. **Core Scene:** route registry and transition settlement.
4. **Core World:** world registration, focus, active cells, provider lifecycle.
5. **Core Input:** semantic action manifest, bindings and intent snapshot.
6. **Core Data:** course schema, package envelopes, digests and named random streams.
7. **Core Simulation:** bounded resource meters, rates, locks and thresholds.
8. **Core Camera:** smoothed portable camera descriptor.
9. **Core Graphics:** renderer-neutral instance-batch state and release receipts.
10. **Core Transaction Ledger:** apply-once collision, recovery and delivery operations.
11. **Long Haul Truck:** vehicle kinematics and recovery pose.
12. **Long Haul Course:** course state, exploration and route queries.
13. **Long Haul Run:** telemetry, penalties, recovery, completion and failure.
14. **Long Haul Delivery:** candidate depots and delivery evaluation.
15. **Long Haul Wildlife:** deterministic hazard movement.
16. **Procedural generation:** route graph, depots, wildlife, par and validation.
17. **Course-cell generation:** terrain, roads, depots, signs, vegetation, grass and rocks.
18. **Patch preparation:** desired, prefetch, generation budget, activation budget and cache.
19. **World provider:** prepared cell admission, release and snapshots.
20. **Three.js presentation:** renderer, cells, instances, truck, wildlife, sky, camera and shadows.
21. **Canvas2D map:** explored roads, depots, rejections and truck marker.
22. **DOM UI:** routes, progress, HUD, pause, results, loss, toast and boot failure.
23. **WebAudio:** context unlock, engine/wind loops and cues.
24. **Browser storage:** settings and best score.
25. **Validation:** Node playability and static-shell smoke.
26. **CI/deployment:** main/pull-request smoke and static Pages delivery.
27. **Audit governance:** root `.agent` state and central ledger reconciliation.
28. **Planned focus lifecycle:** generation-bound retirement and neutral-frame evidence.

## All kits and offered services

### Engine-installed kits

| Kit | Domain/API | Offered services |
|---|---|---|
| Core Scene kit | `coreScene` | Scene registry, current scene, exit validation, transition request/identity, snapshot |
| Core World domain | `coreWorld` | World register/remove, uniform grid, focus, active cells, providers, validation, snapshot |
| Long Haul Core Input kit | `coreInput` | Actions, bindings, contexts, intent update/read, reset |
| Core Data kit | `coreData` | Course schema, envelopes, digest verification, named streams, RNG snapshot/restore |
| Core Simulation kit | `coreSimulation` | Fuel/truck/cargo/time meters, bounds, spend/restore, rates, locks, thresholds, reset |
| Core Camera kit | `coreCamera` | Target/snap, position/look/FOV smoothing, mode and portable descriptor |
| Core Graphics kit | `coreGraphics` | Batch registration, cell replace/remove, flush, bounds and release receipts |
| Core Transaction Ledger kit | `coreTransactionLedger` | Ledger ID, apply-once, duplicate classification, metadata and snapshots |
| `long-haul-truck-kit` | `longHaulTruck` | Truck state, road kinematics, input, grip, impulse, teleport, recovery pose, reset, snapshot/load |
| `long-haul-course-kit` | `longHaulCourse` | Course state, exploration, depot discovery, nearest road/depot, sample, reset, snapshot/load |
| `long-haul-run-kit` | `longHaulRun` | Run clock, distance, speed, off-road time, penalties, collisions, stuck state, recovery, terminal results, snapshot/load |
| `long-haul-delivery-kit` | `longHaulDelivery` | Candidate/valid depot, checks, duplicates, accepted/rejected result, delivered state, reset, snapshot/load |
| `long-haul-wildlife-kit` | `longHaulWildlife` | Hazard load, deterministic crossing motion, direction, damage/radius, reset, snapshot/load |

### Provider and controller

| Surface | Offered services |
|---|---|
| `long-haul-course-provider` | Prepared cell admission, update, release, effect descriptor, patch snapshot/restore/reset |
| Patch-preparation controller | Focus, desired set, forward prefetch, generation/activation budgets, cache, prime, ready lookup, release, snapshot/reset |

### Browser/product adapters

| Adapter | Offered services |
|---|---|
| Ordered module bootstrap | Import dependencies, expose shared host symbols, load 11 chunks in order, report failure |
| Course generator | Seeded five-branch graph, depots, signs, wildlife, valid depot, par, validation |
| Cell descriptor generator | Terrain heights/colors, road ribbons, depots, signs, trees, grass, rocks and obstacles |
| Keyboard adapter | Keydown, keyup, held store, one-shot store, ordinary frame clear |
| Three.js adapter | Renderer, scene, camera, GPU resources, cells, batches, rigs, resize, RAF, render and ordinary disposal |
| DOM adapter | Title, help, settings, generation, HUD, pause, results, loss, toast and boot failure |
| Canvas map adapter | DPR backing store, explored roads, depots, rejected yards and truck marker |
| WebAudio adapter | User-gesture unlock, engine loop, wind loop, impact/delivery/UI cues and gain updates |
| Storage adapter | Settings persistence and best adjusted score |

### Proof and release surfaces

| Surface | Offered services |
|---|---|
| `long-haul-game-smoke` | 100 seeded courses, cloneable cells, truck acceleration and delivery checks |
| `static-shell-smoke` | Provider pin, single tick, no tick-zero, source pattern, chunk and syntax checks |
| Smoke workflow and Pages | `npm test` on main/PR and static root publication |

## Source-backed focus lifecycle finding

```txt
const keys = Object.create(null)
const pressed = new Set()

keydown
  -> keys[code] = true
  -> pressed.add(code) for non-repeat

keyup
  -> keys[code] = false

frame success
  -> pressed.clear()

focus/visibility/page/route/run retirement
  -> no clear
  -> no generation change
  -> no neutral Core Input settlement
  -> no neutral Truck Input settlement
```

`preTickDriving()` reads `keys` every driving frame. A lost keyup can preserve throttle, brake, steer, or boost through focus restoration. A stale `pressed` entry can preserve camera, map, pause, retry, or interaction intent until a later frame consumes it.

The resulting risk path is:

```txt
keydown while driving
  -> accepted held state
  -> focus leaves before keyup
  -> browser omits keyup
  -> page becomes active again
  -> same mutable state remains true
  -> Core Input and Truck Input receive stale intent
  -> simulation and visible truck motion continue
```

No actual runaway-driving incident was reproduced. This audit records missing ownership and proof.

## Required authority

`the-long-haul-browser-focus-held-input-release-authority-domain`

```txt
InputFocusLifecycleCommand
  -> bind document, route, input-adapter, run and simulation generations
  -> classify active, blurred, hidden, page-hidden,
     frozen, route-retired, run-retired, replaced or restored
  -> retire held and one-shot evidence exactly once
  -> submit neutral Core Input intent
  -> submit neutral Truck Input request
  -> publish HeldInputRetirementResult
  -> reject stale DOM evidence from retired generations
  -> optionally request a safe pause through Core Scene/Run
  -> render one matching neutral-motion frame
  -> publish FirstNeutralInputFrameAck
```

## Planned authority surfaces

```txt
input-focus-generation-kit
document-focus-observer-kit
visibility-lifecycle-observer-kit
pagehide-bfcache-observer-kit
freeze-resume-observer-kit
route-input-retirement-kit
run-input-retirement-kit
held-action-clear-kit
one-shot-action-clear-kit
neutral-core-input-settlement-kit
neutral-truck-input-settlement-kit
stale-key-evidence-rejection-kit
held-input-retirement-result-kit
focus-loss-pause-policy-kit
first-neutral-input-frame-ack-kit
browser-input-lifecycle-fixture-kit
```

## Validation boundary

Documentation changed only. Runtime, input behavior, simulation, gameplay, HTML, CSS, rendering, audio, storage, tests, workflows and deployment were not modified or executed. No focus-safe input, lost-keyup recovery, neutral-state convergence, first-neutral-frame proof, artifact parity, Pages parity or production readiness is claimed.