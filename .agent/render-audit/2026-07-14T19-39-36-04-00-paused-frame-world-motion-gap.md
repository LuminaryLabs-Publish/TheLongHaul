# Render audit: paused-frame world-motion gap

**Timestamp:** `2026-07-14T19-39-36-04-00`

## Source path

```txt
pause scene accepted
  -> recursive RAF remains active
  -> engine.tick(dt) remains active
  -> updateTruckVisual(dt, time, null)
  -> updateCamera(dt, time, null)
  -> updateWildlife(time)
  -> updateDust(dt)
  -> drawMap()
  -> renderer.render(scene, camera)
```

## Finding

Continuing to render while paused can be intentional. The gap is that no presentation policy distinguishes allowed cosmetic interpolation from forbidden gameplay-state motion. The pause overlay proves only that the Core Simulation clock stopped. It does not bind the rendered frame to a frozen Hazard Field, Resource Pressure, streaming state or input revision.

## Required evidence

```txt
PauseRevision
participant suspension receipts
presentation-policy revision
captured paused snapshot
rendered paused-frame identity
FirstPausedFrameAck
FirstResumedFrameAck
```

## Fixtures

- Pause while wildlife is visible and compare authoritative positions across multiple frames.
- Pause with active dust particles and classify cosmetic continuation explicitly.
- Pause during truck and camera interpolation and verify the accepted policy.
- Resume and verify that the first frame cites fresh input rather than pre-pause held state.

No visual pause defect was reproduced during this documentation run.
