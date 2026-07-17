# Project breakdown: infinite-world map viewport and projection

**Timestamp:** `2026-07-17T01-01-09-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed repository head:** `bc7cb7bebb802f87ce20bac138446e81987ca9ae`  
**Status:** `infinite-world-map-viewport-projection-authority-audited`

## Summary

All 11 `LuminaryLabs-Publish` repositories were compared with the ten eligible central ledgers and root `.agent` states. `TheCavalryOfRome` was excluded. Every eligible head matched its documented head, so TheLongHaul was selected as the oldest synchronized eligible repository.

The gameplay world now declares infinite extent, but the Canvas2D field map still derives its entire viewport from the finite five-branch course bounds. The map can therefore lose the truck marker when the player travels beyond those bounds and cannot project streamed cells, macro sectors, atlas roads, settlements or portals.

## Interaction loop

```txt
page load
  -> import Three.js and pinned Nexus Engine
  -> load bootstrap and eleven ordered chunks
  -> install 8 Core kits and 12 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

Start the Haul
  -> generate finite five-branch delivery course
  -> verify infinite-extent package
  -> prepare initial gameplay cells
  -> register Core World provider
  -> enter driving

Driving
  -> admit keyboard intent
  -> tick truck, course, run, delivery and wildlife
  -> stream arbitrary grid cells
  -> update camera, HUD, map state and audio
  -> render WebGL frame

Map interaction
  -> M toggles `mapOpen`
  -> gameplay continues while the map is open
  -> `drawMap()` reads finite `course.bounds`
  -> explored finite-course roads and depots are projected
  -> truck marker is projected through the same finite transform
  -> Canvas2D frame is drawn without a map generation receipt

Outcome
  -> check depots
  -> deliver or fail
  -> score and retry/new seed/title
```

## Domains in use

Browser startup, ordered modules, document lifecycle, RAF, resize, keyboard, storage; Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger; Long Haul World Profile, World Atlas, Horizon LOD, Road Classes, Terrain Policy, Truck Dynamics, Delivery Contracts, Truck, Course, Run, Delivery and Wildlife; procedural finite-course generation; infinite gameplay-cell terrain generation; macro-sector generation; patch preparation; Core World provider lifecycle; Three.js WebGL; Canvas2D field map; DOM HUD and route surfaces; WebAudio; Node smoke, Actions, Pages and central governance.

## Kits and offered services

### Engine-installed kits

| Kit | Services |
|---|---|
| `core-scene-kit` | Scene registry, current scene, exits, transition requests, transition identity and snapshots. |
| `core-world-domain` | World registration, partitioning, focus, active cells, provider ordering, validation and snapshots. |
| `long-haul-input` | Semantic actions, keyboard bindings, contexts, driving intent and reset. |
| `core-data-kit` | Schemas, package envelopes, digests, named random streams and random snapshot restore. |
| `core-simulation-kit` | Fuel, truck, cargo and time meters; bounds, rates, locks, thresholds and reset. |
| `core-camera-kit` | Camera targets, smoothing, snap, mode and portable descriptors. |
| `core-graphics-kit` | Instance batches, cell writes/removals, flush, bounds and release receipts. |
| `core-transaction-ledger-kit` | Apply-once operations, duplicate classification, metadata and snapshots. |
| `long-haul-world-profile-kit` | Extent, cell, atlas and horizon policies; configure, snapshot and reset. |
| `long-haul-world-atlas-kit` | Macro sectors, biomes, densities, settlements, portals, roads, queries and reset. |
| `long-haul-horizon-lod-policy-kit` | Terrain, forest, road, settlement and collision representation policy. |
| `long-haul-road-class-catalog-kit` | Width, surface, grip, grade, curvature and jump weighting. |
| `long-haul-terrain-policy-kit` | Terrain octaves, landforms, road shaping and jump profiles. |
| `long-haul-truck-dynamics-profile-kit` | Powertrain, resistance, steering, grip, suspension, air control and boost. |
| `long-haul-delivery-contract-catalog-kit` | Contract types and job policy. |
| `long-haul-truck-kit` | Truck state, kinematics, drift, suspension, input, impulses, teleport and recovery. |
| `long-haul-course-kit` | Course package, exploration, discovered depots, route queries, samples and reset. |
| `long-haul-run-kit` | Clock, distance, telemetry, penalties, collisions, recovery, completion and failure. |
| `long-haul-delivery-kit` | Candidate/valid depots, duplicate checks and delivery results. |
| `long-haul-wildlife-kit` | Hazard loading, crossing motion, damage, direction and reset. |

### Providers, controllers, adapters and proof

| Surface | Services |
|---|---|
| `long-haul-course-provider` | Prepared-cell admission, update/release, effects and patch snapshot lifecycle. |
| `long-haul-world-patch-preparation-controller` | Focus, desired/prefetch sets, budgets, cache, prime, readiness, release and reset. |
| `ordered-module-bootstrap-adapter` | Import-map bootstrap, dependency publication, ordered chunks and failure projection. |
| `procedural-course-generator` | Seeded branches, depots, wildlife, par and validation. |
| `course-cell-descriptor-generator` | Terrain, finite roads/signs/depots, vegetation, grass, rocks and obstacles. |
| `browser-keyboard-input-adapter` | Keydown/up, held state, one-shot state and frame clearing. |
| `three-webgl-presentation-adapter` | Renderer, scene, camera, streamed cells, truck, wildlife, resize, RAF and render. |
| `dom-scene-hud-adapter` | Title, help, settings, progress, HUD, pause, outcomes, toast and fault overlay. |
| `canvas-map-adapter` | Finite-course roads, depots, rejected yards, truck marker and DPR resize. |
| `web-audio-adapter` | Context unlock, engine/wind loops, cues and gain updates. |
| `browser-storage-adapter` | Settings and best score. |
| `atomic-domain-kits-smoke` | Product composition, profile/catalog policies, distant sectors and truck dynamics. |
| `long-haul-game-smoke` | Course generation, distant terrain, seams, truck and delivery. |
| `static-shell-smoke-and-ci` | Provider pin, syntax, tick and source checks. |
| `github-pages-deployment` | Static publication from `main`. |

## Census

```txt
Core kits installed:                  8
product DSKs installed:              12
engine-installed kits:               20
Core World effect providers:          1
standalone controllers:               1
browser/product adapters:             9
proof/deployment adapters:            4
total source-backed surfaces:        35
render surfaces:                      3
planned map-authority surfaces:      18
```

## Source-backed finding

`drawMap()` computes `worldW`, `worldH`, scale and origin exclusively from `course.bounds`. It draws only explored `course.edges`, discovered/checkpointed `course.depots`, the finite course origin and the current truck position. The world profile and course package now admit infinite travel, while `updateWorldStreaming()` can request arbitrary grid coordinates.

The map has no player-centered or sector-centered viewport, no zoom/coverage policy, no streamed-cell query, no atlas-content query, no projection digest and no first matching map-frame acknowledgement. Once the truck leaves finite course bounds, its projected marker can leave the visible canvas even though gameplay remains valid.

## Required authority

`the-long-haul-infinite-world-map-viewport-projection-authority-domain`

```txt
MapViewportAdmissionCommand
  -> bind run, profile, package, course, atlas,
     cell, sector, discovery and viewport revisions
  -> choose finite-overview or player-centered infinite window
  -> publish MapViewportAdmissionResult

MapContentProjectionCommand
  -> query accepted course and streamed-world content
  -> clip and deduplicate roads, depots, settlements and portals
  -> preserve discovery and rejection policy
  -> publish MapContentProjectionResult and digest

MapFrameCommitCommand
  -> project one accepted viewport/content generation
  -> keep the truck marker inside explicit clipping policy
  -> reject stale map work
  -> publish FirstInfiniteMapBoundFrameAck
```

## Planned surfaces

```txt
infinite-world-map-manifest-kit
map-view-admission-kit
map-viewport-policy-kit
map-camera-state-kit
map-content-query-kit
map-road-projection-kit
map-settlement-projection-kit
map-depot-projection-kit
map-cell-coverage-kit
map-sector-coverage-kit
map-discovery-filter-kit
map-marker-clipping-kit
map-player-anchor-kit
map-revision-digest-kit
map-frame-commit-kit
first-map-bound-frame-ack-kit
infinite-map-browser-fixture-kit
pages-map-parity-fixture-kit
```

## Boundary

Documentation only. Runtime JavaScript, Canvas2D behavior, WebGL behavior, gameplay, tests, workflows and deployment were not changed.