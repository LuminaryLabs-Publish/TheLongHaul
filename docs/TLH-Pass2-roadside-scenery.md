# The Long Haul · Pass 2: Roadside scenery consolidation

**Source baseline:** `LuminaryLabs-Publish/TheLongHaul` main `3148743fff3822dfae46450bfacbe494153a395d` (2026-11-16).
**Scope:** Procedural Road V3 and Endless scenery. Campaign terminal and V1/V2 checkpoint geometry are protected.
**Status:** Sandbox candidate; GitHub not modified. Full in-browser gameplay/visual acceptance remains pending.

## Changes

1. `src/game/cell-descriptor.mjs` no longer emits legacy World-cell trees, rock props, grass, roadside markers, telephone poles, or boulders on Road V3. Terrain, road descriptors, signs, freight depots and junctions are unchanged. Earlier V1/V2 generators retain their saved layouts.
2. `src/game/environment-tile-planner.mjs` no longer scatters random pole props among the 200 m authored scenery tiles. Authored biomes, tree GLBs, vegetation, buildings, scenery, on-road paint and non-pole props remain.
3. `src/game/roadside-utilities.mjs` places one deterministic pole series along the actual trunk road. Poles stand outside the shoulder, respect other roads, signs and depots, and are assigned to a single 160 m cell. Each cable span is owned by its midpoint cell, including at cell seams. Rejected poles do not receive dangling wire spans.
4. `src/app/environment-tiles-host.js` renders those poles through the existing high-fidelity authoring assembly, registers actual pole colliders, and draws three catenary cables between adjacent accepted poles. Their small, periodic wind motion changes only rendering positions; no cable collision or road topology writes occur. Wire resources and pole collision records are released on stream eviction or quality changes.
5. Startup cache token revised to request the new modules. No engine Core, road graph, freight logic, or GitHub Actions changes.

## Validation / acceptance

| Check | Evidence | Status |
|---|---|---|
| Legacy World-cell props absent on Road V3 | `tests/pass2-roadside-utility-regression.mjs` | Passed |
| New authored tiles retain coverage without random poles | Same test | Passed |
| Pole ID, position, clearance and collider align | Same test | Passed |
| 5 procedural seeds / 3 streaming windows | Same test | Passed |
| 6 seeds / 84 cable spans stay above terrain | Same test | Passed; minimum observed 7.02m |
| Wires across cell seams, sag and small wind motion | Same test | Passed |
| Real Three.js authored pole, wire animation and stream cleanup | `tests/pass2-utility-host-regression.mjs` | Passed |
| New Pass 2 tests | `node --test tests/pass2-*.mjs` | 14/14 passed |
| Runtime bundle rebuild and pinned vendor manifest | `npm run build:host` | Passed |
| Existing environment, road, terminal and tree regressions | 22 individually executed tests | 20 passed; 2 baseline failures reproduced unchanged |
| Authentic browser scene and drive past poles | Chromium navigation to localhost and `file://` | Blocked (`ERR_BLOCKED_BY_ADMINISTRATOR`); no browser gameplay claim |

## Known boundaries

- Legacy saved V1/V2 worlds retain their established procedural scenery for compatibility. This pass removes duplication for current V3 Endless worlds; it does not rewrite older checkpoint data.
- Cables use lightweight lines with three insulator strands. A true physics rope simulation is intentionally out of scope.
- Pole supports have collision; wires do not. Do not present the image-only collision model as a physical rope.

## Existing baseline failures (reproduced on unchanged base artifact)

- `tests/road-v3-playable-course-regression.mjs`: a contact sample returns null instead of the requested V3 road-surface normal. Same failure on base revision `3148743`. Not modified by Pass 2.
- `tests/connected-town-host-regression.mjs`: paused town models remain active (`17 !== 0`). Same failure on base revision `3148743`. Not modified by Pass 2.

All other selected 20 checks passed. The source-backed Three.js host simulation creates the actual authored pole meshes and cable line geometry, updates cable positions without affecting obstacles, and disposes wires and pole collision references on cell eviction. Chromium navigation to both local HTTP and `file://` was blocked by the sandbox administrator; the actual gameplay image and full interactive drive remain unverified.

## Commands

- `npm run build:host` — passed; vendor `app-runtime.js` and manifest were unchanged, because only standalone host and game-module sources were altered.
- `node --test tests/pass2-roadside-utility-regression.mjs tests/pass2-utility-host-regression.mjs` — 14/14 passed.
- `tests/environment-tile-streaming-regression.mjs` — passed with its existing host harness brought in line with current collision dependencies.
- 22 selected repository regression scripts — 20 passed, two failures matched the unmodified base artifact.

No GitHub changes, publishing, GitHub Actions edits, or Campaign terminal asset changes were made.
