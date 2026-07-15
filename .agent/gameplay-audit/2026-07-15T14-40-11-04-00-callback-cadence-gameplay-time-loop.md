# Gameplay audit: callback cadence and gameplay time

**Timestamp:** `2026-07-15T14-40-11-04-00`

## Plan ledger

**Goal:** make one second of accepted gameplay time independent from the browser callback rate, except under an explicit overload policy.

- [x] Trace time-dependent gameplay consumers.
- [x] Identify current clamp behavior.
- [x] Quantify the source-permitted low-cadence rate.
- [ ] Add deterministic fixed-step admission and fixtures.

## Current loop

```txt
callback delta
  -> cap at 66.666 ms
  -> vehicle input and driving resolution
  -> one Nexus Engine tick
     -> run timer and remaining time
     -> vehicle kinematics
     -> resource pressure
     -> hazard movement and collisions
     -> delivery and telemetry systems
  -> one visible frame
```

## Time-dependent gameplay consumers

```txt
run raw time and countdown
truck acceleration, steering, drag and movement
fuel/resource pressure
hazard movement and collision timing
collision cooldowns and penalty timestamps
stuck/recovery timing
distance sampling and terminal result metrics
telemetry histories
```

## Source-permitted rate

Because the host executes one step per callback and caps the step at `1/15` second:

```txt
callback rate    maximum admitted simulation rate
30 Hz            1.000 simulated sec/sec
15 Hz            1.000 simulated sec/sec
10 Hz            0.667 simulated sec/sec
 5 Hz            0.333 simulated sec/sec
```

The exact runtime outcome depends on browser scheduling and domain implementations. The table describes the host's maximum admitted time, not a measured browser result.

## Consequences permitted by source

```txt
run timer can slow relative to wall time at sustained sub-15-Hz cadence
vehicle integration can differ between callback-rate traces
fuel, hazards and collision cooldowns can advance at cadence-dependent rates
same seed and input timeline need not reproduce the same run result
long stalls lose unreported wall time rather than publishing a policy result
```

## Required gameplay contract

```txt
fixedStepSeconds: versioned constant
maxSubstepsPerHostFrame: versioned policy
accepted simulation step: exactly one fixed quantum
same input timeline: same ordered SimulationStepResult sequence
excess time: deferred or explicitly discarded with receipt
pause/visibility: explicit clock settlement
terminal result: bound to accepted simulation revisions
```

## Required proof

```txt
same seed and scripted input at multiple callback rates
matching truck, timer, condition, hazard and result snapshots
low-cadence overload classification
pause and visibility transition trace
no duplicate terminal settlement during catch-up
```
