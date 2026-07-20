import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const index = readFileSync(join(root, "index.html"), "utf8");
const bootstrap = readFileSync(join(root, "src/app/bootstrap.mjs"), "utf8");
const chunks = Array.from({ length: 16 }, (_, index) => readFileSync(join(root, `src/app/app-chunk-${index + 1}.js`), "utf8"));
const combined = chunks.join("\n");
const continuity = chunks[13];
const foundationRuntime = chunks[14];
const horizonCorrection = chunks[15];

assert.match(index, /NexusEngine@b941c9b2995e3449c6987908657753e2cf2df242/);
assert.match(index, /src\/app\/bootstrap\.mjs/);
assert.match(index, />5:00</);
assert.equal((combined.match(/engine\.tick\(/g) ?? []).length, 1, "one engine tick call exists in the visible frame loop");
assert.equal(/tick\s*\(\s*0\s*\)/.test(combined), false, "no tick-zero helper exists");
assert.equal(/engine\.n\s*=/.test(combined), false, "host never replaces engine.n");
assert.match(combined, /distance=27\+/);
assert.match(combined, /ctx\.rotate\(-state\.heading\)/);
assert.match(combined, /updateDesired\(desired\.map/);
assert.match(combined, /speedDelta:-state\.speed\*\.8/);
assert.match(combined, /createQuadtreePartition/);
assert.match(combined, /registerHorizonWorld/);
assert.match(combined, /groundHeight:ground\.height/);
assert.match(bootstrap, /app-chunk-16\.js/);
assert.match(bootstrap, /ACTIVE_RADIUS: Math\.max\(2, ACTIVE_RADIUS\)/);
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
assert.match(combined, /createCoreWorldDomain\(\)/);
assert.match(combined, /createResolvedCoursePatch/);
new Function(combined);

for (const relative of [
  "src/app/bootstrap.mjs",
  "src/long-haul-core.mjs",
  "src/long-haul-game.mjs",
  "src/game/shared.mjs",
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
