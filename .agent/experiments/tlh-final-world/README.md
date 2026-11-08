# TLH — Final World Goal Map (source-authored, not native Goal Kit state)

Parent: LUM-000154. Owners: TLH-001 + TLH-002 + TLH-004 + TLH-020.
Baseline GitHub main: `4bd1a15be8cf2b11cbc51aae36c52ec7744053c5`.

This `.agent` packet models `discover → define → author → evaluate → refine` under the NexusEngine Domain/Service/Kit boundary; it does not assert the optional `n:agent:goal` or `n:authoring:craft` kits are present. Never record an unverified goal as complete.

**Observed defect:** terrain-carving queries sorted no-height road samples by elevation, then deduplicated by progress across edges, causing a surface 20 m away to win over the road exactly below the sample. Combined with legacy V2 bridge tags carried onto an unrelated V3 mountain, this buried actual road pavement by up to 23 m in a sample seed.

**Changes:** horizontal-distance preference for heightless terrain, edge-specific deduplication, terrain-aware reinterpretation of legacy bridge/tunnel tags, actual construction tags on projected road/roundabout edges, local under-bridge ground contact safety, and bounded slope-aware earthworks. Road cell, physics, freight and V2 fallback continue using existing authorities.

**Evidence:** `tests/final-world-construction-regression.mjs`; existing V3 World, crossing, streaming, playable course and road-host regressions; source geometry view from VTK is **not** native Blender or WebGL gameplay.

**Blender:** Blender end-to-end guide followed to source/installer gate; native Blender execution blocked by connector size. Scratch prototype GLBs in `/mnt/data/luminary/blender/projects/TLH-final-world/prototype-glb` were made with `trimesh`, not Blender, and are not included in the production game. Blender `.py` authoring source is retained for execution when the valid binary is available.

**Release:** Do not mark final-world complete or switch V3 to default until actual WebGL driving, 600-s input recording, visual review, full suite and native asset QA pass. No GitHub Actions changes.
