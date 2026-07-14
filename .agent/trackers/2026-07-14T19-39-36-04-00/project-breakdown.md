# Project breakdown: pause scheduler, input and world suspension

**Timestamp:** `2026-07-14T19-39-36-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `9e76011ec6ab4acc665f99c08067e3a758833865`  
**Status:** `pause-scheduler-input-world-suspension-authority-audited`

## Summary

TheLongHaul is a complete static browser freight game. Pause stops the Core Simulation run and vehicle velocity, but the page-level RAF, `engine.tick(dt)`, installed kits and presentation updates continue. Held browser keys are not settled when pause is accepted. The repository therefore lacks one authority for full gameplay suspension, stale-input rejection and paused/resumed frame proof.

## Plan ledger

**Goal:** document every active domain, kit and service, then define the minimum pause authority needed to suspend gameplay truth without restructuring the existing game.

- [x] Enumerate all 11 accessible Publish repositories.
- [x] Exclude `TheCavalryOfRome`.
- [x] Confirm ten eligible central ledgers and root `.agent` states.
- [x] Confirm no new, missing or runtime-ahead repository required priority selection.
- [x] Select only `TheLongHaul` by the oldest synchronized central timestamp.
- [x] Inspect pause, resume, RAF, engine tick, keyboard state, hazards and render updates.
- [x] Preserve the full 19-surface inventory.
- [x] Add the timestamped audit family and refresh root docs.
- [ ] Implement pause scheduler and input authority.
- [ ] Add executable pause-domain and browser fixtures.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible non-Cavalry repositories: 10
central ledger entries: 10
root .agent states: 10
new repositories: 0
ledger-missing repositories: 0
root-agent-missing repositories: 0
runtime-ahead repositories: 0
selected: TheLongHaul
selection rule: oldest synchronized central documentation timestamp
selected prior update: 2026-07-14T14-39-54-04-00
excluded: TheCavalryOfRome
```

## Complete interaction loop

```txt
boot
  -> load pinned Nexus Engine and Three.js
  -> install ten engine kits and two providers
  -> create WebGL, DOM, map, audio and storage adapters

start
  -> generate seeded trunk, five branches and five depots
  -> choose one valid destination
  -> stream terrain and route content
  -> configure truck, conditions and wildlife
  -> validate and enter driving

driving
  -> read keyboard state
  -> submit Core Input and Vehicle input
  -> tick engine kits
  -> update simulation, hazards, conditions, telemetry and delivery
  -> update streamed world and render surfaces

pause
  -> Escape records browser key state
  -> pause Core Simulation
  -> zero vehicle velocity and input
  -> close map and enter paused scene
  -> RAF continues
  -> idle input is submitted
  -> engine tick continues
  -> truck, camera, wildlife, dust and render updates continue

resume
  -> resume Core Simulation and enter driving
  -> preserved browser keys may be consumed immediately
  -> continue delivery, failure, results and retry
```

## Domains in use

```txt
browser document, keyboard, blur, resize and RAF lifecycle
provider resolution
Nexus Engine world, scheduler, clock, resources and events
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
procedural course generation
streamed terrain and course content
pause scheduler and command admission
stale-input settlement
terminal result settlement
score and persistence
Three.js WebGL
DOM UI and HUD
Canvas2D map
WebAudio
localStorage
Pages deployment
audit governance
```

## Implemented kits and services

1. `core-scene-kit`: scene registry, current scene, transitions, exit validation, snapshots.
2. `core-world-domain`: world registry, grid partition, focus, active cells, provider ordering, validation.
3. `long-haul-core-input-kit`: action manifest, bindings, contexts, driving intent, reset.
4. `long-haul-delivery-domain-kit`: seed, generation progress, candidate depots, destination, checks, retry, result, snapshot, reset.
5. `long-haul-core-simulation-kit`: reset, start, pause, resume, timer, distance, penalties, collisions, recovery, failure, completion.
6. `vehicle-dynamics-kit`: truck state, input, kinematics, boost, bounds, impacts, reset.
7. `long-haul-route`: markers, corridors, nearest marker, state, reset.
8. `long-haul-condition`: fuel, truck, cargo, adjustment, state, reset.
9. `long-haul-wildlife`: hazard state, motion, bounds, circle collision, events, reset.
10. `long-haul-telemetry`: truck, run, condition and delivery histories, reset.

## Providers and adapters

```txt
long-haul-terrain-provider
  prepare, update and release cells; terrain capability; descriptor; snapshot; reset

long-haul-course-provider
  prepare, update and release cells; roads; depots; signs; vegetation; obstacles; descriptor; snapshot; reset

procedural-course-generator
  seed hash; deterministic RNG; graph; fork; depots; par; validation; generation plan

three-webgl-presentation-adapter
  renderer; scene; camera; lights; atmosphere; streamed meshes; truck; wildlife; dust; shadows; RAF

dom-scene-hud-adapter
  title; help; settings; generation; HUD; pause; results; loss; toast; failure

canvas-map-adapter
  explored roads; depots; rejected yards; truck marker; resize

web-audio-adapter
  engine; wind; click; rejection; impact; delivery cues

browser-storage-adapter
  settings and best-score documents

github-pages-workflow
  main trigger; Pages configuration; root artifact upload; deployment
```

## Census

```txt
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
render surfaces: 3
executable validation commands: 0
```

## Main finding

The visible pause action is narrower than the page execution model. `pauseGame()` invokes `coreSimulation.pauseRun()`, zeros Vehicle Dynamics and changes Core Scene. The recursive frame still calls `engine.tick(dt)` without a scene-level scheduler gate. The host also invokes truck, camera, wildlife, dust and renderer update functions while paused.

The browser key map is independent of Core Input and is not cleared at pause. A key held before Escape can remain true until keyup and can be consumed on the first resumed driving frame.

The source does not establish whether every non-Core-Simulation kit mutates during pause, so the audit records an authority and proof gap rather than asserting reproduced paused-world drift.

## Required authority

```txt
the-long-haul-pause-scheduler-input-world-suspension-authority-domain
```

```txt
PauseRunCommand
  -> bind RunId, PauseCommandId, scheduler, input and scene revisions
  -> settle browser keys, Core Input, interaction intent and vehicle input
  -> classify strict suspension and allowed presentation work
  -> gate every gameplay-mutating participant
  -> publish PauseRevision and participant receipts
  -> acknowledge FirstPausedFrameAck

ResumeRunCommand
  -> bind accepted PauseRevision
  -> reject stale pre-pause commands and held input
  -> require fresh post-resume intent
  -> atomically restore admitted participants
  -> publish ResumeResult
  -> acknowledge FirstResumedFrameAck
```

## Validation boundary

Documentation only. Runtime source, input, gameplay, rendering, storage, tests, workflow and deployment were not changed or executed.
