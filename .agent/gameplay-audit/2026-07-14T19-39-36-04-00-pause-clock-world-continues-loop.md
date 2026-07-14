# Gameplay audit: pause clock stops while world loop continues

**Timestamp:** `2026-07-14T19-39-36-04-00`

## Current loop

```txt
Escape during driving
  -> browser key map records Escape
  -> Core Simulation becomes paused
  -> truck velocity is set to zero
  -> pause route becomes visible
  -> frame loop continues
  -> idle vehicle input is submitted
  -> all installed engine systems are ticked
  -> presentation systems continue
  -> resume returns to driving
```

## Gameplay risk

The run timer has an explicit paused state, but the overall world does not have a shared pause generation. Any installed kit that mutates independently of Core Simulation can continue advancing. The current host provides no result proving that hazards, pressure, telemetry, delivery state and streaming stayed unchanged.

The browser key map also survives pause. A throttle or steering key held before Escape can remain active until keyup and can become effective on the first resumed frame.

## Required invariant

```txt
accepted PauseRevision
  -> no gameplay-mutating participant advances
  -> no pre-pause command can commit
  -> only policy-approved presentation work continues
  -> resume requires fresh admitted input
```

No runtime reproduction was performed.
