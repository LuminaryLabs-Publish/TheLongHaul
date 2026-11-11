# The Long Haul — Unified chassis and render ownership candidate

Status: **Phase 1 implemented; Phase 2 validation pending**. Branch: `work/unified-truck-physics-render-20261111`.
Base: `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. No main, engine, or GitHub Actions changes.

## Outcome and source ownership
- `truck-reactive-body.mjs` owns the chassis' 3D quaternion, 3-axis angular velocity, vertical mass-center dynamics, ground contact reactions, and rolled/resting posture.
- `truck-movement-v2-kit.mjs` retains powertrain, road/cargo integration, drivetrain input and horizontal vehicle velocity. It uses chassis contacts for vertical state/traction and derives heading from the physical quaternion.
- `truck-tire-forces.mjs` takes the chassis' measured front/rear wheel normal distribution rather than manufacturing a constant axle load split.
- `app-chunk-22.js` forwards real comic traffic impact points to the chassis impulse event. Authored impulses without a point retain a bounded legacy torque fallback.
- `app-chunk-9.js` uses the chassis world quaternion and center height directly for V2; the V1 presentation path remains separately available.
- The existing Three.js `four-band-cel-host` and `sobel-outline-host` preserve `toon world → depth outline → screen` ordering. No engine PR #4 source, vendor pin, provider or Actions was modified. PR #4's portable pass-planning work must not be claimed installed or GPU-verified.
- Save snapshots with `poseSpace: world` preserve the world-space quaternion; older reactive local-tilt snapshots migrate by composing stored heading with local tilt.

## Phase 2 acceptance required
1. Run `npm test`, `npm run build:host`, `node tests/unified-rigidbody-regression.mjs`, and focused truck, cargo, terrain and crash regressions.
2. Fix all source/test failures, especially old stationary-ground assumptions, impact impulses and crossing ground-surface gradients.
3. Inspect real gameplay and renderer at freight start, junctions, road V2/V3 and traffic impacts, with actual browser/WebGL when available.
4. Validate a continuous 600-second game run, fixed seed and inputs, desktop/narrow viewport, clear/rain and 30/60/120Hz simulation consistency.
5. Archive logs, frame captures, runtime characteristics, source commit SHA and any irreducible environment blockers in the existing shared-drive project. Do not label Phase 2 complete solely from static or headless fixture coverage.

Known candidate risk: the World ground sampling currently passes one local contact plane per frame; independent four-wheel terrain heights across uneven road/shoulder transitions and collision-to-render vertical offsets require actual runtime verification. This is not yet an accepted implementation.
