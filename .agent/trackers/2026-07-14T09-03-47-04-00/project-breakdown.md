# The Long Haul project breakdown

**Timestamp:** `2026-07-14T09-03-47-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit documentation head:** `263db0d039cdf38b8c892c04c7ba21ced5f95812`  
**Status:** `course-generation-admission-rollback-audited`

## Summary

`TheLongHaul` is no longer a documentation-only skeleton. It is now a complete static browser game in one `index.html`, composed with a pinned Nexus Engine revision and Three.js, plus a GitHub Pages deployment workflow.

The principal authority gap is procedural-course admission. Generation writes directly into live engine resources, live Core World state, DOM visibility, and Three.js resources before the route and world validation steps finish. A failed late validation displays a reload overlay but does not roll back the partial candidate, preserve the predecessor course, or publish a typed generation result.

## Plan ledger

**Goal:** reconcile the first executable implementation and define one atomic course-generation boundary that admits only a fully validated route, world, hazard, truck, and visible-frame generation.

- [x] Compare all 11 accessible Publish repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible repositories have central-ledger and root `.agent` coverage.
- [x] Identify two runtime-ahead repositories.
- [x] Select only `TheLongHaul` because the recently added repository changed from a zero-runtime skeleton to its first complete implementation.
- [x] Inspect the implementation commit, `index.html`, pinned imports, workflow, prior audit state, and central ledger.
- [x] Identify the complete player interaction loop.
- [x] Identify all active domains.
- [x] Inventory every engine kit, world provider, browser adapter, persistence surface, and deployment service.
- [x] Identify the live-mutation and rollback gap in procedural generation.
- [x] Add a timestamped tracker, turn ledger, architecture audit, render audit, gameplay audit, interaction audit, generation audit, deployment audit, and central-sync audit.
- [ ] Implement detached generation candidates and atomic adoption.
- [ ] Add deterministic source and browser fixtures.
- [ ] Prove source, deployed artifact, and first admitted course-frame parity.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing repositories: 0
root-agent-missing repositories: 0
runtime-ahead repositories observed: 2

TheLongHaul
  prior classification: documentation-only skeleton
  current change: first complete executable implementation
  selected: recently added implementation is undocumented

MyCozyIsland
  current change: postcard menu runtime updates
  deferred: one-project limit

TheCavalryOfRome
  excluded
```

## Source inventory

```txt
README.md
index.html
.github/workflows/deploy-pages.yml
.agent/**

runtime entry point: index.html
runtime language: inline JavaScript ES module
presentation: DOM + Canvas2D + Three.js WebGL
engine provider: NexusEngine pinned to c5548de504072bf09eb68986b98aca0292903803
Three.js provider: 0.165.0
deployment: GitHub Pages static root upload
package manifest: absent
build step: absent
test suite: absent
```

## Complete interaction loop

```txt
page load
  -> import pinned Three.js and Nexus Engine
  -> compose ten engine kits
  -> create WebGL renderer, scene, camera, shared materials, DOM controls, map, audio, and RAF
  -> transition boot -> title

Start the Haul
  -> create a random seed
  -> clear the predecessor world
  -> reset delivery, simulation, input, route, condition, vehicle, hazards, and telemetry
  -> transition title -> generating
  -> execute one generation unit per frame
  -> build trunk and five branches
  -> place five plausible depots and choose one valid destination
  -> prepare terrain and register streamed Core World providers
  -> add wildlife and truck
  -> validate route graph and live world state
  -> start the timed run
  -> transition generating -> driving

Driving
  -> read keyboard intent
  -> steer and submit vehicle input
  -> tick fuel, truck, cargo, hazards, timer, distance, and penalties
  -> stream nearby world cells
  -> discover roads and depots for the paper map
  -> render truck, wildlife, dust, terrain, HUD, and map

Depot check
  -> stop inside a depot gate
  -> press E
  -> duplicate check is inert
  -> wrong depot adds 20 seconds and remains in the run
  -> valid depot settles a scored run result

Failure
  -> time, cargo, truck, fuel, or unrecoverable stuck state fails the run
  -> transition driving -> loss

Completion
  -> freeze the truck
  -> transition driving -> results
  -> calculate golf-style score from time, distance, penalties, collisions, and cargo condition
  -> optionally store the best adjusted time

Next action
  -> retry the same seed
  -> generate a new seed
  -> return to title
```

## Domains in use

```txt
browser document and page lifecycle
static import-map provider resolution
Nexus Engine creation and ticking
Core Scene state and transitions
Core World registration, partitioning, provider ordering, focus, streaming, validation, and removal
input action, binding, context, and driving-intent state
long-haul delivery generation, candidate depots, destination selection, checks, retry, and result state
run simulation, timer, distance, penalties, impacts, recovery, completion, and failure
heavy-truck vehicle dynamics and boost
route markers, corridors, and nearest-marker queries
fuel, truck-condition, and cargo-condition pressure
wildlife hazard motion and collision
telemetry history
seeded route graph and course generation
terrain and course world-effect providers
Three.js WebGL rendering
terrain, road, depot, vegetation, truck, wildlife, dust, atmosphere, lighting, fog, and camera presentation
DOM menu, generation, HUD, pause, result, loss, toast, and failure presentation
Canvas2D exploration map
WebAudio engine, wind, and feedback cues
localStorage settings and best-score persistence
GitHub Pages static deployment
repo-local and central audit governance
```

## Engine-installed kits and offered services

| Kit | Domain | Offered services |
|---|---|---|
| `createCoreSceneKit` | scene | Scene registry, current-scene state, exit validation, revisioned transition requests, title/generating/driving/pause/result/loss/settings/help routing. |
| `createCoreWorldDomain` | world | World registration/removal, uniform-grid partitions, focus updates, active-cell lifecycle, ordered effect providers, world snapshots, and validation. |
| `long-haul-core-input-kit` | input | Keyboard action/binding manifest, driving/menu contexts, intent set/get/reset for throttle, brake, steer, boost, interaction, reverse, map, camera, pause, and recovery. |
| `long-haul-delivery-domain-kit` | delivery | Seed state, generation plan/progress, depot candidate registration, valid destination selection, checked-depot ledger, duplicate handling, retry state, run result, snapshot/load/reset. |
| `long-haul-core-simulation-kit` | simulation | Run reset/start/pause/resume, timer, distance sampling, idempotent penalty ledger, collision count, recovery, failure, completion, and run readback. |
| `createVehicleDynamicsKit` | vehicle | Heavy-truck kinematics, acceleration, drag, speed, heading, boost, bounds, impact events, input, reset, and state readback. |
| `createRouteFieldKit` | route | Route markers and corridors, nearest-marker queries, route state, reset, and depot metadata. |
| `createResourcePressureKit` | condition | Fuel, truck, and cargo bounded resources, adjustments, state readback, and reset. |
| `createHazardFieldKit` | hazards | Wildlife state, movement, bounds, circle collision checks, collision events, state readback, and reset. |
| `createTelemetryKit` | telemetry | Ninety-sample history over truck, run, condition, and delivery resources plus reset/readback. |

## World providers and offered services

| Provider | Phase | Offered services |
|---|---|---|
| `long-haul-terrain-provider` | foundation | Prepare/update/release terrain cells, terrain effect descriptors, active-cell snapshots, and terrain reset. |
| `long-haul-course-provider` | population | Prepare/update/release roads, depots, signs, trees, grass, rocks, and obstacle cells; course effect descriptors; active-cell snapshots; course reset. |

## Browser, product, and platform adapters

| Surface | Offered services |
|---|---|
| Procedural course generator | Seed hashing, deterministic RNG, trunk and five-branch graph construction, confusing fork, depot placement, par calculation, route validation, generation plan, and generation stepping. |
| Three.js presentation adapter | WebGL renderer, scene, camera, lighting, atmosphere, fog, cell meshes, instancing, truck rig, wildlife rig, dust, shadows, resizing, and RAF submission. |
| DOM scene and HUD adapter | Title, help, settings, progress, driving HUD, pause, result, loss, toast, boot-failure, buttons, and accessibility labels. |
| Canvas2D map adapter | Explored-road and depot projection, rejected-yard marks, dispatch marker, truck marker, map sizing, and visibility. |
| WebAudio adapter | Engine oscillator, wind bed, click, wrong-yard, hit, delivery, and settings-controlled gain. |
| Browser storage adapter | Settings document and best adjusted-time record through localStorage. |
| GitHub Pages workflow | Main-branch deployment, Pages configuration, root static artifact upload, and deployment. |

## Surface census

```txt
engine-installed DSKs and kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
render surfaces: 3
  WebGL game canvas
  Canvas2D paper map
  DOM overlay and menus
executable repository validation commands: 0
```

## Main finding

Generation is not a detached candidate transaction.

```txt
startGeneration
  -> clears the accepted predecessor world immediately
  -> resets all engine participants immediately
  -> begins mutating live route and delivery state
  -> writes live terrain and course resources
  -> registers Core World and reveals the WebGL world before final validation
  -> creates hazards and truck
  -> validates route and world near the end
```

The world becomes visible during the ninth terrain unit. Route validation, live-world validation, destination confirmation, wildlife completion, and truck preparation occur later. If any later unit throws, the code stores `generation.error`, logs the exception, and displays a reload-only overlay. It does not retire the partial world, restore the predecessor run, reset all touched engine participants, dispose every candidate resource, or publish a typed failure result.

## Required authority

```txt
the-long-haul-course-generation-admission-rollback-authority-domain
```

```txt
CourseGenerationCommand
  -> bind generation attempt, seed, provider, and predecessor revisions
  -> create detached delivery, route, terrain, content, hazard, truck, and score candidates
  -> execute the generation-plan manifest
  -> collect one receipt per generation unit
  -> validate route topology, five branches, five depots, destination identity,
     world provider graph, active cells, hazards, truck spawn, and disposal manifest
  -> execute an offscreen probe frame
  -> reject stale, duplicate, failed, or superseded attempts
  -> atomically adopt all candidates
  -> retire the predecessor generation only after adoption
  -> publish CourseGenerationResult
  -> publish FirstAdmittedCourseFrameAck

failure
  -> dispose every candidate resource
  -> preserve or restore the predecessor generation
  -> publish a typed recoverable failure
  -> expose same-seed retry, new-seed retry, and title controls
```

## Planned coordinating surfaces

```txt
the-long-haul-course-generation-admission-rollback-authority-domain
course-generation-command-kit
generation-attempt-identity-kit
seed-revision-kit
generation-plan-manifest-kit
generation-unit-receipt-kit
course-graph-candidate-kit
route-field-candidate-kit
destination-candidate-kit
terrain-cell-candidate-kit
world-provider-candidate-kit
hazard-candidate-kit
truck-candidate-kit
course-validation-receipt-kit
generation-resource-manifest-kit
generation-rollback-kit
predecessor-generation-preservation-kit
offscreen-course-probe-kit
course-generation-result-kit
first-admitted-course-frame-kit
generation-fault-injection-kit
source-pages-course-parity-kit
```

These surfaces are planned and are not included in the implemented census.

## Validation boundary

```txt
source inspection: completed
implementation commit inspected: yes
combined commit status records: none
package manifest: absent
automated syntax command: absent
unit tests: absent
headless course tests: absent
browser tests: absent
build command: absent
Pages workflow: present
live Pages smoke: not run
runtime source changed by this audit: no
```

This audit records source-backed architecture and the current admission gap. It does not claim atomic generation, rollback, fault recovery, first-frame convergence, deployed parity, or production readiness is implemented.
