# START HERE: The Long Haul browser-focus input release audit

**Last updated:** `2026-07-16T08-44-21-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed pre-audit repository head:** `d46394b3a848d769fac1228731e820990dbeb1f4`  
**Status:** `browser-focus-held-input-release-authority-audited`

## Summary

TheLongHaul was selected because it was the only eligible Publish repository ahead of its central documented head. Forty-four commits replaced the former single-file production shell with a modular Nexus Engine game, adopted the promoted Core profile in the playable runtime, added five product DSKs, added smoke tests, and added a main-branch smoke workflow.

The new keyboard adapter stores held keys in a mutable `keys` object and one-shot actions in `pressed`. It listens for `keydown` and `keyup`, but it does not clear either store on `blur`, `visibilitychange`, `pagehide`, `freeze`, route retirement, or input-generation replacement. A key release lost during focus transfer can therefore remain authoritative when driving resumes.

## Plan ledger

**Goal:** ensure every focus, visibility, route, and document-lifecycle transition retires held driving input before the next simulation step and publishes proof that the first matching frame is neutral.

- [x] Compare all 11 accessible Publish repositories with central tracking.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm all ten eligible repositories have central ledgers and root `.agent` state.
- [x] Compare documented heads with current `main`.
- [x] Select only TheLongHaul by runtime-ahead priority.
- [x] Inspect the 44-commit production rewrite, modular host, DSKs, tests, workflow, input path, simulation loop, and render path.
- [x] Identify the complete interaction loop, domains, kits, controllers, adapters, and offered services.
- [x] Add the timestamped input-lifecycle audit family.
- [x] Keep runtime and deployment unchanged.
- [ ] Add generation-bound held-input retirement and executable browser lifecycle fixtures.

## Main finding

```txt
keydown -> keys[code] = true
keyup   -> keys[code] = false

blur clear: absent
visibility hidden clear: absent
pagehide clear: absent
freeze clear: absent
route-retirement clear: absent
pressed one-shot clear on lifecycle loss: absent
Core Input neutralization result: absent
Truck Input neutralization result: absent
FirstNeutralInputFrameAck: absent
```

Every driving frame derives throttle, brake, steering, and boost from `keys`, mirrors the result into Core Input, and submits it to `longHaulTruck`. If the browser never delivers the matching `keyup`, the accepted intent can remain active across focus recovery.

## Required authority

`the-long-haul-browser-focus-held-input-release-authority-domain`

```txt
InputFocusLifecycleCommand
  -> bind document, route, input, run, and simulation generations
  -> observe blur, hidden, pagehide, freeze, route retirement,
     pointer-lock loss where relevant, and input-adapter replacement
  -> retire all held and one-shot evidence exactly once
  -> publish HeldInputRetirementResult
  -> submit one neutral Core Input intent
  -> submit one neutral Truck Input request
  -> reject stale keyup and keydown evidence from retired generations
  -> publish FirstNeutralInputFrameAck
```

## Current implementation census

```txt
engine-installed kits: 13
Core World effect providers: 1
standalone controllers: 1
browser/product adapters: 9
proof and workflow adapters: 3
total source-backed surfaces: 27
render surfaces: 3
planned input-lifecycle authority surfaces: 16
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-16T08-44-21-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-16T08-44-21-04-00-browser-focus-input-release-dsk-map.md`
5. `input-lifecycle-audit/2026-07-16T08-44-21-04-00-held-action-retirement-contract.md`
6. `gameplay-audit/2026-07-16T08-44-21-04-00-focus-loss-runaway-driving-loop.md`
7. `interaction-audit/2026-07-16T08-44-21-04-00-focus-lifecycle-command-result-map.md`
8. `render-audit/2026-07-16T08-44-21-04-00-stale-input-visible-motion-gap.md`
9. `deploy-audit/2026-07-16T08-44-21-04-00-input-lifecycle-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-16T08-44-21-04-00-runtime-ahead-input-lifecycle-reconciliation.md`
11. `turn-ledger/2026-07-16T08-44-21-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

Core capability adoption is now materially advanced by the modular rewrite: the playable bootstrap imports the Core profile, uses one Nexus Engine revision, consumes Core Data envelopes and named randomness, resource meters, Core Camera smoothing, Core Graphics batches, Core Transaction Ledger, and patch preparation. Earlier WebGL recovery, accessibility, host-clock, audio lifecycle, generation scheduling, motion preference, pause suspension, delivery settlement, and rollback audits remain preserved in their timestamped families.

## Next safe ledge

Add one lifecycle-owned input generation before further control tuning. Clear `keys` and `pressed`, submit neutral Core Input and Truck Input state, and optionally pause the run on focus loss; then prove blur, hidden-tab, pagehide, freeze, and route-retirement behavior in a real browser fixture.