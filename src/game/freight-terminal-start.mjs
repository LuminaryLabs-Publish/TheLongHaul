// Authored freight-terminal asset integration: static, deterministic transform
// and ONE connected Road edge; does not create a second physics/road manager.
import { endlessHighwayPoint } from './endless-highway.mjs';
import { playableRoadV3Point } from './road-v3-playable-course.mjs';
import { ROAD_V3_VERSION } from './road-v3-geometry.mjs';
import { edgeLength } from './shared.mjs';

export const FREIGHT_TERMINAL_VERSION = 'long-haul.freight-terminal-start/1';
export const FREIGHT_TERMINAL_MERGE_PROGRESS = 320;
export const FREIGHT_TERMINAL_ASSET = 'assets/freight-terminal/terminal-yard.glb';
const LOCAL_MERGE = [177, .34, -474];
const LOCAL_SPAWN = [12, .20, -167];
const RAMP_LOCAL = [[12.0,0.2,-167.0],[28.0,0.2,-167.0],[42.0,0.2,-167.0],[43.4599,0.2,-167.0217],[44.9268,0.2001,-167.0867],[46.4004,0.2001,-167.1946],[47.8802,0.2002,-167.3452],[49.3659,0.2003,-167.5381],[50.8572,0.2005,-167.773],[52.3536,0.2007,-168.0497],[53.8548,0.2009,-168.3678],[55.3605,0.2011,-168.727],[56.8703,0.2014,-169.1271],[58.3838,0.2016,-169.5677],[59.9007,0.202,-170.0485],[61.4206,0.2023,-170.5692],[62.9431,0.2026,-171.1296],[64.4679,0.203,-171.7293],[65.9947,0.2034,-172.368],[67.5229,0.2039,-173.0454],[69.0524,0.2043,-173.7612],[70.5827,0.2048,-174.5152],[72.1135,0.2053,-175.3069],[73.6443,0.2058,-176.1362],[75.1749,0.2064,-177.0027],[76.7049,0.2069,-177.906],[78.2339,0.2075,-178.846],[79.7616,0.2081,-179.8223],[81.2876,0.2088,-180.8346],[82.8114,0.2094,-181.8825],[84.3329,0.2101,-182.9659],[85.8516,0.2108,-184.0843],[87.367,0.2115,-185.2376],[88.879,0.2122,-186.4253],[90.3871,0.213,-187.6472],[91.891,0.2138,-188.903],[93.3902,0.2145,-190.1924],[94.8845,0.2154,-191.5151],[96.3734,0.2162,-192.8707],[97.8567,0.217,-194.2591],[99.3339,0.2179,-195.6797],[100.8047,0.2188,-197.1325],[102.2687,0.2197,-198.617],[103.7255,0.2206,-200.133],[105.1749,0.2216,-201.6802],[106.6163,0.2225,-203.2583],[108.0496,0.2235,-204.8668],[109.4742,0.2245,-206.5057],[110.8899,0.2255,-208.1745],[112.2963,0.2265,-209.873],[113.693,0.2275,-211.6008],[115.0797,0.2286,-213.3577],[116.4559,0.2296,-215.1433],[117.8214,0.2307,-216.9574],[119.1758,0.2318,-218.7996],[120.5186,0.2329,-220.6697],[121.8496,0.234,-222.5673],[123.1684,0.2352,-224.4921],[124.4746,0.2363,-226.4439],[125.7679,0.2375,-228.4223],[127.0479,0.2386,-230.4271],[128.3142,0.2398,-232.4579],[129.5664,0.241,-234.5144],[130.8043,0.2422,-236.5963],[132.0274,0.2434,-238.7034],[133.2354,0.2447,-240.8353],[134.428,0.2459,-242.9917],[135.6046,0.2472,-245.1724],[136.7651,0.2484,-247.3769],[137.909,0.2497,-249.6051],[139.036,0.251,-251.8566],[140.1457,0.2523,-254.1311],[141.2378,0.2536,-256.4283],[142.3118,0.2549,-258.7479],[143.3675,0.2562,-261.0896],[144.4044,0.2575,-263.4532],[145.4222,0.2589,-265.8382],[146.4205,0.2602,-268.2444],[147.399,0.2616,-270.6715],[148.3574,0.2629,-273.1193],[149.2951,0.2643,-275.5873],[150.212,0.2657,-278.0753],[151.1076,0.2671,-280.583],[151.9815,0.2684,-283.1101],[152.8335,0.2698,-285.6563],[153.663,0.2712,-288.2212],[154.4699,0.2726,-290.8047],[155.2537,0.2741,-293.4063],[156.014,0.2755,-296.0258],[156.7505,0.2769,-298.6629],[157.4628,0.2783,-301.3172],[158.1506,0.2797,-303.9885],[158.8134,0.2812,-306.6765],[159.4511,0.2826,-309.3809],[160.063,0.284,-312.1013],[160.6491,0.2855,-314.8375],[161.2087,0.2869,-317.5891],[161.7416,0.2884,-320.356],[162.2475,0.2898,-323.1376],[162.7259,0.2913,-325.9339],[163.1766,0.2927,-328.7443],[163.599,0.2942,-331.5688],[163.993,0.2956,-334.4069],[164.358,0.2971,-337.2583],[164.6938,0.2985,-340.1228],[165.0,0.3,-343.0],[165.1409,0.3113,-343.6682],[165.2907,0.3127,-346.3542],[165.4487,0.314,-349.0571],[165.6146,0.3152,-351.7761],[165.7878,0.3164,-354.5103],[165.9678,0.3176,-357.2588],[166.1541,0.3188,-360.0209],[166.3464,0.3199,-362.7956],[166.5439,0.321,-365.5822],[166.7463,0.3221,-368.3798],[166.9531,0.3231,-371.1875],[167.1638,0.3241,-374.0045],[167.3778,0.3251,-376.83],[167.5948,0.3261,-379.663],[167.8141,0.327,-382.5029],[168.0353,0.3279,-385.3486],[168.2579,0.3287,-388.1994],[168.4815,0.3295,-391.0545],[168.7055,0.3303,-393.9129],[168.9294,0.3311,-396.7739],[169.1527,0.3318,-399.6365],[169.375,0.3325,-402.5],[169.5957,0.3332,-405.3635],[169.8144,0.3338,-408.2261],[170.0306,0.3344,-411.0871],[170.2437,0.335,-413.9455],[170.4533,0.3355,-416.8006],[170.6589,0.336,-419.6514],[170.86,0.3365,-422.4971],[171.0561,0.337,-425.337],[171.2467,0.3374,-428.17],[171.4313,0.3378,-430.9955],[171.6094,0.3381,-433.8125],[171.7805,0.3385,-436.6202],[171.9442,0.3387,-439.4178],[172.0999,0.339,-442.2044],[172.2472,0.3392,-444.9791],[172.3855,0.3394,-447.7412],[172.5144,0.3396,-450.4897],[172.6334,0.3398,-453.2239],[172.7419,0.3399,-455.9429],[172.8395,0.3399,-458.6458],[172.9257,0.34,-461.3318],[173.0,0.34,-464.0],[176.4,0.34,-468],[177,0.34,-474]];
export const FREIGHT_TERMINAL_COLLIDERS = Object.freeze([{"id":"main_warehouse","shape":"aabb","center":[-153,12,96],"size":[274,21,102],"kind":"building"},{"id":"admin_office","shape":"aabb","center":[12,11,94],"size":[37,18.5,43],"kind":"building"},{"id":"gate_office","shape":"aabb","center":[39,3.1,-145],"size":[12,5.5,12],"kind":"building"},{"id":"cargo_stack_r0_c0","shape":"aabb","center":[-269,1.76,-105],"size":[6.05,2.92,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r0_c1","shape":"aabb","center":[-254,3.2199999999999998,-105],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r0_c2","shape":"aabb","center":[-239,3.2199999999999998,-105],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r0_c3","shape":"aabb","center":[-224,3.2199999999999998,-105],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r0_c4","shape":"aabb","center":[-209,1.76,-105],"size":[6.05,2.92,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r0_c5","shape":"aabb","center":[-194,3.2199999999999998,-105],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r1_c0","shape":"aabb","center":[-269,3.2199999999999998,-134],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r1_c1","shape":"aabb","center":[-254,3.2199999999999998,-134],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r1_c2","shape":"aabb","center":[-239,1.76,-134],"size":[6.05,2.92,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r1_c3","shape":"aabb","center":[-224,3.2199999999999998,-134],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r1_c4","shape":"aabb","center":[-209,3.2199999999999998,-134],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r1_c5","shape":"aabb","center":[-194,3.2199999999999998,-134],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r2_c0","shape":"aabb","center":[-269,1.76,-163],"size":[6.05,2.92,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r2_c1","shape":"aabb","center":[-254,3.2199999999999998,-163],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r2_c2","shape":"aabb","center":[-239,3.2199999999999998,-163],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r2_c3","shape":"aabb","center":[-224,3.2199999999999998,-163],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r2_c4","shape":"aabb","center":[-209,1.76,-163],"size":[6.05,2.92,13.1],"kind":"cargo_stack"},{"id":"cargo_stack_r2_c5","shape":"aabb","center":[-194,3.2199999999999998,-163],"size":[6.05,5.84,13.1],"kind":"cargo_stack"},{"id":"DockTruck_01","shape":"aabb","center":[-277.0,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_02","shape":"aabb","center":[-260.8,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_03","shape":"aabb","center":[-244.6,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_04","shape":"aabb","center":[-228.4,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_05","shape":"aabb","center":[-212.2,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_06","shape":"aabb","center":[-196.0,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_07","shape":"aabb","center":[-179.8,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_08","shape":"aabb","center":[-163.6,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_09","shape":"aabb","center":[-147.4,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_10","shape":"aabb","center":[-131.2,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_11","shape":"aabb","center":[-115.0,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_12","shape":"aabb","center":[-98.8,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"DockTruck_13","shape":"aabb","center":[-82.6,2.6,24.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"StagingTruck_01","shape":"aabb","center":[-258,2.6,-196.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"StagingTruck_02","shape":"aabb","center":[-227,2.6,-196.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"StagingTruck_03","shape":"aabb","center":[-196,2.6,-196.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"StagingTruck_04","shape":"aabb","center":[-165,2.6,-196.5],"size":[2.95,5.2,22.5],"kind":"parked_tractor_trailer"},{"id":"fuel_pump_5","shape":"aabb","center":[5,1.56,-28],"size":[1.25,3,1.8],"kind":"fuel_pump"},{"id":"fuel_pump_19","shape":"aabb","center":[19,1.56,-28],"size":[1.25,3,1.8],"kind":"fuel_pump"}]);
const clamp = (value,min,max)=>Math.max(min,Math.min(max,value));
export function terminalWorldPoint(site,local){
  const x=local[0],z=local[2],c=Math.cos(site.yaw),s=Math.sin(site.yaw);
  return {x:site.x+c*x+s*z,y:site.y+local[1],z:site.z-s*x+c*z};
}
export function terminalLocalPoint(site,point){
  const x=point.x-site.x,z=point.z-site.z,c=Math.cos(site.yaw),s=Math.sin(site.yaw);
  return {x:c*x-s*z,y:point.y-site.y,z:s*x+c*z};
}
function siteFor(course){
  const point=course.generatorVersion===ROAD_V3_VERSION
    ?playableRoadV3Point(course,FREIGHT_TERMINAL_MERGE_PROGRESS)
    :endlessHighwayPoint(course,FREIGHT_TERMINAL_MERGE_PROGRESS);
  if(!point||![point.x,point.y,point.z,point.heading].every(Number.isFinite))
    throw new Error('Freight terminal requires a sampled highway frame');
  const yaw=point.heading-Math.PI,c=Math.cos(yaw),s=Math.sin(yaw);
  return {id:FREIGHT_TERMINAL_VERSION,yaw,
    x:point.x-c*LOCAL_MERGE[0]-s*LOCAL_MERGE[2],
    y:point.y-LOCAL_MERGE[1],
    z:point.z+s*LOCAL_MERGE[0]-c*LOCAL_MERGE[2],
    mergeProgress:FREIGHT_TERMINAL_MERGE_PROGRESS,
    spawnLocal:[...LOCAL_SPAWN]};
}
// Pads only the warehouse and truck-staging yard, with a smooth perimeter.
// The existing road surface system grades the ramp and highway separately.
export function freightTerminalGroundHeight(course,x,z,underlying){
  const site=course?.freightTerminal;
  if(!site||!Number.isFinite(underlying))return underlying;
  const p=terminalLocalPoint(site,{x,z,y:site.y});
  const dx=Math.max(-318-p.x,0,p.x-45);
  const dz=Math.max(-230-p.z,0,p.z-225);
  const dist=Math.hypot(dx,dz);
  if(dist>=48)return underlying;
  const t=clamp(dist/48,0,1),smooth=t*t*(3-2*t);
  return site.y+0.035+(underlying-site.y-0.035)*smooth;
}
function rampEdge(course,site){
  const samples=RAMP_LOCAL.map(p=>terminalWorldPoint(site,p));
  // Snap the final road sample exactly onto the real seeded highway deck.
  const merge=course.generatorVersion===ROAD_V3_VERSION
    ?playableRoadV3Point(course,FREIGHT_TERMINAL_MERGE_PROGRESS)
    :endlessHighwayPoint(course,FREIGHT_TERMINAL_MERGE_PROGRESS);
  samples[samples.length-1]={x:merge.x,y:merge.y,z:merge.z};
  let distance=0;const lengths=[0];
  for(let i=1;i<samples.length;i++){
    distance+=Math.hypot(samples[i].x-samples[i-1].x,samples[i].z-samples[i-1].z);
    lengths.push(distance);
  }
  for(let i=0;i<samples.length;i++){
    const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)];
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
    Object.assign(samples[i],{heading:Math.atan2(dx,dz),nx:dz/len,nz:-dx/len,
      width:i<3?11:8.6,bank:0,grade:(b.y-a.y)/len,structure:null,
      laneFactor:3,laneCount:1,
      progress:FREIGHT_TERMINAL_MERGE_PROGRESS*lengths[i]/Math.max(1,distance)});
  }
  const edge={id:'terminal:start-ramp',from:'terminal:spawn',to:'endless:node:1',
    branchId:'terminal:exit',branchName:'Freight Terminal On-ramp',
    type:'terminal-onramp',roadClass:'paved-regional',surface:'paved',
    width:8.6,laneCount:1,laneWidth:3.8,roughness:.025,
    optional:false,endless:true,modular:true,generatorVersion:course.generatorVersion,
    startProgress:0,endProgress:FREIGHT_TERMINAL_MERGE_PROGRESS,
    samples,sectionIndex:0,length:distance};
  return edge;
}
// Fresh journeys get the start hub. Resuming older saves never silently changes
// their geography; only checkpoints explicitly marked with this hub restore it.
export function attachFreightTerminalStart(course,{enabled=true}={}){
  if(!course?.endless||!enabled)return course;
  const site=siteFor(course),edge=rampEdge(course,site);
  const origin=edge.samples[0];
  course.freightTerminal=site;
  course.edges=[...course.edges.filter(item=>item.id!==edge.id),edge];
  course.nodes=[...course.nodes.filter(item=>item.id!=='terminal:spawn'),
    {id:'terminal:spawn',x:origin.x,y:origin.y,z:origin.z,progress:0,branchId:'terminal:exit'}];
  course.origin={id:'terminal:spawn',x:origin.x,y:origin.y,z:origin.z,
    heading:origin.heading,progress:0};
  const corners=[[-365,-275],[-365,260],[75,-275],[75,260]].map(([x,z])=>terminalWorldPoint(site,[x,0,z]));
  course.bounds={...course.bounds,
    minX:Math.min(course.bounds.minX,...corners.map(p=>p.x)),maxX:Math.max(course.bounds.maxX,...corners.map(p=>p.x)),
    minZ:Math.min(course.bounds.minZ,...corners.map(p=>p.z)),maxZ:Math.max(course.bounds.maxZ,...corners.map(p=>p.z))};
  course.maxRoadWidth=Math.max(course.maxRoadWidth||0,11);
  return course;
}
export function terminalObstacleVolumes(site){
  return FREIGHT_TERMINAL_COLLIDERS.map(source=>{
    const world=terminalWorldPoint(site,source.center);
    return {id:'freight-terminal:'+source.id,x:world.x,y:world.y-source.size[1]/2,
      z:world.z,height:source.size[1],radius:Math.min(25,Math.hypot(source.size[0],source.size[2])/2),
      kind:'terminal-solid',width:source.size[0],length:source.size[2]};
  });
}
