# Settings and icon presentation cutover — 2026-11-12

## Identity and approved scope
- Repository: `LuminaryLabs-Publish/TheLongHaul`.
- Branch: `feat/settings-native-ui-icons-20261112`.
- Baseline main: `5fcc5616315be89cb510936d6c4943eafc22168e`.
- User authorized targeted implementation and delivery to `main`.
- NexusEngine Core and GitHub Actions files: **unchanged**.

## Architecture and guidance
Grounded in Luminary Framework Master Breakdown, the Master Guide Tracker, Nexus Engine Agent Operating Guide, NexusEngine Composition Guide and NexusEngine `docs/CURRENT-ARCHITECTURE.md`/`presentation/domain.manifest.js`. Game Settings and Scene Kits retain state and lifecycle authority; renderer-neutral menu descriptors and a game-owned adapter generate screen-space drawing via the **existing** Three.js WebGL renderer. The pinned NexusEngine bundle `b941c9b2995e3449c6987908657753e2cf2df242` does not export `createUIKit`, so this integration does **not** claim Core UI Kit registration. No Core source was copied.

## Delivered implementation
- Three illustrated tab descriptors: Gameplay (4), Audio (4), Video (5).
- Presentation-only canvas texture over the existing renderer, not a second game loop or separate WebGL renderer.
- Transparent Settings and Credits over the existing world. Legacy DOM panels remain offstage for semantic fallback.
- Keyboard, pointer, touch-compatible pointer events and focus state.
- Existing settings, `localStorage` key and Pause/Title return routes preserved.
- Legacy `quality` migrated into explicit graphics presets.
- Low/Medium/High affects geometry detail and resolution budget; Performance/Balanced/Sharp independently affects pixel ratio.
- Master volume updates the real master gain, Effects Volume scales engine/environment/effect sound gains; Sound Enabled retains mute semantics.
- Music Volume clearly reports `MUSIC UNAVAILABLE`: no soundtrack was introduced or invented.
- FOV updates the camera. Reduced Visual Effects bypasses optional Sobel outline and reduces legacy atmospheric effect intensity.
- 34 stable transparent SVG icons and manifest in `assets/ui/settings`, including corrected Previous/Next and Keep Driving art.
- Production-style 512px transparent PNG pack assembled in sandbox separately: **not committed as PNG files**. This repository implementation uses lean SVG alternatives.

## Verification and remaining acceptance gates
- **Source verified**: bundled runtime parses; native Settings host parses; game-host mocked V8 execution successfully rendered two menu states and exercised steering, sound, effects volume, graphics, FOV, reduced effects, persistence dispatch, and credits back.
- **Integrity**: runtime `vendor/manifest.json` SHA-256 updated using validated digest implementation, pinned engine and Three.js retained.
- **Tests added**: `tests/settings-native-ui-regression.mjs`, wired into `npm test` and `npm run test:settings`.
- **Not verified**: full `npm test` on complete repository, actual browser/WebGL screenshots, desktop/mobile visual review, GPU/frame-time benchmarks, native Windows/Linux packaging, music playback. Do not describe these as accepted.

## Acceptance follow-up
Run `npm run build:host`, `npm test`, and `npm run test:settings` in a complete checkout, then capture the three settings tabs in WebGL at desktop and mobile resolutions, audit the DOM accessibility fallback and measure frame-time cost. Record browser acceptance separately from source delivery.
