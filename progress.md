Original prompt: Epxlain every performance issue. be hyper critical and then look through the nexus engine to see if we are implementign anyting in away tha tmake the perfomacne super bad on a macbook pro. It shoudl aos have a boost to start so the truck starts at 50% of it defualt speed.

## 2026-10-19

- Audited the working tree and the exact Nexus Engine revision imported by the game, b941c9b2995e3449c6987908657753e2cf2df242. Preserved all existing local edits.
- Measured Metal-backed Chromium on the host M2 Pro MacBook Pro, 16 GB RAM. Captured warm Campaign/Endless samples, CPU function timings and sampling, and asynchronous GPU timer queries. See `.agent/performance-audit.md` and `.agent/performance-audit/`.
- Launch now queues a heading-aligned velocity at half the configured normal maximum forward speed in the Ready generation phase. Campaign upgrades configure during truck preparation, before launch. Retry uses the same launch path. Pause and recovery keep their zero-speed behavior.
- Fixed teleport's nonzero-speed contract: its planar velocity previously stayed zero even when its speed field was nonzero.
- Added `render_game_to_text` for browser behavior checks. No persistent profiling wrappers were added.
- Existing atomic-domain and gameplay smoke suites passed. Static-shell smoke fails on an existing stale assertion that expects the old inline vegetation selection, now owned by the tree mesh builder. Syntax and diff checks passed.
- Browser confirmed Campaign launch at 17.986 m/s for a 36 m/s configured maximum, after the first simulation step.
- Browser confirmed Endless launch at 15.240 m/s for a 30.5 m/s configured maximum, retry at 15.233 m/s, and pause/resume near zero without reapplying launch. Inline velocity checks passed at four headings and for zero-speed recovery.
- Published 25 ranked findings, source pointers, measurement conditions and repair order in `.agent/performance-audit.md`; saved measurement summaries and source fingerprints in `.agent/performance-audit/`.
- Ran the prescribed web-game client using the existing cached Playwright package and Chrome executable through a temporary environment adapter. The client's fresh context reached title but its Start click was blocked by an existing boot-failure overlay after slow initialization. A retry with the exact pinned engine source served from the temporary local download also hit that overlay. Captured and visually inspected its screenshots. Hardware-backed MCP browser interactions independently passed Campaign/Endless launch, retry and pause/resume. The client samples used software rendering and are excluded from performance measurements.
- Follow-up priorities: remove world snapshot reads from existence checks, bound Endless scenery, bypass/repair missing feature-domain calls and failed horizon providers, then remove gameplay transmission and budget generation. No broad performance optimization was implemented in this audit.


## 2026-10-19 performance cleanup

- Implemented the authorized local cleanup: bounded worker-backed scenery, local runtime bundles, render batching, cheaper terrain/state queries, repaired horizon, real quality budgets, visibility-aware lifecycle and garage ownership. Preserved the rolling start and existing visual/collider work.
- Built the committed static assets; all existing smoke suites and standalone gameplay client pass. Window/pause/fallback/cache/upgrade checks pass. Final 90-second moving checkpoints show p95/p99 at most 16.8 ms, 81 high-quality hosts and at most 104 cached patches.
- Evidence and limitations: `.agent/performance-cleanup.md`, `.agent/performance-cleanup/`. Keep the original audit as a historical baseline. No engine repository or deployment files were edited.


## 2026-10-19 double-tap forward boost

- Request: “make it so double tapping W or forward arrow usaes ta 5 secodn boost that charges tyou forward relaly fast. And uses a warmpe focus and strema parkcletielce.s”
- Added a same-key double-tap burst lasting five gameplay seconds, strong automatic acceleration, smooth speed-cap recovery, countdown, warm focus/wider FOV and one 96-line streaming particle batch (48 on low quality). Reduced motion preserves mechanics without the motion effects.
- Built static runtime, all three existing smoke suites pass. Inline checks cover five-second timing, independent keys, slow taps, no active refresh and cancellation. Browser verified W activation, held-key/repeat rejection, brake cancellation, ArrowUp activation and natural expiry after approximately five seconds, reduced-motion suppression and pause reset. Standalone client reached 56.425 m/s against the default 30.5 m/s cap; inspected screenshot and state, zero client errors.
- Only The Long Haul changed; deployment configuration is unchanged. Continuing the authorized main-branch workflow after validation.
