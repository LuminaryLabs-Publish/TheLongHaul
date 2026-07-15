# Next steps

## Plan ledger

**Goal:** keep the existing game and presentation adapters while making motion preference adoption complete, versioned, persistent, and visibly provable.

- [ ] Replace the raw `motion` boolean contract with a versioned `motionProfile` while migrating legacy values.
- [ ] Define explicit `Full`, `Reduced`, and optional `Static` profiles.
- [ ] Register every camera, truck-body, cargo, and related presentation-motion effect by stable ID.
- [ ] Classify rough-road shake, steering roll, input pitch, cargo sway, dynamic FOV, and camera convergence under each profile.
- [ ] Add `MotionPreferenceCommand`, `MotionPreferenceRevision`, and `MotionPreferenceResult`.
- [ ] Prepare all mandatory presentation participants before adopting a successor revision.
- [ ] Preserve the prior profile if validation, persistence, or participant preparation fails.
- [ ] Publish a durable settings-document receipt instead of silently swallowing storage failure.
- [ ] Restore and validate the accepted profile before the first game frame after reload.
- [ ] Add per-effect execution receipts to the render result.
- [ ] Add `FirstMotionPreferenceFrameAck`.
- [ ] Add a browser transform matrix for full and reduced profiles.
- [ ] Add title, paused-run, reload, malformed-document, and stale-command fixtures.
- [ ] Verify source, deployed Pages output, and visible-frame fingerprints against one revision.

## Retained work

Pause suspension, terminal settlement, and course-generation admission remain open in their earlier timestamped audit families.