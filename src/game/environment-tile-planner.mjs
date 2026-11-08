// Deterministic tile placement overlay: never changes road/topology/collisions.
import {hashText} from './shared.mjs';
import {roadChunkSample,ROAD_GENERATOR_VERSION} from './road-chunks.mjs';
import {ENV_TILE_METERS,ENV_CELL_METERS,ENV_TILE_VARIANTS,ENVIRONMENT_TILE_CATALOG,ENVIRONMENT_TILE_CATALOG_VERSION} from './environment-tile-catalog.mjs';
const posmod=(x,n)=>((x%n)+n)%n;
const u=(seed,k)=>hashText(`${seed}:env-v1:${k}`)/4294967295;
export const ENVIRONMENT_TILE_STREAMING = Object.freeze({length:200,existingCellSize:160,
  prefetchMargin:36,maxRoadsidePropsHigh:24,maxRoadsidePropsLow:9,
  lowRoadMarkings:2,highRoadMarkings:6,collisionWrites:0,visualOnly:true});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function environmentTileIdentity(seed,index){
  if(typeof seed!=='string'||!seed)throw new TypeError('Seed required');
  if(!Number.isSafeInteger(index))throw new TypeError('Tile index must be a safe integer');
  const district=Math.floor(index/100),within=posmod(index,100),regionalBlock=Math.floor(within/10),motifSlot=within%10;
  // Ten consecutive tiles share a regional palette; each 20km district uses
  // all 100 unique compositions exactly once. The deterministic shift makes
  // individual worlds distinct without order-dependent global RNG state.
  const biomeIndex=posmod(regionalBlock+Math.floor(u(seed,`district:${district}:biome`)*10),10);
  const motifIndex=posmod(motifSlot*3+regionalBlock+Math.floor(u(seed,`district:${district}:motif`)*10),10);
  const template=ENVIRONMENT_TILE_CATALOG[biomeIndex*10+motifIndex];
  const variantIndex=Math.min(3,Math.floor(u(seed,`variant:${index}`)*4));
  return Object.freeze({key:`${seed}:environment:${index}`,index,
    start:index*ENV_TILE_METERS,end:(index+1)*ENV_TILE_METERS, length:ENV_TILE_METERS,
    catalogId:template.id,template,variant:ENV_TILE_VARIANTS[variantIndex],
    generatorVersion:ENVIRONMENT_TILE_CATALOG_VERSION});
}
function worldPose(seed,s,lateral,yProvider,onRoad=false,roadPoint=null){
  const p=roadPoint?.(s)??roadChunkSample(seed,s);
  const x=p.x+p.nx*lateral,z=p.z+p.nz*lateral;
  const y=onRoad?p.y+p.bank*lateral+.03:(typeof yProvider==='function'?yProvider(x,z):p.y);
  return {x,y,z,heading:p.heading,roadWidth:p.width,roadKind:p.kind,
    roadChunkId:p.chunkId,lateral,progress:s};
}
const decorate=(kind,pose,id,scale,role='roadside',templateId=null,variantId=null)=>Object.freeze({id,kind,role,scale,templateId,catalogId:templateId,variantId,
  position:Object.freeze({x:pose.x,y:pose.y,z:pose.z}), heading:pose.heading,
  progress:pose.progress,roadKind:pose.roadKind,lateral:pose.lateral});
const mainTypes=['tree','rock','shelter','rock','pole','fence','culvert','barrier','depot','diner'];
const supports=['shrub','grass','tree','rock','fence','pole','shrub','rock','shrub','pole'];
const roadMarkTypes=['edge-studs','rumble','patch','guide-arrows','seam','road-studs','drain-hatch','patch','guide-arrows','rumble'];
const footprint={tree:5,shrub:3,grass:2,rock:7,shelter:8,pole:3,fence:3,culvert:8,barrier:3,depot:9,diner:9};
// Road paint only. No collision authority, road deck, obstacles, or payments.
export function planEnvironmentTile(seed,index,{terrainHeight:height,quality=true,roadSafety=null,roadPoint=null}={}){
  const identity=environmentTileIdentity(seed,index),t=identity.template,v=identity.variant;
  const objects=[],i0=identity.start,motifIndex=ENVIRONMENT_TILE_CATALOG.indexOf(t)%10;
  const primary=mainTypes[motifIndex],support=supports[motifIndex];
  const limit=Math.min(quality?ENVIRONMENT_TILE_STREAMING.maxRoadsidePropsHigh:ENVIRONMENT_TILE_STREAMING.maxRoadsidePropsLow,
    Math.floor((quality?20:7)*v.density));
  for(let j=0;j<limit;j++){
    const s=i0+13+(j+.5)*(173/limit)+(u(seed,`${index}:distance:${j}`)-.5)*Math.min(4,50/limit);
    const side=u(seed,`${index}:side:${j}`)<.5?-1:1;
    const prop=j%8===0?primary:j%5===0?support:j%3===0?'rock':t.region.primary==='cactus'?'cactus':t.region.primary==='reeds'?'reeds':t.region.primary==='grass'?'grass':t.region.primary==='crop'?'crop':t.region.primary==='willow'?'willow':t.region.primary==='juniper'?'juniper':t.region.primary==='fir'?'fir':t.region.primary==='maple'?'maple':t.region.primary==='oak'?'oak':'pine';
    const p=roadPoint?.(s)??roadChunkSample(seed,s);
    // All 3D roadside props stay outside the canonical road envelope and its
    // 8m operational shoulder; footprint is included in the clearance.
    const minLateral=Math.max(24,p.width*.5+8+(footprint[prop]??5));
    const lateral=side*(minLateral+u(seed,`${index}:shoulder:${j}`)*(quality?42:33));
    let pose=worldPose(seed,s,lateral,height,false,roadPoint);
    if(roadSafety){
      let accepted=false;
      for(let attempt=0;attempt<4;attempt++){
        if(roadSafety(pose.x,pose.z,(footprint[prop]??5)+7)){accepted=true;break;}
        pose=worldPose(seed,s,lateral+side*13*(attempt+1),height,false,roadPoint);
      }
      if(!accepted)continue;
    }
    if(![pose.x,pose.y,pose.z].every(Number.isFinite))throw Error('Nonfinite tile pose');
    const variation=(.85+u(seed,`${index}:scale:${j}`)*.45)*v.height;
    objects.push(decorate(prop,pose,`${identity.key}:prop:${j}`,variation,'roadside',t.id,v.id));
  }
  // A signature landmark is spatially unique per tile, not merely a recolour.
  if(v.landmark>0){
    const kind=primary,amount=v.landmark===2?2:1;
    for(let n=0;n<amount;n++){
      const s=i0+65+n*69;
      const side=n?1:-1;
      const p=roadPoint?.(s)??roadChunkSample(seed,s);
      const lat=side*Math.max(38,p.width*.5+18+(footprint[kind]??8));
      const pose=worldPose(seed,s,lat,height,false,roadPoint);
      if(!roadSafety||roadSafety(pose.x,pose.z,(footprint[kind]??8)+7))
        objects.push(decorate(kind,pose,`${identity.key}:landmark:${n}`,t.motif.landmarkScale*v.height*(n?0.84:1.2),'landmark',t.id,v.id));
    }
  }
  const marks=[];
  const markCount=quality?ENVIRONMENT_TILE_STREAMING.highRoadMarkings:ENVIRONMENT_TILE_STREAMING.lowRoadMarkings;
  for(let j=0;j<markCount;j++){
    const s=i0+16+(j+.5)*(166/markCount),p=roadChunkSample(seed,s);
    // Freight gates, physical road works, bridges, tunnel roofs, split/merge
    // and lane changes retain their existing authored gameplay/sign systems.
    if(!['straight','sweep','hill'].includes(p.kind))continue;
    const lateral=(j%2?1:-1)*Math.min(11,Math.max(6,p.width*.24));
    const pose=worldPose(seed,s,lateral,null,true,roadPoint);
    marks.push(decorate(roadMarkTypes[motifIndex],pose,`${identity.key}:paint:${j}`,
      (.8+u(seed,`${index}:paintScale:${j}`)*.45)*(1-v.wear*.22),'on-road-paint',t.id,v.id));
  }
  return Object.freeze({...identity,props:Object.freeze(objects),onRoad:Object.freeze(marks),
    scene:Object.freeze({biome:t.biome,motif:t.composition,wear:v.wear,groundTint:t.palette}),
    authoring:'portable-recipe; native project not yet exported'});
}
// Each invocation returns at most one 200m tile slice. The product host
// schedules successive steps through the *existing* budgeted decoration queue.
// No new World partition or worker is created.
export function* environmentCellPlanSteps(seed,bounds,{terrainHeight,quality=true,roadSafety=null,roadPoint=null,roadProgressBounds=null}={}){
  const b=bounds;
  if(!b||![b.minX,b.maxX,b.minZ,b.maxZ].every(Number.isFinite)||b.minX>=b.maxX||b.minZ>=b.maxZ)throw TypeError('Invalid existing cell bounds');
  const minS=roadProgressBounds?.min??-b.maxZ,maxS=roadProgressBounds?.max??-b.minZ;
  if(!Number.isFinite(minS)||!Number.isFinite(maxS)||minS>maxS||maxS-minS>3200)throw RangeError('Invalid bounded road tile progress');
  const a=Math.floor((minS-ENVIRONMENT_TILE_STREAMING.prefetchMargin)/ENV_TILE_METERS);
  const c=Math.floor((maxS+ENVIRONMENT_TILE_STREAMING.prefetchMargin)/ENV_TILE_METERS);
  const objects=[],tiles=[];
  for(let i=a;i<=c;i++){
    const tile=planEnvironmentTile(seed,i,{terrainHeight,quality,roadSafety,roadPoint});
    let owned=0;
    for(const obj of [...tile.props,...tile.onRoad]){
      if(obj.position.x>=b.minX&&obj.position.x<b.maxX&&obj.position.z>=b.minZ&&obj.position.z<b.maxZ){objects.push(obj);owned++;}
    }
    if(owned)tiles.push({catalogId:tile.catalogId,index:tile.index,variant:tile.variant.id,owned});
    yield Object.freeze({processedTile:i,owned,processedTiles:i-a+1});
  }
  return Object.freeze({id:`${seed}:${b.minX}:${b.minZ}:environment`,existingCellBounds:Object.freeze({...b}),
    tileLength:ENV_TILE_METERS,objects:Object.freeze(objects),tiles:Object.freeze(tiles),
    collisionWrites:0,roadGeometryWrites:0});
}
export function planEnvironmentCell(seed,bounds,options={}){
  const steps=environmentCellPlanSteps(seed,bounds,options);
  let next;do{next=steps.next();}while(!next.done);
  return next.value;
}
export function environmentCellCoordinates(x,z){return [Math.floor(x/ENV_CELL_METERS),Math.floor(z/ENV_CELL_METERS)];}
