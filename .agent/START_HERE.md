# START HERE: The Long Haul infinite-world map viewport audit

**Last updated:** `2026-07-17T01-01-09-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed pre-audit repository head:** `bc7cb7bebb802f87ce20bac138446e81987ca9ae`  
**Status:** `infinite-world-map-viewport-projection-authority-audited`

## Summary

The world profile, package and streamed-cell runtime admit infinite travel. The Canvas2D field map still computes its entire transform from the finite five-branch `course.bounds`, draws only finite-course roads and depots, and has no accepted viewport/content generation.

The focused risk is navigation projection: during valid far travel, the truck marker can leave the map canvas and streamed cells, macro sectors, atlas roads, settlements and portals cannot be represented.

## Goal

Make one renderer-neutral map authority choose the world window, query accepted semantic content, preserve discovery policy and commit one matching Canvas2D frame.

## What needs to happen

```txt
MapViewportAdmissionCommand
  -> bind run, world, course, atlas, cell and canvas revisions
  -> choose finite overview or player-centered infinite window
  -> publish MapViewportAdmissionResult

MapContentProjectionCommand
  -> query accepted course and streamed-world content
  -> filter discovery/rejection state
  -> clip roads, depots, settlements and portals
  -> publish MapContentProjectionResult and digest

MapFrameCommitCommand
  -> draw one accepted generation
  -> apply explicit truck-marker clipping/tracking policy
  -> publish FirstInfiniteMapBoundFrameAck
```

## Plan ledger

- [x] Compare all 11 Publish repositories.
- [x] Exclude `TheCavalryOfRome`.
- [x] Confirm ten eligible central ledgers and root `.agent` states.
- [x] Confirm all eligible `main` heads match documented heads.
- [x] Select only TheLongHaul by the oldest synchronized timestamp.
- [x] Inspect bootstrap, input, frame loop, streaming and Canvas2D map code.
- [x] Reconcile all 20 engine-installed kits and 35 source-backed surfaces.
- [x] Add the timestamped map audit family.
- [x] Keep runtime behavior unchanged.
- [ ] Implement map viewport/content admission and matching-frame proof.
- [ ] Execute source, browser, artifact and Pages fixtures.

## Current implementation census

```txt
Core kits installed:                  8
product DSKs installed:              12
engine-installed kits:               20
Core World effect providers:          1
standalone controllers:               1
browser/product adapters:             9
proof/deployment adapters:            4
total source-backed surfaces:        35
render surfaces:                      3
planned map-authority surfaces:      18
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-17T01-01-09-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-17T01-01-09-04-00-infinite-map-viewport-projection-dsk-map.md`
5. `map-system-audit/2026-07-17T01-01-09-04-00-infinite-world-map-window-contract.md`
6. `render-audit/2026-07-17T01-01-09-04-00-finite-course-map-in-infinite-world-gap.md`
7. `gameplay-audit/2026-07-17T01-01-09-04-00-map-open-infinite-navigation-loop.md`
8. `interaction-audit/2026-07-17T01-01-09-04-00-map-viewport-command-result-map.md`
9. `deploy-audit/2026-07-17T01-01-09-04-00-infinite-map-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-17T01-01-09-04-00-oldest-selection-infinite-map-reconciliation.md`
11. `turn-ledger/2026-07-17T01-01-09-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

The prior infinite-world atlas/cell-content adoption audit remains unresolved and directly precedes this map audit. Runtime-fault containment, product-policy adoption, focus/input retirement, Core adoption, WebGL recovery, accessibility, host-clock, audio, generation-budget, motion, pause, delivery settlement and rollback audits remain preserved.

## Next safe ledge

Do not patch `drawMap()` with ad hoc camera math alone. First define the map viewport, content query, discovery filter and generation identity, then keep Canvas2D as a projection adapter.