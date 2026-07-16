# Next steps

**Timestamp:** `2026-07-16T14-01-02-04-00`

## Intent

Turn the five installed policy DSKs into one exact product-policy generation consumed by the playable runtime.

## What needs to happen

### 1. Define policy identity

- [ ] Add `ProductPolicyGeneration` and `ProductPolicyDigest`.
- [ ] Include world, road, terrain, truck, and delivery revisions.
- [ ] Reject duplicate IDs, invalid ranges, missing references, and unsupported features.
- [ ] Publish `ProductPolicyAdmissionResult` before run creation.

### 2. Bind run and cache identity

- [ ] Add the policy digest to course package identity.
- [ ] Add it to run, cell, patch-preparation, provider, and snapshot identity.
- [ ] Reject cells, caches, callbacks, and results from retired policy generations.
- [ ] Rebuild or invalidate derived data after an accepted policy change.

### 3. Adopt truck dynamics first

- [ ] Change `createLongHaulTruckKit(N, options)` to accept the profile resource intentionally.
- [ ] Read one immutable profile snapshot per simulation step or admitted run.
- [ ] Replace hardcoded speed, acceleration, braking, drag, rolling resistance, steering, grip, suspension, and air-control constants.
- [ ] Preserve deterministic bounded substeps.
- [ ] Add default-profile parity and modified-profile behavior fixtures.

### 4. Adopt world, roads, and terrain

- [ ] Make course generation consume world radius and road-class records.
- [ ] Replace literal road widths, roughness, grade, curvature, and jump weighting.
- [ ] Make terrain generation consume octave, density, flattening, smoothing, and jump-profile policy.
- [ ] Make cell size, active radius, horizon bounds, LOD policy, and visual radius consume the world profile.
- [ ] Keep course validation bounded and deterministic.

### 5. Adopt delivery contracts

- [ ] Add `contractTypeId` and contract revision to delivery/run state.
- [ ] Support standard, fragile, express, lost-manifest, rough-road bonus, cross-region, and multi-stop semantics.
- [ ] Resolve candidate depots, distance, time, damage, road-class, and stop requirements from the accepted contract.
- [ ] Publish typed accepted/rejected contract results.

### 6. Publish proof

- [ ] Publish `FirstPolicyBoundRunAck` after course/run state uses one digest.
- [ ] Publish `FirstPolicyBoundFrameAck` after world, truck, HUD, map, and result projection use the same digest.
- [ ] Surface the digest in diagnostics without exposing implementation jargon in player UI.

### 7. Validation and deployment

- [ ] Add source tests proving every policy resource has a runtime consumer.
- [ ] Add deterministic default-policy parity fixtures.
- [ ] Add modified-policy fixtures that visibly and semantically change each subsystem.
- [ ] Add stale/mixed-generation rejection fixtures.
- [ ] Run `npm test`.
- [ ] Compare source, workflow artifact, and deployed Pages behavior.

## Retained work

The browser-focus held-input retirement audit remains open and should be implemented before control tuning. WebGL recovery, accessibility, clock, audio, motion, pause, delivery settlement, and rollback findings remain preserved in prior timestamped audit families.