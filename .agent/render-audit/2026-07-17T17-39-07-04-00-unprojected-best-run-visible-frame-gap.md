# Render audit: unprojected best-run visible-frame gap

**Timestamp:** `2026-07-17T17-39-07-04-00`

## Render surfaces

```txt
Three.js WebGL canvas
Canvas2D paper map
DOM scene, HUD, results and fault overlays
```

The focused gap is in the DOM results surface. The current run result is rendered into the score card, but the stored best-run record is not restored or rendered on title, results, HUD or map surfaces.

## Current projection

```txt
accepted delivery
  -> buildRunResult()
  -> showResults(result)
  -> render current score cells
  -> optionally write reduced local-storage record
```

The visible frame contains the current result only. It does not identify:

- whether a prior record existed;
- the comparison scope;
- whether the candidate was better, equal, worse or incomparable;
- whether persistence succeeded;
- which record revision was committed;
- whether the displayed record matches verified storage bytes.

## Missing convergence evidence

No shared digest currently binds:

```txt
RunResult revision
BestRunPolicy revision
BestRunRecord revision
storage commit/readback result
DOM projection generation
browser session and route
presented frame
```

No `FirstBestRunBoundFrameAck` exists.

## Proposed projection contract

**Proposed, not implemented:**

```txt
BestRunProjectionCommitCommand
  -> consume accepted candidate/restore result
  -> produce BestRunFrameDigest
  -> update title/results record presentation
  -> publish FirstBestRunBoundFrameAck
```

Late projections after retry, new-course generation, title transition, reset or page retirement should be rejected by generation identity rather than silently painting stale record state.

## Visual policy questions

The domain must settle these before UI work:

- Is the record per exact generated course, seed family, scoring revision or global?
- How are incomparable runs described?
- Is a tied run shown as matching the record?
- Are storage failures visible, diagnostic-only or retriable?
- Which record fields are player-facing?

## Boundary

No render code, HTML or CSS changed. No visible best-run feature or frame convergence is claimed.