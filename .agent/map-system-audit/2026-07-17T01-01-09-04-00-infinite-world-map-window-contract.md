# Map-system audit: infinite-world map window contract

**Timestamp:** `2026-07-17T01-01-09-04-00`

## Contract goal

One map frame must represent one accepted world window, one content generation and one discovery/delivery generation.

## View modes

```txt
finite-course-overview
  shows the authored five-branch challenge
  uses course bounds intentionally
  clips the player marker explicitly

player-centered-infinite
  follows the truck
  queries accepted streamed cells and sectors
  shows discovered semantic content within a bounded radius

sector-overview
  centers on a selected macro sector
  preserves stable zoom and content identity
```

## Immutable viewport result

```txt
MapViewportAdmissionResult {
  mapModeRevision
  trackingMode
  centerWorld
  worldBounds
  scale
  canvasCssSize
  canvasBackingSize
  runRevision
  worldProfileRevision
  activeCellRevision
}
```

## Immutable content result

```txt
MapContentProjectionResult {
  viewportRevision
  courseDigest
  atlasDigest
  activeCellDigest
  discoveryRevision
  deliveryRevision
  roads
  depots
  settlements
  portals
  playerMarker
  contentDigest
}
```

## Rules

- Do not infer infinite coverage from finite course bounds.
- Do not query mutable course, atlas and truck state independently during drawing.
- Keep semantic identity stable across LOD and icon changes.
- Clip content deterministically at the accepted world window.
- Define whether undiscovered atlas content is hidden, generalized or omitted.
- Retire map results when run, route, world or canvas generations change.
- Keep Canvas2D as a projection adapter, not a world-query owner.

## Completion receipt

`FirstInfiniteMapBoundFrameAck` must bind run, viewport, content digest, canvas size and frame id.

## Boundary

Proposed contract only.