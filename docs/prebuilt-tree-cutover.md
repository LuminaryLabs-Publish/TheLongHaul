# The Long Haul — Prebuilt foliage-card GLB cutover

Status: code and nine source GLBs prepared for `LuminaryLabs-Publish/TheLongHaul/main`. Existing task TLH-012 (production-ready regional terrain/vegetation), with related gameplay validation under TLH-001, TLH-019 and asset delivery TLH-017. LUM-000162 owns source assets; LUM-000154 owns scene/streaming presentation.

## User-visible change

Replace visible primitive/blob trees with three individually authored prebuilt GLB trees: **Red maple (Acer rubrum)**, **Paper birch (Betula papyrifera)** and **Weeping willow (Salix babylonica)**. Each includes a geometry trunk/branch mesh and double-sided alpha-cut foliage cards, species-specific embedded 1024px leaf atlas and 512px bark texture, and three fixed geometry LODs. The original tree data remains a fallback only if a file fails to load. Placement is deterministic from the existing World and environment-tile descriptions. No collision or gameplay state is changed.

## Local asset provenance

All nine GLB files were authored in a previous Luminary sandbox output using a Design → Art → Craft production loop and have original SHA-256 entries in the authoring QA manifest. These are prebuilt binary GLBs, **not** point clouds, billboards, procedural regeneration or nexus authoring Runtime-produced files. The sandbox authoring method is reproducible but native NexusEngine Authoring Kit execution was not verified.

| Source | LOD0 triangles | LOD1 triangles | LOD2 triangles |
| --- | ---: | ---: | ---: |
| red_maple | 16,088 | 9,040 | 3,880 |
| paper_birch | 12,604 | 6,120 | 2,688 |
| weeping_willow | 24,824 | 13,880 | 6,628 |

## Integration boundary

- `assets/trees/*.glb`: exact nine portable GLB 2.0 files, embedded bark/foliage textures and alpha-MASK materials.
- `src/game/prebuilt-tree-library.mjs`: strict GLB 2.0 parser, material/geometry adapter, deterministic species and bounded distance LOD rules. Requires no CDN loader.
- `src/app/prebuilt-tree-host.js`: low-draw-call shared InstancedMesh cache, global fixed instance limit 240, updated in the already-owned scene frame callback, decomposes when world cells are released. Wrapped `decorateCell`, `releaseCell`, `clearWorld`, `updateCloudLayers`, never a second game engine.
- `src/game/environment-tile-renderer.mjs`: skips only existing primitive tree/canopy shapes **while** prebuilt tree library reports ready; keeps the old imagery on asset failure. Grass, shrubs, reeds, cactus, rocks, manmade objects, and road paint remain unchanged.
- `src/app/bootstrap.mjs`: load only the local tree host after the environment host; wait for its success/fallback decision before enabling game entry.
- `tests/prebuilt-tree-*.mjs`: GLB, geometry decode, fallback/lifecycle, and entrypoint ownership regressions.

## Safety and limitations

Existing road layout, colliders, World descriptors, cell coordinates, save IDs, scores, physics, camera and deployment YAML are not touched. Failing GLB URL, parse, PNG texture decode or material instantiation keeps original tree visuals. The base worker can still generate discarded CPU tree mesh data as a fallback path; optimizing away that work would need a separately verified worker contract change.

Tests are not a substitute for inspecting a real 10-minute driving session. Browser rendering, target-device GPU performance, mobile memory, culling and edge-case LOD popping require live validation before TLH-012, TLH-017 or TLH-019 can be marked accepted. Do not misreport internal GLB checks as that acceptance.

## Testing

```
node tests/prebuilt-tree-library-regression.mjs
node tests/prebuilt-tree-host-regression.mjs
node tests/prebuilt-tree-integration-regression.mjs
npm run build:host
npm test
```

The normal build step remains `npm run build:host` when app-chunk or engine exports change. For this change the generated vendor bundle is intentionally unchanged: all new runtime logic is in directly imported/loaded source modules and nine static assets. No GitHub Actions files are modified.