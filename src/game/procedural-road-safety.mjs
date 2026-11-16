// New Endless highway safety policy. Does not rewrite existing saved journeys.
// The road graph, terrain and truck share the same accepted V3 road samples.
export const PROCEDURAL_SAFE_PREFIX = 'haul-procedural-safe-';
export const isProceduralSafeRun = seed => typeof seed === 'string' && seed.startsWith(PROCEDURAL_SAFE_PREFIX);
const finite = Number.isFinite;
const separation = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

// For now, safely omit optional scenic/town/constructed road systems that have
// not passed junction/traversal validation. The accepted highway and freight
// branches are completely procedural and retain their canonical graph IDs.
export function eligibleProceduralEdge(edge) {
  return edge?.type === 'endless-highway' && edge.branchId === 'trunk'
    || edge?.type === 'loading-shortcut';
}
export function validateProceduralRoads(edges, {maxGrade=.12,minWidth=8,joinTolerance=.1}={}) {
  const problems=[];
  const trunks=(edges??[]).filter(e=>e.type==='endless-highway' && e.branchId==='trunk')
    .slice().sort((a,b)=>a.startProgress-b.startProgress);
  if(!trunks.length)problems.push('missing-through-highway');
  for(const edge of edges??[]){
    if(!eligibleProceduralEdge(edge))problems.push('unapproved-road:'+edge.id);
    if(!Array.isArray(edge.samples)||edge.samples.length<2) {problems.push('missing-samples:'+edge.id);continue;}
    const points=edge.samples;
    for(let i=0;i<points.length;i++){
      const p=points[i];
      if(![p.x,p.y,p.z,p.progress,p.width].every(finite)){
        problems.push('nonfinite-road:'+edge.id);break;
      }
      if(p.width<minWidth)problems.push('narrow-road:'+edge.id);
      if(p.structure==='bridge'||p.structure==='tunnel')problems.push('obstructing-structure:'+edge.id);
      if(i===0)continue;
      const prev=points[i-1],span=Math.hypot(p.x-prev.x,p.z-prev.z);
      if(span<1e-4||!finite(span))problems.push('degenerate-segment:'+edge.id);
      else if(Math.abs(p.y-prev.y)/span>maxGrade+1e-6)problems.push('excess-grade:'+edge.id);
    }
  }
  for(let i=1;i<trunks.length;i++){
    const before=trunks[i-1],after=trunks[i];
    if(before.to!==after.from || Math.abs(after.startProgress-before.endProgress)>1e-6 ||
       separation(before.samples.at(-1),after.samples[0])>joinTolerance)
       problems.push('broken-trunk-join:'+before.id+':'+after.id);
  }
  for(const edge of edges??[]){
    if(edge.type!=='loading-shortcut')continue;
    const from=trunks.find(e=>e.from===edge.from),to=trunks.find(e=>e.to===edge.to);
    if(!from||!to||separation(edge.samples[0],from.samples[0])>joinTolerance||
       separation(edge.samples.at(-1),to.samples.at(-1))>joinTolerance)
       problems.push('broken-freight-join:'+edge.id);
  }
  return [...new Set(problems)];
}

export function selectProceduralCourseEdges(edges) {
  // No post-hoc invisible collision proxy or extra roadway may survive this gate.
  const accepted=(edges??[]).filter(eligibleProceduralEdge).map(edge=>{
    let samples=edge.samples.map(p=>({...p,structure:null,bank:0}));
    if(edge.type==='loading-shortcut'){
      // Freight alternatives share exact junction endpoints with the trunk.
      // Regrade by the actual travelled length to prevent a short shortcut
      // segment inheriting a huge grade from its source road template.
      const length=[0];for(let i=1;i<samples.length;i++)length.push(length.at(-1)+
        Math.hypot(samples[i].x-samples[i-1].x,samples[i].z-samples[i-1].z));
      const span=length.at(-1);
      if(span>0){const first=samples[0].y,last=samples.at(-1).y;
        samples=samples.map((p,i)=>({...p,y:first+(last-first)*(length[i]/span)}));}
    }
    return {...edge,samples,...(edge.chunk?{chunk:{...edge.chunk,structure:null}}:{})};
  });
  const errors=validateProceduralRoads(accepted);
  if(errors.length)throw new Error('Procedural roadway rejected: '+errors.join(', '));
  return accepted;
}
