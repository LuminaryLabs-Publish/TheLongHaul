// Product-owned visual tile registry. Native n:authoring is the editable asset
// authority; this portable catalogue is a deterministic runtime contract.
export const ENV_TILE_METERS = 200;
export const ENV_CELL_METERS = 160; // existing world-streaming partition: DO NOT CHANGE
export const ENV_TILE_VARIANTS = Object.freeze([
  Object.freeze({id:'open', label:'Open view', density:0.68, height:0.92, landmark:0, wear:0.05}),
  Object.freeze({id:'lush', label:'Layered growth', density:1.25, height:1.15, landmark:1, wear:0.02}),
  Object.freeze({id:'signature', label:'Signature landmark', density:0.94, height:1.24, landmark:2, wear:0.05}),
  Object.freeze({id:'weathered', label:'Weathered route', density:0.84, height:0.98, landmark:1, wear:0.8})
]);
const biome = (id,name,primary,secondary,rock,structure,ground,tint)=>Object.freeze({id,name,primary,secondary,rock,structure,ground,tint});
export const ENV_TILE_BIOMES = Object.freeze([
 biome('new-england','New England forest','maple','pine','granite','cedar','woods',0x668752),
 biome('high-pines','Northern pinewoods','pine','fir','granite','timber','woods',0x547563),
 biome('alpine','Alpine passes','fir','pine','boulder','stone','mountain',0x6b8a8e),
 biome('golden-hills','Golden foothills','oak','grass','sandstone','timber','grassland',0xa19a5e),
 biome('farmland','Agricultural plains','oak','crop','sandstone','farm','grassland',0x8d9b50),
 biome('badlands','Red-rock badlands','cactus','scrub','redstone','rust','desert',0xc78361),
 biome('high-desert','High desert','juniper','cactus','sandstone','rust','desert',0xa89b71),
 biome('canyon','Canyon country','juniper','scrub','redstone','stone','desert',0xb98565),
 biome('coastal','Coastal highway','pine','grass','limestone','marine','coastal',0x648b91),
 biome('wetlands','River and wetlands','willow','reeds','riverstone','timber','wetland',0x698a74)
]);
const composition = (id,name,landmark,roadMark,roadside,landmarkScale)=>Object.freeze({id,name,landmark,roadMark,roadside,landmarkScale});
export const ENV_TILE_COMPOSITIONS = Object.freeze([
 composition('ridge','Layered roadside ridges','rock-wall','edge-studs','rock',1.05),
 composition('grove','Dense vegetation corridor','old-tree','rumble','tree',1.04),
 composition('wayside','Wayside rest and service','rest-shelter','patch','shelter',1.12),
 composition('lookout','Vista pullout and overlook','view-gantry','guide-arrows','rock',1.14),
 composition('utility','Utilities and maintenance','power-pole','seam','pole',1.1),
 composition('fence','Fenced roadside frontage','farm-shed','road-studs','fence',1.08),
 composition('water','Drainage and water crossing','drainage-arch','drain-hatch','boulder',1.07),
 composition('works','Road works and repair','maintenance-gantry','patch','barrier',1.12),
 composition('freight','Freight access corridor','freight-yard','guide-arrows','depot',1.15),
 composition('settlement','Approach to a rural settlement','roadside-diner','rumble','building',1.10)
]);
export const ENVIRONMENT_TILE_CATALOG = Object.freeze(ENV_TILE_BIOMES.flatMap((region,bi)=>
 ENV_TILE_COMPOSITIONS.map((motif,mi)=>Object.freeze({
   id:`LH-ENV-${String(bi*10+mi+1).padStart(3,'0')}`,
   name:`${region.name} · ${motif.name}`,
   biome:region.id, composition:motif.id, length:ENV_TILE_METERS,
   authoring:{domain:'n:authoring',sourceOwners:['n:authoring:project','n:authoring:mesh','n:authoring:material','n:authoring:assembly','n:authoring:art'],status:'source-recipe-candidate'},
   variants:Object.freeze(ENV_TILE_VARIANTS.map(v=>v.id)),
   palette:region.tint, region, motif,
   guaranteedRoadClearance:24,
   collisionAuthority:'road-and-encounter-kits-unchanged',
   onRoad:'visual-decal-only',
   roadwayTopography:'canonical-road-only'
 }))));
export const ENVIRONMENT_TILE_BY_ID = new Map(ENVIRONMENT_TILE_CATALOG.map(t=>[t.id,t]));
export const ENVIRONMENT_TILE_CATALOG_VERSION='long-haul-env-tiles-v1';
