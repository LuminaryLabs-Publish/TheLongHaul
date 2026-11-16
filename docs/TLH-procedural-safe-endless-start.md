# The Long Haul — Procedural-only Endless start

**Base revision:** `faabe9fb315988e4b309d24482c790661dc4fb3f`
**Status:** Source implemented and tested; full active WebGL driving remains unverified.

## Approved behavior

- Newly started Endless journeys use the `haul-procedural-safe-` seed family.
- The player spawns on the existing V3 terrain-aligned through-highway at progress 0, not in the authored freight terminal or a legacy ramp.
- Existing V1/V2/V3 saves and their seed identities do not migrate.
- The **freight terminal GLB, its parser, source layout, traffic, collision definitions, and existing host remain in the repository for Campaign**. They are not removed or altered by this task.
- For the new seed family, procedural generation only accepts a continuous through-highway and grade-checked freight branches. It suppresses unaccepted scenic bypasses, town-road branches, roundabouts, interchanges, construction barriers, jump ramps, roadblocks, and weaving hazards until their passability has independent proof.
- The core validation rejects missing or nonfinite geometry, narrow pavement, grades above 12%, broken connections, and overhead bridge/tunnel structure tags. Freight branches are deterministically regraded by cumulative distance while retaining exact mainline endpoints.
- Roadside static collision and decoration placements are screened against all nearby road surfaces. This leaves legitimate off-road obstacles intact.
- The new seed family retains deterministic streaming: accepted edge IDs, station identities, time, scoring, truck physics and save logic are unchanged.

## Files and ownership

- `src/game/procedural-road-safety.mjs`: product-owned deterministic generation and acceptance rules; no renderer or physics ownership.
- `src/game/road-v3-playable-course.mjs`: seed-gated candidate selection, branch validation and geometry composition.
- `src/game/road-v3-terrain-route.mjs`: V3 winding terrain alignment for the new seed family.
- `src/app/freight-terminal-host.js`: disables terminal attachment for new procedural starts only.
- `src/app/app-chunk-5.js`: new seed and static roadside collider filtering with per-object cache.
- `src/app/endless-roads.js`: disables unsafe constructed roadside obstacles and encounter types for safe-mode seeds.
- `src/app/bootstrap.mjs`, `index.html`, `vendor/app-runtime.js`, `vendor/manifest.json`: browser cache version and generated source parity.
- `tests/procedural-safe-endless-regression.mjs`: repeatable seeded topology, collision and terrain checks.

## Evidence and limitations

- Rebuilt 22-chunk host runtime using the pinned local vendor (`npm run build:host`), with manifest checksum parity.
- `npm run test:procedural-safe`: 8/8 tests passed, including 32 seeds checked through 6.4 km, drivable surface contact, metadata integrity, and a real imported terminal GLB parser smoke test.
- Selected legacy freight, terminal, startup, road-host, terrain and V3 tests passed in the same sandbox.
- Real browser/WebGL renderer initialized and displayed the actual title menu. A new procedural seed and world graph were observed during generation, with no terminal attached. Software-browser world loading did not finish reliably during the bounded test, **so there is no validated real driving screenshot or gameplay pass**.
- The previous V3 playable-course regression fails on the unchanged baseline as well; not attributed to this patch.
- The optional road variety intentionally remains disabled for this new mode until blocked-road generation acceptance tests exist. Campaign's retained terminal is not yet wired into a new Campaign scene by this change.

## Luminary Framework route

Framework Master → Master Guide Tracker → GUIDE-090 (Game Environments) and GUIDE-085 (Design Authoring) → GUIDE-095 (Regression Testing) → GUIDE-010 (Sandbox Rendering & Validation).

**GitHub Actions:** Not modified. **Deployment status and live driving acceptance must be verified separately.**
