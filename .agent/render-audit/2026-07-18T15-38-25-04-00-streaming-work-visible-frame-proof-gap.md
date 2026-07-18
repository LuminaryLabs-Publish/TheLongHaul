# Render audit: near-world streaming work and visible-frame proof

**Timestamp:** `2026-07-18T15-38-25-04-00`

## Render surfaces

```txt
Three.js WebGL game canvas
Canvas2D paper map
DOM menu, HUD, result and fault overlays
```

The near-world streaming path feeds the WebGL surface through terrain groups and Core Graphics instance batches. Canvas2D and DOM surfaces consume course and run state but do not own streamed patch membership.

## Current presentation flow

```txt
accepted driving frame
  -> updateWorldStreaming()
      -> repeatedly settle preparation focus and desired membership
      -> pump generation work
      -> conditionally update Core World on cell-key transition
      -> conditionally realize/release near hosts
  -> update horizon, truck, wildlife, camera, HUD, map and audio
  -> renderer.render(scene, camera)
```

## Source-backed gap

The render frame has no digest that binds:

```txt
course generation
near-world focus generation
desired active membership
prefetch membership
prepared patch identities
Core World active cells
realized terrain and instance-batch cells
presented WebGL frame
```

The current cell-key gate reduces Core World and host reconciliation frequency, but preparation work remains frame-cadenced. There is no render-work admission result stating whether the frame retained an existing streaming plan, changed it, started patch work, or remained idle.

The audit does not establish that this work causes a dropped frame. It establishes that repeated source-visible work shares the same RAF budget as simulation, camera, HUD, map, audio and WebGL submission without a typed budget or matching-frame receipt.

## Required render-neutral result

**Proposed, not implemented:**

```txt
NearWorldStreamingDigest
  courseGeneration
  streamingGeneration
  focusKey
  directionKey
  desiredActivePatchIds
  desiredPrefetchPatchIds
  preparedPatchIds
  activeCoreWorldCellIds
  realizedHostCellIds
  workStarted
  workRetained
  rejectedStaleWork

FirstNearWorldStreamingBoundFrameAck
  frameId
  streamingDigest
  presentedAt
  renderSurfaceId
```

## Validation needed

- Drive within one 192-unit cell and count preparation calls.
- Cross one cell boundary and verify exactly one desired-window transition.
- Rotate without crossing a cell and verify the intended prefetch cadence.
- Confirm idle queues do not receive unconditional pump work.
- Compare active Core World cells with realized host and batch cells.
- Capture the first frame matching the accepted streaming digest.
- Compare source, built artifact and Pages behavior.

## Completion boundary

Do not claim frame-budget correctness, allocation reduction, stable cadence, matching cell presentation, artifact parity or Pages parity until executable evidence binds one accepted streaming generation to one presented WebGL frame.