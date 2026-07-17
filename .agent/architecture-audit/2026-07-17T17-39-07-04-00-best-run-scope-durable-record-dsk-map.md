# Architecture audit: best-run scope and durable-record DSK map

**Timestamp:** `2026-07-17T17-39-07-04-00`  
**Status:** `best-run-scope-durable-record-projection-authority-audited`

## Current ownership

```txt
long-haul-run-kit
  -> owns active run state, timing, distance, penalties and terminal result

long-haul-delivery-kit
  -> owns depot checks and delivery acceptance

core-simulation-kit
  -> owns fuel, truck condition, cargo condition and remaining time

buildRunResult()
  -> combines Course, Run, Delivery and meter evidence
  -> returns a rich immutable-looking result object

DOM result adapter
  -> projects current run result
  -> compares adjustedTime against one browser-global stored record

browser-storage-adapter
  -> persists settings and a reduced best-run object
  -> exposes no typed commit, readback, migration or failure result
```

The semantic boundary ends before persistence. The result object is domain-derived, while comparison scope and durable storage policy are embedded in `showResults()`.

## Implemented DSK/domain map

```txt
Core
├─ core-scene-kit
├─ core-world-domain
├─ long-haul-input
├─ core-data-kit
├─ core-simulation-kit
├─ core-camera-kit
├─ core-graphics-kit
└─ core-transaction-ledger-kit

Product
├─ long-haul-world-profile-kit
├─ long-haul-world-atlas-kit
├─ long-haul-horizon-lod-policy-kit
├─ long-haul-road-class-catalog-kit
├─ long-haul-terrain-policy-kit
├─ long-haul-truck-dynamics-profile-kit
├─ long-haul-delivery-contract-catalog-kit
├─ long-haul-truck-kit
├─ long-haul-course-kit
├─ long-haul-run-kit
├─ long-haul-delivery-kit
└─ long-haul-wildlife-kit

Host/adapters
├─ result-scoring function
├─ DOM results projector
└─ browser local-storage adapter
```

## Missing authority

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

## Required ownership split

### Domain-owned

- Comparison scope: exact course, seed family, scoring revision or global.
- Canonical record schema and version.
- Comparable/incomparable classification.
- Candidate ordering and tie behavior.
- Migration and reset policy.
- Commit and restore results.
- Projection digest and matching-frame acknowledgement.

### Adapter-owned

- Local-storage access.
- Serialization bytes.
- Readback execution.
- DOM placement and styling.
- Browser-origin fixture execution.

### Must not remain embedded in `showResults()`

- Global scope selection.
- Better-run comparison.
- Record-shape definition.
- Failure suppression.
- Migration decisions.

## Proposed surface family

```txt
best-run-policy-manifest-kit
best-run-scope-identity-kit
best-run-record-schema-kit
best-run-scoring-revision-kit
best-run-candidate-admission-kit
best-run-comparison-kit
best-run-incomparable-result-kit
best-run-durable-commit-kit
best-run-readback-verification-kit
best-run-storage-failure-result-kit
best-run-restore-admission-kit
best-run-migration-kit
best-run-reset-kit
best-run-projection-kit
best-run-frame-digest-kit
first-best-run-bound-frame-ack-kit
best-run-browser-fixture-kit
pages-best-run-parity-fixture-kit
```

## Architectural boundary

This audit proposes a domain boundary only. It does not add a new runtime kit, alter score calculation, choose a comparison scope or change browser storage.