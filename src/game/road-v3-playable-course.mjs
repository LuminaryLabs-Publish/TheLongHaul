// Playable V3 course adapter: reuse the established V2 highway *topology* and
// its freight/route-choice semantics, then construct all of that geometry on
// the independently seeded V3 terrain alignment. No second world manager.
// The legacy V2 course is a temporary recipe, never installed in the game.
import { createEndlessHighway, endlessHighwayPoint } from './endless-highway.mjs';
import { ROAD_GENERATOR_VERSION } from './road-chunks.mjs';
import { ROAD_V3_VERSION } from './road-v3-geometry.mjs';
import { createTerrainRoadV3Sampler, classifyTerrainRoadV3Structure } from './road-v3-terrain-route.mjs';
import { roadV3Project, roadV3PointAt } from './road-v3-journey.mjs';
import { edgeLength, hashText } from './shared.mjs';

const contexts=new WeakMap();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const v2Course=seed=>({seed,generatorVersion:ROAD_GENERATOR_VERSION});
function align(context,progress){return context.sampler(progress)}
// Relative road geometry is mapped into the terrain frame. This preserves
// existing side branches, freight approaches and lane widths without turning
// them into painted-only intersections. Nonlinear features remain genuine edges.
function translate(context,source,progress) {
  const {seed}=context;
  const original=endlessHighwayPoint(v2Course(seed),progress);
  const frame=align(context,progress),dx=source.x-original.x,dz=source.z-original.z;
  const nx=original.nx??Math.cos(original.heading),nz=original.nz??-Math.sin(original.heading);
  const tx=Math.sin(original.heading),tz=Math.cos(original.heading);
  const lateral=dx*nx+dz*nz,forward=dx*tx+dz*tz;
  const extraY=Number.isFinite(source.y)&&Number.isFinite(original.y)?clamp(source.y-original.y,-4,4):0;
  const point={x:frame.x+frame.nx*lateral+Math.sin(frame.heading)*forward,
    y:frame.y+frame.bank*lateral+extraY,
    z:frame.z+frame.nz*lateral+Math.cos(frame.heading)*forward,
    heading:frame.heading,nx:frame.nx,nz:frame.nz,
    width:source.width??frame.width,bank:frame.bank,grade:frame.grade,progress};
  return {...point,structure:classifyTerrainRoadV3Structure(seed,point,source.structure)};
}
function translateEdge(context,edge) {
  const samples=edge.samples.map((p,i)=>{
    const progress=Number.isFinite(p.progress)?p.progress:(edge.startProgress+
      (edge.endProgress-edge.startProgress)*i/(edge.samples.length-1));
    return {...p,...translate(context,p,progress),width:p.width??edge.width,
      laneFactor:p.laneFactor??3};
  });
  // Recalculate tangent and signed bank on the transformed visible geometry.
  for(let i=0;i<samples.length;i++){
    const a=samples[Math.max(0,i-1)],b=samples[Math.min(i+1,samples.length-1)],
      dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
    samples[i].heading=Math.atan2(dx,dz);
    samples[i].nx=dz/len;samples[i].nz=-dx/len;
    samples[i].grade=(b.y-a.y)/len;
  }
  return {...edge,generatorVersion:ROAD_V3_VERSION,samples,length:edgeLength({samples})};
}
function boundsFor(edges){
  const pts=edges.flatMap(e=>e.samples),xs=pts.map(p=>p.x),zs=pts.map(p=>p.z);
  return {minX:Math.min(...xs)-180,maxX:Math.max(...xs)+180,
    minZ:Math.min(...zs)-180,maxZ:Math.max(...zs)+180};
}
function translateStation(context,station){
  const map=(point,p)=>point?{...point,...translate(context,point,p)}:point;
  const progress=station.progress;
  return {...station,
    entry:map(station.entry,station.entryProgress),exit:map(station.exit,station.exitProgress),
    safe:{...station.safe,point:map(station.safe.point,progress)},
    risky:{...station.risky,point:map(station.risky.point,progress)}};
}
function translateOther(context,item,progress){return {...item,...translate(context,item,progress)}}
// A real side-road roundabout with an enterable 360-degree ring and two
// physical trunk connectors. The established V2 trunk stays uninterrupted.
// The ring is divided at its separate entry and exit nodes so no endpoint
// is merely a painted crossing or a decorative circle.
function roundaboutAt(seed,index,context) {
  const start=index*320,end=start+320,mid=start+160;
  const base=align(context,mid),entry=align(context,start),exit=align(context,end);
  const normal={x:base.nx,z:base.nz},forward={x:Math.sin(base.heading),z:Math.cos(base.heading)};
  const radius=36,offset=79;
  const center={x:base.x+normal.x*offset,z:base.z+normal.z*offset,y:base.y};
  const local=(u,v)=>({x:center.x+normal.x*u+forward.x*v,z:center.z+normal.z*u+forward.z*v});
  const circle=angle=>{
    const p=local(-radius*Math.cos(angle),radius*Math.sin(angle));
    return {...p,y:center.y,structure:null,bank:0,width:10,laneFactor:3};
  };
  const entryAngle=-1,exitAngle=1;
  const ringEntry=circle(entryAngle),ringExit=circle(exitAngle);
  const sampleCurve=(from,to,fromTangent,toTangent,segments=28)=>{
    const out=[];
    for(let i=0;i<=segments;i++){
      const t=i/segments,u=1-t;
      const x=u*u*u*from.x+3*u*u*t*(from.x+fromTangent.x)+3*u*t*t*(to.x-toTangent.x)+t*t*t*to.x;
      const z=u*u*u*from.z+3*u*u*t*(from.z+fromTangent.z)+3*u*t*t*(to.z-toTangent.z)+t*t*t*to.z;
      const y=from.y+(to.y-from.y)*(3*t*t-2*t*t*t);
      out.push({x,y,z,structure:null,bank:0,width:10,laneFactor:3});
    }
    return out;
  };
  const radialTangent=angle=>({x:normal.x*radius*Math.sin(angle)+forward.x*radius*Math.cos(angle),
    z:normal.z*radius*Math.sin(angle)+forward.z*radius*Math.cos(angle)});
  const tEntry=radialTangent(entryAngle),tExit=radialTangent(exitAngle);
  const before={x:entry.x,y:entry.y,z:entry.z},after={x:exit.x,y:exit.y,z:exit.z};
  const incoming=sampleCurve(before,ringEntry,{x:forward.x*60,z:forward.z*60},
    {x:tEntry.x*.62,z:tEntry.z*.62});
  const outgoing=sampleCurve(ringExit,after,{x:tExit.x*.62,z:tExit.z*.62},
    {x:forward.x*60,z:forward.z*60});
  const ring=(startAngle,endAngle)=>Array.from({length:49},(_,i)=>circle(startAngle+(endAngle-startAngle)*i/48));
  const prefix=`v3:roundabout:${index}`,ringEntryId=`${prefix}:entry`,ringExitId=`${prefix}:exit`,
    startNode=`endless:node:${index}`,endNode=`endless:node:${index+1}`;
  const edge=(name,from,to,points,type,progress)=>{
    const samples=points.map((p,i)=>({...p,structure:classifyTerrainRoadV3Structure(seed,p,p.structure),progress:progress+i/(points.length-1)*60}));
    for(let i=0;i<samples.length;i++){
      const a=samples[Math.max(0,i-1)],b=samples[Math.min(i+1,samples.length-1)];
      const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
      samples[i].heading=Math.atan2(dx,dz);
      samples[i].nx=dz/len;samples[i].nz=-dx/len;
      samples[i].grade=(b.y-a.y)/len;
    }
    const width=10;
    return {id:`${prefix}:${name}`,from,to,branchId:prefix,branchName:'Scenic roundabout',
      type,roadClass:'paved-regional',surface:'paved',width,laneCount:2,laneWidth:3.4,
      roughness:.035,optional:true,endless:true,modular:true,generatorVersion:ROAD_V3_VERSION,
      samples,startProgress:samples[0].progress,endProgress:samples.at(-1).progress,
      length:edgeLength({samples})};
  };
  const edges=[
    edge('approach',startNode,ringEntryId,incoming,'roundabout-approach',start),
    edge('ring-a',ringEntryId,ringExitId,ring(entryAngle,exitAngle),'roundabout',start+60),
    edge('ring-b',ringExitId,ringEntryId,ring(exitAngle,entryAngle+Math.PI*2),'roundabout',start+120),
    edge('exit',ringExitId,endNode,outgoing,'roundabout-exit',start+180)
  ];
  const roundabout={id:prefix,center,radius,roadWidth:10,approaches:[
    {id:'entry',node:ringEntry,from:before,yield:true,heading:incoming.at(-1).heading,width:10},
    {id:'exit',node:ringExit,from:ringEntry,yield:false,heading:outgoing[0].heading,width:10}
  ]};
  const choice={id:`${prefix}:choice`,kind:'roundabout',label:'Scenic roundabout',
    entryEdgeId:edges[0].id,exitEdgeId:edges[3].id,
    fallbackEdgeIds:[`endless:highway:${index}`],side:'left',
    entryProgress:start,exitProgress:end,warningProgress:start-120};
  const optional={id:prefix,name:'Scenic roundabout',junction:'roundabout',roundaboutId:prefix,
    center,radius,roadWidth:10,approaches:roundabout.approaches,
    entryNodeId:startNode,exitNodeId:endNode,entryEdgeId:edges[0].id,exitEdgeId:edges[3].id};
  const branch={id:prefix,name:'Scenic roundabout',optional:true,
    nodeIds:[startNode,ringEntryId,ringExitId,endNode],edgeIds:edges.map(e=>e.id),
    length:edges.reduce((n,e)=>n+e.length,0)};
  return {edges,roundabout,choice,optional,branch,
    nodes:[{id:ringEntryId,...ringEntry},{id:ringExitId,...ringExit}]};
}

function fromLegacy(source,{revision=1,context=null}={}){
  const seed=source.seed;
  context??={seed,sampler:createTerrainRoadV3Sampler(seed),edges:new Map()};
  const nextEdges=new Map();
  const edges=source.edges.map(edge=>{
    const cached=context.edges.get(edge.id);
    const mapped=cached??translateEdge(context,edge);
    nextEdges.set(edge.id,mapped);return mapped;
  });
  context.edges=nextEdges;
  const mapNode=node=>translateOther(context,node,Number.isFinite(node.progress)?node.progress:-node.z);
  const nodes=source.nodes.map(mapNode);
  const depots=source.depots.map(depot=>{
    const station=source.loadingStations?.find(s=>s.id===depot.stationId),
      progress=station?.progress??0;
    return translateOther(context,depot,progress);
  });
  const signs=source.signs.map(sign=>translateOther(context,sign,Number.isFinite(sign.progress)?sign.progress:0));
  const stations=source.loadingStations.map(s=>translateStation(context,s));
  // Roundabout regions are indexed by course progress. Only the current
  // geometry window is materialized and the feature is fully reproducible.
  const roundabouts=[],extraChoices=[],extraOptional=[],extraBranches=[];
  const first=source.endless.firstSection,last=source.endless.lastSection;
  for(let index=6;index<=last;index+=9){
    if(index<first||index+1>last+1)continue;
    const item=roundaboutAt(seed,index,context);
    edges.push(...item.edges);nodes.push(...item.nodes);
    roundabouts.push(item.roundabout);extraChoices.push(item.choice);
    extraOptional.push(item.optional);extraBranches.push(item.branch);
  }
  const originPoint=align(context,0);
  const course={...source,schema:'long-haul.course-package/1',generatorVersion:ROAD_V3_VERSION,
    packageId:`endless-v3-${hashText(seed).toString(36)}`,terrainAware:true,
    origin:{id:'origin',...originPoint},
    edges,nodes,hub:nodes.find(n=>n.id===source.hub?.id)??nodes[0],
    roundabouts,routeChoices:[...source.routeChoices,...extraChoices],
    optionalRoads:[...source.optionalRoads,...extraOptional],
    branches:[...source.branches,...extraBranches],
    depots,signs,loadingStations:stations,
    bounds:boundsFor(edges),maxRoadWidth:Math.max(...edges.map(e=>e.width)),
    totalProgress:source.endless.windowEnd,
    endless:{...source.endless,revision},
    persistence:{seed,version:ROAD_V3_VERSION,layoutRevision:4},
    validation:{...source.validation,contract:'terrain-aware playable V3 with preserved V2 topology'}};
  if(!Number.isFinite(course.origin.heading))course.origin.heading=Math.PI;
  contexts.set(course,context);
  return course;
}
export function createPlayableRoadV3Course(seed,{progress=0}={}) {
  if(typeof seed!=='string'||!seed||!Number.isFinite(progress)||progress<0)
    throw new TypeError('Playable V3 requires seed and nonnegative progress');
  return fromLegacy(createEndlessHighway(seed,{progress}),{revision:1});
}
/** Rebuilds *only* the current bounded window, leaving source identity alone. */
export function advancePlayableRoadV3Course(course,positionOrProgress) {
  if(course?.generatorVersion!==ROAD_V3_VERSION||!course.terrainAware)throw new TypeError('Not a playable V3 course');
  const progress=typeof positionOrProgress==='number'?positionOrProgress:
    (roadV3Project(course,positionOrProgress,{hint:course.endless?.furthestProgress??null})?.progress??0);
  if(!Number.isFinite(progress))throw new TypeError('Invalid V3 progress');
  const section=Math.floor(Math.max(0,progress)/320);
  course.endless.furthestProgress=Math.max(course.endless.furthestProgress??0,progress);
  if(section===course.endless.centerSection)return {changed:false,revision:course.endless.revision};
  const next=fromLegacy(createEndlessHighway(course.seed,{progress}),{revision:course.endless.revision+1,context:contexts.get(course)});
  next.endless.furthestProgress=course.endless.furthestProgress;
  next.endless.maximumProgress=next.endless.furthestProgress;
  Object.assign(course,next);
  contexts.set(course,contexts.get(next));
  return {changed:true,revision:next.endless.revision,
    edgeCount:course.edges.length,nodeCount:course.nodes.length,
    stationCount:course.loadingStations.length};
}
export function playableRoadV3Point(course,progress,lateral=0,route='safe') {
  if(course?.generatorVersion!==ROAD_V3_VERSION)return null;
  if(!Number.isFinite(progress)||!Number.isFinite(lateral))return null;
  // Existing freight route selection uses two physical entry gates. The
  // station-specific branching remains owned by the reprojected source graph.
  const point=endlessHighwayPoint(v2Course(course.seed),progress,lateral,route);
  const context=contexts.get(course)??{seed:course.seed,sampler:createTerrainRoadV3Sampler(course.seed)};
  if(!contexts.has(course))contexts.set(course,context);
  return translate(context,point,progress);
}
export function playableRoadV3Progress(course,position,hint=null) {
  if(course?.generatorVersion!==ROAD_V3_VERSION)return null;
  return roadV3Project(course,position,{hint})?.progress??null;
}
