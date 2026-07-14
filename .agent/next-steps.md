# Next steps

## Plan ledger

**Goal:** keep the existing kits and game loop intact while making pause and resume one explicit scheduler, input and presentation transaction.

- [ ] Add `RunId`, `PauseCommandId`, `PauseRevision` and `ResumeCommandId`.
- [ ] Define a versioned pause policy: strict suspension or named tactical/presentation exceptions.
- [ ] Gate every gameplay-mutating kit during pause, not only Core Simulation.
- [ ] Classify Core World streaming, Hazard Field, Resource Pressure, Telemetry and Delivery behavior under pause.
- [ ] Clear or journal browser `keys`, Core Input intent, interaction intent and vehicle input when pause is accepted.
- [ ] Reject pre-pause held input on resume until a fresh key transition is observed.
- [ ] Preserve intentional camera, dust, wildlife-animation and renderer behavior only through explicit presentation policy.
- [ ] Publish participant pause and resume receipts.
- [ ] Add `FirstPausedFrameAck` and `FirstResumedFrameAck`.
- [ ] Add headless fixtures for timer, hazards, pressure, telemetry, streaming and input state.
- [ ] Add browser fixtures for held throttle, held steer, map state, pause overlay and first resumed frame.
- [ ] Verify source, deployed Pages output and browser behavior against one revision.
