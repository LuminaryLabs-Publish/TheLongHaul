# Next steps

**Timestamp:** `2026-07-18T15-38-25-04-00`

## Goal

Make near-world streaming focus cadence, desired membership, prefetch planning, pump work and visible-frame proof explicit while preserving deterministic terrain, obstacles, roads and active-cell behavior.

## Checklist

### 1. Add streaming generation identity

- [ ] Add course and near-world streaming generation IDs.
- [ ] Add stable near-cell and quantized direction keys.
- [ ] Reject focus, desired, prefetch and pump work from retired generations.
- [ ] Reset accepted keys atomically on retry, new course and title retirement.

### 2. Cache and diff the active window

- [ ] Build the 3x3 desired window only when the near-cell key changes.
- [ ] Retain immutable desired descriptors between cell transitions.
- [ ] Publish added, retained and released patch IDs.
- [ ] Preserve queued and ready patches when membership is retained.

### 3. Settle one prefetch plan

- [ ] Decide whether forward prefetch is controller-owned, product-owned or intentionally composed.
- [ ] Represent the product side strip as a named policy.
- [ ] Classify overlapping controller/product requests.
- [ ] Recompute only when the direction key or near-cell key changes.
- [ ] Publish one deterministic `PrefetchPlanResult`.

### 4. Admit pump work

- [ ] Consume `updateDesired()` and `pump()` results instead of discarding them.
- [ ] Pump only when queue or inflight state requires work.
- [ ] Publish started, retained-idle, blocked and budget-exhausted classifications.
- [ ] Bound work per accepted streaming generation.
- [ ] Record idle pump calls in internal diagnostics.

### 5. Bind Core World and hosts

- [ ] Add a `NearWorldStreamingDigest` containing desired, prepared, active and realized cell IDs.
- [ ] Compare Core World active cells with terrain host and instance-batch cells.
- [ ] Reject late ready work from a retired course generation.
- [ ] Publish `FirstNearWorldStreamingBoundFrameAck`.

### 6. Validate

- [ ] Add stationary 600-frame cadence fixture.
- [ ] Add within-cell movement fixture.
- [ ] Add cardinal and diagonal cell-transition fixtures.
- [ ] Add heading-only prefetch fixture.
- [ ] Add queue-empty and inflight pump fixtures.
- [ ] Add retry/new-course stale-work fixtures.
- [ ] Add browser allocation and frame-time profile.
- [ ] Run `npm test`.
- [ ] Compare source, artifact and Pages receipts.

## Retained work

Horizon patch/host convergence, best-run persistence, map projection, runtime faults, input/focus release, WebGL recovery, accessibility, clock, audio, generation readiness, pause, delivery and rollback remain separate unresolved audit families.