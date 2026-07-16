# Runtime fault audit: frame-exception retirement contract

**Timestamp:** `2026-07-16T18-58-24-04-00`

## Authority boundary

One exception must produce one terminal result, one retired scheduler generation and one stable fault projection.

## Evidence captured

- The frame callback schedules its successor before current work.
- The outer catch only calls `showBootError(error)`.
- `showBootError()` logs and shows the failure overlay.
- `stepGeneration()` records an error but does not retire the outer loop.
- `pressed.clear()` is success-tail work.
- `clearWorld()` exists but is not called by the fault path.
- The audio adapter exposes update but no fault-specific retirement call.
- The reload button performs an unconditional page reload.

## Required invariants

1. At most one active scheduler generation.
2. At most one accepted fault result per generation.
3. No old-generation callback performs product work after retirement.
4. No input evidence survives into a restarted generation.
5. No audio or world work remains active without an explicit retirement receipt.
6. Indeterminate partial state cannot resume as the same run.
7. One terminal fault projection corresponds to the accepted fault result.
8. Restart creates new scheduler and run identities.

## Classification

```txt
recoverable before authoritative mutation
  -> optional clean in-process restart after full retirement

indeterminate after authoritative mutation
  -> retire run and require clean-run restart or reload

renderer/engine integrity unknown
  -> require page reload
```

## Diagnostic policy

Publish a bounded diagnostic ID, phase and public classification. Do not expose stack traces, source URLs, seeds or internal object dumps in the player-facing panel.
