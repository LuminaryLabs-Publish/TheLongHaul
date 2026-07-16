# Render audit: policy state versus visible world

**Timestamp:** `2026-07-16T14-01-02-04-00`

## Summary

The visible game can render a coherent frame while the installed product-policy resources describe a different world, road, terrain, truck, or delivery configuration.

## Current frame path

```txt
hardcoded course/cell descriptors
  -> Core World provider
  -> Three.js terrain, roads, trees, grass, depots, signs
hardcoded truck simulation
  -> truck rig and camera
single-depot delivery state
  -> HUD, map, result overlays
  -> renderer.render(scene, camera)
```

## Missing visible proof

- No frame snapshot includes `ProductPolicyGeneration` or digest.
- World geometry does not prove it used world-profile or terrain-policy revisions.
- Road meshes do not prove they used the road-class catalog.
- Truck pose/speed does not prove it used the dynamics profile.
- HUD/map/results do not prove they used a delivery-contract record.
- Changing a policy resource does not force derived geometry or rigs to rebuild.
- No stale render-generation rejection exists.
- No `FirstPolicyBoundFrameAck` exists.

## Required render contract

```txt
accepted ProductPolicySnapshot
  -> generation-bound course/cell descriptors
  -> generation-bound truck/run/delivery snapshots
  -> generation-bound render snapshot
  -> reject stale resources
  -> render one coherent frame
  -> FirstPolicyBoundFrameAck
```

## Validation need

A browser fixture must configure one non-default value in each policy family and prove a corresponding visible or semantic effect without mixed-generation artifacts.

## Boundary

No rendering code changed during this documentation audit.