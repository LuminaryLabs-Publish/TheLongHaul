# Generation audit: work budget and readiness contract

**Timestamp:** `2026-07-15T04-40-29-04-00`

## Goal

Bound generation work independently from display cadence while preserving deterministic course content and existing kit ownership.

## Required attempt state

```txt
GenerationAttemptId
GenerationRevision
Seed
PlanFingerprint
QueueRevision
Status: Prepared | Running | Suspended | Ready | Adopted | Failed | Cancelled | Retired
BudgetPolicyRevision
WeightedProgress
AcceptedUnitReceipts
DeferredUnitIds
ValidationReceipts
ResourceOwnershipLedger
PredecessorAttemptId
```

## Work-unit contract

Each unit must declare:

```txt
stable unit ID
dependency IDs
mandatory or optional class
estimated cost class
main-thread requirement
yield points
owned resources
rollback action
result fingerprint
```

## Frame budget contract

```txt
GenerationHostFrameCommand
  -> calculate available work budget after mandatory host duties
  -> admit eligible units in dependency order
  -> stop before the budget is exceeded when possible
  -> publish actual elapsed cost
  -> defer remaining work without changing eligibility
  -> render progress once
```

Large indivisible units must either expose internal yield points, move eligible preparation off-thread, or be classified as accepted long tasks with explicit evidence.

## Progress contract

Progress must be derived from accepted weighted unit receipts. It must distinguish:

```txt
queued
running
deferred
completed
failed
cancelled
rolled back
```

## Readiness contract

`GenerationReadyResult` requires:

```txt
all mandatory unit receipts
route validation receipt
Core World validation receipt
five depot markers
accepted destination revision
nine required active cells
hazard revision
truck start revision
no unresolved failed or retired resources
```

Core Simulation may start only after the ready result is accepted. The first driving frame must acknowledge the same generation revision.

## Failure and cancellation

Failure, Retry, Title and superseding Start must release partial cell objects, geometries, textures, materials, world registration, route state, hazards, truck rigs, dust, wildlife, audio activity and public progress state. Late work from the retired attempt must be rejected.