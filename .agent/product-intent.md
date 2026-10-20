# The Long Haul product intent and cleanup brief

**Recorded:** 2026-10-16

**Authority:** User-provided local development handoff and the user's request below

**Status:** Intent captured; implementation review and cleanup are later work

## Performance review and rolling launch, 2026-10-19

**User wording, preserved verbatim:**

> Epxlain every performance issue. be hyper critical and then look through the nexus engine to see if we are implementign anyting in away tha tmake the perfomacne super bad on a macbook pro. It shoudl aos have a boost to start so the truck starts at 50% of it defualt speed.

**Cleaned-up version of the same request:** Explain every performance issue and be highly critical. Inspect Nexus Engine to determine whether our integration is causing very poor performance on a MacBook Pro. Also add a starting boost so the truck starts at 50% of its default speed.

**Interpretation and scope:** Audit the current game and the exact imported Nexus Engine revision, measure available CPU/GPU/frame costs on this MacBook Pro, and document ranked findings with evidence and limits. Implement a rolling start on fresh drives and retries at half the truck's configured normal maximum forward speed, including the selected Campaign vehicle and purchased upgrades. This is an initial velocity, not permanent acceleration or the Shift boost. Apply ordinary drag, braking, acceleration and collisions immediately afterward. Preserve pause/resume and recovery behavior. Keep the broader performance changes as audit recommendations for the later cleanup.

**Evidence:** Detailed findings and measurements are in `performance-audit.md` and `performance-audit/` beside this ledger. Runtime validation is recorded there separately from source-derived risks.

## User request, preserved verbatim

> ok run it lcoally I want to work wher ei reues ta change you infer intnet and update a document int he .agent folder then later I will have you go through evyeing and clenaup the whole app bease don the intent there. please dont miss any detials nad save a clenaed up, but unchnages verison fo thepmropt si send

## Cleaned-up version of the same request

Run the app locally so I can work with you and request changes. Infer my intent from each request and update a document in `.agent`. Later, review the whole app and clean it up based on the intent recorded there. Preserve all details. Save both this original wording unchanged and a cleaned-up version of the request.

## Interpreted working agreement

- Start and keep the app available locally for collaborative work.
- Treat the supplied development handoff as the current product-direction brief.
- As the user requests changes, infer the intended outcome from their words and relevant app context, then record the accepted intent and any decisions in this file before or while implementing those changes.
- Keep the exact original request text above. Add cleaned-up wording without silently changing what the user asked for.
- The user plans a later whole-app review and cleanup based on the accumulated intent here. Do not treat that future cleanup as authorization to make broad changes now.
- For future cleanup, preserve the established one-driving-engine architecture unless new user direction changes it. Prefer the smallest coherent work that advances the playable core loop.
- Distinguish reported/implemented code from behavior actually verified in a browser. The handoff explicitly says its feature list is not proof of correct operation.

## Product direction from the supplied handoff

The game is moving from a small procedural trucking simulation toward a 3D American highway arcade game inspired by *Earn to Die*. Its core loop is:

**Choose a route → drive through traffic → finish or run out of fuel → earn money → upgrade the truck → drive farther.**

The American Campaign supplies route selection and progression. The existing NexusEngine-powered driving game remains the single driving engine. Three.js presents vehicles, terrain, traffic, cameras, and scenery. Real geography determines highway alignment; procedural generation supplies the surrounding world.

### Reported existing work, still requiring local verification

The supplied handoff reports these code changes on GitHub `main` at `0136977e61` (October 16, 2026):

- Retained the NexusEngine and Three.js truck simulation.
- Added an American map, route selection, state progression, and career saving.
- Converted OSRM-derived roads into playable 3D courses.
- Added a Newark-to-Philadelphia route with one receiving destination.
- Added spatial road indexing, local terrain queries, reduced terrain density, less distant-world construction, and rendering-performance changes.
- Added procedural traffic, collisions, driving bonuses, fuel consumption/progression, upgrades, failed-run payouts, and a garage with truck preview and upgrade controls.
- Added title-truck animation, traffic silhouettes, and an arcade HUD; retained Classic Mode separately.
- Fixed the garage animation loop and added smoke-test coverage for 18 runtime chunks.

These are reported implementation facts from the handoff, not claims that the features work correctly together in the browser.

### Priority order

**P0: Prove the core experience**

1. Confirm the game boots and previews load.
2. Complete a drive → earnings → garage → upgrade → retry loop.
3. Fix runtime errors, freezes, and major frame-rate drops found during that work.

**P1: Improve the experience after the loop works**

- Make steering, acceleration, braking, and collisions feel more arcade-like.
- Polish truck models, traffic vehicles, and the 3D garage.
- Remove unnecessary text and old hidden-depot UI from Campaign Mode.
- Improve buildings, forests, highways, sky, and atmospheric effects.

**P2: Expand the game**

- Add reliable offline geographic routes.
- Add gas stations, truck stops, and optional refueling.
- Expand the highway network toward all 50 states.

Larger terrain patches, terrain roughly ten times simpler, greater draw distance, and around 1,000 camera-relative fog particles are design targets from the handoff, not confirmed completed features. Reassess them against observed performance and the core game direction before implementing.

### Suggested local validation sequence

The handoff's seven checks are proposed, not completed:

1. Run the game locally and capture console errors.
2. Check the main menu and garage truck previews.
3. Start the New Jersey-to-Pennsylvania campaign.
4. Drive through traffic and verify fuel depletion.
5. Check earnings, upgrades, and saved progress.
6. Measure frame rate and address the largest performance problems.
7. Polish visuals and remove unnecessary UI text.

The milestone is reliable launch, drive, earn, upgrade, and retry. Visual polish and content expansion follow that proof.

## Current local session record

- Repository: `LuminaryLabs-Publish/TheLongHaul`
- Branch and starting state: `main`, clean working tree at `0136977e61`.
- Local URL: `http://127.0.0.1:4173/` (static server; campaign page is `http://127.0.0.1:4173/campaign.html`).
- The repository has no development-server script in `package.json`; it defines `npm test` only.
- The app imports Three.js, NexusEngine, map data, and mapping libraries from remote CDNs, so full behavior depends on network access.
- The server being started proves only that local files are served. Browser boot, previews, the complete campaign loop, console health, and performance remain unverified until interacted with in a browser.
- The initial intent capture made no application-code or visual-design changes. A later accepted 16:9 display decision is recorded below with its implementation scope and evidence.

## Source handoff, preserved verbatim

# The Long Haul — Local Development Handoff

&#x20;GitHub main updated

Repository: [LuminaryLabs-Publish/TheLongHaul](https://github.com/LuminaryLabs-Publish/TheLongHaul?utm_source=chatgpt.com)

Latest commit: `0136977e61` — October 16, 2026

## Summary

We've been turning The Long Haul from a small procedural trucking simulation into a 3D American highway arcade game inspired by Earn to Die.

The core idea is now:

Choose a route → Drive through traffic → Run out of fuel or finish → Earn money → Upgrade your truck → Drive farther.

We've already made substantial changes to the engine integration, campaign, performance, garage, and presentation. However, the biggest remaining job is making the whole experience feel like one polished, reliable game.

## 1. What's already been implemented

| System              | Work completed in GitHub                                               |
| ------------------- | ---------------------------------------------------------------------- |
| 3D driving          | Existing NexusEngine + Three.js truck simulation retained              |
| American Campaign   | US map, route selection, state progression, and career saving          |
| Geographic highways | OSRM-derived roads converted into playable 3D courses                  |
| NJ → PA route       | Newark-to-Philadelphia endpoints and a single receiving destination    |
| Performance         | Spatial road indexing, local terrain queries, reduced terrain density  |
| Rendering           | Shadows, antialiasing, and tone mapping disabled; pixel density capped |
| World streaming     | Reduced unnecessary distant-world construction                         |
| Arcade traffic      | Initial procedural traffic, collisions, and driving bonuses            |
| Fuel progression    | Additional consumption, upgrades, and failed-run payouts               |
| Garage              | 3D truck preview, purchases, and upgrade controls                      |
| Presentation        | Animated title truck, improved traffic silhouettes, and arcade HUD     |
| Classic Mode        | Original delivery experience retained separately                       |

The latest commits also include fixes to the garage animation loop and smoke-test coverage for all 18 runtime chunks.

These are implemented code changes, not confirmation that every feature works correctly in the browser.

## 2. The architecture we've established

American Campaign

Map • Garage • Routes • Upgrades • Career

NexusEngine Gameplay

Truck simulation • Input • State • Delivery • Progression

Three.js Presentation

Vehicles • Terrain • Traffic • Cameras • Scenery

The important decision was to keep one driving engine. The American Campaign supplies the route and progression, while the existing NexusEngine-powered game handles driving.

We also decided that real geography determines highway alignment, while procedural generation fills the surrounding world.

## 3. What's still unfinished

These are the main things to address during local development.

| Priority | Remaining work                                                             |
| -------- | -------------------------------------------------------------------------- |
| P0       | Confirm the game boots and all previews load                               |
| P0       | Complete a full drive → earnings → garage → upgrade → retry loop           |
| P0       | Fix any runtime errors, freezes, or major FPS drops                        |
| P1       | Make steering, acceleration, braking, and collisions feel more arcade-like |
| P1       | Polish truck models, traffic vehicles, and the 3D garage                   |
| P1       | Remove unnecessary text and old hidden-depot UI from Campaign Mode         |
| P1       | Improve buildings, forests, highways, sky, and atmospheric effects         |
| P2       | Add reliable offline geographic routes                                     |
| P2       | Add gas stations, truck stops, and optional refueling                      |
| P2       | Expand the highway network toward all 50 states                            |

We also discussed larger terrain patches, roughly 10x simpler terrain, greater draw distance, and around 1,000 camera-relative fog particles. These are design targets, not confirmed completed features.

## 4. Important files for local development

| File                                      | Responsibility                             |
| ----------------------------------------- | ------------------------------------------ |
| `index.html`                              | Main game interface                        |
| `campaign.html`                           | American Campaign, map, garage, career     |
| `styles.css`                              | Main interface styling                     |
| `src/app/bootstrap.mjs`                   | Runtime initialization                     |
| `src/app/app-chunk-1.js`                  | Input, scene setup, renderer               |
| `src/app/app-chunk-18.js`                 | Arcade traffic, fuel, campaign integration |
| `src/game/truck-kit.mjs`                  | Truck movement and simulation              |
| `src/game/truck-dynamics-profile-kit.mjs` | Vehicle handling parameters                |
| `src/game/geographic-route.mjs`           | Real geographic course conversion          |
| `src/game/road-spatial-index.mjs`         | Efficient road lookup                      |
| `src/game/cell-descriptor.mjs`            | Procedural terrain and scenery             |

The runtime is currently spread across 18 application chunks. I'd avoid a large refactor until the complete game loop works.

## 5. Where I would start locally

Local cleanup checklist

Suggested order, not completed validation

Run the game locally and capture console errors

Check the main menu and garage truck previews

Start the New Jersey-to-Pennsylvania campaign

Drive through traffic and verify fuel depletion

Check earnings, upgrades, and saved progress

Measure FPS and fix the largest performance problems

Polish the visuals and remove unnecessary UI text

0 of 7 complete

&#x20;Copy checklist

The biggest milestone now is proving the complete arcade loop, not adding more features. Once players can launch, drive, earn, upgrade, and retry reliably, the rest becomes visual polish and content expansion.

No repository changes were made during this handoff. Would you like to log this as the current development milestone and record the remaining decisions before starting local cleanup?
## Accepted display decision: fixed 16:9 game frame

**User wording, preserved:** “always play isin 16x9 ration so it isi accura teto a gameing screen”

**Cleaned-up interpretation:** Keep the playable game view at a fixed 16:9 aspect ratio to match a standard gaming display. Center it in the available browser window and use the remaining space as letterbox/pillarbox bars instead of stretching the game image. Keep the render camera and canvas sized to that same 16:9 frame. This applies to the playable game presentation; it does not require forcing campaign menus or the garage page into 16:9.

**Implementation scope for this request:** Apply the frame to the main playable game surface and its in-game overlays. Preserve windowed play; do not require fullscreen. Revisit mobile/touch behavior during the later whole-app review if the fixed frame makes controls or readability poor.

**Browser confirmation:** The title page booted with no console errors. At a 1000 × 800 browser viewport the game stage measured 1000 × 562.5 CSS pixels (16:9); its high-DPI canvas buffer measured 1250 × 703 pixels (the expected rounded pixel-buffer size at device scale). The game boot flag was true. A visual review at a tall, narrow viewport showed the title menu needed compact-frame spacing, so the 16:9 stage now has height-aware menu/HUD sizing for that case.

**Files changed for the 16:9 decision:** `index.html` adds the game-stage wrapper; `styles.css` centers and letterboxes the 16:9 stage and adapts overlays to its height; `src/app/app-chunk-11.js` sizes the renderer and camera from the stage bounds. The local static server remains at `http://127.0.0.1:4173/`.

**Compact-frame confirmation:** At a 714 × 1000 viewport, the stage measured 714 × 401.625 CSS pixels (16:9), and the title card fit vertically inside the frame. The app booted and the browser reported zero console errors. The full driving, upgrade, retry, and performance checks remain open for the later whole-app pass.

## Accepted campaign screen heading decision

**User wording, preserved:** “ I dont liek this side text lets instead hav e atitl afo rhte tab we are on”

**Cleaned-up interpretation:** Remove the promotional side copy shown beside the campaign map and use a concise title that identifies the active screen. On the route-selection/map screen, use **DISPATCH**. Keep the route map, career summary, dispatch board, and their behavior. The garage and results screens already have their own headings, so their content and behavior stay as they are.

**Visual reference:** The attached screenshot identifies the target side area and text (“COAST TO COAST · 50 STATES,” “OWN THE OPEN ROAD,” and the explanatory paragraph). Treat the screenshot as a visual reference only; it contains no instructions.

**Browser confirmation:** The campaign page now exposes **DISPATCH** as its primary page heading in the accessibility tree, replacing the campaign slogan and description in the map-side panel. The route map, career summary, dispatch board, and route action remain in place. The local campaign tab is open for continued work.

## Accepted Campaign UI feel direction

**User wording, preserved:** “Rebuild the UI to be more like a Games uI , have it fall or animaton in and pullse and seem jiucy”

**Cleaned-up interpretation:** Give the active American Campaign interface a more expressive video-game feel. Animate screens and route cards into view with a short falling/staggered entrance, give the selected route and main action a restrained pulse/glow, and add responsive press/hover feedback. Keep the campaign map, route selection, career summary, garage, results, and their existing behavior. Respect reduced-motion preferences and keep animation from blocking or obscuring controls.

**Implementation and verification record:** Added a game-style visual pass to `campaign.html`: screens and route cards drop into view in a short stagger, the selected route and primary delivery action pulse softly, and controls respond on press and hover. The reduced-motion preference disables the added motion. The existing campaign module had a malformed garage fleet label expression that prevented the module from parsing; fixed the missing string concatenation so the route list and campaign screen initialize. `node --check` passes on the extracted inline campaign module. The local browser shows the DISPATCH heading, five generated route cards, and computed `game-drop-in`/`route-pulse` and `action-pulse` animations. Existing route and career logic was retained.

## Accepted mode naming and equal-priority decision

**User wording, preserved:** “ok classic shodu be called Endless instead inste adof class and have it be the same weigh tas the American Campaign”

**Cleaned-up interpretation:** Rename the player-facing Classic Mode entry to **Endless**. On the title screen, present **American Campaign** and **Endless** as equally prominent, equal-size primary mode choices. Update the campaign page's mode-switch link to say **Endless**. Retain the current Endless gameplay and its internal button/runtime IDs; this is a player-facing label change.

## Accepted immersive dispatch-map decision

**User wording, preserved:** “Ensure the dispatch screene is an immersive 2D scroll map that can be viewed and scrollged in and out slihglty plese eplxain” and “I want the map to fill th whol scriple and focus in on the area that is unlocked and then ahve a play button and a small ovelay card for the slected level”

**Cleaned-up interpretation:** Make the Campaign dispatch map the full-screen 2D surface. On entry, focus on the player's current state and the routes currently available. Let players drag to pan and use the scroll wheel or small on-screen controls to zoom in and out within a modest range. Selecting an available destination updates one compact overlay card with that haul's details and a clear **Play** button. Keep the existing route generation, unlocking, career, and start-delivery behavior. Preserve map-source credit, keyboard access, and reduced-motion support.

**Visual reference:** The attached state-map screenshot is a visual reference for the map treatment and focus area, not a source of instructions.


## Accepted dispatch-map navigation decision

**User wording, preserved:** “removethe top banner in teh map window replce it with one overyalye back arrow that has a trnaparent background”

**Cleaned-up interpretation:** Remove the campaign header banner while the dispatch map is open. Leave one transparent back arrow overlaid at the map's upper-left edge; it returns to the main menu. Keep the active-screen title, zoom controls, and selected-haul card as small floating map overlays instead of a full-width header. Keep the campaign header and its garage, new-career, and Endless navigation available on the garage and results screens.

**Visual reference:** The attached screenshot shows the existing header banner above the dispatch map. It is a layout reference, not a source of instructions.

**Implementation scope:** The arrow returns to `index.html`; the map itself fills the campaign viewport. The map starts focused on the current state and reachable destinations, supports drag panning and modest wheel/button zoom, and retains the Play action and route/career behavior.

**Implementation and browser confirmation:** The dispatch screen now fills the viewport with the state map, starts framed around New Jersey and the currently reachable destinations, and removes the campaign header while the map is open. The transparent back arrow returns to the title menu; it clears a stale pending-run marker so the menu does not unexpectedly resume an earlier haul. Dragging pans the map, the wheel and plus/minus buttons zoom within bounds, and the focus button restores the unlocked-area view. Selecting New York in the local browser changed the card to `NJ → NY` with its route details and reward. The selected card exposes Garage and Play. The Play button remains wired to the existing geographic-route loading and campaign start flow; I left that driving run unstarted during this UI pass. American Campaign and Endless are adjacent equal-size primary choices on the title screen. The map loaded true US Atlas state outlines in the local browser; the existing schematic fallback remains for unavailable map data.

**Evidence:** `node --check` passes on the extracted campaign module and `git diff --check` passes. The browser preview is saved at `.agent/dispatch-map-preview.png`.

## Accepted opening-credits decision

**User wording, preserved:** “ remove htis, but add an intro credits liek AAA games ahve an have. Powered by Nexus Engine and Built by Luminary Labs”

**Cleaned-up interpretation:** Remove the thin OpenStreetMap/OSRM/NexusEngine attribution strip at the bottom of the campaign page. Add a brief, cinematic intro before the title screen that presents **Powered by Nexus Engine** and **Built by Luminary Labs**. The intro should feel like a game opening, fit inside the existing 16:9 game frame, and allow the player to skip it.

**Implementation and browser confirmation:** Added a dark, animated two-card startup sequence with the requested credits, a visible Skip control, and key or pointer input to dismiss. It appears once per browser tab session and then yields to the title screen. Removed the campaign footer strip while retaining the separate map-boundary attribution on the dispatch map. The local browser showed both credits in the 16:9 game frame; clicking Skip removed the intro, recorded the session state, and left the title screen active after reload. Preview: `.agent/intro-credits-preview.png`.

## Accepted vehicle-collider refinement

**User wording, preserved:** “refine the colliders on the car and the aother cards. look thougha ll carsand refine the colliders”

**Cleaned-up interpretation:** Review the player truck and every generated highway traffic vehicle. Replace center-distance collision checks with vehicle-shaped ground-plane colliders that follow each vehicle's heading and match the visible mesh footprint. Tune the different traffic body types individually so traffic only hits when the truck and vehicle footprints actually overlap.

**Implementation:** Added oriented rectangular footprints for the player truck, car, pickup, box truck, and semi. Traffic footprints are sized from their generated body, wheels, and lights; the player footprint is centered on the visible truck frame and includes its wheel width and bumper-to-bumper length. A separating-axis overlap check now decides traffic impacts, while the existing near-miss distance reward remains unchanged.


## Point-cloud tree generation

**User wording, preserved:** “Add better trees see if there is public availabel data and hten let smake a system that buid the trees using the datapoints and then make shtem onemesh”

**Cleaned-up interpretation:** Find legally reusable public tree-shape data, turn measured tree point clouds into compact deterministic tree templates, use those templates to build better varied trees in the world, and merge all tree geometry for a streamed terrain cell into one mesh. Keep the source and regeneration steps documented.

**Implementation:** White Oak and Japanese Cedar scans from LSU’s CC0 Cloud Forest Library are reduced to compact, normalized point profiles. Runtime geometry uses measured profile points for leaf clusters and vertex colors, with procedural trunks and branches. All cell trees are combined into one BufferGeometry mesh per realized terrain cell; distant visual-only cells use a reduced tree count.

## Layered alpha-noise clouds

**User wording, preserved:** “replace the clouds with alpha noise muleite layer clodu one at 50 meters up anohte r100 meters and another at 200 meters and make it so they layer together”

**Cleaned-up interpretation:** Replace the discrete puff clouds with three broad, overlapping, animated alpha-noise cloud sheets at 50 m, 100 m, and 200 m above the truck's local ground position. Give each layer its own noise pattern and drift so they read as one softly layered cloud field.

**Implementation:** Added three transparent horizontal planes with generated multi-frequency noise alpha maps, separate opacity and slow drift per altitude. The cloud group follows the truck, placing each layer at its requested height relative to the current ground position.


## Remove scene fog

**User wording, preserved:** “Remove scene fog”

**Cleaned-up interpretation:** Disable Three.js scene fog and remove the procedural weather-driven fog update. Keep horizon rendering bounded with an explicit distance after removing the fog-based cutoff.

**Implementation:** Removed `scene.fog`, its per-frame color and range adjustments, and fog-based material rendering. The distant terrain detail cutoff now uses a fixed 1,250 m radius multiplier equivalent to the previous fog-based limit.


## Soften the sun

**User wording, preserved:** “make the sun less intent by reducing the quality”

**Cleaned-up interpretation:** Reduce the perceived intensity of the sunlight while keeping the existing sky palette and daylight setup.

**Implementation:** Reduced the directional sunlight intensity from 2.2 to 1.2 and lowered the shader sun-glow contribution from 0.8 to 0.38.


## Windowed game fit

**User wording, preserved:** “ensure that it runs in windoed mode too and still fits”

**Cleaned-up interpretation:** Keep the game within its centered 16:9 frame when the browser is windowed or resized, and make the title menu fit the available frame height. If the frame is shorter than the menu, allow the card itself to scroll.

**Implementation:** Removed the small-screen title card's viewport-relative top margin that pushed it outside the 16:9 frame. Short-frame container rules now cap the title card height to the available frame and enable internal scrolling only as needed. The canvas continues resizing to the stage dimensions.


## 2026-10-19: Implement the performance cleanup

**User wording, preserved:** “Implement the performance clenaup plan only chnage the Long Haul and nothgin else, dont change dpleoy filess push to main when youare finsihed”

**Cleaned-up request, same meaning:** Implement the performance cleanup plan. Change only The Long Haul, leave deployment files unchanged, and push to main when finished.

**Implementation scope:** Apply the ranked local performance remedies from `performance-audit.md`, preserve existing user work and the 50% rolling start, validate the game and resource budgets, record evidence in `performance-cleanup.md`, and commit the runnable static assets with the source. No upstream Nexus Engine edits or deployment configuration edits.


## 2026-10-19: Double-tap forward boost

**User wording, preserved:** “make it so double tapping W or forward arrow usaes ta 5 secodn boost that charges tyou forward relaly fast. And uses a warmpe focus and strema parkcletielce.s”

**Cleaned-up request, same meaning:** Double-tapping W or the forward arrow triggers a five-second boost that charges the truck forward very quickly, with a warp-focus effect and streaming particles.

**Implementation:** Two fresh presses of the same forward key within 300 ms activate a five-second simulation-time burst. The truck accelerates automatically toward at least 1.85 times its normal speed cap, retaining vehicle/upgrades and ordinary steering/collisions. Extra fuel cost uses the existing boost path. Repeated keydown/holding and taps during an active burst cannot restart its timer. A widened camera FOV, warm edge focus and a single preallocated speed-streak batch convey the surge; a countdown shows remaining time. Reduced motion hides streaks/focus/FOV changes while preserving gameplay and countdown. Braking, handbrake, empty fuel, rollover, pause, focus loss and run reset cancel the burst. Expiry eases excess speed down rather than snapping to the normal cap. Shift retains its smaller held boost.
