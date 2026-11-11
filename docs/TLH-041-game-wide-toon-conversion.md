# TLH-041 — Game-wide toon conversion candidate

Status: implemented locally; visual acceptance and delivery pending. This document does not claim the required complete visual outcome has passed.

## Identity and ownership

- Target: LuminaryLabs-Publish/TheLongHaul.
- Starting local source: 4814518bf5c028ce36413dbfb4d7b910be866008, including the unpublished TLH-043 crash candidate.
- Remote main at audit: c2513a41ce9d126172c4c52035780b627d73d5dc.
- Engine pin: b941c9b2995e3449c6987908657753e2cf2df242; vendor hash af28f66747e9dbbabe5503c79d825b7555fe9c7198fad0b54f47220d66584a43.
- Provider: Three.js 0.165.0 WebGLRenderer, instantiated in app-chunk-1.js. Nexus owns simulation, scenes, world streaming, graphics instance descriptors and camera smoothing; the game host executes rendering. No NexusGL provider installed.
- Pin has the earlier `src/core-kits/core-graphics-kit/render-layer-graph-kit` contracts. The requested modern `src/core-domains/render` path is absent at this revision. The shipped host does not execute that graph: it renders the Three scene and camera, wrapped by the existing outline adapter.
- NexusEngine PR 4 inspected: open, draft, unmerged; head df7bb392a6522dd361203e692da119269e2a878e. Its hazard-planning changes are not in this game. No engine revision, Core, Actions or provider changes made.

The current Engine material, shader, resource, texture, pipeline, lighting/reflection, presentation/sky and authoring material boundaries were inspected. They own portable contracts and descriptions, not this game's Three GPU handles. NexusGL contracts/provider/runtime were inspected separately: its toon bands 2–16 and outlinePixels 0–4 belong to NexusGL, and blend outlines are rejected. None of these settings are passed to Three as if portable. This candidate uses the actual r165 ShaderLib/onBeforeCompile contract.

Guidance: Framework Master, Master Guide Tracker, Game Development, Nexus Arcade creation, Sandbox Rendering & Validation. This is an existing-game presentation update; no Arcade registration or builder replacement.

## Active inventory

| Category | Source owner | Treatment |
|---|---|---|
| Terrain, mountains, rocks | visual-presentation, app-chunks 12–17, environment renderer | Vertex/texture pigment, terrain bias, shared diffuse bands; existing LOD skirts/fog |
| Roads, shoulders, markings, bridges | road hosts and app-chunks 14–17 | Cool road role, low highlight, existing deck/mark geometry; no collision changes |
| Buildings, terminal, props, freight | environment-tile-renderer, freight-terminal-host, app-chunks 4/20 | Structure role on existing normals, texture/vertex color and instancing |
| Truck, wheels, cargo | hero-truck-authoring/host | Vehicle role, warm paint, restrained rim; articulated normals remain intact |
| Six traffic models and wreck pieces | traffic-vehicle-authoring/host, app-chunk-22 | Vehicle role shared by intact/broken material instances |
| Trees and grass | prebuilt-tree-library/host, environment renderer | Imported GLB texture, MASK alpha, double-sided handling; foliage role, no color-detail ink |
| Wildlife | original deer/elk material and host | Shared lit-surface treatment; no human faces/skinned character assets added |
| Glass | existing materials.glass | Transparent banded light/rim; existing opacity and depthWrite=false retained |
| Pickups | app-chunk-21 | Lit toon volume plus restrained emissive pigment |
| Lamps, lights, explosion puffs | existing lit emissive materials, app-chunk-22 | Quantized housing/surface with original emissive map/radiance preserved |
| Signs, road paint decals, ability rings, rain, contact occlusion | existing Basic/line materials | Intentionally unlit graphic treatment; alpha/blending/depth preserved |
| Clouds | visual-presentation SDF volume shader | Existing density/transmittance and real sun probes; three broad illumination bands, bounded silver rim, no opaque outline |
| Sky and fog | visual-presentation | Existing smooth atmospheric gradient; visible sun now follows actual light direction; coherent cloud/sky sun color |
| Water | No active water surface renderer found | Wetland/drainage catalog labels are not water meshes; no fictional conversion claim |
| Postprocess and camera | sobel-outline-host, existing game camera | Single existing depth-outline pass, reduced dark-blue ink; no color texture-edge ink |

No FBX runtime loader or skinned protagonist was found in this game. Shared shaders preserve the existing skin, morph, instancing and fragment normal-map chunks; these contracts are tested, but animated-skinned GPU quality is not claimed.

## Implementation

`src/game/toon-style.mjs` is the one game-owned configuration. The bootstrap loads it before any presentation host. Four levels .30/.52/.78/1.05, thresholds .15/.45/.90 and narrow derivative-aware transitions form the common ramp. Road, terrain, foliage, vehicle, structure, metal, glass and smoke have deliberate bias/highlight/rim overrides.

The final surface adapter scans visible meshes in the actual scene, including objects parented outside worldRoot. Newly streamed instances receive the same treatment. Weak references prevent retained material ownership; a material is patched once. Diagnostics report active material roles via LongHaulCelShading.getState(). No new surface draw pass or per-frame material allocation.

Lighting uses the real reflected diffuse light after normals, alpha tests, lights and shadows. Surface color, vertex color and textures remain the pigment; metallic reflectance receives a separate bounded highlight response. Emission is added separately rather than excluded or capped as ordinary specular. Toon-native materials use continuous diffuse response before the shared final quantization, preventing two conflicting ramps.

The earlier presentation conversion discarded texture maps. It now preserves base/normal/alpha/AO/emissive maps and transparency attributes when replacing its selected materials. Imported tree and authored fleet roles are explicit. Shader cache keys include the common style and material role. Existing custom terrain shader hooks run first.

The outline adapter uses the existing depth attachment and one composite pass. It removes eight neighbor color samples and color-generated outlines, lowers strength, and fades distant geometry ink more strongly. Blended effects with no depth writes do not generate opaque outlines. This remains a depth postprocess: it cannot individually mask every overlapping foliage edge or prevent underlying geometry ink showing through transparency. These are explicit visual-review checks, not claimed solved by source tests.

The existing shadow budget, streaming budgets, fog, input, physics and game clocks remain owned by their prior systems. No new weather/time-of-day system or reflection renderer is introduced. The active atmosphere provides clear/rain variation; full night/sunset gameplay transitions are not evidenced by this audit.

## Validation and remaining gate

Results: `npm run build:host` PASS; full `npm test` PASS (exit 0); `git diff --check` PASS. After removing dead color-outline calculations, the affected outline, shared-surface and world-coverage regressions passed again. New coverage exercises real Three material hooks across eight categories, scene-level and lazy streamed objects, instancing, skin/morph/normal-map chunk retention, alpha/opacity/depth preservation, cache stability and shared cloud/sun configuration. This is not GPU shader compilation.

| Evidence route | Result and limit |
|---|---|
| Actual WebGL browser | Startup blocked: Chromium process_singleton_posix.cc socket() failed, Operation not permitted. No local game frame or input session obtained. |
| Native direct renderer setup | Existing @headless-three/renderer 0.4.5 plus Mesa Lavapipe initializes; two 256×256 lit smoke frames have identical SHA-256 2f01c648e333690f3048ba860078bd7c9faaa63c91e9e0f5687e78f9b81b0481; image inspected. This is setup evidence only. |
| Actual game's material hook on direct renderer | Rejected: material.onBeforeCompile customizations are not translated. Actual SDF sky/cloud and custom postprocess also require unsupported GLSL. No WGSL rewrite/provider substitution performed. |
| Screenshot/video comparison | Not obtained; no substitute image offered as game evidence. |
| Real gameplay and GPU performance | Unverified; unit fixtures and draw-pass accounting are not FPS/frame-time measurements. |

Direct backend: Debian 13 x64, existing task-local Mesa ICD `/workspace/scratch/32a5c7eeabde/render-runtime/usr/share/vulkan/icd.d/lvp_icd.json`; driver libraries resolved with ldd. No system installation. The task-local evidence package contains exact commands/probe, startup logs, repeated smoke images and source-suite log.

Remaining acceptance: run this exact candidate in WebGL, inspect title/chase/terminal/streaming/GLB foliage/crashes in clear and rain, exercise both road versions, compare equal-camera baseline frames, tune visible defects, and measure 600 seconds of authentic driving at desktop/narrow resolutions and both quality modes. Confirm silhouette noise, alpha overlaps, metal/glass identity, texture detail, sun position, shadow bands and road marks. Keep TLH-041 In Progress until visual and performance evidence passes.
