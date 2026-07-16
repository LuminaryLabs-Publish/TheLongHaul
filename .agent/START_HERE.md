# START HERE: The Long Haul WebGL context and resource recovery

**Last updated:** `2026-07-16T05-01-43-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `48ba7e8938c7edb4a62a0748e60b69ba53820c45`  
**Status:** `webgl-context-resource-recovery-authority-audited`

## Summary

TheLongHaul is a static Nexus Engine freight game with ten engine kits, two Core World providers, seven browser/product adapters, Three.js WebGL, Canvas2D, DOM UI, WebAudio, browser storage and Pages deployment.

The active audit isolates renderer loss. The product constructs one renderer and a large shared/streamed GPU-resource graph, submits through a recursive RAF and supports ordinary streamed-cell disposal. It has no product-owned WebGL context-loss/restoration admission, renderer generation, ordered resource reconstruction, stale-generation rejection, fallback or first recovered frame acknowledgement.

## Plan ledger

**Goal:** make renderer loss settle as one bounded recovery or fallback transaction while preserving accepted gameplay and world state.

- [x] Compare all 11 accessible Publish repositories with central tracking.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible ledgers and synchronized root `.agent` state.
- [x] Select only TheLongHaul by the oldest synchronized timestamp.
- [x] Trace renderer construction, resource ownership, streaming, release, resize, listeners and RAF.
- [x] Preserve the complete 20-surface implementation inventory.
- [x] Define 20 renderer-recovery authority surfaces.
- [x] Add the timestamped audit family.
- [x] Keep runtime and deployment unchanged.
- [ ] Implement and execute forced-loss, recovery, fallback, artifact and Pages fixtures.

## Interaction loop

```txt
accepted route/run/world state
  -> update simulation and world streaming
  -> update Three.js projection
  -> draw Canvas2D map and DOM HUD
  -> renderer.render(scene, camera)
  -> next RAF

WebGL context loss
  -> no typed loss result
  -> no old-generation submission suspension
  -> no simulation/input policy
  -> no resource-manifest reconstruction
  -> no fallback
  -> no FirstRecoveredFrameAck
```

## Main finding

```txt
single renderer generation owner: absent
webglcontextlost observer: absent
webglcontextrestored observer: absent
presentation suspension result: absent
GPU resource manifest: absent
ordered shared/streamed reconstruction: absent
stale renderer callback rejection: absent
recovery deadline and retry budget: absent
RenderLossResult: absent
RenderRecoveryResult: absent
RenderFallbackResult: absent
FirstRecoveredFrameAck: absent
```

This is a source-backed lifecycle and evidence gap. No production context-loss incident was reproduced.

## Required authority

`the-long-haul-webgl-context-resource-recovery-authority-domain`

```txt
RenderRecoveryAdmissionCommand
  -> bind document route runtime renderer context
     resource manifest world cell and frame generations
  -> observe and deduplicate context loss
  -> suspend stale submissions
  -> apply simulation and input policy
  -> rebuild renderer and resources in dependency order
  -> reject retired-generation callbacks
  -> publish RenderLossResult
  -> publish RenderRecoveryResult or RenderFallbackResult
  -> publish FirstRecoveredFrameAck
```

## Census

```txt
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 7
deployment adapters: 1
total source-backed surfaces: 20
render surfaces: 3
planned renderer-recovery surfaces: 20
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-16T05-01-43-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-16T05-01-43-04-00-webgl-context-resource-recovery-dsk-map.md`
5. `renderer-recovery-audit/2026-07-16T05-01-43-04-00-webgl-resource-rehydration-contract.md`
6. `gameplay-audit/2026-07-16T05-01-43-04-00-render-loss-noninteractive-haul-loop.md`
7. `interaction-audit/2026-07-16T05-01-43-04-00-render-recovery-command-result-map.md`
8. `render-audit/2026-07-16T05-01-43-04-00-context-loss-first-recovered-frame-gap.md`
9. `deploy-audit/2026-07-16T05-01-43-04-00-context-loss-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-16T05-01-43-04-00-oldest-selection-renderer-recovery-reconciliation.md`
11. `turn-ledger/2026-07-16T05-01-43-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

Accessibility projection, input-action convergence, host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback remain valid and unchanged.

## Next safe ledge

Implement renderer-generation identity, context-loss admission and a resource manifest before claiming context restoration or recovered-frame readiness.