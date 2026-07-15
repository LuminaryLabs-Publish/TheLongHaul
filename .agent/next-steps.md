# Next steps

## Plan ledger

**Goal:** replace the split browser/Core Input path with one executable action map, explicit route contexts and typed action results.

- [ ] Add `InputGeneration`, `ActionMapRevision`, `ContextRevision`, `RouteRevision` and `EventId`.
- [ ] Make the browser keyboard adapter normalize events without executing gameplay commands.
- [ ] Use one executable binding table as the Core Input action manifest.
- [ ] Define explicit contexts for title, generating, driving, paused, settings, results and loss.
- [ ] Publish context activation and retirement results on every scene transition.
- [ ] Replace the mutable `keys` object with an immutable held-action snapshot.
- [ ] Publish keydown, repeat, keyup and cancellation receipts.
- [ ] Reject stale, duplicate, retired and out-of-context events.
- [ ] Publish throttle, brake, steer and boost through Core Input before Vehicle Dynamics consumes them.
- [ ] Publish camera, map, pause, interact, retry and recovery as one-shot `InputActionResult` values.
- [ ] Resolve the `KeyR` contradiction by declaring `retry` or changing executable behavior.
- [ ] Keep recovery as a distinct semantic action with explicit eligibility.
- [ ] Prevent focused range, switch and button controls from leaking into driving contexts.
- [ ] Cancel held actions on blur, visibility loss, pause, retry, title return and document retirement.
- [ ] Bind gameplay consumers to accepted input and run revisions.
- [ ] Add `FirstInputActionAck`.
- [ ] Add `FirstInputEffectFrameAck` across DOM, Canvas2D, WebGL and audio.
- [ ] Add held-key, one-shot, repeat and keyup fixtures.
- [ ] Add route-context and focus-target fixtures.
- [ ] Add blur, hidden, retry and stale-event lifecycle fixtures.
- [ ] Compare source, root artifact and deployed Pages action-map hashes and traces.

## Retained work

Host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback remain open in their timestamped audit families.