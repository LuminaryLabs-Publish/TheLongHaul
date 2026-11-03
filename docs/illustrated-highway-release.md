# Illustrated highway: execution and acceptance

Authority: LUM-000154; existing TLH-001–009. Target: LuminaryLabs-Publish/TheLongHaul/main. Baseline: d5c5667126869cfb826e10c5d039b27a6b280d29. Scope remains this product only; Campaign content and its Coming Soon menu, progression, controls and final-asset initiative LUM-000162 are preserved.

## Outcomes

1. **A coherent, layered world.** Integrate the preserved modular road foundation, then provide shared near/far terrain shapes and color, restrained distance curvature, atmospheric fading with clear hazard space, solid canopy LODs, shaped clouds, broad toon lighting, hero contrast and a ground-following contact shadow. Excludes renderer migration, upstream Engine changes and claims of final production assets.
2. **A readable driving HUD.** Vehicle state lower left, abilities lower right, freight objective upper left and contextual risk/reward upper right. Preserve actual state authorities and controls, distinguish elapsed time from cargo deadlines, use remaining truck condition, separate delivery receipts from upcoming freight, and remove persistent idle instructions.
3. **An inspectable playable release.** Deterministic regressions; actual browser/DOM/WebGL at desktop and portrait sizes; one uninterrupted 600-second journey; native 1080p30 60-second highlight with source intervals and original game audio; normal publication only after accepted evidence. Hardware and human subjective review remain open.

## Renderer routing

The shipped host is Three.js WebGL plus DOM/CSS, CanvasTexture, arbitrary GLSL, browser input, storage and Web Audio. No ready direct renderer maps the whole host faithfully. The requested HUD, input and browser-presentation claims require the actual browser. Container loopback navigation was stopped by administrative policy before page load; no policy bypass is permitted. The same-repository validation branch runs the actual reviewed application in an ordinary GitHub Actions browser runner. This is a separate authorized execution environment, not a substitution of a lookalike scene. Source identity and exact staged patch hashes accompany results. Main stays unchanged until evidence is inspected.

## Implementation boundaries

`landscape-style.mjs` supplies deterministic product art functions and HUD models. Worker terrain and distant terrain share the palette and height contract. The new relief stays outside the bounded v2 driving corridor; legacy and geographic terrain retain their prior surface. The existing road adapter owns road/collision/traffic alignment. `visual-presentation.js` owns renderer materials and DOM organization, never wallet, cargo, score or save authority. Broad tree canopies replace point speckles without unbounded scene resources. Fog does not remove the clear near driving space.

## Validation entry points

- `npm run build:host`: verify immutable pinned engine/Three bytes and export contract; rebuild host.
- `npm test`: product regressions including geometry and presentation contracts.
- `npm run test:roads:traverse`: actual engine/truck/freight 600-second physics-only traversal.
- `npm run validate:visuals`: real browser checks with declared distant inspection/weather fixtures.
- `npm run record:visuals`: real uninterrupted 600-second input-driven journey and 60-second edit. Analog steering is declared; no gameplay-state injection during the film.

Output reports, screenshots, original reference, clip timing, source hashes, inputs and media probes are retained as CI artifacts and project evidence, not committed media binaries. Failure exits nonzero and blocks promotion. Numerical acceptance is not visual inspection or human play sign-off.

## Status

Implementation and local deterministic checks are complete. Actual rendered acceptance and publication are pending the validation runner. This status must be superseded by a verified publication receipt, not assumed from build success.
