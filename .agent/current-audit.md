# Current audit: horizon patch and render-host convergence

**Timestamp:** `2026-07-18T03-43-36-04-00`  
**Reviewed runtime head:** `753488e40e69fc13471df42959628ef3052e5992`  
**Previous repo-local documentation head:** `1ed59786aa8f8f26f643c9f1e8c4d0a4205181f6`  
**Status:** `horizon-patch-render-host-convergence-authority-audited`

## Summary

Fourteen runtime commits added broad infinite terrain, road elevation, jump crests, cross-cell normals, grounded truck suspension, a raised chase camera, and a second Core World for curved quadtree horizon rendering.

The horizon provider writes newly prepared or updated patches into `horizonPatches`. The Three.js reconciliation path only realizes a patch when that cell has no existing host. It does not compare the current stored patch with the patch already attached to the host, so there is no explicit settlement for replacing an existing host after a provider update.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
runtime-ahead observed: 3
selected: LuminaryLabs-Publish/TheLongHaul
selection class: newest runtime-ahead eligible repository
previous documented head: 1ed59786aa8f8f26f643c9f1e8c4d0a4205181f6
reviewed runtime head: 753488e40e69fc13471df42959628ef3052e5992
runtime commits reconciled: 14
```

## Complete interaction loop

```txt
page load
  -> ordered 13-chunk bootstrap
  -> install 8 Core and 12 product kits
  -> create browser, WebGL, Canvas2D, DOM, audio and storage adapters

start
  -> generate and verify course
  -> prepare 25 near-field cells
  -> register near uniform-grid world
  -> register distant quadtree horizon world
  -> build truck and wildlife
  -> enter driving

driving
  -> collect intent
  -> sample road, terrain height and terrain normal
  -> tick simulation
  -> stream near cells
  -> update horizon focus on a 384-unit key
  -> prepare/update horizon patches
  -> reconcile horizon hosts
  -> update truck, camera, wildlife, HUD, map and audio
  -> render

delivery
  -> evaluate candidate yard
  -> settle completion or penalty
  -> build result
  -> show results and best-run storage
  -> retry, fresh course or title
```

## Domains in use

Browser startup/lifecycle; Core Scene, World, Input, Data, Simulation, Camera, Graphics and Transaction Ledger; World Profile, World Atlas, Horizon LOD, Road Classes, Terrain Policy, Truck Dynamics, Delivery Contracts, Truck, Course, Run, Delivery and Wildlife; course generation; near-field patch preparation; macro-sector generation; curved-horizon patch generation; terrain-normal continuity; WebGL, Canvas2D, DOM, WebAudio, storage, Node smoke, Actions, Pages and governance.

## Kit and service census

All kit IDs and offered services are enumerated in `trackers/2026-07-18T03-43-36-04-00/project-breakdown.md` and `kit-registry.json`.

```txt
engine-installed kits: 20
world providers: 2
controllers: 1
browser/product adapters: 9
proof/deployment adapters: 4
total source-backed surfaces: 36
proposed horizon-convergence surfaces: 20
```

## Source-backed findings

1. `prepareCell` and `updateCell` both replace `horizonPatches[cell.id]`.
2. `reconcileHorizon()` realizes only when `horizonHosts.has(cell.id)` is false.
3. No patch or host revision is compared.
4. Patch terrain heights are focus-dependent through `horizonDrop()`.
5. The provider descriptor omits focus, policy, atlas and patch identities.
6. Terrain resolution and `none` gates are consumed from the Horizon LOD DSK.
7. Distinct road, settlement and forest modes are not projected as distinct render recipes.
8. Static smoke checks source markers but does not execute replacement or visible-frame convergence.

## Required authority

**Proposed, not implemented:**

`the-long-haul-horizon-patch-generation-render-host-convergence-authority-domain`

```txt
HorizonWorldAdmissionCommand
  -> HorizonWorldAdmissionResult
HorizonPatchBuildCommand
  -> HorizonPatchBuildResult
HorizonPatchSettlementCommand
  -> HorizonPatchSettlementResult
HorizonHostReconciliationCommand
  -> HorizonHostReconciliationResult
HorizonProjectionCommitCommand
  -> HorizonFrameDigest
  -> FirstHorizonGenerationBoundFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, HTML, CSS, gameplay, rendering, tests, workflows and deployment were unchanged. No visible defect, performance regression, deployment mismatch or production failure is claimed without executable browser evidence.
