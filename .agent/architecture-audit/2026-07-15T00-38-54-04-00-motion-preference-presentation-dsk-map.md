# Architecture audit: motion preference presentation DSK map

**Timestamp:** `2026-07-15T00-38-54-04-00`

## Summary

The current motion preference is browser-host state, not an engine-owned revision. Two presentation effects read it directly while other camera and truck-body effects bypass it.

## Current domain map

```txt
DOM settings surface
  -> settings object
  -> localStorage document
  -> direct reads from truck and camera presentation

Core Scene
  -> title, settings, paused, driving route ownership

Core Simulation and Vehicle Dynamics
  -> authoritative run and truck state

Three.js presentation adapter
  -> truck transform and suspension
  -> cargo sway
  -> chase/cab camera
  -> dynamic FOV
  -> WebGL submission
```

## Current DSK and service ownership

```txt
core-scene-kit
  scene registry, current scene, transitions, exit validation, snapshots

core-world-domain
  world registry, partition, focus, active cells, provider ordering, validation

long-haul-core-input-kit
  actions, bindings, contexts, driving intent, reset

long-haul-delivery-domain-kit
  seed, generation progress, depot candidates, destination, checks, retry, result, snapshot, reset

long-haul-core-simulation-kit
  reset, start, pause, resume, timer, distance, penalties, recovery, failure, completion

vehicle-dynamics-kit
  truck state, input, kinematics, boost, bounds, impacts, reset

long-haul-route
  markers, corridors, nearest-marker query, route state, reset

long-haul-condition
  fuel, truck and cargo pressure, bounded adjustment, state, reset

long-haul-wildlife
  hazard state, movement, bounds, collisions, events, reset

long-haul-telemetry
  truck, run, condition and delivery histories

long-haul-terrain-provider
  terrain cell prepare, update, release, descriptor, snapshot, reset

long-haul-course-provider
  course cell prepare, update, release, roads, depots, signs, vegetation, obstacles, descriptor, snapshot, reset
```

## Ownership gap

```txt
settings.motion owner: mutable browser object
preference revision: absent
accepted profile: implicit boolean
participant preparation: absent
participant receipts: absent
restore result: absent
frame acknowledgement: absent
fallback or malformed-document policy: absent
```

The browser adapter directly decides whether two oscillations execute. No domain owns the semantic promise made by `Camera movement` and `Road shake and body motion`.

## Required domain

```txt
the-long-haul-motion-preference-camera-body-effect-admission-authority-domain
```

### Proposed subkits

```txt
motion-preference-command-kit
motion-preference-revision-kit
motion-profile-policy-kit
settings-document-admission-kit
camera-motion-participant-kit
truck-suspension-motion-participant-kit
cargo-sway-participant-kit
dynamic-fov-participant-kit
rough-road-shake-participant-kit
motion-effect-classification-kit
motion-adoption-result-kit
motion-participant-receipt-kit
first-motion-preference-frame-kit
preference-persistence-receipt-kit
preference-restore-result-kit
browser-motion-matrix-fixture-kit
source-artifact-pages-motion-parity-kit
system-motion-preference-adapter-kit
```

## Contract

```txt
MotionPreferenceCommand
  -> expected SettingsDocumentRevision
  -> requested profile
  -> target scene and run generation
  -> participant preparation
  -> atomic revision adoption
  -> persistence receipt
  -> MotionPreferenceResult

MotionFrameAdmissionCommand
  -> accepted MotionPreferenceRevision
  -> camera and vehicle revisions
  -> per-effect classification
  -> participant execution receipts
  -> MotionFrameResult
  -> FirstMotionPreferenceFrameAck
```

## Non-goals

```txt
no new renderer
no replacement camera system
no change to vehicle simulation
no change to course generation
no migration of general settings into Core
```

The smallest reliable change is a product-owned preference authority consumed by existing presentation adapters.