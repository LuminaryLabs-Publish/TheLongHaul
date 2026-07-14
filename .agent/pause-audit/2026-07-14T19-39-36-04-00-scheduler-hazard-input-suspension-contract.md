# Pause audit: scheduler, hazard and input suspension contract

**Timestamp:** `2026-07-14T19-39-36-04-00`

## Authority

```txt
the-long-haul-pause-scheduler-input-world-suspension-authority-domain
```

## Pause contract

```txt
PauseRunCommand
  commandId
  runId
  expectedSceneRevision
  expectedSchedulerRevision
  expectedInputRevision
  policyRevision

PauseRunResult
  status
  pauseRevision
  acceptedAtStep
  participantReceipts
  settledBrowserKeys
  settledCoreInput
  allowedPresentationSystems
```

Mandatory participants:

```txt
Core Simulation
Vehicle Dynamics
Core Input
browser keyboard adapter
Hazard Field
Resource Pressure
Telemetry
Long Haul Delivery
Core World streaming
course and terrain providers
interaction intent
```

## Resume contract

Resume must cite the accepted `PauseRevision`, reject stale predecessor commands, allocate a new input admission boundary and require a fresh key transition before throttle, brake or steering can affect Vehicle Dynamics.

## Presentation policy

The policy must explicitly classify:

```txt
renderer submission
camera interpolation
truck visual interpolation
wildlife animation
wildlife authoritative motion
dust simulation
map rendering
audio loops
DOM pause projection
```

## Failure policy

If any mandatory participant cannot suspend, pause must either fail atomically or enter a named degraded state. It must not publish a fully paused frame while required gameplay participants remain unacknowledged.
