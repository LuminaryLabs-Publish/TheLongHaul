# START HERE: The Long Haul pause suspension authority

**Last updated:** `2026-07-14T19-39-36-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `9e76011ec6ab4acc665f99c08067e3a758833865`  
**Status:** `pause-scheduler-input-world-suspension-authority-audited`

## Summary

`TheLongHaul` is a complete static Nexus Engine browser freight game with ten engine kits, two streamed world providers, Three.js, Canvas2D, DOM UI, WebAudio, localStorage and Pages deployment.

The current audit isolates pause ownership. `pauseGame()` pauses only the Core Simulation run, zeroes vehicle velocity and changes scene. The perpetual RAF still calls `engine.tick(dt)` for every kit, continues wildlife, dust, truck, camera and render updates, and preserves held browser keys. The source therefore has no authoritative proof that the whole gameplay world is suspended or that pre-pause held input cannot immediately affect the resumed run.

## Plan ledger

**Goal:** make pause and resume explicit generation-bound transactions that suspend every gameplay-mutating domain, settle held input, preserve an intentional presentation policy and prove the first paused and resumed frames.

- [x] Compare all 11 accessible Publish repositories and ten eligible central ledgers.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm every eligible repository is tracked and has root `.agent` state.
- [x] Select only `TheLongHaul` using the oldest synchronized central update timestamp.
- [x] Inspect pause, resume, keyboard state, RAF, engine ticking, vehicle, hazards, telemetry and presentation.
- [x] Preserve the complete 19-surface source-backed inventory.
- [x] Add a timestamped tracker and pause-specific audit family.
- [ ] Add one versioned pause policy and scheduler gate.
- [ ] Clear or journal held input at pause and require fresh post-resume intent.
- [ ] Add paused-domain, stale-input and visible-frame fixtures.

## Interaction loop

```txt
title
  -> generate seeded five-branch course
  -> choose one valid destination among five depots
  -> stream terrain, roads, hazards and truck
  -> drive timed freight run
  -> pause with Escape
  -> Core Simulation changes to paused
  -> vehicle velocity is zeroed and pause UI appears
  -> global RAF and engine tick continue
  -> resume with Escape or button
  -> held browser keys can still be present
  -> continue delivery, failure, results and retry loop
```

## Domains

```txt
browser keyboard, blur, resize and RAF lifecycle
Nexus Engine world, scheduler, clock, events and resources
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
pause policy, scheduler admission and stale-input settlement
Three.js WebGL presentation
DOM scene and HUD projection
Canvas2D map projection
WebAudio
localStorage
GitHub Pages deployment
audit governance
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
```

## Required authority

```txt
the-long-haul-pause-scheduler-input-world-suspension-authority-domain
```

It must publish one `PauseRevision`, gate all gameplay-mutating systems and commands, settle held input, define which visual systems may continue, reject stale pre-pause work, and acknowledge matching paused and resumed frames.

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-14T19-39-36-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-14T19-39-36-04-00-pause-scheduler-world-suspension-dsk-map.md`
5. `pause-audit/2026-07-14T19-39-36-04-00-scheduler-hazard-input-suspension-contract.md`
6. `render-audit/2026-07-14T19-39-36-04-00-paused-frame-world-motion-gap.md`
7. `gameplay-audit/2026-07-14T19-39-36-04-00-pause-clock-world-continues-loop.md`
8. `interaction-audit/2026-07-14T19-39-36-04-00-pause-resume-command-admission-map.md`
9. `deploy-audit/2026-07-14T19-39-36-04-00-pause-suspension-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-14T19-39-36-04-00-oldest-selection-pause-suspension-reconciliation.md`
11. `next-steps.md`
12. `validation.md`
