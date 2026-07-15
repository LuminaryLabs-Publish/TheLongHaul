# Current audit: browser audio lifecycle suspension and retirement

**Timestamp:** `2026-07-15T09-40-51-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `1724e6ca5ec2f18303431a3d8c40c017903759e3`  
**Status:** `browser-audio-lifecycle-suspension-retirement-authority-audited`

## Summary

The repository contains a complete single-file Nexus Engine browser freight game with deterministic generation, driving, depot discovery, condition pressure, scoring, retry, WebGL, Canvas2D, DOM UI, WebAudio, persistence and Pages deployment.

This audit isolates the long-lived browser audio graph and its relationship to route, run, preference and document lifecycle.

## Source-backed inventory

```txt
runtime entry point: index.html
Nexus Engine revision: c5548de504072bf09eb68986b98aca0292903803
Three.js version: 0.165.0
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
render surfaces: 3
package manifest: absent
test suite: absent
build command: absent
```

## Interaction loop

```txt
user starts or triggers a cue
  -> audio.ensure()
  -> create AudioContext and master gain
  -> create/start persistent engine oscillator
  -> create/start looping wind source

driving RAF
  -> calculate speed/throttle
  -> schedule engine/wind gains and engine frequency
  -> create transient cue oscillators for UI and gameplay outcomes

pause or non-driving route
  -> accepted scene/run state changes
  -> later RAF normally schedules zero loop gains

window blur
  -> clear keys and request pause
  -> no direct context suspend or immediate audio result

visibility loss/pagehide/retirement
  -> no owned lifecycle command or source/context retirement receipt
```

## Domains in use

```txt
browser document lifecycle, focus/blur, visibility, RAF and wall clock
provider resolution
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
seeded course generation, validation and streamed terrain/course providers
truck, wildlife, dust, exploration, depot discovery, scoring and retry
settings, motion, pause and browser persistence
Three.js WebGL, Canvas2D map and DOM UI/HUD
WebAudio capability, unlock, context, master bus, loops and transient cues
GitHub Pages deployment and audit governance
```

## Kits and services

```txt
Core Scene: registry, current scene, transitions, exit validation, snapshots
Core World: registry, partition, focus, cells, provider ordering, validation
Core Input: actions, bindings, contexts, driving intent, reset
Long Haul Delivery: seed, progress, depots, checks, retry, result, snapshot, reset
Core Simulation: reset, start, pause, resume, timer, penalties, recovery, failure, completion
Vehicle Dynamics: truck state, input, kinematics, boost, bounds, impacts, reset
Route Field: markers, corridors, nearest marker, state, reset
Resource Pressure: fuel, truck, cargo, bounded adjustments, state, reset
Hazard Field: state, motion, bounds, collisions, events, reset
Telemetry: truck, run, condition and delivery histories
terrain provider: prepare, update, release, descriptors, snapshots, reset
course provider: roads, depots, signs, vegetation, obstacles, lifecycle and snapshots
procedural generator: seed/RNG, graph, fork, depots, par, validation and generation plan
Three.js adapter: renderer, scene, camera, atmosphere, rigs, meshes, resize and RAF
DOM adapter: title, help, settings, generation, HUD, pause, results, loss, toast and failure
Canvas adapter: explored routes, depots, rejections, truck and DPR-aware resize
WebAudio adapter: context unlock, master bus, engine loop, wind loop and event cues
storage adapter: settings, motion and best score
Pages adapter: main-triggered static deployment
```

## Main finding

`audio.ensure()` creates and starts one persistent engine oscillator and one looping wind `AudioBufferSourceNode`. `audio.update()` changes their gains and frequency from RAF. The host clears held keys and requests pause on `blur`, but it does not directly settle the audio graph. There are no `visibilitychange`, `pagehide` or explicit runtime-retirement handlers for audio.

If a browser throttles or stops RAF during backgrounding before the next zero-gain update, the last admitted loop gains can remain active. Sources are never explicitly stopped or disconnected and the context is never closed. No context/source generation, stale-cue rejection, lifecycle result or audible/silent acknowledgement exists.

This is a source-level ownership and evidence gap. It is not a reproduced audible defect.

## Required authority

```txt
the-long-haul-browser-audio-lifecycle-suspension-retirement-authority-domain
```

```txt
AudioLifecycleCommand
  -> bind document, route, run, visibility, preference and policy revisions
  -> allocate or adopt one context generation after accepted unlock
  -> own engine and wind source generations
  -> settle silence immediately for pause, blur and route exit
  -> apply explicit hidden-document suspend/silent policy
  -> resume only from accepted visible and enabled state
  -> reject stale, muted or retired cues
  -> stop, disconnect and close resources exactly once
  -> publish lifecycle and retirement receipts
  -> acknowledge FirstSilentAudioAck and FirstResumedAudibleFrameAck
```

## Audit boundary

Documentation only. Runtime JavaScript, audio behavior, gameplay, rendering, storage, imports, workflows and deployment were not changed or executed.