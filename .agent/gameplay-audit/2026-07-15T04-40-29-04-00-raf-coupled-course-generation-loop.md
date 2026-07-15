# Gameplay audit: RAF-coupled course generation loop

**Timestamp:** `2026-07-15T04-40-29-04-00`

## Interaction loop

```txt
Start or Retry
  -> clear accepted world
  -> reset gameplay kits
  -> enter generating
  -> build 31 work units

one animation callback
  -> execute one work unit
  -> record one progress step
  -> tick engine and render

repeat until ready
  -> start run
  -> transition to driving
```

## Unit classes currently mixed in one queue

```txt
cheap state initialization
route trunk and five branch construction
depot and sign placement
nine terrain data builds
atmosphere and Core World registration
ten wildlife records and hazard adoption
truck/resource setup
route validation
Core World validation
ready marker
```

## Gameplay risk

Course identity remains seeded, but the time and browser frames required to become playable depend on callback delivery and unit cost. A hidden or throttled page can retain a partially generated attempt. A costly unit can occupy the same frame that must update loading feedback and draw the partial world.

The current run start has no immutable `GenerationReadyResult` tying together:

```txt
seed and course fingerprint
route validation receipt
world validation receipt
active-cell revision
depot destination revision
hazard revision
truck start revision
first playable frame
```

## Required gameplay settlement

Generation should remain non-gameplay until all mandatory receipts are accepted. Only `GenerationReadyCommand` may start Core Simulation and expose driving input. Cancellation, retry and failure must retire all partial work before another attempt becomes eligible.

## Boundary

This audit does not claim nondeterministic course content. It identifies scheduling, readiness and evidence ownership around deterministic content.