# Next steps

## Plan ledger

**Goal:** replace one variable simulation tick per RAF callback with bounded fixed-step admission and revision-bound rendering.

- [ ] Add `ClockRevision`, `HostFrameId`, `SimulationRevision` and `VisibilityRevision`.
- [ ] Introduce one monotonic clock adapter that owns first-frame and resume baselines.
- [ ] Replace direct variable `engine.tick(dt)` with a fixed-step accumulator.
- [ ] Select and version `fixedStepSeconds`.
- [ ] Add a finite `maxSubstepsPerHostFrame` budget.
- [ ] Retain residual accumulator time between callbacks.
- [ ] Define maximum accumulated debt and overload behavior.
- [ ] Publish a receipt whenever time is intentionally discarded.
- [ ] Keep pause and non-driving routes from accumulating gameplay debt.
- [ ] Add explicit `visibilitychange` settlement and resume-baseline behavior.
- [ ] Bind input sampling to an accepted host frame and fixed-step sequence.
- [ ] Publish one `SimulationStepResult` per accepted engine tick.
- [ ] Publish `HostFrameResult` with step count, residual, interpolation and overload state.
- [ ] Add previous/current simulation snapshots for presentation interpolation.
- [ ] Bind Three.js, Canvas2D, DOM and audio projections to accepted revisions.
- [ ] Add `FirstClockBoundFrameAck`.
- [ ] Add controlled 30, 60, 90 and 120 Hz fixtures.
- [ ] Add 20, 15, 10 and 5 Hz low-cadence fixtures.
- [ ] Add long-stall, substep-budget and discarded-time fixtures.
- [ ] Add pause, blur, hidden, visible, retry and title-transition clock fixtures.
- [ ] Compare same-seed scripted run snapshots across callback rates.
- [ ] Add source, root-artifact and deployed Pages clock parity proof.

## Retained work

Browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback remain open in their timestamped audit families.
