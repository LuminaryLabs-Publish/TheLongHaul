import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {
  GAME_PROFILE,WORLD_PROFILE,PRESENTATION_PROFILE,ROADS_PROFILE,VEGETATION_PROFILE,GAMEPLAY_PROFILE,
  ASSET_MANIFEST,SCENE_PROFILES,SCENE_PROFILE_IDS,sceneForBiome,sceneProfile,validateSceneProfileCatalog
} from '../src/game/scene-profiles.mjs';
import {TOON_STYLE} from '../src/game/toon-style.mjs';
import {CARGO_PROFILES} from '../src/game/cargo-profiles.mjs';
import {ABILITY_DEFINITIONS,ABILITY_LIMITS} from '../src/game/active-abilities.mjs';
import {SKILL_UPGRADES,SKILL_LIMITS} from '../src/game/skill-progression.mjs';
import {TREE_SPECIES,TREE_ENVIRONMENT_KINDS} from '../src/game/prebuilt-tree-library.mjs';
import {TERRAIN_ROAD_V3} from '../src/game/road-v3-terrain-route.mjs';
import {LIGHTING_SHADOW_PRESETS} from '../src/game/lighting-shadow-policy.mjs';
import {ENV_TILE_BIOMES,ENV_TILE_COMPOSITIONS,ENV_TILE_VARIANTS,ENVIRONMENT_TILE_CATALOG} from '../src/game/environment-tile-catalog.mjs';
import {TOWN_ASSET_IDS,ROAD_USE_ZONES,TOWN_LAYOUT_VERSION} from '../src/game/connected-settlements.mjs';
import {DEFAULT_LONG_HAUL_WORLD_PROFILE} from '../src/game/world-profile-kit.mjs';
import {DEFAULT_TERRAIN_POLICY} from '../src/game/terrain-policy-kit.mjs';
import {createEndlessHighway} from '../src/game/endless-highway.mjs';
import {createPlayableRoadV3Course} from '../src/game/road-v3-playable-course.mjs';
import {createForwardBoost} from '../src/game/forward-boost.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const fixture=JSON.parse(readFileSync(resolve(root,'game/fixtures/freeze-proofs.json'),'utf8'));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
assert.equal(fixture.baseCommit,GAME_PROFILE.sourceFreeze,'freeze identity is immutable');
assert.equal(fixture.schema,'long-haul.freeze-proofs/1');
assert.equal(validateSceneProfileCatalog().ok,true,'all scene profiles resolve');
assert.ok(Object.isFrozen(WORLD_PROFILE.world.horizon)&&Object.isFrozen(PRESENTATION_PROFILE.toonStyle.roles.foliage),'deep-freeze all runtime authoring data');
assert.strictEqual(sceneProfile('city'),SCENE_PROFILES.city);
assert.equal(sceneProfile('unknown'),null);
assert.equal(sceneForBiome('new-england').id,'forest');
assert.equal(sceneForBiome('alpine').id,'countryside');
assert.deepEqual(Object.keys(SCENE_PROFILES).sort(),[...SCENE_PROFILE_IDS].sort());
for(const scene of Object.values(SCENE_PROFILES)){
  assert.ok(scene.assetCollections.every(name=>Object.hasOwn(ASSET_MANIFEST.collections,name)),scene.id+' assets');
  if(scene.kind==='settlement')assert.equal(scene.reconnectTo,'main-highway');
}
for(const [name,paths] of Object.entries(ASSET_MANIFEST.collections)){
  assert.ok(Array.isArray(paths));
  for(const path of paths){
    assert.ok(path.startsWith('assets/')&&!path.includes('..'),name+' unsafe asset');
    assert.ok(existsSync(resolve(root,path)),name+' missing asset '+path);
  }
}
const manifests={TOON_STYLE,TREE_SPECIES,TREE_ENVIRONMENT_KINDS,
  PREBUILT_TREE_VERSION:VEGETATION_PROFILE.version,LIGHTING_SHADOW_PRESETS,
  DEFAULT_LONG_HAUL_WORLD_PROFILE,DEFAULT_TERRAIN_POLICY,
  ENV_TILE_BIOMES,ENV_TILE_COMPOSITIONS,ENV_TILE_VARIANTS,
  TOWN_ASSET_IDS,ROAD_USE_ZONES,TOWN_LAYOUT_VERSION,CARGO_PROFILES,
  ABILITY_DEFINITIONS,ABILITY_LIMITS,SKILL_UPGRADES,SKILL_LIMITS,TERRAIN_ROAD_V3};
for(const [name,expectedHash] of Object.entries(fixture.data))
  assert.equal(hash(manifests[name]),expectedHash,'immutable source parity: '+name);
for(const [name,expectedHash] of Object.entries(fixture.roads)){
  const [version,...seedAndProgress]=name.split(':');
  const p=seedAndProgress.pop(),seed=seedAndProgress.join(':');
  const course=version==='v2'?createEndlessHighway(seed,{progress:Number(p)}):createPlayableRoadV3Course(seed,{progress:Number(p)});
  assert.equal(hash(course),expectedHash,'deterministic road + town graph freeze: '+name);
}
const boost=createForwardBoost();
assert.equal(boost.duration,GAMEPLAY_PROFILE.boost.duration);
assert.equal(boost.recharge,GAMEPLAY_PROFILE.boost.recharge);
assert.equal(boost.tap('KeyW',1000),false);
assert.equal(boost.tap('KeyW',1200),true);
boost.advance(5);assert.equal(boost.ready,false);
boost.advance(3);assert.equal(boost.ready,true);
const altered=structuredClone(GAME_PROFILE);altered.profileRefs.roads='unknown';
assert.ok(!validateSceneProfileCatalog({gameProfile:altered}).ok,'reject broken references');
const badV3=structuredClone(ROADS_PROFILE);badV3.town.sectionStride=99;
assert.ok(!validateSceneProfileCatalog({roadsProfile:badV3}).ok,'reject changed frozen layout identity');
const wrongScene=structuredClone(SCENE_PROFILES);wrongScene.city.reconnectTo='dead-end';
assert.ok(!validateSceneProfileCatalog({sceneProfiles:wrongScene}).ok,'reject disconnected town scenes');
assert.equal(ENVIRONMENT_TILE_CATALOG.length,100);
assert.ok(ENVIRONMENT_TILE_CATALOG.every(tile=>SCENE_PROFILES[tile.sceneProfile]));
assert.deepEqual(Object.keys(CARGO_PROFILES),['standard','fragile','heavy','hazardous','unstable']);
assert.ok(['endless','campaign'].every(mode=>GAME_PROFILE.modes.includes(mode)));
assert.ok(['boost','skills','active-abilities','save-resume','garage','traffic','road-choices'].every(id=>GAME_PROFILE.gameplaySystems.includes(id)));
console.log(JSON.stringify({status:'PASS',sourceFreeze:fixture.baseCommit,profiles:5,scenes:SCENE_PROFILE_IDS.length,
  frozenDefinitions:Object.keys(fixture.data).length,roadGraphFreezeChecks:Object.keys(fixture.roads).length,
  existingGLBs:Object.values(ASSET_MANIFEST.collections).flat().length,gameplayPreserved:GAME_PROFILE.gameplaySystems.length}));
