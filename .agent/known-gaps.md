# Known gaps

**Timestamp:** `2026-07-17T07-38-20-04-00`

## Map session identity

- `mapOpen` is one mutable boolean with no session or revision identity.
- Duplicate/stale M evidence has no typed classification.
- Pause, outcome, title and reset close the map as unrelated side effects.
- No `MapModeSettlementResult` exists.

## Input ownership

- Held driving controls are admitted before the M toggle is consumed.
- The driving scene remains active while the map is open.
- Raw browser key state bypasses a map-specific Core Input context.
- No accepted semantic action mask exists.
- Live, restricted and suspended policies are not named.

## Simulation and world policy

- Truck, Run, meters, collision, wildlife and delivery continue by implicit behavior.
- World streaming continues without a map policy result.
- No clock/scheduler result proves whether map-open time should count.
- No product contract states whether hazards can settle while the map obscures the view.

## Focus and accessibility

- The map only changes `aria-hidden`.
- No focus destination or close control is admitted.
- No map-open/close announcement result exists.
- Focus restoration is not bound to the map session.
- Escape combines map retirement with pause without a shared settlement result.

## Frame convergence

- DOM, Canvas2D, WebGL and gameplay do not consume one map-mode generation.
- No frame digest contains policy, input context and focus revisions.
- No `FirstMapModeBoundFrameAck` exists.
- Late map frames after route retirement have no rejection receipt.

## Validation and deployment

- No held-control map-open browser fixture exists.
- No M/Escape race fixture exists.
- No route-outcome or reset settlement fixture exists.
- No keyboard-only focus/announcement fixture exists.
- No source/artifact/Pages map-mode parity fixture exists.
- `npm test` was not run during this documentation audit.

## Retained gaps

The infinite map viewport/projection and atlas/cell-content adoption gaps remain unresolved. Runtime faults, focus release, WebGL recovery, clock, pause, accessibility, audio, generation, delivery and rollback gaps remain preserved in their prior audit families.

## Completion boundary

Do not claim map-mode input correctness, simulation policy correctness, focus restoration, first matching-frame proof, artifact parity, Pages parity or production readiness until one admitted map session settles and is acknowledged.