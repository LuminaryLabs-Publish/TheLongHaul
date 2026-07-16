# Current audit: infinite-world atlas and gameplay-cell content adoption

**Timestamp:** `2026-07-16T19-39-24-04-00`  
**Reviewed pre-audit runtime head:** `189a586877db2bf3e0b1a7c74ae072b552b6fe9a`  
**Previous documented head:** `090d43a2c5fbebf0886d82eeb1455ee59d239536`  
**Status:** `infinite-world-atlas-cell-content-adoption-authority-audited`

## Summary

A new runtime commit removes the finite playable-disk contract. The profile, package schema, package payload and macro-sector generator now classify the world as infinite. Tests cover distant sectors and deterministic, finite, edge-matched far terrain.

The installed `long-haul-world-atlas-kit` is not an admitted input to the playable patch path. Gameplay cells are still generated from the finite course object, so distant road, settlement and portal content has no accepted owner, provider result or visible-frame acknowledgement.

## Goal

Create one authority that turns infinite extent, macro-sector state and gameplay-cell demand into an immutable content plan committed and rendered under the same generation.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 1

IntoTheMeadow:    identical
TheLongHaul:      ahead by 1 commit, selected
HorrorCorridor:   identical
AetherVale:       identical
ZombieOrchard:    identical
TheUnmappedHouse: identical
MyCozyIsland:     identical
TheOpenAbove:     identical
PhantomCommand:   identical
PrehistoricRush:  identical
TheCavalryOfRome: excluded
```

## Complete interaction loop

```txt
page load
  -> import Three.js and pinned Nexus Engine
  -> load bootstrap and eleven ordered chunks
  -> install 8 Core kits and 12 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

Start the Haul
  -> generate one finite five-branch course
  -> wrap it in an infinite-extent verified package
  -> prepare the initial 3x3 gameplay-cell window
  -> reset Truck, Course, Run, Delivery, Wildlife and meters
  -> register the Core World course provider
  -> enter driving

Driving frame
  -> submit input and surface evidence
  -> tick Truck, Course, Run, Delivery and Wildlife
  -> move Core World focus
  -> request desired/prefetch gameplay cells
  -> create cell descriptors from the finite course object
  -> commit terrain, finite-course content and instances
  -> update camera, HUD, map and audio
  -> render Three.js

Far travel
  -> arbitrary grid cells remain valid
  -> terrain remains deterministic, finite and edge-matched
  -> finite course roads, depots and signs cease contributing
  -> atlas sectors can describe settlements and portals
  -> atlas state is not adopted into the playable patch or frame

Outcome
  -> inspect candidate depots
  -> deliver or fail
  -> score and retry/new-seed/title
```

## Domains in use

```txt
browser startup, ordered modules, document, RAF, resize, keyboard and storage
Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger
Long Haul World Profile, World Atlas and Horizon LOD Policy
Long Haul Road Classes, Terrain Policy and Truck Dynamics Profile
Long Haul Delivery Contract Catalog
Long Haul Truck, Course, Run, Delivery and Wildlife
finite-course generation and infinite terrain-cell generation
macro-sector generation
patch preparation and Core World provider lifecycle
Three.js WebGL, Canvas2D map, DOM UI/HUD/fault, WebAudio and storage
Node smoke, GitHub Actions, Pages and audit governance
planned infinite-world atlas/cell-content adoption authority
```

## Kits and offered services

### Engine-installed kits

| Kit | Services |
|---|---|
| `core-scene-kit` | Scenes, exits, transition requests, identity and snapshots. |
| `core-world-domain` | Worlds, partitions, focus, active cells, providers, validation and snapshots. |
| `long-haul-input` | Actions, keyboard bindings, contexts and driving intent. |
| `core-data-kit` | Schemas, package envelopes, digests and named randomness. |
| `core-simulation-kit` | Fuel, condition, cargo and time meters. |
| `core-camera-kit` | Target, smoothing, snap, mode and descriptors. |
| `core-graphics-kit` | Instance batches, cell writes/removals, flush, bounds and release. |
| `core-transaction-ledger-kit` | Apply-once, duplicate classification, metadata and snapshots. |
| `long-haul-world-profile-kit` | World profile, extent policy, cell/horizon/atlas policy, configure and reset. |
| `long-haul-world-atlas-kit` | Macro sectors, biomes, densities, settlements, portals, registries and snapshots. |
| `long-haul-horizon-lod-policy-kit` | Terrain resolution, forest/road/settlement representation and collision policy. |
| `long-haul-road-class-catalog-kit` | Width, grip, grade, curvature and jump weights. |
| `long-haul-terrain-policy-kit` | Terrain field, landform density, road shaping and jump profiles. |
| `long-haul-truck-dynamics-profile-kit` | Powertrain, resistance, steering, grip, suspension, air control and boost. |
| `long-haul-delivery-contract-catalog-kit` | Contract types and job policy. |
| `long-haul-truck-kit` | Truck state, kinematics, drift, suspension, air control, teleport and recovery. |
| `long-haul-course-kit` | Course package, exploration, discovery and route queries. |
| `long-haul-run-kit` | Time, distance, telemetry, penalties, recovery and outcomes. |
| `long-haul-delivery-kit` | Candidate/valid depots and delivery evaluation. |
| `long-haul-wildlife-kit` | Deterministic crossing hazards and motion. |

### Provider, controller, adapters and proof

| Surface | Services |
|---|---|
| `long-haul-course-provider` | Prepared-cell effects, update/release and patch state lifecycle. |
| `long-haul-world-patch-preparation-controller` | Desired/prefetch sets, budgets, cache, prime, release and snapshots. |
| `ordered-module-bootstrap-adapter` | Ordered startup and boot failure projection. |
| `procedural-course-generator` | Seeded five-branch course, depots, wildlife, scoring and validation. |
| `course-cell-descriptor-generator` | Terrain, finite-course roads/signs/depots, vegetation, grass and rocks. |
| `browser-keyboard-input-adapter` | Held and one-shot keyboard evidence. |
| `three-webgl-presentation-adapter` | Streamed world, truck/wildlife, camera, resize, RAF and render. |
| `dom-scene-hud-adapter` | Menu, generation, HUD, pause, outcomes and faults. |
| `canvas-map-adapter` | Course roads, depots, rejected yards and truck marker. |
| `web-audio-adapter` | Context, engine/wind loops and cues. |
| `browser-storage-adapter` | Settings and best score. |
| `atomic-domain-kits-smoke` | Product composition, policies, far sectors and truck dynamics. |
| `long-haul-game-smoke` | Course generation, far terrain, seams, truck and delivery. |
| `static-shell-smoke-and-ci` | Provider pin, syntax, tick and source checks. |
| `github-pages-deployment` | Static publication from `main`. |

## Source-backed finding

The profile now has `extent: "infinite"`, `playableRadius: null` and `boundaryFadeWidth: 0`. The course schema requires infinite extent, and the package carries `{ bounds: { mode: "infinite" } }`. The macro-sector generator admits distant sectors and can create settlements and four edge portals.

The generation path still calls `createCourseCellDescriptor(course, cell)`. That descriptor filters roads, depots and signs only from the finite course arrays. Far cells retain terrain, vegetation and grass, but no atlas-sector contribution is passed into the descriptor, provider, Core Graphics batches, Three.js cell host or map.

The source tests therefore prove infinite terrain continuity, not populated-world continuity.

```txt
infinite profile/package agreement: implemented
arbitrary Core World cell demand: implemented
distant finite deterministic terrain: tested
adjacent far terrain seams: tested
distant macro-sector generation: tested

atlas sector -> playable cell plan: absent
atlas roads -> surface query: absent
atlas settlements/portals -> provider: absent
horizon policy -> cell construction: absent
course/atlas ownership result: absent
WorldCellContentResult: absent
FirstAtlasBoundWorldFrameAck: absent
```

## Required authority

`the-long-haul-infinite-world-atlas-cell-content-adoption-authority-domain`

```txt
InfiniteWorldSectorAdmissionCommand
  -> bind profile, package, course, atlas, sector,
     cell, provider and run revisions
  -> prove extent/seed/generator agreement
  -> generate or retrieve one immutable sector result
  -> publish sector digest
  -> reject stale or mismatched work
  -> publish InfiniteWorldSectorAdmissionResult

InfiniteWorldCellContentPlanCommand
  -> enumerate overlapping sectors
  -> classify finite-course and atlas ownership
  -> derive terrain, roads, settlements, portals,
     vegetation, obstacles and horizon representation
  -> publish one content digest
  -> publish InfiniteWorldCellContentPlanResult

InfiniteWorldCellCommitCommand
  -> bind patch-preparation and provider generations
  -> commit exactly one matching content plan
  -> reject duplicate or retired work
  -> publish WorldCellContentResult
  -> render matching WebGL/map semantics
  -> publish FirstAtlasBoundWorldFrameAck
```

## Audit boundary

Documentation only. Runtime, gameplay, tests, rendering, workflows and deployment were not changed. `npm test` and browser/artifact/Pages fixtures were not run.
