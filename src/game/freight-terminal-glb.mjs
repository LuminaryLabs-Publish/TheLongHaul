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
export function createFreightTerminalThreeObject(THREE,parsed){
  const group=new THREE.Group();group.name='TLH_FREIGHT_TERMINAL_START';
  const materials=parsed.materials.map(m=>{
    const p=m.pbrMetallicRoughness||{},color=p.baseColorFactor||[.5,.5,.5,1];
    return new THREE.MeshStandardMaterial({name:m.name||'terminal-surface',color:new THREE.Color().setRGB(color[0],color[1],color[2]),metalness:p.metallicFactor??0,roughness:p.roughnessFactor??.9,side:m.doubleSided?THREE.DoubleSide:THREE.FrontSide});
  });
  // The authored GLB contains demonstration highway and terrain meshes.
  // Those are intentionally not drawn: generated Road/World geometry owns
  // both pavement and soil, and the static model supplies only the yard.
  const notPartOfYard=new Set(['asphalt','dark_asphalt','lawn','lawn2','road_white','road_yellow']);
  for(const part of parsed.meshes){
    if(notPartOfYard.has(parsed.materials[part.material]?.name))continue;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(part.positions,3));
    geo.setIndex(new THREE.BufferAttribute(part.indices,1));geo.computeVertexNormals();geo.computeBoundingSphere();
    const mesh=new THREE.Mesh(geo,materials[part.material]);mesh.name=part.name;mesh.receiveShadow=true;mesh.castShadow=false;group.add(mesh);
  }
  return group;
}
