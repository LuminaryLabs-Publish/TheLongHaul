# Current audit: WebGL context and resource recovery authority

**Timestamp:** `2026-07-16T05-01-43-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `48ba7e8938c7edb4a62a0748e60b69ba53820c45`  
**Status:** `webgl-context-resource-recovery-authority-audited`

## Summary

TheLongHaul contains a complete single-file Nexus Engine browser freight game with deterministic generation, streamed world content, driving, depot discovery, recovery, retry, scoring, WebGL, Canvas2D, DOM UI, WebAudio, persistence and Pages deployment.

This audit isolates WebGL context-loss admission, renderer generations, GPU-resource reconstruction, gameplay policy during visual loss and first recovered frame proof.

## Plan ledger

**Goal:** turn WebGL loss/restoration evidence into one bounded recovery or fallback result while keeping Nexus Engine state authoritative.

- [x] Compare all eligible Publish repositories and select TheLongHaul by oldest synchronized timestamp.
- [x] Inspect renderer creation, shared resources, streamed cells, cell release, rigs, resize, listeners and RAF.
- [x] Preserve all existing domains, kits, providers, adapters and services.
- [x] Define the missing generation, manifest, reconstruction, stale-rejection, fallback and frame-result surfaces.
- [x] Change documentation only.
- [ ] Implement and execute browser context-loss fixtures.

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
  -> import pinned providers
  -> install engine kits and world providers
  -> create renderer, scene, camera, lights and shared resources
  -> restore settings and enter title
  -> start recursive RAF

generation and streaming
  -> create deterministic course
  -> create active terrain/content cells
  -> allocate cell geometry, textures, materials and instances
  -> release ordinary inactive cells through provider disposal

driving frame
  -> capture input and update intent
  -> tick engine state
  -> stream world around vehicle
  -> update HUD, map, audio and Three.js objects
  -> renderer.render(scene, camera)

context loss
  -> browser evidence has no product-owned admission path
  -> old renderer generation is not retired
  -> RAF and callbacks have no generation guard
  -> shared and active-cell resources have no reconstruction manifest
  -> gameplay/input policy is undefined
  -> no fallback or first recovered frame result exists
```

## Domains in use

```txt
browser lifecycle, keyboard, blur, resize and RAF
provider resolution and pinned imports
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
course generation, validation, staged work, streaming and ordinary cell retirement
run timing, recovery, depot checks, penalties, outcomes and scoring
settings, motion preference, audio and storage
Three.js WebGL, Canvas2D map and DOM UI/HUD
renderer/context generation, loss admission, GPU-resource manifest,
ordered rehydration, stale-generation rejection, fallback and recovered-frame convergence
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
Three.js adapter: renderer, scene, camera, atmosphere, shared resources, streamed meshes, rigs, resize, RAF and render
DOM adapter: title, help, settings, generation, HUD, pause, results, loss, toast, failure
Canvas adapter: roads, depots, rejections, truck and resize
WebAudio adapter: unlock, buses, loops, cues and gain updates
storage adapter: settings, motion and best score
Pages adapter: main-triggered static deployment
```

## Main finding

```txt
one renderer constructed and retained: yes
recursive RAF render submission: yes
shared GPU resource graph: yes
active streamed GPU resource graph: yes
ordinary cell disposal: yes
whole renderer-generation owner: no
webglcontextlost admission: no
webglcontextrestored admission: no
presentation suspension result: no
simulation/input loss policy: no
GPU resource manifest: no
ordered reconstruction: no
active-cell rehydration result: no
stale callback rejection: no
recovery deadline/retry budget: no
RenderLossResult: no
RenderRecoveryResult: no
RenderFallbackResult: no
FirstRecoveredFrameAck: no
```

A context loss can invalidate the renderer and GPU resources while the recursive frame and engine paths retain no explicit replacement-generation contract. Ordinary cell disposal does not reconstruct shared resources, persistent rigs, atmosphere or active cells.

This is a source-level lifecycle and evidence gap. It is not a reproduced production failure.

## Required authority

`the-long-haul-webgl-context-resource-recovery-authority-domain`

```txt
RenderRecoveryAdmissionCommand
  -> bind document route runtime renderer context resource-manifest
     world-cell input simulation and frame revisions
  -> observe and deduplicate context loss
  -> retire stale presentation
  -> apply explicit input and simulation policy
  -> rebuild renderer, shared resources, atmosphere, active cells and rigs
  -> reject retired-generation callbacks and results
  -> enforce a deadline and retry budget
  -> publish RenderLossResult
  -> publish RenderRecoveryResult or RenderFallbackResult
  -> publish FirstRecoveredFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, HTML, CSS, input, gameplay, rendering, audio, storage, imports, workflows and deployment were not changed or executed.