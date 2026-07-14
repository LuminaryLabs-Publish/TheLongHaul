# Current audit: course-generation admission and rollback

**Timestamp:** `2026-07-14T09-03-47-04-00`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit documentation head:** `263db0d039cdf38b8c892c04c7ba21ced5f95812`  
**Status:** `course-generation-admission-rollback-audited`

## Summary

The repository has advanced from an empty product skeleton to a complete single-file Nexus Engine browser game with procedural world generation, driving, depot discovery, risk, scoring, retry, WebGL rendering, map projection, audio, persistence, and Pages deployment.

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
Pages workflow: present
package manifest: absent
test suite: absent
build command: absent
```

## Complete interaction loop

```txt
boot -> title
  -> start seeded generation
  -> build trunk and five branches
  -> place five depots and choose one destination
  -> prepare terrain, streamed content, hazards, and truck
  -> validate route and world
  -> enter timed driving
  -> explore roads and candidate depots
  -> wrong depot adds 20 seconds
  -> correct depot settles score
  -> failure on time, cargo, truck, fuel, or unrecoverable stuck state
  -> retry same seed, generate new seed, or return to title
```

## Domains in use

```txt
browser and import-map lifecycle
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
WebGL presentation
DOM UI and HUD
Canvas2D map
WebAudio
localStorage
GitHub Pages deployment
audit governance
```

## Kits and services

```txt
10 engine kits
  scene routing
  world lifecycle and validation
  input intent
  delivery seed/progress/depot/result/retry
  run timer/distance/penalties/recovery/failure
  heavy-truck dynamics
  route queries
  fuel/truck/cargo pressure
  wildlife hazards and collisions
  telemetry history

2 world providers
  terrain cell lifecycle
  roads/depots/signs/vegetation/obstacle cell lifecycle

6 browser/product adapters
  procedural course generation
  Three.js presentation
  DOM UI and HUD
  Canvas2D map
  WebAudio
  localStorage
```

## Main finding

The generation plan is deterministic but not transactional. `startGeneration()` clears the predecessor and resets live participants immediately. Later generation units mutate the route field, delivery state, Core World registry, active cells, hazards, truck, Three.js scene, and DOM visibility. The final route and world checks occur after the candidate has already become live and partially visible.

A late failure stores an exception and shows a reload-only overlay. There is no complete rollback, predecessor restoration, candidate disposal receipt, recoverable retry result, or first admitted-frame acknowledgement.

## Required authority

```txt
the-long-haul-course-generation-admission-rollback-authority-domain
```

```txt
CourseGenerationCommand
  -> bind attempt, seed, provider, and predecessor revisions
  -> prepare detached route, destination, terrain, provider, hazard, truck, and render candidates
  -> collect generation-unit receipts
  -> validate topology, world, disposal, and probe frame
  -> atomically adopt or fully roll back
  -> publish CourseGenerationResult
  -> publish FirstAdmittedCourseFrameAck
```

## Audit boundary

This run changes documentation only. It does not alter runtime source, gameplay, rendering, settings, storage, imports, workflow, or deployment behavior.
