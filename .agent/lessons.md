# Engineering lessons

## 2026-11-03 — Weight-transfer rollover

- **Problem:** The earlier roll spring was visual only. Steering and drifting could not cause a physical tip; an impact impulse was the only trigger. The visible tilt therefore lied about the risk.
- **Decision:** Calculate desired roll, instability exposure, wheel unloading and tipped state together inside the existing truck simulation. Do not create a second driver or visual animation clock.
- **Drift nuance:** Normal turns lean outward. Qualified drifts deliberately lean inward, but wrong countersteering and high lateral forces still threaten rollover.
- **Recovery:** Tipping clears stored drift momentum and uses the existing F roadside recovery path; avoid a new recovery currency or teleport.
- **Evidence requirement:** A test and a real-browser 60-second capture are different gates. A configured recorder is not a completed or inspected video. Preserve original audio and fixed-step frame hashes.
- **Open refinement:** Compare handling on mouse/keyboard/touch, heavy and unsecured loads, sloped terrain, and physical GPU before declaring production balance.
