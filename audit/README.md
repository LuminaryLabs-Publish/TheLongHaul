# TheLongHaul NexusAuditor integration

Status: **scaffold committed; current regression scenario executable; timed replay adapter not yet implemented**.

Authority: LUM-000154, existing TLH-001 through TLH-009. NexusAuditor remains a separate read-only dependency; no upstream modification. Asset production LUM-000162 unchanged.

## Run existing supported checks

Install NexusAuditor's current CLI locally (see its README), then:

```sh
nexus-auditor doctor --target . --profile audit/validation.json
nexus-auditor validate-local --target . --profile audit/validation.json --dry-run
nexus-auditor validate-local --target . --profile audit/validation.json
```

The active `regression.jsonl` invokes `npm test` from the project root. It is **not** a ten-minute gameplay replay.

## Ten-minute replay plan

`scenarios/ten-minute-playthrough.json` specifies twelve consecutively budgeted segments totaling 600 simulation seconds. `checks/checkpoint-contract.json` defines event-driven assertions, recovery decisions and evidence. Both are design inputs, not executable NexusAuditor actions yet.

| Window | Outcome | Required checks |
|---|---|---|
| 00:00–00:40 | launch-and-controls | intro-skipped-or-completed, driving-scene, forward-speed, steering-settles, no-fatal-errors |
| 00:40–01:30 | boost-and-lane-change | boost-activated, speed-gain, lane-clearance, steering-reversals-bounded, camera-settles |
| 01:30–02:20 | standard-freight-pickup | valid-forward-gate, cargo-onboard, mass-changed, no-duplicate-pickup, truck-motion-retained |
| 02:20–03:10 | traffic-and-risk | near-miss-qualified, encounter-readable, combo-earned-once, no-collision-teleport, traffic-not-blocking-station |
| 03:10–04:00 | loaded-ramp | airborne-detected, grounded-landing, cargo-damage-consistent, landing-score-qualified, no-frame-failure |
| 04:00–04:50 | first-delivery | receiver-crossed, receipt-issued-once, wallet-increased, next-contract-issued, same-run-continues |
| 04:50–05:40 | heavy-cargo | heavy-load-collected, stopping-distance-increased, yaw-within-limit, no-velocity-reset, timing-check |
| 05:40–06:30 | express-route | shortcut-choice-visible, gate-forward-eligibility, reward-qualified-once, failed-choice-no-reward, no-oscillation |
| 06:30–07:20 | crash-and-recovery | damage-applied, combo-risk-applied, recovery-cooldown, road-position-valid, journey-still-active |
| 07:20–08:10 | cargo-loss-and-replacement | cargo-forfeited, no-delivery-payout, replacement-offered, new-pickup-reachable, same-session |
| 08:10–09:00 | garage-save-and-resume | purchase-atomic, state-persisted, reload-consistent, no-payout-replay, controls-cleared |
| 09:00–10:00 | weather-menus-campaign-compat | weather-changed, pause-resume-correct, map-input-safe, campaign-open-return, bounded-resources, zero-fatal-errors |

## Required implementation (next bounded task)

1. Create `audit/adapters/timed-replay.mjs` using `tools/fixed-browser-clock.mjs` and the browser validation helpers. Validate scenario schema and source identity before launch.
2. Apply input events at exact simulation ticks, supporting held buttons, steering strength, controlled release, and authored events. Replace reactive full-left/full-right steering with smooth predefined maneuvers. Never inject gameplay position, rewards or cargo.
3. Capture game event and state checkpoints during the full 600-second journey. Evaluate both fixed thresholds and event predicates, including conditional recovery. Do not invent passing events when a branch cannot be reached.
4. Emit structured run manifest, JSONL input/state/event trace, checks, console/network errors, screenshots and on-failure evidence to `audit/runs/` (ignored from source control). Treat retries as distinct attempts.
5. Only after the adapter is independently tested, register it as a second NexusAuditor JSONL scenario invoking its local `node` command. Keep local-only origins and bounded process cleanup. Add smoke tests for invalid timelines, malicious paths, impossible checkpoints and replay determinism.
6. Optional video editing should reference verified source tick ranges, with non-overlapping clips and A/V on one simulation clock. Recording is not a substitute for checks.

**Acceptance:** A repeatable 600-second replay reaches all intended events in the actual browser game; every assertion is evaluated, drift/oscillation is reported, failures preserve evidence, and a second run agrees within defined numeric tolerances. Independently run desktop, portrait controls, Firefox and WebKit suites; physical Mac performance remains a separate gate.
