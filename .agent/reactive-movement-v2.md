# Movement V2 — reactive box balance

Scope: `LuminaryLabs-Publish/TheLongHaul` only. The existing `truck-kit.mjs` (V1), NexusEngine, assets, world tiles, and deployment workflows are unchanged.

## Design

- `long-haul-truck-movement-v2-kit` remains the only active gameplay truck kit. V1 can still be selected explicitly.
- The original invisible spring retains a partition of the effective truck-plus-cargo mass. Its calculated reaction force and the rigid mass fraction jointly determine the torque from vehicle acceleration; no second cargo spring or hardcoded inward-drift lean is added.
- `truck-reactive-body.mjs` integrates angular velocity, unit quaternion, vertical velocity, and box-corner ground-contact normal forces at up to 120 Hz. The rotated 3D box has four lower and four upper corners. Gravity/contact and spring torque produce natural upright balance or side/roof resting orientations. Collision roll impulses change **angular velocity**, not orientation or a rollover flag.
- Tire steering yaw and lateral friction obey a bounded available lateral acceleration. A drift release retains its world momentum direction rather than snapping velocity to the facing direction.
- `tipped`, `rollMode`, `rollAngle`, and wheel-lift data remain **read-only projections** of body orientation/contacts for existing HUD, scoring, and F-roadside recovery. They are not physics control flags.
- `app-chunk-9.js` renders the actual quaternion and collider-driven vertical position for V2; V1 retains its original clearance renderer. Stationary contact-spring sag is compensated because the authored tire mesh is not deformable.
- Existing profile tuning and freight, scenery, authored truck art, traffic, skills, deployment, and road generation are preserved.

## Evidence and limitations

- Direct V2 tests cover spring passivity; heavier and higher COM; contact normal transfer; force-driven fall; quaternion continuity (no snap); hard steering slip; drift/countersteer; cargo; V1 rollback; save migration; pause; reset/recovery.
- The NexusEngine game smoke and static runtime checks pass; built with `npm run build:host`, keeping pinned NexusEngine/Three versions.
- The larger regression run reached the new environment-tile tests and failed at `tests/environment-tile-renderer-regression.mjs:52` (`road paint is separate`). Reproduced identically on the unmodified `e927e727` deployment artifact. `environment-tile-streaming-regression.mjs` inherits that baseline failure. Those unrelated tiles were not changed; the independent environment stress test passes.
- Browser navigation to localhost is blocked by sandbox policy (`ERR_BLOCKED_BY_ADMINISTRATOR`) and WebGL is unavailable in sandbox Chromium. Real interactive visual handling remains an independent acceptance gate, not claimed completed.
