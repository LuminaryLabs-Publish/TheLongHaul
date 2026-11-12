# Truck Physics — Source Contract
> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

**Owners:** `truck-movement-v2-kit.mjs`, `truck-reactive-body.mjs`, `truck-tire-forces.mjs`, `truck-spring-mass.mjs`, `truck-dynamics-profile-kit.mjs`, `cargo-profiles.mjs`; runtime host `src/app/app-chunk-9.js`. Legacy fallback `truck-kit.mjs` must remain intact.

**Main behavior:** V2 models axle slip and yaw tire torque, a reactive spring/box pitch-roll response, loaded cargo shifts and impulse events. At the reviewed main SHA, grounded height is still clamped and yaw is separately integrated; do not claim true single 6DOF acceptance.

**Candidate:** `work/unified-truck-physics-render-20261111` changes to a world quaternion and contact-based vertical support. Source-only V8 harness tests are limited; npm build, actual WebGL and Road V2/V3 acceptance are outstanding. Never silently import candidate claims into main-state documentation.

**Invariants:** one simulated physical state, real world contact impulses, correct axle load/traction, no unwanted teleport on pickup, vehicle/cargo momentum preserved, recovery explicit, save/load migration, pause freeze and controllable handling.

**Tests:** `tests/truck-movement-v2-regression.mjs`, `tests/vehicle-feel-regression.mjs`, `tests/cargo-physics-regression.mjs`, `tests/rollover-regression.mjs`, `tests/comic-crash-movement-regression.mjs`. Actual gameplay and camera acceptance required separately. See `docs/truck-settling-validation.md` only as historical evidence.
