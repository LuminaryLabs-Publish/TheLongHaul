# Gameplay audit: dual Core gameplay truth loop

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Summary

The playable haul and the new Core smoke define overlapping but different gameplay truth. The playable game uses a 360-second run, `fuel/truck/cargo` Resource Pressure state, inline RNG, and a custom penalty ledger. The Core profile smoke uses a 300-second remaining-time meter, `fuel/truck-condition/cargo-condition`, named streams, and Core Transaction Ledger receipts.

## Plan ledger

**Goal:** adopt one gameplay truth schema before promoted Core services are used for retry, replay, scoring, recovery, or delivery settlement.

- [x] Compare playable and Core-profile state identifiers.
- [x] Compare time limits and threshold semantics.
- [x] Compare randomness and duplicate-operation ownership.
- [x] Identify migration and replay requirements.
- [ ] Choose one canonical schema.
- [ ] Prove equivalent runs before retiring legacy state.

## Playable gameplay loop

```txt
new course seed
  -> inline hash/RNG generates graph, terrain, vegetation, wildlife, materials
  -> custom delivery state chooses one valid depot
  -> custom run state starts at 360 seconds
  -> Resource Pressure owns fuel, truck, cargo
  -> vehicle/hazard/delivery events mutate custom states
  -> custom penaltyLedger suppresses repeated penalties
  -> accepted depot builds score from run and condition state
  -> retry regenerates from the same seed
```

## Core smoke gameplay model

```txt
Core Data seed
  -> named streams: course-layout, valid-depot, terrain,
     vegetation, wildlife, materials, presentation
  -> course envelope schema and digest

Core Simulation meters
  -> fuel
  -> truck-condition
  -> cargo-condition
  -> remaining-time starting at 300 seconds in the smoke

Core Transaction Ledger
  -> operation ID and run ledger
  -> apply once
  -> duplicate receipt
```

## Divergence risks

```txt
same seed does not imply same named-stream draw history
playable retry does not restore Core RNG stream cursors
course envelope digest is not admitted before playable world creation
360-second playable truth differs from 300-second Core smoke truth
truck/cargo IDs differ across the two meter models
fuel can exist in Resource Pressure and Core Simulation simultaneously
remaining time can exist in custom run state and Core Simulation simultaneously
penalty duplicate checks and Core Transaction Ledger can disagree
accepted delivery can settle against state not represented in the Core profile
save/retry/replay has no cross-model migration revision
```

## Required gameplay convergence

```txt
CanonicalGameplaySchema
  timeLimitSeconds
  resource meter IDs and thresholds
  score inputs
  penalty operation IDs
  recovery operation ID
  depot-check operation IDs
  course schema and generator version
  RNG algorithm, stream names, and cursors

CoreGameplayMigrationCommand
  -> bind legacy run, Resource Pressure, delivery, penalty,
     RNG, course, and Core-profile revisions
  -> stage canonical meter and ledger state
  -> verify totals and terminal eligibility
  -> commit atomically or reject
  -> publish CoreGameplayMigrationResult

SameSeedParityCommand
  -> run legacy and adopted profiles from one seed and command log
  -> compare course, valid depot, meters, penalties, score, and outcome
  -> publish SameSeedParityResult
```

## Acceptance fixtures

```txt
same seed produces the same course package and valid depot
retry restores exact named-stream cursors
fuel/truck/cargo values migrate without clipping or renaming loss
remaining time is singular and matches the authored 360-second rule or an explicit new rule
wrong-depot and collision penalties apply once in both models
recovery applies once in both models
terminal score inputs are identical
legacy and adopted snapshots hash to the same canonical gameplay state
```

## Boundary

No gameplay value was changed. The audit does not prescribe 300 or 360 seconds; it requires one explicit authoritative value and migration policy.