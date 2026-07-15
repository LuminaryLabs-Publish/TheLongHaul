# Interaction audit: host-frame command and result map

**Timestamp:** `2026-07-15T14-40-11-04-00`

## Plan ledger

**Goal:** replace ambient time flow with explicit commands, results and rejection reasons at the browser-to-engine boundary.

- [x] Identify current implicit inputs and side effects.
- [x] Define host-frame command identity.
- [x] Define fixed-step and render results.
- [x] Define pause, visibility and overload rejection paths.
- [ ] Implement the contract.

## Current implicit interaction

```txt
requestAnimationFrame callback
  -> global previousTime mutation
  -> local variable dt
  -> direct processDrivingBeforeTick(dt)
  -> direct engine.tick(dt)
  -> direct presentation updates
  -> direct renderer submission
```

There is no stable command ID, expected clock revision, typed result, step receipt or frame acknowledgement.

## Proposed commands

```txt
HostFrameCommand
  hostFrameId
  clockRevision
  callbackTimestamp
  expectedRouteRevision
  expectedRunRevision
  expectedVisibilityRevision
  frameBudgetPolicyRevision

VisibilityClockCommand
  commandId
  clockRevision
  documentVisibilityRevision
  routeRevision
  requestedState: visible | hidden | suspended | retired

ClockResetCommand
  commandId
  expectedClockRevision
  reason: boot | resume | retry | title | fatal-recovery
```

## Proposed results

```txt
HostFrameResult
  hostFrameId
  accepted
  normalizedWallDelta
  stepCount
  simulationStepResults
  residualSeconds
  deferredSeconds
  discardedSeconds
  overloadClassification
  interpolationAlpha
  renderedSimulationRevisions
  rejectionReason

SimulationStepResult
  simulationRevision
  fixedDelta
  inputRevision
  runRevision
  vehicleRevision
  routeRevision
  conditionRevision
  hazardRevision
  deliveryRevision

VisibilityClockResult
  priorState
  adoptedState
  baselineTimestamp
  retainedResidual
  discardedTimeReceipt
```

## Rejection reasons

```txt
invalid timestamp
negative delta
stale clock revision
stale route or run revision
retired host frame
hidden-document policy rejection
duplicate hostFrameId
substep budget exhausted
overload policy failure
render plan references unavailable simulation revisions
```

## Settlement order

```txt
accept host frame
  -> normalize timestamp
  -> settle visibility and pause policy
  -> accumulate wall time
  -> admit bounded fixed steps
  -> publish ordered step results
  -> retain residual or issue discard receipt
  -> prepare one render frame
  -> submit WebGL Canvas2D DOM and audio projections
  -> publish HostFrameResult
  -> acknowledge first matching visible frame when required
```

## Boundary

No current public or engine API was changed. The command/result family is planned only.
