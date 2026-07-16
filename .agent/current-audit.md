# Current audit: product-policy runtime adoption

**Timestamp:** `2026-07-16T14-01-02-04-00`  
**Reviewed pre-audit repository head:** `b224a9c181635ee43434900b7f6e48199535f7e9`  
**Previous documented repository head:** `dbd276e894cf3960d0305cfe46bab95ef01d4253`  
**Status:** `product-policy-runtime-adoption-authority-audited`

## Summary

TheLongHaul gained five game-stable DSKs: world profile, road-class catalog, terrain policy, truck-dynamics profile, and delivery-contract catalog. `createLongHaulProductKits()` installs all five and groups ten product kits into semantic world, truck, delivery, and run families.

The architecture is cleaner, but the product-policy resources are not yet the runtime source of truth. Existing generation and simulation paths continue to use constants embedded in `shared.mjs`, `generator.mjs`, `world-base.mjs`, `cell-descriptor.mjs`, `truck-kit.mjs`, and `delivery-kit.mjs`.

## Intent

Establish one immutable, revision-bound product-policy generation and require every run-producing or frame-producing consumer to use it.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented roots: 0

selected: LuminaryLabs-Publish/TheLongHaul
selection class: material runtime-ahead product-domain expansion
previous documented head: dbd276e894cf3960d0305cfe46bab95ef01d4253
reviewed pre-audit head: b224a9c181635ee43434900b7f6e48199535f7e9
ahead by: 6 commits
changed files: 6
excluded: LuminaryLabs-Publish/TheCavalryOfRome
```

## Complete interaction loop

```txt
page load
  -> import Three.js and pinned Nexus Engine
  -> load bootstrap and eleven ordered application chunks
  -> create Core Scene, World, Input, Data, Simulation,
     Camera, Graphics, and Transaction Ledger
  -> create five policy DSKs
  -> create Truck, Course, Run, Delivery, and Wildlife DSKs
  -> install all 18 kits into one engine
  -> create Three.js, Canvas2D, DOM, WebAudio, and storage adapters

Start the Haul
  -> choose seed
  -> generate the five-branch course from hardcoded generation profiles
  -> create and verify the Core Data course envelope
  -> load Course and Delivery state
  -> create and prime the patch-preparation controller
  -> generate initial course cells from hardcoded terrain/cell rules
  -> load Wildlife and reset Truck, Run, and resource meters
  -> register the Core World provider and active cells
  -> start run and transition to driving

Driving frame
  -> derive browser input and submit Core Input + Truck requests
  -> truck simulation applies hardcoded motion constants
  -> course/run/delivery/wildlife systems resolve
  -> Core Simulation and Transaction Ledger settle resources/operations
  -> engine ticks once
  -> patch preparation and Core World update active cells
  -> camera, HUD, map, audio, and Three.js presentation update
  -> one visible frame is rendered

Outcome
  -> one valid depot completes the current delivery model
  -> failure conditions produce loss
  -> retry same seed or create a fresh run
```

## Domains in use

```txt
browser startup and ordered modules
browser input and focus lifecycle
Core Scene
Core World
Core Input
Core Data
Core Simulation
Core Camera
Core Graphics
Core Transaction Ledger
Long Haul World Profile
Long Haul Road Class Catalog
Long Haul Terrain Policy
Long Haul Truck Dynamics Profile
Long Haul Delivery Contract Catalog
Long Haul Truck
Long Haul Course
Long Haul Run
Long Haul Delivery
Long Haul Wildlife
procedural course generation
course-cell and terrain generation
patch preparation and world provider lifecycle
Three.js WebGL presentation
Canvas2D map projection
DOM menu/HUD/outcome projection
WebAudio
browser storage
Node smoke validation
GitHub Actions and Pages deployment
repo-local and central audit governance
planned product-policy adoption authority
```

## Kits and offered services

### Core kits

```txt
core-scene-kit
  scene registry, current scene, exit validation, transition identity,
  transition requests, snapshot

core-world-domain
  world registration/removal, uniform-grid partition, focus,
  active cells, provider ordering, validation, snapshot

long-haul-input
  semantic actions, keyboard bindings, contexts, driving intent, reset

core-data-kit
  schemas, envelopes, digest verification, named random streams,
  random snapshot/restore

core-simulation-kit
  fuel, truck/cargo condition, time meters, bounds, rates,
  spend/restore, locks, thresholds, reset

core-camera-kit
  target, position/look/FOV smoothing, snap, mode, portable descriptor

core-graphics-kit
  batch registration, cell replace/remove, matrix writes,
  flush, bounds, release receipts

core-transaction-ledger-kit
  apply-once operations, duplicate classification, metadata, snapshot
```

### New product-policy DSKs

```txt
long-haul-world-profile-kit
  world profile, disk policy, gameplay-cell policy,
  horizon/quadtree policy, settlement/road atlas targets,
  configure, snapshot, reset

long-haul-road-class-catalog-kit
  road-class registry, width/grip/grade/curvature policy,
  jump weighting, get/list/register, snapshot/reset

long-haul-terrain-policy-kit
  terrain octave policy, hill/ridge/valley density,
  road flatten/smoothing, jump-profile catalog,
  configure, jump lookup, snapshot/reset

long-haul-truck-dynamics-profile-kit
  powertrain, drag, rolling resistance, steering, grip,
  suspension, air control, boost, configure, snapshot/reset

long-haul-delivery-contract-catalog-kit
  standard/fragile/express/lost-manifest/rough-road/
  cross-region/multi-stop contract types,
  get/list/register, snapshot/reset
```

### Existing product DSKs

```txt
long-haul-truck-kit
  truck state, input, road kinematics, surface grip,
  impulse, teleport, recovery pose, reset, snapshot/load

long-haul-course-kit
  course package, exploration, depot discovery,
  nearest-road/depot query, sample, reset, snapshot/load

long-haul-run-kit
  clock, distance, speed, off-road time, penalties,
  collisions, stuck/recovery, completion/failure, snapshot/load

long-haul-delivery-kit
  candidate/valid depot state, depot checks,
  duplicate classification, delivery result, reset, snapshot/load

long-haul-wildlife-kit
  deterministic hazard load and crossing motion,
  damage/radius/direction, reset, snapshot/load
```

### Providers, controllers, adapters, and proof

```txt
long-haul-course-provider
  prepared-cell admission, update/release, effect descriptor,
  patch snapshot/restore/reset

long-haul-world-patch-preparation-controller
  focus, desired/prefetch sets, generation/activation budgets,
  cache, prime, ready lookup, release, snapshot/reset

browser/product adapters
  ordered bootstrap, course generation, cell generation,
  keyboard capture, Three.js rendering, DOM/HUD, Canvas map,
  WebAudio, settings and score storage

proof/deployment adapters
  seeded playability smoke, static-shell/source checks,
  main-branch CI, static Pages publication
```

## Source-backed finding

```txt
policy kit installed                         yes
policy resource initialized                  yes
policy configure/register events             yes
semantic product grouping                    yes

world profile consumed by generator          no
world profile consumed by streaming/horizon  no
road catalog consumed by course generator    no
terrain policy consumed by terrain/cells     no
jump catalog consumed by generated roads     no
truck dynamics resource consumed by truck    no
delivery contracts consumed by delivery      no
policy digest bound to run/course/cells       no
mixed-policy revision rejection              no
FirstPolicyBoundRunAck                        no
FirstPolicyBoundFrameAck                      no
```

`createLongHaulProductKits()` passes `dynamicsProfileResource` to `createLongHaulTruckKit()`, but the truck factory accepts only `N` and hardcodes acceleration, speed, drag, rolling resistance, steering, grip, and wheelbase. The other four policy DSKs are installed but are not passed into course, cell, terrain, world-streaming, or delivery consumers.

This is a source-backed adoption and configuration-coherence gap. It does not mean the current default game is unplayable.

## Required authority

`the-long-haul-product-policy-runtime-adoption-authority-domain`

```txt
ProductPolicyAdmissionCommand
  -> bind PolicyGeneration and RunGeneration
  -> read world, road, terrain, truck, and delivery revisions
  -> validate IDs, numeric ranges, references, and supported features
  -> compute ProductPolicyDigest
  -> publish ProductPolicyAdmissionResult

Policy-bound consumers
  -> course generation reads world + road policy
  -> terrain/cell generation reads terrain + road policy
  -> truck simulation reads truck-dynamics policy
  -> delivery state reads contract policy
  -> streaming/horizon reads world profile
  -> course, run, cell, cache, and snapshot identity include digest
  -> reject stale or mixed revisions
  -> publish FirstPolicyBoundRunAck
  -> publish FirstPolicyBoundFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, HTML, CSS, simulation, generation, rendering, tests, workflow, and deployment were not changed by this audit.