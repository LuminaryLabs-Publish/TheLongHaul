// Local, in-memory acceleration for repeated route/terrain queries.
// WeakMap keeps the index out of serialized course packages and saves.
const cache=new WeakMap();
const size=192;
const key=(x,z)=>x+":"+z;
const noSegments=Object.freeze([]);
export function roadIndex(course){
 if(!course||typeof course!=="object")return null;
 const cached=cache.get(course);
 if(cached&&cached.edges===course.edges&&cached.edgeCount===(course.edges?.length??0))return cached;
 const cells=new Map(),segments=[];
 for(const edge of course.edges||[])for(let i=1;i<(edge.samples?.length||0);i++){
  const a=edge.samples[i-1],b=edge.samples[i];
  if(!Number.isFinite(a.x+a.z+b.x+b.z))continue;
  const entry={a,b,edge,segmentIndex:i-1},id=segments.push(entry)-1;
  const padding=Math.max(48,(Number(edge.width)||18)*2);
  const x0=Math.floor((Math.min(a.x,b.x)-padding)/size),x1=Math.floor((Math.max(a.x,b.x)+padding)/size);
  const z0=Math.floor((Math.min(a.z,b.z)-padding)/size),z1=Math.floor((Math.max(a.z,b.z)+padding)/size);
  for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){
    const k=key(x,z);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(id);
  }
 }
 const index={edges:course.edges,edgeCount:course.edges?.length??0,cells,segments,terrainCells:new Map()};
 cache.set(course,index);return index;
}
export function roadSegmentsNear(course,bounds){
 const index=roadIndex(course);if(!index)return [];
 const x0=Math.floor(bounds.minX/size),x1=Math.floor(bounds.maxX/size);
 const z0=Math.floor(bounds.minZ/size),z1=Math.floor(bounds.maxZ/size);
 const ids=new Set();
 for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(const id of index.cells.get(key(x,z))||[])ids.add(id);
 return [...ids].map(id=>index.segments[id]);
}
export function candidateRoadSegments(course,point){
 const index=roadIndex(course);if(!index)return [];
 const x=Math.floor(point.x/size),z=Math.floor(point.z/size),ids=new Set();
 for(let radius=0;radius<=3;radius++){
  for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++)for(const id of index.cells.get(key(x+dx,z+dz))||[])ids.add(id);
  if(ids.size&&radius>=1){const list=[...ids].map(id=>index.segments[id]); const near=list.some(({a,b})=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(point.x-a.x-t*dx,point.z-a.z-t*dz)<size*radius;});if(near)return list;}
 }
 return index.segments; // preserves exact nearest semantics beyond populated cells
}

// Bounded terrain influence: the index already pads every road by >=48 metres.
export function terrainRoadSegments(course, point) {
 const index=roadIndex(course);if(!index)return noSegments;
 const cellKey=key(Math.floor(point.x/size),Math.floor(point.z/size));
 const ids=index.cells.get(cellKey);if(!ids)return noSegments;
 let entries=index.terrainCells.get(cellKey);
 if(!entries){entries=ids.map(id=>index.segments[id]);index.terrainCells.set(cellKey,entries)}
 return entries;
}
