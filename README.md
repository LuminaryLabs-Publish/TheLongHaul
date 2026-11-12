# The Long Haul

A stylized browser trucking game using the **NexusEngine** game domain Kits and a **Three.js** rendering host.

## Start here: one authority per purpose

- 00 - Current Handoff (internal shared-drive source; locate by title) — current source state, active task, risks and next action.
- Master Game Definition (internal shared-drive source; locate by title) — stable game vision and accepted direction.
- Task Tracker (internal shared-drive source; locate by title) — canonical gameplay and asset outcomes.
- [Technical documentation index](docs/INDEX.md) — architecture, source contracts, validation and historical report routing.
- [Architecture](docs/ARCHITECTURE.md) · [Validation](docs/VALIDATION.md) — single technical ownership and acceptance definitions.
- [Historical agent audits](.agent/history/README.md) — previously captured research, not the active backlog.

## Play

The current game sources include an Endless freight journey and Campaign/garage integration. In Endless, enter a pickup gate, carry cargo via safe/express routes, receive pay and XP, recover or service the truck, and continue. Standard/fragile/heavy/hazardous/unstable freight changes mass, handling and damage. The exact startup sequence and visual state must be checked in a real source-pinned runtime.

Keyboard: WASD or arrows drive (S brakes and then reverses), Shift drift, Space boost, double-tap forward rush, X handbrake, Q/E abilities, F interact or roadside recovery, U skills, M map, C camera, Escape pause, R retry. Confirm live binding and mobile control parity before publishing.

## Build and validate

```sh
npm ci
npm run build:host
npm test
npm run validate:gameplay
npm run validate:visuals
```

Run the committed browser output on a local HTTP server. Browser/capture commands require appropriate Playwright/Chromium support and, where used, FFmpeg. The complete command menu is in `package.json`; source/pin/capture policy is in [docs/VALIDATION.md](docs/VALIDATION.md). A unit-test pass does not establish graphics or gameplay acceptance.

## Source ownership and version

- `src/game/`: product/game Kits, terrain, truck, freight, roads and game rules.
- `src/app/`: One Three.js host, projections/materials/postprocess and UI.
- `vendor/manifest.json`: pinned NexusEngine `b941c9b2995e3449c6987908657753e2cf2df242`, Three.js 0.165.0 and vendor integrity hashes.
- `tests/`, `tools/`, `audit/`: executable evidence; `assets/`, `art/`, `manifests/`: authored/runtime assets and manifests.

**Baseline examined for this documentation cutover:** `main` commit `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. The separate `work/unified-truck-physics-render-20261111` branch is unaccepted; its source-only simulations do not prove a full host/WebGL release. This documentation-only branch neither merges those game changes nor changes GitHub Actions.
