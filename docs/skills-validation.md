# Skill, drift and ability release validation

Validated on **2 November 2026** for **LUM-000154**, using the existing **TLH-001–TLH-009** task structure. The implemented behavior, numerical limits and ownership contracts are documented in [Skills, drifting and abilities](skills-and-abilities.md). The [canonical task tracker](https://docs.google.com/spreadsheets/d/1U5wawNNkQGWvWflfM919RLSzPVvXV4kDzV0akZq6-JA/edit) links the complete evidence archive and publication receipt.

## Release identity

The implementation was reconciled with upstream `main` at **`df2bc70673c6867aa244a9a5a96f2d12bc36776d`**, which already implements continuous freight and physical cargo. The originally proposed `c1b1f195b6b506b8e63ef3a0f3e80da96052b892` baseline was not treated as the current release. The new systems retain the upstream freight lifecycle and the geographic Campaign.

All final browser checks, the uninterrupted freight journey and the skill gameplay recording used the same application source and generated runtime:

```text
Application SHA-256 aggregate
cb6713200e561b6f0df066d4b4c86a4ad17105a618bf64ed4c7cc08d60e4d4f2

Generated vendor/app-runtime.js SHA-256
08bd35bd9e4478ffc93775c60489cd4eae80c46dc55fd07800d0901e0d006151
```

[The source manifest](evidence/skills-source-2026-11-02.json) identifies every application file used by these runs. Its aggregate is SHA-256 over the JSON encoding of sorted `[relativePath, fileHash]` pairs, as produced by `sourceIdentity()` in `tools/validate-gameplay.mjs`. The recorded prepublication Git parent is not a claim that the unchanged upstream commit contains these features. The publication receipt and the canonical task tracker identify the final commit containing this tested content.

## Results

| Validation | Observed result | Evidence directory in the release archive |
| --- | --- | --- |
| Generated runtime | `npm run build` succeeded; static smoke verifies source chunk ordering and runtime generation | Source manifest and test log |
| Deterministic regression suites | **16 suites passed** through `npm test` | `skills-final-tests.log` |
| Skill and ability browser integration | **63 / 63 checks passed** | `skills-final-integration/` |
| Existing game and geographic Campaign browser regression | **49 / 49 checks passed** | `skills-final-gameplay/` |
| Continuous freight journey | **3 deliveries**, one deliberate heavy-load timeout, replacement hazardous load delivered; **3.97 km traveled** (**3.923 km** forward road progress) over **205.667 simulated seconds** | `skills-final-journey/` |
| Skill gameplay video | **60.000 seconds**, all required skill events observed, original game audio, verified H.264/AAC media | `skills-final-video/` |

The browser runs used **Chromium 141.0.7390.54**, Node **24.22.1**, and **Linux SwiftShader software WebGL**. The two final browser suites and the natural journey reported no fatal JavaScript/render errors. The skill suite had no failed network requests; its only rendering warning concerned the optional `KHR_parallel_shader_compile` extension.

### Driving, cargo and damage

The deterministic drift matrix covers **36 combinations** of entry speed, road grip, cargo load and steering magnitude. **28 combinations produced countersteer exits**. Low-speed or weak-steering attempts are allowed to settle without a release; the matrix does not assert that every attempted turn must earn a launch. Separate cases cover full-stop expiration, repeated-activation energy bounds, braking, slopes, pause, frame-rate invariance, collisions and correctable directional damage.

Cargo remains mechanically significant. In the retained cargo regression, the empty truck reaches **15.83 m/s** after three seconds of acceleration versus **9.43 m/s** for the heavy load. Stopping from 28 m/s takes **27.24 m** empty versus **40.21 m** heavy. The same launch produces a **6.21 m** empty apex versus **3.45 m** heavy. These are deterministic scenario measurements, not real-world vehicle specifications.

The skill browser suite crosses a real generated loading gate before testing loaded drift. It observes a keyboard-driven countersteer release, verifies that the completed maneuver cannot award XP again, and verifies that stopping removes the stored release opportunity. Steering damage is applied through the production damage service, changes the pull predictably, remains correctable, and is cleared by a repair pickup or roadside repair. Steering-only repair preserves the existing severe-crash recovery entitlement and emergency-fuel behavior.

### Progression, menus and saves

The progression suite passes 11 scenario groups covering legacy save preservation, malformed data, qualified events, exactly-once XP, level milestones, temporary XP modifiers, prerequisites and costs, deterministic three-choice rotation, ability discovery/replacement, extensive numerical scaling, and receipt-capacity behavior. Existing cash, purchased cash upgrades and earnings survive migration.

The browser suite buys an actual upgrade, observes changed truck parameters and exhaust geometry, and reloads the persisted purchase. It discovers Shockwave, explicitly replaces one slot, re-equips a previously discovered ability, and verifies distinct Q/E slots. Stale offers, unavailable storage, corrupt and legacy saves, and real cross-tab save conflicts are exercised. A dedicated host-boundary regression and four additional real two-driving-tab browser checks verify two active run scopes with both menus open: incoming storage notifications never write, local maneuver receipts survive refresh, same-run receipts merge, and a stale second purchase cannot spend or overwrite the first. Unreadable storage retains in-memory progress and disables spending. The freight suite additionally rejects **32 malformed truck snapshot cases** without rejecting omitted legacy fields.

The full pause proof compares physical state, freight deadlines, fuel/condition meters, scoring windows, weather, pickup effects and ability clocks before and after the menu. They remain unchanged. Opening or closing the menu does not introduce a movement step. Keyboard focus recovery, lost inputs and native touch cancellation are covered. Map and garage now share the simulation-freeze contract; the older statement that their cargo clock continues has been superseded.

Freight reload checks preserve active cooldowns, shield state, steering damage, pickup timers and collection receipts. Traveling Mini Trucks and expanding pulses are intentionally cleaned up at reload while their cooldowns persist. Restored maneuver identities cannot produce another XP award.

### Abilities, pickups and presentation

Mini Trucks hit actual generated breakable obstacles through swept collision detection and clean up after collision, lifetime, distance or streaming limits. Road Shield blocks the paired hull/cargo impact. The acquired Shockwave pushes actual traffic and clears nearby breakables. Q/E activation is rejected during frozen menus, and re-equipping does not reset recharge.

All four generated pickup kinds are tested: Focus, Boost, Ability and Repair. Their observable effects are bounded and use active simulation time. Repair restores hull and steering without restoring cargo or silently buying a permanent upgrade. Collected and retired identities remain unavailable after streaming or checkpoint restoration.

The visual checks include truck component changes, drift/release feedback, ability geometry, steering damage/recovery and reduced-motion behavior. Portrait layouts at **390 × 844** show the driving HUD and stacked, scrollable upgrade cards without covering the controls. Native touch taps activate both abilities, release cancelled multi-touch inputs, open the menu and resume driving.

### Continuous freight and Campaign

The uninterrupted journey uses ordinary keyboard driving with the unchanged production physics: no teleport, cargo-state injection, direct payment call or seeded XP. A fixed simulation clock makes the trace reproducible. It loads standard, fragile, heavy and hazardous cargo; intentionally loses the heavy contract; then collects and delivers a replacement hazardous load. It also observes the risky loading route reward, a ramp launch and clean landing reward.

The journey crosses **13 road revisions** beyond the initial window. Observed resource maxima were **49 active cells**, **7 station hosts**, **280 draw calls** and **13 textures**. Existing contact ledgers, patch cache and road topology remain bounded during this trace. This is a multi-delivery regression, not an hours-long soak test.

The broader browser suite launches the actual geographic Campaign, checks a failure path, reloads, and settles a fresh successful delivery without duplicate payment. Campaign endpoint fixtures are declared in the report and use the real application services. They are separate from the uninterrupted journey and video, which do not use endpoint teleports.

## Playable video

[Watch the 60-second skill gameplay recording](https://drive.google.com/file/d/1dIkMIxCN5WQ2k_ESrfMTUX6uUgGgWQwr/view).

The recording shows input-driven drifting and countersteering, naturally earned XP, an engine-tier purchase, Mini Trucks, Road Shield, obstacle impacts and F recovery. It earns **435 XP**, records **five countersteer releases**, **six ability activations**, **two ability hits**, and **one roadside recovery**, while traveling **1,092.64 m**. Standard cargo remains aboard at the end; the separate uninterrupted journey supplies the completed-delivery evidence.

Media validation confirms **1,800 frames**, **1280 × 720**, **30 FPS**, H.264 video and stereo AAC audio at 48 kHz. The original game audio graph is rendered at the recorded simulation timestamps. There are **1,735 distinct frames**; all **65 repeats** occur during the intentional frozen upgrade-menu interval. Start, event, middle and ending frames were inspected.

```text
Video SHA-256
09afb9fcd97a566b4ea8ba31b8299cd3dcd429b0b8853bc50b99d96e5b44fc3f
```

The capture advances the original browser frame loop by exactly 1/30 second for each frame. It demonstrates observable gameplay and continuity; its encoded frame rate does not measure real-time rendering throughput.

## Performance

The release comparison uses a clean archive of `df2bc70673c6867aa244a9a5a96f2d12bc36776d` and the tested current source. It runs each build sequentially with other browser captures closed, at low quality, 1280 × 720, DPR 1, with a five-second warmup and two twenty-second wall-clock phases. Native `requestAnimationFrame` and `performance.now` remain intact. The current-build second phase uses Q/E; the baseline has no equipped-ability system. The retained reports include complete-frame CPU distributions, engine phase timings, renderer resources, heap samples and input history.

Two matched pairs were retained to investigate the initial tail-time increase:

| Pair / phase | Baseline CPU p50 / p95 | Skills CPU p50 / p95 | Baseline → skills delivered FPS |
| --- | --- | --- | --- |
| 1 / cruise | 12.7 / 22.5 ms | 15.7 / 25.2 ms | 10.62 → 10.44 |
| 1 / ability input | 14.3 / 24.8 ms | 17.6 / 31.8 ms | 10.55 → 10.27 |
| 2 / cruise | 12.9 / 24.6 ms | 15.3 / 29.3 ms | 10.75 → 10.49 |
| 2 / ability input | 13.9 / 25.6 ms | 16.9 / 29.6 ms | 10.56 → 10.31 |

The new features add measurable work: median complete-frame CPU time increased **2.4–3.0 ms during cruise** and **3.0–3.3 ms during ability use**. The ability-phase p95 increase ranged from **15.6% to 28.2%**. The additional `skillsGameplay` phase measured **0.4 ms median**, **0.65–1.01 ms mean**, and **4.2–4.5 ms p95**. The initial simulation-tail spike did not reproduce consistently: the repeated ability phase measured 2.9 ms simulation p95 for skills versus 3.5 ms baseline. Renderer stalls occurred in both builds; the reports do not assign those stalls to a single cause.

Resource samples remained bounded: peak geometries **126 versus 124**, textures **12 in both**, and shader programs **24 versus 23**. These samples observed at most five pickup meshes and three active Mini Trucks. Used-heap peaks were approximately 109.9 MB for skills and 122.7 MB for baseline, but garbage-collection timing prevents treating that difference as a memory improvement.

**Both builds deliver about 10 FPS in this shared SwiftShader environment.** The measured 1088 × 612 drawing buffer follows the low-quality setting. These measurements establish the observed software-renderer cost and resource bounds; they do not establish a physical-GPU frame-rate budget.

The four investigation runs above identify the prepublication source `e109f6361ea3a32bfd77e2e9da9d0a1247d9f916c47a1ab6b8a9333b55cdc7f1`. A subsequent correction makes cross-tab career refresh read-only; it does not change the frame, simulation or ability algorithms. The final-source confirmation is recorded separately below so the earlier measurements are not relabeled as a later revision.

The final-source confirmation measured the exact `cb671320…e4d4f2` application after all other browser runs closed. It used the retained second baseline with matching settings:

| Final phase | Baseline CPU p50 / p95 | Final CPU p50 / p95 | Baseline → final delivered FPS |
| --- | --- | --- | --- |
| Cruise | 12.9 / 24.6 ms | **16.4 / 30.1 ms** | 10.75 → **9.94** |
| Ability input | 13.9 / 25.6 ms | **18.0 / 31.2 ms** | 10.56 → **9.34** |

This final sample is slower than the earlier samples: CPU p95 is **22.4% / 21.9%** higher than the retained baseline, and delivered throughput is **7.6% / 11.6%** lower. Its original results are retained without substitution. The new skills phase remains 0.4–0.5 ms median; render CPU p95 is 9.1 / 10.9 ms. Peaks remain **126 geometries**, **12 textures**, **24 programs**, **5 pickup meshes** and **3 active minis**. Sampled used heap peaks at approximately 117.14 MB. There are no fatal application, console or network errors, and browser/server cleanup completed.

Performance status is **measured, with target-hardware acceptance open**. The code adds observable CPU/rendering cost. This short shared-host measurement cannot attribute run-to-run variation to individual code paths, process scheduling, first-use rendering or other host effects. Application source remained fixed throughout this confirmation. The complete native-clock traces are in `skill-perf-final/performance-report.json`; the investigation and the four preceding reports remain in the archive.

## Reproduction

```bash
npm ci
npm run build
npm test
npm run validate:skills -- --output=.cache/validation/skills-final-integration
npm run validate:gameplay -- --output=.cache/validation/skills-final-gameplay
node tools/record-freight-gameplay.mjs --journey-only=true --output=.cache/validation/skills-final-journey
npm run record:skills -- --output=.cache/validation/skill-gameplay
```

Browser tools require a working Chromium installation and its graphics libraries; the recording additionally requires FFmpeg/FFprobe. The geographic Campaign needs its normal network endpoints. This sandbox's Campaign run explicitly trusted its installed proxy certificates through `LONG_HAUL_SANDBOX_CA_FILES`; TLS checking was not disabled globally. Use the trust configuration appropriate to the environment.

The performance commands and baseline archive instructions are in [the architecture reference](skills-and-abilities.md#validation-entry-points-and-evidence-boundary). Reports retain source identity, setup fixtures, actual input/state traces, cleanup and error evidence. Failed development runs are not substituted for the final passing directories listed above.

## Remaining assessment boundaries

- **Human handling and balance:** automated evidence proves the mechanisms and safeguards. A person has not signed off the feel of the drift, upgrade pacing, encounter density or long-session balance.
- **Representative hardware:** software rendering in this shared Linux environment does not certify MacBook GPU performance, Safari, thermal behavior or a target hardware frame-rate budget. Prior upstream cross-browser results are not claimed for this release.
- **Native finger scrolling:** the CDP driver failed to pan even a minimal plain-HTML scroll fixture. Overflow and access to every card/loadout control were verified with a real wheel event, and native touch taps/cancellation/resume passed. Actual finger panning remains a physical-device check.
- **Production assets:** procedural vehicle/effect geometry is intentional. Final LUM-000162 assets and their final collider review remain separate work.

No critical application regression was found in the final automated runs. These remaining assessment boundaries stay visible in the existing tracker; this release does not close the broader company outcome or the separate art initiative.
