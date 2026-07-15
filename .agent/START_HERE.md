# START HERE: The Long Haul browser audio lifecycle

**Last updated:** `2026-07-15T09-40-51-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `1724e6ca5ec2f18303431a3d8c40c017903759e3`  
**Status:** `browser-audio-lifecycle-suspension-retirement-authority-audited`

## Summary

TheLongHaul is a static Nexus Engine freight game with ten engine kits, two streamed-world providers, Three.js, Canvas2D, DOM UI, WebAudio, localStorage and Pages deployment.

The current audit isolates browser audio lifecycle. The WebAudio adapter starts persistent engine and wind sources, but pause, blur, hidden-document state and document retirement do not share one explicit context/source generation, suspension policy or retirement result. Loop silence normally depends on a later RAF-driven gain update.

## Plan ledger

**Goal:** make audible state follow accepted route, run, visibility and preference revisions, then retire browser audio resources exactly once.

- [x] Compare all 11 accessible Publish repositories with the central ledger.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten synchronized eligible ledgers and root `.agent` states.
- [x] Select only `TheLongHaul` by the oldest synchronized timestamp.
- [x] Trace unlock, persistent loops, transient cues, settings, pause, blur, route return and RAF updates.
- [x] Preserve all 19 source-backed surfaces and their services.
- [x] Add the timestamped browser-audio lifecycle audit family.
- [ ] Implement the authority and execute browser, artifact and Pages fixtures.

## Interaction loop

```txt
accepted user gesture
  -> create AudioContext, master gain, engine oscillator and looping wind source

driving RAF
  -> update engine/wind gains and frequencies
  -> admit transient UI, impact, wrong-yard and delivery tones

pause, blur or non-driving route
  -> route/run state changes
  -> silence usually waits for a later RAF update

hidden document or page retirement
  -> no owned suspend/retire command
  -> no stop/disconnect/close receipt
```

## Domains

```txt
browser lifecycle, focus/blur, visibility, RAF and wall clock
Core Scene, Core World, Core Input and Core Simulation
Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
course generation, streaming, exploration, scoring and persistence
Three.js, Canvas2D, DOM UI/HUD and WebAudio
Pages deployment and audit governance
```

## Census

```txt
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
planned browser-audio lifecycle surfaces: 18
```

## Required authority

```txt
the-long-haul-browser-audio-lifecycle-suspension-retirement-authority-domain
```

It must own audio context/source generations, accepted unlock, route and visibility policy, immediate silence settlement, stale-cue rejection, suspend/resume, exactly-once source disposal, context retirement, `FirstSilentAudioAck` and `FirstResumedAudibleFrameAck`.

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-15T09-40-51-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-15T09-40-51-04-00-browser-audio-lifecycle-dsk-map.md`
5. `audio-audit/2026-07-15T09-40-51-04-00-context-loop-suspension-retirement-contract.md`
6. `render-audit/2026-07-15T09-40-51-04-00-audio-visible-state-lifecycle-gap.md`
7. `gameplay-audit/2026-07-15T09-40-51-04-00-driving-audio-route-lifecycle-loop.md`
8. `interaction-audit/2026-07-15T09-40-51-04-00-audio-lifecycle-command-result-map.md`
9. `deploy-audit/2026-07-15T09-40-51-04-00-browser-audio-lifecycle-fixture-gate.md`
10. `central-sync-audit/2026-07-15T09-40-51-04-00-oldest-selection-audio-lifecycle-reconciliation.md`
11. `next-steps.md`
12. `validation.md`

## Retained audits

Generation scheduling, motion preference, pause suspension, terminal settlement and course-generation admission/rollback remain valid and unchanged.