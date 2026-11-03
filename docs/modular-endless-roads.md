# Modular Endless roads — execution and acceptance

Authority: LUM-000154 / TLH-001, TLH-002, TLH-005, TLH-007, TLH-008, TLH-009.
Baseline: e5a77798e2ff8ff6dd4663170bdb990ff22d588f. Scope: TheLongHaul only.

## Outcomes
1. A varied, seamless highway: deterministic feature generators and inlet/outlet
   contracts feed the existing bounded 320 m streaming window. Features span
   640 m; protected 320 m freight relays retain their existing identities.
   Include straights, curves, hills, lane tapers, bypasses, bridges, galleries,
   gravel alternatives and construction. Preserve freight, skills and abilities.
   Exclude engine changes, campaign geography rewrites and final asset production.
2. Faithful road surfaces and readable encounters: geometry, ground sampling,
   worker descriptors, lane markings and traffic use shared cross-sections;
   station approaches stay wide. Legacy saved journeys retain v1 geography.
3. Campaign availability is clear: strike through and disable its title-menu
   choice with “Coming Soon”; retain campaign content, saves and direct page.
4. Verified delivery: deterministic combination/seam/regeneration checks,
   regression suites, actual browser/rendered surface and input checks, then
   normal main publication and project evidence. Hardware/human acceptance stays
   separate. The audit ten-minute replay is not claimed by this road release.

## Boundaries and dependencies
Product-only modules own chunk selection and shape. Existing engine/world kits
own simulation, streaming and resource lifecycle. Existing Three.js renderer
and DOM host remain authoritative. No renderer migration or new engine domain.

The longitudinal progress coordinate remains -z, preserving contract gates,
score eligibility and random-access regeneration. These are continuous highway
features, not an arbitrary free-roaming road graph. Branches reconnect to the
trunk; no required jumps or blocked mainline. A seeded district deck plus quiet
straights prevents consecutive high-load features from dominating a drive.

## Acceptance evidence required
Seed coverage; endpoint position/heading/grade/curvature/width continuity;
identical cross-section vertices across cells; actual rendered drive-surface
height; gate reachability; older checkpoint geometry; pruning/reverse recreation;
Campaign unavailable in menu but content retained; skills and abilities regressions;
actual application screenshots, console/network reports and input state changes.

## Actual state — 2026-11-02

Campaign menu change is published independently on main:
`d5c5667126869cfb826e10c5d039b27a6b280d29`. Only `index.html` changed.
Campaign content, geographic routes, save data code and Garage access remain.

Modular road code is implemented locally but **not published**. This is not a
browser-accepted release. Its prerequisites and remaining acceptance are below.

Implemented: ten feature categories; 640 m travel features plus protected 320 m
freight relays; continuous shared position, tangent, grade, curvature and width;
lane taper paint, rejoining paved/gravel alternatives, bridge rails/decks and
covered galleries, structure contacts and a gallery-aware chase camera.
New hauls use generator v2. Checkpoints without a version retain v1; a live
session cannot change its generator version. Campaign code stays unchanged.

Tests passed: existing 16 regression suites plus road geometry and isolated
host-adapter suites. Geometry coverage: 720 chunks, 2,160 seams, deterministic
regeneration, bounded cache, real Three.js road triangles versus physical height.
The host suite uses real Three.js geometry with declared service doubles; it is
not an actual browser or pixel test. Long-road coverage traverses 102.4 km and
319 retained-window changes in deterministic topology tests.

`npm run test:roads:traverse` also passed: 600 simulation seconds / 36,000 ticks
on the actual pinned NexusEngine and truck/freight modules, controlled by a
bounded analog test driver. It drove 13,756.67 m, visited all ten categories,
collected and delivered 14 loads across all five cargo profiles, lost none,
and retained at most 17 edges during 42 window updates. Maximum lateral offset
was 1.737 m. This is physics/lifecycle evidence, not a browser journey, human
playtest, full traffic/ability run, video or real-time GPU benchmark.

Actual browser validation is blocked. Chromium started, but navigation to the
local game returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` before the application
loaded. The browser and local server were closed. No policy changes, alternate
URL tricks, browser substitutions or fabricated screenshots were used.
`npm run validate:roads` is provided for a permitted browser environment. It
checks normal keyboard movement and WebGL pixels, then uses explicitly labelled
endpoint fixtures to inspect distant road families. Its new checks have not run.

Release gate: run that browser validation, visually inspect the generated
screenshots and ordinary driving, verify gallery camera/structure contacts,
branch merge appearance, lane taper traffic and desktop/portrait usability.
Repair any failure and rerun affected regressions before publishing the road
patch. Reconcile current main; do not force-push. Prior 10-minute authored replay
and 60-second highlight deliverables remain separate and are not claimed here.

## Illustrated-highway continuation

The road patch is now integrated into the illustrated-world/HUD candidate on the d5c5667 baseline. The prior browser blocker remains part of its history. Current actual browser and continuous capture acceptance is tracked in `docs/illustrated-highway-release.md`; old physics-only evidence is not re-labelled as rendered acceptance.
