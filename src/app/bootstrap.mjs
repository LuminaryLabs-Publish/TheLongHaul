import * as THREE from "three";
import * as N from "nexusengine";
import { createLongHaulCoreKits, createLongHaulCourseEnvelope, verifyLongHaulCourseEnvelope, createLongHaulPatchPreparation, applyLongHaulOperationOnce } from "../long-haul-core.mjs";
import { WORLD_ID, CELL_SIZE, ACTIVE_RADIUS, TIME_LIMIT_SECONDS, createLongHaulProductKits, generateCourse, nearestRoad, nearestDepot, terrainHeight, createCourseCellDescriptor, buildRunResult, hashText } from "../long-haul-game.mjs";

Object.assign(globalThis, { THREE, N, createLongHaulCoreKits, createLongHaulCourseEnvelope, verifyLongHaulCourseEnvelope, createLongHaulPatchPreparation, applyLongHaulOperationOnce, WORLD_ID, CELL_SIZE, ACTIVE_RADIUS, TIME_LIMIT_SECONDS, createLongHaulProductKits, generateCourse, nearestRoad, nearestDepot, terrainHeight, createCourseCellDescriptor, buildRunResult, hashText });

for (const src of ["./app-chunk-1.js", "./app-chunk-2.js", "./app-chunk-3.js", "./app-chunk-4.js", "./app-chunk-5.js", "./app-chunk-6.js", "./app-chunk-7.js", "./app-chunk-8.js", "./app-chunk-9.js", "./app-chunk-10.js", "./app-chunk-11.js"]) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(src, import.meta.url).href;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.append(script);
  });
}
