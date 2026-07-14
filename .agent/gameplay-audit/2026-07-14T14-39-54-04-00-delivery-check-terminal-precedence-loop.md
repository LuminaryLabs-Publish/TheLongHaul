# Gameplay audit: delivery-check terminal precedence loop

**Timestamp:** `2026-07-14T14-39-54-04-00`

## Current gameplay sequence

```txt
player stops at a depot
  -> presses E
  -> host captures raw time, distance, collisions, cargo and penalties
  -> host emits depot check
  -> accepted delivery builds run result
  -> simulation marks completed
  -> same-step collisions and impacts skip
  -> same-step failure and timeout cannot replace completion
  -> results screen opens
```

## Effective precedence

```txt
accepted delivery
  > wildlife collision
  > boundary or obstacle impact
  > cargo/truck/fuel/stuck failure
  > timeout
```

This may be an acceptable game-design choice, but it is currently an accidental consequence of phase and loop order. It is not represented as a policy that can be reviewed, versioned or tested.

## Player-facing risks

- A collision at the gate can be absent from collision count and penalty total.
- Same-step cargo damage can be absent from cargo condition and adjusted time.
- A timer reaching zero in the accepted-delivery step can still yield completion.
- A run can appear reproducible while hidden phase order controls the result.
- Retry replaces mutable state without retaining explicit predecessor lineage.

## Required gameplay contract

```txt
one RunId and StepId
  -> gather every terminal proposal
  -> finalize effects
  -> apply explicit precedence
  -> publish one outcome
  -> expose the reason and final metrics
  -> retain outcome through retry
```

## Fixtures

```txt
delivery only
delivery plus wildlife collision
delivery plus obstacle impact
delivery plus cargo destruction
delivery plus truck destruction
delivery plus fuel failure
delivery plus timeout
duplicate depot check
late predecessor proposal
same-seed retry lineage
```