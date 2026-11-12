# The Long Haul — Current Source Architecture

> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

## 1. Authority and entry
- Project vision and accepted design: Master Game Definition (internal shared-drive source; locate by title).
- Current work and blockers: 00 - Current Handoff (internal shared-drive source; locate by title).
- One task authority: The Long Haul Task Tracker (internal shared-drive source; locate by title). LUM-000154 owns gameplay; LUM-000162 owns source art. No 223-way TLH issue recreation.
- Reproduction: `package.json` commands, `audit/validation.json`, `tools/`, `tests/`, `vendor/manifest.json`.

## 2. Engine and runtime
- `vendor/manifest.json` pins NexusEngine `b941c9b2995e3449c6987908657753e2cf2df242` and Three.js `0.165.0` with vendor hashes. No NexusEngine PR #4 render-graph integration is present in this pin.
- `src/game/product-kits.mjs` selects V1 or V2 truck Kit and assembles game-specific systems. `src/long-haul-core.mjs`, `src/long-haul-game.mjs`, `src/app/bootstrap.mjs` and `src/app/app-chunk-*.js` host integration. `index.html` is the playable entry, `campaign.html` is the campaign/garage surface.
- NexusEngine core/World/Simulation/Input/Scene/Data/Graphics contracts own canonical resources, events, timing, scene transition and feature lifecycle. Game-defined Kits own truck, freight, routes, scoring, abilities and policies. Three.js hosts materialize those snapshots as visuals. Do not create competing state or a second render loop.

## 3. State ownership
| State / behavior | Primary source | Consumers |
| --- | --- | --- |
| Truck dynamics, tire force, cargo mass, impact request | `src/game/truck-movement-v2-kit.mjs`, `truck-reactive-body.mjs`, `truck-tire-forces.mjs`, `truck-dynamics-profile-kit.mjs` | camera, truck mesh, cargo UI |
| Road graph, road contact, route choice | `src/game/course-kit.mjs`, `road-*.mjs`, `road-v3-kit.mjs` (opt-in) | truck, traffic, freight, terrain host |
| World streaming, patches, cell ownership | `world-*.mjs`, `patch-*.mjs`, `environment-tile-*.mjs` | `src/app` world/GLB hosts |
| Freight, run, saving, pay | `run-kit.mjs`, `delivery-kit.mjs`, `cargo-profiles.mjs`, `freight-journey.mjs` | HUD, map, delivery gates |
| Skills and pickups | `skill-progression.mjs`, `active-abilities.mjs`, `driving-pickups.mjs`, `arcade-score.mjs` | controls, abilities/HUD |
| Visual toon/lighting/outlines | `toon-style.mjs`, `src/app/four-band-cel-host.js`, `sobel-outline-host.js` | one Three.js WebGL renderer |
| Authored GLBs and gameplay proxies | `src/game/freight-terminal-*.mjs`, `prebuilt-tree-library.mjs`, `environment-tile-*.mjs` | world adapters, renderer |

## 4. Runtime lifecycle
Input → bounded Nexus simulation/Kits → authoritative resources/events → World patch activation and road/terrain sampling → scene host projection → exactly one Three renderer (`toon world → depth Sobel outlines → screen`) → HUD and evidence.
Scene pause/focus must freeze simulation and cargo deadlines, not just visual animation. Save/recovery must preserve gameplay authority. A world cell owns GLB instance retirement/disposal; never load all source GLBs concurrently.

## 5. Main versus candidate
Main Movement V2 combines two-axle tire forces and a reactive pitch/roll body, but still separately handles yaw/heading and grounded-height constraints. The **unaccepted** `work/unified-truck-physics-render-20261111` candidate changes pose, collision, rendering and save migration; its isolated tests do not equal a full pinned build. Keep it separate from this documentation-only branch. Road V3 remains experimental/opt-in with specific gameplay and WebGL gates. The currently deployed screenshot raises art/UI and driveability concerns requiring actual gameplay review.

## 6. Extension rules
Maintain a single owner per resource, explicit authored-asset provenance, source-pinned runnable tests and real WebGL visual evidence when changing rendering. Do not change engine Core, GitHub Actions, rollout, publishing or access without explicit authorization. See [validation](VALIDATION.md) and [system contracts](INDEX.md).
