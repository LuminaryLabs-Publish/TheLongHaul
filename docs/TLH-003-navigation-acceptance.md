# TLH-003 — Navigation and player guidance implementation checkpoint

Parent: LUM-000154 / TLH-003. Related tasks: TLH-245, TLH-246, TLH-252.

## Implemented in this candidate

- `src/game/navigation-guidance.mjs`: bounded, read-only guidance derived from existing truck, run, freight and signed road-choice state; correctly prioritizes rollover/wheel-lift, fuel, damage and cargo deadlines over routine rewards. Missing or contradictory sign direction is not silently accepted. Unknown target distance is not reported as zero. Duplicate event keys are bounded in memory.
- `src/app/guidance-v2.js`: minimal Alternative B interface; four quiet edge groups, contextual sign guidance, one visible warning/reward at a time, ability actions via existing controls, and map header aligned with the same guidance state. The original driving HUD is visually suppressed only when V2 is active. `?presentation=v2` enables the unaccepted candidate. The default preserves the existing V1 presentation until filmed/human acceptance and an explicitly approved cutover.
- `src/app/bootstrap.mjs`: loads V2 guidance only after the existing game, road and presentation hosts, before unlocking dispatch. No new simulation loop, gameplay state owner or saved data.
- `styles.css`: flat text with compact meters and Q/E controls; desktop and portrait positioning; no tilted boxes; reduced-motion transitions disabled.
- `tests/navigation-guidance-regression.mjs`: alert priority, event de-duplication, route/sign disagreement, no invented zero-distance, legacy fallback hook, no gameplay state mutation.

## Validation — do not overstate

- Exact sources include the current committed vendor runtime unchanged. Existing 21 local legacy regression suites passed on a Pages-source snapshot, plus new navigation guidance tests and `node --check` on both updated host scripts. The road-choice feature was already published in an earlier commit; new guidance model also uses those current route/sign metadata fields.
- `node tools/build-runtime.mjs --reuse-vendor` passed and preserved pinned NexusEngine and Three.js versions.
- **Video reviews NOT performed.** Local Chromium navigation was blocked with `net::ERR_BLOCKED_BY_ADMINISTRATOR` before page load even for localhost, file and data URLs. This sandbox cannot provide honest rendered browser frames or the three required ten-minute review recordings. Do not label any video pass as tested, watched or accepted.
- **Human/mobile/device acceptance NOT performed.** CSS and state-level tests do not prove legibility in the actual game. V2 still uses the old app host under its presentation adapter; full isolated TLH-252 scene ownership is a separate architecture gate.

## Remaining task gates

1. In an allowed browser, run the game with `?presentation=v2` and the unchanged default V1, capture a full continuous 600-second input-driven source at 30fps with synchronized original game audio, plus event logs and matched desktop/portrait screens. Preserve all event-state and image evidence. Do not inject truck positions, cargo, score, or forced weather.
2. Video cycle 1: watch entire source at normal speed, identify exactly three real navigation comprehension defects with timecodes, plan and implement them, rerun affected tests, then record the next candidate.
3. Cycle 2: watch revised source, choose three legibility/timing/overlay defects, implement/verify, and record a new candidate.
4. Cycle 3: watch revised source plus different seed and resume/error scenarios, choose three conflicting-state/urgency defects, implement/verify, then capture the **final** candidate again for acceptance.
5. Verify physical Safari and mobile touch, real-time FPS, input focus, menu freeze and no duplicate payouts; produce the 60-second edit from final accepted footage only. Keep original Campaign content and the single unchanged `.github/workflows/deploy-pages.yml`.
6. Preserve task state **In Progress** until filmed, live-rendered and human acceptance completes; do not automatically call TLH-003 Done or push a release claim based only on static tests.
