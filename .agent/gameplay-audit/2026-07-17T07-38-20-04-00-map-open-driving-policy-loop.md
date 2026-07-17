# Gameplay audit: map-open driving policy loop

**Timestamp:** `2026-07-17T07-38-20-04-00`

## Current loop

```txt
held controls
  -> truck input
  -> course/run sampling
  -> fuel spending
  -> KeyM opens map
  -> engine tick
  -> collisions, wildlife, failure and delivery remain active
  -> streaming and presentation continue
```

Opening the map does not create a gameplay mode. Because the current scene remains `driving`, all movement and outcome systems remain admitted.

## Product decisions that must be explicit

1. **Live-driving map:** keep all controls and simulation active; communicate the risk and preserve focus on gameplay.
2. **Restricted-driving map:** keep simulation live but mask throttle, steering, boost, interaction, retry or camera actions according to policy.
3. **Suspended map:** pause Truck, Run, Simulation, streaming demand and gameplay outcomes while retaining presentation.

The runtime currently behaves closest to live-driving, but there is no manifest or result declaring that choice.

## Required gameplay result

`MapModeAdmissionResult` must carry the accepted action mask, simulation policy, clock policy, streaming policy and close behavior. Truck, Run, Course, Delivery, Wildlife and meters must consume that result rather than infer state from a DOM boolean.

## Boundary

No gameplay behavior changed and no preferred product policy is claimed.