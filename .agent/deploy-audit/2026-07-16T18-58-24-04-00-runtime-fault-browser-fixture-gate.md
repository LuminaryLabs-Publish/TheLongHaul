# Deploy audit: runtime-fault browser fixture gate

**Timestamp:** `2026-07-16T18-58-24-04-00`

## Required source fixtures

- Verify the RAF callback is generation-guarded.
- Verify every named phase reports success/failure.
- Verify one accepted fault retires the scheduler exactly once.
- Verify repeated copies of the same error are deduplicated.
- Verify stale keyboard and RAF evidence is rejected.

## Required browser fixtures

- Inject faults before tick, after tick, during world streaming and during render.
- Count product-phase executions after the accepted fault.
- Verify engine/wind audio gains settle to silence.
- Verify Core World/provider and preparation work retire.
- Verify focus and one live announcement land on the fault panel.
- Verify reload or clean-restart action is admitted once.

## Required artifact and Pages fixtures

- Run the same matrix against source, workflow artifact and deployed Pages.
- Record commit SHA, artifact digest, deployment URL and fault-generation receipts.
- Require identical terminal classification and restart policy.
- Publish `FirstFaultFrameAck` for each surface.

## Gate

Do not claim crash containment or deployment parity from a visible overlay alone.
