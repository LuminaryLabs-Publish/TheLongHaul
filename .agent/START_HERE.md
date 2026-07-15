# START HERE: The Long Haul generation work scheduling

**Last updated:** `2026-07-15T04-40-29-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `fdfb89f3c6339f408d5861899d4ec201bf4e8c75`  
**Status:** `generation-work-budget-readiness-authority-audited`

## Summary

TheLongHaul is a static Nexus Engine freight game with ten engine kits, two streamed-world providers, Three.js, Canvas2D, DOM UI, WebAudio, localStorage and Pages deployment.

The current audit isolates generation scheduling. The 31-unit plan is advanced by exactly one unit per browser animation callback. Progress counts completed IDs even though unit costs vary from bookkeeping to terrain creation, Core World registration and validation. No frame budget, weighted progress, cancellation/visibility result, partial-attempt retirement or first playable-frame acknowledgement exists.

## Plan ledger

**Goal:** make generation deterministic in content and bounded in host execution, then adopt one validated course and prove its first playable frame.

- [x] Compare all 11 accessible Publish repositories with the central ledger.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible ledgers and synchronized repo-local documentation heads.
- [x] Select only `TheLongHaul` by the oldest synchronized timestamp.
- [x] Trace generation request, queue, progress, readiness, failure, retry and rendering.
- [x] Preserve all 19 source-backed kit, provider, adapter and deployment surfaces.
- [x] Add the timestamped generation-scheduler audit family.
- [ ] Implement the authority and execute browser, artifact and Pages fixtures.

## Interaction loop

```txt
Start or Retry
  -> clear prior world
  -> reset runtime kits
  -> enter generating
  -> prepare 31 units

one RAF callback
  -> execute one unit
  -> record one completed ID
  -> derive unit-count progress
  -> tick engine and render partial state

all units accepted
  -> validate route and Core World
  -> start Simulation once
  -> transition to driving
  -> render first playable frame
```

## Domains

```txt
browser lifecycle, DOM input, resize, focus/blur, RAF and wall clock
Core Scene, Core World, Core Input and Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
procedural route/course generation, generation queue, validation and readiness
streamed terrain and course content
truck, wildlife, dust, exploration and depot discovery
pause, retry, terminal result, settings, motion and persistence
Three.js, Canvas2D, DOM UI/HUD, WebAudio and Pages
repo-local and central audit governance
```

## Kit and surface census

```txt
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
render surfaces: 3
executable validation commands: 0
planned generation authority surfaces: 18
```

## Required authority

```txt
the-long-haul-generation-work-budget-readiness-authority-domain
```

It must own attempt identity, a typed work queue, frame-budget admission, weighted progress, lifecycle cancellation, partial-resource retirement, atomic ready adoption and `FirstPlayableGenerationFrameAck` while preserving existing content and provider ownership.

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-15T04-40-29-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-15T04-40-29-04-00-generation-work-scheduler-dsk-map.md`
5. `generation-audit/2026-07-15T04-40-29-04-00-work-budget-readiness-contract.md`
6. `render-audit/2026-07-15T04-40-29-04-00-generation-progress-visible-frame-cadence-gap.md`
7. `gameplay-audit/2026-07-15T04-40-29-04-00-raf-coupled-course-generation-loop.md`
8. `interaction-audit/2026-07-15T04-40-29-04-00-generation-frame-command-result-map.md`
9. `deploy-audit/2026-07-15T04-40-29-04-00-generation-cadence-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-15T04-40-29-04-00-oldest-selection-generation-scheduler-reconciliation.md`
11. `next-steps.md`
12. `validation.md`

## Retained audits

Motion preference, pause suspension, terminal settlement and course-generation admission/rollback remain valid and unchanged.