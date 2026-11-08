# TLH-023 — Alternative B HUD experimental handoff

**Status: EXPERIMENTAL — NOT ACTIVE IN GAME, NOT ACCEPTED FOR RELEASE**

This directory preserves work toward the requested HUD cutover. It does not replace the active Presentation implementation and is deliberately not loaded by the game. The main menu, startup, save system, and GitHub Actions are unchanged.

## Verified baseline

- Existing runtime HUD owner: `src/app/visual-presentation.js`.
- Existing style surface: `styles.css`.
- Existing game bootstrap: `src/app/bootstrap.mjs`.
- Original art: Google Drive `TLH-016 - UI HUD and Graphic Assets`, 30 composite PNGs (`TLH-211.png` through `TLH-240.png`).
- Screenshot authority: user-provided Alternative B reference, 1648 × 928.

## Experimental work

The sandbox produced a standalone `alternative-b-presentation.mjs` and `alternative-b.css` with six layout regions and a read-only DOM-state adapter. They passed syntax checking but **were not integrated or tested against actual gameplay**. Several source PNGs have baked-in values and backgrounds, and the required exact-match panel artwork is not yet cleanly separable.

The experimental package and SHA-256 source-asset provenance remain in the conversation's sandbox archive, not in the runtime path. Do **not** enable or ship the prototype in this form.

## Acceptance before activation

1. Extract or verify clean source artwork for all six HUD regions; do not invent substitutes.
2. Bind to the authoritative speed/freight/score/skill/ability state without duplicated ownership.
3. Keep legacy UI rollback and unchanged non-gameplay screens.
4. Compare actual game captures against the approved screenshot at desktop/mobile sizes.
5. Pass browser, presentation, save, input and gameplay regressions.
6. Record a reviewed 60-second gameplay capture per Luminary recording guidance.

No part of this handoff indicates these gates have passed. The eventual HUD implementation must be a separate validated source change.
