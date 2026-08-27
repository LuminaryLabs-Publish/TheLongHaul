import assert from "node:assert/strict";
import { ACTIVE_RADIUS, CELL_SIZE, TIME_LIMIT_SECONDS, WORLD_ID, createCourseCellDescriptor, createLongHaulProductKits, generateCourse } from "../src/long-haul-game.mjs";
import { createCellStreamingPlan } from "../src/game/streaming-policy.mjs";

assert.equal(TIME_LIMIT_SECONDS, 600, "freight runs use a ten-minute dispatch window");
assert.equal(CELL_SIZE, 160, "runtime terrain uses smaller streaming cells");
assert.equal(ACTIVE_RADIUS, 1, "fog permits a compact three-by-three active window");

const cardinalPlan = createCellStreamingPlan({ position: { x: 80, z: 80 }, heading: 0, cellSize: CELL_SIZE, activeRadius: ACTIVE_RADIUS });
assert.deepEqual(cardinalPlan.step, { x: 0, z: 1 }, "streaming looks through the fog in the driving direction");
assert.equal(cardinalPlan.frontierCoordinates.length, 3, "cardinal travel prepares one narrow frontier row");
const diagonalPlan = createCellStreamingPlan({ position: { x: 80, z: 80 }, heading: Math.PI / 4, cellSize: CELL_SIZE, activeRadius: ACTIVE_RADIUS });
assert.deepEqual(diagonalPlan.step, { x: 1, z: 1 }, "diagonal travel predicts both upcoming cell boundaries");
assert.equal(diagonalPlan.frontierCoordinates.length, 5, "diagonal travel prepares only the newly exposed corner frontier");
assert.equal(new Set(diagonalPlan.frontierCoordinates.map(([x, z]) => `${x}:${z}`)).size, 5, "frontier cells stay unique");
const diagonalCoverage = new Set([...diagonalPlan.desiredCoordinates, ...diagonalPlan.frontierCoordinates].map(([x, z]) => `${x}:${z}`));
for (let z = -ACTIVE_RADIUS; z <= ACTIVE_RADIUS; z += 1) {
  for (let x = -ACTIVE_RADIUS; x <= ACTIVE_RADIUS; x += 1) {
    assert.equal(diagonalCoverage.has(`${diagonalPlan.cx + diagonalPlan.step.x + x}:${diagonalPlan.cz + diagonalPlan.step.z + z}`), true, "the rendered frontier completely covers the next physics window");
  }
}
for (let index = 0; index < 128; index += 1) {
  const plan = createCellStreamingPlan({ position: { x: index * 73.17 - 3700, z: index * -41.83 + 1900 }, heading: index * 2.399963, cellSize: CELL_SIZE, activeRadius: ACTIVE_RADIUS });
  const frontierIds = new Set(plan.frontierCoordinates.map(([x, z]) => `${x}:${z}`));
  const coverage = new Set([...plan.desiredCoordinates, ...plan.frontierCoordinates].map(([x, z]) => `${x}:${z}`));
  assert.equal(frontierIds.size, plan.frontierCoordinates.length, "streaming never schedules a duplicate frontier cell");
  assert.ok(plan.frontierCoordinates.length >= 3 && plan.frontierCoordinates.length <= 5, "the visual frontier remains compact");
  for (let z = -ACTIVE_RADIUS; z <= ACTIVE_RADIUS; z += 1) {
    for (let x = -ACTIVE_RADIUS; x <= ACTIVE_RADIUS; x += 1) {
      assert.equal(coverage.has(`${plan.cx + plan.step.x + x}:${plan.cz + plan.step.z + z}`), true, "every predicted next-window cell is prepared before the truck crosses into it");
    }
  }
}

function hashText(text) { let hash = 2166136261; for (const char of String(text)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
function seeded(seed) { let state = hashText(seed) || 0x9e3779b9; return () => { state += 0x6d2b79f5; let value = state; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; }; }
class RandomService {
  constructor() { this.seed = "test"; this.streams = new Map(); }
  setWorldSeed(seed) { this.seed = String(seed); this.streams = new Map(); }
  hasStream(id) { return this.streams.has(String(id)); }
  createStream(id, options = {}) { this.streams.set(String(id), seeded(options.seed ?? `${this.seed}:${id}`)); return { id: String(id) }; }
  fork(parent, scope, options = {}) { return this.createStream(options.id ?? `${parent}:${scope}`, { seed: `${this.seed}:${parent}:${scope}` }); }
  next(id) { if (!this.hasStream(id)) this.createStream(id); return this.streams.get(String(id))(); }
  range(id, min, max) { return min + (max - min) * this.next(id); }
  choose(id, values) { return values[Math.floor(this.next(id) * values.length) % values.length]; }
}

for (let index = 0; index < 100; index += 1) {
  const engine = { n: { coreData: { random: new RandomService() } } };
  const course = generateCourse(engine, `smoke-${index}`);
  assert.equal(course.validation.valid, true);
  assert.equal(course.branches.length, 5);
  assert.equal(course.depots.length, 5);
  assert.equal(course.depots.some((depot) => depot.id === course.validDepotId), true);
  assert.equal(course.edges.some((edge) => edge.surface === "paved" && edge.roadClass === "paved-highway"), true, "courses include a clear paved highway");
  assert.equal(course.edges.some((edge) => edge.surface === "gravel"), true, "courses include gravel alternatives");
  assert.equal(course.edges.some((edge) => edge.surface === "dirt"), true, "courses include a dirt shortcut");
  assert.equal(course.branches.every((branch) => branch.length > 1450), true, "all freight branches sustain a long route");
  if (index >= 12) continue;
  const patch = createCourseCellDescriptor(course, { id: `${WORLD_ID}:uniform-grid:0:0:0`, coordinates: [0, 0], bounds: { minX: 0, minZ: 0, maxX: CELL_SIZE, maxZ: CELL_SIZE } });
  assert.equal(structuredClone(patch).schema, "long-haul.course-cell/4");
  assert.equal(patch.terrain.segments, 20);
  assert.ok(patch.grass.length <= 96, "streamed cells keep grass realization bounded");
  assert.ok(patch.roads.every((road) => Number.isFinite(road.a.y) && Number.isFinite(road.b.y)));
  const farCell = { id: `${WORLD_ID}:uniform-grid:0:100000:-100000`, coordinates: [100000, -100000], bounds: { minX: 100000 * CELL_SIZE, minZ: -100000 * CELL_SIZE, maxX: 100001 * CELL_SIZE, maxZ: -99999 * CELL_SIZE } };
  const farPatch = createCourseCellDescriptor(course, farCell);
  assert.deepEqual(farPatch, createCourseCellDescriptor(course, farCell), "far terrain is deterministic");
  assert.equal(farPatch.terrain.heights.every(Number.isFinite), true, "far terrain remains finite");
  const eastCell = { id: `${WORLD_ID}:uniform-grid:0:100001:-100000`, coordinates: [100001, -100000], bounds: { minX: 100001 * CELL_SIZE, minZ: -100000 * CELL_SIZE, maxX: 100002 * CELL_SIZE, maxZ: -99999 * CELL_SIZE } };
  const eastPatch = createCourseCellDescriptor(course, eastCell);
  const rowSize = farPatch.terrain.segments + 1;
  for (let row = 0; row < rowSize; row += 1) assert.equal(farPatch.terrain.heights[row * rowSize + farPatch.terrain.segments], eastPatch.terrain.heights[row * rowSize], "neighboring terrain cells share a seamless edge");
}

const semanticStub = (spec = {}) => ({ type: spec.type, normalize: (value = {}) => ({ ...value, type: spec.type, definition: value.definition ?? value }), validate: () => ({ valid: true, issues: [] }), calculateBounds: (value = {}) => value.bounds ?? value.definition?.bounds ?? { minX: -1, minZ: -1, maxX: 1, maxZ: 1 }, sample: () => 0, compileContributions: () => [], describeFidelity: () => ({}) });
const N = { defineResource: (id) => Symbol(id), defineEvent: (id) => id, defineDomainServiceKit: (kit) => kit, createSemanticWorldFeatureKit: semanticStub };
const product = createLongHaulProductKits(N);
const resources = new Map();
const events = new Map();
const world = { __nexusClock: { delta: 1 / 60 }, getResource: (key) => resources.get(key), setResource: (key, value) => resources.set(key, value), emit(type, payload) { const queue = events.get(type) ?? []; queue.push(payload); events.set(type, queue); }, readEvents(type) { const queue = events.get(type) ?? []; events.set(type, []); return queue; } };
const engine = { n: {} };
for (const kit of product.kits) { kit.initWorld?.({ world }); engine.n[kit.apiName] = kit.createApi({ world, engine }); }
function tick(delta = 1 / 60) { world.__nexusClock.delta = delta; for (const kit of product.kits) for (const system of kit.systems ?? []) system.system(world); }
engine.n.longHaulTruck.reset({ x: 0, y: 0.85, z: 0, heading: Math.PI }); tick();
for (let frame = 0; frame < 120; frame += 1) { engine.n.longHaulTruck.input({ throttle: 1, steer: 0.1, surface: "road", surfaceGrip: 1, groundHeight: 0, groundNormal: { x: 0, y: 1, z: 0 } }); tick(); }
const truck = engine.n.longHaulTruck.getState();
assert.ok(truck.position.z < 0, "truck follows its authoritative forward axis");
assert.ok(truck.speed > 0, "truck accelerates forward");
assert.ok(Number.isFinite(truck.position.y), "truck vertical state remains finite");
assert.ok(Number.isFinite(truck.suspensionCompression), "suspension state remains finite");
assert.ok(Math.abs(truck.steeringAngle) < 0.2, "high-speed steering remains progressive");
engine.n.longHaulTruck.impulse({ rollDelta: 2, speedDelta: 0 }); tick();
assert.equal(engine.n.longHaulTruck.getState().tipped, true, "a severe moving impact can tip the truck");
engine.n.longHaulTruck.teleport({ x: 0, y: 0.85, z: 0, heading: 0, speed: 0 }); tick();
assert.equal(engine.n.longHaulTruck.getState().tipped, false, "roadside recovery returns the truck upright");
engine.n.longHaulDelivery.load(["a", "b", "c", "d", "e"], "c"); tick(); engine.n.longHaulDelivery.check("a"); tick(); assert.equal(engine.n.longHaulDelivery.getState().lastCheck.rejected, true); engine.n.longHaulDelivery.check("c"); tick(); assert.equal(engine.n.longHaulDelivery.getState().lastCheck.accepted, true);
console.log("The Long Haul playability smoke passed");
