# TLH-FREIGHT-START-001 — Freight Terminal Start

The static start-yard GLB preserves the original freight-terminal layout and adds the Blender Kit V1 details: a cargo-handling gantry, dock markers and signage, roof vents, cargo corner guards, fuel-station details, yard lighting, entry signage, and perimeter trees. Its visual-only surfaces remain separate from gameplay collision and road ownership.

- `terminal-yard.glb`: 50 material batches, 83,496 triangles (bevels baked for export).
- Built on the original terminal GLB and game-coordinate placement in `src/game/freight-terminal-start.mjs`.
- Blender Kit sandbox prototype 0.0.4 authored the added geometry; Blender 4.3.2 baked modifiers and combined static geometry by material for the game's bounded GLB loader.
- The GLB preserves the host's canonical `asphalt`, `dark_asphalt`, `lawn`, `lawn2`, `road_white`, and `road_yellow` material names so source highway/terrain surfaces remain suppressed. Yard asphalt remains visible.
- NexusEngine-generated Road V2/V3 geometry remains the only authoritative drivable highway and collision surface.
- The game GLB parser and existing Three.js freight-terminal host fixture pass. Actual WebGL gameplay screenshot/performance review remains pending; this asset is not marked AAA-approved.

The editable Blender scene, source/after renders, QA record, and iteration goal maps are archived in the shared `The Long Haul/03 - Work` Drive folder.
