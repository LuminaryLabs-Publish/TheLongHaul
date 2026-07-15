# Known gaps

## Generation scheduling

- The browser host owns generation queue execution directly.
- `frame()` calls `stepGeneration()` once per animation callback.
- `stepGeneration()` executes exactly one unit regardless of available frame time.
- No frame-budget policy or elapsed-cost receipt exists.
- No unit can explicitly yield partway through expensive work.
- No worker-eligibility classification exists.

## Progress semantics

- The plan contains 31 unit IDs with unequal work cost.
- Progress is completed-unit count divided by total-unit count.
- Terrain creation, Core World registration and validation count the same as lightweight state steps.
- No weighted-progress revision exists.
- No deferred, running, cancelled, failed or rolled-back progress states exist.

## Lifecycle and retirement

- Generation has no durable attempt identity or generation revision.
- Hidden-tab behavior is not owned by a generation lifecycle policy.
- No explicit cancellation result exists.
- A failed attempt can retain partial world and presentation resources.
- Late work from a retired or superseded attempt has no rejection contract.
- Retry and replacement attempts have no predecessor-retirement receipt.

## Ready adoption

- `generation.ready` is a host-local boolean.
- Core Simulation starts from host cursor state rather than an immutable ready result.
- Route, world, depot, hazard and truck validation are not collected into one adoption artifact.
- No `GenerationReadyResult` exists.
- No `FirstPlayableGenerationFrameAck` exists.
- The first driving frame does not cite a generation revision.

## Validation

- No package manifest or executable test command exists.
- No 30/60/120 Hz cadence fixture exists.
- No CPU-throttling or long-task fixture exists.
- No hidden-tab suspend/resume fixture exists.
- No cancellation or partial-resource retirement fixture exists.
- No first playable-frame fingerprint exists.
- No source-to-Pages generation parity proof exists.

## Retained gaps

The earlier motion preference, pause suspension, delivery terminal settlement and course-generation admission/rollback gaps remain valid in their timestamped audit families.