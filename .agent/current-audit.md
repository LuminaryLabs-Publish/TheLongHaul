# Current audit: accessible HUD, route and announcement authority

**Timestamp:** `2026-07-16T00-38-29-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `d3b8c99bf4a8ccb6a5246e81f8cdaa9f1513e1bf`  
**Status:** `accessible-hud-route-announcement-authority-audited`

## Summary

The repository contains a complete single-file Nexus Engine browser freight game with deterministic generation, streamed world content, driving, depot discovery, recovery, retry, scoring, WebGL, Canvas2D, DOM UI, WebAudio, persistence and Pages deployment.

This audit isolates semantic HUD projection, route focus and meaningful announcement ownership.

## Plan ledger

**Goal:** turn accepted route and gameplay revisions into one bounded accessible read model and matching semantic/visible frame evidence.

- [x] Compare all eligible Publish repositories and select TheLongHaul by oldest synchronized timestamp.
- [x] Inspect route, generation, HUD, map, toast, outcome, keyboard and frame paths.
- [x] Preserve all existing domains, kits, providers, adapters and services.
- [x] Define the missing focus, announcement, canvas-alternative and frame-result surfaces.
- [x] Change documentation only.
- [ ] Implement and execute browser accessibility fixtures.

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
  -> parse static canvas, route screens, HUD, map and failure shell
  -> import pinned providers
  -> install engine kits and providers
  -> restore settings
  -> enter title and start RAF

route command
  -> transition through Core Scene
  -> updateSceneUi removes and adds .active classes
  -> body driving class changes
  -> no explicit focus transfer, restoration or semantic route result

generation
  -> bounded work updates visual percent, phase detail and phase classes
  -> no progressbar state or semantic progress acknowledgement

driving frame
  -> input and simulation settle
  -> updateHud rewrites timer, speed, road, fuel, damage, cargo,
     checked depots, penalties, recovery and interaction prompt
  -> all text remains under one aria-live=polite ancestor
  -> Canvas2D map and Three.js world render
  -> no semantic-frame revision or convergence acknowledgement

event/outcome
  -> toast text/class changes or results/loss route activates
  -> no typed announcement identity, priority, deduplication or focus result
```

## Domains in use

```txt
browser lifecycle, route, focus, keyboard, resize and RAF
provider resolution and pinned imports
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
course generation, validation, scheduling, streaming and exploration
recovery, retry, depot checks, penalties, outcome and scoring
settings, motion preference, audio and storage
Three.js WebGL, Canvas2D map and DOM UI/HUD
semantic route projection, focus ownership, telemetry summarization,
announcement policy, canvas alternatives and accessibility-frame convergence
GitHub Pages deployment and audit governance
```

## Kits and services

```txt
Core Scene: registry, current scene, transitions, exit validation, snapshots
Core World: registry, partition, focus, cells, provider ordering, validation
Core Input: action manifest, bindings, contexts, intent snapshot, reset
Long Haul Delivery: seed, progress, depots, checks, retry, result, snapshot, reset
Core Simulation: reset, start, pause, resume, timer, penalties, recovery, failure, completion
Vehicle Dynamics: truck state, input, kinematics, boost, bounds, impacts, reset
Route Field: markers, corridors, nearest marker, state, reset
Resource Pressure: fuel, truck, cargo, adjustments, state, reset
Hazard Field: state, motion, bounds, collisions, events, reset
Telemetry: truck, run, condition and delivery histories
terrain provider: prepare, update, release, effects, snapshots, reset
course provider: roads, depots, signs, vegetation, obstacles, lifecycle, snapshots
procedural generator: seed/RNG, graph, fork, depots, par, validation, plan
keyboard adapter: key evidence, held state, commands and blur clearing
Three.js adapter: renderer, scene, camera, atmosphere, rigs, meshes, RAF and render
DOM adapter: title, help, settings, generation, HUD, pause, results, loss, toast, failure
Canvas adapter: roads, depots, rejections, truck and resize
WebAudio adapter: unlock, buses, loops, cues and gain updates
storage adapter: settings, motion and best score
Pages adapter: main-triggered static deployment
```

## Main finding

The HUD is semantically live at a much higher cadence than the gameplay decisions that should be announced.

```txt
#hud aria-live=polite: yes
updateHud called while driving every frame: yes
multiple live descendants rewritten per call: yes
continuous telemetry semantic policy: no
announcement thresholds/cadence: no
stable semantic event identity: no
discrete toast live policy: no
route focus owner/restoration: no
inactive-screen semantic settlement: no
generation progress role/value result: no
dynamic game-canvas alternative: no
map semantic summary: no
AccessibilityProjectionResult: no
FirstAccessibleRouteFrameAck: no
FirstVisualAccessibleConvergenceAck: no
```

Continuous telemetry should remain queryable, but only meaningful thresholds and accepted discrete events should enter an announcement stream. Route changes need explicit focus and inactive-screen settlement. Canvas alternatives need to cite the same accepted run/map revision as the visible frame.

This is a source-level semantic ownership and evidence gap. It is not a reproduced screen-reader failure or conformance claim.

## Required authority

`the-long-haul-accessible-hud-route-announcement-authority-domain`

```txt
AccessibilityProjectionCommand
  -> bind document, route, run, simulation, HUD, map,
     input, focus, policy and visible-frame revisions
  -> derive immutable AccessibleReadModel
  -> calculate bounded telemetry and announcement deltas
  -> settle route focus and restoration
  -> project state-bound canvas and map alternatives
  -> reject stale, duplicate and retired work
  -> publish AccessibilityProjectionResult
  -> publish FirstAccessibleRouteFrameAck
  -> publish FirstVisualAccessibleConvergenceAck
```

## Audit boundary

Documentation only. Runtime JavaScript, HTML, CSS, input, gameplay, rendering, audio, storage, imports, workflows and deployment were not changed or executed.