// Strict, minimal static GLB adapter for the actual Luminary Low Poly Neighborhood
// source pack. No external loader, dynamic evaluation, texture fetch or physics.
const components={5121:[Uint8Array,1],5123:[Uint16Array,2],5125:[Uint32Array,4],5126:[Float32Array,4]};
const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
export function parseSettlementGlb(bytes){
  if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<28)throw Error('Settlement GLB buffer missing');
  const view=new DataView(bytes);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==bytes.byteLength)
    throw Error('Invalid settlement GLB header');
  let offset=12,doc=null,bin=-1,binSize=0;
  while(offset<bytes.byteLength){
    if(offset+8>bytes.byteLength)throw Error('Truncated GLB chunk');
    const size=view.getUint32(offset,true),type=view.getUint32(offset+4,true);offset+=8;
    if(size>bytes.byteLength-offset)throw Error('Invalid GLB chunk bounds');
    if(type===0x4e4f534a){if(doc)throw Error('Duplicate JSON chunk');doc=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,offset,size)).trim());}
    if(type===0x004e4942){if(bin>=0)throw Error('Duplicate BIN chunk');bin=offset;binSize=size;}
    offset+=size;
  }
  if(!doc||bin<0||doc.asset?.version!=='2.0'||doc.extensionsRequired?.length||doc.buffers?.length!==1||doc.buffers[0].uri)
    throw Error('Unsupported settlement GLB');
  if(doc.nodes?.some(n=>n.matrix||n.translation||n.rotation||n.scale))throw Error('Settlement GLB requires preapplied transforms');
  function accessor(index){
    const a=doc.accessors?.[index],part=doc.bufferViews?.[a?.bufferView],entry=components[a?.componentType],width=widths[a?.type];
    if(!part||!entry||!width||!Number.isSafeInteger(a.count)||a.count<1||a.sparse)throw Error('Unsupported settlement accessor');
    const [Type,bytesPer]=entry,stride=part.byteStride||width*bytesPer,start=part.byteOffset||0,local=a.byteOffset||0;
    if(part.buffer!==undefined&&part.buffer!==0||start+part.byteLength>binSize||local+(a.count-1)*stride+width*bytesPer>part.byteLength||stride<width*bytesPer)
      throw Error('Invalid settlement accessor range');
    const out=new Type(a.count*width);
    for(let i=0;i<a.count;i++)for(let j=0;j<width;j++){
      const at=bin+start+local+i*stride+j*bytesPer;
      out[i*width+j]=Type===Float32Array?view.getFloat32(at,true):Type===Uint32Array?view.getUint32(at,true):Type===Uint16Array?view.getUint16(at,true):view.getUint8(at);
    }
    return {array:out,count:a.count,width};
  }
  const positions=[],colors=[],indices=[],extents={minX:Infinity,minY:Infinity,minZ:Infinity,maxX:-Infinity,maxY:-Infinity,maxZ:-Infinity};
  for(const mesh of doc.meshes||[])for(const part of mesh.primitives||[]){
    if(part.mode!==undefined&&part.mode!==4||!Number.isInteger(part.indices)||!Number.isInteger(part.attributes?.POSITION))throw Error('Unsupported settlement primitive');
    const p=accessor(part.attributes.POSITION),index=accessor(part.indices),m=doc.materials?.[part.material??0],rgba=m?.pbrMetallicRoughness?.baseColorFactor??[1,1,1,1];
    if(p.width!==3||index.width!==1||index.count%3||rgba.length!==4)throw Error('Malformed settlement primitive');
    const start=positions.length/3;
    for(let i=0;i<p.count;i++){
      const x=p.array[i*3],y=p.array[i*3+1],z=p.array[i*3+2];
      if(![x,y,z].every(Number.isFinite))throw Error('Invalid settlement geometry');
      positions.push(x,y,z);colors.push(rgba[0],rgba[1],rgba[2]);
      extents.minX=Math.min(x,extents.minX);extents.maxX=Math.max(x,extents.maxX);
      extents.minY=Math.min(y,extents.minY);extents.maxY=Math.max(y,extents.maxY);
      extents.minZ=Math.min(z,extents.minZ);extents.maxZ=Math.max(z,extents.maxZ);
    }
    for(const id of index.array){if(id>=p.count)throw Error('Settlement index outside vertex range');indices.push(start+id);}
  }
  if(!indices.length||indices.length>300000||positions.length>300000)throw Error('Unsupported settlement mesh budget');
  return {positions:new Float32Array(positions),colors:new Float32Array(colors),indices:new Uint32Array(indices),bounds:extents,triangles:indices.length/3};
}
export function createSettlementGeometry(THREE,source){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(source.positions,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(source.colors,3));
  geometry.setIndex(new THREE.BufferAttribute(source.indices,1));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.computeBoundingBox();
  return geometry;
}
