# Next steps

**Timestamp:** `2026-07-18T03-43-36-04-00`

## Goal

Make horizon patch preparation, host replacement, LOD content adoption and visible-frame proof explicit without moving world semantics into renderer-local conditionals.

## Checklist

### 1. Add generation identity

- [ ] Add horizon world generation and monotonic focus revision.
- [ ] Add profile and Horizon LOD policy revisions.
- [ ] Add cell revision to every provider request.
- [ ] Reject work from retired course or focus generations.

### 2. Version patches

- [ ] Add `patchRevision` and deterministic `patchDigest`.
- [ ] Record the atlas sector IDs sampled by the patch.
- [ ] Record road, settlement and forest content modes.
- [ ] Publish a typed `HorizonPatchBuildResult`.

### 3. Reconcile hosts

- [ ] Store accepted patch revision and digest in each host.
- [ ] Replace an existing host when its accepted patch changes.
- [ ] Retain only when host and patch digests match.
- [ ] Return created, replaced, retained, retired and rejected-stale results.
- [ ] Dispose replaced terrain geometry exactly once.

### 4. Complete LOD policy adoption

- [ ] Implement distinct road recipes for ribbon, thin-ribbon and line.
- [ ] Implement distinct settlement recipes for low-detail, block-mass and silhouette.
- [ ] Implement forest modes or remove unsupported modes from the game-stable DSK contract.
- [ ] Give macro-sector roads and settlements canonical cell ownership or clipping.

### 5. Bind the visible frame

- [ ] Add `HorizonFrameDigest`.
- [ ] Include world, focus, policy, cell and host revisions.
- [ ] Publish `FirstHorizonGenerationBoundFrameAck`.
- [ ] Surface optional horizon degradation in bounded diagnostics.

### 6. Validate

- [ ] Add deterministic patch replacement tests.
- [ ] Add stale-focus and stale-cell rejection tests.
- [ ] Add resource-retirement tests.
- [ ] Add LOD mode content tests.
- [ ] Drive across quadtree refinement boundaries in a browser fixture.
- [ ] Run `npm test`.
- [ ] Compare source, artifact and Pages receipts.

## Retained work

Best-run persistence, map mode, infinite-map projection, runtime faults, focus release, WebGL recovery, accessibility, clock, audio, generation, pause, delivery and rollback remain separate unresolved audit families.
