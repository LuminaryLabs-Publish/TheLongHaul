/* The Long Haul: local, read-only glTF 2.0 tree source adapter.
 * The existing World/road/collision state owns placement. This module only
 * decodes the approved embedded-texture GLBs and supplies deterministic LODs.
 * No GLTFLoader CDN dependency and no source mutation are introduced. */
export const PREBUILT_TREE_VERSION='long-haul:tree-glb-3species:v1';
export const TREE_SPECIES=Object.freeze([
  Object.freeze({id:'red_maple',name:'Red maple',height:15.613,files:['red_maple_LOD0.glb','red_maple_LOD1.glb','red_maple_LOD2.glb']}),
  Object.freeze({id:'paper_birch',name:'Paper birch',height:17.420,files:['paper_birch_LOD0.glb','paper_birch_LOD1.glb','paper_birch_LOD2.glb']}),
  Object.freeze({id:'weeping_willow',name:'Weeping willow',height:13.674,files:['weeping_willow_LOD0.glb','weeping_willow_LOD1.glb','weeping_willow_LOD2.glb']})
]);
export const TREE_ENVIRONMENT_KINDS=Object.freeze(['tree','maple','oak','pine','fir','juniper','willow']);
const TREE_KIND_SET=new Set(TREE_ENVIRONMENT_KINDS);
const COMPONENTS=Object.freeze({5121:{type:Uint8Array,size:1},5123:{type:Uint16Array,size:2},5125:{type:Uint32Array,size:4},5126:{type:Float32Array,size:4}});
const VALUES=Object.freeze({SCALAR:1,VEC2:2,VEC3:3,VEC4:4});
const isFinite3=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite);

export function hashTreeId(value) {
  let h=2166136261;
  for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);
  return h>>>0;
}
export function speciesForTree(tree) {
  const kind=String(tree?.kind||tree?.variant||'').toLowerCase();
  if(kind==='willow')return 'weeping_willow';
  if(kind==='maple')return 'red_maple';
  if(kind==='birch'||kind==='pine'||kind==='fir'||kind==='juniper')return 'paper_birch';
  return TREE_SPECIES[hashTreeId(tree?.id||'tree')%3].id;
}
export function isTreeEnvironmentObject(object) {
  return object?.role!=='on-road-paint'&&TREE_KIND_SET.has(object?.kind);
}
export function selectTreeLod(distance,quality=true) {
  if(!Number.isFinite(distance)||distance<0)return 2;
  return distance<(quality?105:65)?0:distance<(quality?260:145)?1:2;
}
// Maintain a bounded list independent of streaming order; nearest first,
// deterministic ID tie-break. The far view intentionally keeps a smaller set.
export function selectVisibleTreeInstances(candidates,observer,{quality=true}={}){
  if(!isFinite3(observer))return [];
  const maxDistance=quality?560:340, maxCount=quality?240:115;
  const seen=new Set();
  return (candidates||[]).filter(x=>x&&isFinite3(x.position)&&Number.isFinite(x.height)&&x.height>0)
    .map(x=>({...x,distance:Math.hypot(x.position[0]-observer[0],x.position[2]-observer[2])}))
    .filter(x=>{if(x.distance>maxDistance||seen.has(x.id))return false;seen.add(x.id);return true;})
    .sort((a,b)=>a.distance-b.distance||String(a.id).localeCompare(String(b.id)))
    .slice(0,maxCount).map(x=>({...x,lod:selectTreeLod(x.distance,quality)}));
}

// Strict subset validator: supported asset pack is static, binary GLB v2,
// float32 interleaved/strided attributes and embedded PNG imagery. Reject
// extensions/transformations rather than silently rendering wrong geometry.
export function parsePrebuiltTreeGlb(buffer) {
  if(!(buffer instanceof ArrayBuffer))throw new TypeError('GLB requires ArrayBuffer');
  if(buffer.byteLength<32)throw Error('GLB truncated');
  const dv=new DataView(buffer);
  if(dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==buffer.byteLength)throw Error('Invalid glTF 2.0 binary header');
  let offset=12,json=null,binStart=-1,binLength=0;
  while(offset+8<=buffer.byteLength){
    const length=dv.getUint32(offset,true),type=dv.getUint32(offset+4,true);
    offset+=8;
    if(length<0||offset+length>buffer.byteLength)throw Error('Invalid GLB chunk bounds');
    if(type===0x4e4f534a){if(json)throw Error('Duplicate GLB JSON');json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,offset,length)).trim());}
    if(type===0x004e4942){if(binStart!==-1)throw Error('Duplicate GLB BIN');binStart=offset;binLength=length;}
    offset+=length;
  }
  if(!json||binStart<0||offset!==buffer.byteLength||json.asset?.version!=='2.0'||!Array.isArray(json.meshes))throw Error('Invalid GLB asset');
  if(json.extensionsRequired?.length)throw Error('Unsupported GLB extensions');
  const bufferViews=json.bufferViews||[],accessors=json.accessors||[];
  const viewBytes=index=>{
    const view=bufferViews[index];
    if(!view||view.buffer!==0&&view.buffer!==undefined||!Number.isSafeInteger(view.byteOffset??0)||!Number.isSafeInteger(view.byteLength)||view.byteOffset<0||view.byteLength<0||view.byteOffset+view.byteLength>binLength)throw Error('Invalid GLB bufferView');
    return new Uint8Array(buffer,binStart+(view.byteOffset||0),view.byteLength);
  };
  const readAccessor=index=>{
    const acc=accessors[index];
    if(!acc||!Number.isSafeInteger(acc.count)||acc.count<1||acc.sparse||!COMPONENTS[acc.componentType]||!VALUES[acc.type])throw Error('Unsupported GLB accessor');
    const view=bufferViews[acc.bufferView],comp=COMPONENTS[acc.componentType],width=VALUES[acc.type];
    if(!view)throw Error('Missing GLB accessor view');
    const stride=view.byteStride||width*comp.size,off=acc.byteOffset||0;
    if(stride<width*comp.size||stride%comp.size||off%comp.size||off+(acc.count-1)*stride+width*comp.size>view.byteLength)throw Error('Invalid GLB accessor stride/range');
    viewBytes(acc.bufferView);
    const typed=new comp.type(acc.count*width);
    const input=new DataView(buffer,binStart+(view.byteOffset||0)+off);
    for(let i=0;i<acc.count;i++)for(let j=0;j<width;j++){
      const at=i*stride+j*comp.size;
      typed[i*width+j]=acc.componentType===5126?input.getFloat32(at,true):acc.componentType===5125?input.getUint32(at,true):acc.componentType===5123?input.getUint16(at,true):input.getUint8(at);
    }
    return {array:typed,itemSize:width,count:acc.count};
  };
  const primitives=[];
  for(const mesh of json.meshes){for(const primitive of mesh.primitives||[]){
    if(primitive.mode!==undefined&&primitive.mode!==4)throw Error('Only triangle GLBs supported');
    if(primitive.indices===undefined||!primitive.attributes||primitive.material===undefined)throw Error('Missing indexed geometry or material');
    const position=readAccessor(primitive.attributes.POSITION),normal=readAccessor(primitive.attributes.NORMAL),uv=readAccessor(primitive.attributes.TEXCOORD_0),indices=readAccessor(primitive.indices);
    if(position.itemSize!==3||normal.itemSize!==3||uv.itemSize!==2||indices.itemSize!==1||position.count!==normal.count||position.count!==uv.count||indices.count%3)throw Error('Inconsistent tree vertex attributes');
    for(const v of position.array)if(!Number.isFinite(v))throw Error('Nonfinite GLB vertex');
    for(const v of indices.array)if(v>=position.count)throw Error('Out-of-range GLB index');
    primitives.push({position,normal,uv,indices,material:primitive.material,meshName:mesh.name||''});
  }}
  if(primitives.length!==2||!Array.isArray(json.images)||json.images.length!==2||!Array.isArray(json.materials)||json.materials.length!==2)throw Error('Expected wood and leaf-card meshes with two embedded textures');
  const images=json.images.map(img=>{
    if(img.mimeType!=='image/png'||img.bufferView===undefined)throw Error('Tree needs embedded PNG textures');
    return viewBytes(img.bufferView);
  });
  const foliage=json.materials.find(x=>x.alphaMode==='MASK');
  if(!foliage||!foliage.doubleSided||!Number.isFinite(foliage.alphaCutoff))throw Error('Foliage alpha mask missing');
  return {json,primitives,images,triangles:primitives.reduce((n,p)=>n+p.indices.count/3,0)};
}

function textureFromPng(THREE,imageBytes){
  const url=URL.createObjectURL(new Blob([imageBytes],{type:'image/png'}));
  return new Promise((resolve,reject)=>{
    const loader=new THREE.TextureLoader();
    loader.load(url,texture=>{
      URL.revokeObjectURL(url);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;resolve(texture);
    },undefined,error=>{URL.revokeObjectURL(url);reject(error||Error('Tree texture failed to decode'));});
  });
}

export async function createPrebuiltTreeMeshes(THREE,parsed,reuseMaterials=null){
  const materials=[];
  if(reuseMaterials){materials.push(...reuseMaterials);} else {
    const textures=await Promise.all(parsed.images.map(image=>textureFromPng(THREE,image)));
    for(const m of parsed.json.materials){
      const p=m.pbrMetallicRoughness||{},idx=p.baseColorTexture?.index;
      if(idx===undefined||!parsed.json.textures?.[idx])throw Error('Tree material texture missing');
      const texture=textures[parsed.json.textures[idx].source];
      const mat=new THREE.MeshStandardMaterial({name:m.name,map:texture,
        metalness:p.metallicFactor??0,roughness:p.roughnessFactor??.9,
        side:m.doubleSided?THREE.DoubleSide:THREE.FrontSide,
        alphaTest:m.alphaMode==='MASK'?(m.alphaCutoff??.36):0,
        transparent:false,depthWrite:true,vertexColors:false});
      materials.push(mat);
    }
  }
  const geometries=parsed.primitives.map(p=>{
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(p.position.array,3));
    g.setAttribute('normal',new THREE.BufferAttribute(p.normal.array,3));
    g.setAttribute('uv',new THREE.BufferAttribute(p.uv.array,2));
    g.setIndex(new THREE.BufferAttribute(p.indices.array,1));
    g.computeBoundingSphere();
    return g;
  });
  return {parts:parsed.primitives.map((p,i)=>({geometry:geometries[i],material:materials[p.material],role:p.meshName})),materials,geometries,triangles:parsed.triangles};
}