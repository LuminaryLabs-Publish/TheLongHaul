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
    p.laneFactor = 3; // Existing road ribbons and markings expect a finite lane profile.
    p.bank = 0;
  }
  return list;
}
function connector(a, b) {
  const d = distance(a, b), u = vector(a), v = vector(b);
  // Endpoint headings are immutable. Find the gentlest connector that honors
  // both instead of accepting near-cusps from an arbitrary Hermite tangent.
  const steps = Math.max(64, Math.ceil(d / 2));
  const candidates = [0.45, 0.60, 0.75, 0.90, 1.05, 1.20, 1.40, 1.65, 2.0, 2.4];
  let selected = null, bestCurvature = Infinity;
  for (const factor of candidates) {
    const points = hermiteConnector(a, b, Math.min(3200, d * factor), steps);
    const recalibrated = recalibrate(points);
    let curvature = 0, valid = true;
    for (let i = 2; i < recalibrated.length; i++) {
      const before = recalibrated[i - 1], now = recalibrated[i];
      const segmentLength = distance(before, now);
      if (segmentLength < 0.25 || Math.abs(now.grade) > ROAD_V3_LIMITS.maxGrade) { valid = false; break; }
      const headingChange = Math.atan2(Math.sin(now.heading - before.heading), Math.cos(now.heading - before.heading));
      curvature = Math.max(curvature, Math.abs(headingChange) / segmentLength);
    }
    if (valid && curvature < bestCurvature) { selected = points; bestCurvature = curvature; }
    if (valid && curvature <= ROAD_V3_LIMITS.maxCurvature * 0.9) return points;
  }
  if (bestCurvature > ROAD_V3_LIMITS.maxCurvature) throw new RangeError('No drivable connector within road curvature limits');
  return selected;
}
function hermiteConnector(a, b, tangent, steps) {
  const u = vector(a), v = vector(b), points = [];
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
function rotatedFeature(samples, crossings, offset, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const transform = p => ({ x:offset.x + p.x*cos - p.z*sin,
    z:offset.z + p.x*sin + p.z*cos });
  return {
    samples: recalibrate(samples.map(p=>({ ...p, ...transform(p), y:p.y + offset.y }))),
    crossings:crossings.map(c=>({ ...c, ...transform(c) }))
  };
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

const ROTATIONS = [0, Math.PI/12, -Math.PI/12, Math.PI/6, -Math.PI/6,
  Math.PI/4, -Math.PI/4, Math.PI/3, -Math.PI/3, Math.PI/2, -Math.PI/2, Math.PI];
const offsetAt = index => ({ x:240*Math.sin(index*.69), y:8*Math.sin(index*.42), z:-1450*index });
const shapeAt = (seed,index,angle) => {
  const source=generateRoadV3(`${seed}:mountain:${index}`);
  return rotatedFeature(source.edges[0].samples,source.crossings,offsetAt(index),angle);
};
function chooseRegion(seed, index, previous) {
  for (const angle of ROTATIONS) {
    const candidate=shapeAt(seed,index,angle);
    if (!previous) return {angle,shape:candidate,connectorPoints:null};
    try { return {angle,shape:candidate,connectorPoints:connector(previous,candidate.samples[0])}; }
    catch (error) { if (!(error instanceof RangeError)) throw error; }
  }
  throw new RangeError(`Cannot join V3 mountain ${index} safely`);
}
function approachPoints(entry) {
  const forward=vector(entry),start={...entry,x:entry.x-forward.x*380,z:entry.z-forward.z*380};
  return Array.from({length:77},(_,i)=>{
    const t=i/76;
    return {x:mix(start.x,entry.x,t),y:entry.y+(t*t*t-t*t)*(entry.grade??0)*380,
      z:mix(start.z,entry.z,t),structure:null};
  });
}
function materializeRegion(seed, record, previousRecord) {
  const {index,angle,startProgress,loopStartProgress,endProgress}=record;
  const shape=shapeAt(seed,index,angle),entry=shape.samples[0];
  const previous=previousRecord ? shapeAt(seed,index-1,previousRecord.angle).samples.at(-1) : null;
  const preceding=edge(index?`v3:link:${index-1}`:'v3:approach',
    previous?connector(previous,entry):approachPoints(entry),startProgress,
    index?'connector':'approach');
  const loop=edge(`v3:mountain:${index}`,shape.samples,loopStartProgress,'loop');
  if (Math.abs(preceding.endProgress-loop.startProgress)>1e-5 ||
      Math.abs(loop.endProgress-endProgress)>1e-5) throw new Error(`V3 region ${index} reconstruction mismatch`);
  const crossings=shape.crossings.map(c=>({...c,id:`v3:mountain:${index}:crossing:${c.id.split(':').at(-1)}`,
    lowerProgress:c.lowerProgress+loop.startProgress,upperProgress:c.upperProgress+loop.startProgress}));
  return {edges:[preceding,loop],crossings};
}
function appendRegion(seed,directory) {
  const index=directory.length,previousRecord=directory.at(-1);
  const previous=previousRecord ? shapeAt(seed,index-1,previousRecord.angle).samples.at(-1) : null;
  const selected=chooseRegion(seed,index,previous);
  const startProgress=previousRecord?.endProgress??0;
  const preceding=edge(index?`v3:link:${index-1}`:'v3:approach',
    selected.connectorPoints??approachPoints(selected.shape.samples[0]),startProgress,
    index?'connector':'approach');
  const loop=edge(`v3:mountain:${index}`,selected.shape.samples,preceding.endProgress,'loop');
  return {index,angle:selected.angle,startProgress,loopStartProgress:loop.startProgress,endProgress:loop.endProgress};
}
const nodesFrom=edges=>edges.flatMap(e=>[
  {id:e.from,x:e.samples[0].x,y:e.samples[0].y,z:e.samples[0].z,progress:e.startProgress},
  {id:e.to,x:e.samples.at(-1).x,y:e.samples.at(-1).y,z:e.samples.at(-1).z,progress:e.endProgress}
]);
function graphFromDirectory(seed,directory,{from=0,to=directory.length-1,revision=1}={}) {
  const edges=[],crossings=[];
  for (let index=from;index<=to;index++) {
    const region=materializeRegion(seed,directory[index],directory[index-1]);
    edges.push(...region.edges);crossings.push(...region.crossings);
  }
  return {schema:'long-haul.road-v3/1',generatorVersion:ROAD_V3_VERSION,seed,revision,
    edges,nodes:nodesFrom(edges),crossings,totalProgress:directory.at(-1)?.endProgress??0,
    description:'deterministic mountain routes with spatial crossings and connectors'};
}
function directoryFor(seed,mountains) {
  const directory=[];
  for(let i=0;i<mountains;i++)directory.push(appendRegion(seed,directory));
  return directory;
}

// Legacy candidate API: a complete bounded fixture, preserved for earlier V3 tests.
export function createRoadV3Journey(seed,{mountains=12}={}) {
  if(typeof seed!=='string'||!seed)throw new TypeError('V3 journey requires a seed');
  if(!Number.isInteger(mountains)||mountains<1||mountains>32)throw new RangeError('Mountain count out of bounds');
  const directory=directoryFor(seed,mountains);
  return {...graphFromDirectory(seed,directory),
    persistence:{seed,version:ROAD_V3_VERSION,layoutRevision:1,mountains}};
}

// Streaming V3 keeps only nearby road geometry in memory. The compact directory
// of immutable road decisions reconstructs any earlier mountain on return.
export function createRoadV3Stream(seed,{initialMountains=3,focusProgress=0}={}) {
  if(typeof seed!=='string'||!seed)throw new TypeError('V3 stream requires a seed');
  if(!Number.isInteger(initialMountains)||initialMountains<1||initialMountains>8)throw new RangeError('Invalid initial road window');
  return extendRoadV3Stream({seed,directory:[],revision:0},
    {addMountains:initialMountains,focusProgress});
}
export function extendRoadV3Stream(stream,{addMountains=1,focusProgress=0,behind=2,ahead=3}={}) {
  if(!stream||typeof stream.seed!=='string'||!Array.isArray(stream.directory))throw new TypeError('Invalid V3 stream');
  if(!Number.isInteger(addMountains)||addMountains<0||addMountains>8||
    !Number.isInteger(behind)||behind<0||behind>8||!Number.isInteger(ahead)||ahead<0||ahead>8||
    !Number.isFinite(focusProgress))throw new RangeError('Invalid V3 growth window');
  const directory=stream.directory.map(entry=>({...entry}));
  for(let i=0;i<addMountains;i++)directory.push(appendRegion(stream.seed,directory));
  if(!directory.length)throw new RangeError('Empty V3 stream');
  const center=directory.findIndex(entry=>focusProgress<=entry.endProgress) ;
  const activeCenter=center<0?directory.length-1:center;
  const from=Math.max(0,activeCenter-behind),to=Math.min(directory.length-1,activeCenter+ahead);
  const rebuilt=graphFromDirectory(stream.seed,directory,{from,to,revision:(stream.revision??0)+1});
  return {...rebuilt,directory,activeRegionRange:{from,to},
    persistence:{seed:stream.seed,version:ROAD_V3_VERSION,layoutRevision:2,mountains:directory.length}};
}
export function ensureRoadV3Ahead(stream,progress,{lead=2500}={}) {
  if(!Number.isFinite(progress)||!Number.isFinite(lead)||lead<0||lead>15000)throw new RangeError('Invalid V3 lookahead');
  const grow=stream.totalProgress-progress<lead?Math.min(3,Math.ceil((lead-(stream.totalProgress-progress))/1800)):0;
  const center=stream.directory.findIndex(entry=>progress<=entry.endProgress);
  const activeCenter=center<0?stream.directory.length-1:center;
  const desiredFrom=Math.max(0,activeCenter-2),desiredTo=Math.min(stream.directory.length-1,activeCenter+3);
  if(!grow&&stream.activeRegionRange?.from===desiredFrom&&stream.activeRegionRange?.to===desiredTo)return stream;
  return extendRoadV3Stream(stream,{addMountains:grow,focusProgress:progress});
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
    const continuity=Number.isFinite(hint)?Math.min(300,Math.abs(hit.progress-hint))*.07:0;
    return {...hit,score:hit.distance+vertical*2.5+continuity};
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
