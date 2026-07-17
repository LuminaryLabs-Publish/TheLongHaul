# START HERE: The Long Haul map-mode input and focus audit

**Last updated:** `2026-07-17T07-38-20-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed pre-audit repository head:** `d868fdc0758934a9be4fd70cc5ba479deced6398`  
**Status:** `map-open-input-context-focus-authority-audited`

## Summary

The map opens inside the active `driving` scene. The browser adapter continues admitting held throttle, brake, steering and boost; Truck, Run, meters, streaming, camera, HUD and audio continue updating. The map panel only toggles CSS and `aria-hidden`.

The audit does not declare live map driving invalid. It records that no typed authority chooses live-driving, restricted-driving or suspended policy, and no map session binds input context, focus, announcement, settlement and the first matching frame.

## Goal

Create one renderer-neutral map-mode authority. Keep semantic policy in DSK results and keep DOM/Canvas2D as projection adapters.

## What needs to happen

```txt
MapModeAdmissionCommand
  -> choose and bind one policy
  -> MapModeAdmissionResult

MapInputContextCommitCommand
  -> apply exact semantic action mask and simulation policy
  -> MapInputContextResult

MapFocusCommitCommand
  -> settle focus and announcement
  -> MapFocusCommitResult

MapModeSettlementCommand
  -> settle M, Escape, pause, outcome, title and reset once
  -> MapModeSettlementResult
  -> FirstMapModeBoundFrameAck
```

## Checklist

- [x] Compared all 11 Publish repositories.
- [x] Excluded `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirmed ten eligible central ledgers, root `.agent` folders and matching heads.
- [x] Selected only TheLongHaul by the oldest synchronized timestamp.
- [x] Inspected input, scene, map, gameplay, streaming and frame-loop paths.
- [x] Reconciled all 20 installed kits and 35 source-backed surfaces.
- [x] Added the timestamped map-mode audit family.
- [x] Kept runtime and deployment behavior unchanged.
- [ ] Implement map-mode policy, context, focus and settlement results.
- [ ] Execute source, browser, artifact and Pages fixtures.

## Current census

```txt
Core kits installed:                  8
product DSKs installed:              12
engine-installed kits:               20
Core World effect providers:          1
standalone controllers:               1
browser/product adapters:             9
proof/deployment adapters:            4
total source-backed surfaces:        35
render surfaces:                      3
planned map-mode surfaces:           18
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-17T07-38-20-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-17T07-38-20-04-00-map-open-input-context-focus-dsk-map.md`
5. `map-mode-audit/2026-07-17T07-38-20-04-00-input-focus-settlement-contract.md`
6. `render-audit/2026-07-17T07-38-20-04-00-map-overlay-input-policy-visible-frame-gap.md`
7. `gameplay-audit/2026-07-17T07-38-20-04-00-map-open-driving-policy-loop.md`
8. `interaction-audit/2026-07-17T07-38-20-04-00-map-mode-command-result-map.md`
9. `deploy-audit/2026-07-17T07-38-20-04-00-map-mode-browser-fixture-gate.md`
10. `central-sync-audit/2026-07-17T07-38-20-04-00-oldest-selection-map-mode-reconciliation.md`
11. `turn-ledger/2026-07-17T07-38-20-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

The infinite map viewport and upstream atlas/cell-content audits remain unresolved. Runtime faults, focus-release, Core adoption, WebGL recovery, accessibility, clock, audio, generation, motion, pause, delivery and rollback audits remain preserved.

## Next safe ledge

Do not implement map semantics inside `updateMapPanel()` or `drawMap()`. First admit a map session and policy through the input/gameplay domains, then project the accepted result.