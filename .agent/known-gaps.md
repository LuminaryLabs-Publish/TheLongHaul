# Known gaps

**Timestamp:** `2026-07-17T01-01-09-04-00`

## Goal

Track every missing contract between infinite-world travel and the Canvas2D field-map frame.

## Map viewport ownership

- `drawMap()` derives its complete transform from finite `course.bounds`.
- No renderer-neutral map viewport owner exists.
- No explicit finite-overview versus player-centered-infinite policy exists.
- Map center, scale, world bounds and tracking mode have no revision identity.
- Resize and DPR evidence are not admitted into a map generation result.

## Semantic content query

- The map reads mutable course, delivery and truck state directly.
- It does not consume accepted Core World cell results.
- It does not consume macro-sector or atlas state.
- It cannot represent atlas roads, settlements or portals.
- No stable course/atlas/cell content digest exists.
- No deterministic clipping and deduplication result exists.

## Player navigation

- Valid world streaming continues outside finite course bounds.
- The truck marker can project beyond the canvas without explicit clipping classification.
- No player-centered tracking window exists.
- No map zoom or coverage policy exists.
- No visible indication distinguishes outside-course free travel from missing map coverage.

## Map-open interaction

- Driving input and simulation continue while the map is open.
- That behavior is not represented by an explicit map-mode result.
- No map-specific input context, focus destination or Escape policy exists.
- Route/run retirement has no typed map-session settlement.
- Reopening the map has no stale-content rejection receipt.

## Cross-surface convergence

- WebGL and Canvas2D do not consume one shared semantic content result.
- Map icons and WebGL objects have no matching content IDs for streamed atlas features.
- No `MapFrameCommitResult` exists.
- No `FirstInfiniteMapBoundFrameAck` exists.
- No frame receipt proves that the truck marker and visible world use matching revisions.

## Validation and deployment

- No distant-coordinate map projection fixture exists.
- No gameplay-cell or macro-sector crossing fixture exists.
- No resize/DPR map-generation fixture exists.
- No map-open driving/paused-map policy fixture exists.
- No source/artifact/Pages content-digest parity fixture exists.
- `npm test` was not run during this documentation audit.

## Retained gaps

The preceding infinite-world atlas/cell-content adoption gap remains unresolved and is the upstream source of missing streamed semantic content. Runtime-frame fault containment, product-policy adoption, browser-focus input retirement, Core adoption, WebGL recovery, accessibility, host-clock, audio, generation scheduling, motion preference, pause, delivery settlement and rollback remain preserved in prior audit families.

## Completion boundary

Do not claim infinite map usability, player tracking, atlas-backed map content, WebGL/map convergence, first map-bound frame proof, artifact parity, Pages parity or production readiness until one accepted viewport/content generation is committed and acknowledged.