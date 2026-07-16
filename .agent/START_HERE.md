# START HERE: The Long Haul accessible HUD, route and announcement authority

**Last updated:** `2026-07-16T00-38-29-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed implementation revision:** `4ab7591224f23f3cb84450f0aa101bd78fe95d25`  
**Reviewed pre-audit repository head:** `d3b8c99bf4a8ccb6a5246e81f8cdaa9f1513e1bf`  
**Status:** `accessible-hud-route-announcement-authority-audited`

## Summary

TheLongHaul is a static Nexus Engine freight game with ten engine kits, two Core World providers, seven browser/product adapters, Three.js, Canvas2D, DOM UI, WebAudio, browser storage and Pages deployment.

The active audit isolates accessibility projection. The driving HUD is one `aria-live="polite"` region whose timer, speed, road, condition, depot, penalty, recovery and prompt text are rewritten every frame. Route changes toggle visual classes without an explicit focus owner, inactive-screen semantic settlement, discrete announcement policy, dynamic canvas/map alternative or accessible-frame acknowledgement.

## Plan ledger

**Goal:** make accepted game state produce one stable accessible read model, bounded announcements, route-bound focus and matching semantic/visible frame evidence.

- [x] Compare all 11 accessible Publish repositories with central tracking.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm ten eligible ledgers and root `.agent` states.
- [x] Select only TheLongHaul by the oldest synchronized timestamp.
- [x] Trace routes, generation, HUD, map, toasts, outcomes, focus and RAF.
- [x] Preserve the complete 20-surface implementation inventory.
- [x] Define 20 accessibility authority surfaces.
- [x] Add the timestamped audit family.
- [x] Keep runtime and deployment unchanged.
- [ ] Implement and execute browser, artifact and Pages fixtures.

## Interaction loop

```txt
accepted route/run state
  -> updateSceneUi toggles route classes
  -> updateGeneratingUi changes visual progress
  -> updateHud rewrites frame-rate telemetry under one live region
  -> toast/outcome text changes without typed announcement results
  -> Canvas2D/WebGL render
  -> no accessible read-model revision or frame acknowledgement
```

## Main finding

```txt
continuous HUD live region: present
per-frame descendant updates: present
announcement cadence/deduplication: absent
route focus/restoration: absent
inactive-screen inert settlement: absent
generation progress semantics: absent
discrete toast/outcome announcement results: absent
dynamic game-canvas alternative: absent
map semantic summary: absent
AccessibilityProjectionResult: absent
FirstAccessibleRouteFrameAck: absent
FirstVisualAccessibleConvergenceAck: absent
```

This is a source-backed semantic ownership and evidence gap. No screen-reader failure or accessibility conformance defect was reproduced.

## Required authority

`the-long-haul-accessible-hud-route-announcement-authority-domain`

```txt
AccessibilityProjectionCommand
  -> bind document route run simulation HUD map focus and frame revisions
  -> derive one immutable AccessibleReadModel
  -> separate continuous telemetry from meaningful announcements
  -> coalesce and throttle semantic changes
  -> own route focus and restoration
  -> publish canvas/map alternatives
  -> reject stale duplicate and retired projections
  -> publish AccessibilityProjectionResult
  -> acknowledge accessible and visual convergence frames
```

## Census

```txt
engine-installed kits: 10
world effect providers: 2
browser/product adapters: 7
deployment adapters: 1
total source-backed surfaces: 20
render surfaces: 3
planned accessibility authority surfaces: 20
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-16T00-38-29-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-16T00-38-29-04-00-accessible-hud-route-announcement-dsk-map.md`
5. `accessibility-audit/2026-07-16T00-38-29-04-00-hud-focus-announcement-contract.md`
6. `gameplay-audit/2026-07-16T00-38-29-04-00-driving-telemetry-accessibility-loop.md`
7. `interaction-audit/2026-07-16T00-38-29-04-00-accessibility-command-result-map.md`
8. `render-audit/2026-07-16T00-38-29-04-00-rapid-live-hud-semantic-frame-gap.md`
9. `deploy-audit/2026-07-16T00-38-29-04-00-accessibility-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-16T00-38-29-04-00-oldest-selection-accessibility-reconciliation.md`
11. `turn-ledger/2026-07-16T00-38-29-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

Input action convergence, host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback remain valid and unchanged.

## Next safe ledge

Implement the accessible read model, route focus transaction and announcement policy before claiming keyboard or screen-reader readiness.