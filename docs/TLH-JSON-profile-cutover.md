# TLH — Declarative JSON Scene/Profile Cutover

## Source freeze and authority

Repo `LuminaryLabs-Publish/TheLongHaul` at initial freeze `38d9f93f4da72bf82c42c1ee7322b716e99bc0b1`, pinned NexusEngine `b941c9b2995e3449c6987908657753e2cf2df242`, Three.js 0.165.0. The game owns its content data. Nexus Core retains World, Presentation, lifecycle and sequence contracts. The current Three.js host still renders the game. No Engine Core, Kit, GitHub Actions or existing save-schema edits.

Historical commit freeze points retained in `game/game.json`:
- `67a6d86c` — winding highway, connected towns and neighborhood GLBs.
- `9ebf15cd` — city frontage, zoning and additional side roads.
- `5fcc5616` — four-band lighting and shadow response.
- `38d9f93` — Endless Drive boot and runtime parity repair (current cutover baseline).

## What was cut over

- One canonical game manifest and five game profiles: world, presentation, roads, vegetation and gameplay.
- Five source-controlled scene profiles: countryside, forest, small-town, city, industrial.
- One asset-collection manifest covering the local GLBs, with all original 17 town building identities and three tree species retained.
- One small `src/game/scene-profiles.mjs` validator/immutable catalogue. It validates references and delegates renderer, physics, gameplay and World state to existing components. It does **not** create another kit or source writer.
- Game-owned settings previously hardcoded in World/Terrain product Kit defaults, environmental tile catalogue, road V3 policy, settlement zoning, tree definitions and LOD policy, four-band style and shadow budgets, freight, abilities, skills and forward-boost timings.
- Environment tiles now record their source scene-profile reference. The connected-town planner reads JSON-backed zoning/road policy while preserving the original deterministic geometry and save identity. Existing GLB hosts retain renderer ownership and check profiled asset references.

## Exact mechanics retained

The existing Endless/Campaign modes, loading and resume flow, five cargo identities and cargo mass effects, truck physics, delivery sequence, scoring, cash/garage economy, all skill upgrade identities and costs, mini-truck/shield/shockwave powers, 5-second boost/3-second recharge and original input timing, recovery/comic crashes, AI traffic, freight yard, 200m environmental tiles, V2 fallback, V3 highway, town roads and original 160m world-cell schema remain in their existing runtime owners. **There is no claim of new boss encounters or new mechanics.**

## Freeze tests

`tests/scene-profile-contract-regression.mjs` validates all profile references, scene IDs, real GLB paths, fixed game/road identities, nested immutability, invalid-profile rejection and 19 exact definition hashes plus five seeded V2/V3 road/town hashes against the untouched baseline. The test compares resulting code behavior, not just file presence.

`npm run build:host` regenerates vendor runtime from checked-in app chunks at the same pinned Nexus/Three versions. `npm run validate:profiles` tests the declarative contract. Existing tests continue to cover cargo physics, save/recovery, road/traffic, boosters, abilities, weather/presentation and streamer lifecycle. No repository-wide silent rebaseline is permitted.

## Acceptance evidence and remaining gates

The original 38d9f93 suite independently fails these four assertions before cutover: `freight-terminal-start-regression` (GLB material identity), `endless-highway-regression` and `road-chunks-regression` (outdated topology caps), and `connected-town-host-regression` (paused town visibility). `road-traversal-regression` exceeds the sandbox's 30s isolated test budget. They are not counted as passes or silently modified. The source cutover has no new failures in the remaining suites.

Actual browser gameplay, GPU pixels/foliage quality and target-hardware performance **are not verified** in this environment: `net::ERR_BLOCKED_BY_ADMINISTRATOR` prevents local Playwright HTTP navigation. Direct 3D rendering cannot prove DOM controls, save persistence, or the exact game's custom WebGL shader path. It is therefore incorrect to mark whole-game player acceptance or the earlier noisy tree canopies as visually repaired based solely on JSON/source tests.

Final release review must test new Endless start, V2 fallback, saved resume, Campaign, truck controls/boost, freight pickup/delivery, active powers, skills, garage, trees and towns, clear/rain visuals, pause/retry, and memory/frame-time on a working browser. Log the exact deployed commit and any failing checks.
