# Gameplay audit: run-result to best-record loop

**Timestamp:** `2026-07-17T17-39-07-04-00`

## Gameplay loop

```txt
generate one five-branch course
  -> load freight and start five-minute run
  -> drive, discover depots and absorb penalties
  -> reject decoys or deliver at the valid depot
  -> settle Run, Delivery and meter evidence
  -> build a golf-style result
  -> show current score
  -> optionally replace one browser-global best record
  -> retry the same course or generate a new course
```

## Result evidence

The terminal result includes course identity, seed, valid depot, raw time, distance, par, depot count, collisions, cargo/truck condition, penalty components, adjusted time, versus-par and rating.

## Current best-record behavior

- One key is shared by all generated courses.
- Only lower `adjustedTime` replaces the record.
- The persisted object retains adjusted time, rating and a short course code.
- The stored record has no gameplay projection.
- No domain result says whether two generated courses are comparable.

## Gameplay ownership gap

A procedurally generated course changes route length, geometry, hazards and valid depot. A global lowest adjusted time can therefore mix distinct challenge instances unless that is an intentional product policy. The source contains no explicit policy result either approving global comparison or restricting comparison to a course/scoring identity.

This audit does not choose a policy. Valid options include:

```txt
exact-course record
seed-family record
scoring-revision leaderboard class
global arcade record with normalized comparison
no persistent record
```

## Required gameplay result chain

**Proposed, not implemented:**

```txt
RunResult
  -> BestRunPolicyResult
  -> BestRunCandidateResult
  -> BestRunCommitResult or storage-failure result
  -> BestRunProjectionResult
  -> FirstBestRunBoundFrameAck
```

`BestRunCandidateResult` should classify `better`, `equal`, `worse`, `incomparable` or `invalid` and preserve the comparison evidence used.

## Boundary

No scoring formula, record policy, gameplay flow or retry behavior changed.