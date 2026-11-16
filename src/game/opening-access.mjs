// Accessible, ground-level opening route for the first Endless V3 interchange.
// A side road feeds a continuous at-grade merge into an existing mainline node.
// No bridge, overhead deck, barrier, or extra world authority is created.
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const pointAt=(edges,progress)=>{
  for(const edge of edges){
    if(edge.branchId!=='trunk'||edge.type!=='endless-highway'||progress<edge.startProgress||progress>edge.endProgress)continue;
    const samples=edge.samples??[];
    for(let j=1;j<samples.length;j++){
      const a=samples[j-1],b=samples[j];if(progress>b.progress+1e-7)continue;
      const t=clamp((progress-a.progress)/(b.progress-a.progress||1),0,1);
      const dx=b.x-a.x,dz=b.z-a.z;
      return {x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:lerp(a.z,b.z,t),
        heading:Math.atan2(dx,dz),progress,width:lerp(a.width??edge.width,b.width??edge.width,t),nodeId:edge.to};
    }
  }
  return null;
};
const offset=(p,lateral)=>({x:p.x+Math.cos(p.heading)*lateral,y:p.y,z:p.z-Math.sin(p.heading)*lateral});
const bezier=(a,b,c,d,t)=>{
  const u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,
    z:u*u*u*a.z+3*u*u*t*b.z+3*u*t*t*c.z+t*t*t*d.z};
};
const roadSamples=(points,progressStart,progressEnd)=>{
  const samples=points.map((p,i)=>({...p,width:10,laneFactor:3,bank:0,structure:null,
    progress:lerp(progressStart,progressEnd,i/(points.length-1))}));
  for(let i=0;i<samples.length;i++){
    const a=samples[Math.max(0,i-1)],b=samples[Math.min(i+1,samples.length-1)];
    const length=distance(a,b)||1,dx=b.x-a.x,dz=b.z-a.z;
    samples[i].heading=Math.atan2(dx,dz);samples[i].nx=dz/length;samples[i].nz=-dx/length;
    samples[i].grade=(b.y-a.y)/length;
  }
  return samples;
};
const gradeOf=samples=>samples.slice(1).reduce((max,p,i)=>Math.max(max,Math.abs((p.y-samples[i].y)/(distance(p,samples[i])||1))),0);
const edge=(id,from,to,samples,branch)=>({id,from,to,branchId:branch,branchName:'Ground-level highway access',
 type:'entrance-ramp',roadClass:'paved-regional',surface:'paved',width:10,laneCount:2,laneWidth:3.4,
 roughness:.035,optional:true,endless:true,modular:true,generatorVersion:'long-haul-endless-v3',
 samples,startProgress:samples[0].progress,endProgress:samples.at(-1).progress,
 length:samples.slice(1).reduce((n,p,i)=>n+distance(samples[i],p),0)});
export function createGroundLevelAccess(edges,index,{sectionMeters=320,naturalHeight=null,maxGrade=.12}={}){
  const begin=index*sectionMeters;
  const approach=pointAt(edges,begin+55),middle=pointAt(edges,begin+155),merge=pointAt(edges,begin+sectionMeters);
  if(!approach||!middle||!merge||!merge.nodeId)return null;
  const sideA=offset(approach,190),sideB=offset(middle,115);
  const natural=p=>typeof naturalHeight==='function'?naturalHeight(p.x,p.z):NaN;
  const startGround=natural(sideA),joinGround=natural(sideB);
  // A roadside access road must exist even where natural relief is extreme.
  // Grade a local cut/fill at most 6 m from the trunk profile rather than
  // installing an unachievable ramp or silently omitting the first entrance.
  const startY=clamp(Number.isFinite(startGround)?startGround+.15:approach.y,approach.y-6,approach.y+6);
  const joinY=clamp(Number.isFinite(joinGround)?joinGround+.15:middle.y,middle.y-6,middle.y+6);
  const lateralRoad=[];
  for(let i=0;i<=40;i++){
    const t=i/40,shape=smooth(t);
    lateralRoad.push({x:lerp(sideA.x,sideB.x,shape),z:lerp(sideA.z,sideB.z,shape),y:lerp(startY,joinY,shape)});
  }
  const c1=offset(pointAt(edges,begin+220)??middle,85);
  const c2=offset(pointAt(edges,begin+275)??middle,30);
  const ramp=[];
  for(let i=0;i<=80;i++){
    const t=i/80,xy=bezier(sideB,c1,c2,merge,t);
    ramp.push({...xy,y:joinY});
  }
  // Interpolate elevation by distance traveled, not Bezier parameter t:
  // horizontal Bezier tangents can be short at a tight merge, and a t-based
  // height interpolation otherwise produces an artificially steep ramp.
  const run=[0];
  for(let i=1;i<ramp.length;i++)run.push(run[i-1]+distance(ramp[i-1],ramp[i]));
  const total=run.at(-1)||1;
  for(let i=0;i<ramp.length;i++)ramp[i].y=lerp(joinY,merge.y,run[i]/total);
  ramp[ramp.length-1]={x:merge.x,y:merge.y,z:merge.z};
  const identifier=`v3:opening-access:${index}`;
  const outerId=`${identifier}:outer`,junctionId=`${identifier}:junction`;
  const a=edge(`${identifier}:approach`,outerId,junctionId,roadSamples(lateralRoad,begin+55,begin+155),identifier);
  const b=edge(`${identifier}:merge`,junctionId,merge.nodeId,roadSamples(ramp,begin+155,begin+sectionMeters),identifier);
  const peak=Math.max(gradeOf(a.samples),gradeOf(b.samples));
  if(!Number.isFinite(peak)||peak>maxGrade)return null;
  return {id:identifier,kind:'ground-access',sectionIndex:index,edges:[a,b],maxGrade:peak,
    merge:{x:merge.x,y:merge.y,z:merge.z,nodeId:merge.nodeId},
    nodes:[{id:outerId,...sideA,y:startY},{id:junctionId,...sideB,y:joinY}],
    optional:{id:identifier,name:'Ground-level highway access',entryNodeId:junctionId,exitNodeId:merge.nodeId,entryEdgeId:b.id,exitEdgeId:b.id},
    branch:{id:identifier,name:'Ground-level highway access',optional:true,nodeIds:[outerId,junctionId,merge.nodeId],edgeIds:[a.id,b.id],length:a.length+b.length},
    sign:{id:`${identifier}:sign`,x:sideB.x,y:joinY,z:sideB.z,heading:b.samples[0].heading+Math.PI,
      title:'HIGHWAY ENTRANCE',subtitle:'MERGE AHEAD',arrow:'↗',kind:'highway-access',progress:begin+155}};
}
export function validateGroundLevelAccess(site,{maxGrade=.12}={}){
 const problems=[];
 if(!site||site.kind!=='ground-access')return ['invalid-opening'];
 const [approach,ramp]=site.edges??[];
 if(!approach||!ramp)return ['missing-edges'];
 if(approach.to!==ramp.from)problems.push('access-node-disconnected');
 if(ramp.to!==site.merge?.nodeId)problems.push('merge-node-disconnected');
 const end=ramp.samples.at(-1);
 if(!end||end.x!==site.merge.x||end.y!==site.merge.y||end.z!==site.merge.z)problems.push('merge-pavement-disconnected');
 if(site.maxGrade>maxGrade)problems.push('excess-grade');
 return problems;
}
// V3 saved courses retain their existing generator identity. Only the explicit
// first opening site changes: don't force a raised bridge in the startup region.
export function removeOpeningBridgeSpan(edges,openingSection,sectionMeters=320){
 const end=(openingSection+1)*sectionMeters;
 return edges.map(e=>e.branchId==='trunk'&&e.type==='endless-highway'&&e.startProgress<=end
   ?{...e,samples:e.samples.map(p=>p.progress<=end?{...p,structure:p.structure==='bridge'?null:p.structure}:p)}
   :e);
}
