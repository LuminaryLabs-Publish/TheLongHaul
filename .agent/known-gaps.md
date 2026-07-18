# Known gaps

**Timestamp:** `2026-07-18T15-38-25-04-00`

## Streaming cadence

- Near-world preparation runs on every driving frame.
- Only Core World focus/update and host reconciliation are gated by a changed near-cell key.
- No accepted streaming generation distinguishes changed from retained work.
- No stable direction key governs prefetch-only transitions.
- No cadence result records why streaming work ran.

## Desired-window work

- The same 3x3 active window is reconstructed while the truck remains in one 192-unit cell.
- Nine cell descriptors and nine mapped request descriptors are rebuilt per driving frame.
- The host does not retain an immutable desired-window plan.
- No desired membership diff or digest exists.
- The return value from `updateDesired()` is ignored.

## Prefetch ownership

- The controller has built-in `prefetchDistance: 3` behavior.
- The product adds a separate three-cell forward strip.
- No canonical prefetch plan joins both policies.
- Overlapping requests are not classified in a settlement result.
- Heading-only changes have no explicit admission cadence.

## Pump work budget

- The host calls `pump()` twice per driving frame.
- Queue state is not consulted before either call.
- Pump results are ignored.
- Idle, blocked, started and budget-exhausted states are not classified by the host.
- No accepted generation owns started patch work.

## Allocation and diagnostics

- The product caller creates a conservative minimum of 56 source-visible objects or arrays per driving frame.
- Controller-owned clones, sets, arrays, statistics and queue results add further unmeasured work.
- No allocation-byte, heap, GC or frame-time fixture exists.
- No bounded diagnostic reports retained frames, idle pumps, overlap classifications or stale rejections.
- No performance regression or memory leak is established without profiling.

## Frame convergence

- No digest binds desired, prefetched, prepared, active and realized near-cell membership.
- No frame identifies the accepted streaming generation.
- No `FirstNearWorldStreamingBoundFrameAck` exists.
- Late ready work after retry or course retirement has no explicit stale rejection receipt.
- Source, artifact and Pages streaming parity is unproven.

## Validation and deployment

- Static smoke does not execute near-world cadence.
- No stationary-frame fixture exists.
- No within-cell retained-plan fixture exists.
- No heading-only prefetch fixture exists.
- No cell-transition work-count fixture exists.
- No active-world/realized-host membership fixture exists.
- `npm test`, browser profiling, artifact smoke and Pages smoke were not run during this documentation audit.

## Retained gaps

Horizon patch/host convergence, best-run persistence, map mode, infinite-map content, runtime fault containment, input/focus, WebGL recovery, accessibility, fixed-step clock, audio, generation, pause, delivery and rollback gaps remain preserved.

## Completion boundary

Do not claim reduced allocations, reduced frame cost, correct retained cadence, canonical prefetch ownership, stale-work safety, matching-frame proof, artifact parity, Pages parity or production readiness until one accepted streaming generation is exercised through executable source and browser fixtures.