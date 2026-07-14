# START HERE: The Long Haul course-generation admission and rollback

**Last updated:** `2026-07-14T09-03-47-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit documentation head:** `263db0d039cdf38b8c892c04c7ba21ced5f95812`  
**Status:** `course-generation-admission-rollback-audited`

## Summary

`TheLongHaul` is now a complete static browser game. One `index.html` composes ten Nexus Engine kits, two streamed world providers, Three.js WebGL presentation, a Canvas2D exploration map, DOM menus and HUD, WebAudio, localStorage, and a GitHub Pages workflow.

The current priority is procedural-course admission. The generation plan mutates live engine, world, DOM, and GPU participants before final validation. A late failure shows a reload overlay but does not roll back the partial candidate, preserve the predecessor generation, or publish a typed result.

## Plan ledger

**Goal:** make the first executable implementation accurately documented and require every generated course to be fully validated, atomically adopted, recoverable on failure, and proven through its first visible frame.

- [x] Compare all 11 accessible Publish repositories and ten eligible central ledgers.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Select only `TheLongHaul` because it changed from a recently added empty skeleton to its first complete executable implementation.
- [x] Inspect the pinned imports, engine composition, generation pipeline, gameplay, presentation, storage, and deployment workflow.
- [x] Identify the full interaction loop.
- [x] Identify all active domains.
- [x] Inventory 10 engine kits, two world providers, six browser/product adapters, and one deployment adapter.
- [x] Add the timestamped tracker and focused audit family.
- [ ] Implement detached generation candidates and atomic adoption.
- [ ] Add rollback, retry, fault-injection, and first-frame proof.
- [ ] Add source, browser, artifact, and Pages validation commands.

## Interaction loop

```txt
title
  -> generate a seeded five-branch course
  -> choose one valid destination among five plausible depots
  -> prepare streamed terrain, roads, hazards, and truck
  -> drive a six-minute freight run
  -> discover roads and depots
  -> reject wrong yards with a 20-second penalty
  -> protect fuel, truck, and cargo
  -> use at most one roadside recovery
  -> deliver to the valid yard or fail
  -> receive golf-style score
  -> retry the same seed, generate a new seed, or return to title
```

## Domains

```txt
browser lifecycle and provider resolution
Nexus Engine runtime and ticking
Core Scene
Core World and streamed effect providers
Core Input
Long Haul Delivery
Core Simulation
Vehicle Dynamics
Route Field
Resource Pressure
Hazard Field
Telemetry
procedural route and course generation
Three.js WebGL presentation
DOM scene and HUD projection
Canvas2D map projection
WebAudio
localStorage settings and best score
GitHub Pages deployment
audit governance
```

## Kit and surface census

```txt
engine-installed DSKs and kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
render surfaces: 3
executable validation commands: 0
```

## Required authority

```txt
the-long-haul-course-generation-admission-rollback-authority-domain
```

It must prepare route, destination, terrain, providers, hazards, truck, and presentation as one detached candidate; validate all participants; atomically adopt the accepted generation; preserve the predecessor until first-frame acknowledgement; and dispose failed candidates with a typed recoverable result.

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-14T09-03-47-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-14T09-03-47-04-00-course-generation-admission-dsk-map.md`
5. `course-generation-audit/2026-07-14T09-03-47-04-00-staged-generation-rollback-contract.md`
6. `render-audit/2026-07-14T09-03-47-04-00-partial-world-visible-before-admission-gap.md`
7. `gameplay-audit/2026-07-14T09-03-47-04-00-generation-failure-run-entry-loop.md`
8. `interaction-audit/2026-07-14T09-03-47-04-00-course-generation-command-result-map.md`
9. `deploy-audit/2026-07-14T09-03-47-04-00-single-file-runtime-proof-gate.md`
10. `central-sync-audit/2026-07-14T09-03-47-04-00-first-runtime-implementation-reconciliation.md`
11. `next-steps.md`
12. `validation.md`

## Next safe ledge

Extract course generation behind one command/result boundary without restructuring the rest of Nexus Engine. Keep the existing kit ownership, but stop clearing the accepted predecessor until the candidate route, world, hazards, truck, and offscreen frame all pass admission.
