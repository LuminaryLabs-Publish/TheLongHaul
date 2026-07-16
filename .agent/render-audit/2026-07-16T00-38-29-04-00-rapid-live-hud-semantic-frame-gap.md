# Render audit: rapid live HUD semantic-frame gap

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Summary

The visual frame has three presentation surfaces: Three.js WebGL, a Canvas2D map and DOM screens/HUD. The DOM HUD is marked `aria-live="polite"`, yet its textual descendants are rewritten during every driving frame. There is no matching semantic-frame revision, announcement cadence or canvas alternative bound to the visible frame.

## Plan ledger

**Goal:** ensure visual telemetry, semantic telemetry and discrete announcements cite the same accepted state without turning frame-rate updates into an announcement stream.

- [x] Trace RAF through `updateHud()`, `drawMap()` and `renderer.render()`.
- [x] Trace route class changes and visible overlays.
- [x] Identify semantic and frame-correlation gaps.
- [ ] Implement a bounded semantic projection and frame acknowledgements.

## Visible frame path

```txt
accepted simulation state
  -> updateHud()
  -> update map panel and Canvas2D map
  -> update truck, camera, wildlife and dust
  -> renderer.render(scene, camera)
```

## Semantic path

```txt
updateHud()
  -> timer text
  -> map timer text
  -> speed text
  -> road text
  -> fuel, damage and cargo text
  -> depot, penalty and recovery text
  -> interaction prompt text

all descendants share #hud aria-live=polite
```

## Gap

```txt
HUDFrameRevision: absent
AccessibleStateRevision: absent
announcement delta policy: absent
telemetry throttling/coalescing: absent
semantic frame plan: absent
state-bound game-canvas alternative: absent
state-bound map summary: absent
FirstAccessibleRouteFrameAck: absent
FirstVisualAccessibleConvergenceAck: absent
```

The source permits a new live-region mutation on nearly every driving callback while important discrete changes are not represented as stable announcement results. The exact assistive-technology behavior depends on browser and screen reader; no announcement flood was reproduced.

## Required render contract

```txt
accepted run/map/route revisions
  -> derive immutable AccessibleReadModel
  -> derive visual HUD frame and semantic delta
  -> suppress insignificant continuous changes
  -> admit meaningful discrete announcements once
  -> render DOM, Canvas2D and WebGL
  -> publish matching accessible and visual frame acknowledgements
```

## Required fixtures

```txt
60 Hz telemetry update with bounded announcement count
speed and timer threshold coalescing
penalty and interaction announcement deduplication
route focus and first-frame correlation
map open/close semantic summary
canvas alternative revision correlation
reduced browser callback cadence
source, artifact and Pages parity
```

No rendering, semantics or accessibility behavior changed.