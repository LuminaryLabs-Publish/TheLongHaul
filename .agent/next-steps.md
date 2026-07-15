# Next steps

## Plan ledger

**Goal:** give the browser audio graph one revision-bound lifecycle from accepted unlock through exactly-once retirement.

- [ ] Add `AudioContextGeneration`, `AudioPolicyRevision`, `AudioRouteRevision` and `AudioVisibilityRevision`.
- [ ] Replace ambient `audio.ensure()` ownership with an admitted unlock command and typed capability result.
- [ ] Represent the engine and wind loops as persistent source leases owned by one context generation.
- [ ] Settle loop gains immediately on pause, blur, mute and route exit instead of waiting for RAF.
- [ ] Add an explicit hidden-document policy: silent, suspended or retired.
- [ ] Add `visibilitychange`, `pagehide` and runtime-retirement command handling.
- [ ] Resume only when the document is visible, sound is enabled and the accepted route permits audio.
- [ ] Bind every transient cue to expected run, route and context revisions.
- [ ] Reject stale, duplicate, muted, hidden or retired cue requests.
- [ ] Stop and disconnect persistent sources exactly once.
- [ ] Close or deliberately retain the AudioContext under a versioned retirement policy.
- [ ] Publish gain, suspension, resume and source-disposal receipts.
- [ ] Add `FirstSilentAudioAck` and `FirstResumedAudibleFrameAck`.
- [ ] Add browser fixtures for unlock, repeat ensure, mute, pause, blur, hidden/visible transitions and pagehide.
- [ ] Add source, root-artifact and deployed Pages audio-lifecycle parity proof.

## Retained work

Generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback remain open in their timestamped audit families.