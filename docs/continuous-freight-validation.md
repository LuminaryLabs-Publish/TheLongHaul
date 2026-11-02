# Continuous freight — release validation

Authority: **LUM-000154**, approved Remaining Implementation Master Plan. This record covers the continuous-freight implementation built on the earlier five-decision gameplay overhaul. The [outcome plan](continuous-freight.md) maps work to the existing TLH-001–TLH-009 tasks. No replacement tracker or asset-production tickets were created.

## Exact application

Validation uses the actual local Three.js/NexusEngine application, including generated runtime, DOM, WebGL, real truck physics and ordinary player controls. The working tree is based on `c1b1f195b6b506b8e63ef3a0f3e80da96052b892`; its final application SHA-256 aggregate is:

`b8267fade8a3855e68ed485e44f3c473baa1daa12ac85483ca51db2aa8bcd5e9`

The evidence contains the individual file hashes. The final GitHub commit, CI result and deployment readback are recorded in the project handoff and existing tracker after publication. NexusEngine remains pinned to `b941c9b2995e3449c6987908657753e2cf2df242`, Three.js to 0.165.0. Their bundled bytes and upstream repositories are unchanged.

## Implemented player outcomes

- **A continuing highway and haul.** Road topology regenerates ahead and retires behind the truck. Pickups, onboard freight, receivers, delivery pay, cargo loss and replacement all operate inside one driving session. Cargo loss forfeits that contract; truck destruction remains a terminal failure.
- **Five physical loads.** Standard, fragile, heavy, hazardous and unstable cargo change actual mass, acceleration, stopping, steering/yaw response, suspension, airborne response or load-shift/damage behavior. Loading and unloading preserve current movement.
- **Readable moving choices.** The wide loading route is on the left; the narrower express shortcut is on the right. Swept gates require a valid forward, grounded pass. Missed pickups relocate ahead; a missed receiver gets one readable retry before forfeiture. Visual receivers move with their new logical location.
- **Risk with evidence.** A clean express approach and exit can add combo value. Crashes threaten unbanked points; qualified recovery has a finite opportunity and cannot be repeated to farm points. Rewards use stable identities and new forward progress.
- **Pacing and continuity.** Traffic, ramps, destructibles, roadblocks, weather and quieter intervals retain the arcade foundation. Loading approaches stay clear. Difficulty and warning/spacing adapt to distance and load capability.
- **Preserved progression.** Paid fuel, repairs and upgrades retain the checkpoint and wallet atomically. Resume keeps the same journey. Campaign keeps geographic routes and receipt-based settlement, adds a usable Hawaii road haul and explicit reward-free shipping, and handles unavailable, corrupt or conflicting storage.

## Automated verification

`npm run build` synchronizes the static runtime. `npm test` runs 11 suites covering the engine/product contracts, existing game loop, vehicle feel, score, encounters, endless topology, cargo physics, freight lifecycle, freight scoring, Campaign policy and static shell. The final gate log is retained in the evidence package.

Substantive regression evidence includes:

| Area | Verified behavior |
| --- | --- |
| Road lifetime | 102.4 km of generated travel, 319 window changes; at most 16 edges, 13 nodes and four station descriptors. Retired roads reconstruct identically. |
| World continuity | Matching surface and patch descriptors across window changes; one worker updated in place; bounded horizon roots checked beyond one million metres. |
| Reverse resume | A checkpoint 2 km behind the start prepares the correct road and terrain immediately, with no forward-progress credit. |
| Existing geometry | 24 finite-generation seeds, fallback, bypass clearance and full truck footprint around roundabout islands. |
| Contact lifetime | 2,002 contact operations prune to 256 while retaining current-contact and rollover protection; Campaign payment history remains separate. |
| Real cargo dynamics | After three seconds, empty/light/heavy speed is 15.83/14.57/9.43 m/s. Stopping from 28 m/s takes 27.24 m empty and 40.21 m heavy. The same launch reaches 6.21 m empty and 3.45 m heavy. These are controlled test conditions, not universal balance guarantees. |
| Contract integrity | Three deliveries and one loss in the deterministic lifecycle trace; wrong-direction, airborne, zero-time and teleport crossing rejection; bounded receiver retry; no duplicate payout. |
| Save integrity | Stale/conflicting/inactive-session writes rejected; 71 retained session receipts prevent replay. Twenty-two malformed truck snapshot cases reject before restore, while actual default/airborne/landed and supported legacy snapshots remain usable. |
| Score integrity | Whole-route eligibility, one recovery opportunity, crash/timeout cancellation, pause behavior and bounded history over 196 legs. |
| Campaign integrity | 33 corrupt-save cases; unknown freight fields preserved; 100 shipping transfers without reward farming; real-road adapter and module syntax. |

## Actual browser validation

| Runtime / scope | Result |
| --- | --- |
| Chromium 141, complete gameplay flow | **49/49 passed** on the exact final source. Intro, keyboard physics, menus, boost, near miss, ramp/landing, scoring, destruction/recovery, weather, garage, purchase, save/resume/new session, touch/layout and Campaign receipt paths. |
| Firefox 157 on Linux | **9/9 passed** on the exact final source: real rendering, freight, movement, fork directions, map, pause/resume, toast placement and no fatal errors. |
| Playwright WebKit 27.2 on Linux | **9/9 passed** with the same exact-source scope. This is engine coverage, not native Safari certification. |
| Focused garage/service/persistence | **8/8 passed**; supplementary source deltas retained. |
| Focused physical gates/retry/replacement | **7/7 passed**; supplementary source deltas retained. |
| Render-in-sandbox guide checks | **Passed** for final gameplay and final video evidence. |

The focused receiver and garage checks use declared endpoint/resource fixtures to reach specific edge cases efficiently, then exercise the real input, gate, renderer, service button, storage and reload paths. Campaign receipt tests also declare endpoint setup. Their fixtures do not establish natural travel coverage; the uninterrupted journey below does.

Campaign edge coverage separately passed **10 scenarios / 37 checks**: actual fleet preview and exact purchase costs, free CA↔HI shipping, live Kahului→Kihei routing, unavailable-road retry, failed handoff storage, Back cancellation, corrupt/read-only/conflicting saves, credits and fullscreen. The live Maui response contained **235 coordinates over 16,420.5 metres**. Its earlier full run and targeted fullscreen retest are retained with source differences documented; the Campaign source/policy/geographic-route files stayed unchanged through later freight and presentation repairs.

## Continuous journey and 60-second edit

The final source journey ran for **205.6 simulation seconds** in one unchanged session, reached **3,923.01 m of highway progress** (**3,971.51 m actually driven**), completed **three deliveries**, deliberately lost **one heavy load to its deadline**, and loaded standard, fragile, heavy and hazardous cargo. Actual ramp launch, landing, clean-landing score and express-route completion are present in the trace. The truck remained usable and the replacement cargo was delivered. The journey earned **$1,912**.

The inspected MP4 is **60.000 seconds, 1280×720, 30 fps, H.264/AAC**, with **all 1,800 rendered frames distinct**. Its SHA-256 is `2843ac841a9757747aad65caf9854ec598399816c68241d8c4d1f727dd6eeee9`. Peak retained resources in that run included 81 active cells, 104 cached patches, 291 draw calls, 187 geometries and 13 textures; streaming pending requests returned to zero. These are this run’s software-rendering observations, not native performance budgets.

Root and the capture reviewer inspected encoded extracts at 0, 4, 8, 16, 17.4, 24, 34, 44, 52 and 59.5 seconds, covering the intro, boost, loading choice, airborne loaded truck, delivery, express route, deadline loss and hazardous replacement.

The capture method follows the sandbox rendering/recording guides. It advances the application by exactly **1/30 second for each selected output frame**, then screenshots the freshly rendered WebGL and DOM. The seven edited intervals use the same continuous source session. The game’s original Web Audio graph is rendered offline on the same simulation clock, and audio uses the identical selected intervals with 4 ms edge fades. This avoids duplicated frames when software rendering takes longer than the output frame duration.

Setup selects a deterministic seed and normal game settings. A scripted driver reads the actual route/state and sends ordinary keyboard events for movement, steering, braking, boost, recovery and camera changes. The video does not teleport the truck, inject score/cargo, change physics or substitute another scene. The package retains the uninterrupted input/state trace, transition history, cut boundaries, per-frame simulation times/hashes, source identity, renderer evidence, console output and media probe.

## Repairs retained in the validation record

The final pass repaired concrete defects rather than accepting a successful build as sufficient: absolute loading-zone exclusions; stable garage identities/positions as road windows advance; receiver visuals following retries; unavailable-audio resume rejection; portrait HUD overlap; correct fork, ramp and roadblock directions; a menu toast covering the results heading; a broken local Nexus attribution target; reverse-position road initialization; and malformed saved truck dynamics.

Test-harness races were fixed separately: asynchronous fullscreen updates, queued truck teleports, intro/near-miss simulation time under software rendering, and accidental boost double-taps in the capture driver. Historical failed runs remain labeled as superseded; they are not reported as successful final runs.

## Evidence and continuation

- [Inspected 60-second gameplay video](https://drive.google.com/file/d/1WwSMQESspV6DDrAPrcG_iVo51jbjBl3m/view)
- [Validation package: reports, traces, images and source/frame manifests](https://drive.google.com/file/d/17sqh2MidoMtQ_ywCd2TJFMbq7W8C2Sw_/view)
- [TheLongHaul evidence folder, including publication verification](https://drive.google.com/drive/folders/18wq31YEuhDvYfNFol9IWSlIQdcleMuQp)

The existing [TheLongHaul Task Tracker](https://docs.google.com/spreadsheets/d/1U5wawNNkQGWvWflfM919RLSzPVvXV4kDzV0akZq6-JA/edit) records actual outcomes, commit references, validation evidence and next actions. The [project handoff folder](https://drive.google.com/drive/folders/1oDSlL1zcPp6LIkqBTjG6U8s1qn5wiPJa) contains the release handoff. LUM-000162 and its asset rows remain intact. The company-wide register is outside the permitted TheLongHaul write scope; material LUM-000154 progress is recorded in this project’s authoritative tracker/handoff.

## Acceptance boundaries

The available browser runtimes run on Linux with software rendering. They establish functional/rendering behavior for those runtimes, not physical MacBook performance or Safari acceptance. Fixed-step 30 fps media is an output-timing guarantee, not a claim that the sandbox rendered in real time. Actual target-hardware frame-time, memory and quality-setting measurements remain necessary.

Human playtesting should judge high-speed steering preference, cargo differences, express-route clarity, crash/recovery cost, deadline/economy balance and encounter fatigue over longer sessions. Final LUM-000162 production assets remain a separate integration/acceptance dependency. These broader tracker criteria remain open; the implemented remaining gameplay plan and verified release must not be conflated with final asset or human-fun acceptance.
