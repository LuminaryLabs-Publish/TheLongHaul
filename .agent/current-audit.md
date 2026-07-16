# Current audit: Core capability adoption parity

**Timestamp:** `2026-07-16T07-39-04-04-00`  
**Reviewed pre-audit repository head:** `5367c558a8e77164631c62747f9e7bd1e0aa9ca5`  
**Status:** `core-capability-adoption-parity-authority-audited`

## Summary

TheLongHaul now contains a new Core integration profile and browser smoke in addition to its playable single-file game. The added profile demonstrates promoted Nexus Engine capabilities, but those capabilities are not installed or consumed by `index.html`.

The active audit isolates provider revision convergence, Core profile admission, migration from existing playable state owners, smoke/playable semantic parity, and first Core-bound gameplay-frame proof.

## Plan ledger

**Goal:** converge the proof-only Core profile and playable runtime into one accepted capability generation without changing game semantics accidentally.

- [x] Compare all eligible Publish repositories and select the sole runtime-ahead repository.
- [x] Inspect the three runtime-ahead commits and changed files.
- [x] Inspect playable kits, providers, adapters, and state ownership.
- [x] Inspect new Core kits, controller, smoke checks, and README claims.
- [x] Record semantic and provider divergence.
- [x] Preserve runtime and deployment unchanged.
- [ ] Implement one Core capability manifest and provider revision.
- [ ] Migrate state and retire duplicate owners only after parity proof.

## Source-backed inventory

```txt
playable entry: index.html
Core proof entry: core-integration.html
Core profile module: src/long-haul-core.mjs
playable Nexus Engine: c5548de504072bf09eb68986b98aca0292903803
smoke Nexus Engine: b941c9b2995e3449c6987908657753e2cf2df242
Three.js: 0.165.0
playable engine kits: 10
Core World providers: 2
browser/product adapters: 7
isolated Core profile kits: 5
standalone Core controller: 1
browser proof adapters: 1
deployment adapters: 1
total source-backed surfaces: 27
product render surfaces: 3
package manifest: absent
executable project test command: absent
```

## Interaction loops

### Playable

```txt
boot and route projection
  -> create existing playable engine and Three.js host
  -> generate a course with inline RNG
  -> stream Core World cells through existing providers
  -> drive, inspect five depots, settle one delivery
  -> update custom run state, Resource Pressure, penalties, scoring
  -> project WebGL, Canvas2D, DOM, audio, and storage
```

### Core proof

```txt
load core-integration.html
  -> create separate engine from createLongHaulCoreKits
  -> test named RNG replay
  -> test course envelope digest
  -> test resource meters
  -> test camera descriptor
  -> test instance-batch release
  -> test patch preparation
  -> test transaction apply-once
  -> project DOM rows
```

### Missing adoption

```txt
accepted Core proof
  -> no shared profile digest
  -> no playable bootstrap result
  -> no legacy-state migration result
  -> no duplicate-owner retirement result
  -> no semantic parity result
  -> no Core-bound gameplay frame acknowledgement
```

## Domains in use

```txt
browser lifecycle, keyboard, RAF, DOM smoke reporting
provider resolution and static release graph
Core Scene, Core World, Core Input, custom Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field,
Resource Pressure, Hazard Field, Telemetry
Core Data schemas/packages/random streams
Core Simulation resource meters
Core Camera smoothing
Core Graphics instance batches
Core Transaction Ledger
Core World patch preparation
course generation, delivery, scoring, retry, world streaming
Three.js WebGL, Canvas2D map, DOM HUD, WebAudio, storage
Core profile admission, migration, dual-owner rejection,
semantic parity, release parity, Core-bound frame proof
Pages deployment and audit governance
```

## Kits and services

```txt
Playable Core Scene: registry, transitions, exit validation, snapshots
Playable Core World: worlds, partition, focus, cells, providers, validation
Playable Core Input: actions, bindings, contexts, intent, reset
Long Haul Delivery: generation, depots, checks, retry, result, snapshots
Playable Core Simulation: timer, distance, penalties, recovery, terminal state
Vehicle Dynamics: heavy-truck kinematics, boost, impacts, bounds
Route Field: route markers/corridors and nearest-route queries
Resource Pressure: fuel, truck, cargo and bounded adjustments
Hazard Field: wildlife motion and collision
Telemetry: truck/run/condition/delivery history
Terrain provider: terrain cell lifecycle and snapshots
Course provider: roads/depots/signs/vegetation/obstacles lifecycle
Course generator: inline RNG, graph, par, validation, staged work
Keyboard adapter: key evidence and one-shot commands
Three.js adapter: renderer, direct camera/instances/cells/rigs/render
DOM adapter: routes, progress, HUD, outcomes, errors
Canvas adapter: map projection
WebAudio adapter: unlock, loops, cues
Storage adapter: settings, motion, best score
Core Data profile: schemas, envelopes, digests, named RNG, snapshots
Core Simulation meters: bounds, rates, locks, thresholds
Core Camera profile: smoothed portable pose descriptors
Core Graphics profile: batch descriptors, cell replacement/release receipts
Core Transaction Ledger: apply-once and duplicate classification
Patch preparation controller: desired, active, prefetch, cache, budgets, ready
Core smoke adapter: independent bootstrap and seven DOM checks
Pages adapter: static deployment from main
```

## Main finding

```txt
Core capabilities implemented in repository: yes
Core capabilities exercised in isolated smoke: yes
Core capabilities adopted by playable engine: no
provider revision convergence: no
canonical Core profile manifest: no
course envelope admission in playable generation: no
named RNG adoption in playable generation/retry: no
meter schema convergence: no
camera descriptor adoption: no
instance-batch adoption: no
patch controller/provider adoption: no
transaction-ledger adoption: no
legacy state migration: no
duplicate truth-owner rejection: no
smoke/playable semantic parity: no
FirstCoreBoundPlayableFrameAck: no
```

The new proof and playable runtime already disagree on provider revision, time-limit configuration, and meter identifiers. These differences may be intentional scaffolding, but they require one explicit adoption and migration result before Core ownership can be claimed for the playable game.

## Required authority

`the-long-haul-core-capability-adoption-parity-authority-domain`

```txt
CoreCapabilityAdmissionCommand
  -> bind release, playable, smoke, provider, profile,
     schema, RNG, meter, camera, batch, patch,
     ledger, artifact, deployment, and frame revisions
  -> publish one CoreCapabilityAdoptionManifest
  -> classify capability ownership
  -> reject incompatible or duplicate truth owners
  -> stage and atomically commit migration
  -> run shared semantic fixtures
  -> publish CoreCapabilityAdoptionResult
  -> publish FirstCoreBoundPlayableFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, HTML, CSS, imports, schemas, values, gameplay, rendering, audio, storage, workflows, and deployment were not changed or executed.