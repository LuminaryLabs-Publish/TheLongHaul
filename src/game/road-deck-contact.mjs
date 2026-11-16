// Road contact is a one-sided support surface, not a vertical road wall.
// Never promote a road above the underside of the chassis into ground contact.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
export function selectRoadDeckContact(position, segments, {travel=.92,reach=.5}={}) {
  if(!position||![position.x,position.z].every(Number.isFinite))return null;
  const foot=Number.isFinite(position.y)?position.y-travel:null;
  let best=null;
  for(const {a,b,edge,segmentIndex} of segments??[]){
    if(!a||!b||!edge)continue;
    const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
    if(den<1e-10)continue;
    const t=clamp(((position.x-a.x)*dx+(position.z-a.z)*dz)/den,0,1);
    const centerX=mix(a.x,b.x,t),centerZ=mix(a.z,b.z,t);
    const distance=Math.hypot(position.x-centerX,position.z-centerZ);
    const width=mix(a.width??edge.width,b.width??edge.width,t);
    if(!(width>0)||distance>width*.5+.25)continue;
    const nx=mix(a.nx??dz/Math.sqrt(den),b.nx??dz/Math.sqrt(den),t),nz=mix(a.nz??-dx/Math.sqrt(den),b.nz??-dx/Math.sqrt(den),t);
    const nlen=Math.hypot(nx,nz)||1;
    const lateral=((position.x-centerX)*nx+(position.z-centerZ)*nz)/nlen;
    const bank=mix(a.bank??0,b.bank??0,t);
    const y=mix(a.y,b.y,t)+bank*lateral;
    if(!Number.isFinite(y))continue;
    // Walking/rolling onto an incline admits a little surface rise. An elevated
    // road that is more than reach above the wheels is never a contact candidate.
    if(foot!==null&&y>foot+reach)continue;
    const grade=mix(a.grade??(b.y-a.y)/Math.sqrt(den),b.grade??(b.y-a.y)/Math.sqrt(den),t);
    const len=Math.sqrt(den),fx=dx/len,fz=dz/len,nX=nx/nlen,nZ=nz/nlen;
    const gx=-grade*fx-bank*nX,gz=-grade*fz-bank*nZ,m=Math.hypot(gx,1,gz);
    // Among physically reachable decks, choose the one just beneath the wheels.
    const gap=foot===null?0:Math.max(0,foot-y);
    const score=gap+distance*.04;
    if(!best||score<best.score)best={height:y,normal:{x:gx/m,y:1/m,z:gz/m},road:{edge,segmentIndex,t,x:centerX,z:centerZ,y,distance,lateral,heading:Math.atan2(dx,dz)},score};
  }
  return best?{height:best.height,normal:best.normal,road:best.road}:null;
}
export function boundedWheelSupport(centerHeight,wheelHeights,{maxRise=.45}={}){
  const valid=(wheelHeights??[]).filter(Number.isFinite);
  return valid.length?Math.max(centerHeight,Math.min(centerHeight+maxRise,Math.max(...valid))):centerHeight;
}
