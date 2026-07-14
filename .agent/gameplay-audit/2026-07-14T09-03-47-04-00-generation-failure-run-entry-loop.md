# Gameplay audit: generation failure and run entry loop

**Timestamp:** `2026-07-14T09-03-47-04-00`

## Player loop

```txt
title
  -> generate one seeded course
  -> spawn with freight loaded
  -> drive a six-minute timed run
  -> explore five distinct branches
  -> inspect five plausible depots
  -> wrong depot: reject and add 20 seconds
  -> correct depot: complete and score
  -> retry same seed or generate a new seed
```

## Risk loop

```txt
high speed or poor route reading
  -> off-road, rough-road, obstacle, boundary, or wildlife impact
  -> time penalty and/or truck/cargo damage
  -> fuel and condition pressure
  -> one roadside recovery with a 30-second penalty
  -> completion or failure
```

## Generation-to-gameplay gap

The route, depot, destination, terrain, wildlife, truck, and streamed world are built through live side effects. Final validation happens after several gameplay participants already exist. A generation error does not produce a recoverable game state.

```txt
generation fails
  -> no driving scene
  -> no same-seed retry command
  -> no new-seed retry command
  -> no title transition
  -> no preserved prior run
  -> reload required
```

## Required gameplay result

`CourseGenerationResult` should classify:

```txt
Accepted
RejectedInvalidRoute
RejectedInvalidWorld
RejectedMissingDestination
RejectedMissingTruck
FailedProvider
FailedPresentationProbe
Superseded
RolledBack
```

An accepted result must bind the course seed and every gameplay participant used by the run. A rejected or failed result must leave the player in a controlled scene with retry and exit actions.
