import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const index = readFileSync(join(root, "index.html"), "utf8");
const bootstrap = readFileSync(join(root, "src/app/bootstrap.mjs"), "utf8");
const chunks = Array.from({ length: 17 }, (_, index) => readFileSync(join(root, `src/app/app-chunk-${index + 1}.js`), "utf8"));
const combined = chunks.join("\n");
const continuity = chunks[13];
const foundationRuntime = chunks[14];
const horizonCorrection = chunks[15];

assert.match(index, /NexusEngine@b941c9b2995e3449c6987908657753e2cf2df242/);
assert.match(index, /src\/app\/bootstrap\.mjs/);
assert.match(index, />10:00</);
assert.equal((combined.match(/engine\.tick\(/g) ?? []).length, 1, "one engine tick call exists in the visible frame loop");
assert.equal(/tick\s*\(\s*0\s*\)/.test(combined), false, "no tick-zero helper exists");
assert.equal(/engine\.n\s*=/.test(combined), false, "host never replaces engine.n");
assert.match(combined, /distance=27\+/);
assert.match(combined, /ctx\.rotate\(-state\.heading\)/);
assert.match(combined, /updateDesired\(desired\.map/);
assert.match(combined, /preparation\.pump\(\{maximum:1\}\)/);
assert.match(combined, /desired\.every\(cell=>preparation\.hasPatch\(cell\.id\)\)/);
assert.match(combined, /function reconcileCells\(maximum=1\)/);
assert.match(combined, /queuedCellRealizations/);
assert.match(combined, /streamingVisualCells=new Map\(\)/);
assert.match(combined, /function setCellStreamingTargets\(cells=\[\]\)/);
assert.match(combined, /for\(const cell of targets\.values\(\)\)\{const host=cellHosts\.get\(cell\.id\),needsUpgrade=/);
assert.match(combined, /realizeCell\(patch,\{visualOnly:!activeIds\.has\(cell\.id\)\}\)/);
assert.match(combined, /if\(!entry\|\|options\.visualOnly\)return/);
assert.match(combined, /prefetchDistance:0/);
assert.match(combined, /createCellStreamingPlan\(/);
assert.match(combined, /setCellStreamingTargets\(\[\.\.\.desired,\.\.\.frontier\]\)/);
assert.match(combined, /if\(cellQueueState\.pending\)\{reconcileCells\(1\);return\}/);
assert.match(combined, /function updateProceduralFog/);
assert.match(combined, /Fog\(0xa5afac,280,760\)/);
assert.match(combined, /scene\.fog\.near=lerp/);
assert.match(combined, /scene\.fog\.far=lerp/);
assert.match(combined, /PerspectiveCamera\(58,1,\.1,1800\)/);
assert.match(combined, /horizonStep=CELL_SIZE\*6/);
assert.match(combined, /speedDelta:-state\.speed\*\.8/);
assert.match(combined, /createQuadtreePartition/);
assert.match(combined, /registerHorizonWorld/);
assert.match(combined, /groundHeight:ground\.height/);
assert.match(bootstrap, /app-chunk-17\.js/);
assert.match(bootstrap, /ACTIVE_RADIUS: Math\.max\(1, ACTIVE_RADIUS\)/);
assert.match(bootstrap, /createCellStreamingPlan/);
assert.match(continuity, /_lhContainsBounds/);
assert.match(continuity, /miter=clamp/);
assert.match(continuity, /truckRig\.wheels\.map\(wheel=>wheel\.parent\)/);
assert.match(continuity, /forestMasses/);
assert.match(foundationRuntime, /longHaulWorldFeatures\.compileCell/);
assert.match(foundationRuntime, /worldFoundation\.sampleElevation/);
assert.match(foundationRuntime, /globalThis\.terrainHeight=_lhFoundationHeight/);
assert.match(horizonCorrection, /roads:\[\]/);
assert.match(horizonCorrection, /MeshLambertMaterial/);
assert.match(horizonCorrection, /_lhCompileFoundationWithoutPortalRoads/);
assert.equal(/skirtDepth/.test(horizonCorrection), false, "final horizon geometry does not add visible skirts");
assert.equal(/LineSegments/.test(horizonCorrection), false, "final horizon renderer does not draw portal spokes");
assert.match(combined, /createCoreWorldDomain\(\{childDomains:false\}\)/);
assert.match(combined, /function createResolvedCoursePatch\(cell\)\{return createCourseCellDescriptor\(course,cell\)\}/);
assert.equal(/longHaulWorldFeatures\.loadCourse\(course\)/.test(combined), false, "stable generation does not depend on World Features");
new Function(combined);

for (const relative of [
  "src/app/bootstrap.mjs",
  "src/long-haul-core.mjs",
  "src/long-haul-game.mjs",
  "src/game/shared.mjs",
  "src/game/streaming-policy.mjs",
  "src/game/world-profile-kit.mjs",
  "src/game/world-atlas-kit.mjs",
  "src/game/horizon-lod-policy-kit.mjs",
  "src/game/world-feature-adapter-kit.mjs",
  "src/game/road-class-catalog-kit.mjs",
  "src/game/terrain-policy-kit.mjs",
  "src/game/truck-dynamics-profile-kit.mjs",
  "src/game/delivery-contract-catalog-kit.mjs",
  "src/game/generator.mjs",
  "src/game/world-base.mjs",
  "src/game/cell-descriptor.mjs",
  "src/game/product-kits.mjs",
  "src/game/truck-kit.mjs",
  "src/game/course-kit.mjs",
  "src/game/run-kit.mjs",
  "src/game/delivery-kit.mjs",
  "src/game/wildlife-kit.mjs",
  "src/game/score.mjs"
]) {
  const result = spawnSync(process.execPath, ["--check", join(root, relative)], { encoding: "utf8" });
  assert.equal(result.status, 0, `${relative} must parse: ${result.stderr}`);
}

console.log("The Long Haul static shell smoke passed");
