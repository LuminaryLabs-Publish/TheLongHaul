// The Long Haul — terrain/roadside collision against authoritative world geometry.
import { LONG_HAUL_TRUCK_COLLIDER } from './vehicle-collider.mjs';
const EPS=1e-8, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), finite=Number.isFinite;
export function sampleTerrainTriangle(patch,x,z){
  const {bounds,terrain}=patch??{},n=terrain?.segments;
  if(!bounds||!Number.isInteger(n)||n<1||!terrain.heights||x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return null;
  const dx=(bounds.maxX-bounds.minX)/n,dz=(bounds.maxZ-bounds.minZ)/n;
  if(!(dx>0&&dz>0))return null;
  const gx=clamp((x-bounds.minX)/dx,0,n-EPS),gz=clamp((z-bounds.minZ)/dz,0,n-EPS);
  const ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,a=iz*(n+1)+ix,h=terrain.heights;
  if(h.length!==(n+1)**2)return null;
  const h00=h[a],h10=h[a+1],h01=h[a+n+1],h11=h[a+n+2];
  if(![h00,h10,h01,h11].every(finite))return null;
  let height,slopeX,slopeZ;
  if(u+v<=1){
    height=h00+(h10-h00)*u+(h01-h00)*v;
    slopeX=(h10-h00)/dx;slopeZ=(h01-h00)/dz;
  }else{
    height=h11+(h01-h11)*(1-u)+(h10-h11)*(1-v);
    slopeX=(h11-h01)/dx;slopeZ=(h11-h10)/dz;
  }
  const m=Math.hypot(slopeX,1,slopeZ);
  return {height,normal:{x:-slopeX/m,y:1/m,z:-slopeZ/m},source:'terrain-triangle'};
}
export function authoredPropCollider(obj,groundHeight){
  if(!obj||obj.role==='on-road-paint')return null;
  const kind=String(obj.kind??'').toLowerCase();
  const dimensions={
    tree:[.68,12],pine:[.68,12],oak:[.9,12],maple:[.85,12],willow:[.8,11],fir:[.68,12],juniper:[.65,9],
    rock:[1.35,2.5],boulder:[1.8,3],pole:[.38,11],barrier:[.75,2],fence:[.45,2],
    shelter:[3.5,5],depot:[5,7],diner:[5,6],building:[5,7],cactus:[.65,4],culvert:[1.2,2]
  }[kind];
  if(!dimensions)return null;
  const p=obj.position??{},scale=clamp(Number(obj.scale)||1,.2,5);
  if(![p.x,p.z].every(finite))return null;
  return {id:`authored:${obj.id}`,kind,x:p.x,z:p.z,y:finite(groundHeight)?groundHeight:p.y,
    radius:dimensions[0]*scale,height:dimensions[1]*scale};
}
function closestRectCircle(cx,cz,heading,halfWidth,halfLength,ox,oz,radius){
  const s=Math.sin(heading),c=Math.cos(heading),dx=ox-cx,dz=oz-cz;
  const localX=dx*c-dz*s,localZ=dx*s+dz*c;
  const qx=clamp(localX,-halfWidth,halfWidth),qz=clamp(localZ,-halfLength,halfLength);
  const ex=localX-qx,ez=localZ-qz,d=Math.hypot(ex,ez);
  if(d>radius||!finite(d))return null;
  let nx,nz,penetration;
  if(d>EPS){nx=ex/d;nz=ez/d;penetration=radius-d;}
  else{
    const sideX=halfWidth-Math.abs(localX),sideZ=halfLength-Math.abs(localZ);
    if(sideX<sideZ){nx=Math.sign(localX)||1;nz=0;penetration=radius+sideX;}
    else{nx=0;nz=Math.sign(localZ)||1;penetration=radius+sideZ;}
  }
  return {nx:nx*c+nz*s,nz:-nx*s+nz*c,penetration};
}
export function resolveSolidObstacle(position,velocity,heading,obstacle,dimensions=LONG_HAUL_TRUCK_COLLIDER){
  if(!position||!obstacle||!finite(obstacle.x)||!finite(obstacle.z))return null;
  const minY=position.y+(dimensions.groundOffsetY??-.92),maxY=minY+dimensions.height;
  if(finite(obstacle.y)&&finite(obstacle.height)&&
     (maxY<obstacle.y||minY>obstacle.y+obstacle.height))return null;
  const contact=closestRectCircle(position.x,position.z,heading,dimensions.width/2,
    dimensions.length/2,obstacle.x,obstacle.z,Math.max(.05,Number(obstacle.radius)||.5));
  if(!contact||contact.penetration<=EPS)return null;
  const nx=contact.nx,nz=contact.nz,inward=(velocity.x??0)*nx+(velocity.z??0)*nz;
  return {position:{...position,x:position.x-nx*(contact.penetration+.015),z:position.z-nz*(contact.penetration+.015)},
    velocity:{...velocity,x:(velocity.x??0)-nx*Math.max(0,inward)*1.04,z:(velocity.z??0)-nz*Math.max(0,inward)*1.04},
    impactSpeed:Math.max(0,inward),id:obstacle.id};
}
export function resolveWorldContact(truck,previous,groundAt,obstacles=[],{dt=1/60,travel=.92}={}){
  if(!truck?.position||!previous||typeof groundAt!=='function')return null;
  const position={...truck.position},velocity={...truck.velocity};
  if(![position.x,position.y,position.z,previous.x,previous.z].every(finite))return null;
  let corrected=false,groundHit=false;
  const impacts=[],distance=Math.hypot(position.x-previous.x,position.z-previous.z);
  const steps=clamp(Math.ceil(distance/1.25),1,96);
  const originals=new Set();
  for(const obstacle of obstacles){
    if(resolveSolidObstacle({...position,x:previous.x,z:previous.z},velocity,truck.heading,obstacle))originals.add(obstacle.id);
  }
  const start={x:previous.x,z:previous.z};
  for(let k=1;k<=steps;k++){
    const t=k/steps;
    const probe={...position,x:start.x+(truck.position.x-start.x)*t,z:start.z+(truck.position.z-start.z)*t};
    let hit=null;
    for(const obstacle of obstacles){
      if(originals.has(obstacle.id))continue;
      hit=resolveSolidObstacle(probe,velocity,truck.heading,obstacle);
      if(hit)break;
    }
    if(hit){
      position.x=hit.position.x;position.z=hit.position.z;
      Object.assign(velocity,hit.velocity);
      impacts.push({id:hit.id,speed:hit.impactSpeed});corrected=true;break;
    }
  }
  for(let i=0;i<3;i++){
    let found=false;
    for(const obstacle of obstacles){
      const hit=resolveSolidObstacle(position,velocity,truck.heading,obstacle);
      if(!hit)continue;
      Object.assign(position,hit.position);Object.assign(velocity,hit.velocity);
      impacts.push({id:hit.id,speed:hit.impactSpeed});found=corrected=true;
    }
    if(!found)break;
  }
  const ground=groundAt(position);
  if(ground&&finite(ground.height)){
    const sn=Math.sin(truck.heading),cs=Math.cos(truck.heading),wheelHeight=[];
    for(const longitudinal of [-2.75,2.75])for(const lateral of [-1.15,1.15]){
      const support=groundAt({x:position.x+sn*longitudinal+cs*lateral,
        z:position.z+cs*longitudinal-sn*lateral,y:position.y});
      if(finite(support?.height))wheelHeight.push(support.height);
    }
    const wheelFloor=wheelHeight.length?Math.max(...wheelHeight)+travel-.35:-Infinity;
    const minimum=Math.max(ground.height+travel,wheelFloor);
    if(position.y<minimum-1e-5){
      position.y=minimum;velocity.y=Math.max(0,velocity.y??0);
      groundHit=corrected=true;
    }
  }
  if(!corrected)return null;
  const f={x:Math.sin(truck.heading),z:Math.cos(truck.heading)},r={x:f.z,z:-f.x};
  const longitudinalSpeed=velocity.x*f.x+velocity.z*f.z;
  const lateralSpeed=velocity.x*r.x+velocity.z*r.z;
  return {state:{position,velocity,speed:longitudinalSpeed,longitudinalSpeed,lateralSpeed,
    ...(groundHit?{grounded:true,groundHeight:ground.height,groundNormal:ground.normal??truck.groundNormal,
      airTime:0,flightOrigin:null}:{})},impacts,groundHit};
}
