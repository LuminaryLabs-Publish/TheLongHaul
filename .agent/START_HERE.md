# START HERE: The Long Haul delivery terminal settlement

**Last updated:** `2026-07-14T14-39-54-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `ed31f1903e0400200688465abfc124268eeadd9e`  
**Status:** `delivery-terminal-result-settlement-authority-audited`

## Summary

`TheLongHaul` is a complete static browser game built from ten Nexus Engine kits, two streamed world providers, Three.js, Canvas2D, DOM UI, WebAudio, localStorage and Pages deployment.

The current priority is terminal delivery settlement. An accepted depot check creates the score result before the resolve phase finishes. The simulation then marks the run completed before processing same-step collision, impact, failure and timeout proposals. This gives delivery implicit precedence through system order, can omit same-step damage or penalties from the score, and publishes no immutable result identity or matching visible-frame receipt.

## Plan ledger

**Goal:** make delivery, failure, same-step impacts, final metrics, score, persistence, presentation and retry settle through one explicit terminal policy and one immutable run outcome.

- [x] Compare all 11 accessible Publish repositories and ten eligible central ledgers.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm every eligible repository is tracked, has root `.agent` state and matches its central documentation head.
- [x] Select only `TheLongHaul` using the oldest eligible central documentation timestamp.
- [x] Inspect delivery checks, simulation resolution, condition pressure, penalties, score construction, results UI, best-score storage and retry.
- [x] Preserve the complete 10-kit, two-provider, six-adapter and one-deployment-adapter census.
- [x] Add a new timestamped tracker and focused audit family.
- [ ] Add explicit terminal proposal collection and precedence.
- [ ] Finalize all same-step metrics before score construction.
- [ ] Publish immutable outcome, persistence and visible-frame receipts.
- [ ] Add terminal-conflict, retry-lineage and source-to-Pages fixtures.

## Interaction loop

```txt
title
  -> generate a seeded five-branch course
  -> choose one valid destination among five plausible depots
  -> prepare streamed terrain, roads, hazards and truck
  -> drive a six-minute freight run
  -> explore roads and candidate depots
  -> reject wrong yards with a 20-second penalty
  -> protect fuel, truck and cargo
  -> check the valid yard while stopped
  -> settle delivery or failure for the current step
  -> calculate golf-style score
  -> show results and optionally update best score
  -> retry the same seed, generate a new seed or return to title
```

## Domains

```txt
browser lifecycle and provider resolution
Nexus Engine runtime and ticking
Core Scene
Core World and streamed effect providers
Core Input
Long Haul Delivery
Core Simulation
Vehicle Dynamics
Route Field
Resource Pressure
Hazard Field
Telemetry
procedural course generation
terminal proposal collection and outcome settlement
score policy, result history and retry lineage
Three.js WebGL presentation
DOM scene and HUD projection
Canvas2D map projection
WebAudio
localStorage settings and best score
GitHub Pages deployment
audit governance
```

## Kit and surface census

```txt
engine-installed DSKs and kits: 10
world effect providers: 2
browser/product adapters: 6
deployment adapters: 1
total source-backed surfaces: 19
render surfaces: 3
executable validation commands: 0
```

## Required authority

```txt
the-long-haul-delivery-terminal-result-settlement-authority-domain
```

It must collect delivery, timeout, damage and failure proposals for one RunId and StepId; apply an explicit precedence policy; finalize penalties and resource values; create one immutable score-bound outcome; persist only accepted evidence; project the same result into the DOM; acknowledge the matching frame; and require retry to cite the predecessor outcome.

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-14T14-39-54-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-14T14-39-54-04-00-delivery-terminal-settlement-dsk-map.md`
5. `outcome-audit/2026-07-14T14-39-54-04-00-delivery-result-score-retry-contract.md`
6. `render-audit/2026-07-14T14-39-54-04-00-terminal-result-visible-frame-gap.md`
7. `gameplay-audit/2026-07-14T14-39-54-04-00-delivery-check-terminal-precedence-loop.md`
8. `interaction-audit/2026-07-14T14-39-54-04-00-delivery-command-settlement-result-map.md`
9. `deploy-audit/2026-07-14T14-39-54-04-00-delivery-terminal-fixture-gate.md`
10. `central-sync-audit/2026-07-14T14-39-54-04-00-oldest-selection-delivery-settlement-reconciliation.md`
11. `next-steps.md`
12. `validation.md`

## Next safe ledge

Keep the existing delivery and simulation kits. Add one terminal settlement coordinator after proposal collection and before result construction, persistence, results transition or retry.