> **ARCHIVED CONTEXT / NOT THE CURRENT TASK — 2026-11-11 documentation cutover.** This is historical engineering learning. Preserve it as original evidence; do not treat its headings, unchecked steps, branch names or completion claims as current execution authority. Use the live handoff (internal shared-drive source; locate by title), [project technical index](../docs/INDEX.md) where the relative link applies, and exact repository source. The following original content is retained unchanged.\n\n# Engineering lessons

## 2026-11-03 — Weight-transfer rollover

- **Problem:** The earlier roll spring was visual only. Steering and drifting could not cause a physical tip; an impact impulse was the only trigger. The visible tilt therefore lied about the risk.
- **Decision:** Calculate desired roll, instability exposure, wheel unloading and tipped state together inside the existing truck simulation. Do not create a second driver or visual animation clock.
- **Drift nuance:** Normal turns lean outward. Qualified drifts deliberately lean inward, but wrong countersteering and high lateral forces still threaten rollover.
- **Recovery:** Tipping clears stored drift momentum and uses the existing F roadside recovery path; avoid a new recovery currency or teleport.
- **Evidence requirement:** A test and a real-browser 60-second capture are different gates. A configured recorder is not a completed or inspected video. Preserve original audio and fixed-step frame hashes.
- **Open refinement:** Compare handling on mouse/keyboard/touch, heavy and unsecured loads, sloped terrain, and physical GPU before declaring production balance.

## 2026-11-04 — Restore mechanical suspension settle before publishing

- **Observed cause:** The previous roll spring/damper took about 1.48 seconds to return from a 0.48-radian lean in the isolated load fixture. The render host then low-pass filtered the simulation's roll again. This compounded latency and made wheel lift appear to float.
- **Correction:** Use one angular degree of freedom with measured mass, center-of-mass height, track half-width, side-force torque, suspension restoring torque, and near-critical shock damping. Upward wheel travel and lateral force still trigger the same rollover logic; there is no forced upright teleport.
- **Visual ownership:** Render authoritative roll directly; only terrain/contact presentation can make a vertical adjustment. Do not add another animation-level roll spring.
- **Current measured gate:** From 0.48 radians, the isolated unloaded-force fixture reached <0.02 radians and <0.06 rad/s in 0.70 seconds (1/120-second steps), versus 1.48 seconds in the retained baseline algorithm. Full gameplay frame timing and subjective hardware handling are separate gates.
- **Authoring/Goal Map alignment:** Goals are evidence-bound (mechanical settling, no oscillation, steerable drift, recoverable lift, controlled tip, source/runtime parity, delivery). Revision changes invalidate old evidence; a source commit alone never marks visual approval. The existing pinned browser engine does not currently expose the optional agent Goal Map and Craft APIs, so this handoff is a host validation contract rather than a claim of an installed engine harness.
- **Workflow boundary:** No `.yml` or GitHub Actions changes. Preserve the existing deployment workflow unchanged.
