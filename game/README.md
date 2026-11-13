# The Long Haul — game-owned JSON profiles

This directory is the **canonical content definition**, not an additional Engine Domain or an alternative game runtime. All behavior still uses the existing pinned Nexus Engine composition, Three.js provider and game-owned algorithms.

- `game.json`: game identity, existing feature identities, required profiles, modes, existing Nexus responsibilities and historical freeze commits.
- `profiles/world.json`: original World / terrain Kit default data, environment biomes, variants and motifs.
- `profiles/roads.json`: connected-town seed policy, asset zoning, fixed layout identity, and terrain road V3 settings. The existing generator still builds the actual roads.
- `profiles/vegetation.json`: existing tree species, source GLB LOD paths, visibility/shadow budgets and fallback policy. Host GPU resources remain external.
- `profiles/presentation.json`: original four-band toon, illumination, material roles, shadows and ink policy. It doesn't replace authored textures or GPU shaders.
- `profiles/gameplay.json`: original freight cargo, skills, active ability definitions and boost timings. Runtime state, physics, input, recovery and saves retain their existing owners.
- `scenes/*.json`: countryside, forest, small town, city and industrial semantic placements. These are selected by the existing environment-tile and connected-settlement systems; they are not replacement scene loaders.
- `assets/manifest.json`: validated asset collection references. The existing GLB host continues to load only approved local asset bytes and checks the separate source-pack manifest.
- `fixtures/freeze-proofs.json`: immutable deterministic source hashes from GitHub commit `38d9f93`; future intentional gameplay/content changes must explicitly version and re-baseline rather than silently rewriting these proofs.

## Add or change a scene

1. Add a schema-valid JSON descriptor and register its ID in `game.json` and `src/game/scene-profiles.mjs`. Reuse an existing asset collection where possible.
2. Add actual GLBs and verify the asset references resolve. A JSON name alone is not an asset or a rendered model.
3. Route the descriptor through the owning World/Presentation/Authoring interface and the existing game host. No new Kit merely for a content type.
4. Run `npm run validate:profiles`, `npm run build:host`, relevant source suites and real browser driving/render validation. Preserve save identities, road layout versions, and the pinned Nexus Engine SHA.
5. For changes that **intentionally** alter prior gameplay behavior, record the approved new revision and obtain new freeze evidence before accepting the update.

**Source ownership:** `src/game/scene-profiles.mjs` validates and deep-freezes the JSON data; it does not hold dynamic World state or Three.js objects. Kit-based services remain unchanged, and the existing host owns loading/streaming/graphics. YAML is not a runtime dependency.
