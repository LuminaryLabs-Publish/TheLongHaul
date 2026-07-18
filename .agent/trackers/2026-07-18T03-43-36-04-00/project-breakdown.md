# Project breakdown: horizon patch and render-host convergence

**Timestamp:** `2026-07-18T03-43-36-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed runtime head:** `753488e40e69fc13471df42959628ef3052e5992`  
**Selection:** most recently updated runtime-ahead eligible Publish repository  
**Status:** `horizon-patch-render-host-convergence-authority-audited`

## Summary

The repository is 14 runtime commits ahead of its last documented repo-local head. The delta adds a second Core World for quadtree horizon terrain, curved-horizon projection, macro-sector road and settlement content, terrain-normal continuity, road elevation, grounded truck pose, and static shell checks.

The horizon provider now prepares updated patch data, but the Three.js host only realizes a patch when that cell has no existing host. If `updateCell()` replaces the patch for an already-realized cell, `reconcileHorizon()` leaves the existing geometry in place. The patch also carries focus-dependent curved heights without a patch revision, host revision, content digest, or visible-frame acknowledgement.

## Selection comparison

```txt
accessible LuminaryLabs-Publish repositories: 11
excluded: LuminaryLabs-Publish/TheCavalryOfRome
eligible repositories: 10
central ledgers present: 10
root .agent states present: 10
new or ledger-missing: 0
runtime-ahead repositories observed: 3
selected: LuminaryLabs-Publish/TheLongHaul
selection reason: latest runtime-ahead head among eligible repositories
selected previous documented head: 1ed59786aa8f8f26f643c9f1e8c4d0a4205181f6
selected reviewed runtime head: 753488e40e69fc13471df42959628ef3052e5992
runtime commits reconciled: 14
```

Runtime-ahead repositories observed during this comparison were TheLongHaul, PrehistoricRush, and HorrorCorridor. No work was performed outside TheLongHaul.

## Interaction loop

```txt
page load
  -> import Three.js and pinned Nexus Engine
  -> expose dependencies to ordered host chunks
  -> install 8 Core kits and 12 product DSKs
  -> create WebGL, Canvas2D, DOM, WebAudio and storage adapters

start
  -> generate and verify one five-branch delivery course
  -> prepare 25 near-field terrain cells
  -> register near-field uniform-grid Core World
  -> register distant quadtree horizon Core World
  -> build truck and wildlife rigs
  -> enter driving

driving frame
  -> collect keyboard intent
  -> sample terrain height and normal
  -> tick truck, run, delivery, wildlife and meters
  -> stream near-field cells
  -> update horizon focus when the truck crosses a 384-unit key
  -> prepare/update horizon patches through Core World
  -> reconcile horizon Three.js hosts
  -> update truck, wildlife, camera, HUD, map and audio
  -> render one WebGL frame

delivery
  -> reject decoy yards or accept the valid yard
  -> build terminal RunResult
  -> project results and reduced best-run persistence
  -> retry, generate a new course or return to title
```

## Domains in use

1. Browser startup and ordered script loading.
2. Browser document, RAF, resize, keyboard, focus, storage and audio lifecycle.
3. Core Scene.
4. Core World with a near uniform-grid world and distant quadtree world.
5. Core Input.
6. Core Data.
7. Core Simulation.
8. Core Camera.
9. Core Graphics.
10. Core Transaction Ledger.
11. Long Haul World Profile.
12. Long Haul World Atlas.
13. Long Haul Horizon LOD Policy.
14. Long Haul Road Class Catalog.
15. Long Haul Terrain Policy.
16. Long Haul Truck Dynamics Profile.
17. Long Haul Delivery Contract Catalog.
18. Long Haul Truck.
19. Long Haul Course.
20. Long Haul Run.
21. Long Haul Delivery.
22. Long Haul Wildlife.
23. Seeded finite-course generation.
24. Infinite near-field cell generation and preparation.
25. Macro-sector generation.
26. Curved-horizon terrain generation.
27. Horizon patch preparation and host realization.
28. Terrain-normal and road-elevation continuity.
29. Three.js WebGL presentation.
30. Canvas2D map projection.
31. DOM menu, HUD, result and fault projection.
32. WebAudio presentation.
33. Browser settings and best-run storage.
34. Node smoke validation.
35. GitHub Actions and Pages deployment.
36. Agent governance and central reconciliation.

## Complete kit and service census

### Core and product DSKs installed in the engine

| Kit | Domain | Services offered |
|---|---|---|
| `core-scene-kit` | Core Scene | scene registry; current scene; transition request; exit validation; transition identity; snapshot |
| `core-world-domain` | Core World | world register/remove; partition lifecycle; focus; active-cell lifecycle; provider ordering; validation; snapshot |
| `long-haul-input` | Core Input | semantic actions; keyboard bindings; contexts; driving intent; reset |
| `core-data-kit` | Core Data | course schema; package envelope; digest verification; named random streams; random snapshot/restore |
| `core-simulation-kit` | Core Simulation | fuel, truck-condition, cargo-condition and remaining-time meters; bounds; rates; locks; thresholds; reset |
| `core-camera-kit` | Core Camera | camera target; position/look/FOV smoothing; snap; mode; portable descriptor |
| `core-graphics-kit` | Core Graphics | instance-batch registration; cell replace/remove; flush; bounds; release receipt |
| `core-transaction-ledger-kit` | Core Transaction Ledger | ledger identity; apply-once; duplicate classification; metadata; snapshot |
| `long-haul-world-profile-kit` | World Profile | world profile; extent policy; gameplay-cell policy; horizon policy; atlas targets; configure; snapshot; reset |
| `long-haul-world-atlas-kit` | World Atlas | macro-sector generation; biome density; settlement registry; edge portals; road registry; sector query; snapshot; reset |
| `long-haul-horizon-lod-policy-kit` | Horizon LOD | terrain resolution; forest mode; road mode; settlement mode; collision policy; configure; snapshot; reset |
| `long-haul-road-class-catalog-kit` | Road Classes | road-class catalog; surface policy; grade/curvature policy; jump weighting; get/list/register; snapshot/reset |
| `long-haul-terrain-policy-kit` | Terrain Policy | octave policy; landform density; road flattening; jump profiles; configure; snapshot/reset |
| `long-haul-truck-dynamics-profile-kit` | Truck Dynamics | powertrain; drag; steering; grip; suspension; air control; boost; configure; snapshot/reset |
| `long-haul-delivery-contract-catalog-kit` | Delivery Contracts | contract catalog; job policy; get/list/register; snapshot/reset |
| `long-haul-truck-kit` | Truck | truck state; road kinematics; drift; ground contact; suspension; air control; input; impulse; teleport; recovery pose; snapshot/load |
| `long-haul-course-kit` | Course | course state; exploration; discovered depots; route query; sample; reset; snapshot/load |
| `long-haul-run-kit` | Run | clock; distance; max speed; off-road time; penalties; collisions; stuck detection; recovery; completion; failure; snapshot/load |
| `long-haul-delivery-kit` | Delivery | candidate depots; valid depot; evaluation; duplicate check; result; reset; snapshot/load |
| `long-haul-wildlife-kit` | Wildlife | hazard load; crossing motion; damage radius; direction; reset; snapshot/load |

### Core World effect providers

| Provider | Phase | Services offered |
|---|---|---|
| `long-haul-course-provider` | foundation | prepared-cell admission; update; release; effect descriptor; patch snapshot/restore; reset |
| `long-haul-horizon-provider` | presentation | quadtree cell preparation/update; curved-horizon patch generation; active patch registry; release; descriptor; snapshot; reset |

### Controller

| Controller | Services offered |
|---|---|
| `long-haul-world-patch-preparation-controller` | focus; desired-set calculation; forward prefetch; generation budget; activation budget; cache; prime; ready patches; release; snapshot/reset |

### Browser and product adapters

| Adapter | Services offered |
|---|---|
| `ordered-module-bootstrap-adapter` | import-map bootstrap; global dependency publication; ordered 13-chunk loading; load failure projection |
| `procedural-course-generator` | seeded five-branch graph; depots; wildlife; par; validation |
| `course-cell-descriptor-generator` | world-coordinate terrain; conformed roads; signs; depots; vegetation; grass; rocks; obstacles |
| `browser-keyboard-input-adapter` | keydown; keyup; held state; one-shot state; frame clear |
| `three-webgl-presentation-adapter` | renderer; scene; near-field batches; streamed terrain; horizon hosts; truck rig; wildlife rig; resize; RAF; render; disposal |
| `dom-scene-hud-adapter` | title; help; settings; generation progress; HUD; pause; results; loss; toast; failure overlay |
| `canvas-map-adapter` | course-bounds transform; roads; depots; rejected yards; truck marker; DPR resize |
| `web-audio-adapter` | context unlock; engine loop; wind loop; cues; gain update |
| `browser-storage-adapter` | settings; best score; global adjusted-time comparison; reduced record write |

### Proof and deployment adapters

| Adapter | Services offered |
|---|---|
| `atomic-domain-kits-smoke` | product composition; profile policy; catalog policy; macro-sector generation; truck dynamics |
| `long-haul-game-smoke` | 100-seed generation; cloneability; distant determinism; seam equality; truck motion; delivery evaluation |
| `static-shell-smoke-and-ci` | engine pin; single tick; syntax; source markers; main-push CI |
| `github-pages-deployment` | static-root publication; main-source delivery |

## Census

```txt
Core kits: 8
product DSKs: 12
engine-installed kits: 20
Core World effect providers: 2
standalone controllers: 1
browser/product adapters: 9
proof/deployment adapters: 4
total source-backed surfaces: 36
render surfaces: 3
proposed horizon-convergence surfaces: 20
```

## Runtime delta reconciled

The 14 runtime commits after the previous documentation head:

- introduced broad, rolling, medium and detail terrain noise;
- conformed road elevations and road ribbons to terrain;
- added jump crests for non-safe roads;
- grounded the truck and applied suspension, pitch and roll presentation;
- raised and obstacle-adjusted the chase camera;
- added cross-cell terrain-normal sampling;
- registered `long-haul-horizon` as a quadtree Core World;
- added a curved-horizon surface and presentation provider;
- generated low-resolution distant terrain from macro sectors;
- added distant roads and settlement silhouettes;
- added LOD-based sector stepping and `none` gating for road/settlement content;
- extended static shell checks to the horizon and grounding markers.

## Main finding

`createHorizonProvider()` stores each newly prepared or updated patch in `horizonPatches`. `reconcileHorizon()` realizes a patch only when no host exists for that cell. It does not compare the stored patch with the existing `horizonHosts` entry or replace an existing host after `updateCell()`.

Each patch contains focus-dependent curved vertex heights and sampled atlas content. There is no patch generation, focus revision, policy revision, atlas-sector ownership list, content digest, host generation, replacement result, stale-host retirement receipt, frame digest, or first matching-frame acknowledgement.

The LOD DSK is only partially projected. Terrain resolution and `none` gates are consumed, while distinct road modes, settlement modes and every forest mode are not represented by distinct realization behavior.

## Proposed authority

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
  -> created | replaced | retained | retired | rejected-stale
  -> HorizonHostReconciliationResult

HorizonProjectionCommitCommand
  -> HorizonFrameDigest
  -> FirstHorizonGenerationBoundFrameAck
```

### Proposed surfaces

1. `horizon-world-generation-kit`
2. `horizon-focus-revision-kit`
3. `horizon-policy-revision-kit`
4. `horizon-cell-revision-kit`
5. `horizon-atlas-sector-ownership-kit`
6. `horizon-patch-build-kit`
7. `horizon-road-mode-projection-kit`
8. `horizon-settlement-mode-projection-kit`
9. `horizon-forest-mode-projection-kit`
10. `horizon-content-clipping-kit`
11. `horizon-patch-digest-kit`
12. `horizon-host-generation-kit`
13. `horizon-host-replace-kit`
14. `horizon-stale-host-retirement-kit`
15. `horizon-resource-retirement-kit`
16. `horizon-reconciliation-result-kit`
17. `horizon-frame-digest-kit`
18. `first-horizon-generation-bound-frame-ack-kit`
19. `horizon-browser-motion-fixture-kit`
20. `pages-horizon-parity-fixture-kit`

## Validation boundary

This run changed documentation only. Runtime JavaScript, HTML, CSS, gameplay, rendering, tests, workflows and deployment were not modified. Source inspection establishes the conditional stale-host path and partial LOD-policy projection; it does not prove a visible defect, performance regression, artifact mismatch or production failure without executable browser evidence.
