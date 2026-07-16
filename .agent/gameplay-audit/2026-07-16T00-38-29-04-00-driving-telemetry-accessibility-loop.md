# Gameplay audit: driving telemetry accessibility loop

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Summary

The gameplay loop produces high-frequency vehicle and run telemetry plus low-frequency decisions such as depot eligibility, penalties, recovery, completion and failure. The DOM projection does not distinguish these semantic classes: continuous telemetry shares one live region, while meaningful decisions lack typed announcement identities.

## Plan ledger

**Goal:** make gameplay information perceivable without changing simulation authority or announcing every frame.

- [x] Trace generation, driving, depot interaction, recovery, penalties and terminal outcomes.
- [x] Separate continuous telemetry from meaningful gameplay transitions.
- [x] Identify missing semantic identities and acknowledgements.
- [ ] Implement a revision-bound gameplay accessibility read model.

## Gameplay loop

```txt
start
  -> generate five branches and depots
  -> publish visual generation percent and phase
  -> spawn truck and start run

drive
  -> update timer, speed, road, fuel, truck and cargo
  -> explore roads and depots
  -> update map and interaction eligibility
  -> apply hazards and penalties

interact
  -> stop at depot or satisfy recovery conditions
  -> press E
  -> accept or reject depot / execute recovery
  -> publish visual toast and state changes

settle
  -> complete delivery or fail run
  -> activate results or loss route
```

## Semantic classes

### Continuous, queryable telemetry

```txt
speed
road name
remaining time
fuel
truck condition
cargo condition
position and map exploration
```

These values should remain available in the accessible read model but should not automatically announce at frame cadence.

### Discrete, announceable results

```txt
generation phase threshold
final-minute threshold
low-fuel or critical-condition threshold
interaction became available or unavailable
wrong-depot result
collision or recovery penalty
recovery consumed
valid delivery accepted
run completed
run failed
```

These require stable event identity, priority, deduplication and route/run revision binding.

## Current gap

```txt
GameplaySemanticEventId: absent
telemetry threshold policy: absent
interaction eligibility revision: absent
announcement priority: absent
announcement deduplication key: absent
accepted gameplay event -> announcement receipt: absent
announcement -> matching visible frame ack: absent
```

## Required authority relationship

The accessibility domain must observe accepted gameplay state and results. It must not infer or mutate gameplay truth from DOM text. It publishes semantic deltas only after the owning gameplay domain accepts the corresponding run, vehicle, delivery, condition or penalty revision.

## Required proof

```txt
continuous driving remains operable without announcement churn
interaction eligibility announces once per meaningful transition
wrong yard and penalties announce once
critical condition thresholds do not repeat every frame
completion/failure announcement matches the accepted result route
retry/new-run retirement prevents predecessor announcements
```

Documentation only. Gameplay behavior was not changed or executed.