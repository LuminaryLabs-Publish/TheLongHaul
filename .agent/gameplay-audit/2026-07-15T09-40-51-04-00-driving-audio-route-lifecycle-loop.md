# Gameplay audit: driving audio route lifecycle loop

**Timestamp:** `2026-07-15T09-40-51-04-00`

## Plan ledger

**Goal:** ensure audio activity follows accepted gameplay state instead of depending on the next animation callback.

- [x] Trace engine/wind loops during driving.
- [x] Trace collision, recovery, wrong-yard and delivery cues.
- [x] Trace pause, title and blur behavior.
- [ ] Implement revision-bound cue and loop admission.

## Current loop

```txt
driving state
  -> speed/throttle sampled
  -> persistent engine and wind gains scheduled
  -> collision/delivery outcomes create transient tones

pause or route exit
  -> gameplay state changes
  -> persistent loop silence waits for audio.update or an explicit title call

blur or hidden document
  -> pause may be requested
  -> no direct audio lifecycle result
  -> no stale cue or stale loop-generation rejection
```

## Gameplay risk boundary

The gap does not change simulation truth. It can allow audible presentation to lag accepted gameplay state and leaves no evidence that cues or loops were admitted against the correct run, route and visibility revision.