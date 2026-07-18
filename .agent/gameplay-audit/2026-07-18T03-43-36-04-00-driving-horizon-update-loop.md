# Gameplay audit: driving and horizon update loop

**Timestamp:** `2026-07-18T03-43-36-04-00`

## Player loop

```txt
start course
  -> freight loaded
  -> five-minute clock starts
  -> drive five branches
  -> inspect five candidate depots
  -> reject four decoys
  -> deliver to one valid depot
  -> receive score
  -> retry or generate a new course
```

## World loop added by the runtime delta

```txt
near field
  -> 5x5 active uniform-grid cells
  -> streamed terrain, roads, props and collision obstacles

far field
  -> quadtree horizon world
  -> curved terrain
  -> macro-sector roads and settlements
  -> no collision
```

The truck now samples a shared terrain height and normal, uses road-elevation flattening, applies suspension and ground orientation, and drives with a raised chase camera. The visual horizon is updated from truck movement through a 384-unit focus key.

## Gameplay relevance

The horizon is presentation-only, but it affects route readability, speed perception and confidence that the world continues beyond the active cell window. A stale or mismatched horizon patch does not directly change truck simulation, yet it can present terrain and landmarks that do not correspond to the latest accepted focus and atlas sample.

## Current settlement boundary

```txt
simulation truth
  -> truck position and course seed

world truth
  -> Core World active quadtree cells
  -> provider patch map

presentation truth
  -> Three.js host map
```

These three layers do not share one generation identity.

## Required gameplay-safe behavior

- Horizon replacement must never pause the truck simulation.
- The latest accepted patch must replace an older host atomically.
- Stale patch completion must not overwrite a newer focus generation.
- Near-field terrain remains authoritative for truck ground contact.
- Horizon content remains non-colliding.
- Route landmarks must not duplicate or disappear during LOD transitions.
- Failure to prepare optional horizon content must degrade presentation without ending the run.

## Proposed result chain

```txt
truck focus revision
  -> HorizonPatchBuildResult
  -> HorizonHostReconciliationResult
  -> HorizonFrameDigest
```

## Boundary

No gameplay mechanics, course generation, scoring, timer, truck dynamics, collision or delivery behavior changed during this audit.
