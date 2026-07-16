# Architecture audit: Core capability adoption DSK map

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Summary

TheLongHaul now contains two separate Nexus Engine compositions: the playable game and an isolated Core integration smoke. The smoke adds promoted Core capabilities, but no architecture boundary classifies them as authoritative, bridge-only, proof-only, or retired relative to existing playable owners.

## Plan ledger

**Goal:** map every current domain/service owner and define the minimum DSK boundary needed to converge the Core profile with the playable runtime.

- [x] Map playable engine kits.
- [x] Map Core World providers.
- [x] Map browser/product adapters.
- [x] Map the new isolated Core kits and controller.
- [x] Identify overlapping truth owners.
- [x] Define adoption authority surfaces.
- [ ] Implement one accepted profile and migration sequence.

## Current composition A: playable runtime

| Domain/kit | Factory or owner | Services |
|---|---|---|
| Core Scene | `createCoreSceneKit` | registry, active scene, exit validation, transition request, snapshot |
| Core World | `createCoreWorldDomain` | world registry, partition, focus, active cells, provider lifecycle, validation |
| Core Input | `createCoreInputKit` | action manifest, bindings, contexts, intent snapshot, reset |
| Long Haul Delivery | `defineDomainServiceKit` | generation progress, candidate depots, destination, checks, retry, result, snapshot |
| Long Haul Simulation | `createCoreSimulationKit` | run timer, distance, penalties, recovery, failure, completion |
| Vehicle Dynamics | `createVehicleDynamicsKit` | truck state, kinematics, boost, impacts, bounds |
| Route Field | `createRouteFieldKit` | markers, corridors, nearest route, state |
| Resource Pressure | `createResourcePressureKit` | fuel, truck, cargo, bounded adjustment |
| Hazard Field | `createHazardFieldKit` | wildlife state, motion, collision |
| Telemetry | `createTelemetryKit` | truck/run/condition/delivery histories |
| Terrain provider | Core World effect provider | terrain prepare/update/release/snapshot |
| Course provider | Core World effect provider | roads, depots, signs, vegetation, obstacles, lifecycle |
| Course generator | host adapter | inline hash/RNG, graph, depot placement, par, validation, staged plan |
| Keyboard | browser adapter | key evidence, held state, route and presentation commands |
| Three.js | browser adapter | renderer, direct camera smoothing, direct instances, cells, rigs, render |
| DOM/HUD | browser adapter | routes, generation, HUD, pause, outcomes, errors |
| Canvas map | browser adapter | explored roads, depots, rejections, truck |
| WebAudio | browser adapter | unlock, buses, loops, cues |
| Storage | browser adapter | settings, motion preference, best score |
| Pages | workflow adapter | static deployment from `main` |

## Current composition B: isolated Core smoke

| Core kit/controller | Factory | Services |
|---|---|---|
| Core Data | `createCoreDataKit` | schema registry, course envelope, digest verification, named RNG streams, snapshots |
| Core Simulation meters | `createCoreSimulationKit` | bounded meters, rates, locks, thresholds, snapshots |
| Core Camera | `createCoreCameraKit` | target adoption, position/look/FOV/mode smoothing, portable descriptor |
| Core Graphics | `createCoreGraphicsKit` | instance-batch registration, cell replace/remove, flush, release receipt |
| Core Transaction Ledger | `createCoreTransactionLedgerKit` | run ledger, apply-once, duplicate result, metadata |
| World patch preparation | `createWorldPatchPreparationController` | focus, desired set, prefetch, cache, budgets, ready queue |
| Browser smoke | `core-integration.html` | separate engine bootstrap and synchronous DOM proof rows |

## Overlapping owners

| Responsibility | Playable owner | New Core owner | Divergence |
|---|---|---|---|
| Randomness | inline `makeRng` and host call order | named Core Data streams | no shared seed/stream cursor |
| Course package integrity | in-memory course objects and validation | schema envelope and digest | playable never admits envelope |
| Fuel/truck/cargo/time | Resource Pressure plus custom run state | Core Simulation meters | IDs and time limit differ |
| Camera smoothing | host `smooth()` and Three camera mutation | Core Camera descriptor | descriptor never drives visible camera |
| Instance lifecycle | direct Three.js instancing/cell objects | Core Graphics batches | batch receipts never drive renderer |
| Patch preparation | Core World providers and host generation plan | patch-preparation controller | no bridge or shared ready state |
| Idempotency | custom penalty ledger and delivery duplicate flags | Core Transaction Ledger | no operation migration or shared receipts |
| Provider revision | Nexus Engine `c5548de...` | Nexus Engine `b941c9...` | release executes two capability generations |

## Required parent authority

`the-long-haul-core-capability-adoption-parity-authority-domain`

### Commands

```txt
CoreCapabilityAdmissionCommand
CoreProfileBootstrapCommand
CoreStateMigrationCommand
CoreParityVerificationCommand
CoreCapabilityRetirementCommand
```

### Results

```txt
CoreCapabilityAdmissionResult
CoreProfileBootstrapResult
CoreStateMigrationResult
CoreParityVerificationResult
CoreCapabilityRetirementReceipt
FirstCoreBoundPlayableFrameAck
```

### Required revisions

```txt
ProductReleaseRevision
NexusEngineProviderRevision
CoreProfileRevision
CourseSchemaRevision
RandomStreamRevision
ResourceMeterSchemaRevision
CameraDescriptorRevision
InstanceBatchRevision
PatchPreparationRevision
TransactionLedgerRevision
PlayableStateRevision
RenderFrameRevision
```

## Planned DSK surfaces

```txt
core-capability-manifest-kit
provider-revision-convergence-kit
core-profile-bootstrap-kit
capability-adoption-classification-kit
course-schema-admission-kit
named-random-stream-adoption-kit
random-stream-snapshot-replay-kit
simulation-meter-schema-adoption-kit
resource-meter-state-migration-kit
camera-smoothing-adoption-kit
camera-descriptor-three-bridge-kit
instance-batch-descriptor-adoption-kit
instance-batch-three-bridge-kit
world-patch-preparation-adoption-kit
core-world-provider-patch-bridge-kit
transaction-ledger-adoption-kit
duplicate-truth-owner-rejection-kit
smoke-playable-parity-result-kit
core-adoption-result-kit
first-core-bound-playable-frame-ack-kit
```

## Adoption order

```txt
1. Pin one Nexus Engine revision for both entry points.
2. Publish one immutable CoreCapabilityAdoptionManifest.
3. Admit and verify the course package before world creation.
4. Move gameplay randomness to named streams.
5. Migrate time and condition truth into one meter schema.
6. Bridge Core Camera descriptors to Three.js.
7. Bridge Core Graphics batches to renderer instances.
8. Bridge patch preparation to Core World provider activation.
9. Move operation deduplication to the transaction ledger.
10. Run the same semantic fixtures in smoke and playable contexts.
11. Present and acknowledge one frame from the accepted profile.
12. Retire parallel host authorities only after state-equivalence proof.
```

## Boundary

This audit defines architecture only. It does not require a wholesale Nexus Engine restructure and does not claim that the new Core smoke is broken. The gap is adoption, semantic convergence, and evidence.