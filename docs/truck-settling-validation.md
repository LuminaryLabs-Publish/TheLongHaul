# Truck settling physics — source and verification

**Scope:** `LuminaryLabs-Publish/TheLongHaul`, physics and render consumption only. No GitHub Actions or `.yml` changes. Existing road/freight behavior and deployment workflow are preserved.

## Change

The earlier model computed a desired roll and relaxed a visual spring toward that angle; the host then added a second low-pass filter on the rendered roll. The revised model applies lateral-force, drift-side-force and cargo-shift torques to a rotational inertia derived from effective mass, track and center-of-mass height. The suspension resists roll with restoring torque and a near-critically damped shock. A rollover remains latched when risk exposure reaches its limit. The host displays the authoritative angle directly, avoiding double easing. Compression/extension damping were increased to reduce after-bounce.

## Measurement

Bench fixture: 9,400 kg total mass, 1.42 m center-of-mass height, 0.48 radians initial roll, zero roll velocity, grounded, straight travel, no lateral torque, fixed 1/120-second integration. Settled when |roll| <= 0.02 radians and |roll velocity| <= 0.06 radians/second. Prior spring: approximately 1.48 seconds. Revised torque/inertia/damping: approximately 0.70 seconds. This is a deterministic model comparison, not a measurement of hardware frame rate. A 0.62-radian displacement settled in approximately 0.74 seconds.

## Evidence gates

- Run `node tests/rollover-regression.mjs` for mechanical restoration, stable no-overshoot response, drift lean, tip and correctable exposure.
- Run `node tests/vehicle-feel-regression.mjs`, `node tests/drift-regression.mjs` and `node tests/cargo-physics-regression.mjs` for loaded driving and countersteer behavior.
- Run `npm run build:host` to regenerate the checked-in browser runtime from the current source while verifying pinned engine hashes.
- Run `npm test` for project compatibility.
- Run a real browser rendering test and review the existing capture harness on a compatible host when available; confirm no wheel/contact mismatch. Browser/WebGL screenshots and user handling acceptance are separate from numeric tests.
- After pushing, verify the `main` ref, the unchanged `.github/workflows/deploy-pages.yml`, the resulting GitHub Pages run and live resources. A successful deployment is not the same as gameplay acceptance.

## NexusEngine authoring and goals

The game consumes the pinned NexusEngine runtime but does not install `n:agent:goal`, `n:agent:graph`, or `n:authoring:craft` in its WebGL runtime bundle. For future authoring automation, interpret this document's acceptance checks as authoring goals with versioned source/evidence, no writable verified flags and a human visual-review gate. Do not claim Goal Map/Craft runtime integration without installing and independently validating those kits.
