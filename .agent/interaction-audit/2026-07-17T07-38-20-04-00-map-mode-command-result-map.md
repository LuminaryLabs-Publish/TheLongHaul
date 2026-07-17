# Interaction audit: map-mode command/result map

**Timestamp:** `2026-07-17T07-38-20-04-00`

## Current interaction

```txt
KeyM one-shot
  -> toggle mapOpen
  -> toggle CSS class and aria-hidden
  -> continue raw held-key driving

Escape
  -> pauseGame
  -> close map as a side effect

route outcome/reset
  -> close map as a side effect
```

## Proposed flow

```txt
MapModeAdmissionCommand
  routeRevision
  runRevision
  inputSequence
  requestedOpen
  requestedPolicy
  -> MapModeAdmissionResult

MapInputContextCommitCommand
  mapSessionId
  acceptedActionMask
  simulationPolicy
  -> MapInputContextResult

MapFocusCommitCommand
  mapSessionId
  sourceFocusId
  targetFocusId
  announcement
  -> MapFocusCommitResult

MapModeSettlementCommand
  mapSessionId
  reason
  routeRevision
  -> MapModeSettlementResult
  -> FirstMapModeBoundFrameAck
```

## Rejection classes

- duplicate or stale M evidence;
- non-driving route;
- retired run or map session;
- focus target unavailable;
- mismatched input context;
- stale pause/outcome/reset settlement;
- late Canvas2D or DOM frame.

## Accessibility

Opening must define whether focus stays on gameplay, moves to the map, or enters a dedicated close control. The map state should be announced once, and closing must restore the accepted prior focus target. `aria-hidden` alone does not settle those behaviors.

## Boundary

Documentation only; no keyboard, focus or ARIA behavior changed.