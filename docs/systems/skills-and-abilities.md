# Skills, Drifting and Abilities — Source Contract
> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

**Owners:** `src/game/skill-progression.mjs`, `active-abilities.mjs`, `drift-behavior.mjs`, `driving-pickups.mjs`, `arcade-score.mjs`, `driving-controls.mjs`. Host `src/app` implements menus/effects and input translation but does not own funds, XP, cargo or authoritative physics.
**Behavior:** steering/drift/boost engage through game Kits and dedicated skill/ability channels. XP and upgrade choices are separate from earned money; the HUD only shows kit snapshots; focus/pause must freeze clocks and cooldowns.
**Validation:** `tests/skill-progression-regression.mjs`, `tests/active-abilities-regression.mjs`, `tests/drift-regression.mjs`, `npm run validate:skills`. Preserve the detailed historical `docs/skills-and-abilities.md` for algorithmic context, and link its own source revision when evaluating claims. Do not override player controls from stale agent audit notes.
