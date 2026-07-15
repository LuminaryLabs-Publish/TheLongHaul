# Interaction audit: audio lifecycle command and result map

**Timestamp:** `2026-07-15T09-40-51-04-00`

## Plan ledger

**Goal:** map every user, route and browser lifecycle transition to an explicit audio command and typed result.

- [x] Map unlock, mute, pause, resume, blur, visibility and retirement.
- [x] Map persistent loops and transient cues.
- [ ] Add command admission and executable fixtures.

## Command map

```txt
accepted user gesture
  -> AudioUnlockCommand
  -> AudioUnlockResult(ContextGeneration)

sound preference change
  -> AudioPreferenceCommand
  -> AudioPreferenceResult
  -> immediate loop-gain settlement

scene enters driving
  -> AudioRouteAdmissionCommand
  -> ActiveAudioResult

pause, blur or non-driving route
  -> AudioSilenceCommand
  -> SilentAudioResult
  -> FirstSilentAudioAck

visible resume
  -> AudioResumeCommand
  -> ResumedAudioResult
  -> FirstResumedAudibleFrameAck

semantic collision/delivery/UI event
  -> AudioCueCommand(expected run/route/context revisions)
  -> CueAdmissionResult or stale/retired rejection

pagehide or runtime retirement
  -> AudioRetirementCommand
  -> source stop/disconnect receipts
  -> context close receipt
```

## Missing result classes

```txt
unsupported capability
unlock rejected
stale route
stale run
muted
hidden
suspended
retired
duplicate cue
voice budget rejected
source disposal failed
context close failed
```
