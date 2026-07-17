# Deploy audit: map-mode browser fixture gate

**Timestamp:** `2026-07-17T07-38-20-04-00`

## Required source fixtures

- Map admission rejects non-driving and duplicate evidence.
- Each policy produces the exact semantic action mask.
- Pause, result, loss, title, retry and reset settle the active session once.
- Focus and announcement restoration use matching revisions.

## Required browser fixtures

- Hold W/A/Shift while opening the map and verify the selected policy.
- Confirm M and Escape close paths cannot double-settle.
- Confirm keyboard focus and screen-reader state after open and close.
- Confirm no stale map frame appears after route retirement.
- Verify `FirstMapModeBoundFrameAck` matches visible DOM, Canvas2D and gameplay state.

## Release gate

```txt
npm test
source browser fixture
built artifact fixture
GitHub Pages fixture
matching map-session and frame digests
```

No artifact or Pages parity should be claimed until all three origins publish equivalent results.

## Current boundary

The repository has no map-mode fixture or acknowledgement. No test or deployment workflow was changed by this audit.