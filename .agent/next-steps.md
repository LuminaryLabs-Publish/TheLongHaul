# Next steps

**Timestamp:** `2026-07-16T05-01-43-04-00`

## Plan ledger

**Goal:** implement one renderer/context generation authority that pauses stale presentation, reconstructs resources from accepted state and proves one recovered frame or an actionable fallback.

- [ ] Add `DocumentGeneration`, `RuntimeGeneration`, `RendererGeneration`, `ContextGeneration`, `ResourceManifestRevision`, `ActiveCellRevision` and `FrameRevision`.
- [ ] Register `webglcontextlost` and `webglcontextrestored` through one owned adapter.
- [ ] Deduplicate repeated browser events for the same context generation.
- [ ] Publish `RenderLossResult` before recovery work begins.
- [ ] Stop RAF render submission for the retired renderer generation.
- [ ] Guard resize, stream and provider callbacks with the target renderer generation.
- [ ] Choose and document the simulation policy during visual loss.
- [ ] Neutralize held driving input before any invisible interval.
- [ ] Add a CPU-side `GpuResourceManifest` with dependency ordering.
- [ ] Describe all shared geometry and materials as reconstructable resources.
- [ ] Describe sky, lighting, fog and shadow configuration as reconstructable resources.
- [ ] Rebuild active terrain/content cells from accepted Core World state.
- [ ] Rebuild truck and wildlife rigs from accepted engine state.
- [ ] Declare dust particles as reconstructed or intentionally reset transient state.
- [ ] Construct and configure one replacement `THREE.WebGLRenderer`.
- [ ] Reapply pixel ratio, size, color space, tone mapping and shadow policy.
- [ ] Reject callbacks and results from retired renderer generations.
- [ ] Enforce a bounded recovery deadline and retry budget.
- [ ] Publish `RenderRecoveryResult` or `RenderFallbackResult`.
- [ ] Present and publish `FirstRecoveredFrameAck` before resuming normal interaction.
- [ ] Add forced `WEBGL_lose_context` fixtures.
- [ ] Add duplicate-loss and stale-callback fixtures.
- [ ] Add active-cell and persistent-rig rehydration fixtures.
- [ ] Add failed-recovery fallback fixtures.
- [ ] Compare source, root artifact and deployed Pages evidence.

## Ordered implementation

### 1. Generations and browser admission

Create stable renderer/context identities and route browser loss/restoration evidence through typed commands and terminal results.

### 2. Submission and gameplay policy

Suspend old-generation rendering, clear or neutralize held input and explicitly pause or continue simulation. For this timed driving game, pause-on-loss is the safer default.

### 3. Resource manifest

Move GPU construction descriptors into a manifest independent of live Three.js objects. Record dependencies, source revisions, reconstruct, verify and retire behavior.

### 4. Ordered rehydration

Rebuild renderer, shared resources, atmosphere, active cells and persistent rigs in dependency order. Reconstruct active world cells from Core World state rather than stale visual caches.

### 5. Result and frame proof

Publish recovery or fallback, then require one visible frame from the accepted renderer generation before restoring normal interaction.

### 6. Proof

Run loss, restoration, duplicate event, stale generation, active-cell, fallback and source/artifact/Pages parity fixtures.

## Retained work

Accessibility projection, input-action convergence, host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback remain open in their timestamped audit families.