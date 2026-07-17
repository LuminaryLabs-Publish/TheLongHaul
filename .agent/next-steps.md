# Next steps

**Timestamp:** `2026-07-17T17-39-07-04-00`

## Goal

Make best-run comparison, durability, restore and projection explicit without moving semantic policy into DOM or local-storage code.

## Checklist

### 1. Choose comparison scope

- [ ] Select `exact-course`, `seed-family`, `scoring-revision`, `global` or no persistent record.
- [ ] Define which course/generator/scoring revisions are comparable.
- [ ] Define tie behavior.
- [ ] Define how incomparable runs are presented.

### 2. Define the canonical record

- [ ] Add schema and schema version.
- [ ] Add record identity, revision and digest.
- [ ] Retain the course and scoring evidence required by the selected scope.
- [ ] Define public versus diagnostic fields.

### 3. Admit candidates

- [ ] Add `BestRunPolicyAdmissionCommand` and result.
- [ ] Add `BestRunCandidateCommand` and result.
- [ ] Classify better, equal, worse, incomparable and invalid candidates.
- [ ] Bind the complete terminal `RunResult` and scoring revision.

### 4. Commit durably

- [ ] Add `BestRunCommitCommand` and result.
- [ ] Compare expected prior revision before writing.
- [ ] Read back and verify schema and digest.
- [ ] Return classified storage failures without invalidating the completed run.

### 5. Restore, migrate and reset

- [ ] Add `BestRunRestoreCommand` and result.
- [ ] Handle absent, corrupt, incompatible and denied storage.
- [ ] Define migration from the current reduced v2 record.
- [ ] Add explicit reset/delete settlement.

### 6. Project the accepted record

- [ ] Decide title and results presentation.
- [ ] Show the comparison context.
- [ ] Bind route, record and projection generations.
- [ ] Publish `BestRunFrameDigest` and `FirstBestRunBoundFrameAck`.

### 7. Validate

- [ ] Test first, better, equal, worse, incomparable and invalid candidates.
- [ ] Test corrupt, denied and readback-mismatch storage.
- [ ] Test reload, retry, new course, title and reset.
- [ ] Run `npm test`.
- [ ] Compare source, artifact and Pages receipts.

## Retained work

Map-mode input/focus, infinite map viewport/content and previously documented runtime, rendering, accessibility, clock, audio, generation, delivery and rollback gaps remain separate unresolved contracts.