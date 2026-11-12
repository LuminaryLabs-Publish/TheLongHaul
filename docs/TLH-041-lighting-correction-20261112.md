# TLH-041 — Lighting cleanup and anime-road presentation correction

Target: The Long Haul, base `476e837d9033a6f1d799299876df2cfafab253d8`.

## Intended result
Bright, readable terrain and trucks with directional, genuinely occluded dark shadows, without a whole-game redesign. Nexus Engine Core and the pinned Three.js version remain unchanged.

## Source changes
- Suppress the permanent full-screen driving vignette/grain, retaining non-driving overlays.
- Replace the dark terrain-map multiplier with subtle near-neutral texture; brighten the shared world-space meadow/highland pigment.
- Route V2 and V3 near terrain through the same palette as the distant world. Legacy terrain retains its previous path.
- Remove obsolete weather and reset light writers from app-chunk-19; add one game-owned illumination adapter loaded after the budgeted shadow adapter.
- Separate sun-facing form shading from genuine sampled sunlight occlusion in the existing Four-Band material hook. Reuse the existing Three directional shadow sample, rather than adding a second shadow-map lookup.
- Keep the existing shadow budgets; create up to twelve high-quality or five low-quality near-tree proxy instances, reusing GLB geometry in a shadow-only camera layer.
- Distinguish GLB bark and foliage roles and soften tiny depth-outline noise.
- Rebuild generated `vendor/app-runtime.js` and `vendor/manifest.json` from pinned source; no vendor Engine or Three upgrade.

## Validation performed
PASS (source): `npm run build:host` using pinned vendored Nexus/Three resources.
PASS (focused Node): four-band cel host, toon world coverage, lighting/shadow host, prebuilt tree host, presentation regression.
FULL SUITE NOT PASS: `npm test` stops at `tests/freight-terminal-start-regression.mjs`, asserting “yard pavement preserved”; the same failure occurred against untouched deployed baseline before changes.
WEBGL VISUAL PROOF NOT OBTAINED: local page navigation produced `ERR_BLOCKED_BY_ADMINISTRATOR`; an isolated shader probe could not initialize a WebGL context. Neither provides authentic gameplay pixel acceptance or performance evidence.
PERFORMANCE AND 600-SECOND LIVE INPUT: NOT RUN.

## Remaining acceptance
Inspect actual WebGL clear/rain and V2/V3 scenes, including truck, foliage, road markings, near/far terrain, reset/pause and stream boundaries. Check true directional shadows against unoccluded terrain, shader compilation log, and the pre-existing shadow caster budgets. Run the full input-driven performance/evidence gate on supported hardware before closing TLH-041.

Delivery is source-level only until the missing visual, runtime, and performance gates are resolved. Do not mark TLH-041 Done based solely on this commit.
