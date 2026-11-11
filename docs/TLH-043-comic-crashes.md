# TLH-043 — Comic crash candidate

Status: implemented locally; build and full source regression suite PASS; WebGL acceptance blocked.
Base: c2513a41ce9d126172c4c52035780b627d73d5dc.
Tracker: https://docs.google.com/spreadsheets/d/1U5wawNNkQGWvWflfM919RLSzPVvXV4kDzV0akZq6-JA/edit
Parent: LUM-000154. One task and one final acceptance gate.

## Runtime contract

`long-haul-impact-kit` attaches to resource identity `long-haul-truck`.
`long-haul-destructible-vehicle-kit` owns the 14 traffic-slot damage records.
Both register with the pinned Nexus `defineDomainServiceKit` API. Their state is
transient; they do not alter persistent freight/campaign checkpoint formats.

Swept SAT yields time, point and normal for translating oriented boxes, using
conservative endpoint radii for rotation. Vertical overlap uses the same time
interval. It is not a general rigid-body continuous collision solver.
An impact event records IDs, tick, seed, point/normal, relative velocity, closing
speed, truck/target masses, heading, contact offset and response. Contact episodes
suppress sustained hits until separation. Existing transaction receipts guard
truck/cargo damage, penalties and impulses. Closed episodes and recycled slots
retire their references; the existing contact-ledger bound remains authoritative.

The new truck response replaces traffic's index-based impulse and major roadside
obstacles' hash-based side. Damage, shield, armor, freight and combo owners are
reused. Effective mass determines the desired velocity change; the adapter
compensates the existing movement momentum scalar to avoid applying mass twice.
V1 remains byte-identical: the public loadSnapshot API clears its old boost floor
before queuing the new impulse. V2 retains its current impulse contract.

## Presentation and destruction

Six authored traffic profiles supply shared breakup templates: sedan, muscle,
pickup, van, SUV, box truck. Parts retain source geometry/colors. Doors, front
panels, cab/body sections, bumpers and wheels are grouped before material baking;
existing lower-body front/top triangles provide hood panels where applicable.
Fallback traffic uses clones of the visible source parts. Cab-over vehicles have
front/cab sections rather than an invented long hood.

Destroyed traffic retains its slot until out of the active route window; it is
hidden and excluded from contact/ability queries. Debris uses lightweight gravity,
rotation and a local flat impact-ground approximation; it has no gameplay collider.
Its original car collider never remains active invisibly. Recycle resets health,
scale, source callback, previous collider and event identity.

Hit stop uses real elapsed presentation time while the regular simulation receives
zero delta and a paused scene marker. It does not accumulate a catch-up timestep.
Truck input/fuel, traffic, weather/encounters, freight clocks and ability clocks
follow the existing simulate gate. Pause/map/skills/focus loss clear the hold;
retry/title/world clear retire effects. Camera offsets are removed before the
next camera solve, preventing accumulated drift. Old generic camera impact
shake is suppressed while the new directional response is active.

Editable comic lettering uses pooled DOM starbursts projected from world contact,
clamped into the stage and relocated away from selected existing HUD panels.
Words: SKRR!, BAM!, WAP!, WHAM!, KAPOW!. Burst placement and readability still need
actual viewport review. Opaque toon puffs use shared orange/yellow/smoke materials;
emissive fire stays visible in dark scenes. Debris retains the source toon ramp.
Missing host gradient now receives a four-band fallback instead of disabling the
entire authored traffic factory.

Initial bounds (provisional until target-browser profiling): 80 fragment slots,
24 puff slots, 4 lettering slots, up to 14 pieces per destroyed vehicle; 3.4s
fragment lifetime and 160m distance cutoff. Overflow drops decorative pieces.
Initial response thresholds: scrape .75–5m/s, solid 5–18m/s, heavy >=18m/s closing
speed. Hold ranges: none / 35–55ms / 65–90ms, quantized by display frame cadence.
The settings panel exposes independent off/reduced/full Impact pause. Camera
motion off disables hit stop and shake, reduces explosion puffs and removes
starburst rotation. Physical outcomes are independent of presentation settings.

## Validation commands

- `npm run build:host`
- `npm test`
- `node tests/comic-impact-regression.mjs`
- `node tests/comic-crash-host-regression.mjs`
- `node tests/comic-crash-movement-regression.mjs`

New coverage: swept tunneling/bridge and mirror cases; head/rear, moving-relative
velocity, mass, repeat/separating contact; hit-stop caps/options; damage event
deduplication; destruction/recycle; actual Nexus kit installation; all six authored
breakup variants; geometry-bearing host saturation, pause/reduced-motion/reset;
installed V1/V2 impulse behavior, boost cancellation and zero-step motion hold.
The CPU host stress runs 600 simulated seconds and 300 crashes. It is NOT an
actual gameplay recording and makes no GPU or target-device performance claim.

## Remaining acceptance gate

Local Chromium fails to start with socket Operation not permitted. This is an
environment blocker; do not bypass it or mark rendered checks passed. No actual
WebGL images, close-up crash clips, 600-second player-input run, target-device
frame-time/draw-call/memory evidence or visual acceptance exists for this candidate.
Current pool sizes and feel tuning are provisional.

In an allowed sandbox browser, run exact-candidate V2 default and opt-in road V3,
both movement adapters, head/rear/side and glancing/reverse/high-speed crashes,
loaded truck, bridge/tunnel, shield/boost/drift, repeated contact and pileups.
Verify all clocks hold together; no invisible collider, duplicate damage, old
boost floor or stuck input; matching recognizable debris; world cleanup; source
ramp at day/night/rain; text avoids HUD; keyboard/touch/controller and narrow
layouts. Retain actual crash clips and ten-minute gameplay/resource traces.
Resolve defects and record reviewer acceptance before marking Done.

No GitHub Actions changes, external publication or remote push in this task.

## Verified source results

`npm run build:host` PASS. Full `npm test` PASS exit 0. The three new crash suites
also passed after the final input-validation and identity refinements. The source
check enforcing byte-identical V1 passed. Static runtime/source parity and syntax
checks passed. The CPU host stress observed 300 crashes over 600 simulated seconds,
1,800 held frames, 20 peak fragments, 9 peak puffs, and 1 peak lettering burst.
Pool saturation tests separately exercised the fixed bounds. These observations
are not browser FPS, GPU memory, real-input gameplay or visual acceptance.
