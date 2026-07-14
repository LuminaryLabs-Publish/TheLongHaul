# Interaction audit: delivery command and settlement result map

**Timestamp:** `2026-07-14T14-39-54-04-00`

## Current commands

```txt
KeyE
  -> interactWanted
  -> nearest depot and stop check
  -> longHaulDelivery.checkRegion(regionId, copied metrics)

result
  -> mutable DeliveryState.runResult
  -> handleRunOutcome
  -> scene transition
  -> DOM mutation
  -> optional localStorage write

retry
  -> setRetry(Date.now-based ID)
  -> consumeRetry immediately
  -> startGeneration
```

## Missing typed results

```txt
DeliveryCheckResult
TerminalProposalAdmissionResult
TerminalConflictResult
MetricFinalizationResult
DeliveryTerminalSettlementResult
BestScoreWriteResult
TerminalProjectionResult
FirstTerminalResultFrameAck
RunRetryResult
```

## Proposed result states

```txt
DeliveryCheckResult
  AcceptedProposal
  RejectedWrongDepot
  Duplicate
  Stale
  Invalid

DeliveryTerminalSettlementResult
  Completed
  Failed
  ConflictResolved
  Duplicate
  Stale
  Superseded
  Invalid

BestScoreWriteResult
  Updated
  Unchanged
  Conflict
  StorageUnavailable
  Failed

RunRetryResult
  Accepted
  Duplicate
  StalePredecessor
  Superseded
  Failed
```

## Interaction rule

Buttons and keyboard handlers may submit commands, but they must not directly establish terminal truth, write best score or destroy predecessor evidence. UI state should be a projection of accepted typed results.