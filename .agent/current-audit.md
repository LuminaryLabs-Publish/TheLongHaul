# Current audit: input action contract and Core Input convergence

**Timestamp:** `2026-07-15T19-38-38-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `cc4ec1d7ad16e6aa29e7719203d5411217142f25`  
**Status:** `input-action-contract-context-convergence-authority-audited`

## Summary

The repository contains a complete single-file Nexus Engine browser freight game with deterministic generation, streamed world content, driving, depot discovery, recovery, retry, scoring, WebGL, Canvas2D, DOM UI, WebAudio, persistence and Pages deployment.

This audit isolates the relationship between the declared Core Input contract and the executable browser keyboard path.

## Source-backed inventory

```txt
runtime entry point: index.html
Nexus Engine revision: c5548de504072bf09eb68986b98aca0292903803
Three.js version: 0.165.0
engine-installed kits: 10
Core World providers: 2
browser/product adapters: 7
deployment adapters: 1
source-backed surfaces: 20
render surfaces: 3
package manifest: absent
test suite: absent
build command: absent
```

## Complete interaction loop

```txt
boot
  -> install Core Input with action manifest, bindings and contexts
  -> install separate window keydown, keyup and blur listeners
  -> enter title

held driving
  -> browser keydown mutates keys[code]
  -> RAF derives throttle, brake, steer, boost and reverse
  -> host copies derived intent into Core Input
  -> host submits Vehicle Dynamics input directly
  -> engine tick settles gameplay
  -> presentation renders effects

one-shot actions
  -> Escape directly changes route or pause state
  -> C directly changes camera mode
  -> M directly changes map state
  -> E sets interactWanted
  -> R directly retries the seed
  -> no Core Input action result is published

recovery
  -> E is consumed contextually
  -> host checks stuck, fuel, road and bounds state
  -> recovery may execute
  -> declared KeyR recovery binding is unused
```

## Domains in use

```txt
browser document, keyboard, focus, blur, resize and RAF lifecycle
provider resolution and pinned module imports
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
browser event capture, action mapping, context admission and held-action lifecycle
seeded course generation, validation, scheduling and readiness
streamed terrain and course-content ownership
truck, wildlife, exploration, depot interaction, recovery, retry and scoring
settings, motion, pause, audio and storage
Three.js WebGL, Canvas2D map and DOM UI/HUD
input-effect visible-frame convergence
GitHub Pages deployment and audit governance
```

## Kits and services

```txt
Core Scene: registry, current scene, transitions, exit validation, snapshots
Core World: registry, partition, focus, cells, provider ordering, validation
Core Input: action manifest, keyboard bindings, contexts, intent snapshot, reset
Long Haul Delivery: seed, progress, depots, checks, retry, result, snapshot, reset
Core Simulation: reset, start, pause, resume, timer, penalties, recovery, failure, completion
Vehicle Dynamics: truck state, input, kinematics, boost, bounds, impacts, reset
Route Field: markers, corridors, nearest marker, state, reset
Resource Pressure: fuel, truck, cargo, bounded adjustments, state, reset
Hazard Field: state, motion, bounds, collisions, events, reset
Telemetry: truck, run, condition and delivery histories
terrain provider: prepare, update, release, descriptors, snapshots, reset
course provider: roads, depots, signs, vegetation, obstacles, lifecycle and snapshots
procedural generator: seed/RNG, graph, fork, depots, par, validation and generation plan
browser keyboard adapter: keydown, keyup, held state, repeat filter, route commands and blur clearing
Three.js adapter: renderer, scene, camera, atmosphere, rigs, meshes, resize, RAF and render
DOM adapter: title, help, settings, generation, HUD, pause, results, loss, toast and failure
Canvas adapter: explored routes, depots, rejections, truck and DPR-aware resize
WebAudio adapter: context unlock, master bus, loops, cues and RAF gain updates
storage adapter: settings, motion and best score
Pages adapter: main-triggered static deployment
```

## Main finding

The Core Input descriptor is not the executable input authority. The host owns raw keyboard state and direct commands, then copies only a subset of derived driving intent into Core Input.

```txt
Core Input actions: throttle, brake, steerLeft, steerRight, boost, interact, camera, map, pause, recovery
Core Input contexts: driving, menu
Core Input recovery binding: KeyR
host KeyR behavior: retry same seed
host recovery behavior: contextual KeyE
one-shot Core Input publication: absent
context enforcement: absent
held-action generation: absent
InputActionResult: absent
FirstInputActionAck: absent
FirstInputEffectFrameAck: absent
```

Camera, map, pause, retry and recovery therefore mutate route, run or presentation state without an accepted semantic input revision. The action descriptor and executable behavior can diverge without rejection.

This is a source-level contract and evidence gap. It is not a reproduced stuck-key, misclick or user-visible failure.

## Required authority

```txt
the-long-haul-input-action-contract-context-convergence-authority-domain
```

```txt
InputEventAdmissionCommand
  -> bind document, input generation, device, event,
     action-map, context and route revisions
  -> normalize browser evidence through one binding table
  -> reject stale, repeated, retired or out-of-context evidence
  -> update one immutable held-action snapshot
  -> publish InputEventAdmissionResult

InputActionCommand
  -> resolve one semantic action
  -> distinguish retry from recovery
  -> publish InputActionResult exactly once
  -> update Core Input from the accepted result
  -> allow gameplay and presentation consumption
  -> publish FirstInputActionAck
  -> publish FirstInputEffectFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, input behavior, gameplay, rendering, audio, storage, imports, workflows and deployment were not changed or executed.