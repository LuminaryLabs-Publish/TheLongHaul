# Project breakdown: Core capability adoption parity

**Timestamp:** `2026-07-16T07-39-04-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed pre-audit head:** `5367c558a8e77164631c62747f9e7bd1e0aa9ca5`  
**Status:** `core-capability-adoption-parity-authority-audited`

## Summary

Three new commits added `src/long-haul-core.mjs`, `core-integration.html`, and README ownership claims. They introduce a second, isolated Nexus Engine composition for Core Data, Core Simulation resource meters, Core Camera smoothing, Core Graphics instance batches, Core Transaction Ledger, and Core World patch preparation.

The playable `index.html` does not import that profile. It remains pinned to an older Nexus Engine revision and retains parallel inline authorities for RNG, run meters, camera smoothing, Three.js instances, patch streaming, and operation deduplication. The smoke page proves the promoted capabilities in isolation, not their adoption by the playable game.

## Plan ledger

**Goal:** establish one release-bound Core capability profile that is authoritative in the playable game, the browser smoke, generated course packages, state snapshots, and the first matching rendered frame.

- [x] Enumerate all 11 accessible `LuminaryLabs-Publish` repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Compare ten eligible central ledgers and root `.agent` states.
- [x] Compare every eligible documented head with `main`.
- [x] Identify TheLongHaul as the only runtime-ahead repository: three commits and three files.
- [x] Select only TheLongHaul by priority, before the oldest documented fallback.
- [x] Inspect the playable host, new Core profile, browser smoke, README, current ledger, and retained audit state.
- [x] Identify the interaction loop, domains, kits, adapters, and offered services.
- [x] Preserve the existing runtime and deployment unchanged.
- [x] Define one Core capability adoption/parity authority and 20 coordinating surfaces.
- [ ] Integrate one accepted Core profile into the playable host.
- [ ] Execute playable/smoke parity, migration, replay, artifact, and Pages fixtures.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 1

runtime-ahead selected:
  LuminaryLabs-Publish/TheLongHaul
  documented head: 609e8cc9cd933cd1678c22b913eb8cfe450b616b
  current pre-audit head: 5367c558a8e77164631c62747f9e7bd1e0aa9ca5
  ahead by: 3 commits
  changed files:
    README.md
    core-integration.html
    src/long-haul-core.mjs

oldest fallback not used:
  LuminaryLabs-Publish/TheOpenAbove
  central timestamp: 2026-07-16T03-03-22-04-00
```

## Complete interaction loop

### Playable game

```txt
index.html
  -> import Three.js 0.165.0
  -> import Nexus Engine c5548de504072bf09eb68986b98aca0292903803
  -> install ten playable engine kits and two Core World providers
  -> create inline deterministic course generator and custom RNG
  -> create Three.js renderer, camera, direct instances, streamed cells, HUD, map, audio
  -> generate course and start driving
  -> keyboard evidence updates host state and engine intent
  -> custom run simulation, Resource Pressure, vehicle, hazards, delivery, telemetry tick
  -> direct camera smoothing and direct Three.js instance updates
  -> render WebGL, Canvas2D map, and DOM HUD
  -> retry, fail, or settle delivery and score
```

### New Core smoke

```txt
core-integration.html
  -> import Nexus Engine b941c9b2995e3449c6987908657753e2cf2df242
  -> import src/long-haul-core.mjs
  -> create a separate engine with five Core kits
  -> verify named RNG replay
  -> verify course package digest
  -> verify resource-meter clamp/tick
  -> verify portable camera descriptor
  -> verify instance-batch release
  -> verify patch prefetch separation
  -> verify transaction apply-once
  -> project DOM pass/fail rows
```

### Missing convergence

```txt
smoke capability result
  -> no CoreCapabilityAdoptionManifest
  -> no accepted provider revision shared with index.html
  -> no state migration into the playable engine
  -> no replacement of parallel inline authorities
  -> no playable-frame acknowledgement
```

## Domains in use

```txt
browser lifecycle, keyboard, blur, resize, RAF, DOM smoke reporting
provider resolution and two pinned Nexus Engine revisions
Core Scene and Core World playable composition
Core Input and custom Long Haul Delivery
custom Core Simulation run state
Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field, Telemetry
Core Data schemas, packages, digests, named random streams, snapshots
Core Simulation resource meters and thresholds
Core Camera smoothing descriptors
Core Graphics instance-batch descriptors and cell release
Core Transaction Ledger apply-once semantics
Core World patch preparation, prefetch, cache, budgets, readiness
procedural course generation, validation, scoring, streaming
Three.js WebGL, Canvas2D map, DOM UI/HUD, WebAudio, browser storage
Core capability manifest, adoption classification, dual-owner rejection,
state migration, smoke/playable parity, release parity, playable-frame convergence
GitHub Pages deployment and audit governance
```

## Complete kit and service inventory

### Playable engine kits: 10

```txt
core-scene-kit
  scene registry, current scene, exit validation, transition requests, snapshots

core-world-domain
  world registration, grid partition, focus, active-cell lifecycle,
  provider ordering, validation, snapshots

long-haul-core-input-kit
  action manifest, keyboard bindings, contexts, intent snapshots, reset

long-haul-delivery-domain-kit
  seed, generation progress, candidates, destination choice, depot checks,
  retry, run result, snapshots, load, reset

long-haul-core-simulation-kit
  run reset/start/pause/resume, timer, distance, penalty ledger,
  collisions, recovery, failure, completion

vehicle-dynamics-kit
  truck state, input, kinematics, boost, bounds, impact events, reset

long-haul-route
  markers, corridors, nearest marker, route state, reset

long-haul-condition
  fuel, truck, cargo, bounded adjustment, state, reset

long-haul-wildlife
  hazards, motion, bounds, collision queries/events, reset

long-haul-telemetry
  truck, run, condition, and delivery history snapshots
```

### Core World providers: 2

```txt
long-haul-terrain-provider
  prepare, update, release, terrain descriptors, active-cell snapshots, reset

long-haul-course-provider
  prepare, update, release, roads, depots, signs, vegetation, obstacles,
  effect descriptors, active-cell snapshots, reset
```

### Browser/product adapters: 7

```txt
procedural-course-generator
  seed hashing, inline RNG, five-branch graph, depots, par, validation,
  staged generation plan

browser-keyboard-input-adapter
  keydown/up, held state, one-shot route/presentation commands, blur clearing

three-webgl-presentation-adapter
  renderer, scene, camera, direct smoothing, atmosphere, direct instances,
  streamed meshes, rigs, shadows, resize, RAF, render, ordinary disposal

DOM-scene-HUD-adapter
  title, help, settings, generation, HUD, pause, results, loss, toast, failure

canvas-map-adapter
  explored roads, depots, rejected yards, truck marker, resize

web-audio-adapter
  context unlock, buses, loops, cues, frame gain updates

browser-storage-adapter
  settings, motion preference, best score
```

### Newly added isolated Core profile kits: 5

```txt
Core Data kit
  course schema registration, envelope creation, canonical digest verification,
  deterministic named streams, random snapshots and restore

Core Simulation resource-meter kit
  fuel, truck-condition, cargo-condition, remaining-time meters,
  bounds, rates, lock state, thresholds, snapshots

Core Camera kit
  player-camera target, position/look/FOV/mode smoothing,
  maximum delta, teleport threshold, portable descriptors

Core Graphics kit
  tree, grass, sign, and depot-prop instance-batch descriptors,
  capacity, cell replace/remove, flush, release receipts

Core Transaction Ledger kit
  run ledger identity, operation apply-once, duplicate classification,
  metadata and snapshots
```

### Newly added controller and proof surface: 2

```txt
Long Haul Core World patch-preparation controller
  focus, desired patches, active/prefetch separation, generation and activation
  budgets, cache/retention, ready queue, generator/settings identity

browser Core integration smoke adapter
  separate engine bootstrap, seven synchronous checks, DOM pass/fail projection,
  link back to playable game
```

### Deployment adapter: 1

```txt
github-pages-workflow
  main trigger, Pages configuration, root artifact upload, deployment
```

```txt
playable engine kits: 10
Core World providers: 2
browser/product adapters: 7
isolated Core profile kits: 5
standalone Core controller: 1
browser proof adapters: 1
deployment adapters: 1
total source-backed surfaces: 27
product render surfaces: 3
proof surfaces: 1
planned adoption surfaces: 20
```

## Main finding

```txt
new Core profile exists: yes
browser Core smoke exists: yes
playable host imports Core profile: no
shared Nexus Engine revision: no
shared Core kit set: no
shared random-stream owner: no
shared course-package admission: no
shared resource-meter owner: no
shared camera-smoothing owner: no
shared instance-batch owner: no
shared patch-preparation owner: no
shared transaction-ledger owner: no
state migration contract: no
smoke/playable semantic parity result: no
FirstCoreBoundPlayableFrameAck: no
```

Concrete divergence already exists:

```txt
playable Nexus Engine: c5548de504072bf09eb68986b98aca0292903803
smoke Nexus Engine:    b941c9b2995e3449c6987908657753e2cf2df242

playable run limit: 360 seconds
Core profile default/smoke limit: 300 seconds

playable condition IDs: fuel, truck, cargo
Core meter IDs: fuel, truck-condition, cargo-condition, remaining-time

playable RNG: one inline closure per generated course path
Core RNG: named streams with snapshot/restore

playable camera/instances/patches/idempotency: host-owned parallel paths
Core equivalents: smoke-only descriptors and services
```

The smoke page is useful proof that promoted Nexus Engine capabilities exist. It is not evidence that the playable game uses them, that state can migrate safely, or that source, artifact, and deployed Pages share one accepted Core profile.

## Required authority

`the-long-haul-core-capability-adoption-parity-authority-domain`

```txt
CoreCapabilityAdmissionCommand
  -> bind playable-host, smoke-host, Nexus Engine, Core-profile,
     course-schema, random-stream, meter-schema, camera,
     instance-batch, patch-controller, transaction-ledger,
     artifact, deployment, and frame revisions
  -> resolve one immutable CoreCapabilityAdoptionManifest
  -> classify every capability as authoritative, bridge, proof-only, or retired
  -> reject duplicate truth owners and incompatible semantic identifiers
  -> select one Nexus Engine provider revision
  -> stage course, RNG, meter, camera, instance, patch, and ledger migration
  -> initialize the playable engine from the accepted profile
  -> execute the same contract checks in smoke and playable contexts
  -> publish CoreCapabilityAdoptionResult
  -> render one matching gameplay frame
  -> publish FirstCoreBoundPlayableFrameAck
```

## Planned authority surfaces

```txt
core-capability-manifest-kit
provider-revision-convergence-kit
core-profile-bootstrap-kit
capability-adoption-classification-kit
course-schema-admission-kit
named-random-stream-adoption-kit
random-stream-snapshot-replay-kit
simulation-meter-schema-adoption-kit
resource-meter-state-migration-kit
camera-smoothing-adoption-kit
camera-descriptor-three-bridge-kit
instance-batch-descriptor-adoption-kit
instance-batch-three-bridge-kit
world-patch-preparation-adoption-kit
core-world-provider-patch-bridge-kit
transaction-ledger-adoption-kit
duplicate-truth-owner-rejection-kit
smoke-playable-parity-result-kit
core-adoption-result-kit
first-core-bound-playable-frame-ack-kit
```

## Validation boundary

Documentation only. The playable runtime, Core smoke, imports, schemas, gameplay values, rendering, tests, workflows, and deployment were not changed or executed. No Core adoption, migration, smoke/playable parity, artifact parity, Pages parity, or production-readiness claim is made.