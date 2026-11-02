# Gameplay overhaul — verified outcomes

Date: 2026-11-02. Authority: LUM-000154. The approved five-decision overhaul is implemented and functionally validated. The wider project still has human play acceptance, target hardware measurements and the separate final asset initiative to complete.

## Deliverables

- [60-second gameplay video](https://drive.google.com/file/d/1QRTYn-pRsBfqsxseiId9wFcCpeUW0Z59/view?usp=drivesdk)
- [Complete validation evidence](https://drive.google.com/file/d/1Aoyso43PylnpSwr5OVy9b9uQlzfzWdPm/view?usp=drivesdk)
- [Existing project Task Tracker](https://docs.google.com/spreadsheets/d/1U5wawNNkQGWvWflfM919RLSzPVvXV4kDzV0akZq6-JA/edit)
- [Project handoff folder](https://drive.google.com/drive/folders/1oDSlL1zcPp6LIkqBTjG6U8s1qn5wiPJa)
- [Source audit, boundaries and execution outcomes](gameplay-overhaul.md)

## Implemented behavior

| Outcome | Result |
| --- | --- |
| Cinematic entry | An actual-scene camera launch lasts 2.4 seconds on first entry, 0.7 seconds for returning players, or 0.12 seconds with camera motion disabled. Drive input or DRIVE NOW skips it. The truck, run clock, damage and score stay frozen during entry. |
| Arcade driving | Stronger acceleration and boost, responsive high-speed steering, controlled tire slip, ballistic airborne movement, clean landing telemetry, substantial body lean and impact feedback. Five-second rushes have a three-second recharge. Recovery is repeatable with an eight-second cooldown and increasing time/cargo consequences. |
| Fast navigation | Dispatch is an authoritative scene; input and focus transfer with scene changes. Pause, map, settings, garage, retry and next-run paths preserve one coherent run. Coarse-pointer controls and compact layouts are supported. The outer game surface cannot scroll when focus changes; individual menus remain scrollable. |
| Risk and reward | Qualified close passes, clean ramp landings and distinct breakables build a visible ×1–×5 combo. Four clean driving seconds bank it; crashes remove pending points and preserve banked points. Banked points add payout cash at 20 points per dollar. Unique event IDs, eligibility checks, cooldowns and bounded awards prevent replay and stationary/reverse farming. |
| Variety | Traffic moves independently along connected roads. Ramps, breakable cargo, roadblocks and weave windows are paced along the existing network with warnings and escape space. Rain changes the sky, lighting, road appearance and grip. Existing route choices, garages, fleet upgrades and deliveries remain in use. |

NexusEngine and Three.js remain pinned and unchanged. Product kits and the host own the changes. The game still uses one engine tick; the generated runtime matches its source chunks. No other repository was modified.

## Verification results

| Gate | Result and coverage |
| --- | --- |
| Build | `npm run build` passed after the final application repair. |
| Deterministic regressions | `npm test` passed: atomic domain kits, playability and performance-domain regressions, real NexusEngine vehicle/flight/impact/rate tests, boost lifecycle, combo eligibility/deduplication/banking/crash tests, encounter geometry/pacing/escape corridors and exact generated-runtime checks. |
| Actual browser | **46 checks passed** in Chromium 141.0.7390.54 with real WebGL, DOM and browser input. No failed network requests or fatal JavaScript/WebGL errors occurred in the final run. The unsupported parallel shader compilation warning is a software-renderer capability warning. |
| Journey and controls | First/return/reduced-motion launch, skip, throttle/steering, real traffic pass, ramp flight/landing, crate impacts and multiplier gain, crash/recovery, weather, garage purchase, delivery, payout idempotency and retained upgrades on the next run. |
| Navigation and layout | Repeated pause/resume and map/Escape cycles, throttle/rush release, pause → Settings → Back → Resume, fresh 1280×720 stage/canvas containment, compact 960×540 HUD and 390×844 active touch controls, cancellation and pause/resume. |
| Campaign preservation | Live OSRM highway launch, route/garage navigation, failed-attempt settlement and session retirement, reload, rejection of legacy settled sessions, fresh attempt identity, failure-to-success replay prevention and successful Campaign delivery. |
| Render guide | The sandbox evidence validator passed. Browser/WebGL is the faithful guide route for this application's GLSL, CanvasTexture and DOM requirements. |
| Media | **60.000 seconds, 1,800 frames, 1280×720, H.264, 30 FPS output, AAC stereo at 48 kHz.** Start/middle/end and additional encoded frames were visually inspected. The final clip starts directly in HAUL OUT and retains the full HUD throughout. |

The continuous recording uses ordinary keyboard input and the unmodified game audio master. It contains an 84.37 m / 2.43 s jump, traffic impacts, a near miss, crate destruction, banking, combo loss, a roadblock approach and rain. The ×2 multiplier is demonstrated in the separate browser acceptance; this particular continuous run does not reach ×2. No teleport, injected score, substituted scene, physics modification or replacement soundtrack is used in the video.

## Evidence identity

- Final browser run: `gameplay-2026-11-02T09-28-43-703Z`.
- Final recording: `gameplay-video-2026-11-02T09-31-18-778Z`.
- Application aggregate SHA-256: `f4c3af4ac634b933e9a5c21b040a7b6e09e9b612307595ba29aaee0d57334f7f`.
- Final MP4 SHA-256: `cc4814dd663dc07f209bbeb35ced386fc7284d3c62cf3ae2c81a4bf8810d9c8c`.
- Baseline main: `d179facfb127ddedb91a3a6225af03b37f191324`.

Validation ran against the completed working tree before publication. Every application file hash was checked again after capture; the final release tree is checked against those same bytes. The project handoff and tracker record the delivered commit. The evidence ZIP retains final reports, screenshots, input/state observations, raw native video, original game audio, ffprobe metadata, shared capture timing, build/test logs and checksums.

Native MediaRecorder audio omits its container duration, so source coverage is proven from actual Opus packet timestamps. Audio and video use the same capture epoch. A shared 0.5-second trim removes the final loading frame; first-frame timestamps are normalized before 30 FPS encoding. Source coverage exceeds the requested minute; the capture was not padded or sped up.

## Reproduce

```sh
npm ci
npm run build
npm test
npx playwright install chromium ffmpeg
npm run validate:gameplay
npm run record:gameplay
```

Install system `ffmpeg` and `ffprobe`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing Chromium executable. The harness uses task-local browser temporary files and SwiftShader; `LONG_HAUL_SANDBOX_CA_FILES` is an optional path-delimited list of installed public proxy CA certificates for environments that require it. The final test loaded real geographic data successfully after the sandbox's specific public CA keys were trusted; application routing code was unchanged.

## Acceptance boundaries and follow-up

The browser suite uses explicitly identified real-service fixtures to place the truck or traffic at distant/isolated scenarios, including garage, crash/recovery, weather and delivery endpoints. Actual input and product services execute those interactions. This proves endpoint behavior; it does not claim an uninterrupted natural drive through an entire delivery.

SwiftShader captured the lower graphics preset. The file's 30 FPS describes its encoding. Target MacBook/hardware GPU performance and Firefox/Safari behavior remain unverified. CPU/software-renderer timings and bounded-resource checks are retained in the reports.

Human playtesting should assess steering preference at high speed, traffic density, impact severity, recovery costs and the four-second combo banking window. Final 223-image production assets remain under LUM-000162. These broader acceptance items keep the existing project tasks and parent initiative open; the approved gameplay implementation is delivered without closing unrelated acceptance.

Material LUM-000154 progress is synchronized in the existing TheLongHaul tracker and handoff. The companywide ticket register lies outside the user's allowed file boundary and is not modified.
