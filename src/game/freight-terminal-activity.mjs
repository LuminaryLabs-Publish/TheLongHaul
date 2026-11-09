// TLH terminal activity. Pure, deterministic local-space traffic schedules;
// the world/road/truck Kits retain physics, course and save authority.
// Motion advances only during active gameplay. No randomness or Date.now().
const routes = Object.freeze([
  {id:'outbound-staging',kind:'departure',delay:3,speed:9.2,hold:14,
    points:[[-120,-215],[-112,-240],[-48,-245],[35,-244],[88,-264],[135,-324],[165,-398],[177,-474]]},
  {id:'inbound-loading',kind:'arrival',delay:16,speed:7.5,hold:18,
    points:[[177,-474],[166,-389],[140,-302],[83,-220],[68,-126],[40,-68],[-31,-60],[-65,-45]]},
  {id:'outbound-loading',kind:'departure',delay:34,speed:8.7,hold:22,
    points:[[-69,-38],[-82,-95],[-85,-203],[-30,-243],[52,-249],[130,-314],[170,-406],[177,-474]]},
]);
export const FREIGHT_TERMINAL_TRAFFIC = Object.freeze({id:'long-haul.terminal-activity/1',vehicles:routes.length});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lengths=routes.map(route=>{
  const values=[0];for(let i=1;i<route.points.length;i++)values.push(values[i-1]+Math.hypot(route.points[i][0]-route.points[i-1][0],route.points[i][1]-route.points[i-1][1]));
  return values;
});
// A given vehicle loops after a long inactive interval instead of teleporting
// from an occupied dock to the exit while the player is still in the yard.
export function evaluateFreightTerminalTraffic(elapsed,{active=true}={}){
  if(!Number.isFinite(elapsed)||elapsed<0)throw new TypeError('Invalid freight terminal gameplay time');
  if(!active)return [];
  return routes.map((route,index)=>{
    const duration=lengths[index].at(-1)/route.speed;
    const cycle=190+index*23;
    const t=(elapsed-route.delay+cycle*10)%cycle;
    if(t>duration+route.hold+12)return null;
    const travel=clamp(t*route.speed,0,lengths[index].at(-1));
    let segment=lengths[index].length-2;
    for(let j=0;j<lengths[index].length-1;j++)if(travel<=lengths[index][j+1]){segment=j;break;}
    const a=route.points[segment],b=route.points[segment+1];
    const f=clamp((travel-lengths[index][segment])/(lengths[index][segment+1]-lengths[index][segment]||1),0,1);
    const dx=b[0]-a[0],dz=b[1]-a[1];
    return {id:route.id,kind:route.kind,x:a[0]+dx*f,z:a[1]+dz*f,
      heading:Math.atan2(dx,dz),speed:t<duration?route.speed:0,progress:travel,
      arrived:t>=duration,phase:t<duration?'moving':'parked'};
  }).filter(Boolean);
}
export function terminalTrafficCollisionProxies(site,traffic){
  const c=Math.cos(site.yaw),s=Math.sin(site.yaw);
  return traffic.flatMap(actor=>{
    const x=site.x+c*actor.x+s*actor.z,z=site.z-s*actor.x+c*actor.z;
    const heading=actor.heading+site.yaw;
    return [-8,-3,2].map((offset,i)=>({id:`freight-terminal:traffic:${actor.id}`,
      x:x+Math.sin(heading)*offset,z:z+Math.cos(heading)*offset,y:site.y,
      height:4.7,radius:2.05,speed:actor.speed,kind:'terminal-moving-truck'}));
  });
}
export function terminalTrafficRoutes(){return routes.map((r,i)=>({...r,points:r.points.map(p=>[...p]),distance:lengths[i].at(-1)}));}
