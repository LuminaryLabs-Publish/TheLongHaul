# Skills, drifting and abilities

Authority: **LUM-000154**, using the existing **TLH-001–TLH-009** tasks. This document describes the implemented contracts for the Skill, Drifting and Ability Systems Master Plan. It is an architecture and behavior reference; release validation and the exact tested revision belong in the validation report.

The implementation was reconciled with upstream `df2bc70673c6867aa244a9a5a96f2d12bc36776d`. That revision already supplies the continuous highway, drive-through freight, cargo physics, freight persistence and difficulty pacing. These systems are reused directly. The new skills layer does not introduce another freight lifecycle or cargo mass owner. Geographic Campaign retains its route, depot and settlement lifecycle.

Production art remains the separate **LUM-000162** dependency. Vehicle changes and ability effects use the existing procedural geometry.

## Ownership and integration

| Responsibility | Authoritative source | Host contract |
| --- | --- | --- |
| Keyboard and touch actions | [`driving-controls.mjs`](../src/game/driving-controls.mjs) | One action map supplies Core input, keyboard and touch labels; help and HUD describe the same controls. |
| Truck motion, load and steering damage | [`truck-kit.mjs`](../src/game/truck-kit.mjs), [`truck-dynamics-profile-kit.mjs`](../src/game/truck-dynamics-profile-kit.mjs) | The shipped engine owns position, velocity, orientation, suspension and cargo state. |
| Drift reserve and completed maneuver evidence | [`drift-behavior.mjs`](../src/game/drift-behavior.mjs) | The truck calls the helper inside its existing motion integration; the helper owns no second clock. |
| Career XP, points, tiers and equipped slots | [`skill-progression.mjs`](../src/game/skill-progression.mjs) | Validated maneuver receipts drive progression. Cash and temporary score multipliers stay separate. |
| Ability definitions and execution | [`active-abilities.mjs`](../src/game/active-abilities.mjs) | The module validates activation, advances cooldowns, moves projectiles and reports contacts. The host applies world changes. |
| Collectibles and temporary modifiers | [`driving-pickups.mjs`](../src/game/driving-pickups.mjs) | The module owns collected identities and active-time timers. The host supplies swept contact evidence. |
| Endless road and freight | [`endless-highway.mjs`](../src/game/endless-highway.mjs), [`freight-journey.mjs`](../src/game/freight-journey.mjs), [`cargo-profiles.mjs`](../src/game/cargo-profiles.mjs) | Existing continuous freight owns gate crossing, delivery, cargo condition and payment. |
| Menus, feedback and composition | [`app-chunk-21.js`](../src/app/app-chunk-21.js) | Composes skills with freight in [`app-chunk-20.js`](../src/app/app-chunk-20.js), input in [`app-chunk-7.js`](../src/app/app-chunk-7.js), and the single frame loop in [`app-chunk-11.js`](../src/app/app-chunk-11.js). |

The application still calls `engine.tick` once per rendered simulation frame. `vendor/app-runtime.js` is generated from `src/app`; edit source chunks and run `npm run build` to regenerate the committed runtime.

## Controls and input lifecycle

| Action | Keyboard | Touch |
| --- | --- | --- |
| Accelerate | W / Up | GO |
| Brake, then reverse at low speed | S / Down | BRAKE |
| Steer | A / Left, D / Right | Left / right arrows |
| Explicit drift request | Either Shift | DRIFT |
| Boost while accelerating | Space; the existing double-tap W / Up rush remains available | BOOST; GO uses the same tap path |
| Handbrake | X | Use BRAKE for the normal stopping path |
| Equipped abilities | Q and E | Q and E |
| Depot, garage or roadside recovery | F | ACT |
| Skills and abilities menu | U | SKILLS |
| Map | M | MAP |
| Pause | Escape | Pause button |
| Camera / retry | C / R | Existing menu actions |

Q and E are exclusively ability slots. F replaces the previous conflicting interaction binding. Shift requests drift; Space retains a separate boost role. S plus steering can initiate drift without Shift. Explicit drift applies a modest brake request even when S is not held. Boost/rush is cancelled by braking, handbraking, drift, loss of fuel or a tipped truck.

Touch buttons use the same `setDrivingControl` path as keyboard input. `pointerup`, `pointercancel` and `lostpointercapture` release held actions. Key repeat does not create repeated ability activations or repeated double-tap edges. Opening or closing a panel releases held controls. Window blur clears inputs and pauses an active drive. A hidden document pauses active driving or keeps an already open menu frozen, and resets frame scheduling so returning cannot apply accumulated wall-clock time.

### Pause contract

Skills, map, garage, pause/settings and launch introduction block driving simulation. The frame loop checks the frozen state before input and again afterward. Opening a menu prevents that frame from advancing the truck; closing a menu keeps the first transition frame frozen before normal control resumes.

During a frozen driving view, the engine receives zero simulation delta and a non-driving scene marker. Truck position/velocity, drift reserve, freight deadlines, fuel use, traffic, wildlife, scoring timers, cooldowns, pickup timers and active effects use the same active simulation boundary. Rendering and UI remain responsive. Q/E are rejected while menus are open. Menu focus stays within the skills dialog, and U/Escape can close it.

This contract also freezes the freight deadline in the map and garage. It supersedes the earlier active-clock wording in the continuous-freight implementation notes.

## Recoverable weight transfer and rollover

The existing drift reserve remains bounded and energy-dissipating. The single truck step now also advances authoritative roll, side-specific wheel unloading and cumulative rollover exposure via [the rollover model](../src/game/truck-rollover.mjs). Normal high-speed turns lean outward; an active controlled drift biases roll inward to the slide. A countersteer opposite the established lean, excessive lateral acceleration, heavy or shifted cargo, and roll velocity increase tip risk. Settling the maneuver decays exposure before the truck tips. Crossing the stability threshold latches a real tipped state, stops drive torque, clears active drift, and retains existing F roadside recovery. The wheel meshes share the same render-body pose; no random wobble or separate physics clock is introduced. See [the agent feature contract](../.agent/feature-weight-transfer-rollover.md) and [lessons](../.agent/lessons.md).

## Momentum-responsive drift

### Motion model

The truck distinguishes world velocity, forward velocity, lateral velocity, body heading, steering angle and yaw rate. Rotation of the body changes the local decomposition of the existing velocity. Tire grip then damps lateral motion. Turning therefore produces measurable slip instead of instantly forcing all velocity along the truck's nose.

A grounded forward-moving truck can begin a drift when:

- Planar speed is at least 5.5 m/s and forward speed exceeds 3 m/s.
- Steering magnitude is at least 0.16.
- Brake input exceeds 0.12, or explicit drift is held.
- The truck is not tipped and the previous maneuver cooldown has expired.

During the slide, the default lateral-grip multiplier is 0.16. Steering response is exaggerated for arcade handling, and longitudinal drift drag removes speed with `exp(-0.3 × dt)`. Braking creates frontward weight transfer and body pitch. Physical cargo, surface grip and slope remain part of the same motion calculation.

Opposite steering enters the countersteer phase. Steering-angle response and yaw response become stronger, allowing the body to realign with its current travel direction. A release requires at least 0.065 seconds of countersteering, at least 0.22 seconds in the maneuver, a previous slip angle of at least 0.12 radians, current alignment within 0.115 radians, and sufficient stored reserve.

### Reserve and energy safeguard

The arcade reserve is represented as dissipated kinetic energy per unit mass. Its displayed `momentum` is a convenient speed-equivalent value, not a second physical velocity or a second engine.

For a simulation step, let `v0` be the previous planar speed, `v` the speed after the normal motion update, `E` the reserve, and `η` the retention efficiency:

```text
dissipated = max(0, v0² - v²) / 2
E_next = clamp(E × exp(-0.12 × dt) + η × dissipated,
               0, maximumReserveSpeed² / 2)
displayedMomentum = sqrt(2 × E_next)
```

Default reserve speed is capped at 17 m/s equivalent. The profile guard permits 3–22 m/s and retention efficiency of 0.1–0.9. Stock retention is 0.72. Momentum-control tiers approach 0.90 gradually.

On a successful release:

```text
exitSpeed = max(v, min(0.96 × entrySpeed, sqrt(v² + 2 × E_next)))
```

The truck redirects the resulting planar velocity along its realigned heading, consumes the entire reserve and starts a 0.45-second maneuver cooldown. The outer `max` preserves speed already obtained from the engine or terrain; the reserve itself cannot increase speed beyond 96% of maneuver entry speed. Decay, imperfect retention and that entry-speed bound make repeated drift activation lossy when there is no external source of acceleration.

Reserve disappears when planar speed falls below 1 m/s or forward velocity falls to 0.2 m/s or less. Becoming airborne, tipping, a substantial collision/launch impulse or recovery teleport also clears the active reserve. Letting the maneuver settle without steering ends it after the grace period; it cannot remain charged indefinitely. Recovery preserves monotonically increasing maneuver identities while clearing the physical launch opportunity.

`drift.lastManeuver` records sequence, duration, distance, entry/exit speed, maximum slip, reserve, countersteer result and completion reason. XP consumes this completion evidence once. Physics may finish a short maneuver that does not meet the stricter XP thresholds.

## Cargo and existing upgrades

Freight loads the actual truck with `truck.setCargo(profileOrLoad)` and unloads with `truck.setCargo(null)`. `state.cargo`, `cargoMass`, `effectiveMass`, load shift and center of mass come from that owner. Skills read this state. Driving input does not override cargo mass.

The upstream truck has a 7,800 kg base mass. Current cargo profiles are general freight at 1,600 kg, fragile glass at 800 kg, heavy machinery at 6,200 kg, hazardous drums at 3,200 kg and unsecured salvage at 3,900 kg. Valid part-load overrides are bounded to 250–12,000 kg. Cargo changes effective mass, acceleration, braking, yaw response, suspension, air control and impact response. Unsecured or hazardous loads can shift; secured heavy cargo does not invent lateral movement. Grade acceleration remains mass-independent, while the reduced available traction and engine force of a loaded truck make climbing harder.

Drive-through loading preserves position and velocity. Drift reads the existing load force/brake/grip/yaw scales, rather than applying another cargo penalty. `totalMass` is the effective-mass alias used by skill telemetry; `cargoShift` follows authoritative lateral load shift.

Cash garage upgrades and career tiers compose from stock values each time configuration changes. The host first reapplies the existing fleet/cash profile, then applies skill multipliers to those base values. It does not repeatedly multiply an already upgraded profile. Existing handling response, suspension travel and load configuration survive. Cargo still changes the behavior of the resulting upgraded truck.

## XP, points and independent tiers

XP is a permanent career resource. Delivery cash, banked arcade score and temporary combo multipliers keep their existing owners. Skill awards never directly add garage cash.

| Skill evidence | Minimum qualification | Base XP |
| --- | --- | --- |
| Drift | 8 m/s entry, 0.5 seconds, 4 m distance, 0.12 radians of slip | Duration/distance scaled, up to 80 |
| Countersteer exit | Drift thresholds, positive released reserve and a moving exit | Duration/distance scaled, up to 100 |
| Near miss | 12 m/s, forward travel, clean clearance over 0.05 m and at most 1.8 m | 35 |
| Jump / stunt landing | 10 m/s, 0.6 seconds airborne, 8 m travel and clean forward landing | Up to 90 |
| Sustained combo | At least 3 events over 3 seconds at 10 m/s | Up to 90 |
| Existing breakable destruction event | Qualified forward collision at 10 m/s | 10 |

The ledger rejects inactive, malformed, reverse, unclean or duplicate evidence. A drift and its countersteer exit share one maneuver identity. Ramp landings pass through the existing scoring event; generic landings use the truck landing sequence so the same jump does not take both paths.

Each level grants one point. For level `L`, total XP required is `80 × (L − 1) + 20 × (L − 1)²`: level 2 costs 100 cumulative XP, and level 3 costs 240. Levels are capped at 1,000,000 and tiers at 10,000. These finite bounds keep thresholds and counters within safe integer ranges. An upgrade costs `1 + floor(previousPurchasesOfThisUpgrade / 4)` points. Starter ability tiers do not count as purchased tiers when calculating cost.

Stats, modifiers and ability levels progress independently. Engine, brake balance, tires, suspension and armor change truck properties. Momentum control requires one tire tier; rush tuning requires one engine tier. Combo focus increases skill XP and the safe combo window. Ability amplifier and Shockwave become available at level 2.

Mechanical growth uses bounded diminishing returns: `cap × tier / (tier + half)`. Examples are up to 45% added acceleration, 18% added normal top speed, 30% added road grip, 40% added braking, 35% added suspension stability and 50% skill armor reduction. Momentum control approaches 25% more retention than stock; it does not reach the physics efficiency cap early and leave later tiers ineffective. Engine and ability execution still enforce their own numerical bounds.

### Three-choice selection

The menu uses deterministic rotation. It filters eligible upgrades, selects one from each available family, and rotates the selection by career level and the “Other choices” page. If a family has no eligible entry, remaining eligible upgrades fill the available places. The maximum is three choices; candidates show practical effects, current/next tier and point cost.

This is not a commitment to a permanent class or branch. A player may buy a stat now, a modifier next, and an ability later. Paging exposes every eligible choice without random reroll costs. An unaffordable card remains visible with a disabled purchase button. A successful purchase closes the menu; an exit spends nothing.

## Two equipped abilities

Q and E always hold two distinct discovered abilities. The starter loadout is Mini Trucks on Q and Road Shield on E. Discovering Shockwave explicitly asks which slot to replace. Replaced abilities remain discovered and can be equipped again without spending points. Re-equipping and upgrading do not reset cooldowns.

| Ability | Behavior | Stock recharge |
| --- | --- | --- |
| Mini Trucks | Deploy three miniature trucks ahead of the real truck. They seek nearby hazards in a forward cone, smash breakables and push traffic aside. | 12 seconds |
| Road Shield | Protect the next two impacts for six seconds, including paired cargo/steering damage. | 18 seconds |
| Shockwave | Expand a short radial pulse that clears nearby breakables and pushes traffic. Requires discovery and an explicit Q/E replacement. | 16 seconds |

Ability definitions, permanent levels, equipped slots, cooldowns, active entities and visual presentation are separate. All activation and execution require active gameplay. A tipped truck cannot activate; Mini Trucks also require ground contact. The amplifier modifier and temporary ability pickup enhance execution without changing the equipped identity.

Mini Trucks spawn ahead in a spaced formation, move faster than the player, and turn toward eligible targets within 55 m and a narrow forward cone. With no target they can follow the local road heading. Swept collision tests detect the first contact along each movement segment. A contact consumes that mini; breakables are removed through the existing encounter owner, while traffic gets a bounded lateral push and brief slowdown. No player XP is invented for ability hits.

Each mini has a finite lifetime and travel limit, and expires when too far from the player. Upgrades increase convoy size to five, reach and push, while reducing recharge through bounded growth. Shield upgrades add protected hits, duration and recharge improvement. Shockwave upgrades increase reach, push and recharge. The host preallocates visual capacity rather than adding an unbounded pool of meshes.

## Collectibles, damage and recovery

| Pickup | Effect | Duration |
| --- | --- | --- |
| Focus | +25% arcade points and +35% skill XP | 15 active seconds |
| Boost | +25% boost force | 12 active seconds |
| Ability | +0.5 ability enhancement | 15 active seconds |
| Repair | Restore 12 hull points and remove steering pull | Immediate |

Repeated pickups refresh the corresponding timer to its defined duration; they do not multiply the bonus without limit. Repair does not restore cargo, undo penalties or purchase permanent upgrades. These item rules are explicit implementation decisions for the earlier collectible/boost/combo approval.

Endless pickups use absolute highway progress (`145 + 185 × index`) and stable identities. Road-window rebuilds therefore keep the same pickup at the same location. Collection uses swept player movement, a 3.3 m horizontal threshold and a bounded height difference. Already collected items cannot be collected again after their timer expires. Retired road indices compact old receipts without reopening those items.

Unshielded impacts of sufficient size add bounded signed steering damage. The engine applies a predictable directional pull, weaker steering and lower grip. The host caps damage at magnitude 0.8; even the engine's full supported magnitude of 1 leaves opposite steering strong enough to correct the pull. There is no random input inversion or permanent damage tier.

The HUD indicates the pull direction. Repair pickups realign steering immediately. F provides a steering-only roadside repair when stopped on the road, with a five-second penalty and an eight-second cooldown. Primary garage/depot interactions and severe recovery retain priority. Existing severe-crash recovery restores a safe road pose, consumes its established penalty/cargo costs and clears steering pull. Recovery teleport clears drift reserve so it cannot serve as a launch exploit.

## Vehicle feedback

Tire, engine and suspension tiers alter procedural tire/exhaust/suspension components. Armor and braking improvements add visible reinforcement, and Q/E equipment reflects the equipped abilities. The truck continues to expose physical pitch, body roll, suspension compression, tire sliding, cargo shift and drift charge. Ability visuals show deployed minis, protection and pulse radius; impacts use the existing debris/audio path.

Reduced-motion settings suppress optional bobbing, cargo lean and body-motion embellishment. Physical truck position, essential projectile travel and the tipped state remain readable. Effects are attached to the existing world and truck roots and cleaned up on a new run.

## Saves and resuming an ongoing haul

The existing `longhaul-campaign-v1` record gains a nested `skillProgression` payload. Legacy cash, trucks, garage upgrades, earnings and unrelated fields pass through unchanged. Missing skill data receives default XP/tiers and the two starter abilities. Normalization reconstructs minimum spent points from purchased tiers so old or malformed data cannot grant the same points twice.

Purchases are prepared in a candidate model. The host compares the latest skill revision, writes the merged save and only then adopts the purchase in memory. Unavailable or conflicting storage disables purchases and exposes a status message. XP can remain in the active session when storage is unavailable; that is not a claim that an unwritable save is durable.

Cross-tab notifications refresh career state without writing it back. The imported persisted revision remains the lease for the next genuine mutation, even if the local run scope differs. Refresh preserves this live run's maneuver receipts and merges incoming receipts only for the same scope. Two active hauls with their Skills menus open therefore cannot create a save-notification loop or erase each other's local deduplication history. Unreadable or corrupt storage keeps the in-memory model and disables spending instead of replacing earned progress with fresh defaults.

An Endless XP receipt scope is the stable freight session plus contract ordinal. Resuming the same contract retains that scope; a new contract retires the prior bounded ledger. The host seeds observed drift/landing counters after restoring the truck, preventing the previous completed maneuver from being awarded again on the first resumed frame. Traffic serials also survive checkpoints so new cars do not reuse earlier receipt identities within the same leg.

Freight checkpoints retain the actual truck/run/cargo/meters and add `skillState` containing steering damage, pickup timers and receipts, retired pickup progress, ability cooldowns/protection, steering-repair cooldown and traffic serial. Traveling mini trucks and pulse contacts are retired on reload, while their remaining recharge persists. Full physical projectile/world restoration is not required to prevent a free cooldown reset. Older freight checkpoints without skill state remain loadable with defaults for the new features. Present drift fields and completed-maneuver records must contain valid finite values before a freight snapshot can resume.

Freight cumulative payment, receipt validation and revision conflict handling remain in `prepareFreightSave`. Checkpoints occur periodically and at the existing pause, title, page-hide and freight settlement boundaries. The nested skill payload and freight checkpoint are merged into the same campaign record, preserving each other's fields.

## Continuous-loop and performance boundaries

The reused highway retains 12 main 320 m sections around the truck, plus bounded loading branches. Stations recur every 960 m. The wide route and narrower express route have physical drive-through gates; receivers complete a delivery while the truck keeps moving. Cargo loss schedules another contract instead of ending the whole journey. Existing fuel/hull failure, freight deadlines, score banking, garage economy and geographic Campaign rules remain their respective owners.

New bounded systems include:

- At most 12 mini trucks and 3 pulses; at most 256 candidate ability obstacles per update and 512 recent hit receipts.
- At most 28 pickup meshes near the player; the Endless plan follows the bounded road window, and finite Campaign plans cap at 192 entries.
- At most 4,096 XP receipts per active scope. At capacity the ledger rejects further awards until its next legitimate scope, rather than evicting evidence and reopening duplicates.
- A bounded retained pickup set with a monotonic retired index for Endless, and active timers that advance only with simulation time.
- Reused ability geometry/materials, a fixed visual pool, and a throttled skill HUD. Existing traffic and encounter streaming retain their upstream bounds.

These are design limits, not hardware measurements. CPU timing, memory behavior, representative-device performance and human assessment of handling require the release evidence.

## Validation entry points and evidence boundary

The resolved cargo/drift integration was exercised directly against the shipped engine by:

```bash
node tests/vehicle-feel-regression.mjs
node tests/cargo-physics-regression.mjs
node tests/drift-regression.mjs
```

Those observed passes include braking, reserve expiration, repeated-activation bounds, predictable/correctable steering damage, freeze behavior, and the cargo owner surviving a stale input mass field. The drift matrix covers 36 combinations of entry speed, surface grip, cargo and steering; 28 produced a successful exit, while low/weak attempts are allowed to settle without release.

The repository also provides separate progression, ability, pickup, freight and static-runtime suites through `npm test`. Browser integration lives in `tools/validate-skills.mjs`; input-driven recording lives in `tools/record-skills.mjs`. Their existence is not a claim of a passing execution. Record actual results, source identity, browser/runtime details, declared setup fixtures, playable footage and any outstanding human/hardware assessment in the release validation report.

For comparative performance, `tools/measure-skills-performance.mjs` serves either the current tree or a prepared archive through `--root`. Run the baseline and current measurements sequentially, with other browser captures stopped:

```bash
node tools/measure-skills-performance.mjs --root=.cache/performance-baseline --revision=df2bc70673c6867aa244a9a5a96f2d12bc36776d --label=baseline --output=.cache/validation/skill-perf-baseline
node tools/measure-skills-performance.mjs --label=current --compare=.cache/validation/skill-perf-baseline/performance-report.json --output=.cache/validation/skill-perf-current
```

Both use the same seed, low quality, 1280 × 720 viewport, DPR 1, five-second warmup and two twenty-second wall-clock phases. The second phase uses Q/E on builds that support equipped abilities. The tool preserves native animation scheduling and `performance.now`, reports median/p95 phase and complete-frame CPU times, and retains renderer/heap/resource samples and actual input history. Baseline builds without abilities are explicitly identified. Fixed-clock recordings cannot substitute for these real-time measurements.
