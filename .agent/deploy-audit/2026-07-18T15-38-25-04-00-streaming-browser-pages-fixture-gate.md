# Deploy audit: near-world streaming browser and Pages fixture gate

**Timestamp:** `2026-07-18T15-38-25-04-00`

## Existing delivery path

```txt
main
  -> GitHub Actions static smoke
  -> GitHub Pages static-root publication
  -> browser import map
  -> pinned Three.js and Nexus Engine
  -> ordered 13-chunk host bootstrap
```

The existing smoke suite verifies source markers, syntax, engine pinning, generation determinism, truck motion and delivery evaluation. It does not execute the browser streaming cadence or compare source, artifact and deployed behavior.

## Missing evidence

- No browser fixture counts `setFocus`, `updateDesired`, `request` or `pump` calls.
- No fixture proves retained streaming plans during 600 stationary frames.
- No fixture proves exactly one active-window transition per cell boundary.
- No fixture classifies controller/product prefetch overlap.
- No fixture checks idle-pump suppression.
- No fixture binds active Core World cells to realized Three.js hosts and batches.
- No first-frame acknowledgement carries a near-world streaming digest.
- No source/artifact/Pages parity receipt exists for this system.

## Required source fixture

```txt
start a fixed seed
enter driving
hold a stationary pose for 600 frames
record streaming call counts and results
rotate through cardinal and diagonal direction keys
cross one cell boundary
assert deterministic desired/prefetch membership
assert no stale work survives retry or new course
assert active cells equal realized host cells
```

## Required browser evidence

Capture:

```txt
course generation
near-cell key
direction key
desired active IDs
desired prefetch IDs
queued/inflight counts
pump started counts
active Core World IDs
realized terrain host IDs
realized batch cell IDs
NearWorldStreamingDigest
FirstNearWorldStreamingBoundFrameAck
```

## Artifact and Pages gate

The built artifact and deployed Pages origin must reproduce the same:

- streaming generation identity;
- active-window transition count;
- prefetch plan and overlap classifications;
- patch queue results;
- active and realized cell digests;
- first matching-frame acknowledgement.

## Failure policy

A failed fixture must report a bounded classification:

```txt
focus-cadence-mismatch
desired-window-mismatch
prefetch-plan-mismatch
idle-pump-work
stale-generation-work
active-host-membership-mismatch
missing-frame-ack
artifact-parity-mismatch
pages-parity-mismatch
```

## Validation boundary

No workflow, package, artifact or Pages deployment was changed by this audit. `npm test`, browser instrumentation, artifact smoke and deployed-origin smoke were not run.