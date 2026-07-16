# Next steps

**Timestamp:** `2026-07-16T18-58-24-04-00`

## Intent

Turn runtime exceptions into one bounded terminal transition instead of a continuing RAF error loop.

## What needs to happen

### 1. Define frame and scheduler identity

- [ ] Add `RuntimeSchedulerGeneration`, `RuntimeFrameId` and `FramePhaseId`.
- [ ] Bind document, session, run and scene revisions.
- [ ] Reject callbacks from retired generations.
- [ ] Queue the next RAF only after the current frame is accepted, or guard the callback with the active generation.

### 2. Add phase receipts

- [ ] Name generation, pre-tick, engine tick, gameplay, streaming, visual, HUD, audio, map and render phases.
- [ ] Publish accepted/failed phase receipts.
- [ ] Record whether each phase may have mutated authoritative or presentation state.
- [ ] Avoid exposing stack traces or implementation jargon in player UI.

### 3. Settle terminal faults

- [ ] Publish `RuntimeFrameFaultResult`.
- [ ] Retire the failed scheduler generation exactly once.
- [ ] Clear held and one-shot input.
- [ ] Mute/suspend active engine and wind audio.
- [ ] Cancel or retire generation, patch preparation and world-provider work.
- [ ] Freeze further run mutations when partial application is indeterminate.

### 4. Project one stable fault state

- [ ] Focus the failure panel and announce the fault once.
- [ ] Prevent repeated text changes and repeated console spam for the same fault.
- [ ] Publish `FirstFaultFrameAck`.
- [ ] Keep the fault surface renderable without running normal gameplay phases.

### 5. Define restart policy

- [ ] Classify recoverable startup/generation failures separately from runtime simulation/render failures.
- [ ] Permit in-process retry only after a clean retirement receipt.
- [ ] Require reload when renderer, engine or state integrity is indeterminate.
- [ ] Create a fresh runtime generation on restart.

### 6. Add executable fixtures

- [ ] Inject one failure into each named phase.
- [ ] Prove one fault result and one terminal UI acknowledgement.
- [ ] Prove RAF count stops advancing product work.
- [ ] Prove stale input and stale callbacks are rejected.
- [ ] Prove audio and world work retire.
- [ ] Run `npm test`.
- [ ] Compare source, built artifact and deployed Pages behavior.

## Retained work

Product-policy adoption remains open. The fault authority should not silently implement policy adoption, WebGL recovery, input lifecycle, audio lifecycle or world recovery; it should coordinate their existing retirement hooks through one terminal result.
