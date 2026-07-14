# Outcome audit: delivery result, score and retry contract

**Timestamp:** `2026-07-14T14-39-54-04-00`

## Current outcome shape

`buildRunResult()` stores valid depot, par, raw time, distance, depot count, collisions, cargo condition, penalties, adjusted time and score. It does not bind the result to a run, engine step, route fingerprint, score-policy revision or immutable result ID.

## Required immutable artifact

```txt
RunOutcomeArtifact
  resultId
  runId
  terminalStepId
  generationId
  seed
  courseFingerprint
  validRegionId
  acceptedRegionId
  terminalKind
  precedencePolicyRevision
  scorePolicyRevision
  rawTime
  distance
  depotsChecked
  collisions
  finalFuel
  finalTruckCondition
  finalCargoCondition
  penaltyLedgerFingerprint
  penaltyTotal
  cargoPenalty
  distancePenalty
  adjustedTime
  versusPar
  score
  contentFingerprint
```

## Score settlement

All impact, pressure and penalty receipts for the terminal step must settle before score calculation. The formula may remain unchanged, but it must have an explicit revision and deterministic input manifest.

## Persistence contract

```txt
BestScoreDocument
  schemaVersion
  documentRevision
  acceptedResultId
  adjustedTime
  score
  courseCode
  scorePolicyRevision
  outcomeFingerprint
```

Writes require a typed result and readback verification. Storage failure must not invalidate the accepted run outcome.

## Retry contract

```txt
RunRetryCommand
  predecessorResultId
  predecessorRunId
  mode: same-seed | new-seed
  commandId

RunRetryResult
  successorRunId
  predecessorResultId
  successorSeed
  acceptedAtRevision
```

Retry must preserve bounded predecessor evidence and reject duplicate or stale commands.

## Settlement invariant

Exactly one outcome artifact may be accepted for one RunId. Results projection, best-score persistence and retry must all cite that artifact.