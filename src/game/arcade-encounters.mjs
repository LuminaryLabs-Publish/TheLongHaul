// Product-owned route geometry and encounter planning. No renderer or engine state.
import { hashText } from './shared.mjs';
import {ROAD_V3_VERSION} from './road-v3-geometry.mjs';

export function buildArcadeRoutes(course) {
  const paths=[],byEdge=new Map(),tails=new Map();
  for (const edge of course.edges??[]) {
    if (!Array.isArray(edge.samples)||edge.samples.length<2 ||
        (edge.type==='roundabout' && (course.generatorVersion!==ROAD_V3_VERSION||edge.id.endsWith(':ring-b')))) continue;
    const key=edge.branchId??edge.id;
    let path=tails.get(key);
    if (!path||path.segments.at(-1)?.edge.to!==edge.from) {
      path={id:`${key}:${paths.length}`,segments:[],length:0};paths.push(path);tails.set(key,path);
    }
    const cumulative=[0];
    for(let i=1;i<edge.samples.length;i++)cumulative.push(cumulative[i-1]+Math.hypot(edge.samples[i].x-edge.samples[i-1].x,edge.samples[i].z-edge.samples[i-1].z));
    const length=cumulative.at(-1),segment={edge,cumulative,start:path.length,end:path.length+length,path};
    if(length<=0)continue;
    path.segments.push(segment);path.length+=length;byEdge.set(edge.id,segment);
  }
  return {paths,byEdge};
}

export function arcadePathPoint(path,distance,lane=0) {
  if(!path||!Number.isFinite(distance)||distance<0||distance>path.length)return null;
  const segment=path.segments.find(item=>distance<=item.end)??path.segments.at(-1);
  if(!segment)return null;
  const {edge,cumulative}=segment,along=distance-segment.start;
  let i=1;while(i<cumulative.length-1&&cumulative[i]<along)i++;
  const a=edge.samples[i-1],b=edge.samples[i],length=cumulative[i]-cumulative[i-1]||1,t=Math.max(0,Math.min(1,(along-cumulative[i-1])/length)),dx=b.x-a.x,dz=b.z-a.z;
  const bank=(a.bank??0)+((b.bank??0)-(a.bank??0))*t;
  const grade=(a.grade??0)+((b.grade??0)-(a.grade??0))*t;
  return {x:a.x+(b.x-a.x)*t-dz/length*lane,z:a.z+(b.z-a.z)*t+dx/length*lane,
    y:a.y+(b.y-a.y)*t-bank*lane,bank,grade,
    heading:Math.atan2(dx,dz),edge,lane};
}

export function arcadeRoadProgress(road,network) {
  const segment=network?.byEdge.get(road?.edge?.id);
  if(!segment)return null;
  const i=road.segmentIndex,length=(segment.cumulative[i+1]??0)-(segment.cumulative[i]??0);
  return {path:segment.path,distance:segment.start+(segment.cumulative[i]??0)+road.t*length};
}

export function planArcadeEncounters(course,network=buildArcadeRoutes(course)) {
  const events=[],kinds=['ramp','breakables','roadblock','weave'];
  for(const path of network.paths) {
    let sequence=0;
    for(let distance=260;distance<path.length-100&&events.length<128;distance+=300) {
      const point=arcadePathPoint(path,distance),width=Number(point?.edge.width)||0;
      if(!point||width<12||point.edge.surface==='dirt'||point.edge.optional)continue;
      if((course.depots??[]).some(d=>Math.hypot(d.x-point.x,d.z-point.z)<d.radius+80))continue;
      if((course.roundabouts??[]).some(j=>j.center&&Math.hypot(j.center.x-point.x,j.center.z-point.z)<j.radius+65))continue;
      const seed=hashText(`${course.seed}:${path.id}:${sequence}`),side=seed%2?1:-1;
      const kind=kinds[sequence++%kinds.length],lane=side*Math.min(3.4,width*.2);
      events.push({id:`encounter:${path.id}:${Math.round(distance)}`,kind,path,distance,lane,safeLane:side*Math.min(6,width*.24),warningLead:155,clearWidth:7.5,point});
    }
  }
  return events;
}
