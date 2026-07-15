# Render audit: input effect visible-frame gap

**Timestamp:** `2026-07-15T19-38-38-04-00`

## Plan ledger

**Goal:** bind each visible camera, map, retry, recovery and driving effect to one accepted semantic input revision.

- [x] Inspect WebGL, Canvas2D, DOM and audio input effects.
- [x] Trace direct host mutations from keyboard events.
- [x] Confirm no accepted input revision reaches presentation.
- [x] Define visible-frame acknowledgement requirements.
- [ ] Execute browser frame-convergence fixtures.

## Current path

```txt
keydown
  -> direct cameraMode, mapOpen, pause, retry or interactWanted mutation
  -> later RAF reads mutable host state
  -> DOM, Canvas2D, WebGL and audio render effects
```

Core Input publishes no action result for camera, map, pause, retry or recovery. The rendered frame therefore cannot cite an accepted `InputActionResult`, `ActionMapRevision` or `ContextRevision`.

## Missing proof

```txt
InputActionRevision: absent
InputContextRevision: absent
CameraActionResult: absent
MapActionResult: absent
RetryActionResult: absent
RecoveryActionResult: absent
FirstInputActionAck: absent
FirstInputEffectFrameAck: absent
```

## Required frame contract

```txt
accepted InputActionResult
  -> bind simulation or presentation mutation
  -> prepare immutable effect descriptor
  -> render WebGL, Canvas2D, DOM and audio projections
  -> publish InputEffectFrameResult
  -> acknowledge FirstInputEffectFrameAck
```

A frame acknowledgement must identify the action, route, context, engine state and presentation generations it represents. Stale action effects must be rejected after pause, retry, title return, generation replacement or document retirement.

## Validation boundary

No screenshot, browser trace or visible defect was reproduced. This is a source-backed frame-ownership and evidence gap.