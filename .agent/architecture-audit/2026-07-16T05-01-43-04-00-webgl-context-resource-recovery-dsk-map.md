# Architecture audit: WebGL context and resource recovery DSK map

**Timestamp:** `2026-07-16T05-01-43-04-00`  
**Status:** `webgl-context-resource-recovery-authority-audited`

## Summary

The current product owns gameplay and world state through Nexus Engine kits, but renderer/context/resource lifecycle is concentrated in one browser adapter. Ordinary cell release is implemented; whole-renderer loss and reconstruction are not.

## Plan ledger

**Goal:** place renderer recovery behind one parent DSK that consumes accepted runtime/world state and owns GPU generations without moving simulation authority into Three.js callbacks.

- [x] Preserve all ten installed kits and two world providers.
- [x] Preserve the seven existing browser/product adapters.
- [x] Separate simulation truth from presentation recovery.
- [x] Define command, result, generation and acknowledgement boundaries.
- [ ] Implement the authority and executable proof.

## Existing domain map

```txt
Core Scene
  -> route registry and accepted transitions

Core Input
  -> action map, contexts and driving intent

Core Simulation
  -> run timer, penalties, recovery and outcome

Vehicle Dynamics
  -> truck transform, velocity, heading and impacts

Long Haul Delivery
  -> generation, depot checks and run result

Core World
  -> partition, focus, active cells and providers
  -> terrain provider
  -> course-content provider

Resource Pressure / Hazard Field / Telemetry
  -> condition, wildlife and history

browser presentation adapter
  -> one WebGLRenderer
  -> scene/camera/lighting/atmosphere
  -> shared geometries/materials
  -> streamed cell resources
  -> truck/wildlife/dust rigs
  -> recursive RAF and render submission
```

## Missing parent authority

`the-long-haul-webgl-context-resource-recovery-authority-domain`

### Command

```txt
RenderRecoveryAdmissionCommand {
  documentGeneration
  routeGeneration
  runtimeGeneration
  rendererGeneration
  contextGeneration
  resourceManifestRevision
  worldRevision
  activeCellRevision
  frameRevision
  lossEvidence
  deadline
  attempt
}
```

### Results

```txt
RenderLossResult
RenderRecoveryResult
RenderFallbackResult
FirstRecoveredFrameAck
```

### Child DSKs

| DSK | Responsibility |
|---|---|
| `render-generation-identity-kit` | assign renderer/context/resource generation identities |
| `webgl-context-loss-observer-kit` | admit browser loss/restoration evidence |
| `context-loss-deduplication-kit` | settle duplicate loss callbacks once |
| `render-submission-suspension-kit` | stop stale renderer submissions |
| `simulation-loss-policy-kit` | declare continue/pause policy for engine ticks |
| `input-loss-policy-kit` | declare driving-command policy while presentation is unavailable |
| `gpu-resource-manifest-kit` | inventory reconstructable GPU resources and dependencies |
| `shared-geometry-rehydration-kit` | rebuild shared primitives and buffers |
| `shared-material-rehydration-kit` | rebuild shared materials and textures |
| `streamed-cell-resource-rehydration-kit` | reconstruct active terrain/content cells from accepted world state |
| `atmosphere-resource-rehydration-kit` | rebuild sky, fog, lights and shadow state |
| `truck-resource-rehydration-kit` | rebuild the truck and cargo rig |
| `wildlife-resource-rehydration-kit` | rebuild current hazard presentation |
| `dust-resource-rehydration-kit` | rebuild transient particle resources safely |
| `renderer-reconstruction-kit` | construct/configure the replacement renderer |
| `context-restoration-admission-kit` | bound retries and admit one restoration generation |
| `stale-render-generation-rejection-kit` | reject old RAF, resize and provider callbacks |
| `render-recovery-result-kit` | publish accepted reconstruction evidence |
| `render-fallback-result-kit` | publish actionable failure after budget exhaustion |
| `first-recovered-frame-ack-kit` | prove one frame from the accepted generation was presented |

## Dependency order

```txt
loss evidence
  -> generation retirement
  -> submission suspension
  -> simulation/input policy
  -> renderer reconstruction
  -> shared geometry/material reconstruction
  -> atmosphere reconstruction
  -> active streamed-cell reconstruction
  -> truck/wildlife/dust reconstruction
  -> camera and resize projection
  -> render submission
  -> first recovered frame acknowledgement
```

## Ownership rules

- Nexus Engine resources remain gameplay truth.
- Three.js objects remain disposable projections.
- Active Core World cells are reconstructed from accepted world/provider state, not copied from invalid GPU objects.
- Every RAF, resize, stream and provider completion cites the renderer generation it targets.
- Recovery publishes a terminal result: recovered or fallback.
- A browser restoration event alone is not readiness proof; the first accepted presented frame is.

## Boundary

Architecture documentation only. No DSK, event, resource, system, Three.js object or runtime behavior was implemented.