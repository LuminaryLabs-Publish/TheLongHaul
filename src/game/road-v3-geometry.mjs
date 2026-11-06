// Long Haul V3 road prototype. Pure geometry: no world writes, rendering or legacy overrides.
import { hashText } from './shared.mjs';

export const ROAD_V3_VERSION = 'long-haul-endless-v3';
export const ROAD_V3_LIMITS = Object.freeze({
  width: 16, sampleCount: 320, maxGrade: 0.12, maxCurvature: 0.05,
  crossingClearance: 9, bridgeApproach: 35, terrainShoulder: 14
});
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const unit = (seed,key) => hashText(seed+':road-v3:'+key)/4294967295;

function crossing2D(a,b,c,d) {
  const rx=b.x-a.x, rz=b.z-a.z, sx=d.x-c.x, sz=d.z-c.z;
  const det=rx*sz-rz*sx;
  if(Math.abs(det)<1e-8)return null;
  const qx=c.x-a.x, qz=c.z-a.z;
  const t=(qx*sz-qz*sx)/det, u=(qx*rz-qz*rx)/det;
  if(t< -1e-7||t>1+1e-7||u< -1e-7||u>1+1e-7)return null;
  return {t:clamp(t,0,1),u:clamp(u,0,1),x:a.x+rx*t,z:a.z+rz*t};
}
const lerp=(a,b,t)=>a+(b-a)*t;
const planar=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
const pointOn=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:lerp(a.z,b.z,t),progress:lerp(a.progress,b.progress,t)});

export function roadV3Crossings(samples, clearance=ROAD_V3_LIMITS.crossingClearance) {
  const seen=new Set(), crossings=[];
  for(let i=1;i<samples.length;i++)for(let j=i+25;j<samples.length;j++){
    const q=crossing2D(samples[i-1],samples[i],samples[j-1],samples[j]);
    if(!q)continue;
    const p=pointOn(samples[i-1],samples[i],q.t);
    const later=pointOn(samples[j-1],samples[j],q.u);
    if(Math.abs(p.progress-later.progress)<80||p.progress<80||later.progress>samples.at(-1).progress-80)continue;
    const key=Math.round(q.x/3)+':'+Math.round(q.z/3);
    if(seen.has(key))continue;
    seen.add(key);
    const height=Math.abs(later.y-p.y);
    crossings.push({id:'v3:crossing:'+crossings.length,x:q.x,z:q.z,
      lowerProgress:Math.min(p.progress,later.progress),
      upperProgress:Math.max(p.progress,later.progress),
      clearance:height,kind:height>=clearance?'bridge':'blocked'});
  }
  return crossings;
}

function mountainSamples(seed,rise) {
  const radius=138+unit(seed,'radius')*18;
  const aspect=0.57+unit(seed,'aspect')*.10;
  const rotation=(unit(seed,'rotation')-.5)*1.3;
  const flip=unit(seed,'turn')<.5?-1:1;
  const ca=Math.cos(rotation),sa=Math.sin(rotation);
  const samples=[];
  for(let i=0;i<=ROAD_V3_LIMITS.sampleCount;i++){
    const t=-Math.PI/2+1.75*Math.PI*i/ROAD_V3_LIMITS.sampleCount;
    const a=flip*radius*Math.sin(t),b=radius*aspect*Math.sin(2*t);
    const x=a*ca-b*sa,z=a*sa+b*ca;
    const prev=samples[samples.length-1];
    const progress=prev?prev.progress+Math.hypot(x-prev.x,z-prev.z):0;
    samples.push({x,z,y:6+rise*i/ROAD_V3_LIMITS.sampleCount,progress});
  }
  for(let i=0;i<samples.length;i++){
    const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)];
    const dx=b.x-a.x,dz=b.z-a.z;
    const heading=Math.atan2(dx,dz),length=Math.hypot(dx,dz);
    const sample=samples[i];
    sample.heading=heading;sample.nx=dz/length;sample.nz=-dx/length;
    sample.width=ROAD_V3_LIMITS.width;
    sample.grade=(b.y-a.y)/length;
    sample.bank=0;sample.structure=null;
  }
  return samples;
}

export function generateRoadV3(seed,{rise=24,maxRise=56}={}) {
  if(typeof seed!=='string'||!seed)throw new TypeError('Road V3 requires a seed');
  if(!Number.isFinite(rise)||!Number.isFinite(maxRise)||rise<0||maxRise<rise)throw new RangeError('Invalid elevation budget');
  // Resolve a new overpass by elevating the uncommitted candidate, never an existing road.
  for(let elevation=rise;elevation<=maxRise;elevation+=8){
    const samples=mountainSamples(seed,elevation);
    const crossings=roadV3Crossings(samples);
    if(!crossings.length||crossings.some(c=>c.kind==='blocked'))continue;
    let safe=true;
    for(let i=1;i<samples.length;i++){
      if(Math.abs(samples[i].grade)>ROAD_V3_LIMITS.maxGrade){safe=false;break;}
      if(i>1){
        const a=samples[i-1].heading,b=samples[i].heading;
        const bend=Math.abs(Math.atan2(Math.sin(b-a),Math.cos(b-a)))/planar(samples[i-1],samples[i]);
        if(bend>ROAD_V3_LIMITS.maxCurvature){safe=false;break;}
      }
    }
    if(!safe)continue;
    for(const c of crossings)for(const s of samples)
      if(Math.abs(s.progress-c.upperProgress)<=ROAD_V3_LIMITS.bridgeApproach)s.structure='bridge';
    const edge={id:'v3:mountain:main',from:'v3:start',to:'v3:end',roadClass:'country-road',
      surface:'paved',width:ROAD_V3_LIMITS.width,route:'main',samples,length:samples.at(-1).progress};
    return {generatorVersion:ROAD_V3_VERSION,seed,revision:1,
      nodes:[{id:edge.from,...samples[0]},{id:edge.to,...samples.at(-1)}],
      edges:[edge],crossings,description:'seeded mountain loops and grade-separated crossing'};
  }
  throw new RangeError('No safe V3 road under elevation/curvature limits');
}

// Returns *all* overlapping road surfaces, never just the nearest X/Z surface.
export function roadV3SurfacesAt(graph,point,radius=16) {
  if(!graph?.edges||![point?.x,point?.z].every(Number.isFinite))return [];
  const hits=[];
  for(const edge of graph.edges)for(let i=1;i<edge.samples.length;i++){
    const a=edge.samples[i-1],b=edge.samples[i],dx=b.x-a.x,dz=b.z-a.z;
    const t=clamp(((point.x-a.x)*dx+(point.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
    const x=lerp(a.x,b.x,t),z=lerp(a.z,b.z,t),dist=Math.hypot(point.x-x,point.z-z);
    if(dist>radius)continue;
    hits.push({edgeId:edge.id,segmentIndex:i-1,x,z,y:lerp(a.y,b.y,t),distance:dist,
      progress:lerp(a.progress,b.progress,t),structure:a.structure==='bridge'||b.structure==='bridge'?'bridge':null});
  }
  hits.sort((a,b)=>(Number.isFinite(point.y)?Math.abs(a.y-point.y)-Math.abs(b.y-point.y):a.y-b.y)||a.distance-b.distance);
  const distinct=[];
  for(const hit of hits)if(!distinct.some(s=>Math.abs(s.progress-hit.progress)<12))distinct.push(hit);
  return distinct;
}

// Only a ground-level road modifies terrain. Bridge deck geometry remains independent.
export function roadV3TerrainHeight(naturalHeight,graph,point) {
  if(!Number.isFinite(naturalHeight))throw new TypeError('Invalid natural terrain height');
  const width=ROAD_V3_LIMITS.width/2, influence=width+ROAD_V3_LIMITS.terrainShoulder;
  const candidates=roadV3SurfacesAt(graph,point,influence).filter(s=>s.structure!=='bridge');
  if(!candidates.length)return naturalHeight;
  const closest=candidates.reduce((a,b)=>a.distance<b.distance?a:b);
  const t=clamp((closest.distance-width)/ROAD_V3_LIMITS.terrainShoulder,0,1);
  const blend=1-t*t*(3-2*t);
  return lerp(closest.y-.4,naturalHeight,blend);
}
