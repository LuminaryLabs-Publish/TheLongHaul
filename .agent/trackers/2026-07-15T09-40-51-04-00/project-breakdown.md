# Project breakdown: browser audio lifecycle suspension and retirement

**Timestamp:** `2026-07-15T09-40-51-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `1724e6ca5ec2f18303431a3d8c40c017903759e3`  
**Status:** `browser-audio-lifecycle-suspension-retirement-authority-audited`

## Summary

TheLongHaul is a static Nexus Engine freight game using ten installed engine kits, two Core World providers, a deterministic five-branch course generator, Three.js, Canvas2D, DOM UI, WebAudio, localStorage and Pages deployment.

This run isolates browser-audio lifecycle ownership. The audio adapter creates a persistent oscillator and looping wind buffer after user unlock, while route, pause, blur and page lifecycle remain owned by the host. Loop silence depends mainly on a later RAF-driven `audio.update()` call. There is no visibility/pagehide settlement, context generation, source-retirement receipt or audible/silent frame acknowledgement.

## Plan ledger

**Goal:** bind audio unlock, route state, visibility, preference state, loop ownership, cue admission and teardown into one lifecycle authority without changing gameplay or presentation ownership.

- [x] Enumerate all 11 accessible `LuminaryLabs-Publish` repositories.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible central ledgers and ten root `.agent` states.
- [x] Compare all eligible current heads with their recorded repo-local documentation heads.
- [x] Confirm no new, missing, undocumented, root-agent-missing or runtime-ahead eligible repository.
- [x] Select only `LuminaryLabs-Publish/TheLongHaul` by the oldest synchronized timestamp.
- [x] Trace audio creation, loop ownership, cue creation, preference updates, pause, blur, route return and RAF updates.
- [x] Identify the complete interaction loop, domains, kits and offered services.
- [x] Preserve all 19 implemented kit/provider/adapter/deployment surfaces.
- [x] Define one browser-audio lifecycle authority with 18 planned surfaces.
- [x] Add the timestamped tracker and audit family.
- [x] Refresh the required root `.agent` documents and registry.
- [ ] Implement and execute browser, artifact and Pages audio-lifecycle fixtures.

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
prior central timestamp: 2026-07-15T04-40-29-04-00
next oldest: LuminaryLabs-Publish/MyCozyIsland at 2026-07-15T05-00-28-04-00
```

## Complete interaction loop

```txt
Start or first cue-capable user gesture
  -> audio.ensure()
  -> create AudioContext and master gain
  -> create and start one persistent engine oscillator
  -> create and start one looping wind BufferSource

Driving RAF
  -> derive speed and throttle
  -> audio.update(speed, throttle, true)
  -> schedule engine and wind gain/frequency targets
  -> execute semantic event cues through temporary oscillators

Pause or non-driving scene
  -> scene/simulation state changes
  -> a later RAF calls audio.update(0, 0, false)
  -> persistent loops remain allocated and running at zero gain

Window blur
  -> clear held keys
  -> request pause when driving
  -> no direct AudioContext suspend or immediate loop-settlement result

Visibility loss, pagehide or document retirement
  -> no owned lifecycle command
  -> no source stop/disconnect/close receipt
  -> no late-cue rejection or context-generation retirement
```

## Domains in use

```txt
browser document lifecycle, focus/blur, RAF and wall clock
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
procedural course generation, validation and streamed world providers
truck, wildlife, dust, exploration, depot discovery and scoring
pause, retry, settings, motion and best-score persistence
Three.js WebGL, Canvas2D map and DOM UI/HUD
WebAudio capability, user-gesture unlock, context, buses, persistent loops and transient cues
Pages deployment, repo-local audit state and central ledger governance
```

## Complete kit and service inventory

### Engine-installed kits: 10

```txt
core-scene-kit: scene registry, current scene, transition requests, exit validation, snapshots
core-world-domain: world registry/removal, partition, focus, active cells, provider ordering, validation
long-haul-core-input-kit: action manifest, bindings, contexts, driving intent, reset
long-haul-delivery-domain-kit: seed, generation progress, depots, checks, retry, result, snapshot, reset
long-haul-core-simulation-kit: reset, start, pause, resume, timer, distance, penalties, recovery, failure, completion
vehicle-dynamics-kit: truck state, input, kinematics, boost, bounds, impacts, reset
long-haul-route: route markers, corridors, nearest marker, state, reset
long-haul-condition: fuel, truck, cargo, bounded adjustments, state, reset
long-haul-wildlife: hazard state, motion, bounds, collisions, events, reset
long-haul-telemetry: truck, run, condition and delivery histories, reset
```

### World effect providers: 2

```txt
long-haul-terrain-provider: prepare, update, release, descriptors, active-cell snapshots, reset
long-haul-course-provider: prepare, update, release, roads, depots, signs, vegetation, obstacles, descriptors, snapshots, reset
```

### Browser/product adapters: 6

```txt
procedural-course-generator: seeded RNG, five-branch graph, fork, depots, par, validation, generation plan
three-webgl-presentation-adapter: renderer, camera, atmosphere, streamed meshes, truck, wildlife, dust, resize, RAF
dom-scene-hud-adapter: title, help, settings, generation, HUD, pause, results, loss, toast, failure
canvas-map-adapter: explored roads, depots, rejected yards, truck and DPR-aware resize
web-audio-adapter: AudioContext unlock, master bus, engine loop, wind loop, click/wrong/impact/delivery cues
browser-storage-adapter: settings document, motion preference and best-score document
```

### Deployment adapter: 1

```txt
github-pages-workflow: main trigger, Pages configuration, root artifact upload and deployment
```

```txt
total source-backed surfaces: 19
planned audio lifecycle surfaces: 18
render surfaces: 3
executable validation commands: 0
```

## Source-backed finding

```txt
persistent engine OscillatorNode: created and started once
persistent wind AudioBufferSourceNode: created and started once
loop gain settlement owner: RAF-driven audio.update
AudioContext resume call: opportunistic inside audio.ensure
AudioContext suspend policy: absent
visibilitychange owner: absent
pagehide/pageshow owner: absent
loop stop/disconnect receipt: absent
AudioContext close receipt: absent
context/source generation: absent
late cue rejection: absent
FirstSilentAudioAck: absent
FirstResumedAudibleFrameAck: absent
```

A blur event requests gameplay pause but does not directly settle the audio graph. Browser backgrounding may throttle or suspend RAF before the next `audio.update(0,0,false)` call. The source therefore permits the last admitted engine/wind gains to remain active until another frame or document destruction. This is an ownership and evidence gap, not a reproduced audible defect.

## Required authority

```txt
the-long-haul-browser-audio-lifecycle-suspension-retirement-authority-domain
```

```txt
AudioLifecycleCommand
  -> bind document, route, run, visibility, preference and audio-policy revisions
  -> allocate or adopt one AudioContextGeneration after accepted user unlock
  -> own persistent engine and wind source generations
  -> classify Active, Silent, Suspended, Retired or Rejected
  -> settle loop gains immediately for pause, blur and route exit
  -> suspend for hidden documents under policy
  -> resume only from an accepted visible/user-enabled state
  -> reject cues from stale, retired or muted generations
  -> stop, disconnect and close owned resources exactly once
  -> publish AudioLifecycleResult and source-retirement receipts
  -> publish FirstSilentAudioAck and FirstResumedAudibleFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, audio behavior, gameplay, rendering, storage, imports, workflows and deployment were not modified or executed.