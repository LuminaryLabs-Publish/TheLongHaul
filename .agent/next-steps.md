# Next steps

**Timestamp:** `2026-07-16T19-39-24-04-00`

## Goal

Adopt macro-sector atlas truth into the existing streamed gameplay-cell pipeline without creating a second world, patch or renderer owner.

## Plan ledger

### 1. Bind one extent manifest

- [ ] Add `InfiniteWorldManifest` containing product release, profile revision, package digest, world seed, generator version, cell size and macro-sector size.
- [ ] Validate profile and package extent agreement before world registration.
- [ ] Reject a bounded profile paired with an infinite package, or vice versa.
- [ ] Record whether horizon policy is active, proof-only or deferred.

### 2. Add deterministic sector demand

- [ ] Derive all macro sectors overlapping each desired gameplay cell.
- [ ] Add stable sector demand identity and duplicate suppression.
- [ ] Generate or retrieve immutable sector results through `long-haul-world-atlas-kit`.
- [ ] Publish sector digests.
- [ ] Reject results from retired run/provider generations.

### 3. Define course-versus-atlas ownership

- [ ] Preserve the finite five-branch course as the delivery challenge owner.
- [ ] Define deterministic overlap priority for course roads, depots and signs.
- [ ] Define atlas road generation from paired sector-edge portals.
- [ ] Define settlement exclusion/composition around course depots.
- [ ] Ensure surface queries and recovery poses consume the same accepted road plan.

### 4. Build one gameplay-cell content plan

- [ ] Enumerate every overlapping macro sector geometrically; 1024 and 192 are not integer multiples.
- [ ] Clip/deduplicate roads, settlements and portals by explicit cell ownership.
- [ ] Bind terrain, biome, density, vegetation and obstacle policies.
- [ ] Sort contributions deterministically.
- [ ] Compute `WorldCellGenerationKey` and `WorldCellContentDigest`.
- [ ] Preserve exact terrain-edge sampling.

### 5. Commit through existing world infrastructure

- [ ] Extend `createCourseCellDescriptor` or replace it with one semantic content-plan adapter; do not bypass patch preparation.
- [ ] Bind patch cache identity to sector digests and content-policy revisions.
- [ ] Commit through the existing Core World provider.
- [ ] Reject late or duplicate patch work.
- [ ] Release both course- and atlas-owned graphics writes with the cell.

### 6. Project matching WebGL and map state

- [ ] Render atlas roads, settlements and portals from the committed content plan.
- [ ] Extend map projection from finite-course-only data to accepted atlas content.
- [ ] Keep LOD representation separate from semantic identity.
- [ ] Publish `FirstAtlasBoundWorldFrameAck` with sector, cell, content and frame IDs.

### 7. Add executable fixtures

- [ ] Test one, two and four-sector cell overlap.
- [ ] Test positive and negative distant coordinates.
- [ ] Test course/atlas road overlap and portal continuity.
- [ ] Test settlement ownership across cell boundaries.
- [ ] Test cache reuse and stale-generation rejection.
- [ ] Test surface classification on a visible atlas road.
- [ ] Run `npm test`.
- [ ] Run deterministic far-drive browser fixtures.
- [ ] Compare source, built artifact and deployed Pages receipts.

## Retained work

Runtime-frame fault containment remains the next independent lifecycle risk. Do not fold its scheduler-retirement behavior into the infinite-world content authority; only bind its existing run/provider generation retirement once that authority is implemented.
