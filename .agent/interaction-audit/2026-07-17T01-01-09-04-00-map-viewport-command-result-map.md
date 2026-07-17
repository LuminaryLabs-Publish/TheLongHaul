# Interaction audit: map viewport command/result map

**Timestamp:** `2026-07-17T01-01-09-04-00`

## Current interaction

```txt
KeyM one-shot
  -> invert mapOpen boolean
  -> toggle panel class and aria-hidden
  -> play click cue
  -> next frame draws directly from course and truck state
```

There is no admitted map-session identity, viewport command, content result or frame acknowledgement.

## Proposed command/result flow

```txt
MapToggleCommand
  routeRevision
  runRevision
  requestedOpen
  inputSequence
  -> MapModeAdmissionResult

MapViewportAdmissionCommand
  mapModeRevision
  worldProfileRevision
  playerPosition
  viewportPixels
  requestedTrackingMode
  -> MapViewportAdmissionResult

MapContentProjectionCommand
  viewportRevision
  courseRevision
  atlasRevision
  activeCellRevision
  discoveryRevision
  deliveryRevision
  -> MapContentProjectionResult

MapFrameCommitCommand
  viewportRevision
  contentDigest
  canvasRevision
  -> MapFrameCommitResult
  -> FirstInfiniteMapBoundFrameAck
```

## Rejection classes

- stale route or run;
- duplicate input sequence;
- retired map mode;
- stale viewport dimensions;
- mixed course/atlas generations;
- stale discovery or delivery state;
- late content result;
- disposed Canvas2D surface.

## Focus and accessibility

The existing `aside` updates `aria-hidden`, but the authority should also define whether map open changes keyboard context, focus destination, announcement text and Escape behavior. Those semantics must remain separate from drawing.

## Boundary

Documentation only; no input or accessibility behavior changed.