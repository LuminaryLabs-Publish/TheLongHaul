# Current audit: host clock fixed-step simulation and frame authority

**Timestamp:** `2026-07-15T14-40-11-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `e2796634445e63b5cd0ee7ea34f7ab50078755f2`  
**Status:** `host-clock-fixed-step-simulation-frame-authority-audited`

## Summary

The repository contains a complete single-file Nexus Engine browser freight game with deterministic course generation, streamed world content, driving, depot discovery, condition pressure, scoring, retry, WebGL, Canvas2D, DOM UI, WebAudio, persistence and Pages deployment.

This audit isolates the browser callback clock and its relationship to gameplay stepping and visible frames.

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
package manifest: absent
test suite: absent
build command: absent
```

## Complete interaction loop

```txt
boot
  -> install kits and providers
  -> initialize renderer, UI, audio and settings
  -> enter title

start
  -> choose seed
  -> reset domains and presentation
  -> execute 31 generation units over RAF callbacks
  -> validate course and world
  -> start run and enter driving

driving RAF
  -> derive rawDelta from callback timestamp
  -> cap dt at 1 / 15
  -> process driving input, road state, collisions and interactions once
  -> engine.tick(dt) once
  -> update streaming, exploration, HUD, outcome and audio
  -> update truck, camera, wildlife, dust and map
  -> render once

terminal
  -> settle completion or failure
  -> persist best score
  -> retry or return to title
```

## Domains in use

```txt
browser document lifecycle, focus, blur, resize, RAF and monotonic wall clock
provider resolution and pinned module imports
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
seeded course generation, validation, scheduling and readiness
streamed terrain and course-content ownership
truck, wildlife, dust, exploration, depot discovery, scoring and retry
settings, motion, pause, audio and browser persistence
Three.js WebGL, Canvas2D map and DOM UI/HUD
host-frame scheduling, variable-delta admission and render submission
GitHub Pages deployment and audit governance
```

## Kits and services

```txt
Core Scene: registry, current scene, transitions, exit validation, snapshots
Core World: registry, partition, focus, cells, provider ordering, validation
Core Input: actions, bindings, contexts, driving intent, reset
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
Three.js adapter: renderer, scene, camera, atmosphere, rigs, meshes, resize, RAF and render
DOM adapter: title, help, settings, generation, HUD, pause, results, loss, toast and failure
Canvas adapter: explored routes, depots, rejections, truck and DPR-aware resize
WebAudio adapter: context unlock, master bus, loops, cues and RAF gain updates
storage adapter: settings, motion and best score
Pages adapter: main-triggered static deployment
```

## Main finding

The RAF loop records `previousTime`, derives `rawDelta`, caps the admitted `dt` at `1/15`, executes one driving update and one `engine.tick(dt)`, and renders once. No residual time is retained and no fixed simulation quantum is used.

```txt
callback timestamp source: requestAnimationFrame
raw delta floor: 0.001 seconds
admitted delta cap: 1 / 15 second
simulation steps per callback: 1
fixed-step accumulator: absent
maximum substeps: absent
residual time: absent
overload classification: absent
discarded-time receipt: absent
visibility resume baseline: absent
simulation revision: absent
render interpolation: absent
HostFrameResult: absent
FirstClockBoundFrameAck: absent
```

At sustained callback rates below 15 FPS, admitted gameplay time can advance slower than wall time. At other rates, variable-step vehicle, timer, hazard and presentation updates can depend on callback cadence. Long stalls are capped, but the source does not report whether excess time was deferred, discarded or suspended.

This is a source-level timing and evidence gap. It is not a reproduced gameplay-speed or visual defect.

## Required authority

```txt
the-long-haul-host-clock-fixed-step-simulation-frame-authority-domain
```

```txt
HostFrameCommand
  -> bind host frame, clock, callback timestamp, route, run and visibility revisions
  -> normalize wall delta and establish boot/resume baselines
  -> accumulate admitted wall time
  -> execute bounded fixed simulation steps
  -> publish ordered SimulationStepResult receipts
  -> retain residual time
  -> report deferred or discarded time explicitly
  -> render once from accepted simulation revisions and interpolation alpha
  -> publish HostFrameResult
  -> acknowledge FirstClockBoundFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, gameplay timing, generation, rendering, audio, storage, imports, workflows and deployment were not changed or executed.
