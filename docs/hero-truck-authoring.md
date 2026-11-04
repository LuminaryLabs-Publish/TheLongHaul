# Hero truck — visual authoring implementation

**Product owner:** The Long Haul, LUM-000162 / TLH-010. **Game integration:** LUM-000154 / TLH-004. **Source reference:** generated isolated vermilion heavy-hauler concept from 2026-11-04.

`src/game/hero-truck-authoring.mjs` is a deterministic procedural authored mesh recipe, using the Nexus `n:authoring:mesh` (geometry), `n:authoring:material` (material slots), and `n:authoring:assembly` (named parts) separation of concerns. The game adapter `src/app/hero-truck-host.js` instantiates Three.js meshes after the established illustrated material and road hosts load. The engine's pinned runtime **does not export or install** the optional `n:authoring` source/project writer. This recipe is **not** an actual Authoring Project snapshot or GLB export receipt; promotion through the canonical Authoring domain and export/validation kits remains follow-up work.

## Characterization

- Beveled cab/hood, curved wheel fenders, grille recess and multiple sculpted slats, layered windshield and side glass, modeled lamps, mirror arms, stacks, fuel tanks, steps and railings.
- Six wheel assemblies, with hub geometry, rim rings, bolts, sidewalls and patterned tread, stay attached to the existing steer/spin slots. The single assembled truck retains `root/body/leanPivot/wheels/steering/crates/grounding` exactly as gameplay expects.
- Materials reuse the existing four-shade toon ramp; new metal, glass, rubber, light and outline mats are variants of `THREE.MeshToonMaterial`, not physically realistic PBR shaders.
- Existing gameplay collision, vehicle dynamics, cargo, abilities, save data, route systems and Pages workflow remain authoritative and untouched.
- Geometry is generated once when a new run builds the truck. Geometries are cached per build, reused across duplicate details and disposed on replacement.
- New grounding uses support-only meshes for clearance, so raised stacks, mirrors and other decorative extremes do not falsely elevate the truck. The original grounding path is unchanged for all other callers.

## Acceptance still needed

A deterministic stub-based source/rig test checks syntax and critical assembly contracts. Full real-WebGL rendering, screenshot comparisons against the concept art, grounding contact on bridges/slopes, 10-minute gameplay, target-device frame time, artistic approval, and native Authoring GLB export are **not** established by the source test. The in-game feature should be considered implemented but not art-accepted until these gates pass.
