# The Long Haul — Reproducible Acceptance and Evidence

> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

## 1. Required source identity
Before any test capture, record GitHub owner/repo, exact source SHA, branch, `vendor/manifest.json` Nexus/Three pins and hashes, actual package commands, OS/browser/backend, seed, quality, viewport and control/input log. Distinguish local candidate, main and deployed Pages artifact; their SHAs are not interchangeable.

## 2. Build and regression
From the exact checked-out source in a sandbox (not a synthetic harness):
```sh
npm ci
npm run build:host
npm test
npm run validate:roads
npm run validate:v3:playable
npm run validate:gameplay
npm run validate:visuals
```
Use the exact real scripts declared in `package.json`. Some browser scripts require Playwright/Chromium and FFmpeg. A script skipped or blocked is NOT a pass. `audit/README.md` and `audit/validation.json` describe NexusAuditor baseline/visuals/journey. Keep driver and source pin identical through reruns.

## 3. Physical and content acceptance
- Truck: steering, braking, drift, acceleration, cargo mass, slope/road collision, airborne jump, wheel lift, tipping/resting, recovery, 30/60/120 render-frame variation, V1 save migration.
- Road V2/V3: default/opt-in selection, V2 save restoration, road junctions/bypasses, roundabouts, bridge/terrain vertical layers, cargo gates, procedural streaming and contact clearances.
- Freight: 10-minute original-input session, pickup/route/delivery, paid receipts, checkpoint/retry, upgrades, cargo condition and game-over. No teleport to manufacture filmed success.
- Visual: actual browser WebGL from exact host build; truck pose, terrain/road, foliage, freight terminal, shadows, toon bands, depth outlines, clouds/rain, HUD/camera and narrow viewport. Screenshot contact sheets and original frames must be retained with provenance.
- Performance: actual frame times, assets/chunks/draw cost, target hardware. An offline capture is not a measured real-time FPS result.

## 4. Evidence handling
Write source-pinned artifacts under task-owned evidence in 04 - Evidence (internal shared-drive source; locate by title) and update the **existing** Task Tracker row, not a new tracker. Each claim must show PASS, FAIL, NOT TESTED or BLOCKED and attach logs/screenshots/recordings only when genuine. Retain previous failed evidence with the associated revision. The team/human visual acceptance gate remains separate from code/GLB structural validation.

## 5. Docs-only release gate
A documentation cleanup may verify exact paths, links, titles, syntax/Markdown, permission preservation, file inventories and Git tree diffs without pretending game build/visual validation occurred. Do not move a documentation-only branch to main as an implicit permission to redeploy. `.github/workflows/deploy-pages.yml` is deliberately unchanged.
