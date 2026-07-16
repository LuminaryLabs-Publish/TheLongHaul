import { createLongHaulWorldProfileKit } from "./world-profile-kit.mjs";
import { createLongHaulRoadClassCatalogKit } from "./road-class-catalog-kit.mjs";
import { createLongHaulTerrainPolicyKit } from "./terrain-policy-kit.mjs";
import { createLongHaulTruckDynamicsProfileKit } from "./truck-dynamics-profile-kit.mjs";
import { createLongHaulDeliveryContractCatalogKit } from "./delivery-contract-catalog-kit.mjs";
import { createLongHaulTruckKit } from "./truck-kit.mjs";
import { createLongHaulCourseKit } from "./course-kit.mjs";
import { createLongHaulRunKit } from "./run-kit.mjs";
import { createLongHaulDeliveryKit } from "./delivery-kit.mjs";
import { createLongHaulWildlifeKit } from "./wildlife-kit.mjs";

export function createLongHaulProductKits(N, options = {}) {
  for (const name of ["defineDomainServiceKit", "defineResource", "defineEvent"]) {
    if (typeof N?.[name] !== "function") throw new TypeError(`Missing NexusEngine.${name}`);
  }

  const worldProfile = createLongHaulWorldProfileKit(N, options.world ?? {});
  const roadClasses = createLongHaulRoadClassCatalogKit(N, options.roads ?? {});
  const terrainPolicy = createLongHaulTerrainPolicyKit(N, options.terrain ?? {});
  const truckDynamicsProfile = createLongHaulTruckDynamicsProfileKit(N, options.truck ?? {});
  const deliveryContracts = createLongHaulDeliveryContractCatalogKit(N, options.delivery ?? {});

  const truck = createLongHaulTruckKit(N, {
    dynamicsProfileResource: truckDynamicsProfile.resources.TruckDynamicsProfileState
  });
  const course = createLongHaulCourseKit(N);
  const run = createLongHaulRunKit(N);
  const delivery = createLongHaulDeliveryKit(N);
  const wildlife = createLongHaulWildlifeKit(N, run.resources.RunState);

  return Object.freeze({
    domains: Object.freeze({
      world: Object.freeze([worldProfile.kit, roadClasses.kit, terrainPolicy.kit, course.kit]),
      truck: Object.freeze([truckDynamicsProfile.kit, truck.kit]),
      delivery: Object.freeze([deliveryContracts.kit, delivery.kit]),
      run: Object.freeze([run.kit, wildlife.kit])
    }),
    kits: Object.freeze([
      worldProfile.kit,
      roadClasses.kit,
      terrainPolicy.kit,
      truckDynamicsProfile.kit,
      deliveryContracts.kit,
      truck.kit,
      course.kit,
      run.kit,
      delivery.kit,
      wildlife.kit
    ]),
    resources: Object.freeze({
      ...worldProfile.resources,
      ...roadClasses.resources,
      ...terrainPolicy.resources,
      ...truckDynamicsProfile.resources,
      ...deliveryContracts.resources,
      ...truck.resources,
      ...course.resources,
      ...run.resources,
      ...delivery.resources,
      ...wildlife.resources
    })
  });
}
