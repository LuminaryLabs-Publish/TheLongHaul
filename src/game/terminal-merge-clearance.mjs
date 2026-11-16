// Clearance for the terminal's actual drivable exit, independent of save seed.
// Render-only: road graph, collision and legitimate same-level pavement remain intact.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function terminalExitSegments(course){
  const edge=course?.freightTerminal&&course.edges?.find(e=>e.id==='terminal:start-ramp');
  if(!edge?.samples?.length)return [];
  return edge.samples.slice(1).map((b,i)=>{
    const a=edge.samples[i],dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz;
    return {a,b,dx,dz,len2,minX:Math.min(a.x,b.x)-12,maxX:Math.max(a.x,b.x)+12,
      minZ:Math.min(a.z,b.z)-12,maxZ:Math.max(a.z,b.z)+12};
  }).filter(s=>s.len2>1e-6);
}
export function overheadTerminalExit(segments,x,y,z,{halfWidth=7,heightTolerance=.65,endBuffer=12}={}){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))return false;
  for(const s of segments){
    if(x<s.minX||x>s.maxX||z<s.minZ||z>s.maxZ)continue;
    const t=clamp(((x-s.a.x)*s.dx+(z-s.a.z)*s.dz)/s.len2,0,1);
    const px=s.a.x+s.dx*t,pz=s.a.z+s.dz*t;
    if(Math.hypot(x-px,z-pz)>halfWidth)continue;
    // The last metres are the legal, same-height merge into the mainline.
    if(s.b.progress>=320-endBuffer && t>.25)continue;
    const roadY=s.a.y+(s.b.y-s.a.y)*t;
    if(y>roadY+heightTolerance)return true;
  }
  return false;
}
export function clearOverheadRoadTriangles(data,segments){
  if(!segments?.length||!data?.indices?.length)return data;
  const {positions,indices}=data,keep=[];
  for(let i=0;i<indices.length;i+=3){
    let blocked=false;
    const vertices=[0,1,2].map(j=>{
      const at=indices[i+j]*3;
      return [positions[at],positions[at+1],positions[at+2]];
    });
    // Wide highway triangles can span the entire exit without any vertex
    // inside its corridor. Check edges and interior as well as vertices.
    const probes=[...vertices,
      ...[0,1,2].map(j=>vertices[j].map((v,k)=>(v+vertices[(j+1)%3][k])/2)),
      vertices[0].map((v,k)=>(v+vertices[1][k]+vertices[2][k])/3)];
    blocked=probes.some(p=>overheadTerminalExit(segments,p[0],p[1],p[2]));
    if(!blocked)keep.push(indices[i],indices[i+1],indices[i+2]);
  }
  return {...data,indices:keep};
}
