# Horizon system audit: patch-generation and host-convergence contract

**Timestamp:** `2026-07-18T03-43-36-04-00`

## Current state stores

```txt
horizonPatches: Map<cellId, patch>
horizonHosts:   Map<cellId, { group, geometry, patch }>
lastHorizonKey: quantized truck-focus key
```

## Current patch contents

```txt
cellId
level
lod
bounds
segments
positions
baseHeights
colors
indices
roads
settlements
focus
```

Missing contract fields:

```txt
worldGeneration
focusRevision
profileRevision
policyRevision
cellRevision
atlasSectorIds
patchRevision
patchDigest
createdAtFrame
```

## Current convergence rule

```js
if (!horizonHosts.has(cell.id) && horizonPatches.has(cell.id)) {
  realizeHorizonCell(horizonPatches.get(cell.id));
}
```

This rule supports first realization but not replacement. It cannot distinguish an unchanged patch from a newer patch for the same cell ID.

## Required invariants

1. Every accepted patch belongs to exactly one horizon world generation.
2. Every patch records the focus, profile, policy and cell revisions used to build it.
3. A host may be retained only when its patch digest matches the accepted patch digest.
4. A newer accepted patch atomically replaces an older host for the same cell.
5. A stale patch may never replace a newer host.
6. Old geometry is retired once and only once after replacement.
7. Road, settlement and forest content modes are either fully implemented or explicitly unsupported.
8. Macro-sector content has canonical ownership or clipping so adjacent cells do not duplicate it.
9. Optional horizon failure degrades to near-field rendering without failing gameplay.
10. A presented frame can acknowledge the exact host generation it drew.

## Proposed record shapes

```txt
HorizonPatchBuildResult
  status
  worldGeneration
  focusRevision
  cellId
  cellRevision
  policyRevision
  atlasSectorIds[]
  patchRevision
  patchDigest
  contentCounts
  diagnostics

HorizonHostReconciliationResult
  status: created | replaced | retained | retired | rejected-stale | failed
  cellId
  previousHostRevision
  acceptedPatchRevision
  hostRevision
  retirementReceipt
  diagnostics

HorizonFrameDigest
  frameSequence
  worldGeneration
  focusRevision
  visibleCellHostRevisions[]
  combinedDigest
```

## LOD mode contract

The current DSK declares:

```txt
forest: cluster-instances | canopy-clumps | forest-mass | silhouette | none
road: ribbon | thin-ribbon | line | none
settlement: low-detail | block-mass | silhouette | none
```

Each accepted mode must map to a distinct content recipe and budget. A `none` gate alone is not full policy adoption.

## Smallest safe implementation

1. Add `patchRevision` and `patchDigest` in `buildHorizonPatch()`.
2. Record the revision on the host entry.
3. In `reconcileHorizon()`, replace when revisions differ.
4. Return a reconciliation result.
5. Add deterministic mode and replacement fixtures.
6. Add frame diagnostics only after replacement correctness is executable.

## Boundary

This contract is documentation only and does not change the horizon implementation.
