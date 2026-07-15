# Known gaps

## Action-map authority

- Core Input declares an action manifest, keyboard bindings and contexts but does not admit browser events.
- The host maintains a separate mutable `keys` object as the executable held-input owner.
- No `ActionMapRevision` binds the descriptor and executable browser path.
- No typed result proves which binding resolved an event.
- The host can change key behavior without invalidating the Core Input contract.

## Declared and executable divergence

- Core Input declares `KeyR` as `recovery`.
- The browser keydown path executes `KeyR` as retry-same-seed.
- Recovery is reached through contextual `KeyE` interaction logic.
- `retry` is not declared in the Core Input action manifest.
- Camera, map, pause and retry bypass Core Input action publication.

## Context admission

- `driving` and `menu` contexts are declared but not explicitly activated or retired.
- Title, generating, paused, settings, results and loss have no versioned context result.
- Direct key handlers use scene checks instead of one accepted context policy.
- Focused controls have no explicit input-leak guard.
- No out-of-context rejection result exists.

## Held-action lifecycle

- Held state has no `InputGeneration`.
- Keydown, repeat, keyup and blur events have no stable event identity.
- Blur clears raw keys but publishes no cancellation receipt.
- Visibility loss has no input settlement owner.
- Retry and title transitions have no held-action retirement receipt.
- Late keyup from a superseded run or route is not classified.

## Command and result settlement

- Raw browser listeners directly mutate camera, map, pause, retry and interaction state.
- Core Input receives a derived intent mirror after raw key state has already been interpreted.
- No `InputEventAdmissionResult` exists.
- No `InputActionResult` exists.
- Retry and recovery lack distinct typed results and expected run generations.
- Duplicate and stale one-shot actions have no idempotency contract.

## Visible-frame coherence

- WebGL, Canvas2D, DOM and audio effects do not cite accepted input revisions.
- Camera and map changes can render without an accepted Core Input action.
- Retry can replace the world without a matching input settlement receipt.
- No `FirstInputActionAck` exists.
- No `FirstInputEffectFrameAck` exists.

## Validation

- No package manifest or executable test command exists.
- No browser keyboard event harness exists.
- No action-map descriptor/runtime parity fixture exists.
- No route-context or focus-target fixture exists.
- No held-key cancellation or stale-event fixture exists.
- No retry/recovery binding fixture exists.
- No source-to-artifact-to-Pages input parity proof exists.

## Retained gaps

The earlier host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback gaps remain valid in their timestamped audit families.