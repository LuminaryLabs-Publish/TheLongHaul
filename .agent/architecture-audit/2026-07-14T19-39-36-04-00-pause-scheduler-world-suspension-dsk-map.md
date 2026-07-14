# Architecture audit: pause scheduler and world suspension DSK map

**Timestamp:** `2026-07-14T19-39-36-04-00`

## Existing ownership

```txt
Core Scene
  owns driving, paused and settings routes

Core Simulation
  owns run timer and status pause/resume

Core Input
  owns engine-level driving intent

browser adapter
  owns mutable key map and Escape handling

Vehicle Dynamics
  owns truck motion and impact state

Hazard Field
  owns wildlife motion and collisions

Resource Pressure
  owns fuel, truck and cargo mutation

Telemetry
  owns bounded histories

Core World and providers
  own active cells and streamed effects

presentation adapters
  own truck, camera, wildlife, dust, map, DOM and WebGL frames
```

## Current composition gap

The scene changes to `paused`, but the page continues calling `engine.tick(dt)`. Pause is represented inside Core Simulation rather than as a scheduler-wide revision consumed by every mutating domain. Browser keys are outside Core Input and are not settled by the current pause call.

## Required domain

```txt
the-long-haul-pause-scheduler-input-world-suspension-authority-domain
```

## Planned subkits

```txt
pause-command-kit
pause-revision-kit
pause-policy-revision-kit
scheduler-admission-gate-kit
system-suspension-participant-kit
core-simulation-pause-receipt-kit
vehicle-pause-receipt-kit
hazard-pause-receipt-kit
resource-pressure-pause-receipt-kit
telemetry-pause-receipt-kit
delivery-pause-receipt-kit
world-streaming-pause-receipt-kit
browser-key-settlement-kit
core-input-settlement-kit
stale-input-rejection-kit
presentation-pause-policy-kit
pause-result-kit
resume-result-kit
first-paused-frame-kit
first-resumed-frame-kit
pause-domain-matrix-fixture-kit
held-input-browser-fixture-kit
source-pages-pause-parity-kit
```

## Minimal integration

Keep all existing kits. Add one coordinator that publishes `PauseRevision`, exposes a shared admission predicate to mutating systems and bridges the browser key map into Core Input settlement. Renderer continuation should be policy-driven rather than inferred from the perpetual RAF.
