import { buildTreeMeshData, buildTreeMeshSteps } from './tree-mesh-builder.mjs';

export function vertexNormals(positions, indices) {
  const normals = new Float32Array(positions.length);
  for (let i=0;i<indices.length;i+=3) {
    const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
    const ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],uz=positions[b+2]-positions[a+2];
    const vx=positions[c]-positions[a],vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2];
    const x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;
    normals[a]+=x;normals[a+1]+=y;normals[a+2]+=z;
    normals[b]+=x;normals[b+1]+=y;normals[b+2]+=z;
    normals[c]+=x;normals[c+1]+=y;normals[c+2]+=z;
  }
  for(let i=0;i<normals.length;i+=3){const n=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;normals[i]/=n;normals[i+1]/=n;normals[i+2]/=n}
  return normals;
}
export function prepareTreeData(patch, quality=true) {
  for (const [key, visualOnly] of [['nearTrees',false],['farTrees',true]]) {
    const data=buildTreeMeshData(patch.vegetation,{visualOnly,pointLimit:quality?72:32});
    data.normals=vertexNormals(data.positions,data.indices);patch[key]=data;
  }
  return patch;
}

export async function prepareTreeDataIncremental(patch,quality=true,isRetired=()=>false){
 for(const [key,visualOnly] of [['nearTrees',false],['farTrees',true]]){
  const steps=buildTreeMeshSteps(patch.vegetation,{visualOnly,pointLimit:quality?72:32});let started=performance.now(),next;
  do{if(isRetired())throw Error('Retired patch generation');next=steps.next();if(!next.done&&performance.now()-started>=2){await new Promise(resolve=>setTimeout(resolve,0));started=performance.now()}}while(!next.done);
  const data=next.value;data.normals=vertexNormals(data.positions,data.indices);patch[key]=data;
 }return patch;
}
