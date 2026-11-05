# The Long Haul — Budgeted Illustrated Lighting & Shadowing

**Source scope:** `LuminaryLabs-Publish/TheLongHaul`. The existing Three.js renderer, pinned NexusEngine runtime, truck physics, traffic movement, collision classes, saves, road topology, and `.github/workflows/deploy-pages.yml` remain unchanged.

## Shipped result
- One warmer, more directional sunlight source now casts PCF-soft shadows in a moving near-truck orthographic camera. The existing cool directional fill remains non-shadowing. Hemispherical light is reduced for deeper, readable toon shade bands.
- Road and terrain meshes receive sunlight shadows; nearby authored truck, traffic, vegetation, bridges, and roadside structures cast within a bounded set.
- Reuses the four-band toon materials and existing near/far scene geometry. No postprocessing composer or extra scene render loop is installed.
- A single reusable instanced contact-occlusion mesh grounds trees, rocks, road structures and vehicles. This is selective contact occlusion, *not* a full-screen SSAO pass. The prior truck contact blob is reduced to avoid doubled darkness.
- The host prepares lazily created traffic meshes and newly streamed cells before they render, handles rebuilt truck rigs and quality changes, and does not mutate gameplay state.

## Hardware-aware budgets

| Mode | Sun shadow map | Orthographic width | Map cadence | Mesh caster cap | Contact decals |
|---|---:|---:|---:|---:|---:|
| Higher quality | 1024² | 140 m | 24 Hz nominal | 54 | 46 |
| Lower quality | 512² | 104 m | 15 Hz nominal | 29 | 22 |

Refresh may occur earlier after a large truck displacement. Caster selection occurs at 7 Hz/high and 4 Hz/low; traffic-caster selection is capped at three or two nearby vehicles, respectively. The map focuses slightly ahead of the truck and uses texel snapping to limit shimmer. Distant roads, line markings and far LOD vehicles never become shadow casters. The occlusion batch consumes one draw call.

## Ownership

- `src/game/lighting-shadow-policy.mjs`: deterministic presentation budgets, anchor calculation and closest-candidate selection.
- `src/app/lighting-shadow-host.js`: browser-only lighting/streaming adapter. Loaded after the road, illustrated, hero-truck, and authored-traffic hosts.
- `tests/lighting-shadow-policy-regression.mjs` and `tests/lighting-shadow-host-regression.mjs`: source-bound budget and headless host tests.
- `window.LongHaulLighting.getState()`: live map size, scheduled updates, selection counts, active caster count, and contact-decal count. It explicitly states that physical GPU performance has not been verified.

## Acceptance

The local policy and mocked-Three tests passed. The implementation also passed local JavaScript syntax checks. These tests validate integration contracts, *not* actual GPU/WebGL frames. Run `npm test`, `npm run validate:visuals`, real browser gameplay in high/low quality, and ten-minute traffic/bridge/rain captures on a compatible host before final visual signoff. Physical GPU frame times, map bias, shadow acne/peter-panning, art review and real-time performance remain open. GitHub Pages deployment alone is not a gameplay test.
