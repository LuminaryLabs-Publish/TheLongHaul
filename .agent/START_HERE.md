# START HERE — The Long Haul

> **Active agent entry point, 2026-11-11.** This replaces the stale July near-world streaming audit as the repository's default instruction router. It does **not** replace the user's current task, the Framework Master, the Task Tracker, source code or an accepted decision.

## 1. First-read order
1. 00 - Current Handoff (internal shared-drive source; locate by title): exact current stage, source/branch, open blockers and one next action.
2. Master Game Definition (internal shared-drive source; locate by title): game identity, approved direction and design boundaries.
3. Project Resource Index (internal shared-drive source; locate by title): verified GitHub, Drive, assets and guide links.
4. Canonical Task Tracker (internal shared-drive source; locate by title): one current TLH project backlog and separate 223-item LH asset register.
5. [Technical index](../docs/INDEX.md), [Architecture](../docs/ARCHITECTURE.md), [Validation](../docs/VALIDATION.md), and only the relevant [system contract](../docs/systems/).

## 2. Governing Luminary guidance
Consult the Framework Master (internal shared-drive source; locate by title) first and Master Guide Tracker (internal shared-drive source; locate by title) for task-specific Game Development, Gameplay-Forward, Naming, Outcome-Based Tasking, Context Handoff and Sandbox Rendering & Validation requirements. Use only the Luminary shared-drive project, not My Drive.

## 3. Identify the actual source before work
Repository: `LuminaryLabs-Publish/TheLongHaul`.
Audited main baseline: `d9cfa2244e98459a5186b17ffa6e0bb99f60f709`; re-read GitHub HEAD before any edit.
Pinned NexusEngine: `b941c9b2995e3449c6987908657753e2cf2df242`; Three.js `0.165.0` via `vendor/manifest.json`.
`work/unified-truck-physics-render-20261111` is an **unaccepted gameplay implementation candidate**, not merged into main or validated in real WebGL.
`docs/longhaul-authority-cutover-20261111` is a documentation-only branch; it must not be mistaken for a game release or deployed source revision.
Treat code as authority for what is implemented, the tracker as authority for the task, and evidence as authority for whether it passed.

## 4. Task and asset namespaces
Current TLH-001..TLH-043 are registered project outcomes under LUM-000154 (gameplay) and LUM-000162 (assets). Historical `TLH-018..TLH-240` filenames on older image-reference records are **aliases**, not new or live tasks. Assets are canonically `LH-01-001` through `LH-07-030` in `Asset Master List`.
223 existing PNG reference files were mapped to their LH IDs; all remain unapproved pending individual visual/provenance inspection. Their 223 original DOCX packets were moved and renamed to LH IDs, retaining Drive IDs. Do not regenerate the image library or equate a PNG with an accepted model. The 100 `LH-ENV-*` GLBs are separate structural-QA candidates, not in-game visual acceptance.

## 5. Execute and validate only authorized work
- Confirm the requested outcome, exact repository and task ID, accepted decisions, dependencies, scope and approval gates.
- Read the affected game modules and their current canonical specs. Preserve V1/V2/V3 compatibility and parallel work.
- For gameplay updates, build/test the real pinned Nexus runtime and source-pinned browser/physical game; distinguish source checks, rendered WebGL, performance and human acceptance.
- Record exact SHA, tested commands, actual errors, screenshots/video provenance, review status and next action in the existing tracker and current handoff.
- Never edit GitHub Actions, NexusEngine Core, another repo, access permissions, public marketing or deployment unless explicitly authorized. A main push here triggers GitHub Pages automatically.
- Do not create parallel task trackers, GitHub Issues or speculative empty document structures.

## 6. Historical sources are not current directions
The old July audit material is retained under `.agent/` for provenance. The former root `current-audit.md`, `next-steps.md`, `known-gaps.md` and `validation.md` are labeled **ARCHIVED CONTEXT**. Consult [historical index](history/README.md) when a particular old finding is relevant; do not execute it automatically. Root `memory.md` and `progress.md` are similarly labeled historical. The active technical spec is in `docs/`, not whichever dated report happens to have the latest filename.

**Current next action:** read the live `00 - Current Handoff`; that document alone establishes the immediate dependency-ready action. Do not construct a competing checklist here.
