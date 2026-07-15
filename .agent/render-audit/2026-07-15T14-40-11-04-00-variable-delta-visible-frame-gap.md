# Render audit: variable-delta visible-frame gap

**Timestamp:** `2026-07-15T14-40-11-04-00`

## Plan ledger

**Goal:** bind each rendered frame to explicit accepted simulation revisions instead of one ambient callback delta.

- [x] Trace the callback-to-render path.
- [x] Identify all visible consumers of `dt` and callback time.
- [x] Separate source-backed findings from unexecuted visual claims.
- [ ] Add render interpolation and frame acknowledgement.

## Current path

```txt
RAF timestamp
  -> derive variable dt capped at 1 / 15
  -> process driving with dt
  -> engine.tick(dt)
  -> update truck smoothing with dt
  -> update camera smoothing and FOV with dt
  -> update wildlife from callback time
  -> update dust with dt
  -> draw Canvas2D map
  -> render Three.js frame
```

## Gap

The WebGL frame does not identify which fixed simulation revision or pair of revisions it represents because fixed steps and simulation revisions do not exist at the host boundary. Truck and camera smoothing also use the same callback-dependent `dt`, so presentation response changes with callback cadence.

```txt
RenderFrameId: absent
SimulationRevision: absent
previous/next simulation snapshot pair: absent
interpolation alpha: absent
rendered revision receipt: absent
first matching visible-frame ack: absent
```

At callback rates below 15 FPS, simulation time is capped while callback wall time continues. At irregular higher rates, variable-step integration and presentation smoothing receive different-sized deltas. This permits visible motion, camera response, dust evolution and timer progression to vary by host cadence.

No screenshot comparison, frame trace, motion-path comparison or pixel fixture was executed. This is a source-permitted render-coherence gap, not a reproduced visual defect.

## Required frame contract

```txt
RenderFramePlan
  HostFrameId
  ClockRevision
  previousSimulationRevision
  currentSimulationRevision
  interpolationAlpha
  routeRevision
  runRevision
  cameraRevision
  viewportRevision

RenderFrameResult
  submittedSimulationRevisions
  submittedInterpolationAlpha
  webglFrameReceipt
  canvasMapFrameReceipt
  domFrameReceipt
  FirstClockBoundFrameAck
```

## Validation gate

```txt
same-seed truck path at 30, 60, 90 and 120 Hz
same-seed low-cadence path at 20, 15 and 10 Hz
camera and truck interpolation trace
WebGL, Canvas2D and DOM revision correlation
first matching visible frame
source, root artifact and Pages parity
```
