# Render audit: generation progress and visible-frame cadence

**Timestamp:** `2026-07-15T04-40-29-04-00`

## Current presentation loop

```txt
RAF callback
  -> run one generation unit
  -> engine tick
  -> update generation UI from completed-unit ratio
  -> update partial truck/world presentation when present
  -> update wildlife and dust
  -> render Three.js scene
```

## Finding

The progress bar represents completed plan entries, not measured or weighted work. A bookkeeping entry and a terrain/world-registration entry each advance the bar by the same amount. The same RAF callback that executes a unit also performs engine and presentation work.

The visible loading experience therefore has no receipt for:

```txt
host-frame budget used
unit execution duration
work deferred to the next frame
long-task classification
weighted progress contribution
partial-world render revision
ready result revision
first playable frame matching the accepted course
```

A failed unit displays the failure overlay while the partially prepared world can remain resident. No render result proves whether that frame represents an accepted predecessor, a failed candidate or mixed state.

## Required render contract

```txt
GenerationRenderFrameCommand
  -> bind GenerationAttemptId, WorkQueueRevision and HostFrameId
  -> consume the latest accepted progress revision
  -> present weighted progress and current admitted phase
  -> classify partial-world rendering as allowed, hidden or predecessor-only
  -> publish GenerationRenderFrameResult

GenerationReadyFrameCommand
  -> require accepted ready adoption receipts
  -> render the matching course, truck, hazards and HUD
  -> publish FirstPlayableGenerationFrameAck
```

## Validation needed

```txt
30, 60 and 120 Hz callback matrix
CPU-throttled generation trace
PerformanceObserver long-task trace
hidden-tab suspend/resume trace
failure-frame resource probe
first playable frame fingerprint
source versus Pages frame comparison
```

No visual smoothness, frame-budget compliance or Pages parity claim is made.