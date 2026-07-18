# Interaction audit: near-world streaming command and result map

**Timestamp:** `2026-07-18T15-38-25-04-00`

## Existing host calls

```txt
updateWorldStreaming()
  preparation.setFocus(...)
  preparation.updateDesired(...)
  preparation.pump({ maximum: 6 })
  preparation.request(... three times ...)
  preparation.pump({ maximum: 2 })

  if nearCellKey changed
    coreWorld.setFocus(...)
    coreWorld.updateWorld(...)
    reconcileCells()
```

The host consumes none of the return values from `setFocus()`, `updateDesired()`, either `pump()`, or the manual `request()` calls. Work is invoked as side effects rather than settled as one command/result transaction.

## Proposed command map

```txt
StreamingGenerationAdmissionCommand
  coursePackageId
  courseGeneration
  generatorVersion
  settingsHash
  -> StreamingGenerationAdmissionResult

StreamingFocusAdmissionCommand
  streamingGeneration
  position
  velocity
  forward
  priorFocusKey
  -> accepted | retained | rejected-stale
  -> StreamingFocusAdmissionResult

DesiredWindowSettlementCommand
  streamingGeneration
  nearCellKey
  activeRadius
  priorDesiredDigest
  -> added | retained | released
  -> DesiredWindowSettlementResult

PrefetchPlanCommand
  streamingGeneration
  focusKey
  directionKey
  controllerPolicy
  productPolicy
  -> canonicalRequests
  -> overlapClassifications
  -> PrefetchPlanResult

PatchPreparationPumpCommand
  streamingGeneration
  queueRevision
  maximumWork
  -> started | retained-idle | blocked | rejected-stale
  -> PatchPreparationPumpResult

StreamingProjectionCommitCommand
  streamingGeneration
  desiredWindowDigest
  preparedPatchDigest
  activeWorldDigest
  realizedHostDigest
  -> NearWorldStreamingDigest
  -> FirstNearWorldStreamingBoundFrameAck
```

## Required classifications

### Focus

- `changed-cell`
- `changed-direction`
- `retained`
- `rejected-stale-generation`

### Desired membership

- `added-active`
- `retained-active`
- `released-active`
- `retained-prefetch`
- `promoted-prefetch-to-active`
- `demoted-active-to-retained-cache`

### Prefetch overlap

- `controller-owned`
- `product-owned`
- `duplicate-same-cell`
- `complementary-side-strip`
- `rejected-outside-policy`

### Pump

- `started-work`
- `retained-idle`
- `budget-exhausted`
- `blocked-inflight`
- `rejected-stale-generation`

## Public diagnostics

Public UI should not expose engine internals. Optional bounded diagnostics may expose only:

```txt
active cells
queued patches
inflight patches
streaming transition count
last streaming failure class
```

Detailed request IDs, cache keys, policy revisions and digests belong in internal snapshots and fixtures.

## Completion boundary

The interaction boundary is complete only when the browser host submits one admitted streaming command per meaningful focus generation and consumes typed results instead of repeatedly invoking ignored side effects.