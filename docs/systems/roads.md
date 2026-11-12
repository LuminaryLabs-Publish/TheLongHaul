# Roads and World Surface — Source Contract
> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

**Owners:** `src/game/course-kit.mjs`, `road-chunks.mjs`, `road-topology.mjs`, `road-surface.mjs`, `road-structure-contact.mjs`, `road-spatial-index.mjs`, `road-v3-kit.mjs`, `road-v3-geometry.mjs`, `road-v3-journey.mjs`, `road-v3-playable-course.mjs`.

**Current distinction:** conventional generated V2 is the established/default playable road contract. V3 is an experimental/opt-in implementation; topology/grade/world-cell evidence exists, but broad WebGL/gameplay/bridge/tunnel/traffic acceptance does not authorize a default cutover.

**Invariants:** road samples and physics colliders authoritative; safe/express route choices map to real drivable geometry; no hidden collision seam; finite chunk growth and return reconstruction; road-owned deck overrides decorative GLB road surfaces; legacy saves keep intended generator.

**Validation:** `tests/road-chunks-regression.mjs`, `road-choice-traversal-regression.mjs`, `road-v3-playable-drive-regression.mjs`, `road-v3-deck-contact-regression.mjs`, and `npm run validate:v3:playable`. Historical `docs/road-v3-*.md` files preserve exact experiments and their gates, not active instructions.
