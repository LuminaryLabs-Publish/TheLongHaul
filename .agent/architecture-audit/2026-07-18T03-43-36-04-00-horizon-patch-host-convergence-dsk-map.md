# Architecture audit: horizon patch and host convergence DSK map

**Timestamp:** `2026-07-18T03-43-36-04-00`

## Current composition

```txt
Core Scene
Core World
  -> long-haul-gameplay world
     -> uniform-grid partition
     -> flat surface descriptor
     -> long-haul-course-provider
  -> long-haul-horizon world
     -> quadtree partition
     -> curved-horizon surface
     -> long-haul-horizon-provider
Core Input
Core Data
Core Simulation
Core Camera
Core Graphics
Core Transaction Ledger

Long Haul product DSKs
  -> World Profile
  -> World Atlas
  -> Horizon LOD Policy
  -> Road Classes
  -> Terrain Policy
  -> Truck Dynamics
  -> Delivery Contracts
  -> Truck
  -> Course
  -> Run
  -> Delivery
  -> Wildlife
```

## Current horizon command flow

```txt
registerHorizonWorld()
  -> read World Profile
  -> create quadtree partition
  -> create curved-horizon surface
  -> install long-haul-horizon-provider
  -> set initial focus
  -> update Core World
  -> reconcile Three.js hosts

updateHorizonWorld()
  -> read truck state
  -> quantize focus to 384-unit key
  -> set Core World focus
  -> update Core World
     -> prepareCell/updateCell
     -> buildHorizonPatch(cell, focus)
     -> horizonPatches.set(cell.id, patch)
  -> reconcileHorizon()
     -> retire inactive hosts
     -> suppress cells with centers inside 700 units
     -> realize only if host is absent
```

## DSK ownership gap

The domain kits own profile, atlas and LOD policy state, while host realization is a local renderer path. No result bridges an accepted patch generation to the matching Three.js host generation.

The provider descriptor reports only `cellId` and `lod`. It omits:

- world generation;
- focus revision;
- policy revision;
- atlas sector identities;
- patch revision;
- patch digest;
- host revision;
- resource-retirement receipt;
- visible-frame acknowledgement.

## Partial policy adoption

`long-haul-horizon-lod-policy-kit` offers:

```txt
terrainResolution
forestMode
roadMode
settlementMode
collision
```

Current runtime adoption:

```txt
terrainResolution -> controls terrain segment count
roadMode          -> only distinguishes none from present
settlementMode    -> only distinguishes none from present
forestMode        -> not realized
collision         -> consistently false
```

Named road modes such as ribbon, thin-ribbon and line do not select different geometry. Named settlement modes such as low-detail, block-mass and silhouette do not select different geometry. Forest modes do not create horizon forest content.

## Proposed authority

**Proposed, not implemented:**

`the-long-haul-horizon-patch-generation-render-host-convergence-authority-domain`

```txt
HorizonWorldAdmissionCommand
  input: profile revision, policy revision, course seed, provider revision
  output: HorizonWorldAdmissionResult

HorizonPatchBuildCommand
  input: world generation, cell revision, focus revision, policy revision
  output: HorizonPatchBuildResult

HorizonPatchSettlementCommand
  input: patch digest, sector ownership, content modes
  output: accepted | rejected-stale | invalid

HorizonHostReconciliationCommand
  input: accepted patch generation, current host generation
  output: created | replaced | retained | retired | rejected-stale

HorizonProjectionCommitCommand
  input: accepted host generations
  output: HorizonFrameDigest and FirstHorizonGenerationBoundFrameAck
```

## Minimal implementation order

1. Add monotonic horizon world and focus revisions.
2. Add patch revision and digest to the provider effect descriptor.
3. Store host patch revision in `horizonHosts`.
4. Replace an existing host when its patch revision differs.
5. Return explicit create/replace/retain/retire results.
6. Map every LOD content mode to distinct realization behavior or remove unsupported modes from the DSK contract.
7. Bind rendered frame diagnostics to the accepted horizon generation.

## Boundary

This audit proposes ownership and result surfaces only. No engine, provider or renderer implementation changed.
