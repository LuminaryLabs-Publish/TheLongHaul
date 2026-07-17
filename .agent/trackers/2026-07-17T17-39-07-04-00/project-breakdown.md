# Project breakdown: best-run scope, durability and projection

**Timestamp:** `2026-07-17T17-39-07-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed repository head:** `3fb11448580405aaa864b106af5dd73e8f06283a`  
**Reviewed runtime source revision:** `189a586877db2bf3e0b1a7c74ae072b552b6fe9a`  
**Status:** `best-run-scope-durable-record-projection-authority-audited`

## Summary

The current Publish inventory contains 11 repositories. Ten are eligible after excluding `LuminaryLabs-Publish/TheCavalryOfRome`. All ten have central ledger records, root `.agent` state and `main` heads matching their documented repo-local heads. `LuminaryLabs-Publish/TheLongHaul` has the oldest synchronized central timestamp (`2026-07-17T07-38-20-04-00`) and is the only selected project.

The product computes a rich run result containing course identity, seed, par, adjusted time, score and penalties. `showResults()` then writes a reduced record to one global local-storage key only when `adjustedTime` is lower than the prior record. The stored record is not read or projected anywhere. It loses canonical course identity and scoring-policy revision, silently absorbs storage failures, and compares adjusted times across procedurally different courses without an explicit scope policy.

This audit documents the gap. It does not change runtime behavior or claim that the current global comparison is incorrect.

## Complete interaction loop

```txt
page load
  -> ordered bootstrap
  -> restore settings
  -> install 8 Core kits and 12 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

start
  -> generate and verify one course package
  -> prepare initial world cells
  -> reset Truck, Course, Run, Delivery, Wildlife and meters
  -> enter driving

driving
  -> admit held semantic vehicle controls
  -> sample Course and Run
  -> spend fuel and settle collision, wildlife and depot operations
  -> tick engine
  -> stream cells and update WebGL, map, HUD and audio

completion
  -> buildRunResult(course, run, delivery, meters)
  -> include courseId, seed, par, penalties, adjustedTime, versusPar and score
  -> transition to results
  -> project the current result
  -> read one global best-run key
  -> compare only adjustedTime
  -> write { adjustedTime, score, courseCode } when lower
  -> publish no storage result, readback receipt or visible best-run projection

retry/new course/title
  -> current result remains visible only for the result scene
  -> stored best record remains unprojected and policy-unversioned
```

## Domains in use

- Browser startup, ordered module loading, document, RAF, resize, keyboard, focus and storage lifecycle.
- Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger.
- Long Haul World Profile, World Atlas, Horizon LOD, Road Classes, Terrain Policy, Truck Dynamics, Delivery Contracts, Truck, Course, Run, Delivery and Wildlife.
- Procedural course generation, infinite-cell generation, patch preparation and Core World provider lifecycle.
- Result scoring, result projection and browser best-run persistence.
- Three.js WebGL, Canvas2D map, DOM UI/HUD/fault, WebAudio and local storage.
- Node smoke validation, GitHub Actions, GitHub Pages and `.agent` governance.

## Installed kits and offered services

### Core kits

1. `core-scene-kit`
   - scene registry
   - current scene
   - transition request
   - exit validation
   - transition identity
   - snapshot
2. `core-world-domain`
   - world registration and removal
   - uniform-grid partition
   - focus and active-cell lifecycle
   - provider ordering
   - validation and snapshot
3. `long-haul-input`
   - semantic actions
   - keyboard bindings
   - input contexts
   - driving intent
   - reset
4. `core-data-kit`
   - course schema
   - package envelope
   - digest verification
   - named random streams
   - random snapshot and restore
5. `core-simulation-kit`
   - fuel, truck-condition, cargo-condition and remaining-time meters
   - bounds, rates, locks, thresholds and reset
6. `core-camera-kit`
   - target state
   - position, look-point and FOV smoothing
   - snap and mode
   - portable descriptor
7. `core-graphics-kit`
   - batch registration
   - cell replace and remove
   - flush
   - bounds
   - release receipt
8. `core-transaction-ledger-kit`
   - ledger identity
   - apply-once operations
   - duplicate classification
   - metadata and snapshot

### Product DSKs

1. `long-haul-world-profile-kit`
   - world profile, extent, gameplay-cell, horizon-LOD and atlas-target policy
   - configure, snapshot and reset
2. `long-haul-world-atlas-kit`
   - macro-sector generation
   - biome density descriptor
   - settlement registry
   - edge portals and road registry
   - sector query, snapshot and reset
3. `long-haul-horizon-lod-policy-kit`
   - quadtree content, terrain resolution, forest, road, settlement and collision policy
   - configure, snapshot and reset
4. `long-haul-road-class-catalog-kit`
   - road-class catalog
   - surface, grade, curvature and jump-weight policy
   - get, list, register, snapshot and reset
5. `long-haul-terrain-policy-kit`
   - terrain octaves
   - landform density
   - road flattening
   - jump-profile catalog
   - configure, snapshot and reset
6. `long-haul-truck-dynamics-profile-kit`
   - powertrain
   - drag and resistance
   - steering and grip
   - suspension and air control
   - boost
   - configure, snapshot and reset
7. `long-haul-delivery-contract-catalog-kit`
   - contract-type catalog
   - job policy
   - get, list, register, snapshot and reset
8. `long-haul-truck-kit`
   - truck state
   - road-vehicle kinematics
   - drift, contact, suspension and air control
   - input, impulse, teleport and recovery pose
   - snapshot and load
9. `long-haul-course-kit`
   - course package state
   - exploration and discovered depots
   - route query and sample
   - reset, snapshot and load
10. `long-haul-run-kit`
    - run state and clock
    - distance, speed, off-road time and penalties
    - collision, stuck detection and recovery
    - completion and failure
    - snapshot and load
11. `long-haul-delivery-kit`
    - candidate and valid depots
    - depot evaluation and duplicate checks
    - delivery result
    - reset, snapshot and load
12. `long-haul-wildlife-kit`
    - hazard load
    - crossing motion
    - damage radius and direction
    - reset, snapshot and load

## Providers, controllers and adapters

### World provider

- `long-haul-course-provider`
  - prepared-cell admission
  - update and release
  - effect descriptor
  - patch snapshot and restore
  - reset

### Controller

- `long-haul-world-patch-preparation-controller`
  - focus and desired set
  - prefetch
  - generation and activation budgets
  - cache, prime, ready patches, release, snapshot and reset

### Browser/product adapters

- `ordered-module-bootstrap-adapter`
- `procedural-course-generator`
- `course-cell-descriptor-generator`
- `browser-keyboard-input-adapter`
- `three-webgl-presentation-adapter`
- `dom-scene-hud-adapter`
- `canvas-map-adapter`
- `web-audio-adapter`
- `browser-storage-adapter`

Their services cover ordered loading, course generation, cell descriptors, held and one-shot input, WebGL rendering, DOM scenes and HUD, finite-course map projection, audio lifecycle, settings storage and best-run storage.

### Proof and deployment adapters

- `atomic-domain-kits-smoke`
- `long-haul-game-smoke`
- `static-shell-smoke-and-ci`
- `github-pages-deployment`

## Source-backed best-run finding

`buildRunResult()` produces:

```txt
courseId
seed
validDepotId
rawTime
distance
parTime
parDistance
depotsChecked
collisions
cargoCondition
truckCondition
penaltyTotal
cargoPenalty
damagePenalty
distancePenalty
adjustedTime
versusPar
score
```

`showResults()` stores only:

```txt
adjustedTime
score
courseCode
```

under:

```txt
the-long-haul-best-v2
```

Current boundaries:

- The comparison scope is one global record across all generated courses.
- The comparison key is `adjustedTime`, not `versusPar`, rating rank, course identity or a versioned composite.
- `courseId`, full seed, par values, penalties and scoring-policy revision are not persisted.
- Storage parse and write failures are silently swallowed.
- The stored record is never read into title, results, HUD or map presentation.
- No durable commit receipt, readback verification, migration result, reset result or matching visible-frame acknowledgement exists.

## Proposed authority

**Proposed, not implemented:**

`the-long-haul-best-run-scope-durable-record-projection-authority-domain`

```txt
BestRunPolicyAdmissionCommand
  -> choose course, seed-family, scoring-revision or global scope
  -> BestRunPolicyResult

BestRunCandidateCommand
  -> bind complete RunResult and scoring revision
  -> classify better, equal, worse, incomparable or invalid
  -> BestRunCandidateResult

BestRunCommitCommand
  -> write versioned record
  -> read back and verify
  -> BestRunCommitResult

BestRunRestoreCommand
  -> parse, validate and migrate compatible records
  -> BestRunRestoreResult

BestRunProjectionCommitCommand
  -> project accepted record and comparison context
  -> BestRunFrameDigest
  -> FirstBestRunBoundFrameAck
```

### Proposed coordinating surfaces

1. `best-run-policy-manifest-kit`
2. `best-run-scope-identity-kit`
3. `best-run-record-schema-kit`
4. `best-run-scoring-revision-kit`
5. `best-run-candidate-admission-kit`
6. `best-run-comparison-kit`
7. `best-run-incomparable-result-kit`
8. `best-run-durable-commit-kit`
9. `best-run-readback-verification-kit`
10. `best-run-storage-failure-result-kit`
11. `best-run-restore-admission-kit`
12. `best-run-migration-kit`
13. `best-run-reset-kit`
14. `best-run-projection-kit`
15. `best-run-frame-digest-kit`
16. `first-best-run-bound-frame-ack-kit`
17. `best-run-browser-fixture-kit`
18. `pages-best-run-parity-fixture-kit`

## Validation boundary

Documentation only. Runtime JavaScript, HTML, CSS, scoring, local storage, gameplay, rendering, tests, workflows and deployment are unchanged. No data-loss incident, preferred comparison scope, durable commit, migration correctness, visible best-run feature or production readiness is claimed.