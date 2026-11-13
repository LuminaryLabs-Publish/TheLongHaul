# Endless Drive startup repair — delivered source candidate

## State and authority

Implemented and source/component tested in an isolated sandbox; approved for publishing to main by the user on 2026-11-13. This document records pre-publication tests and remaining acceptance gaps.
The approved plan requires a real served-game click → generate → drive and saved-haul test before publication. That gate was blocked by Chromium administrator policy, not passed. Do not treat the component test or native simulation as a substitute.

Repository: `LuminaryLabs-Publish/TheLongHaul`.
Base: `9ebf15cdbb385b79832e4d80225b4f284876c8d8`.
Base tree: `e276babbcc448026bfa699bed34a39cc474471a1`.
Source recovery: GitHub Pages run `43374173130`, artifact `14013996765`; the repository head was read through the GitHub connector before and after implementation.
Engine pin remains `b941c9b2995e3449c6987908657753e2cf2df242`, Three.js remains 0.165.0.

Framework routing: Framework Master; Master Guide Tracker; Sandbox Rendering & Validation Guide; Nexus Regression Testing Guide. Browser behavior is the required evidence surface; no renderer substitution can prove the complete click/DOM/storage path.

## History reconciliation

The candidate starts after both current city commits, not from an older lighting build:

- `67a6d86c`: winding V3 road / neighborhood integration.
- `ceeaab30`: removed optional scenery readiness waits, but did not fix all startup failures.
- `6107b702`: expanded city districts, side roads, and building/foliage presentation.
- `9ebf15cd`: frontage zoning and clear side-road junctions.

City placement, roads, meshes, freight rules, physical simulation, saves and native settings source are retained. No Engine update, GitHub Actions changes, remote branches or Drive writes were made.

## Definite launch defect reproduced

The deployed `vendor/app-runtime.js` used:

```js
for (const cell of $("#arcade-endless-payout")) cell.remove();
```

`$` returns one DOM element or null. Neither is the intended list. A native browser click on the actual shipped Start handler/wrapper raised:

```text
$ is not a function or its return value is not iterable
```

The base `src/app/app-chunk-18.js` already had the correct `$$` query. The generated browser bundle did not match source. Rebuilding it with `npm run build:host` restores the correct iterator and the source's currency labels; it is not manually patched. Baseline static-shell validation fails this source/bundle mismatch; the candidate passes.

The offline browser component fixture uses the actual Start event handler, launch wrapper and loading code, with downstream generation replaced by a call counter. Baseline reaches generation zero times and throws; candidate reaches generation once without errors. This proves the launch-wrapper correction and component click handling, **not full gameplay or WebGL acceptance**.

## Implemented changes

| File | Change |
|---|---|
| `src/app/startup-controller.js` | One game-host startup authority: loading/ready/failed, bounded script loading, execution-error detection, nonfatal optional-host errors, delayed-loading notice, cleanup and final entry readiness. |
| `src/app/bootstrap.mjs` | Retains ordered required host installation; checks runtime/road/presentation registration; settles freight start-location readiness; optional tree/town/preview scripts cannot hold the menu. |
| `src/app/app-chunk-11.js` | Announces runtime initialization rather than final boot; errors release loading presentation; Campaign auto-start waits for final boot. Existing Start/Resume handlers remain unchanged. |
| `src/app/menu-attract-host.js` | Preview no longer opens the menu; per-frame preview exceptions retire its resources and restore gameplay visibility instead of terminating the game frame. |
| `src/app/async-loading-scene.js` | Bounds pending Web Animations; provides boot-only release; failed scene commits remain failures; late boot cleanup cannot cancel a new course. |
| `index.html` | Installs startup controller, exposes nonblocking slow-load status and removes the old early-ready/12-second false-failure logic. |
| `vendor/app-runtime.js`, `vendor/manifest.json` | Generated from the complete current source and hashed by the existing build tool. |
| Startup, loading, cinematic and static-shell tests | Exercise actual outer bootstrap, missing/stalled optional assets, required errors, silent runtime failure, reveal failure, dynamic Resume controls, double activation, and the shipped launch wrapper. |
| `tools/validate-gameplay.mjs` | Fixes obsolete test expectation that Endless must always visit Dispatch; accepts the current direct start/resume path. |
| `tools/validate-menu-startup.mjs`, `package.json` | Adds the real browser release gate and ensures startup/cinematic regressions execute in `npm test`. |

Required-host failure never enables play. Optional hosts may fail without blocking play. Existing independent disabled-button states are preserved. The async loading presenter remains presentation-only; Nexus CoreScene still owns scene transitions.

## Validation results

- `npm run build:host`: PASS, pinned vendored resources reused.
- `tests/static-shell-smoke.mjs`: PASS; generated runtime exactly matches source.
- Focused startup / async loading / cinematic / tree integration / cel-order tests: PASS.
- All 65 configured test suites executed separately: **61 PASS, 4 pre-existing failures, no newly failing suite**.
- Untouched baseline: 63 suites; 58 PASS, 5 failures. The generated-runtime mismatch is fixed; the same other four failures remain.
- `npm test`: FAIL at the existing freight-yard assertion. This is not a full-suite pass.
- `npm run validate:v3:playable`: PASS, including native 600-second V3 simulation, 7,593.9 m progress, 23 rebuilds, freight pickup/payment, save restoration and V2 isolation. The simulation explicitly is NOT a WebGL gameplay recording.
- Offline native-browser component comparison: PASS at its stated limited scope.
- Actual local full-game browser gate: BLOCKED at navigation with `net::ERR_BLOCKED_BY_ADMINISTRATOR`; zero full-game cases completed.
- Real browser input → physical truck movement, saved-haul UI restoration, actual WebGL output and target-hardware performance: NOT VERIFIED.

### Remaining baseline failures

1. `freight-terminal-start-regression.mjs`: `yard pavement preserved`.
2. `endless-highway-regression.mjs`: topology storage bound assertion.
3. `connected-town-host-regression.mjs`: paused town-model retirement assertion (17 vs 0).
4. `road-chunks-regression.mjs`: old edge/node cap assertion.

These were reproduced on the untouched latest source. They were not hidden, removed or loosened in this startup repair. They require their own evidence-based disposition before a general claim that the entire game is regression-free.

## Remaining release gate

In an authorized browser-capable environment, on this exact candidate:

```sh
npm run build:host
node tests/static-shell-smoke.mjs
node tests/menu-startup-regression.mjs
node tests/async-loading-scene-regression.mjs
node tests/cinematic-title-regression.mjs
npm run validate:startup
npm run validate:gameplay
npm run validate:v3:playable
npm test
```

The focused browser gate uses real clicks and keyboard input. It covers a new V3 journey, same-session saved-haul reload, explicit V2 fallback, missing optional hosts and explicit required-host failure. It does not teleport the truck or force-click through overlays. Preserve its screenshots, source identity and JSON report. Browser setup may require `PLAYWRIGHT_CHROMIUM_EXECUTABLE` pointing to an approved executable.

The user separately authorized pushing the source-tested repair despite the browser-only acceptance gap. The commit and deployment must be verified independently. Keep TLH startup visually unaccepted until real served-game driving and saved-haul flows pass; do not modify GitHub Actions.
