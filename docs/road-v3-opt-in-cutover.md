# The Long Haul — Road V3 opt-in gameplay integration candidate

**Status:** Opt-in Road V3 integration candidate; V2 remains the default. Full WebGL gameplay cutover NOT accepted.

**Authoritative starting point:** `LuminaryLabs-Publish/TheLongHaul` `main` at `ccc53cd477d83f2e1bd9eef7951ad0e8f9ba139b`, recovered from the successful GitHub Pages artifact. Exact head must be checked again before any authorized publication.

## What is implemented in this candidate

- `?road=v3` selects the existing `longHaulRoadV3` Domain Service Kit when starting a new Endless journey. The default is V2. Existing saved V1/V2 journeys continue their own generator version.
- One deterministic seeded V3 world/alignment samples the existing natural terrain field and locally grades/cuts/fills the roadbed without installing a second world manager. Streamed geometry uses the existing 160 m cell and World feature ownership.
- The existing V2 route topology is a temporary source recipe mapped to V3's terrain frame. The active V3 course retains trunk, five-lane/country-road profiles, freight stations, signs, branches, ramps, forks and bypass metadata. It adds an optional four-edge physical roundabout side road with a center island and yield markings.
- The existing road-contact consumer now samples elevation and bank for V3, distinguishing upper and lower bridge levels. V2 contact logic stays untouched. Truck, freight, traffic and the HUD consume graph-derived progress where needed; V3 vehicle placement includes bank and grade, and authored 200 m environment tiles follow the actual curved route.
- V3 window rebuilds and deterministic reconstruction operate through the existing course/window interface; legacy generated V2 road and save conventions remain available.
- Existing foliage, cloud and Alternative B HUD/UI files from current `main` are preserved, including the newest `src/app/visual-presentation.js` route-choice additions. The one overlapping presentation source was merged without conflicts and syntax-checked. No new physics engine, renderer, world manager, branch or GitHub Actions modification.

## Source-backed tests completed

- 12 seeded playable V3 course reconstructions: V2 topology IDs, lane/branch preservation, physical roundabout island/yield descriptors, roundabout traffic paths, freight state/restore, world cell and return reconstruction — **PASS**.
- 16-seed terrain-first route test, 12 sections each; 30-seed/16-mountain V3 streaming; 25 bridge/world cases — **PASS** (targeted test runs).
- Input-driven NexusEngine truck drive on the V3 playable course for 600 simulation seconds: **7,587 m**, 23 bounded road-window rebuilds, **zero off-road ticks**, no rollover — **PASS**. This is NOT browser input/visual evidence.
- Separate bridge contact test of 12 overlapping road levels, including V2 isolation — **PASS**.
- Road-aligned authored environment generation: 15 V3-owned world cells, 184 deterministic nonduplicated objects — **PASS**.
- Current V2 road-host, environment streaming, traffic fixture, foliage, cargo and freight regressions covered by the earlier broad matrix — **PASS** for the individual completed checks. After rebasing, reran the playable-course, deck-contact, V3 environment streaming, V2 road-host, traffic-authoring and prebuilt-tree-host checks — **PASS**, plus the pinned vendor runtime build — **PASS**.
- Pinned vendor runtime build via `node tools/build-runtime.mjs --reuse-vendor` — **PASS**.

A broad independently executed 43-test matrix completed with **41 PASS, 1 FAIL, 1 TIMEOUT**. `tests/presentation-regression.mjs` fails on a stale `cloudMesh.computeBoundingSphere()` source-string assertion, reproduced on BOTH the unchanged source at `57d6e932` and the unchanged new GitHub baseline at `ccc53cd` (not caused by V3). `tests/road-traversal-regression.mjs` exceeded the execution limit. Separately, `tests/road-chunks-regression.mjs` fails on an old `<s>Campaign</s>` markup assertion against the current unchanged `index.html`. These are **not** full-suite success claims. Reconcile the baseline and rerun the full suite before default promotion.

## Visual evidence and critical blocker

A 60.00 s, 960×540, 24 fps H.264 offscreen geometry review was generated from the exact V3 source shape and natural terrain sampling. It is **not** a game session, not a browser framebuffer, and not an authorized substitute for genuine gameplay footage.

Chromium in this sandbox returns `net::ERR_BLOCKED_BY_ADMINISTRATOR` for both `http://127.0.0.1` and `file://` game URLs. The direct VTK EGL renderer produces pixels but cannot certify actual Three.js/WebGL shaders, DOM input, live traffic, complete freight payouts, or save/resume in the running browser. The required uninterrupted 600-second real game playtest and reviewed 60-second gameplay recording remain **BLOCKED**.

Also unresolved: full gameplay feature/physics/visual parity, playable road branch selection and sign readability, 100 external authored GLB acceptance, supported-device performance, complete save recovery, human gameplay review, and actual deployment verification. A green simulation test is not acceptance of those gates.

## Commands and continuation

```sh
node tools/build-runtime.mjs --reuse-vendor
node tests/road-v3-playable-course-regression.mjs
node tests/road-v3-playable-drive-regression.mjs --full
node tests/road-v3-environment-streaming-regression.mjs
node tests/road-v3-deck-contact-regression.mjs
node tests/road-host-regression.mjs
npm test  # must resolve remaining baseline failures before promotion
```

Use `?road=v3` for opt-in new journeys only after the browser environment allows actual gameplay. For rollback, remove the query parameter for new V2 journeys; existing checkpoints retain their generator version. Do not force V3 onto a saved V1/V2 session.

**Promotion rule:** Preserve the incomplete candidate in the sandbox. Do not switch default or push to `main` until a real WebGL game can launch, its major road types/truck/traffic/freight/save flows are validated, the 600 s genuine session and 60 s reviewed gameplay video exist, full regressions and target hardware gates are accepted, and the newest `main` is reconciled. No GitHub Actions changes.

## Final reconciliation against newer `main`

GitHub advanced by three TLH-023 Alternative B HUD commits while the candidate was being developed. A GitHub compare found only one overlapping modified file (`src/app/visual-presentation.js`) in the V3 change set. It was conflict-free merged with the latest route-choice presentation code. All added HUD artwork files and `styles.css` are unchanged from current `main`; no files under `.github` were changed. Local patch generation and source hash validation are retained in the source bundle. The newest GitHub head must be checked again before any future push.

## 2026-11-08 continued validation — physical freight parity and complete Node regression

The recovery baseline remains `ccc53cd477d83f2e1bd9eef7951ad0e8f9ba139b`; verified against GitHub before this checkpoint. All changes remain local to the execution sandbox. The feature is still opt-in; V2 is still the default.

### Targeted defects corrected

1. **Freight gate road identity:** Playable V3 had already transformed the source wide and express loading roads, but `freight-journey.mjs` was synthesizing both pickup gates beside the mainline. Their separation was 5.6 m in the freight state but approximately 44 m in the actual road geometry. Playable V3 freight now uses the exact authoritative `loadingStations` gate positions, widths and edge IDs; earlier graph-only V3 fixtures retain their tested fallback.
2. **Clean express reward:** V3 route selection and lateral-error checks still measured the actual shortcut against a fabricated mainline lane, which could suppress a legitimate risky reward. Both checks now interpolate the physical V3 route edge at the current progress. A deterministic real-location trace entered the express side road, picked up its cargo, emitted exactly one clean-route reward and completed a paid delivery. V1/V2 state machines are unchanged.
3. **Visible freight gates:** The active host placed gate meshes at terrain height even when the corresponding V3 pickup or receiver was on a higher road deck; it also culled stations based on `-position.z`. For V3, gate placement now uses the authored road elevation, and culling uses `endlessHighwayProgress()`. V2 retains terrain-height behavior and its existing progress semantics.
4. **Baseline test currency:** The old cloud-culling/shader assertion referenced a retired renderer, and a road test asserted removed Campaign `<s>` markup. Both source-only checks now verify their existing current contracts (volumetric density/light and the accessible disabled Campaign button) instead of old implementation details. Game presentation and menu behavior were not changed to make these tests pass.

### Fresh evidence and limits

- `tests/road-v3-playable-course-regression.mjs`: PASS; 12 seeded road networks, branch/island ownership, wide/risky physical pickup gates, swept gate crossing, V2 isolation.
- `tests/road-v3-save-recovery-regression.mjs`: PASS; real generated V3 positions through safe pickup and one paid delivery ($513), persisted atomic receipt, no duplicate payment, stale revision rejection, V2 generator-conflict rejection, deterministic restoration, separate actual express-branch pickup/delivery and exactly one clean-route reward. It also checks host gate height/progress integration.
- Existing `tests/freight-journey-regression.mjs`, `tests/freight-score-regression.mjs`, V3 freight and road-host regressions: PASS after freight changes.
- Existing 600-second V2 truck simulation: PASS, 13.76 km and 14 deliveries, with no cargo loss.
- Opt-in V3 600-second NexusEngine truck simulation: PASS, approximately 7.59 km, 23 streaming-window rebuilds and zero off-road ticks; this is not a WebGL game recording.
- One original full `npm test` run passed with exit code 0 after updating the two stale source assertions. The added save/recovery test also passed in a subsequent full test run with exit code 0. Exact final source must be revalidated after subsequent edits.
- The pinned runtime build succeeded using `node tools/build-runtime.mjs --reuse-vendor` after the latest host adjustments.

### Still required before **V3 becomes the default**

True end-to-end WebGL gameplay on a supported browser/device, visually verified roads and traffic through roundabouts and bridges, complete long-session freight-save/route validation, target-device performance evidence, approved authored art/GLB integration, the authentic uninterrupted 600-second gameplay recording and user-reviewed 60-second edit. The sandbox Chromium policy blocked even a simple `data:` page with an organizational navigation denial; headless EGL road-geometry footage is **not** WebGL gameplay. Do not describe this as an accepted gameplay cutover. Keep `?road=v3` opt-in and preserve V2 as the active default. No GitHub Actions changes.

### Additional multi-window proof

A deterministic 5.63 km V3 freight trace at ordinary forward progress completed five physical deliveries, produced no cargo losses, rebuilt its bounded road window 17 times, and kept `getState()` valid throughout the run (`v3-longhaul-freight-window`). This uses the game-owned V3 road samples and freight state machine but not the actual browser/rendered game. The exact evidence JSON is retained in the sandbox handoff. The proof does not establish frame performance, real keyboard/controller input, or human playability.
