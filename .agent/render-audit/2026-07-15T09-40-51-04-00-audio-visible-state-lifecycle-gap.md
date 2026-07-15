# Render audit: audio and visible-state lifecycle gap

**Timestamp:** `2026-07-15T09-40-51-04-00`

## Plan ledger

**Goal:** prove that the audible state and the visible route/run state cite the same accepted lifecycle revision.

- [x] Trace RAF scene projection and audio gain updates.
- [x] Trace pause, blur and title-return paths.
- [x] Record the missing audiovisual acknowledgements.
- [ ] Add executable browser evidence.

## Finding

The visible frame is rendered after `engine.tick()`, scene UI projection and route-specific updates. Audio loop gain is also updated from RAF, but the audio graph has no frame revision, route revision or visibility revision. Blur requests pause without directly settling the graph, and no `visibilitychange` or `pagehide` owner exists.

```txt
visible paused frame acknowledgement: absent
matching silent-audio acknowledgement: absent
visible resumed frame acknowledgement: absent
matching resumed-audio acknowledgement: absent
hidden-document audio result: absent
page-retirement audio receipt: absent
```

A correct proof should capture the accepted scene/run revision, WebGL frame, DOM scene, loop-gain state and AudioContext state in one result packet.