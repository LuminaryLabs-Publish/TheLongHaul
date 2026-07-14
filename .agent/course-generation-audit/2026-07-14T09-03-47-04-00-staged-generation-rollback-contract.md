# Course-generation audit: staged generation and rollback contract

**Timestamp:** `2026-07-14T09-03-47-04-00`

## Current contract

Generation units are deterministic for a seed and are reported through the delivery kit, but they are not isolated. They write to shared variables, engine resources, Core World, Three.js scene state, and the DOM.

## Touched participants

```txt
course and generation host variables
LongHaulDeliveryState
RunSimulationState
Core Input state
RouteFieldState
ResourcePressureState
VehicleDynamicsState
HazardFieldState
Telemetry state
Core World registry and active cells
terrain and course provider effect maps
Three.js worldRoot, atmosphere, truck, wildlife, dust, textures, materials, geometries
DOM world-visible and generating/failure state
```

## Required prepare phase

```txt
1. Allocate a generation attempt ID.
2. Preserve the accepted predecessor revision.
3. Build a detached route graph and depot manifest.
4. Select and record the destination in the candidate.
5. Prepare terrain data and provider descriptors without adopting them.
6. Prepare hazards and truck spawn.
7. Validate topology, bounds, destination, providers, cells, and disposal ownership.
8. Render one offscreen probe frame.
```

## Required commit phase

```txt
1. Freeze scene entry and input against the predecessor.
2. Adopt delivery, route, world, hazards, truck, and render resources under one generation revision.
3. Start the run from the adopted truck position.
4. Transition to driving.
5. Publish CourseGenerationResult.
6. Publish FirstAdmittedCourseFrameAck.
7. Retire the predecessor only after the new frame is acknowledged.
```

## Required rollback phase

```txt
1. Stop candidate work.
2. Remove candidate world registrations and cells.
3. Dispose candidate-owned geometry, material, texture, audio, and timer resources.
4. Restore or preserve predecessor engine state.
5. Clear candidate DOM visibility.
6. Publish a rollback receipt and recoverable failure result.
7. Expose retry-same, retry-new, and title commands.
```

## Invariants

```txt
one accepted generation per attempt
one valid destination among exactly five depots
five reachable branch endpoints
no world-visible class before accepted probe
no candidate resource survives rejection
no predecessor resource is disposed by a failed candidate
no stale attempt can transition the scene
```
