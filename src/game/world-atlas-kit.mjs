const clone = (value) => value === undefined ? undefined : structuredClone(value);

function hashText(text) {
  let hash = 2166136261;
  for (const character of String(text)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
function unit(seed, salt) { return (hashText(`${seed}:${salt}`) & 0xffffff) / 0xffffff; }
function sectorId(x, z) { return `sector:${x}:${z}`; }

export function generateMacroSector(profile, x, z, seed = profile.worldSeed) {
  const size = Number(profile.macroSectorSize ?? 1024);
  const center = { x: (x + 0.5) * size, z: (z + 0.5) * size };
  const distance = Math.hypot(center.x, center.z);
  const insideDisk = distance <= Number(profile.playableRadius ?? 22000);
  const settlementCount = insideDisk && unit(seed, `${x}:${z}:settlements`) > 0.55 ? 1 + (unit(seed, `${x}:${z}:settlement-count`) > 0.86 ? 1 : 0) : 0;
  const settlements = Array.from({ length: settlementCount }, (_, index) => ({
    id: `settlement:${x}:${z}:${index}`,
    sectorId: sectorId(x, z),
    x: x * size + size * (0.2 + unit(seed, `${x}:${z}:sx:${index}`) * 0.6),
    z: z * size + size * (0.2 + unit(seed, `${x}:${z}:sz:${index}`) * 0.6),
    kind: ["logging", "farm", "cold-storage", "rail", "industrial"][hashText(`${seed}:${x}:${z}:${index}:kind`) % 5]
  }));
  const portals = [
    { edge: "north", x: x * size + size * (0.2 + unit(seed, `${x}:${z}:north`) * 0.6), z: z * size },
    { edge: "east", x: (x + 1) * size, z: z * size + size * (0.2 + unit(seed, `${x}:${z}:east`) * 0.6) },
    { edge: "south", x: x * size + size * (0.2 + unit(seed, `${x}:${z}:south`) * 0.6), z: (z + 1) * size },
    { edge: "west", x: x * size, z: z * size + size * (0.2 + unit(seed, `${x}:${z}:west`) * 0.6) }
  ].map((portal) => ({ ...portal, id: `portal:${x}:${z}:${portal.edge}` }));
  return {
    id: sectorId(x, z),
    coordinates: [x, z],
    bounds: { minX: x * size, minZ: z * size, maxX: (x + 1) * size, maxZ: (z + 1) * size },
    insideDisk,
    biome: ["meadow", "pine-forest", "rolling-farmland", "rocky-highland", "wetland"][hashText(`${seed}:${x}:${z}:biome`) % 5],
    hillDensity: 0.35 + unit(seed, `${x}:${z}:hills`) * 0.6,
    forestDensity: 0.2 + unit(seed, `${x}:${z}:forest`) * 0.75,
    settlements,
    portals,
    revision: 1
  };
}

export function createLongHaulWorldAtlasKit(N, options = {}) {
  const WorldAtlasState = N.defineResource("long-haul.world-atlas.state");
  const EnsureSector = N.defineEvent("long-haul.world-atlas.ensure-sector.request");
  const ResetAtlas = N.defineEvent("long-haul.world-atlas.reset.request");
  const profileResource = options.profileResource;
  const initial = { id: "long-haul-world-atlas", sectors: {}, settlements: {}, roads: {}, revision: 0 };
  const kit = N.defineDomainServiceKit({
    id: "long-haul-world-atlas-kit",
    domain: "long-haul-world-atlas",
    apiName: "longHaulWorldAtlas",
    services: ["macro-sector-generation", "settlement-registry", "road-registry", "atlas-snapshot"],
    stability: "game-stable",
    version: "3.0.0",
    resources: { WorldAtlasState },
    events: { EnsureSector, ResetAtlas },
    systems: [{ phase: "resolve", name: "longHaulWorldAtlasSystem", system(world) {
      let state = world.getResource(WorldAtlasState) ?? clone(initial);
      for (const request of world.readEvents(ResetAtlas)) state = { ...clone(initial), id: request.id ?? initial.id };
      const profile = profileResource ? world.getResource(profileResource) : options.profile;
      for (const request of world.readEvents(EnsureSector)) {
        const x = Math.floor(Number(request.x));
        const z = Math.floor(Number(request.z));
        const generated = generateMacroSector(profile ?? {}, x, z, request.seed ?? profile?.worldSeed);
        if (state.sectors[generated.id]) continue;
        const settlements = { ...state.settlements };
        for (const settlement of generated.settlements) settlements[settlement.id] = settlement;
        state = { ...state, sectors: { ...state.sectors, [generated.id]: generated }, settlements, revision: state.revision + 1 };
      }
      world.setResource(WorldAtlasState, state);
    }}],
    initWorld({ world }) { world.setResource(WorldAtlasState, clone(initial)); },
    createApi({ world }) {
      const read = () => world.getResource(WorldAtlasState);
      return {
        getState: () => clone(read()),
        getSector: (x, z) => clone(read()?.sectors?.[sectorId(Math.floor(Number(x)), Math.floor(Number(z)))] ?? null),
        ensureSector(x, z, seed) { world.emit(EnsureSector, { x, z, seed }); return sectorId(Math.floor(Number(x)), Math.floor(Number(z))); },
        listSectors: () => Object.values(read()?.sectors ?? {}).sort((a, b) => a.id.localeCompare(b.id)).map(clone),
        listSettlements: () => Object.values(read()?.settlements ?? {}).sort((a, b) => a.id.localeCompare(b.id)).map(clone),
        reset(value = {}) { world.emit(ResetAtlas, clone(value)); return clone(read()); },
        snapshot: () => clone(read())
      };
    }
  });
  return Object.freeze({ kit, resources: Object.freeze({ WorldAtlasState }) });
}
