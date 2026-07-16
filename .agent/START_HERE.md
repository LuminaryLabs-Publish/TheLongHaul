# START HERE: The Long Haul runtime-frame fault containment audit

**Last updated:** `2026-07-16T18-58-24-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed repository head:** `a756b21caee440a818bd23fd6e8556a9b3cb2426`  
**Status:** `runtime-frame-fault-containment-retirement-authority-audited`

## Summary

TheLongHaul's recursive RAF catches runtime exceptions and shows the existing failure overlay, but it schedules the next frame before executing current-frame work. A thrown generation, simulation, streaming, UI, audio or render phase therefore does not retire the scheduler or the failed runtime generation.

The focused gap is terminal fault settlement. There is no phase receipt, fault revision, stale-callback rejection, input/audio/world retirement, partial-frame settlement or first terminal-fault-frame acknowledgement.

## Intent

Make every runtime frame failure terminate one scheduler generation before any later callback can mutate or present state.

## What needs to happen

```txt
frame admitted
  -> bind session, scene, run, scheduler and frame revisions
  -> execute named phases with receipts
  -> on success publish RuntimeFrameExecutionResult
  -> on failure atomically retire the scheduler generation
  -> clear input, mute audio and retire pending world/generation work
  -> publish RuntimeFrameFaultResult
  -> present one stable accessible fault frame
  -> publish FirstFaultFrameAck
  -> allow only explicit reload or clean restart
```

## Checklist

- [x] Compare all 11 Publish repositories and ten eligible ledgers.
- [x] Exclude `TheCavalryOfRome`.
- [x] Confirm zero missing, undocumented or runtime-ahead eligible repositories.
- [x] Select only TheLongHaul by the oldest synchronized timestamp.
- [x] Identify the interaction loop, domains, kits and offered services.
- [x] Inspect the recursive RAF, generation error path, input clearing, world cleanup, audio and failure overlay.
- [x] Add the timestamped runtime-fault audit family.
- [x] Keep runtime behavior unchanged.
- [ ] Implement terminal fault settlement and scheduler-generation retirement.
- [ ] Add injected phase-failure fixtures across source, build artifact and Pages.

## Current implementation census

```txt
engine-installed kits:              18
Core World effect providers:         1
standalone controllers:              1
browser/product adapters:            9
proof/deployment adapters:           3
total source-backed surfaces:       32
render surfaces:                     3
planned runtime-fault surfaces:     19
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-16T18-58-24-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-16T18-58-24-04-00-runtime-frame-fault-containment-dsk-map.md`
5. `runtime-fault-audit/2026-07-16T18-58-24-04-00-frame-exception-retirement-contract.md`
6. `gameplay-audit/2026-07-16T18-58-24-04-00-partial-frame-mutation-crash-loop.md`
7. `interaction-audit/2026-07-16T18-58-24-04-00-runtime-fault-command-result-map.md`
8. `render-audit/2026-07-16T18-58-24-04-00-repeating-fault-overlay-frame-gap.md`
9. `deploy-audit/2026-07-16T18-58-24-04-00-runtime-fault-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-16T18-58-24-04-00-oldest-selection-runtime-fault-reconciliation.md`
11. `turn-ledger/2026-07-16T18-58-24-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

The product-policy runtime-adoption audit remains unresolved and preserved. Earlier browser-focus, Core adoption, WebGL recovery, accessibility, input contract, host-clock, audio, generation scheduling, motion preference, pause, delivery settlement and rollback audits remain in their timestamped families.

## Next safe ledge

Do not add automatic recovery inside the current catch block. First define terminal fault identity and scheduler retirement, then decide which failures may support a clean in-process restart and which must require a page reload.
