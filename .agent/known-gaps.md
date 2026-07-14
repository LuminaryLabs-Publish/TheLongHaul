# Known gaps

## Pause authority

- `pauseGame()` pauses only the Core Simulation run.
- The global RAF continues while paused.
- `engine.tick(dt)` continues for every installed kit and scene.
- No versioned pause policy states which systems must stop and which presentation systems may continue.
- Hazard Field, Resource Pressure, Telemetry, Delivery and Core World do not publish pause receipts.
- No scheduler generation rejects late pre-pause work.

## Input settlement

- The browser `keys` map is not cleared when pause is accepted.
- Escape is recorded in the same mutable key map before pause handling.
- Held throttle, brake or steer state can survive until resume.
- Resume does not require fresh post-pause input.
- No stale-input rejection result exists.

## Presentation coherence

- Truck, camera, wildlife, dust and rendering update calls continue during paused scenes.
- The pause overlay says the clock is stopped but does not identify whether the world is frozen.
- No `FirstPausedFrameAck` binds UI, world, input and scheduler state.
- No `FirstResumedFrameAck` proves fresh-input adoption.

## Validation

- No package manifest or executable test command exists.
- No headless pause matrix exists.
- No browser held-input fixture exists.
- No hazard/world suspension fixture exists.
- No source-to-Pages pause parity proof exists.

## Retained gaps

The prior delivery terminal settlement gaps remain valid and are retained in the timestamped `2026-07-14T14-39-54-04-00` audit family.
