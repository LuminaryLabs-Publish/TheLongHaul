# Render audit: partial world visible before admission

**Timestamp:** `2026-07-14T09-03-47-04-00`

## Summary

The WebGL world is revealed while generation is still in progress. The final route and world checks run after terrain registration, Core World activation, streamed cell construction, atmosphere creation, and DOM visibility have already occurred.

## Current visible path

```txt
terrain generation reaches cell 1,1
  -> build atmosphere
  -> register Core World
  -> set focus
  -> update world
  -> create active terrain and course cells
  -> add body.world-visible
  -> canvas fades in

later units
  -> finish wildlife
  -> create truck
  -> validate route
  -> validate world
  -> mark ready
```

The render loop continues to submit `renderer.render(scene, camera)` on every RAF, including generation and failure states.

## Failure behavior

```txt
late generation unit throws
  -> generation.error is stored
  -> exception is logged
  -> boot-failure overlay becomes visible
  -> partial WebGL scene remains allocated
  -> no candidate render lease is retired
  -> no admitted-frame revision exists
  -> only reload is offered
```

## Render surfaces

```txt
WebGL game canvas
Canvas2D paper map
DOM menu, HUD, progress, pause, result, loss, toast, and failure overlays
```

## Required evidence

```txt
candidate surface generation
candidate resource manifest
probe-frame result
accepted course revision
accepted scene revision
accepted provider revision
first admitted course frame
candidate disposal receipt on failure
predecessor frame preservation or explicit neutral fallback
```

## Target rule

Keep the candidate world hidden or offscreen until route, world, destination, hazard, truck, and resource checks all pass. Reveal it only after atomic adoption, then publish `FirstAdmittedCourseFrameAck` for the exact accepted generation revision.
