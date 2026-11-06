// Deterministic V3 mountain route preparation. No gameplay or rendering authority.
// Road positions are spatial, not inferred from -z. The output is a candidate graph.
import { generateRoadV3, ROAD_V3_VERSION, ROAD_V3_LIMITS } from './road-v3-geometry.mjs';
import { candidateRoadSegments, roadSegmentsNear } from './road-spatial-index.mjs';
import { environmentTileIdentity } from './environment-tile-planner.mjs';
import { ENV_TILE_VARIANTS } from './environment-tile-catalog.mjs';
import { CELL_SIZE } from './shared.mjs';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const copy = p => ({ ...p });
const distance = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);
const vector = p => ({ x: Math.sin(p.heading), z: Math.cos(p.heading) });

function recalibrate(points, previousProgress = 0) {
  const list = points.map(copy);
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    p.progress = i ? list[i - 1].progress + distance(list[i - 1], p) : previousProgress;
    const prev = list[Math.max(0, i - 1)], next = list[Math.min(list.length - 1, i + 1)];
    const dx = next.x - prev.x, dz = next.z - prev.z, len = Math.hypot(dx, dz) || 1;
    p.heading = Math.atan2(dx, dz);
    p.nx = dz / len; p.nz = -dx / len;
    p.grade = (next.y - prev.y) / len;
    p.width = ROAD_V3_LIMITS.width;
    p.bank = 0;
  }
  return list;
}
function connector(a, b) {
  const d = distance(a, b), u = vector(a), v = vector(b);
  const tangent = Math.min(240, d * .23), steps = Math.max(32, Math.ceil(d / 3)), points = [];
  // Hermite endpoints share the preceding and following road tangents.
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, t2 = t * t, t3 = t2 * t;
    const h00 = 2*t3-3*t2+1, h10=t3-2*t2+t, h01=-2*t3+3*t2, h11=t3-t2;
    points.push({ x:h00*a.x+h10*u.x*tangent+h01*b.x+h11*v.x*tangent,
      y:h00*a.y+h10*(a.grade??0)*tangent+h01*b.y+h11*(b.grade??0)*tangent,
      z:h00*a.z+h10*u.z*tangent+h01*b.z+h11*v.z*tangent,
      structure:null });
  }
  return points;
}
function edge(id,points,start,kind) {
  const samples = recalibrate(points,start);
  return { id, from:id+':start',to:id+':end', type:'endless-highway',kind,
    branchId:'trunk',branchName:kind==='loop'?'Mountain switchbacks':'Mountain connection',
    surface:'paved',roadClass:'country-road',width:ROAD_V3_LIMITS.width,
    laneCount:2,laneWidth:3.4,roughness:0.04,optional:false,endless:true,modular:true,
    generatorVersion:ROAD_V3_VERSION,samples,
    startProgress:samples[0].progress,endProgress:samples.at(-1).progress,
    length:samples.at(-1).progress-samples[0].progress };
}

export function createRoadV3Journey(seed,{mountains=12}={}) {
  if(typeof seed!=='string'||!seed)throw new TypeError('V3 journey requires a seed');
  if(!Number.isInteger(mountains)||mountains<1||mountains>32)throw new RangeError('Mountain count out of bounds');
  const edges=[],crossings=[];
  let progress=0;
  const add=(id,points,kind)=>{
    const e=edge(id,points,progress,kind);edges.push(e);progress=e.endProgress;return e;
  };
  for(let index=0;index<mountains;index++) {
    const feature=generateRoadV3(`${seed}:mountain:${index}`);
    const offset={ x:240*Math.sin(index*0.69),y:8*Math.sin(index*0.42),z:-1450*index };
    const samples=feature.edges[0].samples.map(p=>({ ...p,x:p.x+offset.x,y:p.y+offset.y,z:p.z+offset.z }));
    const entry=samples[0];
    if(!edges.length){
      const forward=vector(entry),p={...entry,x:entry.x-forward.x*380,z:entry.z-forward.z*380};
      const approach=Array.from({length:77},(_,i)=>{const t=i/76;return {x:mix(p.x,entry.x,t),y:entry.y+(t*t*t-t*t)*(entry.grade??0)*380,z:mix(p.z,entry.z,t),structure:null};});
      add('v3:approach',approach,'approach');
    } else {
      const old=edges.at(-1).samples.at(-1);
      add(`v3:link:${index-1}`,connector(old,entry),'connector');
    }
    const loop=add(`v3:mountain:${index}`,samples,'loop');
    crossings.push(...feature.crossings.map(c=>({ ...c,id:`v3:mountain:${index}:crossing:${c.id.split(':').at(-1)}`,
      x:c.x+offset.x,z:c.z+offset.z,lowerProgress:c.lowerProgress+loop.startProgress,
      upperProgress:c.upperProgress+loop.startProgress })));
  }
  const nodes=edges.flatMap(e=>[
    {id:e.from,x:e.samples[0].x,y:e.samples[0].y,z:e.samples[0].z,progress:e.startProgress},
    {id:e.to,x:e.samples.at(-1).x,y:e.samples.at(-1).y,z:e.samples.at(-1).z,progress:e.endProgress}
  ]);
  return {schema:'long-haul.road-v3/1',generatorVersion:ROAD_V3_VERSION,
    seed,revision:1,edges,nodes,crossings,totalProgress:progress,
    // Terrain/streaming are separate consumers, not mixed with topology.
    persistence:{seed,version:ROAD_V3_VERSION,layoutRevision:1,mountains},
    description:'deterministic mountains with spatial return crossings and connectors'};
}

export function roadV3PointAt(graph,progress,lateral=0) {
  if(!graph?.edges?.length||!Number.isFinite(progress)||!Number.isFinite(graph.totalProgress))return null;
  const s=clamp(progress,0,graph.totalProgress);
  const edge=graph.edges.find(e=>s<=e.endProgress+1e-6)??graph.edges.at(-1);
  const list=edge.samples;
  let lo=0,hi=list.length-1;
  while(lo+1<hi){const mid=(lo+hi)>>1;if(list[mid].progress<s)lo=mid;else hi=mid;}
  const a=list[lo],b=list[Math.min(lo+1,list.length-1)],t=clamp((s-a.progress)/(b.progress-a.progress||1),0,1);
  const heading=Math.atan2(Math.sin(a.heading)*(1-t)+Math.sin(b.heading)*t,Math.cos(a.heading)*(1-t)+Math.cos(b.heading)*t);
  const normal={x:Math.cos(heading),z:-Math.sin(heading)};
  return {x:mix(a.x,b.x,t)+normal.x*lateral,y:mix(a.y,b.y,t),z:mix(a.z,b.z,t)+normal.z*lateral,
    heading,nx:normal.x,nz:normal.z,progress:s,grade:mix(a.grade,b.grade,t),bank:0,width:edge.width,
    structure:a.structure==='bridge'||b.structure==='bridge'?'bridge':null,edgeId:edge.id};
}

export function roadV3Project(graph,position,{hint=null,radius=65}={}) {
  if(!graph?.edges?.length||![position?.x,position?.z].every(Number.isFinite))return null;
  const hits=[];
  for(const {a,b,edge,segmentIndex} of candidateRoadSegments(graph,position)) {
    const dx=b.x-a.x,dz=b.z-a.z;
    const t=clamp(((position.x-a.x)*dx+(position.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);
    const x=mix(a.x,b.x,t),z=mix(a.z,b.z,t),horizontal=Math.hypot(position.x-x,position.z-z);
    if(horizontal>radius)continue;
    hits.push({edgeId:edge.id,segmentIndex,x,z,y:mix(a.y,b.y,t),distance:horizontal,
      progress:mix(a.progress,b.progress,t),structure:a.structure==='bridge'||b.structure==='bridge'?'bridge':null});
  }
  if(!hits.length)return null;
  // Both elevation and the last accepted road progress break X/Z crossing ties.
  // Do not prefer another deck merely because its X/Z distance is smaller.
  const scored=hits.map(hit=>{
    const vertical=Number.isFinite(position.y)?Math.abs(hit.y-position.y):0;
    const continuity=Number.isFinite(hint)?Math.min(300,Math.abs(hit.progress-hint))*.10:0;
    return {...hit,score:hit.distance+vertical*1.8+continuity};
  }).sort((a,b)=>a.score-b.score);
  return scored[0];
}

export function roadV3WorldStreaming(graph,position,{cellSize=CELL_SIZE,radius=1,visualRadius=4}={}) {
  if(!graph?.edges||![position?.x,position?.z].every(Number.isFinite))throw new TypeError('V3 streaming requires world position');
  if(!Number.isInteger(radius)||radius<0||!Number.isInteger(visualRadius)||visualRadius<radius||visualRadius>8)throw new RangeError('Invalid V3 streaming radius');
  const cx=Math.floor(position.x/cellSize),cz=Math.floor(position.z/cellSize),active=[],visual=[];
  for(let dz=-visualRadius;dz<=visualRadius;dz++)for(let dx=-visualRadius;dx<=visualRadius;dx++){
    const id=`${cx+dx}:${cz+dz}`;
    if(Math.abs(dx)<=radius&&Math.abs(dz)<=radius)active.push(id);
    else visual.push(id);
  }
  const bounds={minX:(cx-visualRadius)*cellSize,minZ:(cz-visualRadius)*cellSize,
    maxX:(cx+visualRadius+1)*cellSize,maxZ:(cz+visualRadius+1)*cellSize};
  const visibleEdges=[...new Set(roadSegmentsNear(graph,bounds).map(segment=>segment.edge.id))].sort();
  return {cellSize,center:`${cx}:${cz}`,active,visual,visibleEdges};
}

// A repeatable selector for the existing 100-authored GLB library. This does not
// download or imply that any external Google Drive file is in the build.
export function roadV3SceneryDescriptor(graph,progress) {
  if(!graph?.seed||!Number.isFinite(progress))return null;
  const tileIndex=Math.floor(Math.max(0,progress)/200);
  const identity=environmentTileIdentity(graph.seed,tileIndex);
  const variantIndex=ENV_TILE_VARIANTS.findIndex(v=>v.id===identity.variant.id);
  return {tileIndex,templateId:identity.template.id,biome:identity.template.biome,
    composition:identity.template.composition,variant:identity.variant.id,sceneIndex:variantIndex,
    file:`${identity.template.id}__${identity.template.biome}__${identity.template.composition}__v01.glb`,
    binding:'candidate; physical GLB deployment and loader pending'};
}
