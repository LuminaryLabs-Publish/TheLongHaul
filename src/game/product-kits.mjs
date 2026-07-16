import { createLongHaulTruckKit } from "./truck-kit.mjs";
import { createLongHaulCourseKit } from "./course-kit.mjs";
import { createLongHaulRunKit } from "./run-kit.mjs";
import { createLongHaulDeliveryKit } from "./delivery-kit.mjs";
import { createLongHaulWildlifeKit } from "./wildlife-kit.mjs";

export function createLongHaulProductKits(N) {
  for (const name of ["defineDomainServiceKit", "defineResource", "defineEvent"]) {
    if (typeof N?.[name] !== "function") throw new TypeError(`Missing NexusEngine.${name}`);
  }
  const truck = createLongHaulTruckKit(N);
  const course = createLongHaulCourseKit(N);
  const run = createLongHaulRunKit(N);
  const delivery = createLongHaulDeliveryKit(N);
  const wildlife = createLongHaulWildlifeKit(N, run.resources.RunState);
  return Object.freeze({
    kits: Object.freeze([truck.kit, course.kit, run.kit, delivery.kit, wildlife.kit]),
    resources: Object.freeze({ ...truck.resources, ...course.resources, ...run.resources, ...delivery.resources, ...wildlife.resources })
  });
}
