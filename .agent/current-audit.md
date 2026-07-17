# Current audit: infinite-world map viewport and semantic projection

**Timestamp:** `2026-07-17T01-01-09-04-00`  
**Reviewed pre-audit repository head:** `bc7cb7bebb802f87ce20bac138446e81987ca9ae`  
**Status:** `infinite-world-map-viewport-projection-authority-audited`

## Summary

TheLongHaul's world profile and verified package admit infinite extent, and the patch-preparation path can demand arbitrary gameplay cells. The Canvas2D field map remains finite-course scoped: it calculates scale and origin from `course.bounds`, draws only explored course edges and discovered/checked course depots, and projects the truck through that same finite transform.

This creates a renderer-neutral ownership gap. Valid far travel can continue while the truck marker leaves the map canvas, and no streamed-cell or atlas content can enter the map frame.

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
selection: oldest synchronized documented timestamp
selected: LuminaryLabs-Publish/TheLongHaul
selected prior timestamp: 2026-07-16T19-39-24-04-00
```

## Complete interaction loop

```txt
page load
  -> import Three.js and pinned Nexus Engine
  -> load bootstrap and eleven ordered chunks
  -> install 8 Core kits and 12 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

Start the Haul
  -> generate finite five-branch delivery course
  -> verify infinite world package
  -> prepare initial gameplay cells
  -> reset Truck, Course, Run, Delivery, Wildlife and meters
  -> register Core World provider
  -> enter driving

Driving frame
  -> submit keyboard intent
  -> tick Truck, Course, Run, Delivery and Wildlife
  -> move world focus and demand arbitrary cells
  -> commit prepared cell effects
  -> update camera, HUD, audio and visuals
  -> draw map when open
  -> render Three.js

Map frame
  -> read canvas client size and capped DPR
  -> derive viewport from finite course.bounds
  -> draw explored finite-course roads
  -> draw discovered/checked finite-course depots
  -> draw course origin and truck marker
  -> publish no viewport/content/frame result

Outcome
  -> inspect depots
  -> deliver or fail
  -> score and retry/new seed/title
```

## Domains in use

```txt
browser startup, ordered modules, document, RAF, resize, keyboard and storage
Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger
Long Haul World Profile, World Atlas and Horizon LOD Policy
Long Haul Road Classes, Terrain Policy and Truck Dynamics Profile
Long Haul Delivery Contract Catalog
Long Haul Truck, Course, Run, Delivery and Wildlife
procedural finite-course generation
infinite gameplay-cell terrain generation and macro-sector generation
patch preparation and Core World provider lifecycle
Three.js WebGL, Canvas2D map, DOM UI/HUD/fault, WebAudio and storage
Node smoke, GitHub Actions, Pages and audit governance
planned infinite-world map viewport/projection authority
```

## Kits and offered services

### Engine-installed kits

| Kit | Services |
|---|---|
| `core-scene-kit` | Scenes, exits, transition requests, identity and snapshots. |
| `core-world-domain` | Worlds, partitions, focus, active cells, providers, validation and snapshots. |
| `long-haul-input` | Actions, keyboard bindings, contexts and driving intent. |
| `core-data-kit` | Schemas, package envelopes, digests and named randomness. |
| `core-simulation-kit` | Fuel, truck, cargo and time meters. |
| `core-camera-kit` | Target, smoothing, snap, mode and descriptors. |
| `core-graphics-kit` | Instance batches, cell writes/removals, flush, bounds and release. |
| `core-transaction-ledger-kit` | Apply-once, duplicate classification, metadata and snapshots. |
| `long-haul-world-profile-kit` | Extent, gameplay-cell, atlas and horizon policies. |
| `long-haul-world-atlas-kit` | Macro sectors, biomes, densities, settlements, portals, roads and queries. |
| `long-haul-horizon-lod-policy-kit` | Terrain, forest, road, settlement and collision representation policy. |
| `long-haul-road-class-catalog-kit` | Width, grip, grade, curvature and jump weights. |
| `long-haul-terrain-policy-kit` | Terrain field, landforms, road shaping and jumps. |
| `long-haul-truck-dynamics-profile-kit` | Powertrain, resistance, steering, grip, suspension, air control and boost. |
| `long-haul-delivery-contract-catalog-kit` | Contract types and job policy. |
| `long-haul-truck-kit` | Truck state, kinematics, drift, suspension, air control, teleport and recovery. |
| `long-haul-course-kit` | Course package, exploration, discovery and route queries. |
| `long-haul-run-kit` | Time, distance, telemetry, penalties, recovery and outcomes. |
| `long-haul-delivery-kit` | Candidate/valid depots and delivery evaluation. |
| `long-haul-wildlife-kit` | Deterministic crossing hazards and motion. |

### Providers, controller, adapters and proof

| Surface | Services |
|---|---|
| `long-haul-course-provider` | Prepared-cell effects, update/release and patch lifecycle. |
| `long-haul-world-patch-preparation-controller` | Desired/prefetch sets, budgets, cache, prime, release and snapshots. |
| `ordered-module-bootstrap-adapter` | Ordered startup and boot-failure projection. |
| `procedural-course-generator` | Seeded five-branch course, depots, wildlife, scoring and validation. |
| `course-cell-descriptor-generator` | Terrain, finite roads/signs/depots, vegetation, grass, rocks and obstacles. |
| `browser-keyboard-input-adapter` | Held and one-shot keyboard evidence. |
| `three-webgl-presentation-adapter` | Streamed world, truck/wildlife, camera, resize, RAF and render. |
| `dom-scene-hud-adapter` | Menu, generation, HUD, pause, outcomes and faults. |
| `canvas-map-adapter` | Finite-course roads, depots, rejected yards, truck marker and DPR resize. |
| `web-audio-adapter` | Context, engine/wind loops and cues. |
| `browser-storage-adapter` | Settings and best score. |
| `atomic-domain-kits-smoke` | Product composition, policies, far sectors and truck dynamics. |
| `long-haul-game-smoke` | Course generation, far terrain, seams, truck and delivery. |
| `static-shell-smoke-and-ci` | Provider pin, syntax, tick and source checks. |
| `github-pages-deployment` | Static publication from `main`. |

## Source-backed finding

`drawMap()` reads `course.bounds` and computes a fixed world-to-canvas transform. The source does not query World Profile, World Atlas, active Core World cells, provider results or patch-preparation state. It has no player-centered map window, sector coverage, map-content digest, stale-result rejection or matching-frame acknowledgement.

`updateWorldStreaming()` can request arbitrary cell coordinates, and map-open gameplay continues to tick and move. The map can therefore become spatially invalid during otherwise valid infinite travel.

## Required authority

`the-long-haul-infinite-world-map-viewport-projection-authority-domain`

```txt
MapViewportAdmissionCommand
  -> bind run, profile, package, course, atlas,
     cell, sector, discovery and canvas revisions
  -> choose an explicit map tracking mode
  -> publish MapViewportAdmissionResult

MapContentProjectionCommand
  -> query accepted semantic content
  -> filter and clip roads, depots, settlements and portals
  -> publish MapContentProjectionResult and digest

MapFrameCommitCommand
  -> draw one accepted viewport/content generation
  -> publish MapFrameCommitResult
  -> publish FirstInfiniteMapBoundFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, gameplay, Canvas2D, WebGL, tests, workflows and deployment were not changed. `npm test` and browser/artifact/Pages fixtures were not run.