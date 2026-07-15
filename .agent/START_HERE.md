# START HERE: The Long Haul host clock and fixed-step simulation

**Last updated:** `2026-07-15T14-40-11-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `e2796634445e63b5cd0ee7ea34f7ab50078755f2`  
**Status:** `host-clock-fixed-step-simulation-frame-authority-audited`

## Summary

TheLongHaul is a static Nexus Engine freight game with ten engine kits, two Core World providers, Three.js, Canvas2D, DOM UI, WebAudio, browser storage and Pages deployment.

The current audit isolates host-clock admission. The RAF loop derives one variable `dt`, caps it at `1/15`, executes one driving update and one `engine.tick(dt)`, then renders once. There is no fixed-step accumulator, retained residual time, bounded catch-up result, explicit dropped-time policy, render interpolation revision or first clock-bound visible-frame acknowledgement.

## Plan ledger

**Goal:** separate browser callback cadence from deterministic gameplay time while keeping catch-up work bounded and visible-frame ownership explicit.

- [x] Compare all 11 accessible Publish repositories with the central ledger.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten synchronized eligible ledgers and root `.agent` states.
- [x] Select only `TheLongHaul` by the oldest synchronized timestamp.
- [x] Trace callback time, driving preparation, Nexus Engine ticking and render submission.
- [x] Preserve all 19 source-backed surfaces and their services.
- [x] Add the timestamped host-clock audit family.
- [ ] Implement the authority and execute browser, artifact and Pages fixtures.

## Interaction loop

```txt
start or retry
  -> generate and validate a five-branch course
  -> start one run

RAF callback
  -> raw callback delta
  -> cap dt at 1 / 15
  -> process input driving interactions and collisions once
  -> engine.tick(dt) once
  -> update streamed world HUD audio truck camera wildlife dust and map
  -> render one Three.js frame

terminal
  -> valid depot settles result
  -> failure settles loss
  -> persist best score
  -> retry same seed, generate new seed or return to title
```

## Main finding

```txt
clock source: RAF timestamp
steps per callback: 1
maximum admitted step: 1 / 15 second
fixed step: absent
accumulator: absent
residual time: absent
substep budget: absent
overload/discard receipt: absent
visibility clock baseline: absent
render interpolation revision: absent
FirstClockBoundFrameAck: absent
```

At sustained callback rates below 15 FPS, gameplay time can advance slower than wall time. At other callback rates, vehicle, timer, hazard and presentation integration remain variable-step and cadence-dependent. This is a source-backed gap, not a reproduced timing measurement.

## Domains

```txt
browser lifecycle, RAF and monotonic wall clock
Core Scene, Core World, Core Input and Core Simulation
Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
course generation, streaming, exploration, scoring and persistence
Three.js, Canvas2D, DOM UI/HUD and WebAudio
host-frame scheduling, variable-delta admission and render submission
Pages deployment and audit governance
```

## Census

```txt
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
render surfaces: 3
planned host-clock authority surfaces: 19
```

## Required authority

```txt
the-long-haul-host-clock-fixed-step-simulation-frame-authority-domain
```

It must own monotonic timestamp admission, first/resume baselines, a fixed-step accumulator, bounded substeps, residual time, explicit overload and discarded-time receipts, simulation revisions, render interpolation, `HostFrameResult` and `FirstClockBoundFrameAck`.

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-15T14-40-11-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-15T14-40-11-04-00-host-clock-fixed-step-dsk-map.md`
5. `clock-audit/2026-07-15T14-40-11-04-00-fixed-step-accumulator-overload-contract.md`
6. `render-audit/2026-07-15T14-40-11-04-00-variable-delta-visible-frame-gap.md`
7. `gameplay-audit/2026-07-15T14-40-11-04-00-callback-cadence-gameplay-time-loop.md`
8. `interaction-audit/2026-07-15T14-40-11-04-00-host-frame-command-result-map.md`
9. `deploy-audit/2026-07-15T14-40-11-04-00-clock-cadence-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-15T14-40-11-04-00-oldest-selection-host-clock-reconciliation.md`
11. `next-steps.md`
12. `validation.md`

## Retained audits

Browser audio lifecycle, generation scheduling, motion preference, pause suspension, terminal settlement and course-generation admission/rollback remain valid and unchanged.
