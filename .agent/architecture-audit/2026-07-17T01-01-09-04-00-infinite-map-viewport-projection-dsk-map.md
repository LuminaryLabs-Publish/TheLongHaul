# Architecture audit: infinite-world map viewport projection DSK map

**Timestamp:** `2026-07-17T01-01-09-04-00`

## Current ownership

```txt
long-haul-world-profile-kit
  -> declares infinite extent and cell/atlas policy

long-haul-world-atlas-kit
  -> can describe sectors, settlements, portals and road registry state

long-haul-course-kit
  -> owns finite delivery-course exploration and discovered depots

long-haul-world-patch-preparation-controller
  -> admits arbitrary gameplay cells

long-haul-course-provider
  -> commits prepared cell effects

canvas-map-adapter
  -> reads finite course bounds, edges, depots and truck state
  -> projects directly to Canvas2D
```

## Architectural gap

The map adapter bypasses World Profile, World Atlas, active-cell/provider results and any semantic map viewport owner. It builds a frame from mutable course/truck snapshots and a fixed finite transform. No command/result boundary binds map mode, center, scale, content coverage, discovery, clipping and frame revision.

## Required domain

`the-long-haul-infinite-world-map-viewport-projection-authority-domain`

### Commands

- `MapViewportAdmissionCommand`
- `MapContentProjectionCommand`
- `MapFrameCommitCommand`

### Results

- `MapViewportAdmissionResult`
- `MapContentProjectionResult`
- `MapFrameCommitResult`
- `FirstInfiniteMapBoundFrameAck`

### Required identities

```txt
RunRevision
WorldProfileRevision
CoursePackageDigest
CourseRevision
AtlasRevision
ActiveCellRevision
SectorCoverageDigest
DiscoveryRevision
DeliveryRevision
MapViewportRevision
MapContentDigest
MapFrameId
```

## DSK placement

Keep semantic map-window admission and content selection in a renderer-neutral product DSK. Keep Canvas2D drawing in the existing adapter. Do not make the Canvas2D layer query mutable world/course state independently.

## Integration order

1. Admit a map viewport policy.
2. Query accepted finite-course and streamed-world content.
3. Apply discovery/rejection filtering.
4. Clip content to one accepted world window.
5. Compute a content digest.
6. Commit the matching Canvas2D frame.
7. Publish `FirstInfiniteMapBoundFrameAck`.

## Boundary

Proposed architecture only. No runtime DSK or adapter changes were made.