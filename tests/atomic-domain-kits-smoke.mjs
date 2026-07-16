import assert from "node:assert/strict";
import {
  DEFAULT_LONG_HAUL_WORLD_PROFILE,
  DEFAULT_ROAD_CLASSES,
  DEFAULT_TERRAIN_POLICY,
  DEFAULT_TRUCK_DYNAMICS_PROFILE,
  DEFAULT_DELIVERY_CONTRACT_TYPES,
  createLongHaulProductKits
} from "../src/long-haul-game.mjs";

const N = {
  defineResource: (id) => Symbol(id),
  defineEvent: (id) => id,
  defineDomainServiceKit: (kit) => kit
};
const product = createLongHaulProductKits(N);
assert.equal(product.domains.world.length, 4);
assert.equal(product.domains.truck.length, 2);
assert.equal(product.domains.delivery.length, 2);
assert.equal(product.kits.length, 10);
assert.equal(DEFAULT_LONG_HAUL_WORLD_PROFILE.playableRadius, 22000);
assert.equal(DEFAULT_LONG_HAUL_WORLD_PROFILE.gameplayActiveRadius, 2);
assert.equal(DEFAULT_ROAD_CLASSES.length, 4);
assert.ok(DEFAULT_TERRAIN_POLICY.jumpProfiles.erodedRamp);
assert.ok(DEFAULT_TRUCK_DYNAMICS_PROFILE.grip.handbrake < DEFAULT_TRUCK_DYNAMICS_PROFILE.grip.road);
assert.ok(DEFAULT_DELIVERY_CONTRACT_TYPES.some((entry) => entry.id === "lost-manifest"));

const resources = new Map();
const events = new Map();
const world = {
  __nexusClock: { delta: 1 / 60 },
  getResource: (key) => resources.get(key),
  setResource: (key, value) => resources.set(key, value),
  emit(type, payload) { const queue = events.get(type) ?? []; queue.push(payload); events.set(type, queue); },
  readEvents(type) { const queue = events.get(type) ?? []; events.set(type, []); return queue; }
};
const engine = { n: {} };
for (const kit of product.kits) {
  kit.initWorld?.({ world });
  engine.n[kit.apiName] = kit.createApi({ world, engine });
}
for (const system of product.kits.flatMap((kit) => kit.systems ?? [])) system.system(world);
assert.equal(engine.n.longHaulWorldProfile.getState().playableRadius, 22000);
assert.equal(engine.n.longHaulRoadClasses.get("forest-trail").id, "forest-trail");
assert.ok(engine.n.longHaulTerrainPolicy.getJumpProfile("softCrest"));
assert.equal(engine.n.longHaulDeliveryContracts.get("lost-manifest").candidateDepots, 5);

engine.n.longHaulTruck.reset({ x: 0, y: 0, z: 0, heading: 0 });
for (const system of product.kits.flatMap((kit) => kit.systems ?? [])) system.system(world);
for (let frame = 0; frame < 180; frame += 1) {
  engine.n.longHaulTruck.input({ throttle: 1, steer: 0.65, handbrake: frame > 70 && frame < 120, surface: "road", surfaceGrip: 1, groundHeight: 0 });
  for (const system of product.kits.flatMap((kit) => kit.systems ?? [])) system.system(world);
}
const truck = engine.n.longHaulTruck.getState();
assert.ok(Number.isFinite(truck.position.x) && Number.isFinite(truck.position.y) && Number.isFinite(truck.position.z));
assert.ok(Number.isFinite(truck.lateralSpeed));
assert.ok(Number.isFinite(truck.driftAngle));
assert.ok("grounded" in truck && "suspensionCompression" in truck && "airTime" in truck);
assert.doesNotThrow(() => structuredClone(truck));

console.log("Long Haul atomic domain kits smoke passed");
