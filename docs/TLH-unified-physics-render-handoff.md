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


## 2026-11-11 Phase 2 evidence — partial, not accepted

Source-only V8 harness exercised the actual Game Movement V2 and related modules with a minimal Nexus-like resource/event scheduler. It is **not** the pinned NexusEngine runtime, full npm suite, a host build, or a browser/WebGL session.

- Replayed a deterministic 600-second flat-ground input sequence: finite positions/velocities, one observed landing, no non-finite states. This does not test streamed road or traffic.
- Accelerate, launch, touchdown, contact-point angular impulse, teleport orientation, and exact reactive-body save/restore: 5/5 focused checks passed after the quaternion normalization correction.
- Fixed original Movement V2 migration test to expect old V1 heading preserved inside the new world-space quaternion.
- Isolated body solver: settles under gravity, front/rear wheel loads nonzero, higher cargo COM increases roll response, a sustained lateral force tips over progressively, quaternion continuity remained bounded.
- Full `npm test`, `npm run build:host`, actual WebGL capture, real 600-second gameplay, V2/V3 interaction and hardware performance are **NOT RUN**. The sandbox cannot resolve `github.com` for clone; connected source reads do not yield a complete runnable checkout. Browser tools here cannot drive a source-pinned candidate runtime.
- This repo's only Actions workflow is `deploy-pages.yml`, triggered by main pushes or manual dispatch; it contains no build/test gate. No CI status or associated workflow run exists for the candidate.
- **Disposition: BLOCKED for release acceptance. Do not move the branch to main** until the actual project runner, build, regression suite and authentic WebGL/playing evidence pass. Main push would also trigger an automatic Pages deployment. Preserve this candidate without claiming delivery.
