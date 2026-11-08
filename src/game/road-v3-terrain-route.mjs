// Opt-in terrain-first Road V3 alignment. Consumes the same deterministic
// natural-height field as World; does not install a second world or road host.
// Every section is reconstructed from (seed, fixed index) without mutable RNG.
import {hashText} from './shared.mjs';
import {roadV3NaturalHeight} from './landscape-style.mjs';
import {ROAD_V3_VERSION, ROAD_V3_LIMITS} from './road-v3-geometry.mjs';

export const TERRAIN_ROAD_V3 = Object.freeze({
  schema: 'long-haul.road-v3-terrain/1', regionLength: 1024,
  samplesPerRegion: 64, roadWidth: 24, lanes: 5,
  maxBank: .085, bankDesignSpeed: 30, maxBridgeRise: 13,
  maxCutDepth: 7, maxFillHeight: 3
});
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const blend = (a,b,t) => a+(b-a)*t;
const wrap = a => Math.atan2(Math.sin(a),Math.cos(a));
const hashUnit = (seed,tag) => (hashText(`${seed}:terrain-route:${tag}`)>>>0)/4294967295;
const H = (seed,x,z)=>roadV3NaturalHeight(seed,x,z);

// Construction belongs to the actual projected surface, not to the earlier
// straight-road template. Bridges keep the valley terrain below intact;
// cut/fill roadbeds deform only their local terrain-influence region.
export function classifyTerrainRoadV3Structure(seed, point, authored = null) {
  const difference = point.y - H(seed, point.x, point.z);
  // The V2 road template is only a topology recipe. An old bridge tag may
  // land *inside a mountain* after V3 alignment and must not disable carving.
  // Likewise, retain a gallery only where the new terrain actually covers it.
  if (authored === 'bridge' && difference > TERRAIN_ROAD_V3.maxFillHeight) return 'bridge';
  if (difference > TERRAIN_ROAD_V3.maxBridgeRise) return 'bridge';
  if (difference > TERRAIN_ROAD_V3.maxFillHeight) return 'fill';
  if (difference < -TERRAIN_ROAD_V3.maxCutDepth)
    return authored === 'tunnel' ? 'tunnel' : 'cut';
  return null;
}

// A fixed-index candidate selection, not a global optimization or a load-order
// dependent random walk. Terrain and construction cost select the corridor;
// low-pass anchors smooth it into a legible freeway instead of a zigzag.
function preferredX(seed,index) {
  if (index <= 0) return 0;
  const z=-index*TERRAIN_ROAD_V3.regionLength;
  let best=null;
  for(let i=-4;i<=4;i++){
    const x=i*110;
    const h=H(seed,x,z), ax=(H(seed,x+45,z)-H(seed,x-45,z))/90;
    const az=(H(seed,x,z+45)-H(seed,x,z-45))/90;
    const score=h*.72+Math.abs(ax)*47+Math.abs(az)*20+Math.abs(x)*.004
      +hashUnit(seed,`${index}:${i}:tie`)*.6;
    if(!best||score<best.score)best={score,x};
  }
  return best.x;
}
function anchor(seed,index,cache){
  if(cache.has(index))return cache.get(index);
  const x=index<=0?0:(preferredX(seed,index-1)*.2+preferredX(seed,index)*.6+preferredX(seed,index+1)*.2);
  const z=-index*TERRAIN_ROAD_V3.regionLength;
  const local=H(seed,x,z);
  const prev=H(seed,x,z+TERRAIN_ROAD_V3.regionLength);
  const next=H(seed,x,z-TERRAIN_ROAD_V3.regionLength);
  // Vertical grading uses the landform, not a preset elevation wave. Gentle
  // filtering intentionally creates small cuts/fills and occasional bridges.
  const y=.55*local+.225*(prev+next)+1.2;
  const value={x,y,z};cache.set(index,value);return value;
}
const catmull=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function roadPoint(seed,section,t,cache){
  const a=anchor(seed,section-1,cache), b=anchor(seed,section,cache),
    c=anchor(seed,section+1,cache), d=anchor(seed,section+2,cache);
  return {x:catmull(a.x,b.x,c.x,d.x,t), y:catmull(a.y,b.y,c.y,d.y,t),
    z:blend(b.z,c.z,t)};
}
function pointAtDistance(seed,distance,cache){
  const normalized=distance/TERRAIN_ROAD_V3.regionLength;
  const section=Math.floor(normalized);
  return roadPoint(seed,section,normalized-section,cache);
}
function sampleAt(seed,section,i,cache){
  const t=i/TERRAIN_ROAD_V3.samplesPerRegion;
  const s=(section+t)*TERRAIN_ROAD_V3.regionLength;
  const p=pointAtDistance(seed,s,cache),lo=pointAtDistance(seed,s-5,cache),hi=pointAtDistance(seed,s+5,cache);
  const dx=hi.x-lo.x,dz=hi.z-lo.z,length=Math.hypot(dx,dz)||1;
  const heading=Math.atan2(dx,dz),nx=dz/length,nz=-dx/length;
  const a=pointAtDistance(seed,s-12,cache),b=pointAtDistance(seed,s+12,cache);
  const aHeading=Math.atan2(p.x-a.x,p.z-a.z),bHeading=Math.atan2(b.x-p.x,b.z-p.z);
  const curvature=wrap(bHeading-aHeading)/Math.max(1,Math.hypot(b.x-a.x,b.z-a.z));
  const bank=clamp(curvature*TERRAIN_ROAD_V3.bankDesignSpeed**2/9.81*.62,
    -TERRAIN_ROAD_V3.maxBank,TERRAIN_ROAD_V3.maxBank);
  const grade=(hi.y-lo.y)/length;
  return {...p,heading,nx,nz,grade,bank,curvature,
    width:TERRAIN_ROAD_V3.roadWidth,laneFactor:3,
    structure:classifyTerrainRoadV3Structure(seed,p)};
}
// Sample the same terrain-first alignment by absolute distance without
// materializing or retaining any region. The playable V2-compatible topology
// adapter uses this pure query to keep seeded junctions and roads in one world.
export function createTerrainRoadV3Sampler(seed) {
  if(typeof seed!=='string'||!seed)throw new TypeError('Invalid V3 terrain seed');
  const anchors=new Map(),samples=new Map();
  return progress=>{
    if(!Number.isFinite(progress))throw new TypeError('Invalid V3 road progress');
    if(samples.has(progress))return samples.get(progress);
    const section=Math.floor(progress/TERRAIN_ROAD_V3.regionLength);
    const local=(progress/TERRAIN_ROAD_V3.regionLength-section)*TERRAIN_ROAD_V3.samplesPerRegion;
    const value=sampleAt(seed,section,local,anchors);
    if(samples.size>=1024)samples.delete(samples.keys().next().value);
    samples.set(progress,value);
    // Streaming only retains a small vicinity. Old anchors can always be
    // reconstructed from seed and index on return; they carry no authority.
    if(anchors.size>96){const keep=[...anchors.entries()].slice(-32);anchors.clear();for(const [k,v] of keep)anchors.set(k,v);}
    return value;
  };
}
export function terrainRoadV3Sample(seed,progress) {
  return createTerrainRoadV3Sampler(seed)(progress);
}

function sectionEdge(seed,index,startProgress){
  const cache=new Map(), samples=[];
  for(let i=0;i<=TERRAIN_ROAD_V3.samplesPerRegion;i++){
    const sample=sampleAt(seed,index,i,cache),prev=samples.at(-1);
    sample.progress=prev?prev.progress+Math.hypot(sample.x-prev.x,sample.z-prev.z):startProgress;
    samples.push(sample);
  }
  const endProgress=samples.at(-1).progress;
  return {id:`v3:terrain:${index}`,from:`v3:terrain:${index}:start`,to:`v3:terrain:${index}:end`,
    type:'endless-highway',kind:'terrain-aligned',branchId:'trunk',branchName:'Terrain highway',
    roadClass:'highway',surface:'paved',width:TERRAIN_ROAD_V3.roadWidth,
    laneCount:TERRAIN_ROAD_V3.lanes,laneWidth:3.4,roughness:.03,
    optional:false,endless:true,modular:true,generatorVersion:ROAD_V3_VERSION,
    samples,startProgress,endProgress,length:endProgress-startProgress};
}
function materialize(seed,directory,{from,to,revision}){
  const edges=[];
  for(let index=from;index<=to;index++){
    const record=directory[index],edge=sectionEdge(seed,index,record.startProgress);
    if(Math.abs(edge.endProgress-record.endProgress)>1e-6)
      throw new Error(`V3 terrain section ${index} failed deterministic reconstruction`);
    edges.push(edge);
  }
  const nodes=edges.flatMap(e=>[
    {id:e.from,...e.samples[0]}, {id:e.to,...e.samples.at(-1)}]);
  return {schema:TERRAIN_ROAD_V3.schema,generatorVersion:ROAD_V3_VERSION,terrainAware:true,
    seed,revision,edges,nodes,crossings:[],totalProgress:directory.at(-1).endProgress,
    maxRoadWidth:TERRAIN_ROAD_V3.roadWidth,endless:true,depots:[],signs:[],roundabouts:[],optionalRoads:[],
    directory,activeRegionRange:{from,to},
    persistence:{seed,version:ROAD_V3_VERSION,layoutRevision:3,sections:directory.length},
    description:'terrain-first deterministic continuous five-lane highway'};
}
export function extendTerrainRoadV3Stream(stream,{addMountains=1,focusProgress=0,behind=2,ahead=3}={}){
  if(!stream||typeof stream.seed!=='string'||!Array.isArray(stream.directory))throw new TypeError('Invalid V3 terrain stream');
  if(!Number.isInteger(addMountains)||addMountains<0||addMountains>8||
    !Number.isInteger(behind)||behind<0||behind>8||!Number.isInteger(ahead)||ahead<0||ahead>8||
    !Number.isFinite(focusProgress))throw new RangeError('Invalid V3 terrain stream window');
  const directory=stream.directory.map(entry=>({...entry}));
  for(let i=0;i<addMountains;i++){
    const startProgress=directory.at(-1)?.endProgress??0;
    const edge=sectionEdge(stream.seed,directory.length,startProgress);
    directory.push({index:directory.length,startProgress,endProgress:edge.endProgress});
  }
  if(!directory.length)throw new RangeError('Empty V3 terrain stream');
  const at=directory.findIndex(entry=>focusProgress<=entry.endProgress);
  const center=at<0?directory.length-1:at;
  return materialize(stream.seed,directory,{from:Math.max(0,center-behind),
    to:Math.min(directory.length-1,center+ahead),revision:(stream.revision??0)+1});
}
export function createTerrainRoadV3Stream(seed,{initialMountains=3,focusProgress=0}={}) {
  if(typeof seed!=='string'||!seed)throw new TypeError('Terrain-aware V3 requires a nonempty seed');
  if(!Number.isInteger(initialMountains)||initialMountains<1||initialMountains>8)throw new RangeError('Invalid initial terrain-road window');
  return extendTerrainRoadV3Stream({seed,directory:[],revision:0},{addMountains:initialMountains,focusProgress});
}
export function ensureTerrainRoadV3Ahead(stream,progress,{lead=2500}={}){
  if(!Number.isFinite(progress)||!Number.isFinite(lead)||lead<0||lead>15000)throw new RangeError('Invalid terrain-road lookahead');
  const remaining=stream.totalProgress-progress;
  const grow=remaining<lead?Math.min(3,Math.ceil((lead-remaining)/TERRAIN_ROAD_V3.regionLength)):0;
  const at=stream.directory.findIndex(entry=>progress<=entry.endProgress);
  const center=at<0?stream.directory.length-1:at;
  const from=Math.max(0,center-2),to=Math.min(stream.directory.length-1,center+3);
  if(!grow&&stream.activeRegionRange?.from===from&&stream.activeRegionRange?.to===to)return stream;
  return extendTerrainRoadV3Stream(stream,{addMountains:grow,focusProgress:progress});
}
