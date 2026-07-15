# Current audit: generation work scheduling and ready adoption

**Timestamp:** `2026-07-15T04-40-29-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `fdfb89f3c6339f408d5861899d4ec201bf4e8c75`  
**Status:** `generation-work-budget-readiness-authority-audited`

## Summary

The repository contains a complete single-file Nexus Engine browser freight game with deterministic generation, driving, depot discovery, condition pressure, scoring, retry, WebGL, Canvas2D, DOM UI, audio, persistence and Pages deployment.

The current audit isolates how the browser host schedules generation work and decides that a course is playable.

## Source-backed inventory

```txt
runtime entry point: index.html
Nexus Engine revision: c5548de504072bf09eb68986b98aca0292903803
Three.js version: 0.165.0
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
render surfaces: 3
Pages workflow: present
package manifest: absent
test suite: absent
build command: absent
```

## Interaction loop

```txt
Start or Retry
  -> clearWorld
  -> reset Delivery, Simulation, Input, Route, Resource, Vehicle, Hazard and Telemetry
  -> transition to generating
  -> build 31 generation units

RAF while generating
  -> stepGeneration once
  -> execute one unit closure
  -> record one completed step in Long Haul Delivery
  -> tick engine
  -> update unit-count progress
  -> render partial state

queue exhausted
  -> wait for generation.ready
  -> start Core Simulation
  -> transition through ready exit
  -> render driving state
```

## Domains in use

```txt
browser lifecycle, DOM events, resize, blur, RAF and wall-clock delta
provider resolution
Core Scene
Core World
Core Input
Long Haul Delivery
Core Simulation
Vehicle Dynamics
Route Field
Resource Pressure
Hazard Field
Telemetry
seeded course graph and depot generation
generation queue construction and execution
route and world validation
streamed terrain and course providers
truck, wildlife, dust and exploration
settings, motion, pause, retry, terminal result and persistence
Three.js WebGL presentation
DOM UI and HUD
Canvas2D map
WebAudio
GitHub Pages deployment
audit governance
```

## Kits and services

```txt
Core Scene: registry, current scene, transitions, exit validation, snapshots
Core World: registry, partition, focus, active cells, provider ordering, validation
Core Input: actions, bindings, contexts, driving intent, reset
Long Haul Delivery: seed, generation plan/progress, depots, checks, retry, result, snapshot, reset
Core Simulation: reset, start, pause, resume, timer, distance, penalties, recovery, failure, completion
Vehicle Dynamics: truck state, input, kinematics, boost, bounds, impacts, reset
Route Field: markers, corridors, nearest marker, state, reset
Resource Pressure: fuel, truck, cargo, bounded adjustments, state, reset
Hazard Field: hazard state, motion, bounds, collisions, events, reset
Telemetry: truck, run, condition and delivery histories
terrain provider: prepare, update, release, descriptor, snapshots, reset
course provider: roads, depots, signs, vegetation, obstacles, prepare, update, release, snapshots, reset
procedural generator: seed/RNG, graph, fork, depots, par, validation, 31-unit plan
Three.js adapter: scene, renderer, camera, atmosphere, rigs, streamed meshes, resize, RAF
DOM adapter: title, help, settings, loading, HUD, pause, results, loss, toast, failure
Canvas adapter: explored route, depots, rejections, truck and resize
WebAudio adapter: engine, wind and event cues
storage adapter: settings, motion and best score
Pages adapter: main-triggered static deployment
```

## Main finding

`makeGenerationPlan()` creates 31 stable unit IDs. The animation loop calls `stepGeneration()` once per callback while the scene is `generating`. `stepGeneration()` runs one unit and increments the cursor. Delivery progress is `completedStepIds.length / plan.length`.

The units have unequal cost. Terrain generation, atmosphere/Core World registration, hazard adoption, rig creation and validation are counted the same as lightweight state steps. The host has no millisecond budget, weighted progress, per-unit elapsed receipt, yield contract, cancellation token, visibility result, partial-attempt retirement result or first playable-frame acknowledgement.

This is a source-level scheduling and evidence gap. It is not a measured performance defect.

## Required authority

```txt
the-long-haul-generation-work-budget-readiness-authority-domain
```

```txt
GenerationAttemptCommand
  -> bind seed, plan and provider revisions
  -> allocate attempt and queue revisions

GenerationHostFrameCommand
  -> admit zero or more ready units under a frame budget
  -> publish unit cost/results and weighted progress
  -> suspend, resume, defer or cancel explicitly

GenerationReadyCommand
  -> require route, world, depot, hazard and truck receipts
  -> atomically adopt the candidate
  -> start Simulation once
  -> publish GenerationReadyResult
  -> acknowledge FirstPlayableGenerationFrameAck

GenerationFailureCommand
  -> retire partial world and presentation resources
  -> reject late attempt work
  -> publish rollback receipts
```

## Audit boundary

Documentation only. Runtime source, generation behavior, gameplay, rendering, storage, imports, workflow and deployment were not changed or executed.