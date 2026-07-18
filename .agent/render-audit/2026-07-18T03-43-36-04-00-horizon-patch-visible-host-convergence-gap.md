# Render audit: horizon patch to visible-host convergence gap

**Timestamp:** `2026-07-18T03-43-36-04-00`

## Render surfaces

```txt
Three.js WebGL
  -> near-field terrain cells
  -> road ribbons
  -> vegetation and grass batches
  -> depots and signs
  -> truck and wildlife rigs
  -> distant horizon terrain, roads and settlements

Canvas2D
  -> paper map

DOM
  -> menus, generation, HUD, pause, results, loss and fault overlays
```

## Horizon realization path

`buildHorizonPatch()` creates absolute-position terrain geometry with focus-dependent horizon drop. The provider stores that patch by `cell.id`. `realizeHorizonCell()` builds a new `BufferGeometry`, road meshes and settlement meshes, then stores `{ group, geometry, patch }` in `horizonHosts`.

`reconcileHorizon()` only calls `realizeHorizonCell()` when the host is absent. It does not replace an existing host when `horizonPatches.get(cell.id)` changes.

## Visible convergence risk

The following conditional path is source-backed:

```txt
cell already has a realized host
  -> provider updateCell creates a newer patch
  -> horizonPatches entry is replaced
  -> horizonHosts entry remains present
  -> reconcileHorizon retains the old geometry
```

The patch contains focus-dependent curved heights and sampled macro-sector content. Without a patch revision and host revision, the visible frame cannot prove it presents the latest accepted patch.

This audit does not claim the stale path is visible in every drive. It records that the renderer has no executable mechanism to detect or settle it.

## LOD presentation gap

The LOD policy defines multiple road, settlement and forest modes. The renderer currently:

- renders one road box style whenever `roadMode !== "none"`;
- renders one settlement block style whenever `settlementMode !== "none"`;
- does not realize a forest mode;
- uses one cone near each settlement with the forest material, which is not a policy-driven forest projection.

## Resource lifecycle

Positive evidence:

- terrain geometry is disposed when a horizon host is released;
- inactive hosts are removed;
- all hosts are released on horizon reset.

Open evidence gaps:

- child road and settlement meshes share reusable geometry and materials, so no per-child disposal is required;
- no replacement path exists for a changed patch;
- no result confirms old host retirement before new host admission;
- no digest binds visible geometry to world, focus, policy and atlas revisions.

## Required render proof

```txt
accepted HorizonPatchBuildResult
  -> host create or replacement result
  -> old-host retirement receipt
  -> host revision equals patch revision
  -> HorizonFrameDigest
  -> FirstHorizonGenerationBoundFrameAck
```

## Fixtures needed

1. Hold one horizon cell active while changing focus enough to update its patch.
2. Assert the realized host patch revision advances.
3. Assert old geometry is retired exactly once.
4. Assert road, settlement and forest modes produce distinct expected content.
5. Drive across quadtree refinement boundaries and check duplicate/missing content.
6. Capture source, artifact and Pages frame receipts.

## Boundary

No visual runtime code changed. No visible defect, performance amount, GPU-memory amount or deployment parity is claimed.
