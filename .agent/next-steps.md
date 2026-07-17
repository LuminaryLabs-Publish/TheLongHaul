# Next steps

**Timestamp:** `2026-07-17T01-01-09-04-00`

## Goal

Give the field map one admitted world window and one accepted semantic-content generation without making Canvas2D another world owner.

## Plan ledger

### 1. Define map modes

- [ ] Add explicit `finite-course-overview`, `player-centered-infinite` and optional `sector-overview` modes.
- [ ] Decide whether map-open driving remains live or is suspended by policy.
- [ ] Define keyboard context, focus and announcement behavior for each mode.
- [ ] Bind mode retirement to route, run, pause, result, loss and title transitions.

### 2. Admit one viewport

- [ ] Add `MapViewportAdmissionCommand` and `MapViewportAdmissionResult`.
- [ ] Bind viewport identity to run, world profile, course package, canvas size and DPR revisions.
- [ ] Store center, world bounds, scale, tracking mode and clipping policy.
- [ ] Reject stale resize, route and run evidence.

### 3. Query accepted content

- [ ] Consume finite-course content through a stable course snapshot.
- [ ] Consume active streamed-cell and macro-sector content through accepted provider/atlas results.
- [ ] Preserve discovery, checked-depot and rejection policy.
- [ ] Define whether undiscovered settlements/portals are hidden, generalized or omitted.
- [ ] Compute `MapContentDigest`.

### 4. Project the player reliably

- [ ] Define player-centered tracking and edge-clipping behavior.
- [ ] Ensure the truck marker cannot silently disappear during valid travel.
- [ ] Preserve heading and marker scale across zoom changes.
- [ ] Define out-of-window classification for finite-overview mode.

### 5. Commit one map frame

- [ ] Add `MapFrameCommitCommand` and `MapFrameCommitResult`.
- [ ] Draw only from immutable viewport/content results.
- [ ] Reject late content after resize, route or run retirement.
- [ ] Publish `FirstInfiniteMapBoundFrameAck`.
- [ ] Keep Canvas2D drawing separate from semantic map queries.

### 6. Converge WebGL and map semantics

- [ ] Bind both surfaces to the same course/atlas/cell content identities.
- [ ] Distinguish semantic identity from icon or LOD representation.
- [ ] Define matching road, depot, settlement and portal IDs across surfaces.
- [ ] Retain the prior atlas/cell-content adoption authority as the upstream prerequisite.

### 7. Add executable fixtures

- [ ] Test inside and outside every finite course edge.
- [ ] Test distant positive and negative coordinates.
- [ ] Test gameplay-cell and macro-sector boundary crossings.
- [ ] Test map-open driving, paused map and route retirement.
- [ ] Test resize and DPR changes while open.
- [ ] Run `npm test`.
- [ ] Run browser fixtures and compare source, artifact and Pages receipts.

## Retained work

Infinite-world atlas/cell-content adoption remains the upstream semantic-content prerequisite. Runtime-frame fault containment remains an independent lifecycle risk and must not be folded into map projection.