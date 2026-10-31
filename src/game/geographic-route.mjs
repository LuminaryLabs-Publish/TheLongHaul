// Geographic campaign adapter. Routing geometry comes from OSM-derived OSRM data.
// The coordinates are compressed into a playable 3D course; no fictional roads are generated.
import { deriveCourseBounds } from "./shared.mjs";

const rad = Math.PI / 180;
const metersBetween=(a,b)=>Math.hypot((b[0]-a[0])*111320*Math.cos(((a[1]+b[1])/2)*rad),(b[1]-a[1])*111320);
export function routeToCourse(route, coordinates) {
  if(!route?.id||!Array.isArray(coordinates)||coordinates.length<2)throw Error("Real route geometry is required.");
  if(!coordinates.every(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90))throw Error("Invalid real road geometry.");
  const valid=coordinates;
  // Preserve real bends and intersections, reduce the traversal scale for arcade play.
  const origin=valid[0], scale=.035, waypoints=[{id:"origin",x:0,z:0}], nodes=[],edges=[];
  let distance=0,previous=origin;
  for(const point of valid.slice(1)){
    distance+=metersBetween(previous,point);previous=point;
    const x=(point[0]-origin[0])*111320*Math.cos(origin[1]*rad)*scale;
    const z=(origin[1]-point[1])*111320*scale;
    const last=waypoints[waypoints.length-1];
    if(Math.hypot(x-last.x,z-last.z)<25)continue;
    waypoints.push({id:`road-${waypoints.length}`,x,z});
  }
  const end=valid.at(-1),endPoint={id:`road-${waypoints.length}`,x:(end[0]-origin[0])*111320*Math.cos(origin[1]*rad)*scale,z:(origin[1]-end[1])*111320*scale};
  if(Math.hypot(endPoint.x-waypoints.at(-1).x,endPoint.z-waypoints.at(-1).z)>3)waypoints.push(endPoint);
  if(waypoints.length<2)throw Error("Selected highway geometry is too short.");
  // Keep actual OSRM polyline segments, splitting long straight sections for streaming.
  let previousNode=waypoints[0];
  for(const next of waypoints.slice(1)){
    const length=Math.hypot(next.x-previousNode.x,next.z-previousNode.z);
    const count=Math.max(1,Math.ceil(length/160));
    for(let i=1;i<=count;i++){
      const p={id:`node-${nodes.length+1}`,x:previousNode.x+(next.x-previousNode.x)*i/count,z:previousNode.z+(next.z-previousNode.z)*i/count};
      const a=nodes.length?nodes.at(-1):waypoints[0];
      if(Math.hypot(p.x-a.x,p.z-a.z)<1)continue;
      nodes.push(p);
      edges.push({id:`osm-edge-${edges.length}`,from:a.id,to:p.id,branchId:"highway",branchName:"OSM Highway",type:"highway",roadClass:"paved-highway",surface:"paved",width:24,roughness:.025,samples:[{x:a.x,z:a.z,y:0},{x:p.x,z:p.z,y:0}],length:Math.hypot(p.x-a.x,p.z-a.z)});
    }
    previousNode=next;
  }
  const destination=nodes.at(-1),preceding=nodes.at(-2)??waypoints[0];
  const heading=Math.atan2(destination.x-preceding.x,destination.z-preceding.z);
  // Receiving gate touches the paved corridor; no unconnected phantom driveway.
  const depots=[{id:"receiving-yard",nodeId:destination.id,branchId:"highway",name:route.to.name+" Receiving",kind:"warehouse",x:destination.x+Math.cos(heading)*10,z:destination.z-Math.sin(heading)*10,heading,radius:30}];
  const course={schema:"long-haul.course-package/1",packageId:`osm-${route.id}`,seed:route.id,generatorVersion:"osm-highway-v1",origin:waypoints[0],hub:nodes[Math.floor(nodes.length/2)],nodes:[waypoints[0],...nodes],edges,branches:[{id:"highway",name:"OSM Highway",nodeIds:nodes.map(n=>n.id),edgeIds:edges.map(e=>e.id)}],depots,signs:[],wildlife:[],validDepotId:depots[0].id,scoring:{parTimeSeconds:Math.max(300,Math.ceil(edges.reduce((s,e)=>s+e.length,0)/20)),parDistance:edges.reduce((s,e)=>s+e.length,0)},bounds:null,geography:{source:"OpenStreetMap contributors via OSRM",from:route.from.code,to:route.to.code,actualMeters:distance,scale}};
  course.bounds=deriveCourseBounds(course);
  return course;
}
export async function loadGeographicCourse(route,{signal}={}){
  const a={...route.from,...(route.from.code==="NJ"?{lon:-74.1724,lat:40.7357}:{})},b={...route.to,...(route.to.code==="PA"?{lon:-75.1636,lat:39.9524}:{})};
  const endpoint=`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson&steps=false`;
  const cacheKey='longhaul-route-geometry-v1:'+route.id;
  try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached?.endpoint===endpoint&&Date.now()-cached.savedAt<7*86400000)return routeToCourse(route,cached.geometry)}catch{}
  const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(endpoint,{signal:controller.signal});
    if(!response.ok)throw Error(`OSM routing unavailable (HTTP ${response.status})`);
    const data=await response.json(),geometry=data.routes?.[0]?.geometry?.coordinates;
    if(!geometry?.length)throw Error('OSM routing returned no connected highway alignment.');
    const course=routeToCourse(route,geometry);
    try{localStorage.setItem(cacheKey,JSON.stringify({endpoint,geometry,savedAt:Date.now()}));const keys=Object.keys(localStorage).filter(k=>k.startsWith('longhaul-route-geometry-v1:'));keys.sort((a,b)=>{try{return JSON.parse(localStorage.getItem(a)).savedAt-JSON.parse(localStorage.getItem(b)).savedAt}catch{return 0}});while(keys.length>8)localStorage.removeItem(keys.shift())}catch{}
    return course;
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
