# The Long Haul — six-vehicle traffic authoring integration

**Scope:** `LuminaryLabs-Publish/TheLongHaul` only. No changes to NexusEngine, save data, traffic dynamics, collision extents, payment, routes, deployment workflows, or existing authored hero truck.

## Outcome and exact ownership

The traffic fleet replaces the visually blocky arcade traffic meshes with six distinct reusable 3D source assemblies, each based on the six approved November 4, 2026 concept references:

| Model | Paint and construction | Collision class |
| --- | --- | --- |
| Compact sedan | Blue; beveled four-door body, grille, windows, chrome, alloy rims | 0 — car |
| Muscle coupe | Red/cream; longer hood, scoop, broad racing livery, spoiler | 1 — pickup |
| Heavy-duty pickup | Green/cream; crew cab, open bed, steps, metal rail | 2 — box truck |
| Cargo van | Yellow/cream; high roof, cargo side panels, sliding track | 2 — box truck |
| Rugged SUV | Purple/cream; roof rails, tall cab, wheel arches | 1 — pickup |
| Box truck | Teal/cream; cab, ribbed cargo box, marker lights, riveted edges | 3 — semi |

The visual profile intentionally inherits the **existing collision class** even when the class's historical label is less descriptive than the new body shape. New profiles must fit within the retained footprint plus an explicit small visual tolerance. Existing fast-road traffic tests remain the authority for gameplay contact.

- Source adapter: `src/game/traffic-vehicle-authoring.mjs`. Declares `n:authoring:mesh`, `n:authoring:material`, `n:authoring:assembly`, and `n:authoring:art` responsibilities without claiming these optional APIs have been installed in the shipped pinned engine bundle.
- Host adapter: `src/app/traffic-vehicles-host.js`. Loads after `visual-presentation.js` and `hero-truck-host.js`, reuses the game's four-band gradient, and retains the traffic controller and 14 slot identities.
- Source parts: 72–139 named parts per near mesh recipe; sculpted body lofts, beveled modules, four-band materials, split glass, wheel assemblies, chrome, lights, fenders and model-specific construction.
- Rendering: static mesh details are baked by material, with six authoring profiles and near/far LOD geometry reused across vehicle instances. Wheel rotors remain separate and respond only to actual traffic travel speed. Near/far LOD switches at 115/155 m with hysteresis.
- Variation: the original four physics kinds deterministically select six visual variants when their existing traffic IDs change; no randomized gameplay state is introduced.
- Failure: if the presentation factory fails before installation, the original traffic remains visible. Native authoring Project save and validated GLB/FBX export remain separate future work.

## Validation and gates

- `node tests/traffic-vehicle-authoring-regression.mjs`: verify all six semantic IDs, authored parts, deterministic LOD templates, material ramp, bounds relative to existing colliders, finite geometry, bounded baked draw groups, 14 vehicle slots and nonduplicated traffic host installation. This runs a geometry-bearing Three.js compatibility fixture and cannot substitute for real WebGL.
- `npm run build:host`: requires the existing committed pinned `vendor` files; tests immutable NexusEngine/Three.js vendor versions and regenerates `vendor/app-runtime.js` only when necessary. This change does not need new Engine imports in the concatenated game host.
- `npm test`: all game regressions, including traffic collisions, road continuity, skills and the hero truck.
- `npm run validate:visuals` plus actual browser running at highway speed: review all six vehicles from gameplay camera, near and distant LOD, night/rain contrast, wheels, lane placement, collision silhouette, no unexpected pops, and visual similarity to the approved concepts.
- `npm run test:roads:traverse`: ten-minute deterministic physics-only road traverse; not proof of visual readability.
- Target hardware: compare draw calls, CPU/GPU frame time, memory and output quality across low/high settings and native hardware. Fixed-step video is not evidence of real-time FPS.

**Publication standard:** A passing geometry fixture or GitHub Pages deployment proves code placement but not frame-perfect visual acceptance. Do not claim a native Nexus Authoring project or commercial GLB pack until the canonical authoring source/export is implemented and independently validated. Do not modify `.github/workflows/deploy-pages.yml`.