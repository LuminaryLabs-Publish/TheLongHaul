# START HERE: The Long Haul best-run persistence audit

**Last updated:** `2026-07-17T17-39-07-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed pre-audit repository head:** `3fb11448580405aaa864b106af5dd73e8f06283a`  
**Reviewed runtime source revision:** `189a586877db2bf3e0b1a7c74ae072b552b6fe9a`  
**Status:** `best-run-scope-durable-record-projection-authority-audited`

## Summary

The game produces a detailed terminal run result, then reduces it to one browser-global best record containing adjusted time, rating and a short course code. The record is compared only by adjusted time across procedurally different courses, silently written under `the-long-haul-best-v2`, and never restored into a visible surface.

This audit does not declare the global comparison invalid. It records that scope, schema revision, comparison, durability, migration, failure classification and visible-frame projection are not owned by a DSK result.

## Goal

Create one renderer-neutral best-run authority. Keep comparison and persistence semantics in domain results; keep local storage and DOM as adapters.

## What needs to happen

```txt
BestRunPolicyAdmissionCommand
  -> choose and bind one comparison scope
  -> BestRunPolicyResult

BestRunCandidateCommand
  -> classify better, equal, worse, incomparable or invalid
  -> BestRunCandidateResult

BestRunCommitCommand
  -> write and verify one versioned record
  -> BestRunCommitResult

BestRunRestoreCommand
  -> parse, validate and migrate compatible data
  -> BestRunRestoreResult

BestRunProjectionCommitCommand
  -> BestRunFrameDigest
  -> FirstBestRunBoundFrameAck
```

## Checklist

- [x] Compared all 11 Publish repositories.
- [x] Excluded `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirmed ten eligible central ledgers, root `.agent` folders and matching heads.
- [x] Selected only TheLongHaul by the oldest synchronized timestamp.
- [x] Inspected scoring, results projection, storage, route and frame-loop paths.
- [x] Reconciled all 20 installed kits and 35 source-backed surfaces.
- [x] Added the timestamped best-run audit family.
- [x] Kept runtime, scoring, storage and deployment behavior unchanged.
- [ ] Choose and implement a best-run comparison scope.
- [ ] Implement versioned commit, readback, restore, migration and reset results.
- [ ] Execute source, browser, artifact and Pages fixtures.

## Current census

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
proposed best-run surfaces:          18
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-17T17-39-07-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-17T17-39-07-04-00-best-run-scope-durable-record-dsk-map.md`
5. `best-run-system-audit/2026-07-17T17-39-07-04-00-scope-durability-projection-contract.md`
6. `render-audit/2026-07-17T17-39-07-04-00-unprojected-best-run-visible-frame-gap.md`
7. `gameplay-audit/2026-07-17T17-39-07-04-00-run-result-best-record-loop.md`
8. `interaction-audit/2026-07-17T17-39-07-04-00-best-run-command-result-map.md`
9. `deploy-audit/2026-07-17T17-39-07-04-00-best-run-browser-pages-fixture-gate.md`
10. `central-sync-audit/2026-07-17T17-39-07-04-00-oldest-selection-best-run-reconciliation.md`
11. `turn-ledger/2026-07-17T17-39-07-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

The map-mode input/focus audit remains unresolved. Infinite map viewport and atlas adoption, runtime faults, focus release, Core adoption, WebGL recovery, accessibility, clock, audio, generation, motion, pause, delivery and rollback audits remain preserved.

## Next safe ledge

Do not add more local-storage logic to `showResults()`. First choose a comparison scope and canonical record contract, then bind the storage adapter and visible projection to typed results.