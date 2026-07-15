# Motion audit: camera and body-effect policy contract

**Timestamp:** `2026-07-15T00-38-54-04-00`

## Goal

Define one product-owned policy for all visible motion effects without changing vehicle truth or replacing the existing camera and truck rigs.

## Profiles

```txt
Full
  preserve authored motion effects

Reduced
  remove periodic shake and large presentation-only motion
  retain stable camera following and essential steering readability

Static
  minimize nonessential presentation motion
  retain only transforms required to represent authoritative vehicle position and heading
```

The exact effect values are product policy. They must not remain implicit booleans scattered through render functions.

## Effect registry

```txt
truck.roughRoadOscillation
truck.steeringRoll
truck.accelerationPitch
truck.brakingPitch
cargo.crateSway
camera.roughRoadBob
camera.speedFovExpansion
camera.positionConvergence
camera.lookConvergence
```

Each effect needs:

```txt
stable effect id
owner
input revisions
profile behavior
amplitude or convergence limit
fallback
receipt
retirement behavior
```

## Adoption contract

```txt
prepare all mandatory participants
  -> validate requested profile
  -> derive effect policy
  -> retain prior policy on failure
  -> atomically publish MotionPreferenceRevision
  -> persist accepted document
  -> use revision on next render admission
  -> acknowledge first matching frame
```

## Persistence contract

```txt
settings key: the-long-haul-settings
current field: motion boolean
migration target: versioned motionProfile
legacy true -> Full
legacy false -> Reduced
malformed or absent -> product default
write failure -> explicit persistence receipt failure
```

## Non-simulation rule

Motion preference must not change:

```txt
vehicle position or velocity
steering authority
collision detection
hazard motion
resource pressure
run timer
score
route or delivery eligibility
```

## Retirement

A replaced preference revision remains valid only until the first accepted successor frame. Late frames citing the predecessor revision must be rejected or explicitly classified as transitional.