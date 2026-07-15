# Deploy audit: input context browser fixture gate

**Timestamp:** `2026-07-15T19-38-38-04-00`

## Plan ledger

**Goal:** prove that source, root artifact and deployed Pages execute one identical action map and context policy.

- [x] Identify required source-level input assertions.
- [x] Define browser context and lifecycle fixtures.
- [x] Define artifact and Pages parity requirements.
- [ ] Add executable fixtures.
- [ ] Execute the fixture matrix.

## Required source assertions

```txt
one executable action map
one Core Input semantic state owner
KeyR retry/recovery contract resolved
one-shot actions published through Core Input
route contexts explicitly admitted
held actions retired on lifecycle transitions
```

## Browser fixture matrix

```txt
held driving: W/S/A/D/arrows/Shift press, repeat and release
one-shot: Escape, C, M, E and R
context: title, generating, driving, paused, settings, results and loss
lifecycle: blur, visibility loss, focus return, retry, title return and reload
focus: range input, switches and buttons
stale evidence: late keyup and superseded route events
```

Each fixture must assert both `InputActionResult` and the first matching WebGL, Canvas2D, DOM or audio acknowledgement.

## Parity gate

```txt
source index.html action-map hash
root artifact action-map hash
deployed Pages action-map hash
context policy revision
provider revision
FirstInputActionAck
FirstInputEffectFrameAck
```

Deployment is not input-ready until the source, artifact and Pages traces match for the same scripted event sequence.

## Current evidence

```txt
package test command: unavailable
browser input harness: unavailable
context fixture: unavailable
lifecycle cancellation fixture: unavailable
artifact input smoke: not run
Pages input smoke: not run
```

## Validation boundary

The Pages workflow was not changed or executed. No deployed input parity or production-readiness claim is made.