# Known gaps

**Timestamp:** `2026-07-17T17-39-07-04-00`

## Comparison scope

- One stored record is shared across all generated courses.
- No product result explicitly chooses global comparison.
- Comparison uses `adjustedTime` only.
- Exact-course, generator and scoring-policy identities are not bound.
- Equal and incomparable candidates have no typed classification.

## Record schema

- The payload has no schema field or payload-level version.
- Canonical course ID and full seed are omitted.
- Generator and scoring revisions are omitted.
- Par, penalties, condition and collision evidence are omitted.
- No record ID, revision, prior revision or digest exists.

## Durability and faults

- JSON parse and local-storage writes are inside an empty catch block.
- No classified storage failure reaches diagnostics or presentation.
- No expected-prior-revision check prevents stale replacement.
- No readback verification proves the written record.
- No `BestRunCommitResult` exists.

## Restore and migration

- The stored record is not restored into a product domain.
- No migration contract exists for the current v2 key.
- Corrupt, incompatible, denied and absent storage are not distinguished.
- No explicit record reset/delete command exists.

## Projection and frame convergence

- Title, results, HUD and map do not project a restored best record.
- The visible current result does not show whether it set or matched a record.
- No frame digest binds record, scope, scoring and route generations.
- No `FirstBestRunBoundFrameAck` exists.
- Late restore/projection after retry, new course, title or page retirement has no rejection receipt.

## Validation and deployment

- No candidate-comparison fixture exists.
- No corrupt/denied/readback-mismatch storage fixture exists.
- No legacy migration or reset fixture exists.
- No reload-to-visible-record browser fixture exists.
- No source/artifact/Pages parity fixture exists.
- `npm test` was not run during this documentation audit.

## Retained gaps

Map mode, infinite map projection/content, runtime faults, focus release, WebGL recovery, clock, pause, accessibility, audio, generation, delivery and rollback gaps remain preserved in prior audit families.

## Completion boundary

Do not claim a fair best-run comparison, durable persistence, migration correctness, visible best-record support, matching-frame proof, artifact parity, Pages parity or production readiness until one admitted record scope is committed, restored and acknowledged.