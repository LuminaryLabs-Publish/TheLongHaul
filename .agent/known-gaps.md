# Known gaps

## Clock identity and admission

- RAF callback timestamps have no `HostFrameId` or `ClockRevision`.
- `previousTime` is a host-local mutable number rather than published clock state.
- First-frame and resume baselines are implicit.
- Negative, duplicated, stale or retired timestamps have no typed rejection result.
- The 1 ms floor and 1/15 second cap are not versioned policies.

## Fixed-step simulation

- The host executes exactly one variable engine tick per callback.
- No fixed simulation quantum is declared.
- No accumulator retains wall time between callbacks.
- No residual time is published.
- No maximum substep budget exists.
- No ordered `SimulationStepResult` receipts exist.
- Same seed and input timeline are not proven cadence-independent.

## Overload and lost time

- Callback intervals above 1/15 second are capped.
- Excess time is not classified as deferred, discarded, suspended or failed.
- No accumulated-debt limit exists.
- No overload state or recovery result exists.
- No discarded-time receipt exists.
- Sustained callback rates below 15 FPS can admit less than one simulation second per wall second.

## Pause and visibility

- Pause behavior does not share an explicit clock settlement result.
- The host has no `visibilitychange` clock owner.
- Hidden time has no explicit accumulate, discard or suspend policy.
- Resume does not publish a new baseline receipt.
- Late callbacks after retirement have no clock rejection contract.

## Render coherence

- Rendered frames do not identify accepted simulation revisions.
- No previous/current simulation snapshot pair exists for interpolation.
- No interpolation alpha is published.
- Truck and camera smoothing use callback-dependent variable `dt`.
- WebGL, Canvas2D, DOM and audio projections do not publish one shared host-frame result.
- No `FirstClockBoundFrameAck` exists.

## Validation

- No package manifest or executable test command exists.
- No controlled RAF harness exists.
- No multi-cadence same-seed gameplay trace exists.
- No low-FPS or long-stall fixture exists.
- No pause/visibility clock fixture exists.
- No overload or discarded-time trace exists.
- No simulation-to-visible-frame revision fixture exists.
- No source-to-artifact-to-Pages clock parity proof exists.

## Retained gaps

The earlier browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback gaps remain valid in their timestamped audit families.
