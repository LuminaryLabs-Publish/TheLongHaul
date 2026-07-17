# Current audit: best-run scope, durability and projection

**Timestamp:** `2026-07-17T17-39-07-04-00`  
**Reviewed pre-audit repository head:** `3fb11448580405aaa864b106af5dd73e8f06283a`  
**Reviewed runtime source revision:** `189a586877db2bf3e0b1a7c74ae072b552b6fe9a`  
**Status:** `best-run-scope-durable-record-projection-authority-audited`

## Summary

`buildRunResult()` combines Course, Run, Delivery and meter evidence into a detailed terminal result. `showResults()` projects that current result, reads one global local-storage key and replaces it only when the new `adjustedTime` is lower.

The stored object retains only adjusted time, rating and a short course code. It is never restored into title, results, HUD or map presentation. No domain result chooses comparison scope, versions the record, classifies storage faults, verifies readback, migrates legacy data or binds the stored record to a visible frame.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 0
all eligible heads matched: yes
selected: LuminaryLabs-Publish/TheLongHaul
selection: oldest synchronized documented timestamp
selected prior timestamp: 2026-07-17T07-38-20-04-00
```

## Complete interaction loop

```txt
page load and ordered bootstrap
  -> restore settings
  -> install 8 Core and 12 product kits
  -> create browser, rendering, audio and storage adapters

start and drive
  -> generate and verify course
  -> activate cells and reset gameplay
  -> drive, explore, collide, recover and evaluate depots
  -> settle delivery completion

result
  -> build rich RunResult
  -> project current score cells
  -> read the-long-haul-best-v2
  -> compare adjustedTime only
  -> optionally write reduced record
  -> publish no commit/readback/failure result
  -> render no restored best record

retry, fresh course or title
  -> route changes without a best-record projection generation
```

## Domains in use

Browser startup, ordered modules, document/RAF/resize/keyboard/focus/storage; Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger; World Profile, World Atlas, Horizon LOD, Road Classes, Terrain Policy, Truck Dynamics, Delivery Contracts, Truck, Course, Run, Delivery and Wildlife; procedural course and infinite-cell generation; patch preparation; Core World provider; result scoring and best-run persistence; WebGL, Canvas2D, DOM, WebAudio, Node smoke, Actions, Pages and governance.

## Kit and service census

All IDs and offered services are enumerated in `trackers/2026-07-17T17-39-07-04-00/project-breakdown.md` and `kit-registry.json`.

```txt
engine-installed kits:               20
world providers:                      1
controllers:                          1
browser/product adapters:             9
proof/deployment adapters:            4
total source-backed surfaces:        35
proposed best-run surfaces:          18
```

## Source-backed finding

The persisted record is globally scoped by implementation but not by an admitted product policy. It omits canonical course and scoring identities, silently absorbs parse/write failures and has no restore projection. The source therefore cannot prove comparison fairness, durable commit, migration compatibility or a matching visible record frame.

## Required authority

**Proposed, not implemented:**

`the-long-haul-best-run-scope-durable-record-projection-authority-domain`

```txt
BestRunPolicyAdmissionCommand
  -> BestRunPolicyResult
BestRunCandidateCommand
  -> BestRunCandidateResult
BestRunCommitCommand
  -> BestRunCommitResult
BestRunRestoreCommand
  -> BestRunRestoreResult
BestRunProjectionCommitCommand
  -> BestRunFrameDigest
  -> FirstBestRunBoundFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, scoring, local storage, HTML, CSS, gameplay, rendering, tests, workflows and deployment were unchanged. No data-loss incident, preferred comparison scope or production failure is claimed.