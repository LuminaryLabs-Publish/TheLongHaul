// Product-owned visual tile registry. Native n:authoring is the editable asset
// authority; this portable catalogue is a deterministic runtime contract.
import {WORLD_PROFILE,sceneForBiome} from './scene-profiles.mjs';
const tilePolicy=WORLD_PROFILE.environmentTiles;
export const ENV_TILE_METERS=tilePolicy.tileMeters;
export const ENV_CELL_METERS=tilePolicy.cellMeters;
export const ENV_TILE_VARIANTS=tilePolicy.variants;
export const ENV_TILE_BIOMES=tilePolicy.biomes;
export const ENV_TILE_COMPOSITIONS=tilePolicy.compositions;
export const ENVIRONMENT_TILE_CATALOG = Object.freeze(ENV_TILE_BIOMES.flatMap((region,bi)=>
 ENV_TILE_COMPOSITIONS.map((motif,mi)=>Object.freeze({
   id:`LH-ENV-${String(bi*10+mi+1).padStart(3,'0')}`,
   name:`${region.name} · ${motif.name}`,
   biome:region.id, composition:motif.id, length:ENV_TILE_METERS,
   authoring:{domain:'n:authoring',sourceOwners:['n:authoring:project','n:authoring:mesh','n:authoring:material','n:authoring:assembly','n:authoring:art'],status:'source-recipe-candidate'},
   variants:Object.freeze(ENV_TILE_VARIANTS.map(v=>v.id)),
   palette:region.tint, region, motif, sceneProfile:sceneForBiome(region.id).id,
   guaranteedRoadClearance:24,
   collisionAuthority:'road-and-encounter-kits-unchanged',
   onRoad:'visual-decal-only',
   roadwayTopography:'canonical-road-only'
 }))));
export const ENVIRONMENT_TILE_BY_ID = new Map(ENVIRONMENT_TILE_CATALOG.map(t=>[t.id,t]));
export const ENVIRONMENT_TILE_CATALOG_VERSION=tilePolicy.version;
