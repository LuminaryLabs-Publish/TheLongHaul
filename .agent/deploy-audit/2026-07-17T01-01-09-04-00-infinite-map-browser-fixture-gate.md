# Deploy audit: infinite-map browser fixture gate

**Timestamp:** `2026-07-17T01-01-09-04-00`

## Required source fixtures

- Validate finite overview and player-centered infinite viewport policies.
- Validate stable world-to-map projection at positive and negative distant coordinates.
- Validate sector and cell boundary crossings.
- Validate discovery and rejected-depot filtering.
- Validate stale viewport/content rejection.
- Validate deterministic content digests.

## Required browser fixtures

```txt
open map inside course bounds
open map beyond each finite course edge
open map at distant positive coordinates
open map at distant negative coordinates
drive across a gameplay-cell boundary while map is open
drive across a macro-sector boundary while map is open
resize and change DPR while map is open
pause/result/loss/title retirement while map is open
```

Each fixture must capture:

- run and route revisions;
- viewport mode, center, bounds and revision;
- course/atlas/cell/discovery/delivery revisions;
- content digest;
- Canvas2D backing size;
- player-marker position or clipping classification;
- `FirstInfiniteMapBoundFrameAck`.

## Artifact and Pages gate

The built artifact and deployed Pages origin must reproduce the same viewport/content digest and fixture outcome as source. A visual screenshot without matching receipts is insufficient.

## Current status

```txt
source fixtures: unavailable
browser fixtures: unavailable
artifact smoke: not run
Pages smoke: not run
first matching map-frame proof: unavailable
```

## Boundary

No deployment or workflow changes were made.