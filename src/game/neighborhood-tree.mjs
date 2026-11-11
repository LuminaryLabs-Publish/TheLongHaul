// Strict adapter for the studio-owned static, untextured neighborhood maple.
// Reject unsupported data rather than silently dropping transforms or textures.
export function createNeighborhoodTree(THREE,buffer,height){
 const v=new DataView(buffer);
 if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==buffer.byteLength)throw Error('Invalid neighborhood GLB');
 let j,bin;for(let at=12;at<buffer.byteLength;){const n=v.getUint32(at,true),type=v.getUint32(at+4,true);at+=8;if(at+n>buffer.byteLength)throw Error('Truncated GLB');if(type===0x4e4f534a)j=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,at,n)));if(type===0x004e4942)bin=at;at+=n;}
 if(!j||bin===undefined||j.extensionsRequired?.length||j.images?.length)throw Error('Unsupported neighborhood GLB');
 const read=i=>{const a=j.accessors[i],b=j.bufferViews[a.bufferView],width={VEC3:3,SCALAR:1}[a.type],bytes={5126:4,5125:4,5123:2}[a.componentType];if(!width||!bytes||a.sparse)throw Error('Unsupported attribute');const out=a.componentType===5126?new Float32Array(a.count*width):new Uint32Array(a.count*width);const stride=b.byteStride||bytes*width,off=(b.byteOffset||0)+(a.byteOffset||0);if((a.byteOffset||0)+(a.count-1)*stride+width*bytes>b.byteLength)throw Error('Attribute bounds');for(let n=0;n<a.count;n++)for(let k=0;k<width;k++)out[n*width+k]=a.componentType===5126?v.getFloat32(bin+off+n*stride+k*bytes,true):bytes===2?v.getUint16(bin+off+n*stride+k*bytes,true):v.getUint32(bin+off+n*stride+k*bytes,true);return out;};
 const materials=j.materials.map(m=>{const p=m.pbrMetallicRoughness||{},c=p.baseColorFactor||[1,1,1,1];const mat=new THREE.MeshStandardMaterial({name:m.name,color:new THREE.Color().setRGB(...c.slice(0,3)),roughness:.95,metalness:0});mat.userData.lhCelKind='foliage';return mat;});
 const parts=[];const group=new THREE.Group();
 for(const node of j.nodes){if(node.mesh===undefined)continue;if(node.matrix||node.translation||node.rotation||node.scale)throw Error('Expected baked neighborhood geometry');for(const p of j.meshes[node.mesh].primitives){if(p.mode!==undefined&&p.mode!==4)throw Error('Expected triangles');const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(read(p.attributes.POSITION),3));geometry.setIndex(new THREE.BufferAttribute(read(p.indices),1));geometry.computeVertexNormals();const material=materials[p.material];const mesh=new THREE.Mesh(geometry,material);group.add(mesh);parts.push({geometry,material,role:node.name});}}
 const bounds=new THREE.Box3().setFromObject(group),scale=height/(bounds.max.y-bounds.min.y);
 for(const p of parts){p.geometry.translate(0,-bounds.min.y,0);p.geometry.scale(scale,scale,scale);p.geometry.computeBoundingSphere();}
 return {parts,materials,geometries:parts.map(p=>p.geometry),triangles:parts.reduce((n,p)=>n+p.geometry.index.count/3,0)};
}
