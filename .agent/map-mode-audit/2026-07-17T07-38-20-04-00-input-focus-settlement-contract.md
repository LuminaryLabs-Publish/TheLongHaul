# Map-mode audit: input, focus and settlement contract

**Timestamp:** `2026-07-17T07-38-20-04-00`

## Contract

Every map opening receives a `MapSessionId` and immutable policy:

```txt
mode: live-driving | restricted-driving | suspended
allowedActions: semantic action IDs
simulation: live | suspended
runClock: live | suspended
streaming: live | retained
focusPolicy: retain-game | focus-map | focus-close
closePolicy: M | Escape | pause | route-retirement | outcome | reset
```

## Admission

Admission must bind the current Scene transition revision, Run revision, input sequence, map viewport revision and source focus target. Duplicate M evidence and non-driving routes are rejected.

## Active session

Raw browser keys are normalized before action masking. No DOM renderer decides which actions remain active. The accepted policy is observable by Truck, Run, Course, Delivery, Wildlife, Core Simulation, Core World streaming, audio, DOM and Canvas2D.

## Settlement

M close, Escape, pause, completion, failure, title, retry, world clear, blur and page retirement settle one session exactly once. Settlement clears map-only one-shots, restores the accepted input context and restores or replaces focus through a typed result.

## Frame proof

`FirstMapModeBoundFrameAck` must include map session, input-context, focus, viewport/content and presentation revisions. It must not be published for a retired or mixed generation.

## Fixtures

- open while accelerating;
- open while steering and boosting;
- close with M;
- close through Escape/pause;
- completion/failure while open under every policy;
- blur and visibility retirement;
- keyboard-only focus/announcement restoration;
- source, built artifact and Pages parity.

## Boundary

Proposed contract only.