// Deterministic, bounded side-town planning on the existing Endless road graph.
// Authored buildings remain asset identities; this planner owns only placement.
// All routes connect to the *same* trunk nodes at both ends, not dead ends.
import {roadChunkSample,ROAD_GENERATOR_VERSION} from './road-chunks.mjs';
import {edgeLength,hashText} from './shared.mjs';

export const TOWN_LAYOUT_VERSION='long-haul:connected-settlements/2';
export const CITY_DISTRICT_OFFSET_METERS=720;
export const ROAD_USE_ZONES=Object.freeze({
  residential:['House_Cottage','House_Craftsman','House_Victorian','House_TwoStory','House_Townhouse','House_Ranch','House_Modern','House_SplitLevel','House_Duplex','House_Bungalow'],
  commercial:['Shop_Cafe','Shop_CornerMarket','Shop_Bookstore','Apartment_LowRise'],
  services:['Garage_Detached','Shed_Garden'],civic:['Gazebo_Park']
});
export const TOWN_FIRST_SECTION=8;
export const TOWN_SECTION_STRIDE=12;
export const TOWN_SPAN_SECTIONS=2;
export const TOWN_ASSET_IDS=Object.freeze([
  'Apartment_LowRise','Garage_Detached','Gazebo_Park','House_Bungalow',
  'House_Cottage','House_Craftsman','House_Duplex','House_Modern',
  'House_Ranch','House_SplitLevel','House_Townhouse','House_TwoStory',
  'House_Victorian','Shed_Garden','Shop_Bookstore','Shop_Cafe','Shop_CornerMarket'
]);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
const towns=Object.freeze(['Meadow Creek','Cedar Crossing','Brookline','Fox Hollow','Willow Junction','Larkspur','Redstone']);
const NODE_PREFIX='endless:node:';
const trunkNode=index=>index===0?'origin':NODE_PREFIX+index;
const point=(seed,progress,offset)=>{
  const p=roadChunkSample(seed,progress);
  return {x:p.x+p.nx*offset,z:p.z+p.nz*offset,y:p.y+p.bank*offset,
    progress,width:12,laneFactor:3,bank:0,structure:null};
};
function frame(seed,start,progress,side){
  const t=(progress-start)/640,offset=side*178*smooth(t/.25)*smooth((1-t)/.25);
  const p=point(seed,progress,offset),lo=point(seed,progress-1,side*178*smooth((t-1/640)/.25)*smooth((1-t+1/640)/.25)),
    hi=point(seed,progress+1,side*178*smooth((t+1/640)/.25)*smooth((1-t-1/640)/.25));
  const dx=hi.x-lo.x,dz=hi.z-lo.z,length=Math.hypot(dx,dz)||1;
  return {...p,heading:Math.atan2(dx,dz),nx:dz/length,nz:-dx/length,grade:(hi.y-lo.y)/length};
}

/** Connected outer city excursion, with explicit frontage and zoning.
 * Roads join the existing town loop at two distinct junctions.
 * Stable seed/progress identities survive streaming rebuilds. */
function generateOutlyingDistrict(seed,startSection,start,side,name,baseId){
  if(startSection%24!==20)return null;
  const id=baseId+':outer',amplitude=CITY_DISTRICT_OFFSET_METERS;
  const location=progress=>{
    const t=Math.max(0,Math.min(1,(progress-start-160)/320));
    const base=frame(seed,start,progress,side),bow=side*amplitude*Math.sin(Math.PI*t)**2;
    return {...base,x:base.x+base.nx*bow,z:base.z+base.nz*bow,width:11,laneFactor:3,bank:0,structure:null};
  };
  const sample=progress=>{
    const p=location(progress),lo=location(Math.max(start+160,progress-1)),hi=location(Math.min(start+480,progress+1));
    const dx=hi.x-lo.x,dz=hi.z-lo.z,len=Math.hypot(dx,dz)||1;
    return {...p,heading:Math.atan2(dx,dz),nx:dz/len,nz:-dx/len,grade:(hi.y-lo.y)/len};
  };
  const edges=[],nodes=[],zones=['residential','commercial','civic','services'];
  for(let i=0;i<4;i++){
    const begin=start+160+i*80,samples=[];
    for(let j=0;j<=40;j++)samples.push(sample(begin+j*2));
    const from=i===0?baseId+':junction:1':id+':junction:'+i;
    const to=i===3?baseId+':junction:3':id+':junction:'+(i+1);
    if(i>0)nodes.push({id:from,...samples[0],branchId:id});
    edges.push({id:id+':road:'+i,from,to,branchId:id,branchName:name+' Outer District',
      type:'town-district',districtZone:zones[i],roadClass:'paved-regional',surface:'paved',
      width:11,laneCount:2,laneWidth:3.4,roughness:.05,optional:true,endless:true,
      modular:true,generatorVersion:ROAD_GENERATOR_VERSION,sectionIndex:startSection+.5+i*.25,
      startProgress:begin,endProgress:begin+80,samples,length:edgeLength({samples})});
  }
  const selected=[...ROAD_USE_ZONES.residential.slice(0,6),...ROAD_USE_ZONES.commercial,
    ...ROAD_USE_ZONES.services,...ROAD_USE_ZONES.civic],parcels=[];
  for(let i=0;i<selected.length;i++){
    const progress=start+214+i*17,road=sample(progress),assetId=selected[i],
      index=Math.min(3,Math.floor((progress-start-160)/80)),sideOfRoad=i%2?1:-1;
    parcels.push({id:id+':building:'+i,assetId,townId:baseId,districtId:id,
      roadEdgeId:edges[index].id,zone:edges[index].districtZone,
      purpose:edges[index].districtZone,progress,
      x:road.x+road.nx*sideOfRoad*27,z:road.z+road.nz*sideOfRoad*27,y:road.y,
      heading:road.heading+(sideOfRoad>0?0:Math.PI)});
  }
  const trees=[];
  for(let i=0;i<30;i++){
    const progress=start+180+i*10,road=sample(progress),offset=(i%2?1:-1)*42;
    trees.push({id:id+':tree:'+i,assetId:'Tree_Maple',zone:'landscaping',
      roadEdgeId:edges[Math.min(3,Math.floor((progress-start-160)/80))].id,
      progress,x:road.x+road.nx*offset,z:road.z+road.nz*offset,y:road.y});
  }
  const center=sample(start+320),branch={id,name:name+' Outer District',optional:true,
    nodeIds:[edges[0].from,...nodes.map(n=>n.id),edges.at(-1).to],
    edgeIds:edges.map(e=>e.id),length:edges.reduce((n,e)=>n+e.length,0)};
  return {id,center,edges,nodes,parcels,trees,branch,maximumDistance:amplitude+178};
}
export function townStartsInWindow(first,last){
  const min=Math.max(0,Math.ceil((first-TOWN_FIRST_SECTION)/TOWN_SECTION_STRIDE));
  const max=Math.floor((last+1-TOWN_SPAN_SECTIONS-TOWN_FIRST_SECTION)/TOWN_SECTION_STRIDE);
  return Array.from({length:Math.max(0,max-min+1)},(_,i)=>TOWN_FIRST_SECTION+(min+i)*TOWN_SECTION_STRIDE);
}
export function generateConnectedTown(seed,startSection){
  if(typeof seed!=='string'||!seed||!Number.isInteger(startSection)||startSection<TOWN_FIRST_SECTION||(startSection-TOWN_FIRST_SECTION)%TOWN_SECTION_STRIDE)
    throw new TypeError('Invalid town seed or section');
  const start=startSection*320,side=(hashText(`${seed}:town:${startSection}:side`)&1)?1:-1,
    id=`town:${startSection}`,roadId=`${id}:loop`,modelOrder=[...TOWN_ASSET_IDS],name=towns[hashText(`${seed}:town:${startSection}:name`)%towns.length];
  // Fixed seeded rotation preserves every delivered building model in a town.
  const rotation=hashText(`${seed}:${id}:models`)%modelOrder.length;
  modelOrder.push(...modelOrder.splice(0,rotation));
  const edges=[],nodes=[];
  for(let sub=0;sub<4;sub++){
    const begin=start+sub*160,samples=[];
    for(let step=0;step<=32;step++)samples.push(frame(seed,start,begin+step*5,side));
    const from=sub===0?trunkNode(startSection):`${id}:junction:${sub}`,
      to=sub===3?trunkNode(startSection+2):`${id}:junction:${sub+1}`;
    if(sub>0)nodes.push({id:from,...samples[0],branchId:roadId});
    edges.push({id:`${roadId}:${sub}`,from,to,branchId:roadId,branchName:name,
      type:'town-loop',roadClass:'paved-regional',surface:'paved',width:12,
      laneCount:2,laneWidth:3.4,roughness:.035,optional:true,endless:true,
      modular:true,generatorVersion:ROAD_GENERATOR_VERSION,
      sectionIndex:startSection+sub*.5,startProgress:begin,endProgress:begin+160,
      samples,length:edgeLength({samples})});
  }
  const parcels=[];
  for(let i=0;i<modelOrder.length;i++){
    const progress=start+178+Math.floor(i/2)*35+(i%2)*3;
    const road=frame(seed,start,progress,side),streetSide=i%2===0?1:-1,
      setback=streetSide*25;
    parcels.push({id:`${id}:building:${i}`,assetId:modelOrder[i],townId:id,progress,
      x:road.x+road.nx*setback,z:road.z+road.nz*setback,y:road.y,
      heading:road.heading+(streetSide>0?0:Math.PI),
      purpose:modelOrder[i].startsWith('Shop_')?'retail':modelOrder[i]==='Garage_Detached'?'garage':
        modelOrder[i].startsWith('House_')?'residential':'civic'});
  }
  const look=frame(seed,start,start-95,side);
  const sign={id:`${id}:sign`,x:look.x+look.nx*(side*25),z:look.z+look.nz*(side*25),
    heading:look.heading+Math.PI,title:name.toUpperCase(),subtitle:'TOWN LOOP / HIGHWAY RETURNS',
    arrow:side===1?'↖':'↗',color:'#f5ce6e',side:side===1?'left':'right',progress:start-95,kind:'town-exit'};
  const routeChoice={id:`${id}:choice`,kind:'town-loop',label:name,side:sign.side,
    signIds:[sign.id],entryEdgeId:edges[0].id,exitEdgeId:edges.at(-1).id,
    fallbackEdgeIds:[`endless:highway:${startSection}`,`endless:highway:${startSection+1}`],
    warningProgress:start-95,entryProgress:start,exitProgress:start+640};
  const center=frame(seed,start,start+320,side),outer=generateOutlyingDistrict(seed,startSection,start,side,name,id);
  const town={id,name,kind:outer?'outlying-city':startSection%24===8?'town':'city-fringe',layoutVersion:TOWN_LAYOUT_VERSION,
    progress:start+320,x:center.x,z:center.z,y:center.y,side,
    roadIds:[...edges.map(e=>e.id),...(outer?.edges.map(e=>e.id)??[])],entryNodeId:edges[0].from,exitNodeId:edges.at(-1).to,
    outerDistrictId:outer?.id??null,outerCenter:outer?.center??null,
    outlyingParcels:outer?.parcels??[],trees:outer?.trees??[],distanceFromHighway:outer?.maximumDistance??178,parcels};
  return {town,edges,nodes,outerEdges:outer?.edges??[],outerNodes:outer?.nodes??[],outerBranch:outer?.branch??null,
    sign,routeChoice,branch:{id:roadId,name,optional:true,
    nodeIds:[edges[0].from,...nodes.map(n=>n.id),edges.at(-1).to],
    edgeIds:edges.map(e=>e.id),length:edges.reduce((sum,e)=>sum+e.length,0)}};
}
export function connectedTownReachability(course){
  const graph=new Map();
  for(const edge of course?.edges||[]){
    if(!graph.has(edge.from))graph.set(edge.from,new Set());
    graph.get(edge.from).add(edge.to);
    // Town streets and the highway are locally bidirectional. Directed graph
    // checks still require each town to connect to both trunk junctions.
    if(!graph.has(edge.to))graph.set(edge.to,new Set());
    graph.get(edge.to).add(edge.from);
  }
  const visits=start=>{const seen=new Set([start]),queue=[start];for(let i=0;i<queue.length;i++)for(const n of graph.get(queue[i])||[])if(!seen.has(n)){seen.add(n);queue.push(n);}return seen;};
  return (course?.towns||[]).every(t=>{
    const accessible=visits(t.entryNodeId);
    return accessible.has(t.exitNodeId)&&t.roadIds.every(id=>{
      const edge=course.edges.find(e=>e.id===id);
      return !!edge&&accessible.has(edge.from)&&accessible.has(edge.to);
    })&&[...t.parcels,...(t.outlyingParcels??[])].every(p=>Number.isFinite(p.x+p.z+p.y));
  });
}
