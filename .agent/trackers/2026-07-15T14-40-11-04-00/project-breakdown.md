# Project breakdown: host clock and fixed-step simulation

**Timestamp:** `2026-07-15T14-40-11-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `e2796634445e63b5cd0ee7ea34f7ab50078755f2`  
**Status:** `host-clock-fixed-step-simulation-frame-authority-audited`

## Summary

TheLongHaul is a complete static browser freight game built in one `index.html`. It installs ten Nexus Engine kits, registers two Core World providers, generates one five-branch freight course, streams terrain and route content, simulates truck movement and run state, and projects the result through Three.js, Canvas2D, DOM UI, WebAudio and browser storage.

This run isolates host-clock admission. The RAF loop derives one variable `dt`, clamps it to `1/15`, executes exactly one driving update and one `engine.tick(dt)`, then renders once. There is no fixed-step accumulator, residual-time ownership, maximum-substep result, explicit dropped-time policy, interpolation revision or first clock-bound visible-frame acknowledgement.

## Plan ledger

**Goal:** separate browser callback cadence from deterministic gameplay time while keeping rendering responsive and overload behavior explicit.

- [x] Enumerate all 11 accessible `LuminaryLabs-Publish` repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Compare ten eligible repositories with ten central-ledger entries and root `.agent` states.
- [x] Compare every eligible current head with its documented repo-local head.
- [x] Confirm zero new, ledger-missing, root-agent-missing, undocumented or runtime-ahead repositories.
- [x] Select only `LuminaryLabs-Publish/TheLongHaul` by the oldest synchronized timestamp.
- [x] Trace RAF time, driving preparation, Nexus Engine ticking, run timers, vehicle dynamics, hazards, visuals, map, audio and render submission.
- [x] Preserve all 19 source-backed kit, provider, adapter and deployment surfaces.
- [x] Define one host-clock parent authority and 19 coordinating surfaces.
- [x] Add a new timestamped tracker and audit family.
- [x] Refresh all required root `.agent` documents.
- [ ] Implement and execute controlled-clock, cadence, overload, visibility, interpolation, artifact and Pages fixtures.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 0

selected: LuminaryLabs-Publish/TheLongHaul
selection rule: oldest synchronized central timestamp
prior central timestamp: 2026-07-15T09-40-51-04-00
next oldest: LuminaryLabs-Publish/MyCozyIsland at 2026-07-15T10-01-08-04-00
excluded: LuminaryLabs-Publish/TheCavalryOfRome
```

## Complete interaction loop

```txt
boot
  -> load pinned Three.js and Nexus Engine modules
  -> install ten engine kits
  -> register terrain and course Core World providers
  -> initialize renderer scene camera UI audio and settings
  -> enter title

start
  -> choose a new seed or accepted retry seed
  -> reset world run delivery hazards telemetry and presentation state
  -> create a 31-unit generation plan
  -> execute one generation unit per RAF callback
  -> validate course and world
  -> start run and enter driving

driving callback
  -> RAF supplies callback timestamp
  -> rawDelta = max(0.001, callback delta)
  -> dt = min(rawDelta, 1 / 15)
  -> sample keyboard intent
  -> update vehicle input, road state, recovery, collisions and interactions
  -> engine.tick(dt) exactly once
  -> update streamed world focus and exploration
  -> update run outcome HUD audio truck camera wildlife dust and map
  -> renderer.render(scene, camera) exactly once

terminal
  -> valid depot check settles completed result
  -> failure conditions settle loss
  -> results persist best score
  -> retry same seed, generate a new seed or return to title
```

## Source-backed clock finding

The active host loop in `index.html` performs:

```js
const rawDelta = Math.max(.001, (now - previousTime) / 1000);
previousTime = now;
const dt = Math.min(rawDelta, 1 / 15);
...
engine.tick(dt);
...
renderer.render(scene, camera);
```

The same variable `dt` is used before the engine tick for driving preparation and after the tick for visual smoothing, dust and camera updates.

```txt
clock source: requestAnimationFrame timestamp
wall-delta floor: 1 ms
wall-delta ceiling admitted to simulation: 66.666... ms
simulation steps per callback: exactly 1
fixed simulation quantum: absent
accumulator: absent
residual time: absent
maximum substeps: absent
overload/dropped-time result: absent
visibility baseline reset: absent
render interpolation alpha: absent
simulation revision per step: absent
HostFrameResult: absent
FirstClockBoundFrameAck: absent
```

At sustained callback rates below 15 FPS, admitted simulation time advances slower than wall time because each callback can contribute at most `1/15` second:

```txt
15 callbacks/sec -> at most 1.000 simulated sec/sec
10 callbacks/sec -> at most 0.667 simulated sec/sec
 5 callbacks/sec -> at most 0.333 simulated sec/sec
```

At higher callback rates, variable-step integration still depends on callback cadence. The clamp deliberately avoids an unbounded catch-up jump after a long stall, but the source does not publish whether excess wall time was deferred, discarded or intentionally suspended.

This is a source-backed timing and evidence gap. No browser cadence trace or gameplay-speed measurement was executed.

## Domains in use

```txt
browser document lifecycle, focus, blur, resize, RAF and monotonic wall clock
provider resolution and pinned module imports
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
seeded course generation, validation and generation scheduling
streamed terrain and route-content ownership
truck input, kinematics, collisions, recovery and condition pressure
wildlife, dust, exploration, depot discovery, scoring and retry
route, run, settings, motion, audio and persistence lifecycle
Three.js WebGL, Canvas2D map and DOM UI/HUD
WebAudio unlock, persistent loops and transient cues
host-frame scheduling, variable-delta admission and render submission
GitHub Pages deployment, repo-local audit state and central governance
```

## Implemented kits and offered services

### Engine-installed kits: 10

```txt
core-scene-kit
  scene registry, current scene, transitions, exit validation, snapshots

core-world-domain
  world registry/removal, grid partition, focus, active cells,
  provider ordering, validation

long-haul-core-input-kit
  action manifest, keyboard bindings, contexts, driving intent, reset

long-haul-delivery-domain-kit
  seed, generation plan/progress, candidate depots, valid destination,
  depot checks, retry, run result, snapshot, reset

long-haul-core-simulation-kit
  reset, start, pause, resume, timer, distance, penalties, collisions,
  recovery, failure and completion

vehicle-dynamics-kit
  heavy-truck state, input, kinematics, boost, bounds, impacts, reset

long-haul-route
  route markers, corridors, nearest-marker query, state, reset

long-haul-condition
  fuel, truck condition, cargo condition, bounded adjustments, state, reset

long-haul-wildlife
  hazard state, motion, bounds, circle collision, events, reset

long-haul-telemetry
  truck, run, condition and delivery histories, reset
```

### Core World effect providers: 2

```txt
long-haul-terrain-provider
  prepare, update and release cells; terrain descriptors;
  active-cell snapshots; reset

long-haul-course-provider
  prepare, update and release cells; roads, depots, signs,
  vegetation, obstacles, descriptors, snapshots and reset
```

### Browser and product adapters: 6

```txt
procedural-course-generator
  seed hashing, deterministic RNG, five-branch graph, confusing fork,
  depot placement, par calculation, validation and 31-unit plan

three-webgl-presentation-adapter
  renderer, scene, camera, lighting, atmosphere, streamed meshes,
  truck, wildlife, dust, shadows, resize, RAF and render submission

dom-scene-hud-adapter
  title, help, settings, generation, HUD, pause, results,
  loss, toast and failure presentation

canvas-map-adapter
  explored roads, discovered depots, rejected yards, truck marker,
  DPR-aware backing-store resize and map drawing

web-audio-adapter
  context unlock, master bus, engine loop, wind loop,
  click, wrong-yard, impact and delivery cues, RAF gain updates

browser-storage-adapter
  settings document, motion preference and best-score document
```

### Deployment adapter: 1

```txt
github-pages-workflow
  main-push trigger, Pages configuration, root artifact upload and deployment
```

```txt
total source-backed surfaces: 19
render surfaces: 3
planned host-clock authority surfaces: 19
```

## Required authority

```txt
the-long-haul-host-clock-fixed-step-simulation-frame-authority-domain
```

```txt
HostFrameCommand
  -> bind HostFrameId, ClockRevision, callback timestamp,
     route revision, run revision and visibility revision
  -> derive non-negative wall delta from one monotonic clock
  -> settle first-frame and resume baselines explicitly
  -> accumulate admitted wall time
  -> execute zero or more fixed simulation steps under a bounded substep budget
  -> publish one SimulationStepResult for each accepted step
  -> retain residual time for the next host frame
  -> discard time only through an explicit overload policy and receipt
  -> render exactly once from accepted simulation revisions
  -> publish interpolation alpha and HostFrameResult
  -> acknowledge FirstClockBoundFrameAck

VisibilityClockCommand
  -> bind document and route revisions
  -> suspend, pause or rebase the clock under an explicit policy
  -> prevent hidden-time debt from being silently simulated or silently lost
  -> publish VisibilityClockResult
```

## Planned authority surfaces

```txt
host-frame-command-kit
monotonic-clock-source-kit
wall-delta-normalization-kit
fixed-step-accumulator-kit
simulation-step-admission-kit
max-substep-budget-kit
residual-time-retention-kit
overload-time-policy-kit
discarded-time-receipt-kit
pause-clock-settlement-kit
visibility-resume-baseline-kit
simulation-revision-kit
render-interpolation-kit
host-frame-result-kit
first-clock-bound-frame-ack-kit
cadence-matrix-fixture-kit
visibility-resume-fixture-kit
source-pages-clock-parity-kit
host-clock-diagnostics-adapter-kit
```

## Required validation

```txt
controlled 30, 60, 90 and 120 Hz RAF fixture
controlled 20, 15, 10 and 5 Hz low-cadence fixture
long-stall and maximum-substep fixture
pause/resume clock-baseline fixture
visibility hidden/visible fixture
same-seed deterministic driving trace across callback rates
run timer and resource-pressure wall-time trace
simulation-step and render-frame revision correlation
first clock-bound visible-frame acknowledgement
source, root artifact and deployed Pages parity
```

## Audit boundary

Documentation only. Runtime JavaScript, gameplay, generation, rendering, audio, persistence, imports, workflows and deployment were not changed or executed. No cadence independence, deterministic stepping, wall-time accuracy, overload correctness, interpolation correctness, visible-frame convergence, artifact parity, Pages parity or production readiness is claimed.
