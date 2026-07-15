# Project breakdown: input action contract and Core Input convergence

**Timestamp:** `2026-07-15T19-38-38-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `cc4ec1d7ad16e6aa29e7719203d5411217142f25`  
**Status:** `input-action-contract-context-convergence-authority-audited`

## Summary

TheLongHaul installs a Core Input kit with an action manifest, keyboard bindings and `driving`/`menu` contexts, but the browser host keeps a second input system in a mutable `keys` object and direct `keydown` handlers. Driving intent is derived from that host state and copied into Core Input once per frame; map, camera, pause and retry bypass Core Input entirely.

The declared and executable action maps also disagree: Core Input declares `KeyR` as `recovery`, while the live `keydown` path uses `KeyR` to retry the current seed. Recovery is actually reached through contextual `KeyE` interaction logic.

## Plan ledger

**Goal:** establish one versioned action-map and context authority so every browser event becomes one accepted semantic action before gameplay or presentation consumes it.

- [x] Enumerate all 11 accessible Publish repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible central ledgers and ten root `.agent` states.
- [x] Compare each eligible current head with its documented repo-local head.
- [x] Confirm no new, missing, undocumented, root-agent-missing or runtime-ahead repository.
- [x] Select only TheLongHaul by the oldest synchronized central timestamp.
- [x] Inspect Core Input construction, browser listeners, mutable key state, per-frame intent projection and action consumers.
- [x] Identify the full interaction loop, domains, kits, adapters, providers and services.
- [x] Refine the source-backed census to include the browser keyboard adapter.
- [x] Define one parent input-action authority and 20 coordinating surfaces.
- [x] Add the timestamped audit family.
- [ ] Implement and execute action-map, context, lifecycle, artifact and Pages fixtures.

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
selection rule: oldest synchronized central timestamp
prior timestamp: 2026-07-15T14-40-11-04-00
next oldest: LuminaryLabs-Publish/MyCozyIsland at 2026-07-15T15-01-22-04-00
excluded: LuminaryLabs-Publish/TheCavalryOfRome
```

## Complete interaction loop

```txt
boot
  -> install Core Scene, Core World, Core Input and game kits
  -> declare actions, keyboard bindings and input contexts
  -> install separate window keydown, keyup and blur listeners
  -> enter title

held driving input
  -> keydown mutates host-local keys[code]
  -> RAF reads W/S/A/D/arrows/Shift directly
  -> host derives throttle brake steer boost and reverse
  -> host copies derived intent into Core Input
  -> host submits vehicle input directly
  -> engine tick settles simulation
  -> WebGL, Canvas2D, DOM and audio project effects

one-shot input
  -> Escape invokes pause/resume/settings/back directly
  -> C changes camera mode directly
  -> M changes map state directly
  -> E sets host-local interactWanted
  -> R retries the current seed directly
  -> these commands do not settle through Core Input action results

contextual recovery
  -> E is consumed during driving
  -> host evaluates stuck, fuel, road and bounds state
  -> host may call recovery
  -> Core Input's declared KeyR recovery binding is not used
```

## Source-backed action-map comparison

```txt
semantic action    declared Core Input binding    executable browser behavior
throttle           W / ArrowUp                    direct keys state -> per-frame intent
brake              S / ArrowDown                  direct keys state -> per-frame intent
steerLeft          A / ArrowLeft                  direct keys state -> per-frame intent
steerRight         D / ArrowRight                 direct keys state -> per-frame intent
boost              Shift                          direct keys state -> per-frame intent
interact           E                              host flag then contextual interaction
camera             C                              direct camera mutation
map                M                              direct map mutation
pause              Escape                         direct route command
recovery           R                              not executed as recovery
retry              not declared                   R retries current seed
```

```txt
Core Input action manifest: present
Core Input keyboard bindings: present
Core Input contexts: driving and menu declared
browser keydown/keyup state owner: separate mutable keys object
browser event -> Core Input action admission: absent
context activation/deactivation result: absent
one-shot action publication: absent
KeyR declaration/runtime agreement: absent
stale held-action generation: absent
route-bound input retirement receipt: absent
InputActionResult: absent
FirstInputActionAck: absent
FirstInputEffectFrameAck: absent
```

This is a source-backed contract divergence. It does not prove a specific misclick, stuck key or user-visible failure because no controlled browser input fixture was executed.

## Domains in use

```txt
browser document, keyboard, focus, blur, resize and RAF lifecycle
provider resolution and pinned imports
Core Scene, Core World, Core Input and Core Simulation
Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
browser event capture, action mapping, context admission and held-action lifecycle
seeded course generation, validation, streaming and readiness
truck, wildlife, exploration, depot interaction, recovery, retry and scoring
settings, motion, pause, audio and storage
Three.js WebGL, Canvas2D map and DOM UI/HUD
input-effect visible-frame convergence
Pages deployment, repo-local audit state and central governance
```

## Complete kit and service inventory

### Engine-installed kits: 10

```txt
core-scene-kit: scene registry, current scene, transitions, exit validation, snapshots
core-world-domain: world registry/removal, partition, focus, cells, provider ordering, validation
long-haul-core-input-kit: action manifest, keyboard bindings, contexts, intent snapshot, reset
long-haul-delivery-domain-kit: seed, generation progress, depots, checks, retry, result, snapshot, reset
long-haul-core-simulation-kit: reset, start, pause, resume, timer, distance, penalties, recovery, failure, completion
vehicle-dynamics-kit: truck state, input, kinematics, boost, bounds, impacts, reset
long-haul-route: markers, corridors, nearest marker, route state, reset
long-haul-condition: fuel, truck, cargo, bounded adjustments, state, reset
long-haul-wildlife: hazards, motion, bounds, collisions, events, reset
long-haul-telemetry: truck, run, condition and delivery histories, reset
```

### Core World providers: 2

```txt
long-haul-terrain-provider: prepare, update, release, descriptors, active-cell snapshots, reset
long-haul-course-provider: prepare, update, release, roads, depots, signs, vegetation, obstacles, descriptors, snapshots, reset
```

### Browser and product adapters: 7

```txt
procedural-course-generator: seed/RNG, five-branch graph, confusing fork, depots, par, validation, generation plan
browser-keyboard-input-adapter: keydown, keyup, held-state, repeat filter, route commands, blur clearing and pause
three-webgl-presentation-adapter: renderer, scene, camera, atmosphere, meshes, truck, wildlife, dust, resize, RAF and render
DOM scene/HUD adapter: title, help, settings, generation, HUD, pause, results, loss, toast and failure
Canvas2D map adapter: explored roads, depots, rejections, truck and DPR-aware resize
WebAudio adapter: context unlock, master bus, engine/wind loops, cues and RAF gain updates
browser-storage adapter: settings, motion and best-score documents
```

### Deployment adapter: 1

```txt
github-pages-workflow: main trigger, Pages configuration, root artifact upload and deployment
```

```txt
engine-installed kits: 10
Core World providers: 2
browser/product adapters: 7
deployment adapters: 1
total source-backed surfaces: 20
render surfaces: 3
planned input-action authority surfaces: 20
```

## Required authority

```txt
the-long-haul-input-action-contract-context-convergence-authority-domain
```

```txt
InputEventAdmissionCommand
  -> bind DocumentId, InputGeneration, DeviceId, EventId,
     ActionMapRevision, ContextRevision and RouteRevision
  -> normalize one browser event through one binding table
  -> reject stale, duplicate, repeated, retired or out-of-context evidence
  -> update one immutable held-action snapshot
  -> publish InputEventAdmissionResult

InputActionCommand
  -> resolve throttle, brake, steer, boost, interact,
     camera, map, pause, retry and recovery semantics
  -> require explicit context eligibility
  -> remove the KeyR recovery/retry contradiction
  -> publish InputActionResult exactly once
  -> allow gameplay and presentation to consume only accepted actions
  -> publish FirstInputActionAck
  -> publish FirstInputEffectFrameAck

InputLifecycleCommand
  -> clear held actions on keyup, blur, visibility loss,
     route transition, generation replacement and retirement
  -> publish InputLifecycleResult
```

## Planned authority surfaces

```txt
input-event-admission-kit
browser-keyboard-event-adapter-kit
input-device-generation-kit
input-action-map-revision-kit
input-binding-resolution-kit
input-context-revision-kit
route-input-context-policy-kit
held-action-state-kit
repeat-and-duplicate-rejection-kit
focus-target-input-guard-kit
input-command-envelope-kit
input-event-admission-result-kit
input-action-result-kit
core-input-state-publication-kit
action-consumer-binding-kit
stale-input-rejection-kit
input-lifecycle-retirement-kit
first-input-action-ack-kit
first-input-effect-frame-ack-kit
keyboard-context-artifact-pages-fixture-kit
```

## Repo-local output

```txt
.agent/trackers/2026-07-15T19-38-38-04-00/project-breakdown.md
.agent/turn-ledger/2026-07-15T19-38-38-04-00.md
.agent/architecture-audit/2026-07-15T19-38-38-04-00-input-action-contract-convergence-dsk-map.md
.agent/render-audit/2026-07-15T19-38-38-04-00-input-effect-visible-frame-gap.md
.agent/gameplay-audit/2026-07-15T19-38-38-04-00-retry-recovery-action-divergence-loop.md
.agent/interaction-audit/2026-07-15T19-38-38-04-00-input-action-command-result-map.md
.agent/input-audit/2026-07-15T19-38-38-04-00-browser-core-input-context-contract.md
.agent/deploy-audit/2026-07-15T19-38-38-04-00-input-context-browser-fixture-gate.md
.agent/central-sync-audit/2026-07-15T19-38-38-04-00-oldest-selection-input-action-reconciliation.md
```

## Validation boundary

Documentation only. Runtime JavaScript, input behavior, gameplay, rendering, audio, storage, imports, workflow and deployment were not changed. No browser input, artifact or Pages fixture was executed.