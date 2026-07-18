# START HERE: The Long Haul near-world streaming cadence audit

**Last updated:** `2026-07-18T15-38-25-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed runtime source revision:** `753488e40e69fc13471df42959628ef3052e5992`  
**Reviewed pre-audit repository head:** `2c21dbcd06f823633b2bad3d9977ab1ebe6bcbdd`  
**Status:** `near-world-streaming-desired-set-cadence-work-budget-authority-audited`

## Summary

All 11 Publish repositories were compared. Ten were eligible after excluding `LuminaryLabs-Publish/TheCavalryOfRome`. Every eligible repository had central-ledger coverage, root `.agent` state, and a current `main` head matching its recorded documentation head. TheLongHaul had the oldest synchronized central timestamp and was the only selected project.

The focused audit found that near-world preparation work runs on every driving frame even while the truck remains in the same 192-unit cell. The host rebuilds the 3x3 desired window, republishes focus, runs `updateDesired()`, pumps generation, issues three manual prefetch requests, and pumps again. Only Core World focus/update and near-host reconciliation are gated by a changed cell key.

With `ACTIVE_RADIUS = 1`, the caller creates at least 56 source-visible objects or arrays per driving frame before controller-owned clones, sets, arrays, statistics and queue results. At a hypothetical 60 displayed frames per second this is 3,360 caller-owned constructions per second. This is source arithmetic, not measured browser or memory evidence.

## Intent

Create one renderer-neutral authority for near-world streaming generation, meaningful focus cadence, desired-window settlement, canonical prefetch planning, pump admission, stale-work rejection and matching-frame proof.

## What needs to happen

```txt
StreamingGenerationAdmissionCommand
  -> StreamingGenerationAdmissionResult

StreamingFocusAdmissionCommand
  -> StreamingFocusAdmissionResult

DesiredWindowSettlementCommand
  -> DesiredWindowSettlementResult

PrefetchPlanCommand
  -> PrefetchPlanResult

PatchPreparationPumpCommand
  -> PatchPreparationPumpResult

StreamingProjectionCommitCommand
  -> NearWorldStreamingDigest
  -> FirstNearWorldStreamingBoundFrameAck
```

## Checklist

- [x] Compared all 11 Publish repositories.
- [x] Excluded `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirmed ten eligible ledgers and root `.agent` states.
- [x] Confirmed all ten eligible `main` heads matched their recorded documentation heads.
- [x] Selected only TheLongHaul by the oldest synchronized documented-selection rule.
- [x] Identified the complete interaction loop and active domains.
- [x] Documented all 20 installed kits, two providers, one controller, nine adapters and four proof/deployment surfaces.
- [x] Documented the conservative 56-construction caller-owned floor per driving frame.
- [x] Added the timestamped streaming cadence audit family.
- [x] Kept runtime, gameplay, rendering, tests and deployment unchanged.
- [ ] Add stable streaming generation, cell and direction keys.
- [ ] Cache and diff the desired 3x3 active window.
- [ ] Settle one canonical controller/product prefetch plan.
- [ ] Admit pumps from queue state and work budgets instead of every driving frame.
- [ ] Execute source, browser, artifact and Pages fixtures.

## Current census

```txt
Core kits: 8
product DSKs: 12
engine-installed kits: 20
Core World effect providers: 2
standalone controllers: 1
browser/product adapters: 9
proof/deployment adapters: 4
total source-backed surfaces: 36
render surfaces: 3
proposed streaming-cadence surfaces: 20
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-18T15-38-25-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-18T15-38-25-04-00-near-world-streaming-cadence-budget-dsk-map.md`
5. `streaming-system-audit/2026-07-18T15-38-25-04-00-desired-set-cadence-work-budget-contract.md`
6. `render-audit/2026-07-18T15-38-25-04-00-streaming-work-visible-frame-proof-gap.md`
7. `gameplay-audit/2026-07-18T15-38-25-04-00-driving-near-world-streaming-loop.md`
8. `interaction-audit/2026-07-18T15-38-25-04-00-streaming-command-result-map.md`
9. `deploy-audit/2026-07-18T15-38-25-04-00-streaming-browser-pages-fixture-gate.md`
10. `central-sync-audit/2026-07-18T15-38-25-04-00-oldest-selection-streaming-audit.md`
11. `turn-ledger/2026-07-18T15-38-25-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

The horizon patch/host convergence audit and all prior best-run, map, world, runtime-fault, input, WebGL, accessibility, clock, audio, generation, pause, delivery and rollback audits remain unresolved and preserved.

## Next safe ledge

Do not add an ad hoc `if (key === lastCellKey) return` around the entire streaming function. First separate active-window cadence from direction-sensitive prefetch cadence, consume controller results, preserve queued work, and prove identical patch and host membership.