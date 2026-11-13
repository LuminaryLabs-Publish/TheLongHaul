import {TOON_STYLE} from '../game/toon-style.mjs';
import {GAME_PROFILE,SCENE_PROFILES,ASSET_MANIFEST,VEGETATION_PROFILE,ROADS_PROFILE,validateSceneProfileCatalog} from '../game/scene-profiles.mjs';
const profileValidation=validateSceneProfileCatalog();
if(!profileValidation.ok)throw Error('Game scene profiles are not valid');
Object.assign(globalThis,{LongHaulSceneProfiles:Object.freeze({game:GAME_PROFILE,scenes:SCENE_PROFILES,roads:ROADS_PROFILE,vegetation:VEGETATION_PROFILE,assets:ASSET_MANIFEST})});
globalThis.LongHaulToonStyle=TOON_STYLE;
import {createImpactClock,sweptVehicleImpact} from '../game/impact-kit.mjs';
import {createComicCrashKits,DESTRUCTIBLE_PROFILES} from '../game/destructible-vehicle-kit.mjs';
Object.assign(globalThis,{createImpactClock,sweptVehicleImpact,createComicCrashKits,DESTRUCTIBLE_PROFILES});
import {createNeighborhoodTree} from '../game/neighborhood-tree.mjs';
import {parseSettlementGlb,createSettlementGeometry} from '../game/settlement-glb.mjs';
Object.assign(globalThis,{createNeighborhoodTree});
Object.assign(globalThis,{parseSettlementGlb,createSettlementGeometry});
import {FREIGHT_TERMINAL_VERSION,attachFreightTerminalStart,freightTerminalGroundHeight,terminalWorldPoint,terminalLocalPoint,terminalObstacleVolumes} from '../game/freight-terminal-start.mjs';
import {parseFreightTerminalGlb,createFreightTerminalThreeObject} from '../game/freight-terminal-glb.mjs';
import {FREIGHT_TERMINAL_TRAFFIC,evaluateFreightTerminalTraffic,terminalTrafficCollisionProxies} from '../game/freight-terminal-activity.mjs';
import {PREBUILT_TREE_VERSION,TREE_SPECIES,parsePrebuiltTreeGlb,createPrebuiltTreeMeshes,speciesForTree,isTreeEnvironmentObject,selectVisibleTreeInstances} from '../game/prebuilt-tree-library.mjs';
import * as LongHaulArt from '../game/landscape-style.mjs';
import * as LongHaulGuidance from '../game/navigation-guidance.mjs';
import { resolveRoadStructureContact } from "../game/road-structure-contact.mjs";
import { ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION, roadChunkAt, roadChunkSample } from "../game/road-chunks.mjs";
import { ROAD_V3_VERSION } from "../game/road-v3-geometry.mjs";
import { createPlayableRoadV3Course, advancePlayableRoadV3Course, playableRoadV3Point, playableRoadV3Progress } from "../game/road-v3-playable-course.mjs";
import { roadRibbonData } from "../game/road-surface.mjs";
import { LONG_HAUL_CONTROLS, LONG_HAUL_BINDINGS, LONG_HAUL_TOUCH_ACTIONS, heldAction } from "../game/driving-controls.mjs";
import { createSkillProgression, SKILL_UPGRADES } from "../game/skill-progression.mjs";
import { createActiveAbilities, ABILITY_DEFINITIONS } from "../game/active-abilities.mjs";
import { createDrivingPickups, PICKUP_DEFINITIONS } from "../game/driving-pickups.mjs";
import { createArcadeScore } from "../game/arcade-score.mjs";
import { freshCampaignSave, readCampaignSave } from "../campaign-policy.mjs";
import { createEndlessHighway, advanceEndlessHighway, endlessHighwayPoint, endlessHighwayProgress, endlessHighwayStation, nextEndlessLoadingStation, endlessHorizonBounds, isEndlessLoadingZone } from "../game/endless-highway.mjs";
import { createFreightJourney, freightDifficulty, prepareFreightSave } from "../game/freight-journey.mjs";
import { CARGO_PROFILES, getCargoProfile, cargoDamageMultiplier } from "../game/cargo-profiles.mjs";
import { pruneLongHaulContactLedger } from "../game/bounded-contact-ledger.mjs";
import { buildArcadeRoutes, arcadePathPoint, arcadeRoadProgress, planArcadeEncounters } from "../game/arcade-encounters.mjs";
import { createForwardBoost } from "../game/forward-boost.mjs";
import { createTruckGrounding, indexDriveSurface, sampleDriveSurface } from "../game/truck-presentation.mjs";
import { createHeroTruckMesh, HERO_TRUCK_SOURCE } from "../game/hero-truck-authoring.mjs";
import { createTrafficVehicleFactory, TRAFFIC_FLEET_PROFILES, TRAFFIC_FLEET_SOURCE, trafficVariantForClass } from "../game/traffic-vehicle-authoring.mjs";
import { LIGHTING_SHADOW_PRESETS, LIGHTING_SOURCE, lightingPreset, shadowAnchor, shouldRefresh, selectClosest, planarDistanceSquared, profileSummary } from "../game/lighting-shadow-policy.mjs";
import { ENV_TILE_METERS, ENV_CELL_METERS, ENV_TILE_VARIANTS, ENVIRONMENT_TILE_CATALOG } from "../game/environment-tile-catalog.mjs";
import { environmentCellPlanSteps } from "../game/environment-tile-planner.mjs";
import { ENVIRONMENT_AUTHORING_SOURCE } from "../game/environment-tile-authoring.mjs";
import { createEnvironmentTileRenderer, ENVIRONMENT_RENDER_LIMITS } from "../game/environment-tile-renderer.mjs";
import * as THREE from "three";
import * as N from "nexusengine";
import { createLongHaulCoreKits, createLongHaulCourseEnvelope, verifyLongHaulCourseEnvelope, createLongHaulPatchPreparation, applyLongHaulOperationOnce } from "../long-haul-core.mjs";
import { WORLD_ID, CELL_SIZE, ACTIVE_RADIUS, TIME_LIMIT_SECONDS, createLongHaulProductKits, generateCourse, nearestRoad, nearestDepot, roadV3GroundContact, terrainHeight, terrainNoise, createCourseCellDescriptor, buildRunResult, hashText, generateMacroSector } from "../long-haul-game.mjs";
import { createCellStreamingPlan } from "../game/streaming-policy.mjs";
import { createPerformanceStats } from "../game/performance-stats.mjs";
import { createPatchWorkerClient } from "../game/patch-worker-client.mjs";
import { buildTreeMeshData } from "../game/tree-mesh-builder.mjs";
import { LONG_HAUL_TRUCK_COLLIDER, ARCADE_TRAFFIC_COLLIDERS, createVehicleCollider, vehicleCollidersOverlap, vehicleColliderOverlapsCircle, verticalContactOverlaps } from "../game/vehicle-collider.mjs";

Object.assign(globalThis, { LONG_HAUL_CONTROLS, LONG_HAUL_BINDINGS, LONG_HAUL_TOUCH_ACTIONS, heldAction, createSkillProgression, SKILL_UPGRADES, createActiveAbilities, ABILITY_DEFINITIONS, createDrivingPickups, PICKUP_DEFINITIONS, createArcadeScore, buildArcadeRoutes, arcadePathPoint, arcadeRoadProgress, planArcadeEncounters, THREE, N, createForwardBoost, createTruckGrounding, indexDriveSurface, sampleDriveSurface, createPerformanceStats, createPatchWorkerClient, createLongHaulCoreKits, createLongHaulCourseEnvelope, verifyLongHaulCourseEnvelope, createLongHaulPatchPreparation, applyLongHaulOperationOnce, WORLD_ID, CELL_SIZE, ACTIVE_RADIUS: Math.max(1, ACTIVE_RADIUS), TIME_LIMIT_SECONDS, createLongHaulProductKits, generateCourse, nearestRoad, nearestDepot, roadV3GroundContact, terrainHeight, terrainNoise, createCourseCellDescriptor, buildRunResult, hashText, generateMacroSector, createCellStreamingPlan, buildTreeMeshData, LONG_HAUL_TRUCK_COLLIDER, ARCADE_TRAFFIC_COLLIDERS, createVehicleCollider, vehicleCollidersOverlap, vehicleColliderOverlapsCircle, verticalContactOverlaps });
Object.assign(globalThis, { LONG_HAUL_CONTROLS, LONG_HAUL_BINDINGS, LONG_HAUL_TOUCH_ACTIONS, heldAction, createSkillProgression, SKILL_UPGRADES, createActiveAbilities, ABILITY_DEFINITIONS, createDrivingPickups, PICKUP_DEFINITIONS, createEndlessHighway, advanceEndlessHighway, endlessHighwayPoint, endlessHighwayProgress, endlessHighwayStation, nextEndlessLoadingStation, endlessHorizonBounds, isEndlessLoadingZone, createFreightJourney, freightDifficulty, prepareFreightSave, CARGO_PROFILES, getCargoProfile, cargoDamageMultiplier, pruneLongHaulContactLedger });
Object.assign(globalThis, { LONG_HAUL_CONTROLS, LONG_HAUL_BINDINGS, LONG_HAUL_TOUCH_ACTIONS, heldAction, createSkillProgression, SKILL_UPGRADES, createActiveAbilities, ABILITY_DEFINITIONS, createDrivingPickups, PICKUP_DEFINITIONS, freshCampaignSave, readCampaignSave });

Object.assign(globalThis, { LongHaulGuidance, LongHaulArt, ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION, roadChunkAt, roadChunkSample, roadRibbonData, resolveRoadStructureContact });
Object.assign(globalThis, { ROAD_V3_VERSION, createPlayableRoadV3Course, advancePlayableRoadV3Course, playableRoadV3Point, playableRoadV3Progress });
Object.assign(globalThis, { createHeroTruckMesh, HERO_TRUCK_SOURCE });
Object.assign(globalThis,{FREIGHT_TERMINAL_VERSION,attachFreightTerminalStart,freightTerminalGroundHeight,terminalWorldPoint,terminalLocalPoint,terminalObstacleVolumes,parseFreightTerminalGlb,createFreightTerminalThreeObject});
Object.assign(globalThis,{FREIGHT_TERMINAL_TRAFFIC,evaluateFreightTerminalTraffic,terminalTrafficCollisionProxies});
Object.assign(globalThis, { createTrafficVehicleFactory, TRAFFIC_FLEET_PROFILES, TRAFFIC_FLEET_SOURCE, trafficVariantForClass });
Object.assign(globalThis, { LIGHTING_SHADOW_PRESETS, LIGHTING_SOURCE, lightingPreset, shadowAnchor, shouldRefresh, selectClosest, planarDistanceSquared, profileSummary });
Object.assign(globalThis, { ENV_TILE_METERS, ENV_CELL_METERS, ENV_TILE_VARIANTS, ENVIRONMENT_TILE_CATALOG, environmentCellPlanSteps, ENVIRONMENT_AUTHORING_SOURCE, createEnvironmentTileRenderer, ENVIRONMENT_RENDER_LIMITS });
Object.assign(globalThis,{PREBUILT_TREE_VERSION,TREE_SPECIES,parsePrebuiltTreeGlb,createPrebuiltTreeMeshes,speciesForTree,isTreeEnvironmentObject,selectVisibleTreeInstances});
// One controller owns entry readiness. Keep mandatory host installation ordered.
const startup = window.LongHaulStartup;
if (!startup) throw new Error('Startup controller is unavailable');
try {
  await startup.loadScript(new URL('../../vendor/app-runtime.js', import.meta.url));
  if (!window.__longHaulRuntimeReady) throw new Error('The local game runtime did not initialize');
  await startup.loadScript(new URL('./endless-roads.js', import.meta.url));
  if (!window.__longHaulRoadsReady) throw new Error('The road host did not initialize');
  await startup.loadScript(new URL('./freight-terminal-host.js', import.meta.url));
  // This host chooses the start location: settle its known legacy fallback before entry.
  if (!window.LongHaulFreightTerminal?.readyPromise) throw new Error('Freight terminal host did not initialize');
  await startup.required(window.LongHaulFreightTerminal.readyPromise, 'freight terminal');
  for (const name of ['./visual-presentation.js', './hero-truck-host.js', './traffic-vehicles-host.js',
    './lighting-shadow-host.js', './lighting-host.js', './environment-tiles-host.js', './guidance-v2.js',
    './four-band-cel-host.js', './sobel-outline-host.js']) {
    await startup.loadScript(new URL(name, import.meta.url));
  }
  if (!window.__longHaulVisualsReady) throw new Error('Presentation did not initialize');
  // Optional scripts install in their original order, but do not hold the menu.
  // A failed script settles its own bounded promise and the next host still runs.
  void (async () => {
    for (const name of ['./prebuilt-tree-host.js', './connected-town-host.js', './menu-attract-host.js']) {
      await startup.loadScript(new URL(name, import.meta.url), {optional:true, timeoutMs:8000});
      if (name === './prebuilt-tree-host.js') window.LongHaulPrebuiltTrees?.readyPromise?.catch(startup.warn);
      if (name === './connected-town-host.js') window.LongHaulTowns?.readyPromise?.catch(startup.warn);
    }
  })().catch(startup.warn);
  await startup.complete();
} catch (error) {
  startup.fail(error);
}
