# Project breakdown: product-policy runtime adoption

**Timestamp:** `2026-07-16T14-01-02-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Reviewed pre-audit head:** `b224a9c181635ee43434900b7f6e48199535f7e9`  
**Status:** `product-policy-runtime-adoption-authority-audited`

## Summary

Six new commits added five policy DSKs and grouped the product composition into semantic world, truck, delivery, and run families. The DSKs are installed, but the live course, terrain, truck, delivery, streaming, cache, and frame paths do not yet consume one exact policy generation.

## Interaction loop

```txt
page load
  -> import Three.js + Nexus Engine
  -> ordered bootstrap of eleven app chunks
  -> install 8 Core kits + 10 product DSKs
  -> create WebGL, Canvas2D, DOM, audio, storage adapters

Start
  -> seed course generation
  -> generate compact five-branch graph
  -> envelope/verify course
  -> load course + delivery
  -> prepare/prime cells
  -> reset truck/run/meters/wildlife
  -> register world provider
  -> enter driving

Driving frame
  -> browser input -> Core Input + Truck requests
  -> policy DSK resolve phase
  -> truck/course/run/delivery/wildlife systems
  -> Core meters + transaction settlement
  -> one engine tick
  -> patch/world update
  -> camera/HUD/map/audio/presentation
  -> one WebGL frame

Outcome
  -> valid depot -> result
  -> failure -> loss
  -> retry same seed or create fresh run
```

## Domains

```txt
browser bootstrap and input lifecycle
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
terrain and course-cell generation
patch preparation and world provider lifecycle
Three.js WebGL presentation
Canvas2D map
DOM UI/HUD
WebAudio
browser storage
Node validation, Actions, and Pages
agent/central governance
```

## Complete kit and service inventory

### Core kits: 8

| Kit | Services |
|---|---|
| `core-scene-kit` | scene registry, current scene, exits, transition request/identity, snapshot |
| `core-world-domain` | worlds, partition, focus, active cells, providers, validation, snapshot |
| `long-haul-input` | semantic actions, bindings, contexts, driving intent, reset |
| `core-data-kit` | schemas, envelopes, digests, named RNG, snapshot/restore |
| `core-simulation-kit` | fuel, condition, cargo, time meters, rates, locks, thresholds |
| `core-camera-kit` | target, smoothing, snap, mode, portable descriptor |
| `core-graphics-kit` | instance batches, cell replace/remove, writes, flush, release |
| `core-transaction-ledger-kit` | apply-once, duplicate classification, metadata, snapshot |

### Product DSKs: 10

| Kit | Services | Runtime adoption |
|---|---|---|
| `long-haul-world-profile-kit` | disk, cells, horizon/LOD, atlas targets, configure/snapshot/reset | installed; not consumed by generator/streaming |
| `long-haul-road-class-catalog-kit` | widths, grip, grade, curvature, jump weights, registry | installed; not consumed by course generation |
| `long-haul-terrain-policy-kit` | noise octaves, landform densities, road smoothing, jump profiles | installed; not consumed by terrain/cells |
| `long-haul-truck-dynamics-profile-kit` | powertrain, drag, steering, grip, suspension, air, boost | installed; passed to truck factory but ignored |
| `long-haul-delivery-contract-catalog-kit` | seven contract types and job policy | installed; not consumed by delivery loop |
| `long-haul-truck-kit` | input, kinematics, grip, impulse, teleport, recovery, snapshots | active; hardcoded dynamics |
| `long-haul-course-kit` | exploration, depot discovery, route queries, samples, snapshots | active |
| `long-haul-run-kit` | clock, distance, penalties, collisions, recovery, outcomes | active |
| `long-haul-delivery-kit` | candidate/valid depots, checks, results, snapshots | active; single-depot model |
| `long-haul-wildlife-kit` | deterministic crossings, damage/radius, snapshots | active |

### Provider/controller: 2

| Surface | Services |
|---|---|
| `long-haul-course-provider` | prepared-cell admission, update, release, effect descriptor, snapshot/reset |
| `long-haul-world-patch-preparation-controller` | focus, desired/prefetch, budgets, cache, prime, ready/release, snapshot/reset |

### Browser/product adapters: 9

```txt
ordered-module-bootstrap-adapter
procedural-course-generator
course-cell-descriptor-generator
browser-keyboard-input-adapter
three-webgl-presentation-adapter
dom-scene-hud-adapter
canvas-map-adapter
web-audio-adapter
browser-storage-adapter
```

### Proof/deployment adapters: 3

```txt
long-haul-game-smoke
static-shell-smoke-and-ci
github-pages-deployment
```

## Census

```txt
engine-installed kits: 18
provider/controller surfaces: 2
browser/product adapters: 9
proof/deployment adapters: 3
total source-backed surfaces: 32
render surfaces: 3
new policy DSKs: 5
planned policy-adoption surfaces: 18
```

## Source-backed finding

```txt
Product composition now says:
  world    = world profile + roads + terrain + course
  truck    = dynamics profile + truck
  delivery = contract catalog + delivery
  run      = run + wildlife

Runtime behavior still says:
  world    = fixed constants + compact generator
  roads    = BRANCH_PROFILES and literals
  terrain  = hardcoded noise/flattening/cell density
  truck    = hardcoded dynamics
  delivery = one valid depot check
```

The semantic split is useful and should remain. The missing step is explicit consumer injection/admission rather than another reorganization.

## Required authority

`the-long-haul-product-policy-runtime-adoption-authority-domain`

```txt
ProductPolicyAdmissionCommand
  -> validate five policy surfaces
  -> bind exact revisions to one generation
  -> compute ProductPolicyDigest
  -> publish accepted/rejected result
  -> create course/run/cells from that generation
  -> reject stale/mixed work
  -> publish FirstPolicyBoundRunAck
  -> publish FirstPolicyBoundFrameAck
```

## Validation boundary

Documentation only. No runtime, test, workflow, or deployment behavior changed. No product-policy adoption claim is made.