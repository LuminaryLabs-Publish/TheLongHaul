# Known gaps

**Timestamp:** `2026-07-18T03-43-36-04-00`

## Patch identity

- Horizon patches have no world generation.
- Focus, profile, policy and cell revisions are not recorded.
- Sampled macro-sector identities are not retained.
- No patch revision or digest exists.
- Provider descriptors expose only cell ID and LOD.

## Host convergence

- An updated patch can replace `horizonPatches[cell.id]` while an older host remains realized.
- Existing hosts are not compared with current patches.
- No atomic host replacement path exists.
- No stale-host classification exists.
- No replacement or retirement receipt exists.

## LOD policy adoption

- Terrain-resolution policy is consumed.
- Road and settlement modes only gate `none` versus present.
- Ribbon, thin-ribbon and line do not produce distinct road geometry.
- Low-detail, block-mass and silhouette do not produce distinct settlement geometry.
- Forest modes are not realized.
- Unsupported game-stable policy values are not reported.

## Atlas ownership

- Each cell independently samples intersecting macro sectors.
- Distant roads run from sector center to portals without cell clipping.
- Settlement arrays are admitted without canonical cell ownership.
- Adjacent or refined quadtree cells can therefore lack explicit duplicate-prevention evidence.
- No sector/content digest proves stable LOD transitions.

## Frame convergence

- Horizon geometry has no host revision.
- A rendered frame has no horizon world or focus revision.
- No digest binds visible cells to accepted patch revisions.
- No `FirstHorizonGenerationBoundFrameAck` exists.
- Late updates after world retirement have no visible rejection receipt.

## Validation and deployment

- Static smoke checks source markers only.
- No patch-replacement fixture exists.
- No stale-focus or stale-cell fixture exists.
- No LOD mode realization fixture exists.
- No quadtree transition browser fixture exists.
- No source/artifact/Pages horizon parity receipt exists.
- `npm test` was not run during this documentation audit.

## Retained gaps

Best-run persistence, map mode, infinite-map content, runtime fault containment, input/focus, WebGL recovery, accessibility, fixed-step clock, audio, generation, pause, delivery and rollback gaps remain preserved.

## Completion boundary

Do not claim horizon generation convergence, full LOD policy adoption, duplicate-free atlas projection, matching-frame proof, artifact parity, Pages parity or production readiness until one accepted patch generation is reconciled to the matching host and acknowledged by a rendered frame.
