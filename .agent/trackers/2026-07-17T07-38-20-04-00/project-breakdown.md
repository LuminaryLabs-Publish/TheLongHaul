# Project breakdown: map-open input context and focus ownership

**Timestamp:** `2026-07-17T07-38-20-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed repository head:** `d868fdc0758934a9be4fd70cc5ba479deced6398`  
**Status:** `map-open-input-context-focus-authority-audited`

## Summary

The full current `LuminaryLabs-Publish` inventory contains 11 repositories. Ten are eligible after excluding `LuminaryLabs-Publish/TheCavalryOfRome`. Every eligible repository has a central ledger, root `.agent` state and a `main` head matching its documented repo-local head. TheLongHaul was selected as the oldest synchronized eligible repository using its prior central timestamp `2026-07-17T01-01-09-04-00`.

The focused audit isolates map-mode interaction ownership. `KeyM` opens a large paper-map overlay, but the driving frame continues reading held throttle, brake, steering and boost keys, applying truck input, sampling the run, spending fuel, streaming world cells and rendering the world. The map surface only toggles CSS and `aria-hidden`; it has no admitted map session, input-context policy, focus destination, announcement result, close settlement or first matching-frame acknowledgement.

This does not prove that live driving while the map is open is wrong. It proves that the product has no explicit authority deciding whether map mode is live-driving, input-restricted or simulation-suspended, and no executable proof that keyboard, focus and visible map state agree.

## Interaction loop

```txt
page load
  -> import Three.js and pinned Nexus Engine
  -> load bootstrap and eleven ordered chunks
  -> install 8 Core kits and 12 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

Start the Haul
  -> generate and verify the course package
  -> prepare the initial cell window
  -> register the Core World provider
  -> enter driving

Driving frame
  -> read held throttle, brake, steer and boost keys
  -> submit Core Input and Truck input
  -> sample Course and Run
  -> spend fuel and settle interactions
  -> tick engine domains
  -> stream cells, update camera/HUD/audio and render

Map open
  -> consume KeyM after driving input was already submitted
  -> invert mapOpen
  -> toggle panel class and aria-hidden
  -> retain the driving scene and keyboard evidence
  -> continue truck, run, streaming, camera, HUD and audio updates
  -> draw Canvas2D map and WebGL world

Map close / pause / outcome
  -> KeyM closes the panel
  -> Escape pauses and forcibly closes the map
  -> completion, failure and world reset close the map
  -> no map-session settlement or focus restoration result is published
```

## Domains in use

Browser startup, ordered module loading, document lifecycle, RAF, resize, keyboard, focus and storage; Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger; Long Haul World Profile, World Atlas, Horizon LOD, Road Classes, Terrain Policy, Truck Dynamics, Delivery Contracts, Truck, Course, Run, Delivery and Wildlife; procedural course generation; infinite gameplay-cell terrain generation; macro-sector generation; world-patch preparation; Core World provider lifecycle; Three.js WebGL; Canvas2D field map; DOM menu/HUD/fault projection; WebAudio; Node smoke, GitHub Actions, Pages and central governance.

## Kits and offered services

### Engine-installed kits

| Kit | Services |
|---|---|
| `core-scene-kit` | Scene registry, current scene, exits, transition requests, transition identity and snapshots. |
| `core-world-domain` | World registration/removal, partitioning, focus, active cells, provider ordering, validation and snapshots. |
| `long-haul-input` | Semantic actions, keyboard bindings, contexts, driving intent and reset. |
| `core-data-kit` | Schemas, package envelopes, digests, named random streams and random snapshot restore. |
| `core-simulation-kit` | Fuel, truck, cargo and time meters; bounds, rates, locks, thresholds and reset. |
| `core-camera-kit` | Camera targets, smoothing, snap, mode and portable descriptors. |
| `core-graphics-kit` | Instance batches, cell writes/removals, flush, bounds and release receipts. |
| `core-transaction-ledger-kit` | Apply-once operations, duplicate classification, metadata and snapshots. |
| `long-haul-world-profile-kit` | Extent, gameplay-cell, atlas and horizon policies; configure, snapshot and reset. |
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
planned map-mode surfaces:           18
```

## Source-backed finding

`preTickDriving()` calculates held driving controls and submits them to Core Input and the Truck before consuming `KeyM`. Opening the map therefore occurs after the current frame's driving intent, course/run sampling and fuel spending have already been admitted. Subsequent frames continue the same path because the current scene remains `driving`.

`updateMapPanel()` only toggles the `open` CSS class and `aria-hidden`. The map is an `aside`, receives no focus, publishes no live announcement, installs no map input context and has no close/restore result. `Escape` routes through pause, while M closes the panel, but those paths do not share a map-session identity.

No user-facing failure was reproduced. The gap is missing policy and proof: live driving, restricted driving and suspended simulation are all plausible product choices, but the runtime does not name or settle one.

## Required authority

`the-long-haul-map-open-input-context-focus-authority-domain`

```txt
MapModeAdmissionCommand
  -> bind route, run, input, map, viewport and focus revisions
  -> choose live-driving, restricted-driving or suspended policy
  -> publish MapModeAdmissionResult

MapInputContextCommitCommand
  -> activate the accepted keyboard context
  -> mask or preserve driving actions according to policy
  -> publish MapInputContextResult

MapFocusCommitCommand
  -> announce the map state
  -> move or retain focus explicitly
  -> publish MapFocusCommitResult

MapModeSettlementCommand
  -> settle M, Escape, pause, outcome, title and reset exactly once
  -> restore the prior input/focus context
  -> publish MapModeSettlementResult
  -> publish FirstMapModeBoundFrameAck
```

## Planned surfaces

```txt
map-mode-manifest-kit
map-session-identity-kit
map-mode-admission-kit
map-mode-policy-kit
map-input-context-kit
map-driving-action-mask-kit
map-simulation-policy-kit
map-focus-target-kit
map-announcement-kit
map-close-command-kit
map-mode-settlement-kit
map-focus-restoration-kit
map-route-retirement-kit
map-revision-digest-kit
map-frame-commit-kit
first-map-mode-bound-frame-ack-kit
map-mode-browser-fixture-kit
pages-map-mode-parity-fixture-kit
```

## Boundary

Documentation only. Runtime JavaScript, HTML, CSS, gameplay, input, focus, Canvas2D, WebGL, tests, workflows and deployment were not changed.