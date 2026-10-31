import { createForwardBoost } from "../game/forward-boost.mjs";
import { createTruckGrounding, indexDriveSurface, sampleDriveSurface } from "../game/truck-presentation.mjs";
import * as THREE from "three";
import * as N from "nexusengine";
import { createLongHaulCoreKits, createLongHaulCourseEnvelope, verifyLongHaulCourseEnvelope, createLongHaulPatchPreparation, applyLongHaulOperationOnce } from "../long-haul-core.mjs";
import { WORLD_ID, CELL_SIZE, ACTIVE_RADIUS, TIME_LIMIT_SECONDS, createLongHaulProductKits, generateCourse, nearestRoad, nearestDepot, terrainHeight, terrainNoise, createCourseCellDescriptor, buildRunResult, hashText, generateMacroSector } from "../long-haul-game.mjs";
import { createCellStreamingPlan } from "../game/streaming-policy.mjs";
import { createPerformanceStats } from "../game/performance-stats.mjs";
import { createPatchWorkerClient } from "../game/patch-worker-client.mjs";
import { buildTreeMeshData } from "../game/tree-mesh-builder.mjs";
import { LONG_HAUL_TRUCK_COLLIDER, ARCADE_TRAFFIC_COLLIDERS, createVehicleCollider, vehicleCollidersOverlap, vehicleColliderOverlapsCircle } from "../game/vehicle-collider.mjs";

Object.assign(globalThis, { THREE, N, createForwardBoost, createTruckGrounding, indexDriveSurface, sampleDriveSurface, createPerformanceStats, createPatchWorkerClient, createLongHaulCoreKits, createLongHaulCourseEnvelope, verifyLongHaulCourseEnvelope, createLongHaulPatchPreparation, applyLongHaulOperationOnce, WORLD_ID, CELL_SIZE, ACTIVE_RADIUS: Math.max(1, ACTIVE_RADIUS), TIME_LIMIT_SECONDS, createLongHaulProductKits, generateCourse, nearestRoad, nearestDepot, terrainHeight, terrainNoise, createCourseCellDescriptor, buildRunResult, hashText, generateMacroSector, createCellStreamingPlan, buildTreeMeshData, LONG_HAUL_TRUCK_COLLIDER, ARCADE_TRAFFIC_COLLIDERS, createVehicleCollider, vehicleCollidersOverlap, vehicleColliderOverlapsCircle });

await new Promise((resolve, reject) => {
  const script=document.createElement("script");
  script.src=new URL("../../vendor/app-runtime.js",import.meta.url).href;
  script.async=false;script.onload=resolve;script.onerror=()=>reject(new Error("The local game runtime could not load."));
  document.head.append(script);
});
