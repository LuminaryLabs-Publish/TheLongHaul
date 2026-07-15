# Clock audit: fixed-step accumulator and overload contract

**Timestamp:** `2026-07-15T14-40-11-04-00`

## Plan ledger

**Goal:** define the clock state machine required for deterministic simulation, bounded catch-up and explicit time loss.

- [x] Record current clock inputs and clamp.
- [x] Define clock state and revisions.
- [x] Define accumulator and overload policy.
- [x] Define pause and visibility behavior.
- [ ] Implement and validate the contract.

## Current state

```txt
previousTime: host-local mutable number
rawDelta: callback delta with 1 ms floor
dt: rawDelta capped at 1 / 15
steps: one per callback
residual: none
overload state: none
discard receipt: none
```

## Proposed clock state

```txt
ClockState
  clockRevision
  generation
  status: booting | running | paused | hidden | overloaded | retired
  fixedStepSeconds
  accumulatorSeconds
  lastAcceptedTimestamp
  maxSubstepsPerHostFrame
  maxAccumulatedSeconds
  totalAcceptedWallSeconds
  totalSimulatedSeconds
  totalDeferredSeconds
  totalDiscardedSeconds
  lastHostFrameResult
```

## Accumulator algorithm

```txt
1. Validate timestamp and expected revisions.
2. Derive non-negative wall delta.
3. Apply route, pause and visibility policy.
4. Clamp only the accumulator debt allowed by policy.
5. Add admitted wall delta to accumulator.
6. While accumulator >= fixed step and budget remains:
     execute one engine tick with fixed step
     publish one SimulationStepResult
     subtract fixed step from accumulator
7. Retain remaining accumulator as residual time.
8. If the budget is exhausted:
     classify remaining debt as deferred, intentionally discarded or failed
     publish an overload/discard receipt.
9. Derive interpolation alpha = residual / fixed step.
10. Render once and publish HostFrameResult.
```

## Policy requirements

```txt
fixedStepSeconds must be versioned
substep budget must be finite
negative deltas must be rejected
first callback must establish a baseline without simulating unknown time
pause must not accumulate gameplay debt
hidden-document behavior must be explicit
resume must establish or validate a new baseline
excess debt must never disappear silently
retirement must reject late callbacks
```

## Candidate defaults for implementation testing

These are test candidates, not accepted product values:

```txt
fixedStepSeconds: 1 / 60
maxSubstepsPerHostFrame: 5
maxAccumulatedSeconds: 0.25
overload policy: defer up to cap, then discard with receipt
render interpolation: enabled for truck and camera presentation only
```

## Required diagnostics

```txt
host frame ID
raw and normalized wall delta
accepted step count
residual seconds
interpolation alpha
deferred and discarded seconds
overload reason
simulation revisions rendered
pause/visibility transition receipts
```

## Boundary

No timing value above is implemented. The current host remains variable-step and callback-coupled.
