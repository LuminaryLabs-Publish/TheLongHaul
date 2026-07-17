# Render audit: finite-course map in an infinite world

**Timestamp:** `2026-07-17T01-01-09-04-00`

## Visible-frame path

```txt
mapOpen
  -> map canvas client rectangle
  -> DPR-capped backing size
  -> course.bounds world transform
  -> explored course edges
  -> discovered/checked course depots
  -> course origin
  -> truck marker
  -> Canvas2D frame
```

## Source-backed gap

`drawMap()` defines `worldW`, `worldH`, scale and origin from `course.bounds`. This transform remains finite even though the world profile and package admit infinite extent and world streaming accepts arbitrary cell coordinates.

Consequences:

- The truck marker can project outside the visible canvas during valid far travel.
- Streamed gameplay-cell coverage is not visible.
- Macro-sector coverage is not visible.
- Atlas roads, settlements and portals are not visible.
- The map frame does not identify the world, cell, sector, discovery or content revisions it represents.
- Canvas2D and WebGL have no shared world-content/frame receipt.

## Required render contract

```txt
MapContentProjectionResult
  viewport bounds
  map center and scale
  accepted content digest
  discovery/rejection revision
  clipped roads and locations
  truck marker policy

MapFrameCommitResult
  canvas backing size
  viewport revision
  content digest
  frame id

FirstInfiniteMapBoundFrameAck
  run id
  map frame id
  viewport revision
  content digest
```

## Validation fixtures

- Truck inside finite course bounds.
- Truck just outside each finite course edge.
- Truck at distant positive and negative cell coordinates.
- Player-centered map window while moving.
- Sector boundary crossing.
- Source/build/Pages pixel and receipt parity.

## Boundary

No Canvas2D or WebGL runtime behavior was changed.