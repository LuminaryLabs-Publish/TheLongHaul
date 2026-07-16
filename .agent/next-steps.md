# Next steps

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Plan ledger

**Goal:** implement one accessible read model that keeps continuous telemetry useful but quiet, announces meaningful accepted events, and owns route focus through the first matching visible frame.

- [ ] Add `AccessibleStateRevision`, `RouteRevision`, `RunGeneration`, `FocusRevision` and `VisibleFrameRevision` to the projection boundary.
- [ ] Derive one immutable `AccessibleReadModel` from accepted Core Scene, simulation, vehicle, delivery, condition and map state.
- [ ] Remove frame-rate telemetry from the broad live-region contract.
- [ ] Keep timer, speed, road and condition state queryable through stable labeled groups.
- [ ] Define timer and condition threshold policies.
- [ ] Coalesce and throttle semantic telemetry changes.
- [ ] Add stable `SemanticEventId`, priority and deduplication keys for penalties, depot results, recovery, completion and failure.
- [ ] Give interaction-availability changes one accepted announcement result.
- [ ] Give course generation explicit progress role, value and status semantics.
- [ ] Give toasts a dedicated status/alert adapter rather than relying on arbitrary text mutation.
- [ ] Make `updateSceneUi()` publish accepted route semantics in addition to visual classes.
- [ ] Mark inactive route surfaces hidden and inert.
- [ ] Move focus to one stable route heading or primary action after route acceptance.
- [ ] Record overlay invokers and restore focus when settings, help or pause closes.
- [ ] Give results and loss one terminal focus and announcement transaction.
- [ ] Publish a state-bound game-canvas alternative.
- [ ] Publish a structured map summary bound to the drawn map revision.
- [ ] Reject stale, duplicate and retired semantic projections.
- [ ] Publish `AccessibilityProjectionResult`.
- [ ] Publish `FirstAccessibleRouteFrameAck` and `FirstVisualAccessibleConvergenceAck`.
- [ ] Add keyboard-only and focus-order fixtures for every route.
- [ ] Add accessibility-tree snapshots for title, generation, driving, map, pause, settings, results and loss.
- [ ] Add live-region cadence fixtures under 60 Hz driving.
- [ ] Add screen-reader transcripts for penalties, interaction, delivery and failure.
- [ ] Add 200% text, forced-colors and reduced-motion checks.
- [ ] Compare source, root artifact and deployed Pages accessibility evidence.

## Ordered implementation

### 1. Read model

Derive structured semantic state from accepted engine resources and host state. Do not read gameplay meaning back from rendered DOM strings.

### 2. Route and focus

Extend route projection with explicit inactive-screen settlement, focus targets, invoker capture and restoration receipts.

### 3. Telemetry and announcements

Separate queryable telemetry from discrete semantic events. Define thresholds, cadence, priority and deduplication before wiring live regions.

### 4. Canvas and map alternatives

Publish concise run and map summaries that cite the same revisions as the visible WebGL and Canvas2D frames.

### 5. Acknowledgements

Acknowledge the first accessible route frame and the first visual/accessible converged frame after each accepted route or run generation.

### 6. Proof

Run browser accessibility-tree, keyboard, focus, announcement, text-scale, forced-color and lifecycle fixtures against source, artifact and Pages.

## Retained work

Input-action convergence, host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback remain open in their timestamped audit families.