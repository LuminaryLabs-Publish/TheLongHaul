# Architecture audit: product-policy adoption DSK map

**Timestamp:** `2026-07-16T14-01-02-04-00`

## Current composition

```txt
Core
├─ Scene
├─ World
├─ Input
├─ Data
├─ Simulation
├─ Camera
├─ Graphics
└─ Transaction Ledger

Long Haul product
├─ World
│  ├─ World Profile
│  ├─ Road Class Catalog
│  ├─ Terrain Policy
│  └─ Course
├─ Truck
│  ├─ Truck Dynamics Profile
│  └─ Truck
├─ Delivery
│  ├─ Delivery Contract Catalog
│  └─ Delivery
└─ Run
   ├─ Run
   └─ Wildlife
```

The grouping is semantically sound. Keep it.

## Current dependency reality

```txt
World Profile ----------------------X-> course generator / patch controller
Road Class Catalog -----------------X-> course edges / terrain / truck grip
Terrain Policy ---------------------X-> terrainHeight / cell descriptors
Truck Dynamics Profile --passed----X-> Truck kit (factory ignores option)
Delivery Contract Catalog ----------X-> Delivery kit / run rules
```

`X` means no source-backed consumer was found.

## Required dependency direction

```txt
ProductPolicyAdmission
  -> immutable ProductPolicySnapshot
     ├─ world
     ├─ roadClasses
     ├─ terrain
     ├─ truckDynamics
     └─ deliveryContracts

ProductPolicySnapshot
  -> CourseGeneration
  -> WorldPatchPreparation
  -> CourseCellGeneration
  -> TruckSimulation
  -> Delivery/Run
  -> Save/Replay
  -> Render/HUD/Map diagnostics
```

Consumers must not call mutable policy APIs during arbitrary render or host callbacks. They should receive the admitted snapshot or its generation-bound resource.

## Proposed DSK surfaces

```txt
product-policy-generation-kit
world-profile-admission-kit
road-class-admission-kit
terrain-policy-admission-kit
truck-dynamics-admission-kit
delivery-contract-admission-kit
policy-reference-validation-kit
product-policy-digest-kit
course-generation-policy-consumer-kit
terrain-cell-policy-consumer-kit
truck-simulation-profile-consumer-kit
delivery-contract-runtime-consumer-kit
world-streaming-profile-consumer-kit
mixed-policy-revision-rejection-kit
policy-snapshot-publication-kit
product-policy-admission-result-kit
first-policy-bound-run-frame-ack-kit
product-policy-runtime-fixture-kit
```

## Command/result contract

```txt
ProductPolicyAdmissionCommand
  policy revisions
  expected prior generation
  run intent

ProductPolicyAdmissionResult
  accepted | rejected | duplicate | stale
  generation
  digest
  normalized policy summary
  validation findings

FirstPolicyBoundRunAck
  runId
  coursePackageId
  policy generation/digest

FirstPolicyBoundFrameAck
  frame revision
  run revision
  policy generation/digest
  active world/cell revision
```

## Boundary

This audit proposes targeted adoption wiring. It does not propose another repository-wide restructuring.