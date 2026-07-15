# Deploy audit: generation cadence browser fixture gate

**Timestamp:** `2026-07-15T04-40-29-04-00`

## Release gate

A generation scheduler change is not production-proven until source, root artifact and deployed Pages behavior agree.

## Required fixtures

```txt
seed replay at 30 Hz callback pacing
seed replay at 60 Hz callback pacing
seed replay at 120 Hz callback pacing
CPU-throttled generation
hidden-tab suspend and resume
generation cancellation during terrain preparation
superseding retry during generation
route-validation failure
Core World validation failure
resource retirement after failure
weighted progress monotonicity
first playable frame fingerprint
source/root-artifact/Pages parity
```

## Assertions

- Every cadence produces the same course fingerprint, destination, hazards and truck start.
- Work per host frame remains within the accepted policy or publishes an explicit over-budget result.
- Progress is monotonic and receipt-backed.
- Hidden-tab behavior is explicit and does not create stale time or duplicate work.
- Cancellation and failure retire all partial attempt resources.
- Core Simulation starts exactly once for the accepted attempt.
- The first playable frame cites the accepted generation revision.
- The deployed Pages artifact matches the audited source behavior.

## Current evidence

```txt
package manifest: absent
executable test command: absent
browser cadence fixture: absent
PerformanceObserver long-task fixture: absent
visibility fixture: absent
cancellation fixture: absent
first playable frame fixture: absent
artifact parity fixture: absent
Pages parity fixture: absent
```

No deployment or production-readiness claim is made.