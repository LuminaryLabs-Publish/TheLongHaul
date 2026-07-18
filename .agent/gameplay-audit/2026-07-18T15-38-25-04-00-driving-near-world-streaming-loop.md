# Gameplay audit: driving and near-world streaming loop

**Timestamp:** `2026-07-18T15-38-25-04-00`

## Player loop

```txt
start a generated freight course
  -> drive through a streamed near world
  -> read roads, terrain, wildlife and depot landmarks
  -> manage fuel, truck condition, cargo condition and time
  -> inspect five candidate depots
  -> reject four decoys
  -> deliver to the valid depot
  -> receive score and best-run comparison
  -> retry the same seed, generate a new seed or return to title
```

## Streaming position in the loop

Near-world streaming is host infrastructure, but it runs inside every accepted driving frame before presentation:

```txt
preTickDriving
  -> engine.tick
  -> postTickGameplay
  -> updateWorldStreaming
  -> updateHorizonWorld
  -> visual, camera, HUD, audio and render work
```

The active near window is a 3x3 set because `ACTIVE_RADIUS = 1`. The Core World update and host reconciliation are correctly limited to a changed near-cell key. Preparation focus, desired membership, generation pumps and manual prefetch are not.

## Gameplay invariants that must remain unchanged

- The active 3x3 near window must remain available around the truck.
- Forward prefetch must remain deterministic for the same course, position and heading.
- No accepted active patch may be lost because a frame retained a prior plan.
- Cell transitions must not expose terrain holes or stale obstacle membership.
- Retry-same-seed must preserve generated patch content.
- Pause, result, loss and title scenes must not advance driving streaming work.
- Delivery, collision, recovery, score and timer semantics must remain unchanged.

## Current risk boundary

The audit does not identify a gameplay correctness failure. It identifies an unclassified cadence boundary: identical active membership is rebuilt and resubmitted every driving frame, while no result distinguishes retained work from changed work. An optimization performed without explicit generation and membership results could accidentally suppress required prefetch or delay a boundary transition.

## Proposed gameplay-facing contract

```txt
StreamingFocusAdmissionResult
  acceptedCourseGeneration
  acceptedNearCellKey
  acceptedDirectionKey
  changed

DesiredWindowSettlementResult
  retainedActivePatchIds
  addedActivePatchIds
  releasedActivePatchIds

PrefetchPlanResult
  retainedPrefetchPatchIds
  addedPrefetchPatchIds
  removedPrefetchPatchIds
  overlapClassifications

PatchPreparationPumpResult
  queuedBefore
  started
  inflight
  queuedAfter
  retainedIdle
```

## Validation needed

- Stationary truck for 60 seconds.
- Driving within one cell without crossing a boundary.
- Crossing each cardinal and diagonal boundary.
- Reversing direction inside one cell.
- Rapid heading changes with stable position.
- Pause/resume during queued generation.
- Retry same seed while prior preparation work exists.
- Browser verification for terrain, obstacles, roads and delivery access after transition.

## Completion boundary

Do not change streaming cadence by renderer-local conditionals alone. First preserve the gameplay invariants in deterministic membership and transition fixtures, then bind the accepted result to the visible near-world frame.