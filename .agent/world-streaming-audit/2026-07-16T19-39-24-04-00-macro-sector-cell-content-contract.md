# World streaming audit: macro-sector to gameplay-cell content contract

**Timestamp:** `2026-07-16T19-39-24-04-00`

## Goal

Define how 1024-unit macro-sector truth is deterministically projected into 192-unit gameplay cells without seams, duplicate ownership or stale-generation mixing.

## Existing coordinate layers

```txt
macro sector
  size: worldProfile.macroSectorSize (default 1024)
  identity: sector:x:z
  data: bounds, biome, densities, settlements, portals

gameplay cell
  size: worldProfile.gameplayCellSize / CELL_SIZE (default 192)
  identity: Core World uniform-grid cell ID
  data: terrain, roads, depots, signs, vegetation, grass, rocks

horizon node
  configured by horizon root bounds and LOD policy
  active playable consumption: not established
```

The two grids are not integer multiples. A gameplay cell may overlap more than one macro sector, and a macro sector spans partial gameplay cells at its edges. The contract must therefore use geometric overlap rather than one implicit parent index.

## Required addressing

```txt
for each gameplay cell bounds
  -> enumerate every overlapping macro sector
  -> admit each sector under the same profile/seed/generator revision
  -> clip sector contributions to exact cell ownership rules
  -> deduplicate cross-sector edge portals and roads
  -> sort all contributions deterministically
  -> compute one WorldCellContentDigest
```

## Ownership rules

### Terrain

Terrain height must remain world-coordinate deterministic. Sector descriptors may modulate biome or density, but adjacent cell edges must sample identical world positions and accepted policy revisions.

### Roads

- Finite-course roads retain priority inside their authored corridor.
- Atlas roads must connect through paired sector-edge portals.
- A road segment is owned by the gameplay cell containing its midpoint, with overlap copies available only for terrain flattening.
- Portal pairing and route identity must be deterministic from seed and neighboring sector coordinates.

### Settlements

- Settlement identity comes from the macro sector.
- Geometry and interaction objects are owned by cells through exact bounds/midpoint rules.
- Course depots and atlas settlements require deterministic exclusion or composition radii.

### Vegetation and obstacles

- Density may derive from sector biome/density metadata.
- Item identity must derive from world seed, sector, cell and local index.
- Roads, settlements and depots must contribute deterministic exclusion masks.

### Horizon

- Horizon representation must consume the accepted content digest or explicitly remain independent/proof-only.
- LOD transitions may alter representation, never semantic identity.

## Generation and cache identity

```txt
WorldCellGenerationKey = digest(
  product release,
  world profile revision,
  world seed,
  generator version,
  course package digest,
  overlapping sector digests,
  cell coordinates,
  content policy revisions,
  horizon level
)
```

Patch cache hits are valid only when this key matches exactly.

## Release and stale work

- Retiring a run or Core World registration retires its pending sector and cell work.
- A late sector result cannot populate a replacement run.
- Cell release must remove all course- and atlas-owned instance writes.
- Re-requesting a released cell may reuse only a matching immutable cached plan.

## Required fixtures

- Cell fully inside one sector.
- Cell overlapping two sectors on X.
- Cell overlapping two sectors on Z.
- Cell overlapping four sectors.
- Portal road crossing each sector edge.
- Finite-course road overlapping an atlas road.
- Settlement spanning multiple gameplay cells.
- Distant positive and negative coordinates.
- Release/re-request with matching cache key.
- Stale result after new run generation.

## Completion boundary

The infinite-world stream is not coherent until every active gameplay cell has one reproducible generation key and every visible semantic object can be traced to its course or atlas owner.
