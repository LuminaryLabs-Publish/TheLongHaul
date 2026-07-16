const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const LONG_HAUL_COURSE_SCHEMA_ID = "long-haul.course-package";
export const LONG_HAUL_COURSE_SCHEMA_VERSION = "1.0.0";
export const LONG_HAUL_COURSE_ENVELOPE_SCHEMA = "long-haul.course-package/1";

export const LONG_HAUL_RANDOM_STREAMS = Object.freeze([
  "course-layout",
  "valid-depot",
  "terrain",
  "vegetation",
  "wildlife",
  "materials",
  "presentation"
]);

export function createLongHaulCourseSchema(NexusEngine) {
  if (typeof NexusEngine?.createDataSchema !== "function") {
    throw new TypeError("createLongHaulCourseSchema requires NexusEngine.createDataSchema.");
  }
  return NexusEngine.createDataSchema({
    id: LONG_HAUL_COURSE_SCHEMA_ID,
    version: LONG_HAUL_COURSE_SCHEMA_VERSION,
    required: ["schema", "packageId", "seed", "routeField", "world", "delivery", "scoring"],
    additionalProperties: false,
    fields: {
      schema: { type: "string", const: LONG_HAUL_COURSE_ENVELOPE_SCHEMA },
      packageId: { type: "string", minLength: 1 },
      seed: { type: "string", minLength: 1 },
      generatorVersion: { type: "string", minLength: 1 },
      routeField: {
        type: "object",
        required: ["markers", "corridors"],
        properties: {
          markers: { type: "array" },
          corridors: { type: "array" }
        },
        additionalProperties: true
      },
      world: {
        type: "object",
        required: ["cellSize", "activeRadius", "extent", "bounds"],
        properties: {
          cellSize: { type: "number", minimum: 1 },
          activeRadius: { type: "integer", minimum: 0 },
          extent: { type: "string", const: "infinite" },
          bounds: { type: "object" },
          recipes: { type: "object" },
          initialPatches: { type: "array" }
        },
        additionalProperties: true
      },
      delivery: {
        type: "object",
        required: ["candidateDepotIds", "validDepotId"],
        properties: {
          candidateDepotIds: { type: "array", minLength: 5, maxLength: 5, items: { type: "string", minLength: 1 } },
          validDepotId: { type: "string", minLength: 1 }
        },
        additionalProperties: false
      },
      scoring: {
        type: "object",
        required: ["parTimeSeconds", "parDistance"],
        properties: {
          parTimeSeconds: { type: "number", minimum: 1 },
          parDistance: { type: "number", minimum: 1 }
        },
        additionalProperties: true
      }
    }
  });
}

export function createLongHaulCoreKits(NexusEngine, options = {}) {
  const required = [
    "createCoreDataKit",
    "createCoreSimulationKit",
    "createCoreCameraKit",
    "createCoreGraphicsKit",
    "createCoreTransactionLedgerKit"
  ];
  for (const name of required) {
    if (typeof NexusEngine?.[name] !== "function") throw new TypeError(`createLongHaulCoreKits requires NexusEngine.${name}.`);
  }

  const seed = String(options.seed ?? "long-haul");
  const timeLimitSeconds = Math.max(1, Number(options.timeLimitSeconds ?? 300));
  const schema = createLongHaulCourseSchema(NexusEngine);

  return Object.freeze({
    schema,
    kits: Object.freeze([
      NexusEngine.createCoreDataKit({
        random: {
          seed,
          maxStreams: 64,
          streams: LONG_HAUL_RANDOM_STREAMS
        },
        packages: {
          schemas: [schema],
          receiptLimit: 64
        }
      }),
      NexusEngine.createCoreSimulationKit({
        resourceMeters: [
          {
            id: "fuel",
            label: "Fuel",
            initial: 100,
            min: 0,
            max: 100,
            thresholds: [
              { id: "fuel-low", value: 20, direction: "below" },
              { id: "fuel-empty", value: 0, direction: "below", once: true }
            ]
          },
          {
            id: "truck-condition",
            label: "Truck",
            initial: 100,
            min: 0,
            max: 100,
            thresholds: [
              { id: "truck-critical", value: 20, direction: "below" },
              { id: "truck-destroyed", value: 0, direction: "below", once: true }
            ]
          },
          {
            id: "cargo-condition",
            label: "Cargo",
            initial: 100,
            min: 0,
            max: 100,
            thresholds: [
              { id: "cargo-damaged", value: 70, direction: "below" },
              { id: "cargo-destroyed", value: 0, direction: "below", once: true }
            ]
          },
          {
            id: "remaining-time",
            label: "Time",
            initial: timeLimitSeconds,
            min: 0,
            max: timeLimitSeconds,
            ratePerSecond: -1,
            locked: true,
            thresholds: [
              { id: "final-minute", value: Math.min(60, timeLimitSeconds), direction: "below", once: true },
              { id: "timeout", value: 0, direction: "below", once: true }
            ]
          }
        ]
      }),
      NexusEngine.createCoreCameraKit({
        smoothing: {
          controllers: [{
            id: "player-camera",
            position: [0, 7, 15],
            lookPoint: [0, 2, 0],
            fov: 58,
            mode: "chase",
            positionSharpness: 5.2,
            lookSharpness: 8,
            rotationSharpness: 12,
            fovSharpness: 4,
            maximumDelta: 1 / 30,
            teleportThreshold: 80
          }]
        }
      }),
      NexusEngine.createCoreGraphicsKit({
        instanceBatches: {
          batches: [
            { id: "course-trees", assetId: "tree", materialId: "tree-material", capacity: 2048, updateMode: "incremental" },
            { id: "course-grass", assetId: "grass-clump", materialId: "grass-material", capacity: 4096, updateMode: "incremental" },
            { id: "course-signs", assetId: "road-sign", materialId: "sign-material", capacity: 128, updateMode: "incremental" },
            { id: "course-depot-props", assetId: "depot-prop", materialId: "depot-material", capacity: 256, updateMode: "incremental" }
          ]
        }
      }),
      NexusEngine.createCoreTransactionLedgerKit()
    ])
  });
}

export function createLongHaulCourseEnvelope(engine, coursePackage, metadata = {}) {
  const packages = engine?.n?.coreData?.packages;
  if (!packages) throw new Error("Long Haul course envelopes require Core Data packages.");
  return packages.createEnvelope({
    packageId: coursePackage.packageId,
    schemaId: LONG_HAUL_COURSE_SCHEMA_ID,
    payload: clone(coursePackage),
    createdFrom: {
      seed: coursePackage.seed,
      generatorVersion: coursePackage.generatorVersion ?? "v1"
    },
    metadata: clone(metadata)
  });
}

export function verifyLongHaulCourseEnvelope(engine, envelope) {
  const packages = engine?.n?.coreData?.packages;
  if (!packages) throw new Error("Long Haul course verification requires Core Data packages.");
  return packages.verifyEnvelope(envelope, { schemaId: LONG_HAUL_COURSE_SCHEMA_ID });
}

export function createLongHaulPatchPreparation(NexusEngine, options = {}) {
  if (typeof NexusEngine?.createWorldPatchPreparationController !== "function") {
    throw new TypeError("createLongHaulPatchPreparation requires NexusEngine.createWorldPatchPreparationController.");
  }
  return NexusEngine.createWorldPatchPreparationController({
    id: options.id ?? "long-haul-world",
    patchSize: options.patchSize ?? 192,
    retainRadius: options.retainRadius ?? 2,
    prefetchDistance: options.prefetchDistance ?? 2,
    cacheLimit: options.cacheLimit ?? 64,
    generationBudget: options.generationBudget ?? 2,
    activationBudget: options.activationBudget ?? 2,
    generatorVersion: options.generatorVersion ?? "long-haul-world-v1",
    settingsHash: options.settingsHash ?? "default",
    generatePatch: options.generatePatch,
    executor: options.executor
  });
}

export function longHaulRunLedgerId(seed) {
  return `long-haul:${String(seed)}`;
}

export function applyLongHaulOperationOnce(engine, seed, operationId, operation, metadata = {}) {
  const ledger = engine?.n?.coreTransactionLedger;
  if (!ledger) throw new Error("Long Haul idempotent operations require Core Transaction Ledger.");
  return ledger.applyOnce(longHaulRunLedgerId(seed), String(operationId), operation, clone(metadata));
}
