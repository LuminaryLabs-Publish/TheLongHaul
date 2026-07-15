# START HERE: The Long Haul motion preference authority

**Last updated:** `2026-07-15T00-38-54-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `826395baa5b3aa82e48ab8037c277f3c5b2bc63c`  
**Status:** `motion-preference-camera-body-effect-admission-authority-audited`

## Summary

`TheLongHaul` is a static Nexus Engine browser freight game with ten engine kits, two streamed-world providers, Three.js, Canvas2D, DOM UI, WebAudio, localStorage, and Pages deployment.

The current audit isolates the persisted `Camera movement` setting. It gates rough-road truck shake and rough-road camera bob, but steering roll, throttle/brake pitch, cargo sway, speed-driven FOV, and camera interpolation remain active. The source has no versioned motion profile, adoption result, participant receipts, or first matching visible-frame acknowledgement.

## Plan ledger

**Goal:** make one durable motion preference authoritatively classify every camera and truck-body effect and prove the first frame that adopts it.

- [x] Compare all 11 accessible Publish repositories with the central ledger.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible central ledgers and ten root `.agent` states.
- [x] Confirm zero new, missing, undocumented, root-agent-missing, or runtime-ahead eligible repositories.
- [x] Select only `TheLongHaul` using the oldest synchronized timestamp.
- [x] Trace settings, persistence, truck motion, camera motion, rendering, and reload adoption.
- [x] Preserve all 19 source-backed kit, provider, adapter, and deployment surfaces.
- [x] Add the timestamped motion-preference audit family.
- [ ] Implement the authority and execute browser, artifact, and Pages fixtures.

## Interaction loop

```txt
startup
  -> restore settings document
  -> project Camera movement switch

title or paused
  -> open Settings
  -> toggle Camera movement
  -> persist settings.motion
  -> return to predecessor scene

driving
  -> simulation and vehicle truth advance
  -> rough-road truck shake obeys the setting
  -> rough-road camera bob obeys the setting
  -> steering roll, input pitch, cargo sway, dynamic FOV, and interpolation continue
  -> submit WebGL frame
  -> no preference result or matching-frame acknowledgement exists
```

## Domains

```txt
browser lifecycle, DOM input, localStorage, resize, RAF
Core Scene, Core World, Core Input, Core Simulation
Long Haul Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field, Telemetry
procedural course generation and streamed world effects
settings persistence and motion-preference policy
truck, cargo, camera, Three.js, DOM, Canvas2D, audio, score storage, Pages
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
planned motion authority surfaces: 18
```

## Required authority

```txt
the-long-haul-motion-preference-camera-body-effect-admission-authority-domain
```

It must own a versioned profile, classify every effect, atomically adopt participant state, persist the accepted document, publish typed results and receipts, and acknowledge the first matching WebGL frame.

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-15T00-38-54-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-15T00-38-54-04-00-motion-preference-presentation-dsk-map.md`
5. `motion-audit/2026-07-15T00-38-54-04-00-camera-body-effect-policy-contract.md`
6. `render-audit/2026-07-15T00-38-54-04-00-motion-setting-visible-effect-gap.md`
7. `gameplay-audit/2026-07-15T00-38-54-04-00-settings-to-driving-motion-loop.md`
8. `interaction-audit/2026-07-15T00-38-54-04-00-motion-preference-command-result-map.md`
9. `deploy-audit/2026-07-15T00-38-54-04-00-motion-preference-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-15T00-38-54-04-00-oldest-selection-motion-preference-reconciliation.md`
11. `next-steps.md`
12. `validation.md`

## Retained audits

The pause-suspension, terminal-settlement, and course-generation audit families remain valid and unchanged.