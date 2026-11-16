// Fresh-run freight terminal exit: one straight road from the authored yard
// to the first highway connection. Legacy checkpoint ramps stay unchanged.
const mix=(a,b,t)=>a+(b-a)*t;
export const DIRECT_TERMINAL_SEED='haul-terminal-direct-';
export const isDirectTerminalRun=seed=>typeof seed==='string'&&seed.startsWith(DIRECT_TERMINAL_SEED);
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
