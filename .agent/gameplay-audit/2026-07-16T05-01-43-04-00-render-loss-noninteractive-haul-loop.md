# Gameplay audit: render-loss noninteractive haul loop

**Timestamp:** `2026-07-16T05-01-43-04-00`

## Summary

Gameplay truth can continue advancing even when the WebGL surface cannot present it. The current host has no explicit policy deciding whether timer, fuel, hazards, damage, delivery eligibility and input should pause, continue or buffer during renderer loss.

## Plan ledger

**Goal:** prevent invisible gameplay progression or stale input effects while presentation recovery is unresolved.

- [x] Trace driving input, simulation tick, world streaming and render submission.
- [x] Identify gameplay systems that may advance without a valid frame.
- [x] Define an explicit simulation/input policy boundary.
- [ ] Implement and prove loss/recovery behavior.

## Current failure loop

```txt
WebGL context becomes unavailable
  -> key state can remain active
  -> processDrivingBeforeTick continues producing intent
  -> engine.tick continues timer, fuel, hazards and penalties
  -> world streaming can create/release cells
  -> renderer.render cannot prove presentation
  -> player may lose time, fuel, cargo or position without a usable frame
```

## State requiring policy

```txt
Core Scene route
Core Input held actions
Core Simulation remaining time and penalties
Vehicle Dynamics position and velocity
Resource Pressure fuel/truck/cargo
Hazard Field motion and collision
Delivery depot eligibility and terminal result
Core World focus and active cells
Telemetry history
WebAudio loops and cues
```

## Required gameplay settlement

Choose and document one policy:

```txt
pause policy
  -> clear held actions
  -> pause run timer and simulation
  -> preserve accepted state
  -> resume only after FirstRecoveredFrameAck

or

continue policy
  -> neutralize player input
  -> continue deterministic simulation intentionally
  -> expose non-WebGL recovery status
  -> reconcile the recovered frame to the latest accepted state
```

For a timed driving game, pause-on-loss is the safer default until executable evidence supports another policy.

## Boundary

No loss incident was reproduced. No simulation, timer, input, hazard, resource, delivery, world-streaming or audio behavior was changed.