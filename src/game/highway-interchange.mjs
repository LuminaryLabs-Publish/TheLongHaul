// The Long Haul — deterministic, drivable lower-road/upper-highway interchange.
// Pure product geometry. No renderer, engine resource writes, UI or random state.
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const mix = (a,b,t) => a+(b-a)*t;
const smooth = t => {t=clamp(t,0,1);return t*t*(3-2*t);};
const distance = (a,b) => Math.hypot(b.x-a.x,b.z-a.z);
const head = (a,b) => Math.atan2(b.x-a.x,b.z-a.z);
const pointFrom = (p,f,n,forward,lateral,y) => ({x:p.x+f.x*forward+n.x*lateral,y,z:p.z+f.z*forward+n.z*lateral});
const idAt = (index) => `v3:interchange:${index}`;
function makeSamples(raw,startProgress,width=10,endProgress=startProgress+220) {
  const samples=raw.map((p,i)=>({...p,width,bank:0,laneFactor:3,structure:null,
    progress:startProgress+(raw.length>1?i/(raw.length-1):0)*(endProgress-startProgress)}));
  for(let i=0;i<samples.length;i++){
    const lo=samples[Math.max(0,i-1)],hi=samples[Math.min(samples.length-1,i+1)];
    const length=distance(lo,hi)||1;
    samples[i].heading=head(lo,hi);
    samples[i].nx=(hi.z-lo.z)/length;
    samples[i].nz=-(hi.x-lo.x)/length;
    samples[i].grade=(hi.y-lo.y)/length;
  }
  return samples;
}
function makeEdge(id,from,to,samples,kind) {
  return {id,from,to,branchId:id.split(':').slice(0,3).join(':'),branchName:'Highway access interchange',
    type:kind,roadClass:'paved-regional',surface:'paved',width:10,laneCount:2,laneWidth:3.4,
    roughness:.035,optional:true,endless:true,modular:true,
    generatorVersion:'long-haul-endless-v3',samples,
    startProgress:samples[0].progress,endProgress:samples.at(-1).progress,
    length:samples.slice(1).reduce((sum,p,i)=>sum+distance(samples[i],p),0)};
}
function bezier(a,b,c,d,t){const u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,
  z:u*u*u*a.z+3*u*u*t*b.z+3*u*t*t*c.z+t*t*t*d.z};}
function highwayPointAt(edges,progress){
  const edge=edges.find(e=>e.branchId==='trunk' && e.type==='endless-highway' &&
    progress>=e.startProgress && progress<=e.endProgress);
  if(!edge)return null;
  const samples=edge.samples;
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    if(progress>b.progress+1e-5)continue;
    const t=clamp((progress-a.progress)/(b.progress-a.progress||1),0,1);
    return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t),
      heading:mix(a.heading,b.heading,t),progress,
      width:mix(a.width,b.width,t),sectionIndex:edge.sectionIndex,
      nodeId:edge.to};
  }
  return null;
}
// Each 9-section region has one designated access site, separated from the
// scenic roundabouts. The highway's section boundary is the explicit merge.
export function createHighwayInterchange(edges,index,{
  sectionMeters=320,underpassDrop=9.6,crossHalfSpan=240,mergeMargin=11,
  maximumGrade=.12,minimumHeadroom=5.5,naturalHeight=null
}={}) {
  if(!Number.isInteger(index)||index<0)return null;
  const begin=index*sectionMeters,cross=begin+72,merge=begin+sectionMeters;
  const upper=highwayPointAt(edges,cross),finish=highwayPointAt(edges,merge);
  if(!upper||!finish||!finish.nodeId)return null;
  if(![upper.x,upper.y,upper.z,finish.x,finish.y,finish.z].every(Number.isFinite))return null;
  const f={x:Math.sin(upper.heading),z:Math.cos(upper.heading)},n={x:Math.cos(upper.heading),z:-Math.sin(upper.heading)};
  const drop=Math.max(underpassDrop,minimumHeadroom+2);
  const floorY=upper.y-drop;
  const base={x:upper.x,y:floorY,z:upper.z};
  const sideY=(lateral)=>{
    const target=pointFrom(base,f,n,0,lateral,floorY);
    const ground=typeof naturalHeight==='function'?naturalHeight(target.x,target.z):NaN;
    return Number.isFinite(ground)?ground+.15:upper.y-1;
  };
  const leftY=sideY(-crossHalfSpan),rightY=sideY(crossHalfSpan);
  const profile=(lateral)=>{
    const t=smooth((Math.abs(lateral)-24)/(crossHalfSpan-24));
    return mix(floorY,lateral<0?leftY:rightY,t);
  };
  const fullUnderpass=[];
  for(let k=0;k<=96;k++){
    const lateral=-crossHalfSpan+crossHalfSpan*2*k/96;
    fullUnderpass.push(pointFrom(base,f,n,0,lateral,profile(lateral)));
  }
  // The lower road passes continuously under the bridge. It is split at its
  // physical ramp junction, preserving a graph node rather than a visual-only T.
  const spurIndex=72,spur=fullUnderpass[spurIndex]; // +120 m at default span
  const west=fullUnderpass[0],east=fullUnderpass.at(-1);
  const leftNode=`${idAt(index)}:lower-left`,lowerNode=`${idAt(index)}:lower-right`,rightNode=`${idAt(index)}:lower-exit`;
  const underA=makeSamples(fullUnderpass.slice(0,spurIndex+1),cross-70,10,cross+70);
  const underB=makeSamples(fullUnderpass.slice(spurIndex),cross+70,10,cross+140);
  // Smooth lateral merge, shared with the exact mainline end vertex and node.
  const p0=spur;
  const p1=pointFrom(base,f,n,65,crossHalfSpan*.5+3,p0.y+1.2);
  const p2=pointFrom(base,f,n,185,Math.max(mergeMargin,finish.width*.5+4),mix(p0.y,finish.y,.78));
  const p3={x:finish.x,y:finish.y,z:finish.z};
  const raw=[];
  for(let k=0;k<=96;k++){
    const t=k/96,xy=bezier(p0,p1,p2,p3,t);
    raw.push({...xy,y:mix(p0.y,finish.y,smooth(t))});
  }
  raw[0]={...p0};raw[raw.length-1]={...p3};
  const ramp=makeSamples(raw,cross+70,10,merge);
  const gradeOf=samples=>samples.slice(1).reduce((m,p,k)=>Math.max(m,Math.abs((p.y-samples[k].y)/(distance(p,samples[k])||1))),0);
  const maxGrade=Math.max(gradeOf(underA),gradeOf(underB),gradeOf(ramp));
  if(maxGrade>maximumGrade || !Number.isFinite(maxGrade))return null;
  const underLeft=makeEdge(`${idAt(index)}:underpass-west`,leftNode,lowerNode,underA,'underpass');
  const underRight=makeEdge(`${idAt(index)}:underpass-east`,lowerNode,rightNode,underB,'underpass');
  const rampEdge=makeEdge(`${idAt(index)}:entrance`,lowerNode,finish.nodeId,ramp,'entrance-ramp');
  const clearance=upper.y-(floorY+0.85);
  if(clearance<minimumHeadroom+1)return null;
  return {
    id:idAt(index),sectionIndex:index,crossProgress:cross,mergeProgress:merge,
    crossing:{x:upper.x,y:upper.y,z:upper.z,lowerY:floorY,clearance,width:10},
    bridgeSpan:Math.max(16,underLeft.width+9),
    merge:{x:finish.x,y:finish.y,z:finish.z,nodeId:finish.nodeId},
    lowerNode,leftNode,rightNode,maxGrade,clearance,
    edges:[underLeft,rampEdge,underRight],
    nodes:[{id:leftNode,...west},{id:lowerNode,...spur},{id:rightNode,...east}],
    optional:{id:idAt(index),name:'Highway entrance',entryNodeId:lowerNode,exitNodeId:finish.nodeId,
      entryEdgeId:rampEdge.id,exitEdgeId:rampEdge.id},
    sign:{id:`${idAt(index)}:sign`,x:spur.x,y:spur.y,z:spur.z,
      heading:ramp[0].heading+Math.PI,title:'HIGHWAY ENTRANCE',
      subtitle:'MERGE RIGHT AHEAD',arrow:'↗',kind:'highway-access',progress:cross+70},
    branch:{id:idAt(index),name:'Highway entrance',optional:true,
      nodeIds:[leftNode,lowerNode,rightNode,finish.nodeId],edgeIds:[underLeft.id,rampEdge.id,underRight.id],
      length:underLeft.length+underRight.length+rampEdge.length}
  };
}
export function applyInterchangeDeckSpan(edges,interchange){
  if(!interchange)return edges;
  const cross=interchange.crossProgress,half=interchange.bridgeSpan;
  return edges.map(edge=>{
    if(edge.branchId!=='trunk'||edge.type!=='endless-highway'||edge.endProgress<cross-half-5||edge.startProgress>cross+half+5)return edge;
    const samples=edge.samples.map(s=>Math.abs(s.progress-cross)<=half?{...s,structure:'bridge'}:s);
    return {...edge,samples};
  });
}
export function validateHighwayInterchange(item,{minimumHeadroom=5.5,maximumGrade=.12}={}){
  const errors=[];
  if(!item)return ['missing-interchange'];
  const [under,ramp,continuation]=item.edges??[];
  if(!under||!ramp||!continuation)errors.push('missing-road-edges');
  if(item.clearance<minimumHeadroom)errors.push('headroom');
  if(item.maxGrade>maximumGrade)errors.push('grade');
  if(ramp?.samples?.at(-1)?.x!==item.merge?.x||ramp?.samples?.at(-1)?.z!==item.merge?.z||ramp?.samples?.at(-1)?.y!==item.merge?.y)errors.push('merge-seam');
  if(ramp?.from!==under?.to || continuation?.from!==under?.to)errors.push('lower-road-disconnected');
  if(under?.samples?.at(-1)?.x!==continuation?.samples?.[0]?.x || under?.samples?.at(-1)?.z!==continuation?.samples?.[0]?.z)errors.push('underpass-seam');
  if(ramp?.to!==item.merge?.nodeId)errors.push('highway-disconnected');
  return errors;
}
// The physical lower route runs underneath the viaduct. Never put a pier in
// the path the player must drive, including neighboring sampled segments.
export function bridgePierAllowed(x,z,interchanges=[],margin=8){
  return !(interchanges??[]).some(site=>{
    if(!site?.crossing)return false;
    const distance=Math.hypot(x-site.crossing.x,z-site.crossing.z);
    return distance<site.bridgeSpan+margin;
  });
}
// The on-ramp approaches the positive lane-normal side of the highway.
// Only that side's rail opens at the merge; the opposite safety rail remains.
export function bridgeRailAllowed(side,x,z,interchanges=[],margin=27){
  if(side<0)return true;
  return !(interchanges??[]).some(site=>site?.merge&&
    Math.hypot(x-site.merge.x,z-site.merge.z)<margin);
}
