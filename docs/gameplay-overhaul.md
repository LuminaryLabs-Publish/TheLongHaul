# Gameplay feel and flow overhaul

Authority: LUM-000154. Baseline main: `d179facfb127ddedb91a3a6225af03b37f191324`.
Scope: `LuminaryLabs-Publish/TheLongHaul` and its existing Google Drive project.
The five approved decisions in the 2026-11-02 request supersede older restrained-feel tuning.

## Source audit

- The browser bootstraps 18 ordered global script chunks, pinned Three.js 0.165.0 and NexusEngine `b941c9b2995e3449c6987908657753e2cf2df242`. `tools/build-runtime.mjs` produces the committed runtime. Product kits own the truck, run, course and delivery; Core owns clock, resources, camera, world and transaction ledger. No engine repository changes are required.
- Startup has a separate 3.6-second credit overlay, dispatch selection, staged world preparation, then an immediate rolling launch. There is no in-world launch cinematic.
- The truck has substeps, separate support and articulated mesh, steering, braking, weak held boost, a five-second double-tap rush, impacts, tipping and one roadside recovery. Suspension integrates its force twice; airborne motion applies ground forces. Returning from some menus can leave input or timing inconsistencies.
- Campaign and procedural freight runs share deliveries, damage, cash, ten upgrades and four fleet choices. Preserve route selection, real geographic routes, unavailable-route behavior, transfers and save validation.
- Traffic currently follows truck-relative offsets and awards loose passes. It can move past a stationary truck; it has no explicit combo. Existing scenery hazards are mostly static and do not provide a paced stunt/destruction/event loop.
- Streaming already uses desired-cell/direction keys, worker preparation and bounded realization. Reuse it. Existing tests cover engine/product contracts, course invariants and static runtime packaging; actual rendered evidence is required in addition.
- Drive has an existing tracker but no current handoff. Historical repository audit files predate the current source and are evidence of prior work, not current acceptance.

## Execution outcomes

### 1. A responsive, substantial rig that can jump, crash and recover

Maps to TLH-004, with TLH-003 guidance and TLH-008 contracts.

Included: acceleration, high-speed steering, bounded boost recharge, ballistic air control, landing telemetry, stable contact/presentation, impact reaction and repeatable paid recovery. Excluded: replacement physics engine, new vehicle assets, engine changes.

Dependencies: truck dynamics profile, truck kit, host input, upgrade tuning, ground sampling, impact handlers, run resource meters and camera smoothing.

Boundaries: product-owned physics and host presentation. Keep public reset/input/teleport/snapshot contracts and existing fleet upgrades. Recovery must not create free fuel/cash, count teleport distance, or erase earned deliveries.

Complete when: steering alone remains stable; deliberate launch produces an airborne arc and measured landing; acceleration/boost visibly change speed; a severe impact has a readable consequence; recovery returns control with a cost and no stale input.

Proof: deterministic physics/boost checks plus actual driving, jump, collision and recovery frames with state snapshots.

### 2. An integrated launch and immediate, resilient navigation

Maps to TLH-007 and TLH-003.

Included: a brief actual-scene camera intro, returning-player shortening, skip on drive input, fast CSS transitions, explicit input release/focus, pause/map/garage/retry safety and responsive layout. Excluded: rebuilding Campaign map or inventing geographic road data.

Dependencies: outcome 1, scene service, generation readiness, input lifecycle, camera target, settings, existing dispatch/Campaign/garage UI.

Boundaries: existing scenes remain authoritative. Intro must not consume delivery time, score, damage or player position; it must blend into the same truck/camera and release control immediately when skipped. Multiple requests cannot queue contradictory scene transitions.

Complete when: first and repeat launches are visibly integrated; skipping works; rapid pause/resume/settings/map/garage/retry actions converge; delivery and Campaign navigation stay reachable; reduced motion and supported viewport layouts remain usable.

Proof: browser clicks/keys, screenshots at desktop and small display sizes, scene/input/timer assertions and actual intro video.

### 3. Understandable risk, banked rewards and meaningful crashes

Maps to TLH-006, TLH-005 and TLH-003.

Included: near-miss and clean-stunt events, a visible timed combo/multiplier, safe banking, crash loss of unbanked points, feedback and settlement into the existing economy. Excluded: replacing delivery scoring, unlimited passive income, new account services.

Dependencies: outcome 1 landing/impact telemetry, real traffic positions, run state and existing cash/save settlement paths.

Boundaries: stable event IDs, minimum forward speed, spatial clearance and one award per encounter; no rewards while paused, reversing, shopping, replaying an event or teleporting. Bank once; completed/failed runs settle once. Preserve prior saved fields and invalid-save refusal.

Complete when: player can explain multiplier/pending/banked amounts from HUD; a qualifying pass or landing increases the combo; inactivity banks it; a crash removes pending points while preserving banked rewards; retry and save/reload do not duplicate payouts.

Proof: adversarial deterministic scoring cases, browser HUD/collision/bank observations, delivery/failure/garage persistence checks.

### 4. A varied, readable highway and verified delivery

Maps to TLH-001, TLH-002, TLH-005, TLH-008 and TLH-009.

Included: independently moving traffic, optional ramps and bypass opportunities, breakable roadside props, dynamic roadblocks, changing weather and an encounter director with warning/recovery spacing. Integrate and tune all prior outcomes, then validate the finished source and record 60 seconds of actual gameplay.

Dependencies: outcomes 1–3, deterministic course samples, road geometry/colliders, streaming ownership, bounded visual pools and existing alternate routes.

Boundaries: seeded, capped encounters; preserve a usable escape lane and destination/garage access; spawn ahead with reaction time; no obstacle pileups at intersections or startup; no one-frame spawning on the truck. Reuse procedural assets; LUM-000162 stays intact.

Complete when: long driving presents distinct readable encounter windows and recoveries, supports actual ramp jumps/destruction/weather feedback, keeps input responsive and bounded object counts, and preserves the full delivery/garage/progression/next-run loop.

Proof: existing and new deterministic tests, generated-runtime checks, actual browser input/state/render validation, performance samples, complete diff review, a real 60-second MP4 with ffprobe metadata and inspected start/middle/end frames.

## Validation and delivery gates

All approved gameplay changes are implemented before the consolidated runtime validation pass. Repair concrete failures and rerun affected gates. Use the render-in-sandbox guidance: this game depends on browser DOM, CanvasTexture and GLSL, so the guide's browser/WebGL path is the faithful full-app route. A headless substitute scene would not establish playable-game acceptance.

1. Build the actual source and run existing/new deterministic tests.
2. Run the actual local page: launch → intro → drive → traffic/hazards → boost/jump → crash/recover → score → delivery → garage/progression → next run. Also cover pause/map/settings, rapid input, reduced motion and display sizes.
3. Inspect actual rendered frames and capture 60 seconds of continuous gameplay. Retain renderer, input method, media metadata, state snapshots and limitations.
4. Re-read remote main, review complete diff, reconcile any concurrent changes and publish by a normal fast-forward to existing main. Never force-push or bypass protections.
5. Read back the published SHA and synchronize the existing project tracker and a concise handoff with real evidence/status.

Human feel/balance review and target MacBook performance are distinct from sandbox validation. TLH-009 also depends on the separate final asset library; do not close that broader task or LUM-000154 without its remaining acceptance. The companywide ticket register is outside the allowed file boundary, so material LUM-000154 progress is recorded within the project.

## Guide authority

- Workflow: https://docs.google.com/document/d/1IHJwrSx_gIjRYud32EloATFkfj-mK8pZTR3lR02xEmI/edit
- Outcome tasking: https://docs.google.com/document/d/16UYFNdNdXuLNpPXB9eXg7tb0lpXY9Z3eQooc2csde8o/edit
- Contextual decomposition: https://docs.google.com/document/d/1XUD-PBFQByp6Ly7CS0ZW3us615YDM8KR-o9IvD_oFF8/edit
- Game development: https://docs.google.com/document/d/1GhhV72ZWU8s4b3G6ggbgVMhI7I7KKxlzQXyhOScuyOM/edit
- Project art direction: https://docs.google.com/document/d/1tak-Yk1QCVyfGOJnmWiNFzjF6aOX0c6hlsINdhJiBQY/edit
- Existing tracker: https://docs.google.com/spreadsheets/d/1U5wawNNkQGWvWflfM919RLSzPVvXV4kDzV0akZq6-JA/edit
