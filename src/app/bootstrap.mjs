import * as LongHaulArt from '../game/landscape-style.mjs';
import { resolveRoadStructureContact } from "../game/road-structure-contact.mjs";
import { ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION, roadChunkAt, roadChunkSample } from "../game/road-chunks.mjs";
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
import * as THREE from "three";
import * as N from "nexusengine";
import { createLongHaulCoreKits, createLongHaulCourseEnvelope, verifyLongHaulCourseEnvelope, createLongHaulPatchPreparation, applyLongHaulOperationOnce } from "../long-haul-core.mjs";
import { WORLD_ID, CELL_SIZE, ACTIVE_RADIUS, TIME_LIMIT_SECONDS, createLongHaulProductKits, generateCourse, nearestRoad, nearestDepot, terrainHeight, terrainNoise, createCourseCellDescriptor, buildRunResult, hashText, generateMacroSector } from "../long-haul-game.mjs";
import { createCellStreamingPlan } from "../game/streaming-policy.mjs";
import { createPerformanceStats } from "../game/performance-stats.mjs";
import { createPatchWorkerClient } from "../game/patch-worker-client.mjs";
import { buildTreeMeshData } from "../game/tree-mesh-builder.mjs";
import { LONG_HAUL_TRUCK_COLLIDER, ARCADE_TRAFFIC_COLLIDERS, createVehicleCollider, vehicleCollidersOverlap, vehicleColliderOverlapsCircle } from "../game/vehicle-collider.mjs";

Object.assign(globalThis, { LONG_HAUL_CONTROLS, LONG_HAUL_BINDINGS, LONG_HAUL_TOUCH_ACTIONS, heldAction, createSkillProgression, SKILL_UPGRADES, createActiveAbilities, ABILITY_DEFINITIONS, createDrivingPickups, PICKUP_DEFINITIONS, createArcadeScore, buildArcadeRoutes, arcadePathPoint, arcadeRoadProgress, planArcadeEncounters, THREE, N, createForwardBoost, createTruckGrounding, indexDriveSurface, sampleDriveSurface, createPerformanceStats, createPatchWorkerClient, createLongHaulCoreKits, createLongHaulCourseEnvelope, verifyLongHaulCourseEnvelope, createLongHaulPatchPreparation, applyLongHaulOperationOnce, WORLD_ID, CELL_SIZE, ACTIVE_RADIUS: Math.max(1, ACTIVE_RADIUS), TIME_LIMIT_SECONDS, createLongHaulProductKits, generateCourse, nearestRoad, nearestDepot, terrainHeight, terrainNoise, createCourseCellDescriptor, buildRunResult, hashText, generateMacroSector, createCellStreamingPlan, buildTreeMeshData, LONG_HAUL_TRUCK_COLLIDER, ARCADE_TRAFFIC_COLLIDERS, createVehicleCollider, vehicleCollidersOverlap, vehicleColliderOverlapsCircle });
Object.assign(globalThis, { LONG_HAUL_CONTROLS, LONG_HAUL_BINDINGS, LONG_HAUL_TOUCH_ACTIONS, heldAction, createSkillProgression, SKILL_UPGRADES, createActiveAbilities, ABILITY_DEFINITIONS, createDrivingPickups, PICKUP_DEFINITIONS, createEndlessHighway, advanceEndlessHighway, endlessHighwayPoint, endlessHighwayProgress, endlessHighwayStation, nextEndlessLoadingStation, endlessHorizonBounds, isEndlessLoadingZone, createFreightJourney, freightDifficulty, prepareFreightSave, CARGO_PROFILES, getCargoProfile, cargoDamageMultiplier, pruneLongHaulContactLedger });
Object.assign(globalThis, { LONG_HAUL_CONTROLS, LONG_HAUL_BINDINGS, LONG_HAUL_TOUCH_ACTIONS, heldAction, createSkillProgression, SKILL_UPGRADES, createActiveAbilities, ABILITY_DEFINITIONS, createDrivingPickups, PICKUP_DEFINITIONS, freshCampaignSave, readCampaignSave });

Object.assign(globalThis, { LongHaulArt, ROAD_GENERATOR_VERSION, LEGACY_ROAD_VERSION, roadChunkAt, roadChunkSample, roadRibbonData, resolveRoadStructureContact });
Object.assign(globalThis, { createHeroTruckMesh, HERO_TRUCK_SOURCE });
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
entryButtons.forEach(button => button.disabled = false);
document.removeEventListener('click', blockEarlyEntry, true);
