# Interaction audit: best-run command and result map

**Timestamp:** `2026-07-17T17-39-07-04-00`

## Current evidence flow

```txt
delivery accepted
  -> long-haul-run-kit completes
  -> buildRunResult()
  -> showResults(result)
  -> DOM score cells
  -> localStorage get/parse/compare/set inside one try/catch
```

The storage interaction has no command identity, typed result, failure classification or acknowledgement.

## Proposed command map

**Proposed, not implemented:**

### Policy admission

```txt
BestRunPolicyAdmissionCommand
  inputs:
    product policy revision
    course identity
    scoring revision
    browser profile identity
  result:
    BestRunPolicyResult
```

### Candidate admission

```txt
BestRunCandidateCommand
  inputs:
    complete RunResult
    admitted policy
    restored record revision
  result:
    BestRunCandidateResult
      classification: better | equal | worse | incomparable | invalid
```

### Durable commit

```txt
BestRunCommitCommand
  inputs:
    candidate result
    expected prior revision
    serialized record
  result:
    BestRunCommitResult
      committed | duplicate | stale | rejected | storage-failed | readback-mismatch
```

### Restore and migration

```txt
BestRunRestoreCommand
  inputs:
    storage bytes
    current schema and scoring revision
  result:
    BestRunRestoreResult
      restored | migrated | absent | incompatible | corrupt | storage-failed
```

### Projection

```txt
BestRunProjectionCommitCommand
  inputs:
    accepted record/result generation
    route generation
  result:
    BestRunFrameDigest
    FirstBestRunBoundFrameAck
```

## Settlement rules

- One candidate command per terminal run result.
- No write for incomparable, invalid or worse candidates unless policy explicitly records history.
- Equal candidates require an explicit tie policy.
- Commit must compare the expected prior revision and reject stale writes.
- Successful commit requires readback verification or an equivalent durable receipt.
- Retry, fresh course, title, reset and page retirement must reject stale projection work.
- Storage faults must be represented as results even when gameplay remains usable.

## Boundary

No commands or results were implemented. Existing local-storage behavior remains unchanged.