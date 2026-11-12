# The Long Haul — Technical Documentation Index

> **Documentation authority cutover (2026-11-11).** Source baseline: `main` at `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`. These documents describe observed source contracts; they do not constitute a fresh gameplay, render, or hardware acceptance result.

**First reads:** Current Handoff (internal shared-drive source; locate by title) → Master Game Definition (internal shared-drive source; locate by title) → Task Tracker (internal shared-drive source; locate by title) → [Architecture](ARCHITECTURE.md) → active system spec.

## Current technical references (source-checked, not full-run accepted)
- [ARCHITECTURE.md](ARCHITECTURE.md): which engine, Kit, adapter, and art subsystem owns each state.
- [VALIDATION.md](VALIDATION.md): executable commands, source pins and acceptance gates.
- [Truck physics](systems/truck-physics.md) · [Roads](systems/roads.md) · [Rendering](systems/rendering.md) · [Freight](systems/freight.md)
- [Skills and abilities](systems/skills-and-abilities.md) · [Hero truck authoring](systems/vehicle-authoring.md) · [Traffic authoring](systems/traffic-authoring.md) · [Environment tiles](systems/environment-tiles.md).
- [Historical technical records index](history/README.md) and [July agent-audit index](../.agent/history/README.md).

## Historical source records — retain originals in place
These documents prove scoped historical work **at their own dates and revisions**, not universal current acceptance. They have not been deleted, renamed, or silently rewritten:
- `TLH-002-road-route-acceptance.md`, `TLH-003-navigation-acceptance.md`: road and navigation milestones.
- `TLH-041-game-wide-toon-conversion.md`, `illustrated-highway-release.md`, `lighting-shadow-overhaul.md`: earlier toon/lighting releases and unaccepted appearance gates.
- `TLH-043-comic-crashes.md`: crash implementation and evidence.
- `continuous-freight.md`, `continuous-freight-validation.md`: freight rollout.
- `gameplay-overhaul.md`, `gameplay-validation.md`: earlier game-loop changes.
- `modular-endless-roads.md`, `road-v3-candidate.md`, `road-v3-growth-validation.md`, `road-v3-opt-in-cutover.md`, `road-v3-world-validation.md`: source-specific road history.
- `skills-and-abilities.md`, `skills-validation.md`: detailed skill source contract and release record; consult live source before changing behavior.
- `hero-truck-authoring.md`, `traffic-fleet-authoring.md`, `prebuilt-tree-cutover.md`, `200m-authored-environment-tiles.md`: authoring/candidate records.
- `truck-settling-validation.md`: historical spring/contact acceptance record.
- `evidence/skills-source-2026-11-02.json`: historical source evidence; not active status.

**Trust order:** user-approved scope and Framework → current Drive handoff and task → actual GitHub source/manifest → source-pinned tests/artifacts → retained historical record. A historical newer title does not supersede code or approval.
