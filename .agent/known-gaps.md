# Known gaps

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Plan ledger

**Goal:** keep the accessibility projection boundary explicit until route, focus, telemetry, announcements, alternatives and frame proof are implemented.

- [x] Trace the current semantic projection paths.
- [x] Separate continuous telemetry from discrete gameplay events.
- [x] Record identity, route, focus, announcement, canvas and proof gaps.
- [ ] Implement and execute the missing authority.

## Accessible-state identity

- No `AccessibleStateRevision` identifies the semantic state currently projected.
- No immutable `AccessibleReadModel` joins route, run, vehicle, delivery, condition and map state.
- Semantic DOM mutations do not cite accepted engine revisions.
- No stale or duplicate accessibility projection rejection exists.
- Retry, new course and title return have no semantic-generation retirement receipt.

## Continuous HUD telemetry

- `#hud` is one `aria-live="polite"` region.
- `updateHud()` rewrites multiple descendants during every driving frame.
- Timer, speed, road, fuel, damage, cargo, depot count, penalties, recovery and prompt share one live policy.
- No cadence, threshold, coalescing or deduplication policy exists.
- No explicit distinction exists between queryable telemetry and announceable events.
- No user-requested telemetry summary command exists.

## Route and focus

- `updateSceneUi()` changes `.active` classes but publishes no semantic route result.
- Inactive route surfaces have no explicit `inert` settlement.
- Route entry has no stable focus target.
- Help, settings and pause do not record an invoker for focus restoration.
- Closing overlays has no focus-restoration result.
- Results and loss have no terminal focus transaction.
- Route focus changes have no first matching visible-frame acknowledgement.

## Progress and discrete announcements

- Course generation has visual percent and phases but no explicit progress role/value result.
- Toasts mutate text and classes without a dedicated status/alert policy.
- Penalties have no stable semantic event identity or deduplication key.
- Interaction eligibility has no transition result.
- Final-minute and critical-condition thresholds have no announcement policy.
- Delivery accepted, results and failure have no typed announcement result.
- Announcement priority and interruption policy are absent.

## Canvas and map alternatives

- The game canvas has only a static label.
- No state-bound summary communicates current route, road, objective, interaction or critical condition.
- The map canvas has no structured semantic summary tied to the drawn map revision.
- Map exploration, depot discovery and rejection state are visual-only.
- No `CanvasAlternativeResult` or `MapSemanticSummaryResult` exists.

## Visible-frame coherence

- DOM semantics, Canvas2D map and WebGL world do not share an accessible-frame revision.
- A route or run change can render without a matching semantic acknowledgement.
- A semantic mutation can occur without proving the matching visual frame.
- No `AccessibilityProjectionResult` exists.
- No `FirstAccessibleRouteFrameAck` exists.
- No `FirstVisualAccessibleConvergenceAck` exists.

## Validation

- No package manifest or executable test command exists.
- No keyboard-only route fixture exists.
- No accessibility-tree snapshot harness exists.
- No live-region cadence fixture exists.
- No screen-reader announcement transcript exists.
- No focus-entry/restoration fixture exists.
- No progress semantics fixture exists.
- No game-canvas or map alternative fixture exists.
- No 200% text, forced-colors or reduced-motion proof exists.
- No source-to-artifact-to-Pages accessibility parity proof exists.

## Retained gaps

The earlier input-action convergence, host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback gaps remain valid in their timestamped audit families.

## Completion boundary

Do not claim accessibility readiness until continuous telemetry is bounded, meaningful events announce exactly once, routes own focus and inactive semantics, canvases expose revision-bound alternatives, stale work is rejected, and source, artifact and Pages prove matching accessible and visible frames.