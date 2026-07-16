# Project breakdown: WebGL context and resource recovery

**Timestamp:** `2026-07-16T05-01-43-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `48ba7e8938c7edb4a62a0748e60b69ba53820c45`  
**Status:** `webgl-context-resource-recovery-authority-audited`

## Summary

TheLongHaul is a single-file Nexus Engine freight game with ten installed engine kits, two Core World providers, seven browser/product adapters, Three.js WebGL, Canvas2D mapping, DOM routes and HUD, WebAudio, localStorage and Pages delivery.

This run isolates renderer-loss recovery. One `THREE.WebGLRenderer` and a large GPU resource graph are constructed once, the recursive RAF submits through that renderer indefinitely, and ordinary streamed-cell disposal exists. The host does not observe `webglcontextlost` or `webglcontextrestored`, identify renderer generations, suspend stale submissions, rebuild shared and streamed GPU resources, reject callbacks from retired generations, publish a fallback, or acknowledge a first recovered frame.

## Plan ledger

**Goal:** make renderer loss a bounded transaction that either reconstructs one coherent renderer/resource generation and presents a verified frame, or publishes an actionable fallback without corrupting simulation, input, route or world state.

- [x] Enumerate all 11 accessible `LuminaryLabs-Publish` repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Compare the ten eligible repositories with central ledgers and documented heads.
- [x] Confirm zero new, ledger-missing, root-agent-missing, undocumented or runtime-ahead repositories.
- [x] Select only TheLongHaul by the oldest synchronized timestamp.
- [x] Trace renderer construction, shared resources, streamed resources, ordinary release, RAF submission, resize and browser listeners.
- [x] Preserve the complete kit, provider, adapter and service inventory.
- [x] Define one parent WebGL recovery authority and 20 coordinating surfaces.
- [x] Change documentation only.
- [ ] Implement and execute forced-loss, restoration, stale-generation, fallback, artifact and Pages fixtures.

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

TheLongHaul       2026-07-16T00-38-29-04-00 selected
MyCozyIsland      2026-07-16T00-59-16-04-00
IntoTheMeadow     2026-07-16T01-38-56-04-00
PrehistoricRush   2026-07-16T02-03-42-04-00
HorrorCorridor    2026-07-16T02-40-29-04-00
TheOpenAbove      2026-07-16T03-03-22-04-00
ZombieOrchard     2026-07-16T03-41-28-04-00
TheUnmappedHouse  2026-07-16T04-02-40-04-00
PhantomCommand    2026-07-16T04-27-44-04-00
AetherVale        2026-07-16T04-40-16-04-00
TheCavalryOfRome  excluded
```

## Complete interaction loop

```txt
boot
  -> parse routes, HUD, map and failure shell
  -> import pinned Three.js and Nexus Engine
  -> install ten engine kits and two Core World providers
  -> construct WebGL renderer, scene, camera and shared resources
  -> restore settings
  -> enter title and start RAF

generation
  -> build deterministic course plan
  -> admit terrain and content cells
  -> allocate per-cell geometry, textures, materials and instances
  -> stream active cells around the truck

driving frame
  -> collect keyboard state
  -> update Core Input and vehicle intent
  -> tick simulation, hazards, resources, delivery and telemetry
  -> update route/HUD/map/audio/presentation state
  -> submit `renderer.render(scene, camera)`
  -> schedule the next RAF

ordinary cell retirement
  -> provider release calls `disposeCellEntry`
  -> owned geometry, textures and materials are disposed
  -> shared resources, renderer, atmosphere and rigs remain live

context-loss path
  -> browser loses WebGL context
  -> no typed loss event enters product authority
  -> RAF may continue submitting through the stale renderer
  -> no renderer/resource generation is retired
  -> no ordered GPU-resource reconstruction occurs
  -> no recovery deadline, retry budget or fallback result exists
  -> no first recovered frame is acknowledged
```

## Domains in use

```txt
browser document, resize, keyboard, blur and RAF lifecycle
provider resolution and pinned module imports
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
procedural course generation, validation, staged work and readiness
world partitioning, terrain/content providers, streaming and cell retirement
run timing, penalties, recovery, depot settlement, outcomes and scoring
settings, motion preference, WebAudio and localStorage
Three.js WebGL, Canvas2D map and DOM route/HUD projection
renderer generation, context-loss admission, GPU-resource manifest,
ordered reconstruction, stale-generation rejection, fallback and recovered-frame proof
GitHub Pages deployment and audit governance
```

## Complete kit inventory and offered services

### Engine-installed kits: 10

| Kit | Services |
|---|---|
| `core-scene-kit` | scene registry, current scene, transition requests, exit validation, scene snapshots |
| `core-world-domain` | world registry/removal, grid partition, focus, active-cell lifecycle, provider ordering, validation |
| `long-haul-core-input-kit` | action manifest, keyboard bindings, contexts, driving-intent snapshot, reset |
| `long-haul-delivery-domain-kit` | seed, generation progress, candidate depots, destination selection, depot checks, retry, run result, snapshot, reset |
| `long-haul-core-simulation-kit` | run reset/start, pause/resume, timer, distance, penalties, collisions, recovery, failure, completion |
| `vehicle-dynamics-kit` | heavy-truck state, vehicle input, kinematics, boost, bounds, impacts, reset |
| `long-haul-route` | route markers, corridors, nearest-marker queries, route state, reset |
| `long-haul-condition` | fuel, truck condition, cargo condition, bounded adjustments, state, reset |
| `long-haul-wildlife` | hazard state, motion, bounds, collision checks/events, reset |
| `long-haul-telemetry` | truck, run, condition and delivery histories, reset |

### Core World providers: 2

| Provider | Services |
|---|---|
| `long-haul-terrain-provider` | prepare/update/release terrain cells, terrain effect descriptors, active-cell snapshots, reset |
| `long-haul-course-provider` | prepare/update/release course cells, roads, depots, signs, vegetation, obstacles, descriptors, snapshots, reset |

### Browser/product adapters: 7

| Adapter | Services |
|---|---|
| `procedural-course-generator` | seed hashing, deterministic RNG, five-branch graph, confusing fork, depot placement, par calculation, validation, generation plan |
| `browser-keyboard-input-adapter` | keydown/up evidence, held state, repeat filtering, route/camera/map/interaction/retry commands, blur clearing |
| `three-webgl-presentation-adapter` | renderer, scene, camera, lighting, atmosphere, shared resources, streamed meshes, truck/wildlife/dust rigs, resize, RAF, render submit |
| `dom-scene-hud-adapter` | title, help, settings, generation, HUD, pause, results, loss, toast and boot-failure projection |
| `canvas-map-adapter` | explored roads, depot discovery/rejection, truck marker and resize |
| `web-audio-adapter` | context unlock, master bus, engine/wind loops, transient cues and per-frame gain updates |
| `browser-storage-adapter` | settings, motion preference and best-score documents |

### Deployment adapter: 1

| Adapter | Services |
|---|---|
| `github-pages-workflow` | main-push trigger, Pages setup, root artifact upload and deployment |

```txt
engine-installed kits: 10
Core World providers: 2
browser/product adapters: 7
deployment adapters: 1
total source-backed surfaces: 20
render surfaces: 3
planned renderer-recovery surfaces: 20
```

## Source-backed renderer finding

```txt
single renderer constructed once: yes
recursive RAF submits renderer.render every frame: yes
shared geometry/material graph: yes
per-cell geometry/texture/material ownership: yes
ordinary per-cell disposal: yes
whole renderer-generation owner: no
webglcontextlost observer: no
webglcontextrestored observer: no
preventDefault loss admission: no
presentation suspension result: no
GPU-resource manifest: no
ordered reconstruction: no
stale callback rejection: no
recovery deadline/retry budget: no
RenderLossResult: no
RenderRecoveryResult: no
RenderFallbackResult: no
FirstRecoveredFrameAck: no
```

The source proves a missing ownership and evidence boundary. It does not prove that a context-loss incident has occurred in production.

## Required authority

`the-long-haul-webgl-context-resource-recovery-authority-domain`

```txt
RenderRecoveryAdmissionCommand
  -> bind document, route, runtime, renderer, context,
     resource-manifest, world-cell and frame generations
  -> observe and deduplicate context-loss evidence
  -> suspend submissions from the lost generation
  -> apply explicit simulation and input policy
  -> inventory shared, atmosphere, rig and streamed-cell resources
  -> admit one bounded restoration attempt
  -> reconstruct renderer and resources in dependency order
  -> reject callbacks/results from retired generations
  -> publish RenderLossResult
  -> publish RenderRecoveryResult or RenderFallbackResult
  -> present and publish FirstRecoveredFrameAck
```

## Planned authority surfaces

```txt
render-generation-identity-kit
webgl-context-loss-observer-kit
context-loss-deduplication-kit
render-submission-suspension-kit
simulation-loss-policy-kit
input-loss-policy-kit
gpu-resource-manifest-kit
shared-geometry-rehydration-kit
shared-material-rehydration-kit
streamed-cell-resource-rehydration-kit
atmosphere-resource-rehydration-kit
truck-resource-rehydration-kit
wildlife-resource-rehydration-kit
dust-resource-rehydration-kit
renderer-reconstruction-kit
context-restoration-admission-kit
stale-render-generation-rejection-kit
render-recovery-result-kit
render-fallback-result-kit
first-recovered-frame-ack-kit
```

## Validation boundary

Documentation only. Runtime JavaScript, HTML, CSS, simulation, gameplay, rendering, audio, storage, imports, workflows and deployment were not changed or executed.