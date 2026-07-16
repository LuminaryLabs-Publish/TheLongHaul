# Gameplay audit: focus-loss runaway-driving loop

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** prevent a lost browser key release from creating unintended movement, resource consumption, collisions, penalties, delivery checks, recovery use, or terminal outcomes.

- [x] Trace continuous and one-shot actions into gameplay.
- [x] Identify consequences of stale evidence.
- [x] Separate source-backed risk from reproduced failure.
- [ ] Add lifecycle settlement and gameplay fixtures.

## Continuous action path

```txt
W / ArrowUp
  -> throttle
  -> truck acceleration
  -> fuel spend
  -> distance and max-speed telemetry
  -> streamed-world focus

S / ArrowDown
  -> brake or reverse
  -> truck speed/position
  -> distance and stuck-state changes

A/D / arrows
  -> steering
  -> heading and road departure
  -> camera target
  -> collision and off-road risk

Shift
  -> boost
  -> higher acceleration and fuel spend
```

## One-shot action path

```txt
C      -> camera mode
M      -> map state
Escape -> pause
R      -> retry same course
E      -> depot check or roadside recovery
```

## Focus-loss risk loop

```txt
player holds a driving key
  -> keydown accepted
  -> browser focus changes before keyup
  -> no lifecycle retirement runs
  -> browser may omit keyup
  -> mutable key remains true
  -> driving route becomes active again
  -> stale intent is resubmitted every frame
  -> Truck, Run, meters and presentation continue
```

## Possible gameplay effects

- Continued throttle can spend fuel and increase distance.
- Continued steering can leave the road and trigger hard off-road penalties.
- Continued movement can contact trees, rocks, deer, or elk.
- Collisions can damage truck and cargo meters.
- Continued driving can change discovered roads and depots.
- A stale boost state can accelerate fuel depletion.
- A stale one-shot `R` can restart the run after restoration.
- A stale `E` can check a depot or consume the only recovery.
- A stale `Escape` can alter route state unexpectedly.
- These effects can change score, failure reason, and terminal route.

## Required gameplay policy

```txt
focus ownership lost
  -> retire input generation
  -> clear continuous and one-shot evidence
  -> neutralize Core Input and Truck Input
  -> optionally pause Run and lock remaining-time
  -> acknowledge neutral gameplay frame
  -> require fresh user evidence to resume movement
```

The optional pause decision must be explicit. Neutral input is mandatory even if the game chooses not to pause.

## Fixtures

1. Hold throttle, dispatch blur without keyup, restore focus, verify zero new acceleration.
2. Hold steering, hide page, restore, verify heading remains stable until fresh keydown.
3. Hold boost, pagehide/pageshow, verify no continued boosted fuel spend.
4. Queue `R`, `E`, `M`, `C`, and `Escape`, retire route before consumption, verify cancellation.
5. Blur during off-road movement, verify no new collision transaction is caused by stale input after restore.
6. Blur before a depot gate, verify no stale interaction check.
7. Restore focus and press a fresh key, verify normal control resumes.

## Validation boundary

No gameplay incident was reproduced. Runtime and balance were not changed. This document records the missing lifecycle guarantee and the consequences that fixtures must cover.