# Next steps

**Timestamp:** `2026-07-17T07-38-20-04-00`

## Goal

Give map open one explicit gameplay, input and focus policy without moving semantic ownership into DOM or Canvas2D code.

## Checklist

### 1. Choose product policy

- [ ] Select `live-driving`, `restricted-driving` or `suspended` as the default.
- [ ] Define allowed semantic actions for every policy.
- [ ] Define Run clock, meters, collisions, wildlife, delivery and streaming behavior.
- [ ] Define whether map behavior differs for keyboard, gamepad and touch.

### 2. Admit a map session

- [ ] Add `MapModeAdmissionCommand` and `MapModeAdmissionResult`.
- [ ] Bind route, run, input sequence, map viewport and focus revisions.
- [ ] Allocate `MapSessionId` and reject duplicate/stale toggles.
- [ ] Reject map admission outside active driving.

### 3. Commit input and simulation policy

- [ ] Activate a map-specific Core Input context.
- [ ] Apply an explicit semantic action mask before Truck input.
- [ ] Suspend or preserve simulation only through the accepted result.
- [ ] Prevent raw browser key state from bypassing policy.

### 4. Settle focus and accessibility

- [ ] Choose retain-game, focus-map or focus-close policy.
- [ ] Publish one map-open/close announcement.
- [ ] Restore the accepted prior focus target on close.
- [ ] Define Escape behavior independently from M close.

### 5. Settle every exit once

- [ ] Handle M, Escape, pause, completion, failure, title, retry and reset.
- [ ] Handle blur, visibility retirement and page replacement.
- [ ] Clear stale one-shot evidence.
- [ ] Publish `MapModeSettlementResult`.

### 6. Bind the visible frame

- [ ] Commit DOM, Canvas2D and gameplay state under one map generation.
- [ ] Reject late frames after settlement.
- [ ] Publish `FirstMapModeBoundFrameAck`.
- [ ] Preserve the prior infinite map viewport/content work as a separate prerequisite.

### 7. Validate

- [ ] Hold W/A/Shift while opening and closing under every policy.
- [ ] Test M and Escape race/double-settlement paths.
- [ ] Test route outcomes and reset while open.
- [ ] Test keyboard focus and announcement restoration.
- [ ] Run `npm test`.
- [ ] Compare source, built artifact and Pages receipts.

## Retained work

Infinite map viewport projection and atlas/cell-content adoption remain unresolved. This audit does not replace those semantic map-content contracts.