# Interaction audit: infinite-sector admission command/result map

**Timestamp:** `2026-07-16T19-39-24-04-00`

## Goal

Give every world-streaming request an explicit result that coordinates profile, atlas, course, cell, provider and presentation revisions.

## Command map

### `InfiniteWorldSectorAdmissionCommand`

```txt
inputs
  worldProfileRevision
  coursePackageDigest
  courseRevision
  atlasRevision
  sectorX / sectorZ
  requestedCellIds
  runGeneration
  providerGeneration

validation
  profile extent agrees with package extent
  world seed and generator version are accepted
  coordinates are finite integers
  request belongs to active run/provider generations
  sector identity is deterministic

results
  accepted
  duplicate
  stale
  extent-mismatch
  generator-mismatch
  rejected
```

### `InfiniteWorldCellContentPlanCommand`

```txt
inputs
  accepted sector result
  cellId and exact bounds
  finite-course contribution
  horizon LOD level
  terrain/content policies

outputs
  terrain descriptor
  road descriptors
  settlement descriptors
  portal descriptors
  vegetation and obstacle descriptors
  ownership classifications
  content digest
```

### `InfiniteWorldCellCommitCommand`

```txt
inputs
  content plan result
  patch-preparation generation
  Core World provider generation
  expected active-cell revision

results
  committed
  duplicate
  stale
  retired
  rejected

receipts
  provider receipt
  active-cell revision
  render expectation
```

### `FirstAtlasBoundWorldFrameAck`

```txt
sectorId
sectorDigest
cellId
contentDigest
providerGeneration
frameId
webglProjection: accepted/rejected
mapProjection: accepted/rejected/not-visible
```

## Exact-result rules

- API calls may not return pre-tick state as though it were settlement.
- Duplicate sector requests must return the retained terminal result.
- Reusing a sector/cell identity with a different seed, generator or profile must reject.
- Late patch results from a previous run or provider generation must reject.
- Course content and atlas content must carry explicit owner labels.
- Presentation may not acknowledge an atlas frame before provider commit.

## Existing paths to preserve

- The finite five-branch course remains the active delivery contract.
- Core Transaction Ledger remains the general repeat-safe operation owner.
- Patch preparation retains generation/activation budgets and caching.
- Core World retains active-cell and provider lifecycle ownership.
- Core Graphics retains instance-batch writes and release receipts.

## Completion boundary

No infinite-sector command is considered complete until its terminal result can be correlated with the exact provider receipt and first matching visible frame.
