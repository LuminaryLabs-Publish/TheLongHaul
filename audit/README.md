# TheLongHaul local acceptance

NexusAuditor orchestrates existing local product commands. It does not own the game's simulation or renderer and performs no publishing.

- `baseline`: original deterministic regression command (`npm test`).
- `visuals`: actual DOM, keyboard, responsive layout and WebGL validation. Distant road/appearance fixtures are explicitly labelled in the report.
- `journey`: **one uninterrupted 600-second session** through ordinary keyboard controls and a bounded analog steering input adapter, not twelve disconnected tests. No position, health, cargo, score or weather injection occurs during the recorded journey.

Use the installed NexusAuditor CLI with `--profile audit/validation.json`, selecting `baseline`, `visuals` or `journey` as the suite. Run doctor and dry-run before execution. Build the host using `npm run build:host`, which verifies the pinned vendor hashes and required exports. Browser commands require installed Playwright/Chromium; media requires FFmpeg. All application navigation is local loopback.

`scenarios/ten-minute-playthrough.json` describes the active journey contract. The adapter emits input timestamps, state samples, event observations, source hashes, frame hashes, cut intervals and separate acceptance results. Video selection never manufactures events; any fallback editorial choice is identified in the cuts manifest. A failed acceptance run retains evidence and exits nonzero.

Outputs are under ignored `audit/runs/` or explicitly selected task-local `.cache/` directories. The original journey reference is silent 10 fps evidence. The final highlight uses 1,800 fresh 1920×1080 frames at 30 fps and the original offline-rendered game audio from matching source intervals. This does not certify real-time hardware performance.

Source rendering is sampled independently of the 60 Hz physics clock. The steering adapter is test-only and changes only the input axis, not physical vehicle state or game rules. Human steering preference, physical Mac/Safari performance and final production asset acceptance remain separate.
