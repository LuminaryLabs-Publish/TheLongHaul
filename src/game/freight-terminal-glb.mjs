// Minimal strict GLB v2 adapter for our own static, material-batched freight yard.
// No external loader, no camera/physics ownership, no procedural substitute.
const componentType={5123:[Uint16Array,2],5125:[Uint32Array,4],5126:[Float32Array,4]};
export function parseFreightTerminalGlb(buffer){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<28)throw Error('Terminal GLB missing');
  const view=new DataView(buffer);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength)
    throw Error('Invalid freight terminal glTF 2.0 header');
  let offset=12,document=null,bin=-1,binBytes=0;
  while(offset<buffer.byteLength){
    if(offset+8>buffer.byteLength)throw Error('Truncated GLB chunk');
    const size=view.getUint32(offset,true),kind=view.getUint32(offset+4,true);offset+=8;
    if(offset+size>buffer.byteLength)throw Error('Invalid GLB chunk size');
    if(kind===0x4e4f534a)document=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,offset,size)).trim());
    if(kind===0x004e4942){bin=offset;binBytes=size;}
    offset+=size;
  }
  if(!document||bin<0||document.asset?.version!=='2.0'||document.extensionsRequired?.length)
    throw Error('Unsupported terminal GLB');
  const read=index=>{
    const accessor=document.accessors?.[index],part=document.bufferViews?.[accessor?.bufferView];
    const [Class,bytes]=componentType[accessor?.componentType]||[];
    const width=accessor?.type==='VEC3'?3:accessor?.type==='SCALAR'?1:0;
    if(!Class||!width||!part||!Number.isInteger(accessor.count)||accessor.count<=0||accessor.sparse)
      throw Error('Unsupported terminal accessor');
    const stride=part.byteStride||bytes*width,at=part.byteOffset||0,local=accessor.byteOffset||0;
    if(part.buffer!==0&&part.buffer!==undefined||at+part.byteLength>binBytes||local+(accessor.count-1)*stride+width*bytes>part.byteLength)
      throw Error('Invalid terminal accessor bounds');
    const array=new Class(accessor.count*width);
    for(let i=0;i<accessor.count;i++)for(let j=0;j<width;j++){
      const byte=bin+at+local+i*stride+j*bytes;
      array[i*width+j]=Class===Float32Array?view.getFloat32(byte,true):Class===Uint32Array?view.getUint32(byte,true):view.getUint16(byte,true);
    }
    return {array,count:accessor.count,width};
  };
  const meshes=[];
  for(const [i,mesh] of (document.meshes||[]).entries())for(const primitive of (mesh.primitives||[])){
    if(primitive.mode!==undefined&&primitive.mode!==4||primitive.indices===undefined||primitive.attributes?.POSITION===undefined)
      throw Error('Only indexed static triangle meshes supported');
    const positions=read(primitive.attributes.POSITION),indices=read(primitive.indices);
    if(positions.width!==3||indices.width!==1||indices.count%3)throw Error('Malformed terminal mesh');
    if(indices.array.some(i=>i>=positions.count)||positions.array.some(x=>!Number.isFinite(x)))throw Error('Invalid terminal geometry');
    meshes.push({name:mesh.name||`Terminal_${i}`,positions:positions.array,indices:indices.array,material:primitive.material??0});
  }
  if(meshes.length<15||meshes.length>100)throw Error('Unexpected terminal batch count');
  return {meshes,materials:document.materials||[],triangles:meshes.reduce((s,m)=>s+m.indices.length/3,0)};
}
// All gameplay roads and terrain belong to the procedural World/Road surface.
// The supplied Blender GLB is a *compound* demonstration scene, not just the
// yard. Asset batches include elevated highway, terrain and props. The real
// material names are prefixed TLH_V1_/V1F_, unlike early fixture assumptions.
export const TERMINAL_YARD_BOUNDS=Object.freeze({minX:-320,maxX:42,minZ:-233,maxZ:226});
// The new exit road is generated separately along this line in the GLB's local frame.
const TERMINAL_EXIT_SWEEP=Object.freeze({from:{x:0,z:-132},to:{x:177,z:-474},clearance:7.5});
function inTerminalExitVolume(p){
  if(p[1]<=.5||p[1]>=6.2)return false;
  const line=TERMINAL_EXIT_SWEEP,dx=line.to.x-line.from.x,dz=line.to.z-line.from.z;
  const t=((p[0]-line.from.x)*dx+(p[2]-line.from.z)*dz)/(dx*dx+dz*dz);
  if(t<=.05||t>=.98)return false;
  const gap=Math.hypot(p[0]-line.from.x-dx*t,p[2]-line.from.z-dz*t);
  return gap<line.clearance;
}
const DEMONSTRATION_MATERIALS=new Set([
  'darkasphalt','roadwhite','roadyellow','lawn','lawn2','grasslight',
  'forest','pine','treetrunk' // procedural World owns roadside vegetation
]);
export function normalizedTerminalMaterial(name='') {
  return String(name).replace(/^(?:TLH_V1_|V1F_)/i,'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
}
// Clip triangles rather than dropping entire batches: the Blender mesh batches
// mix yard steel, roads, highway piers and roadside décor in the same draw call.
// A centroid-only filter leaves giant triangles crossing into the road.
function clipPolygon(poly,axis,limit,keepBelow){
  if(!poly.length)return poly;
  const within=p=>keepBelow?p[axis]<=limit:p[axis]>=limit;
  const out=[];let prev=poly.at(-1),wasInside=within(prev);
  for(const current of poly){
    const nowInside=within(current);
    if(nowInside!==wasInside){
      const denominator=current[axis]-prev[axis];
      if(Math.abs(denominator)>1e-12){
        const t=(limit-prev[axis])/denominator;
        out.push([prev[0]+(current[0]-prev[0])*t,
          prev[1]+(current[1]-prev[1])*t,prev[2]+(current[2]-prev[2])*t]);
      }
    }
    if(nowInside)out.push(current);
    prev=current;wasInside=nowInside;
  }
  return out;
}
export function clipFreightTerminalYardMesh(part,bounds=TERMINAL_YARD_BOUNDS){
  const pos=part?.positions,sourceIds=part?.indices;
  if(!pos||!sourceIds||sourceIds.length%3)throw Error('Invalid terminal GLB batch');
  const out=[],ids=[];
  for(let i=0;i<sourceIds.length;i+=3){
    let poly=[];
    for(let n=0;n<3;n++){
      const j=sourceIds[i+n]*3;
      poly.push([pos[j],pos[j+1],pos[j+2]]);
    }
    if(poly.every(p=>p[0]>bounds.maxX)||poly.every(p=>p[0]<bounds.minX)||
      poly.every(p=>p[2]>bounds.maxZ)||poly.every(p=>p[2]<bounds.minZ))continue;
    poly=clipPolygon(poly,0,bounds.minX,false);
    poly=clipPolygon(poly,0,bounds.maxX,true);
    poly=clipPolygon(poly,2,bounds.minZ,false);
    poly=clipPolygon(poly,2,bounds.maxZ,true);
    if(poly.length<3)continue;
    // Non-road GLB batches also contain small demo barriers/props near the
    // old connector. No visible obstruction may occupy the driven exit lane.
    if(poly.some(inTerminalExitVolume))continue;
    // Remove zero-area triangles introduced at the crop boundaries.
    const a=poly[0];
    for(let n=1;n<poly.length-1;n++){
      const b=poly[n],c=poly[n+1];
      const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
      const area=Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]);
      if(area<1e-9)continue;
      const first=out.length/3;
      out.push(...a,...b,...c);ids.push(first,first+1,first+2);
    }
  }
  return {positions:new Float32Array(out),indices:new Uint32Array(ids)};
}
export function createFreightTerminalThreeObject(THREE,parsed){
  const group=new THREE.Group();group.name='TLH_FREIGHT_TERMINAL_START';
  const materials=parsed.materials.map(m=>{
    const p=m.pbrMetallicRoughness||{},color=p.baseColorFactor||[.5,.5,.5,1];
    return new THREE.MeshStandardMaterial({name:m.name||'terminal-surface',color:new THREE.Color().setRGB(color[0],color[1],color[2]),metalness:p.metallicFactor??0,roughness:p.roughnessFactor??.9,side:m.doubleSided?THREE.DoubleSide:THREE.FrontSide});
  });
  let excluded=0,kept=0,removedOutsideYard=0;
  for(const part of parsed.meshes){
    const label=normalizedTerminalMaterial(parsed.materials[part.material]?.name);
    if(DEMONSTRATION_MATERIALS.has(label)){
      excluded+=part.indices.length/3;continue;
    }
    const clipped=clipFreightTerminalYardMesh(part);
    if(!clipped.indices.length){removedOutsideYard+=part.indices.length/3;continue;}
    kept+=clipped.indices.length/3;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(clipped.positions,3));
    geo.setIndex(new THREE.BufferAttribute(clipped.indices,1));geo.computeVertexNormals();geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,materials[part.material]);mesh.name=part.name;mesh.receiveShadow=true;mesh.castShadow=false;group.add(mesh);
  }
  group.userData.terminalYardPruning={sourceTriangles:parsed.triangles,retainedTriangles:kept,excludedDemonstrationTriangles:excluded,
    discardedOutsideYardTriangles:removedOutsideYard,sourceBounds:TERMINAL_YARD_BOUNDS};
  return group;
}
