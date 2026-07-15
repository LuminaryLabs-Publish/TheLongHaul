# Known gaps

## Audio capability and generation

- Audio capability discovery and user-gesture unlock have no typed admission result.
- The active `AudioContext` has no stable context ID or generation.
- Repeated `audio.ensure()` relies on host-local object presence rather than a published lease.
- Persistent engine and wind sources have no source generation or ownership receipt.

## Silence and suspension

- Loop silence is normally scheduled from RAF through `audio.update()`.
- Pause and blur do not directly settle loop gains.
- No `visibilitychange` lifecycle owner exists.
- No hidden-document silent-versus-suspended policy exists.
- No `AudioContext.suspend()` result exists.
- No `FirstSilentAudioAck` exists.

## Resume and cue admission

- `audio.ensure()` opportunistically calls `context.resume()` without route, visibility or preference admission.
- Transient cues are not bound to run, route or context revisions.
- Stale, duplicate, hidden, muted or retired cue rejection is absent.
- No `FirstResumedAudibleFrameAck` exists.

## Retirement

- Persistent oscillator and wind sources are never explicitly stopped.
- Audio nodes are not explicitly disconnected.
- The `AudioContext` is never explicitly closed.
- No `pagehide` or runtime-retirement command exists.
- No exactly-once source-disposal or context-close receipt exists.
- Late cue calls after route or generation retirement have no rejection contract.

## Validation

- No package manifest or executable test command exists.
- No browser audio lifecycle fixture exists.
- No AudioContext state trace is retained.
- No loop-gain transition trace is retained.
- No source duplication or retirement fixture exists.
- No source-to-artifact-to-Pages audio parity proof exists.

## Retained gaps

The earlier generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback gaps remain valid in their timestamped audit families.