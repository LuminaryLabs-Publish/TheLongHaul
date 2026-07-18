# START HERE: The Long Haul horizon convergence audit

**Last updated:** `2026-07-18T03-43-36-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed runtime head:** `753488e40e69fc13471df42959628ef3052e5992`  
**Status:** `horizon-patch-render-host-convergence-authority-audited`

## Summary

The runtime now has a second Core World for quadtree horizon terrain, a curved-horizon surface, a presentation provider, macro-sector roads and settlements, cross-cell terrain normals, conformed road elevation, grounded truck pose and a raised chase camera.

The provider can replace a patch in `horizonPatches`, but the Three.js reconciliation path only realizes cells without an existing host. An updated patch for an already-realized cell therefore has no explicit replacement settlement. Because patch heights depend on focus and policy, the visible horizon has no proof that it presents the latest accepted generation.

## Intent

Create one renderer-neutral authority for horizon world generation, patch revision, host replacement, resource retirement and visible-frame convergence.

## What needs to happen

```txt
HorizonWorldAdmissionCommand
  -> HorizonWorldAdmissionResult

HorizonPatchBuildCommand
  -> HorizonPatchBuildResult

HorizonPatchSettlementCommand
  -> HorizonPatchSettlementResult

HorizonHostReconciliationCommand
  -> created | replaced | retained | retired | rejected-stale
  -> HorizonHostReconciliationResult

HorizonProjectionCommitCommand
  -> HorizonFrameDigest
  -> FirstHorizonGenerationBoundFrameAck
```

## Checklist

- [x] Compared all 11 Publish repositories.
- [x] Excluded `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirmed ten eligible ledgers and root `.agent` states.
- [x] Selected only TheLongHaul as the newest runtime-ahead eligible repository.
- [x] Reconciled 14 runtime commits after the prior documentation head.
- [x] Identified the complete interaction loop and active domains.
- [x] Documented all 20 installed kits, two providers, one controller, nine adapters and four proof/deployment surfaces.
- [x] Added the timestamped horizon audit family.
- [x] Kept runtime, gameplay, rendering, tests and deployment unchanged.
- [ ] Add patch and host revisions with atomic replacement.
- [ ] Fully implement or narrow the named Horizon LOD content modes.
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
proposed horizon-convergence surfaces: 20
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-18T03-43-36-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-18T03-43-36-04-00-horizon-patch-host-convergence-dsk-map.md`
5. `horizon-system-audit/2026-07-18T03-43-36-04-00-patch-generation-host-convergence-contract.md`
6. `render-audit/2026-07-18T03-43-36-04-00-horizon-patch-visible-host-convergence-gap.md`
7. `gameplay-audit/2026-07-18T03-43-36-04-00-driving-horizon-update-loop.md`
8. `interaction-audit/2026-07-18T03-43-36-04-00-horizon-command-result-map.md`
9. `deploy-audit/2026-07-18T03-43-36-04-00-horizon-browser-pages-fixture-gate.md`
10. `central-sync-audit/2026-07-18T03-43-36-04-00-runtime-ahead-horizon-reconciliation.md`
11. `turn-ledger/2026-07-18T03-43-36-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

The best-run persistence audit and all prior map, world, runtime-fault, input, WebGL, accessibility, clock, audio, generation, pause, delivery and rollback audits remain unresolved and preserved.

## Next safe ledge

Do not add another visual workaround around `reconcileHorizon()`. First give patches and hosts comparable revisions, then replace stale hosts atomically and prove the matching presented frame.
