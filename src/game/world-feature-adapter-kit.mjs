import { CELL_SIZE, clone, clamp, hashText } from "./shared.mjs";
import { generateMacroSector } from "./world-atlas-kit.mjs";
import { nearestRoad, terrainNoise } from "./world-base.mjs";

function smooth01(value) {
  const t = clamp(Number(value) || 0, 0, 1);
  return t * t * (3 - 2 * t);
}

function distanceToPath(point, path = []) {
  let best = null;
  for (let index = 1; index < path.length; index += 1) {
    const a = path[index - 1];
    const b = path[index];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length2 = dx * dx + dz * dz || 1;
    const t = clamp(((point.x - a.x) * dx + (point.z - a.z) * dz) / length2, 0, 1);
    const x = a.x + dx * t;
    const z = a.z + dz * t;
    const distance = Math.hypot(point.x - x, point.z - z);
    if (!best || distance < best.distance) best = { distance, x, z, t, segmentIndex: index - 1 };
  }
  return best;
}

function roadCenterElevation(definition, sample) {
  const seed = definition.worldSeed ?? "long-haul";
  const base = terrainNoise(sample.x, sample.z, seed) * 0.72;
  const phase = Number(sample.segmentIndex ?? 0) + Number(sample.t ?? 0);
  const seedPhase = (hashText(definition.edgeId ?? definition.id ?? "road") % 6283) / 1000;
  const wave = Math.max(0, Math.sin(phase * 0.9 + seedPhase));
  const rough = definition.roadType === "rough-shortcut" || definition.roadClass === "forest-trail";
  const country = definition.roadType !== "long-safe" && definition.roadClass !== "highway";
  const crest = rough ? Math.pow(wave, 8) * 2.8 : country ? Math.pow(wave, 12) * 0.65 : 0;
  return base + crest;
}

function featureCellFromPoint(point, worldId = "long-haul-course") {
  const x = Math.floor(Number(point.x ?? 0) / CELL_SIZE);
  const z = Math.floor(Number(point.z ?? 0) / CELL_SIZE);
  return {
    id: `${worldId}:uniform-grid:0:${x}:${z}`,
    worldId,
    partitionId: "uniform-grid",
    coordinates: [x, z],
    level: 0,
    lod: 0,
    priority: 0,
    bounds: {
      minX: x * CELL_SIZE,
      minZ: z * CELL_SIZE,
      maxX: (x + 1) * CELL_SIZE,
      maxZ: (z + 1) * CELL_SIZE
    }
  };
}

function createBaseTerrainFeatureKit(N) {
  return N.createSemanticWorldFeatureKit({
    type: "long-haul-base-terrain",
    family: "landform",
    geometry: "bounds",
    blendMode: "add",
    fidelity: { near: "foundation-field", middle: "foundation-field", far: "foundation-field", collision: "foundation" },
    normalizeDefinition(source = {}) {
      return {
        ...source,
        bounds: clone(source.bounds ?? { minX: -1000000, minZ: -1000000, maxX: 1000000, maxZ: 1000000 }),
        worldSeed: String(source.worldSeed ?? source.seed ?? "long-haul")
      };
    },
    sample(feature, point) {
      return terrainNoise(Number(point.x ?? 0), Number(point.z ?? 0), feature.definition.worldSeed);
    },
    channels(feature) {
      return {
        elevation: { kind: "world-feature-field", featureType: feature.type, definition: feature },
        material: { kind: "terrain-material-zone", featureId: feature.id, class: "country-ground" },
        collision: { kind: "foundation-heightfield", featureId: feature.id, featureType: feature.type }
      };
    }
  });
}

function createRoadGradeFeatureKit(N) {
  return N.createSemanticWorldFeatureKit({
    type: "long-haul-road-grade",
    family: "settlement",
    geometry: "path",
    extentKeys: ["influenceRadius"],
    blendMode: "add",
    fidelity: { near: "foundation-field", middle: "foundation-field", far: "ribbon-descriptor", collision: "foundation" },
    normalizeDefinition(source = {}) {
      const width = Math.max(1, Number(source.width ?? 14));
      return {
        ...source,
        path: clone(source.path ?? source.centerline ?? []),
        width,
        shoulderWidth: Math.max(0, Number(source.shoulderWidth ?? width * 0.28)),
        blendWidth: Math.max(1, Number(source.blendWidth ?? width * 0.9)),
        influenceRadius: Math.max(width * 0.5 + 1, Number(source.influenceRadius ?? width * 0.5 + width * 0.28 + width * 0.9)),
        worldSeed: String(source.worldSeed ?? "long-haul"),
        edgeId: String(source.edgeId ?? source.id ?? "road"),
        roadType: String(source.roadType ?? source.roadClass ?? "country-road")
      };
    },
    sample(feature, point) {
      const definition = feature.definition;
      const nearest = distanceToPath(point, definition.path);
      if (!nearest || nearest.distance >= definition.influenceRadius) return 0;
      const roadHalfWidth = definition.width * 0.5;
      const transition = Math.max(1, definition.influenceRadius - roadHalfWidth);
      const influence = nearest.distance <= roadHalfWidth
        ? 1
        : 1 - smooth01((nearest.distance - roadHalfWidth) / transition);
      const natural = terrainNoise(Number(point.x ?? 0), Number(point.z ?? 0), definition.worldSeed);
      const roadHeight = roadCenterElevation(definition, nearest);
      return (roadHeight - natural) * influence;
    },
    channels(feature) {
      return {
        elevation: { kind: "world-feature-field", featureType: feature.type, definition: feature },
        material: {
          kind: "road-surface",
          featureId: feature.id,
          class: feature.definition.roadType,
          width: feature.definition.width,
          shoulderWidth: feature.definition.shoulderWidth
        },
        collision: { kind: "road-surface", featureId: feature.id, featureType: feature.type }
      };
    }
  });
}

export function createLongHaulWorldFeatureAdapterKit(N, options = {}) {
  for (const name of ["defineDomainServiceKit", "defineResource", "createSemanticWorldFeatureKit"]) {
    if (typeof N?.[name] !== "function") throw new TypeError(`World feature adapter requires NexusEngine.${name}.`);
  }

  const WorldFeatureAdapterState = N.defineResource("long-haul.world-feature-adapter.state");
  const initial = {
    id: "long-haul-world-feature-adapter",
    courseSeed: null,
    course: null,
    registeredFeatureIds: [],
    ensuredSectorIds: [],
    compiledCellIds: [],
    revision: 0
  };

  const kit = N.defineDomainServiceKit({
    id: "long-haul-world-feature-adapter-kit",
    domain: "long-haul-world-features",
    apiName: "longHaulWorldFeatures",
    services: ["feature-registration", "foundation-compilation", "ground-sampling", "surface-query"],
    stability: "game-stable",
    version: "4.0.0",
    resources: { WorldFeatureAdapterState },
    initWorld({ world }) {
      world.setResource(WorldFeatureAdapterState, clone(initial));
    },
    createApi({ world, engine }) {
      const features = () => engine.n?.worldFeatures;
      const foundation = () => engine.n?.worldFoundation;
      const read = () => world.getResource(WorldFeatureAdapterState) ?? clone(initial);
      const write = (next) => {
        world.setResource(WorldFeatureAdapterState, next);
        return clone(next);
      };

      function requireCore() {
        if (!features() || !foundation()) throw new Error("Long Haul world features require Core World child domains.");
      }

      function registerTypeOnce(handler) {
        requireCore();
        if (!features().hasFeatureType(handler.type)) features().registerFeatureType(handler.type, handler);
      }

      function unregisterAll() {
        if (!features()) return;
        const state = read();
        for (const id of state.registeredFeatureIds ?? []) features().unregisterFeature(id);
        for (const cellId of state.compiledCellIds ?? []) features().releaseCompiledCell(cellId);
        write({ ...clone(initial), revision: Number(state.revision ?? 0) + 1 });
      }

      function registerFeature(input) {
        const state = read();
        if (state.registeredFeatureIds.includes(input.id)) return features().getFeature(input.id);
        const feature = features().registerFeature(input);
        write({
          ...state,
          registeredFeatureIds: [...state.registeredFeatureIds, feature.id],
          revision: Number(state.revision ?? 0) + 1
        });
        return feature;
      }

      function registerRoad(edge, seed, prefix = "course") {
        const path = (edge.samples ?? []).map((point) => ({ x: Number(point.x), z: Number(point.z) }));
        if (path.length < 2) return;
        registerFeature({
          id: `${prefix}:road:${edge.id}`,
          type: "road",
          seed: `${seed}:${edge.id}:semantic-road`,
          priority: 40,
          definition: {
            path,
            width: Number(edge.width ?? 14),
            class: String(edge.type ?? edge.branchId ?? "country-road"),
            surface: edge.type === "rough-shortcut" ? "gravel" : "asphalt"
          },
          metadata: { edgeId: edge.id, branchId: edge.branchId, source: prefix }
        });
        registerFeature({
          id: `${prefix}:road-grade:${edge.id}`,
          type: "long-haul-road-grade",
          seed: `${seed}:${edge.id}:road-grade`,
          priority: 50,
          definition: {
            path,
            width: Number(edge.width ?? 14),
            shoulderWidth: Number(edge.width ?? 14) * 0.3,
            blendWidth: Number(edge.width ?? 14) * 0.95,
            worldSeed: seed,
            edgeId: edge.id,
            roadType: edge.type ?? edge.branchId ?? "country-road"
          },
          metadata: { edgeId: edge.id, branchId: edge.branchId, source: prefix }
        });
      }

      function loadCourse(course = {}) {
        requireCore();
        unregisterAll();
        registerTypeOnce(createBaseTerrainFeatureKit(N));
        registerTypeOnce(createRoadGradeFeatureKit(N));
        const profile = engine.n?.longHaulWorldProfile?.getState?.() ?? {};
        const root = profile.horizon?.rootBounds ?? { minX: -1000000, minZ: -1000000, maxX: 1000000, maxZ: 1000000 };
        const seed = String(course.seed ?? profile.worldSeed ?? "long-haul");
        registerFeature({
          id: "long-haul:base-terrain",
          type: "long-haul-base-terrain",
          seed: `${seed}:base-terrain`,
          priority: -1000,
          bounds: clone(root),
          definition: { bounds: clone(root), worldSeed: seed }
        });
        for (const edge of course.edges ?? []) registerRoad(edge, seed);
        for (const depot of course.depots ?? []) {
          registerFeature({
            id: `course:settlement:${depot.id}`,
            type: "settlement",
            seed: `${seed}:${depot.id}:settlement`,
            priority: 70,
            definition: {
              center: { x: depot.x, z: depot.z },
              radius: Math.max(70, Number(depot.radius ?? 28) * 2.5),
              density: 0.8,
              settlementType: depot.kind ?? "freight-depot"
            },
            metadata: { depotId: depot.id, depotKind: depot.kind }
          });
          registerFeature({
            id: `course:landmark:${depot.id}`,
            type: "landmark",
            seed: `${seed}:${depot.id}:landmark`,
            definition: {
              center: { x: depot.x, z: depot.z },
              radius: 45,
              visibility: 4000,
              landmarkType: depot.kind ?? "freight-depot"
            },
            metadata: { depotId: depot.id }
          });
        }
        const state = read();
        write({ ...state, courseSeed: seed, course: clone(course), revision: Number(state.revision ?? 0) + 1 });
        return clone(read());
      }

      function ensureSector(x, z, seedOverride) {
        requireCore();
        const state = read();
        const profile = engine.n?.longHaulWorldProfile?.getState?.() ?? options.profile ?? {};
        const seed = String(seedOverride ?? state.courseSeed ?? profile.worldSeed ?? "long-haul");
        const sector = generateMacroSector(profile, Math.floor(Number(x)), Math.floor(Number(z)), seed);
        if (state.ensuredSectorIds.includes(sector.id)) return clone(sector);
        const center = { x: (sector.bounds.minX + sector.bounds.maxX) * 0.5, z: (sector.bounds.minZ + sector.bounds.maxZ) * 0.5 };
        registerFeature({
          id: `${sector.id}:hill`,
          type: "hill",
          seed: `${seed}:${sector.id}:hill`,
          priority: 5,
          definition: {
            center,
            radius: profile.macroSectorSize * 0.48,
            height: 12 + sector.hillDensity * 24,
            sharpness: 1.4 + sector.hillDensity * 0.8
          }
        });
        registerFeature({
          id: `${sector.id}:${sector.biome === "meadow" ? "meadow" : "forest"}`,
          type: sector.biome === "meadow" || sector.biome === "rolling-farmland" ? "meadow" : "forest",
          seed: `${seed}:${sector.id}:biome`,
          priority: 20,
          definition: {
            center,
            radius: profile.macroSectorSize * 0.52,
            density: sector.biome === "meadow" ? 0.25 : sector.forestDensity,
            sharpness: 1.35
          },
          metadata: { sectorId: sector.id, biome: sector.biome }
        });
        for (const settlement of sector.settlements) {
          registerFeature({
            id: `${sector.id}:settlement:${settlement.id}`,
            type: "settlement",
            seed: `${seed}:${settlement.id}`,
            priority: 65,
            definition: {
              center: { x: settlement.x, z: settlement.z },
              radius: 180,
              density: 0.72,
              settlementType: settlement.kind
            },
            metadata: { sectorId: sector.id, settlementId: settlement.id }
          });
        }
        const portalEdges = sector.portals.map((portal, index) => ({
          id: `${sector.id}:portal-road:${index}`,
          branchId: sector.id,
          type: "country-road",
          width: 12,
          samples: [center, { x: portal.x, z: portal.z }]
        }));
        for (const edge of portalEdges) registerRoad(edge, seed, sector.id);
        const latest = read();
        write({ ...latest, ensuredSectorIds: [...latest.ensuredSectorIds, sector.id], revision: Number(latest.revision ?? 0) + 1 });
        return clone(sector);
      }

      function ensureFeaturesForBounds(bounds = {}) {
        const profile = engine.n?.longHaulWorldProfile?.getState?.() ?? options.profile ?? {};
        const size = Math.max(256, Number(profile.macroSectorSize ?? 1024));
        const minX = Math.floor(Number(bounds.minX ?? 0) / size);
        const maxX = Math.floor((Number(bounds.maxX ?? 0) - 1) / size);
        const minZ = Math.floor(Number(bounds.minZ ?? 0) / size);
        const maxZ = Math.floor((Number(bounds.maxZ ?? 0) - 1) / size);
        const span = Math.max(maxX - minX, maxZ - minZ);
        const step = Math.max(1, Math.ceil((span + 1) / 8));
        for (let z = minZ; z <= maxZ; z += step) for (let x = minX; x <= maxX; x += step) ensureSector(x, z);
      }

      function compileCell(cell) {
        requireCore();
        ensureFeaturesForBounds(cell.bounds ?? {});
        const result = features().compileCell(cell, {
          baseFoundation: {
            elevation: 0,
            material: { kind: "country-ground", class: "terrain" },
            collision: { kind: "foundation-heightfield" }
          }
        });
        const state = read();
        if (!state.compiledCellIds.includes(cell.id)) {
          write({ ...state, compiledCellIds: [...state.compiledCellIds, cell.id], revision: Number(state.revision ?? 0) + 1 });
        }
        return clone(result);
      }

      function sampleElevation(cell, point) {
        compileCell(cell);
        return foundation().sampleElevation(cell.id, point, features().getSamplers());
      }

      function sampleElevationAt(point, worldId = "long-haul-course") {
        const cell = featureCellFromPoint(point, worldId);
        return sampleElevation(cell, point);
      }

      function sampleSurfaceAt(point, worldId = "long-haul-course") {
        const state = read();
        const cell = featureCellFromPoint(point, worldId);
        const height = sampleElevation(cell, point);
        const material = foundation().sampleChannel(cell.id, "material", point, features().getSamplers());
        const road = nearestRoad(state.course, point);
        const onRoad = Boolean(road && road.distance <= road.edge.width * 0.55 + 1.4);
        const shoulder = Boolean(road && !onRoad && road.distance <= road.edge.width * 0.85 + 5);
        return {
          cellId: cell.id,
          height,
          material: clone(material),
          surface: onRoad ? "road" : shoulder ? "shoulder" : "off-road",
          road: clone(road),
          grip: onRoad ? (road?.edge?.type === "rough-shortcut" ? 0.72 : 1) : shoulder ? 0.62 : 0.38
        };
      }

      function releaseCell(cellId) {
        const removed = features()?.releaseCompiledCell?.(cellId) ?? false;
        const state = read();
        if (state.compiledCellIds.includes(cellId)) write({ ...state, compiledCellIds: state.compiledCellIds.filter((id) => id !== cellId) });
        return removed;
      }

      return {
        getState: () => clone(read()),
        loadCourse,
        ensureSector,
        ensureFeaturesForBounds,
        compileCell,
        sampleElevation,
        sampleElevationAt,
        sampleSurfaceAt,
        releaseCell,
        reset: unregisterAll,
        snapshot: () => clone(read())
      };
    }
  });

  return Object.freeze({ kit, resources: Object.freeze({ WorldFeatureAdapterState }) });
}

export default createLongHaulWorldFeatureAdapterKit;
