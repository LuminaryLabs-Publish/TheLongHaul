// Product-owned impact contract. All vectors are world-space metres/seconds.
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dot=(a,b)=>a.x*b.x+a.z*b.z;
const lerp=(a,b,t)=>a+(b-a)*t;
const radius=(c,a)=>c.halfWidth*Math.abs(dot(c.axisX,a))+c.halfLength*Math.abs(dot(c.axisZ,a));
/** Swept SAT for translating oriented vehicle boxes. Angular growth is bounded
 * conservatively using endpoint projected radii. Y participates in the same
 * time interval, so a bridge crossing cannot produce a ground-level impact. */
export function sweptVehicleImpact(a0,a1,b0,b1){
 if(![a0,a1,b0,b1].every(c=>c&&[c.x,c.z,c.halfWidth,c.halfLength,c.minY,c.maxY,c.axisX?.x,c.axisX?.z,c.axisZ?.x,c.axisZ?.z].every(Number.isFinite)&&c.halfWidth>=0&&c.halfLength>=0&&c.maxY>=c.minY))return null;
 let enter=0,exit=1,normal=null,overlapNormal=null,depth=Infinity;
 const axes=[a0.axisX,a0.axisZ,a1.axisX,a1.axisZ,b0.axisX,b0.axisZ,b1.axisX,b1.axisZ];
 for(const axis of axes){
  const d0=(a0.x-b0.x)*axis.x+(a0.z-b0.z)*axis.z;
  const d1=(a1.x-b1.x)*axis.x+(a1.z-b1.z)*axis.z;
  const r=Math.max(radius(a0,axis),radius(a1,axis))+Math.max(radius(b0,axis),radius(b1,axis));
  const penetration=r-Math.abs(d0);
  if(penetration<depth){depth=penetration;overlapNormal={x:axis.x*(d0<0?-1:1),z:axis.z*(d0<0?-1:1)};}
  const delta=d1-d0;
  if(Math.abs(delta)<1e-9){if(Math.abs(d0)>r)return null;continue;}
  let t0=(-r-d0)/delta,t1=(r-d0)/delta;if(t0>t1)[t0,t1]=[t1,t0];
  if(t0>enter){enter=t0;const sign=lerp(d0,d1,t0)<0?-1:1;normal={x:axis.x*sign,z:axis.z*sign};}
  exit=Math.min(exit,t1);if(enter>exit)return null;
 }
 // Swept interval for vertical overlap, with changing grades/heights.
 for(const [s,e] of [[a0.maxY-b0.minY,a1.maxY-b1.minY],[b0.maxY-a0.minY,b1.maxY-a1.minY]]){
  if(s<0&&e<0)return null;
  if(s<0)enter=Math.max(enter,-s/(e-s));else if(e<0)exit=Math.min(exit,-s/(e-s));
 }
 if(enter>exit||enter>1||exit<0)return null;
 const t=clamp(enter,0,1),n=normal||overlapNormal;
 const ax=lerp(a0.x,a1.x,t),az=lerp(a0.z,a1.z,t),bx=lerp(b0.x,b1.x,t),bz=lerp(b0.z,b1.z,t);
 return {time:t,normal:n,point:{x:(ax-n.x*radius(a1,n)+bx+n.x*radius(b1,n))*.5,
  y:(Math.max(lerp(a0.minY,a1.minY,t),lerp(b0.minY,b1.minY,t))+Math.min(lerp(a0.maxY,a1.maxY,t),lerp(b0.maxY,b1.maxY,t)))*.5,
  z:(az-n.z*radius(a1,n)+bz+n.z*radius(b1,n))*.5}};
}
export const IMPACT_PROFILE=Object.freeze({id:'comic-truck-impact-v1',truckId:'long-haul-truck',scrapeSpeed:.75,solidSpeed:5,heavySpeed:18,maxContacts:64,maxRecentEvents:256,maxVelocityDelta:22,maxYaw:.22,hitStopScale:1});
export function resolveImpactResponse(event,profile=IMPACT_PROFILE){
 const speed=event.closingSpeed,mass=clamp(finite(event.effectiveMass,6500),100,100000),target=clamp(finite(event.targetMass,1400),100,100000);
 const delta=clamp(speed*(1+.18)*target/(mass+target),0,profile.maxVelocityDelta);
 const x=event.normal.x*delta,z=event.normal.z*delta;
 const torque=event.contactOffset.z*x-event.contactOffset.x*z;
 const headingDelta=clamp(torque*.008,-profile.maxYaw,profile.maxYaw);
 const severity=clamp((speed-profile.solidSpeed)/(profile.heavySpeed-profile.solidSpeed),0,1);
 const tier=speed<profile.solidSpeed?'scrape':speed<profile.heavySpeed?'solid':'heavy';
 return {tier,severity,impulse:{x,z,y:0,headingDelta,yawDelta:headingDelta*2,
  rollDelta:clamp((x*Math.cos(event.heading)-z*Math.sin(event.heading))*.06,-.8,.8),kind:'comic-impact',allowTip:severity>.85},
  hitStop:(tier==='scrape'?0:tier==='solid'?.035+severity*.02:.065+severity*.025)*clamp(finite(profile.hitStopScale,1),0,1),
  truckDamage:tier==='scrape'?speed*.35:12+Math.min(10,speed*.3),cargoDamage:tier==='scrape'?0:4,
  targetDamage:speed*speed*mass/(mass+target)*.23};
}
export function createImpactKit(options={}){
 const profile=Object.freeze({...IMPACT_PROFILE,...options,maxContacts:clamp(Math.floor(finite(options.maxContacts,64)),1,64)});const contacts=new Map();let serial=0,tick=0;
 return {profile,
  beginFrame(){tick++;},
  contact({targetId,contact,truck,targetVelocity={x:0,z:0},targetMass=1400,seed=0}){
   if(!contact||!targetId||!truck?.position||![contact.point?.x,contact.point?.y,contact.point?.z,contact.normal?.x,contact.normal?.z,truck.position.x,truck.position.z].every(Number.isFinite)||Math.abs(Math.hypot(contact.normal.x,contact.normal.z)-1)>.01)return null;
   const previous=contacts.get(targetId);contacts.set(targetId,tick);
   while(contacts.size>profile.maxContacts)contacts.delete(contacts.keys().next().value);
   if(previous!==undefined)return null;
   const velocity=truck.velocity??{x:Math.sin(truck.heading)*truck.speed,z:Math.cos(truck.heading)*truck.speed};
   const relativeVelocity={x:finite(velocity.x)-finite(targetVelocity.x),z:finite(velocity.z)-finite(targetVelocity.z)};
   const closingSpeed=Math.max(0,-dot(relativeVelocity,contact.normal));if(closingSpeed<profile.scrapeSpeed)return null;
   const event={id:`impact:${profile.truckId}:${targetId}:${++serial}`,truckId:profile.truckId,targetId,tick,seed,
    point:{...contact.point},normal:{...contact.normal},relativeVelocity,closingSpeed,
    effectiveMass:finite(truck.effectiveMass,6500),targetMass,heading:finite(truck.heading),
    contactOffset:{x:contact.point.x-truck.position.x,z:contact.point.z-truck.position.z}};
   return {...event,response:resolveImpactResponse(event,profile)};
  },
  endFrame(){for(const [id,last]of contacts)if(last!==tick)contacts.delete(id);},
  release(id){contacts.delete(id);},reset(){contacts.clear();serial=0;tick=0;},
  snapshot(){return{truckId:profile.truckId,contacts:contacts.size,sequence:serial,tick};}
 };
}
// Transient clock belongs to presentation, independent of the game simulation.
export function createImpactClock(){let remaining=0;return{
 request(seconds,scale=1){remaining=Math.max(remaining,clamp(finite(seconds)*clamp(finite(scale),0,1),0,.09));},
 advance(seconds){const held=remaining>0;remaining=Math.max(0,remaining-clamp(finite(seconds),0,.25));return held;},
 reset(){remaining=0;},get remaining(){return remaining;}
};}
