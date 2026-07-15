# START HERE: The Long Haul input action contract convergence

**Last updated:** `2026-07-15T19-38-38-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `cc4ec1d7ad16e6aa29e7719203d5411217142f25`  
**Status:** `input-action-contract-context-convergence-authority-audited`

## Summary

TheLongHaul is a static Nexus Engine freight game with ten engine kits, two Core World providers, seven browser/product adapters, Three.js, Canvas2D, DOM UI, WebAudio, browser storage and Pages deployment.

The current audit isolates input-action ownership. Core Input declares actions, keyboard bindings and `driving`/`menu` contexts, but the browser host keeps a separate mutable key-state owner and directly executes camera, map, pause, retry and interaction commands. The declared map says `KeyR` means recovery; the executable path uses `KeyR` for retry and reaches recovery through contextual `KeyE`.

## Plan ledger

**Goal:** make every browser event settle through one versioned action map and context authority before gameplay or presentation consumes it.

- [x] Compare all 11 accessible Publish repositories with the central ledger.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten synchronized eligible ledgers and root `.agent` states.
- [x] Select only `TheLongHaul` by the oldest synchronized timestamp.
- [x] Trace Core Input descriptors, browser event capture, held keys, one-shot commands and effect projection.
- [x] Preserve and refine the complete source-backed inventory to 20 surfaces.
- [x] Add the timestamped input-action audit family.
- [ ] Implement the authority and execute browser, artifact and Pages fixtures.

## Interaction loop

```txt
browser key event
  -> mutate host-local keys or execute direct route/presentation command
  -> RAF derives held driving intent
  -> copy intent into Core Input
  -> submit vehicle and simulation work
  -> render DOM, Canvas2D, WebGL and audio effects
```

```txt
KeyR declared: recovery
KeyR executed: retry same seed
KeyE executed: interact, depot check or contextual recovery
```

## Main finding

```txt
Core Input action manifest: present
Core Input bindings: present
Core Input contexts: present
browser event admission into Core Input: absent
runtime context enforcement: absent
one-shot action results: absent
declared/executable KeyR agreement: absent
held-action lifecycle generation: absent
FirstInputActionAck: absent
FirstInputEffectFrameAck: absent
```

The descriptor and executable browser path can diverge without a typed rejection or proof result. This is a source-backed contract gap, not a reproduced input failure.

## Domains

```txt
browser lifecycle, keyboard evidence and focus
Core Scene, Core World, Core Input and Core Simulation
Delivery, Vehicle Dynamics, Route Field, Resource Pressure, Hazard Field and Telemetry
browser event capture, action maps, contexts and held-action lifecycle
course generation, streaming, exploration, recovery, retry and scoring
Three.js, Canvas2D, DOM UI/HUD, WebAudio and storage
input-effect visible-frame convergence
Pages deployment and audit governance
```

## Census

```txt
engine-installed kits: 10
world effect providers: 2
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

It must own browser-event admission, one executable binding table, route-bound contexts, held-action generations, Core Input publication, typed action results, lifecycle cancellation, `FirstInputActionAck` and `FirstInputEffectFrameAck`.

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-15T19-38-38-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-15T19-38-38-04-00-input-action-contract-convergence-dsk-map.md`
5. `input-audit/2026-07-15T19-38-38-04-00-browser-core-input-context-contract.md`
6. `gameplay-audit/2026-07-15T19-38-38-04-00-retry-recovery-action-divergence-loop.md`
7. `interaction-audit/2026-07-15T19-38-38-04-00-input-action-command-result-map.md`
8. `render-audit/2026-07-15T19-38-38-04-00-input-effect-visible-frame-gap.md`
9. `deploy-audit/2026-07-15T19-38-38-04-00-input-context-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-15T19-38-38-04-00-oldest-selection-input-action-reconciliation.md`
11. `next-steps.md`
12. `validation.md`

## Retained audits

Host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, terminal settlement and course-generation admission/rollback remain valid and unchanged.