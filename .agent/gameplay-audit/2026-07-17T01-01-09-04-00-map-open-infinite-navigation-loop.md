# Gameplay audit: map-open infinite navigation loop

**Timestamp:** `2026-07-17T01-01-09-04-00`

## Current loop

```txt
press M while driving
  -> toggle mapOpen
  -> keep admitting throttle, brake and steering
  -> keep ticking truck, run, delivery and wildlife
  -> keep streaming cells around the moving truck
  -> draw a map fixed to finite course.bounds
  -> render the next WebGL frame behind the map
```

## Finding

Map-open behavior does not suspend gameplay. That can be a valid product choice, but the runtime has no explicit map interaction policy and no infinite map viewport that follows or contains the moving truck. A player can continue driving into valid streamed cells while the truck marker leaves the fixed map transform.

The issue is not that gameplay continues by itself. The issue is that movement admission, world streaming and map presentation are not settled under one map-mode generation.

## Required gameplay policy

`MapModeAdmissionResult` should state:

- whether driving input remains live;
- whether camera and audio remain live;
- map center and tracking mode;
- permitted map zoom/window bounds;
- active discovery filtering;
- route/scene/run revisions;
- retirement behavior on pause, result, loss and title transitions.

## Acceptance criteria

- A map-open frame always shows the truck according to an explicit clipping or tracking rule.
- Closing and reopening the map does not expose stale content.
- Map mode cannot consume retired run or world generations.
- Continuous driving and paused-map variants can be tested independently.
- Delivery and recovery prompts remain semantically consistent with the visible map state.

## Boundary

No gameplay timing, input, streaming or map behavior was changed.