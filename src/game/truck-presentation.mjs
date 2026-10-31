// Keep steering/contact coordinates independent from the articulated render mesh.
export function createTruckGrounding(THREE,body) {
  body.updateWorldMatrix(true,true);
  const inverse=new THREE.Matrix4().copy(body.matrixWorld).invert(),matrix=new THREE.Matrix4(),v=new THREE.Vector3(),vertices=[];
  body.traverseVisible(node=>{
    if(!node.isMesh)return;
    node.geometry.computeBoundingBox();const b=node.geometry.boundingBox;
    matrix.multiplyMatrices(inverse,node.matrixWorld);
    for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){v.set(x,y,z).applyMatrix4(matrix);vertices.push([v.x,v.y,v.z])}
  });
  // Retain only support extrema across the allowed roll/pitch range.
  const chosen=new Map();
  for(let i=0;i<64;i++)for(const pitch of [-.5,-.25,0,.25,.5]){
    const roll=i*Math.PI/32,sr=Math.sin(roll),cr=Math.cos(roll),sp=Math.sin(pitch),cp=Math.cos(pitch);let best=null,min=Infinity;
    for(const point of vertices){const y=(point[0]*sr+point[1]*cr)*cp-point[2]*sp;if(y<min){min=y;best=point}}
    if(best)chosen.set(best.map(n=>n.toFixed(4)).join(':'),best);
  }
  const points=[...chosen.values()],contact=new THREE.Vector3();
  return {points,contact,minimumClearance:0,lift:0,
    resolve(root,pivot,heightAt){
      root.updateWorldMatrix(true,true);let lift=-Infinity;
      for(const point of points){v.fromArray(point).applyMatrix4(body.matrixWorld);const required=heightAt(v.x,v.z)+.05-v.y;if(required>lift){lift=required;contact.copy(v)}}
      // Positive correction is immediate; release is already smoothed by the lean spring.
      this.lift=Math.max(0,lift);pivot.position.y+=this.lift/root.scale.y;
      contact.y+=this.lift;this.minimumClearance=.05-Math.min(0,lift);
      root.updateWorldMatrix(true,true);
      return this;
    }
  };
}

// Cache projected road triangles once, then query their actual rendered surface cheaply.
export function indexDriveSurface(geometry) {
  const p=geometry.attributes.position,ids=geometry.index?.array??Array.from({length:p.count},(_,i)=>i),triangles=[];
  for(let i=0;i<ids.length;i+=3){const a=ids[i],b=ids[i+1],c=ids[i+2],ax=p.getX(a),az=p.getZ(a),bx=p.getX(b),bz=p.getZ(b),cx=p.getX(c),cz=p.getZ(c),den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-8)continue;triangles.push([Math.min(ax,bx,cx),Math.max(ax,bx,cx),Math.min(az,bz,cz),Math.max(az,bz,cz),ax,az,p.getY(a),bx,bz,p.getY(b),cx,cz,p.getY(c),den])}
  return triangles;
}
export function sampleDriveSurface(triangles,x,z,height) {
  for(const t of triangles){if(x<t[0]||x>t[1]||z<t[2]||z>t[3])continue;const a=((t[8]-t[11])*(x-t[10])+(t[10]-t[7])*(z-t[11]))/t[13],b=((t[11]-t[5])*(x-t[10])+(t[4]-t[10])*(z-t[11]))/t[13],c=1-a-b;if(a>=-1e-6&&b>=-1e-6&&c>=-1e-6)height=Math.max(height,a*t[6]+b*t[9]+c*t[12])}
  return height;
}
