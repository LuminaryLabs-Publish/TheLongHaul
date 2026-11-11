import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import {createLongHaulTruckKit} from '../src/game/truck-kit.mjs';
import {createLongHaulMovementV2Kit} from '../src/game/truck-movement-v2-kit.mjs';
import {createComicCrashKits} from '../src/game/destructible-vehicle-kit.mjs';
import {resolveImpactResponse} from '../src/game/impact-kit.mjs';
for(const factory of [createLongHaulTruckKit,createLongHaulMovementV2Kit]){
 const run=(side,mass=6500)=>{
  const bundle=factory(N),e=N.createEngine({kits:[bundle.kit,...createComicCrashKits(N)]});e.world.__longHaulScene='driving';
  const api=e.n.longHaulTruck,s=api.getState();api.loadSnapshot({...s,position:{x:0,y:1,z:0},velocity:{x:0,y:0,z:30},speed:30,longitudinalSpeed:30,boostCruiseSpeed:40,grounded:true});
  const r=resolveImpactResponse({normal:{x:side*.6,z:-.8},contactOffset:{x:side*1.5,z:3},closingSpeed:24,effectiveMass:mass,targetMass:1400,heading:0});
  const load=api.getState().loadFactors?.momentumScale||1;api.loadSnapshot({...api.getState(),boostCruiseSpeed:0});api.impulse({...r.impulse,x:r.impulse.x/load,z:r.impulse.z/load});
  e.tick(0);const changed=api.getState();assert.ok(changed.velocity.x*side>0);assert.ok(changed.velocity.z<30);assert.equal(changed.boostCruiseSpeed,0);assert.equal(changed.impactSequence,1);
  // Zero-duration ticks during hit stop must not integrate motion or repeat impulse.
  const position={...changed.position};for(let i=0;i<6;i++)e.tick(0);assert.deepEqual(api.getState().position,position);assert.equal(api.getState().impactSequence,1);
  for(let i=0;i<30;i++){api.input({throttle:0,groundHeight:0,surface:'road',surfaceGrip:1});e.tick(1/60);}
  return api.getState();
 };
 const right=run(1),left=run(-1);assert.ok(right.position.x>0&&left.position.x<0);assert.ok(Math.abs(right.position.x+left.position.x)<.01);assert.ok(Math.abs(right.heading+left.heading)<.01);
 assert.ok(Math.abs(run(1,14000).position.x)<Math.abs(right.position.x),'greater mass produces smaller physical deviation');
 console.log('PASS',factory.name,': actual installed movement, mirror impulses, mass response, boost cancellation, zero-step hit stop and one-shot response');
}
