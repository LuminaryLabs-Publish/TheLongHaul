# Freight and Journey — Source Contract
> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

**Owners:** `src/game/delivery-kit.mjs`, `run-kit.mjs`, `freight-journey.mjs`, `cargo-profiles.mjs`, `delivery-contract-catalog-kit.mjs`, `arcade-score.mjs`. HUD/camera are adapters and may not create a second payout/score/save authority.
**Gameplay:** pickup on real gate; wide/express route choice; cargo class controls mass, damage and deadline; receiving gate awards pay once; replacement cargo and repeated routes preserve a continuous Endless journey. Campaign/garage and skill progression retain their own behavior unless changed in an authorized task.
**Invariants:** pay receipts idempotent across save/reload; clock freezes in menus; cargo mass updates immediately without teleport; recovery/damage applies existing costs; traffic/route gating uses canonical road graph.
**Acceptance:** `tests/freight-journey-regression.mjs`, `cargo-physics-regression.mjs`, `tests/freight-score-regression.mjs`, `npm run validate:gameplay` and authentic 600s real input. Historical freight release documents remain source-pinned evidence.
