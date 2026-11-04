# Feature contract: weight transfer, recoverable wheel lift, and rollover

**Outcome:** The truck feels heavy without sluggish steering. Body roll, cargo shift, wheel contact visualization and tipping share one stability calculation, not random animation.

## Driver-facing rules

1. **Brake before a turn.** Braking pitches the body forward and lowers speed before cornering.
2. **Normal corner:** lateral acceleration leans the truck outward; sufficiently hard, sustained cornering unloads inside tires.
3. **Controlled drift:** an active drift leans into the requested slide. The drift is not an automatic rollover immunity.
4. **Bad drift correction:** opposite body lean, violent countersteering, heavy cargo and lateral acceleration increase the same rollover exposure.
5. **Warning:** inside wheels can visibly lift and the HUD reports tip risk before the rollover latches.
6. **Recover:** the driver can reduce steering/brake force to settle the suspension while not tipped; after tipping use the existing roadside F recovery with its cost and cooldown.
7. **Real consequences:** once tipped, acceleration is disabled, momentum decays, drift reserve is cleared, and the run's existing recovery interaction is used. No automatic righting.
8. **Accessibility:** reduced motion affects camera/screen shake, not the underlying stability rules.

## Ownership

- `src/game/truck-rollover.mjs`: one bounded, deterministic roll/exposure decision per existing truck substep.
- `src/game/truck-kit.mjs`: authoritative truck position, velocity, cargo, steering, slope, impact tip, wheel lift and recovery reset.
- `src/app/app-chunk-9.js`: render the authoritative lean; wheel meshes inherit their existing vehicle pivot and should visibly leave ground.
- `src/app/app-chunk-21.js`: wheel-lift/tip-risk HUD; no second physics state.
- `src/game/truck-dynamics-profile-kit.mjs`: tuning constants.
- `tests/rollover-regression.mjs`: deterministic state and recovery gates.
- `tools/record-skills.mjs`: real input-driven 60-second gameplay, frame-by-frame encoded with original game audio.

## Acceptance

- Brake-first cornering is less risky than an equivalent unbraked high-speed corner.
- Drift has visually inward lean and is recoverable with good steering.
- Excessive lateral acceleration and incorrect countersteering can unload inside wheels and tip.
- Warning appears before tip; wheel height derives from pose rather than fabricated oscillation.
- Rollover exposure decays when the driver corrects the maneuver.
- F recovery resets drift, roll, lift and exposure without duplicate rewards or energy.
- Delta-step, pause, load, freight, XP, UI and ability regressions continue passing.
- Record 60.000 seconds at 30fps / 1,800 real application frames, with matching audio and media inspection. A recorded video is evidence only after the capture run completes and its artifact exists.

## Limitations

Arcade stability is an intentionally tuned model, not validated multibody suspension dynamics. Per-side wheel-lift values are telemetry and visible wheel/chassis pose, while the existing collision support stays a bounded ground sphere. Full per-wheel suspension forces and terrain contacts require a separate physics feature.

## Mechanical settling refinement (2026-11-04)

The roll state is a damped rotational body, not a target interpolation. Restoring torque is proportional to vehicle mass, gravity, track half-width and suspension roll stiffness; opposing moments arise from actual cornering acceleration, drift-slip velocity and moving cargo. Rotational inertia incorporates the effective mass and cargo center-of-mass height. The physical shock uses a damping ratio near critical to avoid ringing. An explicit, measurable regression requires returning from a 0.48 radian recoverable lean in 0.4–0.75 seconds, with no overshoot or false rollover. The renderer consumes the same roll angle without a second low-pass filter.

**Authoring goal-map contract:** bind source revision and scenario facts to the acceptance evidence; inspect actual browser frames for wheel contact, drift and F recovery; reject stale video evidence after subsequent code changes. The pinned game bundle does not export the optional NexusEngine Goal Map or Craft harness, so those engine APIs are not represented as installed or exercised.
