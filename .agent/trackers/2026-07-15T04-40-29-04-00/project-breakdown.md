# Project breakdown: generation work scheduling and readiness

**Timestamp:** `2026-07-15T04-40-29-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `fdfb89f3c6339f408d5861899d4ec201bf4e8c75`  
**Status:** `generation-work-budget-readiness-authority-audited`

## Summary

TheLongHaul is a deterministic browser freight game built from ten Nexus Engine kits, two Core World effect providers, procedural course generation, Three.js, Canvas2D, DOM UI, WebAudio, localStorage, and GitHub Pages.

The current generation host admits exactly one generation unit per `requestAnimationFrame` callback. The 31-unit plan includes cheap bookkeeping beside terrain creation, Core World registration, provider activation, wildlife setup, truck setup, route validation, and world validation. Progress is unit-count based, not workload- or time-budget based.

## Plan ledger

**Goal:** separate course-generation work from display callback frequency, bound main-thread work per host frame, publish truthful progress, and adopt the ready course only after one complete generation result and visible-frame acknowledgement.

- [x] Enumerate all 11 accessible `LuminaryLabs-Publish` repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Compare ten eligible repositories with ten central-ledger entries.
- [x] Confirm every eligible current head matches its recorded repo-local documentation head.
- [x] Confirm root `.agent` state for the selected repository.
- [x] Select only `LuminaryLabs-Publish/TheLongHaul` using the oldest synchronized central timestamp.
- [x] Trace start, reset, generation queue, progress, readiness, rendering, failure, and retry.
- [x] Identify the full interaction loop, domains, kits, providers, adapters, and services.
- [x] Preserve all 19 source-backed surfaces.
- [x] Define one generation-work scheduling and readiness authority family.
- [x] Add a new timestamped tracker and focused system audits.
- [ ] Implement runtime scheduling, cancellation, rollback, and browser proof fixtures.

## Selection comparison

```txt
accessible Publish repositories: 11
excluded repositories: 1
eligible repositories: 10
central ledger entries: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 0
selected: LuminaryLabs-Publish/TheLongHaul
selection rule: oldest synchronized central timestamp
selected prior timestamp: 2026-07-15T00-38-54-04-00
```

## Complete interaction loop

```txt
title
  -> Start
  -> clear the prior world and presentation objects
  -> reset Delivery, Simulation, Input, Route, Resource, Vehicle, Hazard, and Telemetry state
  -> enter generating
  -> create a 31-unit generation plan

for each browser animation callback while generating
  -> call stepGeneration once
  -> execute exactly one generation unit
  -> mutate private and engine-owned generation participants
  -> record one completed step
  -> derive progress from completed-unit count / total-unit count
  -> render the partially prepared world

final units
  -> validate route
  -> validate Core World active state
  -> mark generation ready
  -> on a later callback start the run
  -> transition through the ready exit into driving
  -> present the first playable frame

failure
  -> retain the partially prepared attempt
  -> set generation.error
  -> show the boot-failure overlay
  -> publish no typed rollback or readiness result
```

## Domains in use

```txt
browser lifecycle, DOM events, resize, focus/blur, RAF and wall-clock sampling
provider resolution and pinned imports
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
seed hashing, deterministic random generation, route graph, five branches, depots and signs
generation queue, progress projection, route validation and world validation
uniform-grid world partition, terrain cells and course-content cells
truck, wildlife, dust, streamed obstacles and exploration
settings, motion preference, pause, terminal result, retry and best-score storage
Three.js WebGL, Canvas2D map, DOM UI/HUD and WebAudio
GitHub Pages deployment, repo-local audit state and central ledger governance
```

## Complete kit, provider and adapter inventory

### Engine-installed kits: 10

```txt
core-scene-kit
  services: registry, current scene, transition requests, exit validation, snapshots

core-world-domain
  services: world registration/removal, uniform-grid partition, focus, active cells, provider ordering, validation

long-haul-core-input-kit
  services: action manifest, keyboard bindings, contexts, driving intent, reset

long-haul-delivery-domain-kit
  services: seed, generation progress, candidate depots, destination selection, checks, retry, result, snapshot, reset

long-haul-core-simulation-kit
  services: run reset/start/pause/resume, timer, distance, penalties, collisions, recovery, failure, completion

vehicle-dynamics-kit
  services: truck state, intent, kinematics, boost, bounds, impacts, reset

long-haul-route
  services: route markers, corridors, nearest marker, state, reset

long-haul-condition
  services: fuel, truck condition, cargo condition, bounded adjustments, state, reset

long-haul-wildlife
  services: hazards, motion, bounds, circle collision, collision events, reset

long-haul-telemetry
  services: truck, run, condition and delivery histories, reset
```

### Core World providers: 2

```txt
long-haul-terrain-provider
  services: prepare, update, release, terrain descriptors, active-cell snapshots, reset

long-haul-course-provider
  services: prepare, update, release, roads, depots, signs, vegetation, obstacles, descriptors, snapshots, reset
```

### Browser and product adapters: 6

```txt
procedural-course-generator
  services: seed hashing, deterministic RNG, five-branch graph, confusing fork, depots, par calculation, validation, generation plan

three-webgl-presentation-adapter
  services: renderer, scene, camera, lighting, atmosphere, streamed meshes, truck, wildlife, dust, shadows, resize, RAF

dom-scene-hud-adapter
  services: title, help, settings, generation progress, HUD, pause, results, loss, toast, failure overlay

canvas-map-adapter
  services: explored roads, depots, rejected yards, truck projection, map resizing

web-audio-adapter
  services: engine loop, wind loop, click, wrong-yard, impact and delivery cues

browser-storage-adapter
  services: settings document, motion preference and best-score document
```

### Deployment adapter: 1

```txt
github-pages-workflow
  services: main push trigger, Pages configuration, root artifact upload and deployment
```

```txt
total source-backed surfaces: 19
render surfaces: 3
executable validation commands: 0
```

## Source-backed finding

`makeGenerationPlan()` creates 31 stable unit IDs. `frame()` invokes `stepGeneration()` once when the current scene is `generating`. `stepGeneration()` executes one unit and advances the cursor. Progress is the number of completed IDs divided by the number of plan entries.

The units have materially different costs. Some only initialize data. Others build terrain buffers, register and update Core World, configure hazards, create presentation rigs, validate the route, or validate the active streamed world. No scheduler owns a millisecond budget, queue result, long-task boundary, visibility policy, cancellation token, predecessor retirement, or first ready-frame acknowledgement.

This is a source-backed scheduling and evidence gap. It is not a measured performance claim.

## Required authority

```txt
the-long-haul-generation-work-budget-readiness-authority-domain
```

```txt
GenerationAttemptCommand
  -> allocate GenerationAttemptId and generation revision
  -> bind seed, plan, renderer, world and provider revisions
  -> prepare a typed work queue
  -> classify mandatory, optional and deferrable work

GenerationHostFrameCommand
  -> bind host-frame timestamp and budget policy
  -> execute zero or more work units within a bounded budget
  -> yield before monopolizing the browser frame
  -> publish unit results, elapsed cost and truthful weighted progress
  -> suspend, resume or cancel through explicit lifecycle results

GenerationReadyCommand
  -> require every mandatory unit receipt and validation result
  -> atomically adopt the generated course, world, truck and hazards
  -> retire the predecessor attempt
  -> start the run exactly once
  -> publish GenerationReadyResult
  -> acknowledge FirstPlayableGenerationFrameAck

GenerationFailureCommand
  -> classify failed, cancelled, superseded or disconnected attempts
  -> release partial world and presentation resources
  -> preserve or restore an accepted predecessor
  -> publish rollback and retirement receipts
```

## Planned authority surfaces: 18

```txt
generation-attempt-command-kit
generation-attempt-revision-kit
generation-work-queue-kit
generation-frame-budget-policy-kit
generation-unit-cost-classification-kit
generation-work-admission-kit
generation-unit-result-kit
generation-weighted-progress-kit
generation-cancellation-kit
generation-visibility-lifecycle-kit
generation-predecessor-retirement-kit
generation-ready-adoption-kit
generation-failure-rollback-kit
first-playable-generation-frame-kit
browser-cadence-matrix-fixture-kit
browser-long-task-observer-fixture-kit
source-pages-generation-parity-kit
generation-diagnostics-adapter-kit
```

## Validation boundary

Documentation only. Runtime JavaScript, generation behavior, gameplay, rendering, storage, imports, workflow and deployment are unchanged. No browser cadence, long-task, visibility, cancellation, rollback, first-playable-frame, artifact or Pages fixture was executed.