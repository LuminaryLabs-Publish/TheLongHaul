# Known gaps

**Timestamp:** `2026-07-16T19-39-24-04-00`

## Goal

Track every missing contract between the declared infinite world and the semantic content committed into distant gameplay cells.

## Extent and revision convergence

- World profile and course package both say infinite, but no shared immutable extent manifest binds them at runtime.
- Profile, package, course, atlas, generator, provider and run revisions are not combined into one admission result.
- A profile reconfiguration has no migration or cache-invalidation contract.
- The finite course bounds are retained separately without an explicit semantic role after the world becomes infinite.

## Macro-sector demand and identity

- The installed atlas is not demanded by the playable patch path.
- No gameplay-cell request enumerates its overlapping macro sectors.
- No immutable sector digest is published.
- No duplicate, stale or retired sector-result classification exists.
- Macro-sector size 1024 and gameplay-cell size 192 require overlap geometry, but no addressing contract defines it.

## Road, settlement and portal ownership

- Distant macro sectors can describe settlements and four edge portals.
- No atlas road graph is derived from neighboring portal pairs.
- No course-versus-atlas road priority exists.
- No deterministic settlement exclusion/composition policy exists around course depots.
- No gameplay-cell ownership rule prevents duplicate roads or settlements across cell/sector boundaries.
- The atlas road registry exists as state but has no playable adoption path.

## Gameplay continuity

- `nearestRoad`, surface grip, exploration and map logic use the finite course.
- Outside-course travel is now allowed, but no atlas road becomes a drivable semantic road.
- Distant cells can be permanently classified off-road despite future visible atlas road intent.
- No atlas settlement interaction or discovery result exists.
- Delivery remains finite-course scoped, with no explicit free-roam/end-of-course policy.

## Cell generation and caching

- `createCourseCellDescriptor` consumes only the finite course and exact cell.
- Terrain uses fixed 24-segment construction even though a horizon LOD policy is installed.
- No `WorldCellGenerationKey` binds sector digests, policies and generator version.
- Cache validity does not prove the same sector/content revisions.
- No stale patch rejection is bound to atlas generation.
- No content digest is carried through provider commit and release.

## Render and map proof

- WebGL can show continuing terrain but not proven atlas-derived roads, settlements or portals.
- Canvas2D map projects finite-course roads and depots only.
- No shared WebGL/map content result exists for distant sectors.
- No horizon representation is bound to accepted atlas semantics.
- No `FirstAtlasBoundWorldFrameAck` exists.

## Validation and deployment

- Source tests prove distant terrain finiteness, determinism and shared edges only.
- No atlas-backed cell-content fixture exists.
- No cross-sector portal/road fixture exists.
- No course/atlas overlap fixture exists.
- No far-drive browser fixture exists.
- No source/artifact/Pages content-digest parity fixture exists.
- `npm test` was not run during this documentation audit.

## Retained gaps

Runtime-frame fault containment, product-policy adoption, browser-focus input retirement, Core adoption, WebGL recovery, accessibility, host-clock, audio, generation scheduling, motion preference, pause, delivery settlement and rollback remain preserved in prior audit families.

## Completion boundary

Do not claim a populated infinite world, atlas-backed driving continuity, horizon-policy adoption, map/WebGL convergence, artifact parity, Pages parity or production readiness until distant cells consume accepted sector results and publish matching provider and frame receipts.
