# Known gaps

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Plan ledger

**Goal:** keep proof-only Core capabilities separate from playable ownership until provider, state, service, render, and release parity are implemented.

- [x] Trace both browser entry points and their Nexus Engine pins.
- [x] Map all overlapping truth owners.
- [x] Record semantic, migration, rendering, interaction, and release gaps.
- [ ] Implement and execute the missing adoption authority.

## Provider and profile identity

- `index.html` pins Nexus Engine `c5548de504072bf09eb68986b98aca0292903803`.
- `core-integration.html` pins Nexus Engine `b941c9b2995e3449c6987908657753e2cf2df242`.
- No `CoreCapabilityAdoptionManifest` identifies the accepted provider and profile.
- No profile digest is published by both entry points.
- No release result rejects a mixed provider/profile generation.
- README ownership claims are not tied to an executable adoption result.

## Core Data and course admission

- The playable generator does not import the course schema.
- The playable world is built before any Core Data envelope verification.
- The package digest is smoke-only.
- Inline `makeRng` remains the playable randomness owner.
- Named stream cursors are not stored with playable retry or replay state.
- No mapping defines which random draws belong to each named stream.
- No same-seed canonical package parity fixture exists.

## Gameplay meters and migration

- Playable remaining time lives in custom run state.
- Playable fuel/truck/cargo live in Resource Pressure.
- The Core profile introduces separate resource meters.
- The playable time limit is 360 seconds; the smoke profile uses 300 seconds.
- Playable IDs are `fuel`, `truck`, and `cargo`.
- Core profile IDs are `fuel`, `truck-condition`, `cargo-condition`, and `remaining-time`.
- No canonical meter schema exists.
- No state migration or rollback result exists.
- No threshold parity fixture exists.
- No duplicate truth-owner rejection exists.

## Camera adoption

- Core Camera produces a portable descriptor only in the smoke.
- The playable host directly smooths and mutates the Three.js camera.
- No camera descriptor adoption result exists.
- No descriptor/frame revision binding exists.
- No retirement rule prevents host-only camera mutation after adoption.

## Graphics and streamed-instance adoption

- Core Graphics batch descriptors are smoke-only.
- Playable vegetation, grass, signs, and depot props remain direct Three.js owners.
- Core release receipts are not consumed by the renderer.
- No asset/material mapping binds Core batch IDs to Three.js resources.
- No batch/world-cell/frame convergence result exists.
- No visible-count or release-parity fixture exists.

## Patch preparation and Core World

- The patch-preparation controller is created only in the smoke.
- Playable Core World providers use their existing generation/activation path.
- No bridge maps prepared/ready patches to provider activation.
- No shared generator version or settings hash is admitted by the playable host.
- No active-versus-prefetch parity result exists.

## Transaction ledger and terminal operations

- Core Transaction Ledger is smoke-only.
- Playable penalties use a custom `penaltyLedger` object.
- Delivery duplicate checks use separate flags and lists.
- Recovery, collisions, wrong depots, and terminal delivery have no shared transaction-ID policy.
- No migration preserves already-applied operations.
- No fixture proves legacy and Core duplicate classifications agree.

## Smoke/playable parity

- The seven smoke checks do not execute inside the playable engine.
- No shared fixture ID or manifest digest connects the two results.
- No full same-seed run comparison exists.
- No canonical state hash compares the two compositions.
- No `CoreParityVerificationResult` exists.

## Visible-frame evidence

- No accepted Core Camera revision is bound to the visible camera.
- No accepted Core Graphics revision is bound to visible instances.
- No accepted patch-preparation revision is bound to visible cells.
- No accepted Core profile revision is bound to `renderer.render()`.
- No `FirstCoreBoundPlayableFrameAck` exists.

## Deployment and validation

- No package manifest or executable project test command exists.
- No release manifest records both browser entry points and their provider pins.
- No source-to-artifact-to-Pages Core profile digest comparison exists.
- No deployed semantic parity fixture exists.
- No cache-generation rejection fixture exists.
- The new smoke was not executed during this documentation audit.

## Retained gaps

The earlier WebGL recovery, accessibility, input-action convergence, host clock, audio lifecycle, generation scheduling, motion preference, pause suspension, delivery settlement, and course-generation rollback gaps remain valid in their timestamped audit families.

## Completion boundary

Do not claim that promoted Core Data, Simulation meters, Camera, Graphics, Transaction Ledger, or patch preparation own TheLongHaul gameplay until both entry points share one accepted provider/profile manifest, playable state migrates atomically, duplicate owners are retired, shared semantic fixtures pass, and a matching gameplay frame is acknowledged across source, artifact, and Pages.