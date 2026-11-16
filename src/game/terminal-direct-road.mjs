// Fresh-run freight terminal exit: one straight road from the authored yard
// to the first highway connection. Legacy checkpoint ramps stay unchanged.
const mix=(a,b,t)=>a+(b-a)*t;
export const DIRECT_TERMINAL_SEED='haul-terminal-direct-';
export const isDirectTerminalRun=seed=>typeof seed==='string'&&(seed.startsWith(DIRECT_TERMINAL_SEED)||seed.startsWith('haul-terminal-cohesive-'));
export const isCohesiveTerminalRun=seed=>typeof seed==='string'&&seed.startsWith('haul-terminal-cohesive-');
export function straightTerminalRoadPoints(start,merge,{spacing=4}={}){
  if(!start||!merge||![start.x,start.y,start.z,merge.x,merge.y,merge.z].every(Number.isFinite))
    throw new TypeError('Invalid terminal exit endpoints');
  const length=Math.hypot(merge.x-start.x,merge.z-start.z);
  if(!(length>=20)||!(spacing>0))throw new RangeError('Invalid terminal exit length or sampling');
  const segments=Math.max(2,Math.ceil(length/spacing));
  const points=Array.from({length:segments+1},(_,i)=>{
    const t=i/segments;
    return {x:mix(start.x,merge.x,t),y:mix(start.y,merge.y,t),z:mix(start.z,merge.z,t)};
  });
  points[0]={...start};points[segments]={...merge};
  return points;
}
export function validateStraightTerminalRoad(points,{maxGrade=.12}={}){
  if(!Array.isArray(points)||points.length<3)return ['missing-road'];
  const errors=[];
  const first=points[0],last=points.at(-1);
  const dx=last.x-first.x,dz=last.z-first.z,len=Math.hypot(dx,dz);
  if(!(len>=20))return ['short-road'];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],horizontal=Math.hypot(b.x-a.x,b.z-a.z);
    if(!(horizontal>.1)||Math.abs(b.y-a.y)/horizontal>maxGrade+1e-8)errors.push('grade-or-spacing');
    const cross=(b.x-first.x)*dz-(b.z-first.z)*dx;
    if(Math.abs(cross)>1e-5*Math.max(1,len))errors.push('curved-exit');
  }
  return [...new Set(errors)];
}

const clamp01=t=>Math.max(0,Math.min(1,t));
const quintic=t=>{t=clamp01(t);return t*t*t*(t*(t*6-15)+10);};
export function cohesiveOpeningElevation(progress,level,proceduralHeight){
  if(![progress,level,proceduralHeight].every(Number.isFinite))throw new TypeError('Nonfinite opening height');
  // At-grade yard and mainline merge; the procedural terrain resumes gently.
  return level+(proceduralHeight-level)*quintic((progress-440)/520);
}
export function cohesiveOpeningWidth(progress,baseWidth){
  if(!Number.isFinite(progress)||!Number.isFinite(baseWidth))throw new TypeError('Nonfinite width');
  // Auxiliary merge lane fades into the ordinary mainline over 220 metres.
  return baseWidth+3.6*(1-quintic((progress-320)/220));
}
export function cohesiveTerminalSoilHeight(site,start,finish,x,z,underlying){
  if(!site||!start||!finish||![x,z,underlying,site.x,site.y,site.z,site.yaw,start.x,start.y,start.z,finish.x,finish.y,finish.z].every(Number.isFinite))return underlying;
  const dx=finish.x-start.x,dz=finish.z-start.z,length2=dx*dx+dz*dz;
  if(length2<100)return underlying;
  const t=clamp01(((x-start.x)*dx+(z-start.z)*dz)/length2);
  const cx=start.x+t*dx,cz=start.z+t*dz;
  const distance=Math.hypot(x-cx,z-cz);
  // On-road soil is kept just below pavement. The verge fades gradually into
  // the procedural natural terrain instead of creating an embankment wall.
  const target=(start.y-.17)+(finish.y-.4-start.y+.17)*t;
  const corridorBlend=quintic((distance-5.5)/95);
  let height=target+(underlying-target)*corridorBlend;
  // Terminal apron level and road support share one physical surface.
  const c=Math.cos(site.yaw),sn=Math.sin(site.yaw),lx=c*(x-site.x)-sn*(z-site.z),lz=sn*(x-site.x)+c*(z-site.z);
  const bx=Math.max(-318-lx,0,lx-45),bz=Math.max(-230-lz,0,lz-225);
  const apronBlend=quintic(Math.hypot(bx,bz)/110);
  const apron=site.y+.035;
  height=apron+(height-apron)*apronBlend;
  return height;
}
