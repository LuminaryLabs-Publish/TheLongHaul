# Known gaps

**Timestamp:** `2026-07-16T05-01-43-04-00`

## Plan ledger

**Goal:** keep renderer/context ownership explicit until loss admission, gameplay policy, resource rehydration, fallback and recovered-frame evidence are implemented.

- [x] Trace the current renderer and GPU-resource lifecycle.
- [x] Separate ordinary streamed-cell disposal from whole-renderer recovery.
- [x] Record generation, event, policy, manifest, reconstruction and proof gaps.
- [ ] Implement and execute the missing authority.

## Renderer and context identity

- No `RendererGeneration` identifies the active Three.js renderer.
- No `ContextGeneration` identifies the WebGL context serving the visible frame.
- No `ResourceManifestRevision` identifies the GPU graph attached to that generation.
- No route/runtime/frame revision is bound to context-loss evidence.
- No explicit retirement result exists for a lost renderer generation.

## Browser loss and restoration admission

- No `webglcontextlost` listener exists.
- No `webglcontextrestored` listener exists.
- No owned path decides whether to call `preventDefault()` and attempt restoration.
- Duplicate loss or restoration callbacks have no deduplication identity.
- Restoration evidence from a retired document/runtime generation cannot be rejected.
- No typed `RenderLossResult` exists.

## Submission and gameplay policy

- Recursive RAF submission is not suspended by a renderer-loss result.
- Resize callbacks have no renderer-generation guard.
- World streaming and provider callbacks have no renderer-generation guard.
- Held keyboard actions are not explicitly neutralized for a visual-loss interval.
- Run timer, fuel, hazards, penalties and delivery state have no declared loss policy.
- WebAudio has no declared relationship to renderer loss.
- No `SimulationLossPolicyResult` or `InputLossPolicyResult` exists.

## GPU resource manifest

- Shared geometries and materials have no CPU-side reconstruction manifest.
- Sky geometry, shader material, lights and shadow configuration have no reconstruction records.
- Active terrain geometry has no recovery result tied to Core World cell state.
- Cell-owned CanvasTextures and materials have no recovery result.
- Instanced vegetation and grass have no recovery result.
- Truck, cargo and wheel rigs have no recovery result.
- Wildlife meshes have no recovery result.
- Dust BufferGeometry has no declared reconstruct-or-reset policy.
- Resource dependencies and verification are not encoded.

## Reconstruction and stale work

- No replacement-renderer construction result exists.
- Pixel ratio, size, output color space, tone mapping and shadow policy have no recovery acknowledgement.
- Active streamed cells are not rebuilt from accepted Core World state after loss.
- Old-generation RAF, resize or provider completions cannot be rejected.
- No recovery deadline exists.
- No retry budget exists.
- No per-resource failure classification exists.
- No `RenderRecoveryResult` exists.

## Fallback and visible-frame proof

- No non-WebGL recovery/failure state is owned by the product.
- No actionable retry or reload result follows recovery-budget exhaustion.
- No `RenderFallbackResult` exists.
- A browser restoration callback is not tied to a presented frame.
- No `FirstRecoveredFrameAck` exists.
- No visible/engine/world revision convergence result exists for the recovered frame.

## Validation

- No package manifest or executable test command exists.
- No forced `WEBGL_lose_context` fixture exists.
- No duplicate-loss fixture exists.
- No restoration-admission fixture exists.
- No shared-resource rehydration fixture exists.
- No active-cell rehydration fixture exists.
- No persistent-rig rehydration fixture exists.
- No stale-generation rejection fixture exists.
- No simulation/input loss-policy fixture exists.
- No exhausted-retry fallback fixture exists.
- No source-to-artifact-to-Pages recovery parity proof exists.

## Retained gaps

The earlier accessibility projection, input-action convergence, host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback gaps remain valid in their timestamped audit families.

## Completion boundary

Do not claim renderer recovery until context loss is admitted exactly once, stale submissions stop, simulation and input policy are explicit, mandatory resources reconstruct from accepted state, retired callbacks are rejected, failure produces an actionable fallback, and a frame from the accepted replacement generation is presented and acknowledged across source, artifact and Pages.