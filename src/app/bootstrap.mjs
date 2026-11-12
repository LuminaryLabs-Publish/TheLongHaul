import {TOON_STYLE} from '../game/toon-style.mjs';
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
// Guard dynamically-created Resume as well as Start until both host layers
// are ready. This never changes disabled states owned by an existing control.
const blockEarlyEntry = event => {
  if (event.target?.closest?.('#start-btn, #freight-resume-btn')) {
    event.preventDefault(); event.stopImmediatePropagation();
  }
};
document.addEventListener('click', blockEarlyEntry, true);
const entryButtons = [...document.querySelectorAll("#start-btn, #freight-resume-btn")];
entryButtons.forEach(button => button.disabled = true);
await new Promise((resolve, reject) => {
  const script=document.createElement("script");
  script.src=new URL("../../vendor/app-runtime.js",import.meta.url).href;
  script.async=false;script.onload=resolve;script.onerror=()=>reject(new Error("The local game runtime could not load."));
  document.head.append(script);
});

await new Promise((resolve, reject) => {
  const script = document.createElement("script");
  script.src = new URL("./endless-roads.js", import.meta.url).href;
  script.async = false; script.onload = resolve;
  script.onerror = () => reject(new Error("The Endless road host could not load."));
  document.head.append(script);
});
// The authored freight yard joins the active highway graph and displays the
// actual production GLB. Load before enabling start/resume actions.
await new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('./freight-terminal-host.js',import.meta.url).href;
  script.async=false;script.onload=resolve;
  script.onerror=()=>reject(new Error('Freight terminal host could not load'));
  document.head.append(script);
});
await window.LongHaulFreightTerminal.readyPromise;
await new Promise((resolve, reject) => {
  const script = document.createElement("script");
  script.src = new URL("./visual-presentation.js", import.meta.url).href;
  script.async = false; script.onload = resolve;
  script.onerror = () => reject(new Error("The visual presentation host could not load."));
  document.head.append(script);
});
await new Promise((resolve, reject) => {
  const script = document.createElement("script");
  script.src = new URL("./hero-truck-host.js", import.meta.url).href;
  script.async = false; script.onload = resolve;
  script.onerror = () => reject(new Error("The authored hero truck host could not load."));
  document.head.append(script);
});
await new Promise((resolve, reject) => {
  const script = document.createElement("script");
  script.src = new URL("./traffic-vehicles-host.js", import.meta.url).href;
  script.async = false;
  script.onload = resolve;
  script.onerror = () => reject(new Error("The authored traffic fleet host could not load."));
  document.head.append(script);
});
await new Promise((resolve, reject) => {
  const script = document.createElement("script");
  script.src = new URL("./lighting-shadow-host.js", import.meta.url).href;
  script.async = false; script.onload = resolve;
  script.onerror=()=>reject(new Error("The illustrated lighting host could not load."));
  document.head.append(script);
});
await new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('./lighting-host.js',import.meta.url).href;
  script.async=false;script.onload=resolve;
  script.onerror=()=>reject(new Error('The lighting controller could not load'));
  document.head.append(script);
});
await new Promise((resolve, reject) => {
  const script = document.createElement("script");
  script.src = new URL("./environment-tiles-host.js", import.meta.url).href;
  script.async = false;
  script.onload = resolve;
  script.onerror = () => reject(new Error("The 200m environment tile host could not load."));
  document.head.append(script);
});
// Load the local prebuilt foliage-card tree library after the existing
// environment and lighting hosts. A failed import retains their old trees.
await new Promise((resolve,reject) => {
  const script=document.createElement('script');
  script.src=new URL('./prebuilt-tree-host.js',import.meta.url).href;
  script.async=false;script.onload=resolve;
  script.onerror=()=>reject(new Error('The prebuilt tree host could not load.'));
  document.head.append(script);
});
await window.LongHaulPrebuiltTrees?.readyPromise;
// The shared-drive GLB library supplies actual town buildings. Its absence
// leaves connected roads traversable, never a synthetic placeholder model.
await new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('./connected-town-host.js',import.meta.url).href;
  script.async=false;script.onload=resolve;
  script.onerror=()=>reject(new Error('Connected town presenter could not load'));
  document.head.append(script);
});
await window.LongHaulTowns?.readyPromise;

// V2 remains opt-in until its browser/video acceptance is complete.
await new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.src = new URL('./guidance-v2.js', import.meta.url).href;
  script.async = false; script.onload = resolve;
  script.onerror = () => reject(new Error('TLH-003 guidance host could not load.'));
  document.head.append(script);
});
// The title attract-mode renders from the existing deterministic road sampling
// contract. It never owns gameplay physics, freight, save or input state.
await new Promise(resolve => {
  const script = document.createElement('script');
  script.src = new URL('./menu-attract-host.js', import.meta.url).href;
  script.async = false;
  script.onload = resolve;
  script.onerror = () => { console.warn('Cinematic menu background unavailable; preserving menu controls'); resolve(); };
  document.head.append(script);
});
// Four high-contrast lighting bands belong to opaque world materials, before
// the existing Sobel postprocess; the HTML HUD and sky stay unquantized.
await new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('./four-band-cel-host.js',import.meta.url).href;
  script.async=false;script.onload=resolve;
  script.onerror=()=>reject(new Error('Four-band cel shading host failed to load'));
  document.head.append(script);
});
// Outline the entire rendered 3D game using its original depth and color.
// One postprocess pass wraps the existing renderer, not a second world.
await new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=new URL('./sobel-outline-host.js',import.meta.url).href;
  script.async=false;script.onload=resolve;
  script.onerror=()=>reject(new Error('Sobel outline host failed to load'));
  document.head.append(script);
});
entryButtons.forEach(button => button.disabled = false);
document.removeEventListener('click', blockEarlyEntry, true);
