# Interaction audit: course-generation command and result map

**Timestamp:** `2026-07-14T09-03-47-04-00`

## Current command path

```txt
Start button or fresh-course button
  -> newSeed()
  -> startGeneration(seed, exitId)
  -> clearWorld()
  -> reset live engine participants
  -> request scene transition
  -> create mutable generation object
  -> execute one unit per RAF
  -> mutate live state
  -> start run or display reload overlay
```

Same-seed retry uses a retry record with a `Date.now()`-derived ID, consumes it immediately, and calls the same path.

## Current result path

```txt
success
  -> mutable generation.ready and generation.entered flags
  -> scene transition to driving
  -> toast

failure
  -> mutable generation.error
  -> console.error
  -> boot-failure DOM overlay
```

There is no typed terminal result carrying attempt identity, participant revisions, validation receipts, adopted resource IDs, rollback status, or visible-frame evidence.

## Target map

```txt
CourseGenerationCommand
  attemptId
  seed
  predecessorGenerationId
  expectedProviderRevision
  expectedSceneRevision
  mode: fresh | retry-same

CourseGenerationResult
  status
  attemptId
  seed
  courseFingerprint
  destinationId
  routeRevision
  worldRevision
  activeCellManifest
  hazardRevision
  truckRevision
  validationReceipts
  adoptionRevision
  rollbackReceipt
  errorCode

FirstAdmittedCourseFrameAck
  attemptId
  adoptionRevision
  sceneRevision
  frameNumber
  visibleSurfaceId
```

## Admission behavior

Duplicate, stale, or superseded commands must not clear the current course. Results from an older attempt must not adopt resources or transition the scene after a newer attempt has started.
