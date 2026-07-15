# Next steps

## Plan ledger

**Goal:** preserve deterministic course content while moving generation execution behind a bounded, receipt-backed scheduler and one atomic ready transition.

- [ ] Add `GenerationAttemptId`, `GenerationRevision` and `QueueRevision`.
- [ ] Replace host-local closure ownership with typed work-unit descriptors and dependency IDs.
- [ ] Classify each of the 31 units as lightweight, bounded-main-thread, internally-yielding or worker-eligible.
- [ ] Add a versioned frame-budget policy.
- [ ] Execute zero or more eligible units per host frame within the admitted budget.
- [ ] Publish actual unit elapsed cost and deferred-work receipts.
- [ ] Replace equal unit-count progress with accepted weighted progress.
- [ ] Add hidden-tab suspend/resume and explicit cancellation results.
- [ ] Reject stale work from retired or superseded attempts.
- [ ] Track and release every partial world, geometry, material, texture, hazard and presentation resource.
- [ ] Require route, Core World, depot, hazard and truck validation receipts before ready adoption.
- [ ] Start Core Simulation exactly once from an accepted `GenerationReadyResult`.
- [ ] Add `FirstPlayableGenerationFrameAck`.
- [ ] Add 30/60/120 Hz cadence and CPU-throttling browser fixtures.
- [ ] Add PerformanceObserver long-task evidence.
- [ ] Add generation failure, cancellation, retry and visibility fixtures.
- [ ] Verify source, root artifact and Pages fingerprints against one generation revision.

## Retained work

Motion preference, pause suspension, delivery terminal settlement and earlier course-generation admission/rollback remain open in their timestamped audit families.