# Deploy audit: horizon browser and Pages fixture gate

**Timestamp:** `2026-07-18T03-43-36-04-00`

## Existing proof surfaces

- `npm test` runs domain/game/static smoke suites.
- `tests/static-shell-smoke.mjs` checks the pinned engine, one tick call, syntax and selected source markers.
- GitHub Actions validates main pushes.
- GitHub Pages publishes the static root.

## Current horizon coverage

Static smoke now proves source markers for:

```txt
createQuadtreePartition
registerHorizonWorld
groundHeight: ground.height
terrain normal sampling
app-chunk-13 loading
```

It does not execute the real browser horizon world, move the truck, update an already-realized cell, compare patch/host revisions, inspect geometry retirement, validate LOD modes, or compare deployed output.

## Required source fixture

1. Construct a deterministic horizon world with a fixed seed.
2. Admit one cell and realize its initial host.
3. Change focus while retaining that cell.
4. Produce an updated patch revision.
5. Assert the host revision changes and old geometry retires once.
6. Assert stale patches are rejected.
7. Assert each LOD mode produces the expected content class.

## Required browser fixture

```txt
load title
start deterministic course
wait for first horizon-bound frame
capture visible horizon host revisions
move across at least two focus keys
wait for replacement acknowledgements
assert no duplicate host per cell
assert no uncaught error or WebGL context loss
capture frame and diagnostic receipt
```

## Required artifact and Pages parity

Compare:

- source commit SHA;
- artifact commit SHA;
- deployed Pages commit SHA;
- pinned Nexus Engine revision;
- horizon policy revision;
- patch/host digest set;
- screenshot or frame receipt;
- browser console result.

## Gate

Do not claim horizon replacement correctness, LOD policy parity, artifact parity, Pages parity or production readiness until the source fixture, browser fixture and deployed-origin receipt all pass against one immutable commit.

## Boundary

No workflow, test or deployment file changed in this audit.
