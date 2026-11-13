// Game-owned JSON scene profile contract. Portable data; no competing Nexus Kit,
// renderer, loader, input handler or save authority is introduced here.
import game from '../../game/game.json' with {type:'json'};
import world from '../../game/profiles/world.json' with {type:'json'};
import presentation from '../../game/profiles/presentation.json' with {type:'json'};
import vegetation from '../../game/profiles/vegetation.json' with {type:'json'};
import roads from '../../game/profiles/roads.json' with {type:'json'};
import gameplay from '../../game/profiles/gameplay.json' with {type:'json'};
import assets from '../../game/assets/manifest.json' with {type:'json'};
import forest from '../../game/scenes/forest.json' with {type:'json'};
import countryside from '../../game/scenes/countryside.json' with {type:'json'};
import smallTown from '../../game/scenes/small-town.json' with {type:'json'};
import city from '../../game/scenes/city.json' with {type:'json'};
import industrial from '../../game/scenes/industrial.json' with {type:'json'};

const validText=value=>typeof value==='string'&&value.length>0&&value.length<=256;
const finiteNumber=value=>typeof value==='number'&&Number.isFinite(value);
export const SCENE_PROFILE_IDS=Object.freeze(['countryside','forest','small-town','city','industrial']);
const scenes=Object.freeze({countryside,forest,'small-town':smallTown,city,industrial});

// Ref validation is performed before exposing mutable-looking data to a game.
// This checks profile identity, stable save contracts, references, and numeric
// safety. It cannot prove visual quality, physics or browser gameplay by itself.
export function validateSceneProfileCatalog({gameProfile=game,worldProfile=world,presentationProfile=presentation,
  vegetationProfile=vegetation,roadsProfile=roads,gameplayProfile=gameplay,assetManifest=assets,sceneProfiles=scenes}={}){
  const errors=[];
  const require=(condition,message)=>{if(!condition)errors.push(message);};
  require(gameProfile?.schema==='long-haul.game/1','Invalid game schema');
  require(gameProfile?.id==='the-long-haul','Game identity changed');
  for(const [kind,profile] of Object.entries({world:worldProfile,presentation:presentationProfile,
    vegetation:vegetationProfile,roads:roadsProfile,gameplay:gameplayProfile})){
    require(profile?.schema==='long-haul.profile/1',`${kind}: schema`);
    require(validText(profile?.id),`${kind}: id`);
    require(gameProfile?.profileRefs?.[kind]===`profiles/${kind}.json`,`${kind}: reference`);
  }
  require(assetManifest?.schema==='long-haul.assets/1','Asset manifest schema');
  require(gameProfile?.assetManifest==='assets/manifest.json','Asset manifest reference');
  require(Array.isArray(gameProfile?.modes)&&gameProfile.modes.includes('endless')&&gameProfile.modes.includes('campaign'),'Game modes');
  require(new Set(gameProfile?.gameplaySystems??[]).size===(gameProfile?.gameplaySystems??[]).length,'Duplicate gameplay systems');
  const biomeIds=new Set((worldProfile?.environmentTiles?.biomes??[]).map(x=>x.id));
  for(const id of SCENE_PROFILE_IDS){
    const scene=sceneProfiles?.[id];
    require(scene?.schema==='long-haul.scene/1'&&scene.id===id,`${id}: scene identity`);
    require(gameProfile?.sceneRefs?.includes(`scenes/${id}.json`),`${id}: reference`);
    require(scene?.presentation?.profile===presentationProfile?.id,`${id}: presentation`);
    require(Array.isArray(scene?.biomes)&&scene.biomes.every(x=>biomeIds.has(x)),`${id}: biomes`);
    require(Array.isArray(scene?.assetCollections)&&scene.assetCollections.every(x=>Object.hasOwn(assetManifest?.collections??{},x)),`${id}: assets`);
    if(scene?.kind==='settlement')require(scene.reconnectTo==='main-highway'&&scene.entrances===2&&scene.exits===2,`${id}: route connectivity`);
  }
  const species=vegetationProfile?.species??[];
  require(species.length===3&&new Set(species.map(s=>s.id)).size===3,'Three original tree species required');
  for(const tree of species){
    require(validText(tree.id)&&finiteNumber(tree.height)&&tree.height>0,`${tree.id}: tree shape`);
    require(Array.isArray(tree.files)&&tree.files.length===3&&tree.files.every(x=>x.endsWith('.glb')&&!x.includes('..')),`${tree.id}: LOD assets`);
  }
  const buildingIds=roadsProfile?.town?.assetIds??[];
  require(buildingIds.length===17&&new Set(buildingIds).size===17,'17 authored neighborhood buildings required');
  const knownFiles=new Set(Object.values(assetManifest?.collections??{}).flat()
    .filter(path=>typeof path==='string'&&path.startsWith('assets/settlements/'))
    .map(path=>path.split('/').at(-1).replace(/\.glb$/,'')));
  require(buildingIds.every(id=>knownFiles.has(id)),'Authored town assets missing from canonical manifest');
  const zoningIds=Object.values(roadsProfile?.town?.zones??{}).flat();
  require(zoningIds.every(id=>buildingIds.includes(id)),'Unknown town zoning asset');

  const count=(gameplayProfile?.cargo??[]).length;
  require(count===5&&new Set(gameplayProfile?.cargo?.map(x=>x.id)).size===5,'Five freight cargo identities');
  for(const cargo of gameplayProfile?.cargo??[])require(finiteNumber(cargo.massKg)&&cargo.massKg>0,`${cargo.id}: cargo mass`);
  for(const id of ['mini-trucks','road-shield','shockwave'])require(gameplayProfile?.abilities?.[id]?.id===id,`${id}: ability identity`);
  require(gameplayProfile?.boost?.duration===5&&gameplayProfile?.boost?.recharge===3&&gameplayProfile?.boost?.doubleTapMs===300,'Boost mechanics freeze point');
  require(roadsProfile?.town?.layoutVersion==='long-haul:connected-settlements/2','Town layout version must remain save-compatible');
  require(worldProfile?.environmentTiles?.cellMeters===160,'Nexus World 160m cell geometry changed');
  require(roadsProfile?.town?.firstSection===8&&roadsProfile?.town?.sectionStride===12,'Existing town identities changed');
  require(Array.isArray(presentationProfile?.toonStyle?.levels)&&presentationProfile.toonStyle.levels.length===4,'Four-band presentation contract');
  return {ok:errors.length===0,errors};
}
const result=validateSceneProfileCatalog();
if(!result.ok)throw Error('Long Haul scene profile contract invalid: '+result.errors.join('; '));
const deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);
}return value;};
export const GAME_PROFILE=deepFreeze(game);
export const WORLD_PROFILE=deepFreeze(world);
export const PRESENTATION_PROFILE=deepFreeze(presentation);
export const VEGETATION_PROFILE=deepFreeze(vegetation);
export const ROADS_PROFILE=deepFreeze(roads);
export const GAMEPLAY_PROFILE=deepFreeze(gameplay);
export const ASSET_MANIFEST=deepFreeze(assets);
export const SCENE_PROFILES=deepFreeze(scenes);
export function sceneProfile(id){return SCENE_PROFILES[String(id)]??null;}
export function sceneForBiome(biome){
  return SCENE_PROFILE_IDS.filter(id=>SCENE_PROFILES[id].kind==='region')
    .map(id=>SCENE_PROFILES[id]).find(scene=>scene.biomes.includes(biome))??SCENE_PROFILES.countryside;
}
