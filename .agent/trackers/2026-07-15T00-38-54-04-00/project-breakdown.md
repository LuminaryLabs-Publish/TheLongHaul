# Project breakdown: motion preference and presentation adoption

**Timestamp:** `2026-07-15T00-38-54-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `826395baa5b3aa82e48ab8037c277f3c5b2bc63c`  
**Status:** `motion-preference-camera-body-effect-admission-authority-audited`

## Summary

The Long Haul exposes a persisted `Camera movement` switch described as controlling `Road shake and body motion`. The boolean is adopted only by the rough-road suspension oscillation and rough-road camera bob. Steering roll, acceleration and braking pitch, cargo sway, and speed-driven camera FOV continue regardless of the selected setting.

This is a source-backed preference-adoption gap. It is not a claim that discomfort or a visual defect was reproduced in a browser.

## Plan ledger

**Goal:** make one versioned motion preference classify and control every camera and truck-body motion effect, persist durably, publish participant receipts, and acknowledge the first matching visible frame.

- [x] Enumerate all 11 accessible `LuminaryLabs-Publish` repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Compare ten eligible repositories with ten central-ledger entries.
- [x] Confirm ten eligible root `.agent` states.
- [x] Confirm zero new, ledger-missing, root-agent-missing, undocumented, or runtime-ahead eligible repositories.
- [x] Select only `LuminaryLabs-Publish/TheLongHaul` using the oldest synchronized central timestamp.
- [x] Trace settings entry, persistence, return routing, truck animation, camera animation, WebGL submission, and reload adoption.
- [x] Identify the complete interaction loop, every active domain, all kits, and every offered service.
- [x] Preserve the 19-surface source-backed inventory.
- [x] Define the motion-preference authority family and executable fixture matrix.
- [ ] Implement the authority and execute browser, artifact, and Pages fixtures.

## Selection comparison

```txt
accessible Publish repositories: 11
eligible after Cavalry exclusion: 10
central ledger entries: 10
root .agent states: 10
new or ledger-missing: 0
root-agent-missing: 0
undocumented: 0
runtime-ahead: 0

selected: LuminaryLabs-Publish/TheLongHaul
selection rule: oldest synchronized central documentation timestamp
prior central timestamp: 2026-07-14T19-39-36-04-00
excluded: LuminaryLabs-Publish/TheCavalryOfRome
```

```txt
TheLongHaul        2026-07-14T19-39-36-04-00 selected
MyCozyIsland       2026-07-14T20-05-56-04-00
IntoTheMeadow      2026-07-14T20-40-50-04-00
HorrorCorridor     2026-07-14T20-58-46-04-00
ZombieOrchard      2026-07-14T21-41-41-04-00
TheUnmappedHouse   2026-07-14T22-01-31-04-00
TheOpenAbove       2026-07-14T22-39-00-04-00
AetherVale         2026-07-14T23-00-09-04-00
PhantomCommand     2026-07-14T23-38-29-04-00
PrehistoricRush    2026-07-15T00-00-35-04-00
```

## Complete interaction loop

```txt
page startup
  -> load settings document from localStorage
  -> normalize sound, steering, quality, and motion values
  -> project switch state and apply render quality

settings from title
  -> transition title -> settings
  -> toggle Camera movement
  -> mutate settings.motion
  -> persist the complete settings document
  -> transition settings -> title

settings from pause
  -> pause run
  -> transition paused -> settings
  -> toggle Camera movement
  -> persist settings document
  -> transition settings -> paused
  -> resume driving

driving frame
  -> read vehicle, route, condition, input, and motion setting
  -> update simulation and vehicle state
  -> update truck visual
     -> steering roll remains active
     -> throttle/brake pitch remains active
     -> cargo sway remains active
     -> rough-road suspension shake obeys settings.motion
  -> update camera
     -> rough-road vertical bob obeys settings.motion
     -> speed-dependent FOV remains active
     -> camera interpolation remains active
  -> update wildlife, dust, map, audio, and HUD
  -> submit WebGL frame
  -> no preference revision, participant receipt, or matching-frame acknowledgement exists
```

## Domains in use

```txt
browser lifecycle, keyboard, resize, RAF, DOM events, localStorage
provider resolution and pinned module admission
Nexus Engine world, scheduler, clock, events, resources, snapshots
Core Scene
Core World
Core Input
Long Haul Delivery
Core Simulation
Vehicle Dynamics
Route Field
Resource Pressure
Hazard Field
Telemetry
procedural course generation
streamed terrain and course content
settings document normalization and persistence
motion preference and effect classification
truck suspension, steering roll, pitch, cargo sway, and wheel presentation
camera chase/cab placement, interpolation, rough-road bob, and dynamic FOV
Three.js WebGL rendering
DOM menu, settings, HUD, pause, results, and failure projection
Canvas2D explored-road map
WebAudio
best-score persistence
GitHub Pages deployment
repo-local and central audit governance
```

## Implemented kits and offered services

### Engine-installed kits

1. `core-scene-kit` via `createCoreSceneKit`
   - scene registry
   - current-scene readback
   - transition requests
   - exit validation
   - scene snapshots
2. `core-world-domain` via `createCoreWorldDomain`
   - world registration and removal
   - uniform-grid partitioning
   - focus and active-cell lifecycle
   - provider dependency ordering
   - world validation
3. `long-haul-core-input-kit` via `createCoreInputKit`
   - action manifest
   - keyboard bindings
   - input contexts
   - driving intent
   - input reset
4. `long-haul-delivery-domain-kit` via `defineDomainServiceKit`
   - seed ownership
   - generation progress
   - candidate depots
   - destination selection
   - depot checks
   - retry state
   - run result
   - snapshot, load, and reset
5. `long-haul-core-simulation-kit` via `createCoreSimulationKit`
   - run reset and start
   - pause and resume
   - timer and distance
   - penalty ledger and collisions
   - recovery
   - failure and completion
6. `vehicle-dynamics-kit` via `createVehicleDynamicsKit`
   - heavy-truck state
   - vehicle intent and kinematics
   - boost
   - bounds
   - impact events
   - reset
7. `long-haul-route` via `createRouteFieldKit`
   - route markers and corridors
   - nearest-marker query
   - route state
   - reset
8. `long-haul-condition` via `createResourcePressureKit`
   - fuel
   - truck condition
   - cargo condition
   - bounded adjustment
   - state and reset
9. `long-haul-wildlife` via `createHazardFieldKit`
   - hazard state and movement
   - bounds
   - circle collisions
   - collision events
   - reset
10. `long-haul-telemetry` via `createTelemetryKit`
    - truck history
    - run history
    - condition history
    - delivery history
    - reset

### World effect providers

1. `long-haul-terrain-provider`
   - prepare, update, and release cells
   - terrain effect descriptors
   - active-cell snapshots
   - reset
2. `long-haul-course-provider`
   - prepare, update, and release cells
   - roads, depots, signs, vegetation, and obstacles
   - course-content effect descriptors
   - active-cell snapshots
   - reset

### Browser and product adapters

1. `procedural-course-generator`
   - seed hash and deterministic RNG
   - five-branch graph
   - confusing fork
   - depot placement
   - par calculation
   - validation and generation plan
2. `three-webgl-presentation-adapter`
   - renderer, scene, camera, lighting, atmosphere
   - streamed meshes, truck rig, wildlife rig, dust, shadows
   - resize and RAF
3. `dom-scene-hud-adapter`
   - title, help, settings, generation progress, HUD, pause, results, loss, toast, failure overlay
4. `canvas-map-adapter`
   - explored roads, depots, rejected yards, truck marker, resize
5. `web-audio-adapter`
   - engine and wind loops
   - click, wrong-yard, impact, and delivery cues
6. `browser-storage-adapter`
   - settings document
   - best-score document

### Deployment adapter

1. `github-pages-workflow`
   - main-push trigger
   - Pages configuration
   - root artifact upload
   - Pages deployment

## Census

```txt
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
render surfaces: 3
executable validation commands: 0
planned motion authority surfaces: 18
```

## Main finding

The settings UI presents `Camera movement` with the description `Road shake and body motion`. `loadSettings()` restores and normalizes `settings.motion`, while `toggleSetting()` mutates and persists it.

The active presentation path gates only two effects with `settings.motion`:

```txt
rough-road suspension oscillation
rough-road camera vertical bob
```

The following motion continues regardless:

```txt
steering-driven truck roll
throttle/brake suspension pitch
cargo-crate sway
speed-driven camera FOV expansion
camera interpolation between desired transforms
```

The setting therefore has no complete, versioned definition of `Camera movement` or `body motion`. There is no result identifying which effects adopted the preference, no durable preference receipt, and no first visible frame tied to the accepted value.

## Required authority

```txt
the-long-haul-motion-preference-camera-body-effect-admission-authority-domain
```

```txt
MotionPreferenceCommand
  -> bind SettingsDocumentRevision, RunId, scene, and requested profile
  -> normalize Full, Reduced, or Static motion policy
  -> prepare camera, truck-body, cargo, and DOM presentation participants
  -> atomically publish MotionPreferenceRevision
  -> persist the accepted settings document
  -> publish MotionPreferenceResult and participant receipts

MotionFrameAdmissionCommand
  -> bind MotionPreferenceRevision, frame, camera, vehicle, and viewport revisions
  -> classify every effect as enabled, reduced, static, or rejected
  -> execute the admitted truck and camera presentation policy
  -> publish MotionFrameResult
  -> acknowledge FirstMotionPreferenceFrameAck

MotionPreferenceRestoreCommand
  -> load and validate the persisted preference
  -> reject stale or malformed documents
  -> adopt the accepted policy before the first game frame
  -> publish MotionPreferenceRestoreResult
```

## Required fixtures

```txt
settings toggle from title
settings toggle from paused run
reload and persistence adoption
rough-road suspension shake
rough-road camera bob
steering roll
throttle and brake pitch
cargo sway
dynamic FOV
camera interpolation policy
first matching WebGL frame
source, artifact, and Pages parity
```

## Audit boundary

Documentation only. Runtime JavaScript, gameplay, settings behavior, rendering, storage, imports, workflow, and deployment were not modified or executed.