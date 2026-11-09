# TLH-FREIGHT-START-001 — Authored Freight Terminal Start

Static terminal-yard meshes exported from the user-authorized original 3D asset.

- `terminal-yard.glb`: original 41 material batches, 46,532 triangles; loading docks,
  trucks, cargo stacks, fuel station, gate, pavement, warehouse, original
  roadside elements. No preview player truck.
- Decorative highway and on-ramp pavement are **suppressed in the renderer**
  (the source GLB preserves them for audit). NexusEngine draws the only
  authoritative, seeded, drivable road surfaces. The original 3D
  on-ramp and connection samples live in
  `src/game/freight-terminal-start.mjs` and are transformed into the actual
  generated highway network at `mergeProgress=320`.
- Existing Road V2 and opt-in Road V3 both use the same real start hub on **new
  Endless journeys**; Campaign and older saved Endless journeys preserve their
  previous spawn locations. New terminal checkpoints record the hub identifier
  and restore the corresponding road and visual layout.
- The authored asset was modeled using `trimesh`, not Blender. No native Blender
  authorship is claimed. Runtime GLB loading is verified in a Three.js fixture;
  actual player-driven WebGL capture remains a separate visual acceptance gate.
- Stored road and terrain transforms are world-seed-local, not fixed-world
  coordinates. The garage, cargo, traffic and persistent wallet still belong to
  their existing NexusEngine Kits.

Original full authoring source and six-angle renders remain in the terminal
production handoff. This file is the optimized **game** art only.
