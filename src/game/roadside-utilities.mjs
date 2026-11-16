// Road-aligned, deterministic utility corridor. The Road graph owns placement;
// high-fidelity authored environment assemblies own poles; presentation owns wind.
// This module never modifies World terrain, road geometry or gameplay state.
import {ROAD_V3_VERSION} from './road-v3-geometry.mjs';
import {ENVIRONMENT_TILE_CATALOG, ENV_TILE_VARIANTS} from './environment-tile-catalog.mjs';

export const UTILITY_SPACING=76;
export const UTILITY_SIDE=1;
export const UTILITY_SHOULDER=10.5;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const owns=(p,b)=>p.x>=b.minX&&p.x<b.maxX&&p.z>=b.minZ&&p.z<b.maxZ;
const expanded=(p,b,margin)=>p.x>=b.minX-margin&&p.x<b.maxX+margin&&p.z>=b.minZ-margin&&p.z<b.maxZ+margin;

function frameAt(edge,progress){
  const samples=edge.samples??[];
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    if(progress<a.progress-1e-6||progress>b.progress+1e-6)continue;
    const dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz;
    if(len2<.000001)continue;
    const t=clamp((progress-a.progress)/(b.progress-a.progress||1),0,1),heading=Math.atan2(dx,dz);
    return {x:a.x+dx*t,y:a.y+(b.y-a.y)*t,z:a.z+dz*t,
      width:(a.width??edge.width)+((b.width??edge.width)-(a.width??edge.width))*t,
      heading,nx:dz/Math.sqrt(len2),nz:-dx/Math.sqrt(len2)};
  }
  return null;
}
function trunkEdgeAt(course,progress){
  return (course?.edges??[]).find(e=>e.branchId==='trunk'&&e.type==='endless-highway'&&
    e.startProgress<=progress+1e-6&&e.endProgress>progress+1e-6&&e.samples?.length>1);
}
function clearance(course,position,safety){
  if(safety&&!safety(position.x,position.z,5))return false;
  for(const depot of course.depots??[])if(distance(depot,position)<29)return false;
  for(const sign of course.signs??[])if(distance(sign,position)<12)return false;
  for(const junction of course.roundabouts??[])if(junction.center&&distance(junction.center,position)<75)return false;
  return true;
}
export function utilityPoleAt(course,progress,{heightAt,roadSafety}={}){
  if(course?.generatorVersion!==ROAD_V3_VERSION||!Number.isFinite(progress)||progress<0)return null;
  const edge=trunkEdgeAt(course,progress),frame=edge&&frameAt(edge,progress);
  if(!frame||!Number.isFinite(frame.width)||frame.width<=0)return null;
  const lateral=UTILITY_SIDE*(frame.width*.5+UTILITY_SHOULDER);
  const position={x:frame.x+frame.nx*lateral,z:frame.z+frame.nz*lateral};
  position.y=typeof heightAt==='function'?heightAt(position.x,position.z):frame.y;
  if(!Number.isFinite(position.y)||!clearance(course,position,roadSafety))return null;
  return {id:`${course.seed}:utility:${Math.round(progress/UTILITY_SPACING)}`,kind:'pole',role:'roadside',
    catalogId:ENVIRONMENT_TILE_CATALOG[0].id,templateId:ENVIRONMENT_TILE_CATALOG[0].id,
    variantId:ENV_TILE_VARIANTS[0].id,scale:1,heading:frame.heading,
    progress,position,roadEdgeId:edge.id};
}

// Cell ownership is spatial, not based on streamed edge IDs. The midpoint owns
// the wire and each pole is owned by its own cell, preventing duplicate cables.
export function planRoadsideUtilitiesForCell(course,bounds,options={}){
  if(course?.generatorVersion!==ROAD_V3_VERSION||!bounds||
     ![bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ].every(Number.isFinite))
    return {poles:[],spans:[],nearbyPoles:[]};
  const candidates=new Map(),pad=UTILITY_SPACING+UTILITY_SHOULDER+30;
  for(const edge of course.edges??[]){
    if(edge.branchId!=='trunk'||edge.type!=='endless-highway'||!edge.samples?.length)continue;
    const bbox={minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity};
    for(const p of edge.samples){bbox.minX=Math.min(bbox.minX,p.x);bbox.maxX=Math.max(bbox.maxX,p.x);bbox.minZ=Math.min(bbox.minZ,p.z);bbox.maxZ=Math.max(bbox.maxZ,p.z);}
    if(bbox.maxX<bounds.minX-pad||bbox.minX>bounds.maxX+pad||bbox.maxZ<bounds.minZ-pad||bbox.minZ>bounds.maxZ+pad)continue;
    const first=Math.max(0,Math.ceil((edge.startProgress-1e-6)/UTILITY_SPACING));
    const last=Math.floor((edge.endProgress-1e-6)/UTILITY_SPACING);
    for(let k=first;k<=last;k++){
      if(candidates.has(k))continue;
      const pole=utilityPoleAt(course,k*UTILITY_SPACING,options);
      if(pole&&expanded(pole.position,bounds,pad))candidates.set(k,pole);
    }
  }
  const poles=[],spans=[];
  for(const [index,pole] of candidates){
    if(owns(pole.position,bounds))poles.push(pole);
    const next=candidates.get(index+1);
    if(!next)continue;
    if(distance(pole.position,next.position)>UTILITY_SPACING*1.65)continue;
    const midpoint={x:(pole.position.x+next.position.x)/2,z:(pole.position.z+next.position.z)/2};
    if(owns(midpoint,bounds))spans.push({id:`${pole.id}:span`,from:pole,to:next});
  }
  poles.sort((a,b)=>a.progress-b.progress);spans.sort((a,b)=>a.from.progress-b.from.progress);
  return {poles,spans,nearbyPoles:[...candidates.values()]};
}

export function utilityCableVertices(spans,milliseconds=0,{segments=10,wind=.16}={}){
  const values=[];
  if(!Number.isFinite(milliseconds))milliseconds=0;
  const time=milliseconds/1000;
  for(const span of spans??[]){
    const a=span.from,b=span.to,len=distance(a.position,b.position);
    if(len<1||len>UTILITY_SPACING*1.65)continue;
    const sag=Math.min(1.45,.35+len*.008);
    for(const offset of [-2,0,2]){
      const endpoint=(pole,t)=>({x:pole.position.x+Math.cos(pole.heading)*offset,
        y:pole.position.y+9.27,z:pole.position.z-Math.sin(pole.heading)*offset});
      const from=endpoint(a),to=endpoint(b);
      const point=t=>{
        const fade=Math.sin(Math.PI*t),phase=time*.9+(a.progress/UTILITY_SPACING)*.7+offset*.8+t*2.5;
        const sw=fade*wind*Math.sin(phase);
        const tangentX=(to.x-from.x)/len,tangentZ=(to.z-from.z)/len;
        return [from.x+(to.x-from.x)*t-tangentZ*sw,
          from.y+(to.y-from.y)*t-4*sag*t*(1-t)+fade*wind*.3*Math.cos(phase),
          from.z+(to.z-from.z)*t+tangentX*sw];
      };
      for(let i=0;i<segments;i++)values.push(...point(i/segments),...point((i+1)/segments));
    }
  }
  return new Float32Array(values);
}
