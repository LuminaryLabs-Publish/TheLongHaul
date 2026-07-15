# Deploy audit: browser audio lifecycle fixture gate

**Timestamp:** `2026-07-15T09-40-51-04-00`

## Plan ledger

**Goal:** require source, root-artifact and deployed Pages proof for audio unlock, silence, suspension, resume and retirement.

- [x] Preserve the existing root-artifact Pages workflow.
- [x] Define required browser fixtures.
- [ ] Execute and retain fixture evidence.

## Required fixtures

```txt
user-gesture unlock creates one context generation
repeated ensure does not duplicate persistent loops
sound off settles engine and wind gains immediately
pause settles gains before the next RAF
blur settles gains before the next RAF
visibility hidden applies the declared silent/suspend policy
visibility visible does not resume while muted or on a non-driving route
resume creates no duplicate loops
transient cue from a stale run/route is rejected
pagehide stops and disconnects both persistent sources
runtime retirement closes the context exactly once
source, uploaded artifact and Pages behavior cite matching fingerprints
```

## Evidence packet

```txt
source commit
artifact hash
Pages deployment URL
browser and user-agent
AudioContext state transitions
context/source generations
loop gain traces
cue admission results
retirement receipts
matching scene/run revisions
```

No deployment or browser proof was executed in this documentation run.