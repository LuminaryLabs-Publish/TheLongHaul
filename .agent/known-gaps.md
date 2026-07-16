# Known gaps

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** keep lifecycle-sensitive input, simulation, and visible motion from diverging when browser or route ownership changes.

- [x] Trace DOM keyboard evidence into Core Input and Long Haul Truck state.
- [x] Trace focus, visibility, route, retry, completion, and frame cleanup paths.
- [x] Record source-backed input lifecycle and proof gaps.
- [ ] Implement and execute the missing authority.

## Held-input ownership

- `keys` is a mutable object shared by the application chunks.
- `pressed` is a mutable set for one-shot commands.
- `keydown` sets `keys[event.code] = true` and may add to `pressed`.
- `keyup` is the only ordinary held-key release path.
- `pressed.clear()` runs only after a successful ordinary frame.
- No generation identifies which document, route, or run owns a key event.
- No event receipt distinguishes accepted, repeated, stale, or retired evidence.

## Focus and document lifecycle

- No `window.blur` listener clears held state.
- No `document.visibilitychange` listener clears held state when hidden.
- No `pagehide` listener retires input for navigation or bfcache.
- No `freeze` listener retires input before page suspension.
- No `pageshow` or `resume` result creates a fresh input generation.
- No lifecycle result defines whether the driving route should pause automatically.
- No lifecycle result binds a restored document to a neutral input state.

## Route and run lifecycle

- Leaving `driving` does not explicitly retire the keyboard generation.
- `clearWorld()` resets game domains but does not clear `keys` or `pressed`.
- Retry and new-course generation do not create a new input generation.
- Completion and failure do not reject stale one-shot commands.
- Returning to title does not publish a held-input retirement receipt.
- A key held during a route transition can remain represented in the adapter store.

## Core Input and Truck convergence

- Core Input receives a host-derived intent snapshot every driving frame.
- Long Haul Truck receives a separate host-derived input request every driving frame.
- No atomic result proves both consumers were neutralized together.
- No expected input or simulation revision guards neutralization.
- No stale-event rejection prevents retired key evidence from repopulating intent.
- No `HeldInputRetirementResult` exists.

## One-shot command safety

- `C`, `M`, `Escape`, `R`, and `E` are consumed from `pressed`.
- `pressed` is frame-cleared, not lifecycle-cleared.
- A frame error can prevent the ordinary `pressed.clear()` call.
- No command generation prevents a stale retry, map, camera, pause, or interaction action after restoration.
- No typed cancellation result exists for retired one-shot evidence.

## Simulation and gameplay

- A stale throttle or brake key can continue driving after focus returns.
- A stale steering key can continue changing heading.
- A stale boost key can continue increasing fuel consumption.
- Stale driving can create distance, off-road time, collisions, meter spend, and penalties.
- RequestAnimationFrame throttling while hidden does not clear the accepted held state.
- No policy proves the truck is stopped or the run paused before restoration.
- No gameplay fixture reproduces a lost-keyup transition.

## Visible-frame evidence

- No input retirement revision is bound to the frame loop.
- No proof binds neutral Core Input to neutral Truck Input.
- No proof binds neutral simulation input to truck speed/body presentation.
- No `FirstNeutralInputFrameAck` exists.
- No map, HUD, WebAudio, or camera result cites the retirement generation.

## Browser and deployment validation

- `tests/static-shell-smoke.mjs` checks syntax and selected source patterns only.
- `tests/long-haul-game-smoke.mjs` checks deterministic courses, truck acceleration, and depot evaluation only.
- No Playwright or equivalent browser harness exists.
- No blur-without-keyup fixture exists.
- No hidden-tab fixture exists.
- No pagehide/bfcache fixture exists.
- No freeze/resume fixture exists.
- No route-retirement or retry-generation fixture exists.
- No source/artifact/Pages lifecycle parity fixture exists.

## Current Core adoption state

The prior Core adoption gap has materially changed. The current playable bootstrap pins the same Nexus Engine revision as the Core profile, imports `createLongHaulCoreKits`, installs Core Data, Core Simulation meters, Core Camera, Core Graphics and Core Transaction Ledger, creates and verifies course envelopes, uses named random streams through the generator, uses patch preparation, uses Core Graphics batches, and applies idempotent operations through the transaction ledger.

Remaining Core-specific proof gaps include complete release-manifest identity, persisted random-stream cursor replay, full browser parity, and explicit frame acknowledgements, but the earlier claim that the playable host does not adopt these capabilities is no longer current.

## Retained gaps

Earlier WebGL recovery, accessibility, host-clock, browser-audio lifecycle, generation-work budgeting, motion preference, pause suspension, delivery settlement, and course-generation rollback gaps remain preserved in their timestamped audit families.

## Completion boundary

Do not claim focus-safe input, route-safe input retirement, neutral Core/Truck convergence, lost-keyup recovery, bfcache safety, or first-neutral-frame correctness until lifecycle signals retire one generation exactly once, stale evidence is rejected, both input consumers settle neutral state before simulation, and real-browser fixtures pass across source, CI artifact, and deployed Pages.