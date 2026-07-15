# Render audit: motion setting visible-effect gap

**Timestamp:** `2026-07-15T00-38-54-04-00`

## Summary

The active Three.js presentation reads `settings.motion` for two rough-road oscillations. Other visible truck-body and camera effects continue with the switch off.

## Source-backed effect matrix

| Effect | Current implementation | Reads `settings.motion` |
|---|---|---:|
| Rough-road suspension oscillation | sinusoidal suspension X rotation | yes |
| Rough-road camera bob | sinusoidal camera Y offset | yes |
| Steering body roll | suspension Z rotation from steering and speed | no |
| Throttle/brake pitch | suspension X rotation from input | no |
| Cargo sway | crate Z rotation over time and cargo condition | no |
| Dynamic camera FOV | speed-dependent chase/cab FOV | no |
| Camera interpolation | continuous position/look interpolation | no |

## Visible-frame path

```txt
settings switch
  -> mutate and persist settings.motion
  -> resume or start driving
  -> updateTruckVisual
  -> updateCamera
  -> renderer.render(scene, camera)
```

There is no immutable motion profile attached to the frame. The renderer produces no receipt listing the enabled, reduced, or disabled effects.

## Required frame contract

```txt
MotionFrameAdmissionCommand
  -> MotionPreferenceRevision
  -> FrameId
  -> VehicleStateRevision
  -> CameraModeRevision
  -> viewport and renderer generation
  -> effect classification matrix
  -> admitted truck/camera transforms
  -> MotionFrameResult
  -> FirstMotionPreferenceFrameAck
```

## Expected reduced profile

The exact policy must be product-authored, but it should be explicit. A plausible reduced profile is:

```txt
rough-road suspension shake: disabled
rough-road camera bob: disabled
steering roll: reduced or disabled
throttle/brake pitch: reduced or disabled
cargo sway: disabled
dynamic FOV expansion: disabled
camera follow interpolation: retained with non-oscillating convergence
```

This is a policy example, not an implementation requirement established by the current source.

## Validation gap

```txt
per-effect render receipt: absent
preference/frame revision binding: absent
pixel or transform fixture: absent
reload-adoption fixture: absent
source/build/Pages parity: absent
```

No visual defect, accessibility outcome, or browser reproduction is claimed.