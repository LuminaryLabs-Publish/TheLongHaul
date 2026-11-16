// Product-owned crossing clearance for road/terrain and authored road structures.
// The road graph owns the deck elevations; this module never edits paths or saves.
import { roadSegmentsNear } from './road-spatial-index.mjs';
import { roadV3SurfacesAt, ROAD_V3_VERSION } from './road-v3-geometry.mjs';

export const JUNCTION_TERRAIN_SEGMENTS = 32;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const len=(x,z)=>Math.hypot(x,z);
const finite=Number.isFinite;
function nearest(point,a,b){
  const dx=b.x-a.x,dz=b.z-a.z,d=dx*dx+dz*dz;
  const t=d>1e-10?clamp(((point.x-a.x)*dx+(point.z-a.z)*dz)/d,0,1):0;
  return {x:a.x+dx*t,z:a.z+dz*t,t,distance:len(point.x-a.x-dx*t,point.z-a.z-dz*t)};
}
// Intersection or shortest distance of two 2D road centerline segments.
function closestRoadApproach(a,b,c,d){
  const rx=b.x-a.x,rz=b.z-a.z,sx=d.x-c.x,sz=d.z-c.z,den=rx*sz-rz*sx;
  if(Math.abs(den)>1e-8){
    const qx=c.x-a.x,qz=c.z-a.z,t=(qx*sz-qz*sx)/den,u=(qx*rz-qz*rx)/den;
    if(t>=0&&t<=1&&u>=0&&u<=1)return {x:a.x+rx*t,z:a.z+rz*t,distance:0};
  }
  let winner=null;
  for(const [p,start,end] of [[a,c,d],[b,c,d],[c,a,b],[d,a,b]]){
    const candidate=nearest(p,start,end);
    if(!winner||candidate.distance<winner.distance)winner={x:(p.x+candidate.x)/2,z:(p.z+candidate.z)/2,distance:candidate.distance};
  }
  return winner;
}
export function roadJunctionsInCell(course,bounds,{margin=12,maxResults=Infinity}={}){
  if(course?.generatorVersion!==ROAD_V3_VERSION||!bounds)return [];
  const box={minX:bounds.minX-margin,maxX:bounds.maxX+margin,minZ:bounds.minZ-margin,maxZ:bounds.maxZ+margin};
  const segments=roadSegmentsNear(course,box).filter(({a,b,edge})=>
    a&&b&&edge&&Number.isFinite(a.x+a.z+b.x+b.z)&&
    Math.max(a.x,b.x)>=box.minX-20&&Math.min(a.x,b.x)<=box.maxX+20&&
    Math.max(a.z,b.z)>=box.minZ-20&&Math.min(a.z,b.z)<=box.maxZ+20);
  const crossings=[],keys=new Set();
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
    const left=segments[i],right=segments[j];
    if(left.edge.id===right.edge.id&&Math.abs(left.segmentIndex-right.segmentIndex)<=2)continue;
    const ar=left.b.x-left.a.x,az=left.b.z-left.a.z,br=right.b.x-right.a.x,bz=right.b.z-right.a.z;
    const al=len(ar,az),bl=len(br,bz);if(al<.2||bl<.2)continue;
    const sine=Math.abs(ar*bz-az*br)/(al*bl);
    const match=closestRoadApproach(left.a,left.b,right.a,right.b);
    const joins=[left.a,left.b].some(p=>[right.a,right.b].some(q=>len(p.x-q.x,p.z-q.z)<=2.5));
    if(!joins&&sine<.13)continue; // Parallel ramps and neighboring lane edges are not junctions.
    const width=Math.min(left.edge.width??left.a.width??8,right.edge.width??right.a.width??8);
    if(match.distance>Math.min(5,Math.max(1.5,width*.35)))continue;
    if(match.x<box.minX||match.x>box.maxX||match.z<box.minZ||match.z>box.maxZ)continue;
    const key=`${Math.round(match.x/4)}:${Math.round(match.z/4)}:${[left.edge.id,right.edge.id].sort().join(':')}`;
    if(keys.has(key))continue;
    keys.add(key);
    crossings.push({x:match.x,z:match.z,edges:[left.edge.id,right.edge.id],separation:match.distance});
    if(crossings.length>=maxResults)return crossings;
  }
  return crossings;
}
export function intersectionTerrainSegments(course,bounds,base=16){
  return roadJunctionsInCell(course,bounds,{maxResults:1}).length?Math.max(base,JUNCTION_TERRAIN_SEGMENTS):base;
}
// Suppress guardrails/walls/roofs only where another *at-grade* traversable
// road joins. Overpasses retain their decks and rails with adequate clearance.
// For piers, test the entire vertical clearance volume of the supporting column.
export function roadStructurePositionAllowed(course,point,{
  ownerEdgeId=null,kind='rail',roadY=point?.y,halfWidth=1,verticalReach=10.5
}={}){
  if(course?.generatorVersion!==ROAD_V3_VERSION||!point||!finite(point.x)||!finite(point.z)||!finite(roadY))return true;
  const neighbors=roadV3SurfacesAt(course,point,Math.max(15,halfWidth+12));
  for(const other of neighbors){
    if(other.edgeId===ownerEdgeId)continue;
    const side=(point.x-other.x)*other.nx+(point.z-other.z)*other.nz;
    const surfaceY=other.y+other.bank*side;
    if(other.distance>other.width*.5+halfWidth+.25)continue;
    if(kind==='pier'){
      if(surfaceY<=roadY+1&&surfaceY>=roadY-verticalReach)return false;
    }else if(Math.abs(surfaceY-roadY)<=2.2){
      return false; // An at-grade intersection must remain unobstructed.
    }
  }
  return true;
}

// Authored environment tiles must respect *all* roads at an intersection, not
// just a single nearest centerline chosen by the gameplay road query.
export function roadSceneryPositionAllowed(course,x,z,margin=0){
  if(course?.generatorVersion!==ROAD_V3_VERSION)return true;
  if(![x,z,margin].every(finite))return false;
  const reach=Math.min(160,Math.max(30,margin+(Number(course.maxRoadWidth)||28)*.5+8));
  return !roadV3SurfacesAt(course,{x,z},reach).some(s=>s.distance<s.width/2+margin);
}
