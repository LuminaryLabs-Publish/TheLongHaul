import assert from 'node:assert/strict';
import {createEndlessHighway} from '../src/game/endless-highway.mjs';
import {attachFreightTerminalStart,terminalWorldPoint,terminalLocalPoint,terminalObstacleVolumes,FREIGHT_TERMINAL_VERSION} from '../src/game/freight-terminal-start.mjs';
import {evaluateFreightTerminalTraffic,terminalTrafficCollisionProxies,terminalTrafficRoutes} from '../src/game/freight-terminal-activity.mjs';
const routes=terminalTrafficRoutes();
assert.equal(routes.length,3);
for(const r of routes)assert.ok(r.distance>150&&r.speed>0,'moving route needs meaningful travel');
for(const seed of ['terminal-one','terminal-two','terminal-three']){
 const course=attachFreightTerminalStart(createEndlessHighway(seed));
 assert.equal(course.freightTerminal.id,FREIGHT_TERMINAL_VERSION);
 const spawn=terminalLocalPoint(course.freightTerminal,course.origin);
 assert.ok(Math.abs(spawn.x)<.01 && Math.abs(spawn.z+132)<.01,'player begins in a marked parking stall');
 const exit=course.edges.find(e=>e.id==='terminal:start-ramp');
 assert.ok(exit.samples.length>100,'full parking-to-highway ramp exists');
 assert.ok(Math.abs(exit.samples[0].x-course.origin.x)<.001,'ramp begins at parking bay');
 const blockers=terminalObstacleVolumes(course.freightTerminal);
 const site=course.freightTerminal;
 assert.ok(blockers.every(o=>Math.hypot(o.x-course.origin.x,o.z-course.origin.z)>o.radius+3),
 'parked trucks and cargo never block the player starting bay');
 let arrivals=0,departures=0,checked=0;
 for(let t=0;t<=180;t+=.25){
   const one=evaluateFreightTerminalTraffic(t),two=evaluateFreightTerminalTraffic(t);
   assert.deepEqual(one,two,'traffic state is deterministic');
   const proxies=terminalTrafficCollisionProxies(course.freightTerminal,one);
   assert.equal(proxies.length,one.length*3,'all moving trucks have collision proxy segments');
   for(const a of one){
     const head=terminalWorldPoint(site,[a.x+Math.sin(a.heading)*2,.2,a.z+Math.cos(a.heading)*2]);
     const back=terminalWorldPoint(site,[a.x-Math.sin(a.heading)*2,.2,a.z-Math.cos(a.heading)*2]);
     const marker=proxies.find(p=>p.id===`freight-terminal:traffic:${a.id}`);
     assert.ok(marker&&Number.isFinite(marker.x));
     assert.ok(Math.hypot(head.x-back.x,head.z-back.z)>3.9,'rotated terminal actor orientation remains valid');
   }
   for(const actor of one){
     if(actor.kind==='arrival')arrivals++;
     if(actor.kind==='departure')departures++;
     assert.ok(Number.isFinite(actor.x)&&Number.isFinite(actor.heading));
     const world=terminalWorldPoint(course.freightTerminal,[actor.x,.2,actor.z]);
     assert.ok(Number.isFinite(world.y));
     if(t<6)assert.ok(Math.hypot(world.x-course.origin.x,world.z-course.origin.z)>25,
      'first moving vehicles leave the player parking bay clear');
   }
   checked++;
 }
 assert.ok(arrivals>100&&departures>100,'both arrival and departure behaviors are active');
 console.log(JSON.stringify({seed,checked,arrivals,departures,status:'PASS'}));
}
