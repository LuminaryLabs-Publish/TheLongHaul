# Next steps

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** retire browser-held driving evidence deterministically whenever the document, route, run, or input adapter loses ownership, before any later simulation step can consume stale intent.

- [ ] Introduce an `InputFocusGeneration` owned by the browser keyboard adapter.
- [ ] Give every accepted key event the active document, route, input, and run generation.
- [ ] Add `window.blur` handling.
- [ ] Add `document.visibilitychange` handling for `hidden`.
- [ ] Add `pagehide` handling, including persisted back/forward-cache cases.
- [ ] Add `freeze`/`resume` handling where supported.
- [ ] Retire the input generation on route changes away from `driving`.
- [ ] Retire the input generation when a run is cleared, retried, failed, or completed.
- [ ] Clear both `keys` and `pressed` exactly once per retirement.
- [ ] Submit neutral intent through `engine.n.coreInput.setIntent()`.
- [ ] Submit neutral input through `engine.n.longHaulTruck.input()`.
- [ ] Decide whether focus loss also requests a safe pause; document the policy.
- [ ] Reject delayed `keyup`, `keydown`, or one-shot evidence from retired generations.
- [ ] Publish `HeldInputRetirementResult` with reason and affected action IDs.
- [ ] Publish `FirstNeutralInputFrameAck` after a matching frame renders.
- [ ] Add a real-browser fixture for held throttle followed by blur without keyup.
- [ ] Add hidden-tab, pagehide, freeze, route-change, retry, completion, and loss fixtures.
- [ ] Add a fixture proving stale one-shot `R`, `E`, `M`, `C`, and `Escape` evidence cannot fire after restoration.
- [ ] Add a fixture proving a fresh post-restore keydown is accepted normally.
- [ ] Run `npm test` and keep static-shell assertions aligned with the lifecycle contract.
- [ ] Compare source, workflow artifact, and deployed Pages behavior.

## Ordered implementation

### 1. Lifecycle policy

Define which browser and route signals retire input, whether the run auto-pauses, and which results are observable. Treat focus loss as an ownership transition, not as a direct mutation scattered across listeners.

### 2. Generation-bound adapter

Wrap `keys` and `pressed` in one adapter state object containing `generation`, `status`, and `lastRetirement`. Key handlers must reject evidence whose generation is no longer active.

### 3. Neutral settlement

On retirement, clear held and one-shot evidence, submit neutral Core Input intent, submit neutral Truck Input, and record a single typed result. This should happen before the next simulation tick after restoration.

### 4. Route and run integration

Retire input when leaving `driving`, before world clearing, and before retry/new-course generation. Create a fresh input generation only when the driving route is admitted.

### 5. Frame proof

Bind the retirement result to the simulation revision and visible frame. The acknowledgement should prove zero throttle, brake, steer, and boost were presented before accepting new input.

### 6. Browser fixtures

Use Playwright or an equivalent real-browser harness. Synthetic Node source checks cannot prove lost-keyup, visibility, bfcache, or browser event ordering.

### 7. Release gate

Require source, CI artifact, and Pages fixtures to agree on the input lifecycle policy and first neutral frame.

## Retained work

The modular rewrite materially adopts the prior promoted-Core profile. Earlier WebGL recovery, accessibility, host-clock, audio lifecycle, generation scheduling, motion preference, pause suspension, delivery settlement, and generation rollback work remains open in its timestamped audit families.