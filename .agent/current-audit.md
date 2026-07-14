# Current audit: pause scheduler, input and world suspension

**Timestamp:** `2026-07-14T19-39-36-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `9e76011ec6ab4acc665f99c08067e3a758833865`  
**Status:** `pause-scheduler-input-world-suspension-authority-audited`

## Summary

The repository contains a complete single-file Nexus Engine browser freight game with procedural generation, driving, depot discovery, condition pressure, scoring, retry, WebGL, Canvas2D, DOM UI, audio, persistence and Pages deployment.

The current audit isolates pause and resume ownership.

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
boot -> title -> generated course -> driving
  -> Escape calls pauseGame
  -> Core Simulation pauseRun
  -> vehicle velocity and last input are zeroed
  -> map closes and Core Scene enters paused
  -> RAF continues
  -> non-driving input writes zero intent
  -> engine.tick(dt) still executes
  -> truck, camera, wildlife, dust and renderer update calls continue
  -> Escape or button resumes Core Simulation
  -> browser key map was not cleared by pause
  -> next driving frame can immediately consume a held key
```

## Domains in use

```txt
browser lifecycle and keyboard state
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
procedural generation
world streaming
pause scheduler and command admission
stale-input settlement
WebGL presentation
DOM UI and HUD
Canvas2D map
WebAudio
localStorage
Pages deployment
audit governance
```

## Kits and services

```txt
Core Scene: registry, current scene, transitions, exit validation, snapshots
Core World: registry, partition, focus, active cells, provider ordering, validation
Core Input: actions, bindings, contexts, driving intent, reset
Long Haul Delivery: seed, generation, depots, checks, retry, result, snapshot, reset
Core Simulation: reset, start, pause, resume, timer, distance, penalties, recovery, failure, completion
Vehicle Dynamics: truck state, input, kinematics, boost, bounds, impacts, reset
Route Field: markers, corridors, nearest marker, state, reset
Resource Pressure: fuel, truck, cargo, adjustments, state, reset
Hazard Field: hazard state, motion, bounds, collision, events, reset
Telemetry: truck, run, condition and delivery histories
terrain provider: prepare, update, release, descriptor, snapshot, reset
course provider: roads, depots, signs, vegetation, obstacles, prepare, update, release, snapshot, reset
adapters: course generation, Three.js, DOM/HUD, Canvas map, WebAudio, storage, Pages
```

## Main finding

`pauseGame()` pauses the Core Simulation run, zeroes the vehicle and transitions to the pause scene. It does not clear the browser `keys` map, publish a pause generation, or gate the engine scheduler.

The recursive frame loop continues for all scenes. It calls `processIdleBeforeTick()`, `engine.tick(dt)`, truck/camera updates, wildlife updates, dust updates and `renderer.render()`. The source therefore proves only that the Core Simulation timer is paused. It does not prove that Hazard Field, Resource Pressure, Telemetry, world providers or other gameplay-mutating systems are suspended.

The keydown handler records `keys[event.code] = true` before scene-specific handling. Escape does not clear already-held throttle or steer keys. Resume can therefore admit pre-pause browser state on the first driving frame.

This is a source-level authority gap. It is not a claim that visible wildlife movement or stale-input acceleration was reproduced in a browser.

## Required authority

```txt
the-long-haul-pause-scheduler-input-world-suspension-authority-domain
```

```txt
PauseRunCommand
  -> bind RunId, PauseCommandId, scheduler and input revisions
  -> clear or journal held browser and Core Input state
  -> classify strict pause versus explicitly allowed presentation work
  -> gate Vehicle, Hazard, Pressure, Telemetry, Delivery and streaming mutation
  -> publish PauseRevision and participant receipts
  -> acknowledge FirstPausedFrameAck

ResumeRunCommand
  -> bind the accepted PauseRevision
  -> reject stale pre-pause input and work
  -> require fresh post-resume driving intent
  -> restore admitted scheduler participants atomically
  -> publish ResumeResult
  -> acknowledge FirstResumedFrameAck
```

## Audit boundary

Documentation only. Runtime source, gameplay, rendering, storage, imports, workflow and deployment behavior were not changed or executed.
