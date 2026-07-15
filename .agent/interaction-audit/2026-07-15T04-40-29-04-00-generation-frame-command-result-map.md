# Interaction audit: generation frame command and result map

**Timestamp:** `2026-07-15T04-40-29-04-00`

## Current command paths

```txt
Start button
  -> startGeneration(new seed, start exit)

Retry button or R
  -> store and consume retry descriptor
  -> startGeneration(retry seed, retry exit)

RAF while generating
  -> stepGeneration()
  -> one closure executes
  -> Delivery records completed step

final cursor
  -> Core Simulation starts
  -> scene transitions through ready exit
```

## Missing typed results

```txt
GenerationAttemptAccepted
GenerationAttemptRejected
GenerationUnitResult
GenerationUnitDeferred
GenerationProgressResult
GenerationCancelledResult
GenerationFailureResult
GenerationRollbackResult
GenerationReadyResult
FirstPlayableGenerationFrameAck
```

## Proposed command map

```txt
StartGenerationCommand
  -> GenerationAttemptResult
  -> GenerationQueuePreparedResult

GenerationHostFrameCommand
  -> zero or more GenerationUnitResult receipts
  -> GenerationProgressResult
  -> GenerationHostFrameResult

CancelGenerationCommand
  -> GenerationCancellationResult
  -> GenerationRetirementResult

GenerationReadyCommand
  -> GenerationValidationResult
  -> GenerationAdoptionResult
  -> RunStartResult
  -> FirstPlayableGenerationFrameAck
```

## Admission rules

- Start and Retry must allocate a new attempt identity.
- Only the active attempt may consume a host-frame budget.
- A unit must cite its queue revision and predecessor dependencies.
- Duplicate, stale, retired and superseded results must be rejected.
- Progress must derive from accepted receipts, not host cursor mutation alone.
- Run start must cite one accepted ready result.
- Loading UI and the first playable frame must cite the same generation revision.