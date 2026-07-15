# Current audit: motion preference and presentation adoption

**Timestamp:** `2026-07-15T00-38-54-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `826395baa5b3aa82e48ab8037c277f3c5b2bc63c`  
**Status:** `motion-preference-camera-body-effect-admission-authority-audited`

## Summary

The repository contains a complete single-file Nexus Engine browser freight game with procedural generation, driving, depot discovery, condition pressure, scoring, retry, WebGL, Canvas2D, DOM UI, audio, persistence, and Pages deployment.

The current audit isolates the `Camera movement` preference and its adoption by visible camera and truck-body effects.

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
startup
  -> load the-long-haul-settings from localStorage
  -> normalize settings.motion
  -> project aria-pressed and switch class

title or paused
  -> enter settings scene
  -> toggle Camera movement
  -> invert settings.motion
  -> persist settings document
  -> return to title or paused

driving frame
  -> update simulation and vehicle truth
  -> updateTruckVisual
     rough-road oscillation obeys settings.motion
     steering roll, throttle/brake pitch, and cargo sway do not
  -> updateCamera
     rough-road bob obeys settings.motion
     speed FOV and interpolation do not
  -> render scene
```

## Domains in use

```txt
browser lifecycle, DOM events, localStorage, resize, RAF
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
procedural course generation
streamed world effects
settings document normalization and persistence
motion preference and effect policy
truck suspension, steering roll, pitch, and cargo sway
camera chase/cab placement, rough-road bob, dynamic FOV, interpolation
Three.js WebGL presentation
DOM UI and HUD
Canvas2D map
WebAudio
best-score persistence
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
Telemetry: truck, run, condition, and delivery histories
terrain provider: prepare, update, release, descriptor, snapshot, reset
course provider: roads, depots, signs, vegetation, obstacles, prepare, update, release, snapshot, reset
adapters: course generation, Three.js, DOM/HUD, Canvas map, WebAudio, storage, Pages
```

## Main finding

The UI describes `Camera movement` as `Road shake and body motion`. The persisted boolean currently gates only rough-road truck oscillation and rough-road camera bob.

The following presentation effects remain active when the boolean is false:

```txt
steering-driven truck roll
throttle/brake suspension pitch
cargo-crate sway
speed-driven FOV expansion
camera position and look interpolation
```

No authority defines whether those effects belong to Full, Reduced, or Static motion. The setting produces no typed adoption result, storage receipt, participant receipt, or first matching frame acknowledgement.

This is a source-level contract gap. It is not a claim that a browser defect or accessibility outcome was reproduced.

## Required authority

```txt
the-long-haul-motion-preference-camera-body-effect-admission-authority-domain
```

```txt
MotionPreferenceCommand
  -> bind settings, run, scene, and requested-profile revisions
  -> classify Full, Reduced, or Static policy
  -> prepare camera, truck, cargo, and storage participants
  -> atomically publish MotionPreferenceRevision
  -> publish MotionPreferenceResult and receipts

MotionFrameAdmissionCommand
  -> bind MotionPreferenceRevision, frame, vehicle, camera, and renderer revisions
  -> classify every effect
  -> execute the admitted policy
  -> publish MotionFrameResult
  -> acknowledge FirstMotionPreferenceFrameAck
```

## Audit boundary

Documentation only. Runtime source, gameplay, settings behavior, rendering, storage, imports, workflow, and deployment behavior were not changed or executed.