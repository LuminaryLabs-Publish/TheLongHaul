import assert from 'node:assert/strict';
import { createEndlessHighway, endlessHighwayPoint } from '../src/game/endless-highway.mjs';
import { createCourseCellDescriptor } from '../src/game/cell-descriptor.mjs';
import { roadChunkAt } from '../src/game/road-chunks.mjs';
// Match the real PlaneGeometry diagonal and host ground triangle interpolation.
function terrainTriangle(patch, point) {
  const {segments:n, heights:h} = patch.terrain;
  const gx=(point.x-patch.bounds.minX)/160*n, gz=(point.z-patch.bounds.minZ)/160*n;
  const ix=Math.min(n-1,Math.floor(gx)),iz=Math.min(n-1,Math.floor(gz)),u=gx-ix,v=gz-iz,a=iz*(n+1)+ix;
  const h00=h[a],h10=h[a+1],h01=h[a+n+1],h11=h[a+n+2];
  return u+v<=1?h00+(h10-h00)*u+(h01-h00)*v:h11+(h01-h11)*(1-u)+(h10-h11)*(1-v);
}
let checked=0, worst=-Infinity;
for (const seed of ['long-haul-acceptance-2026','road-matrix-1','road-matrix-19']) {
  for (let i=0;i<12;i++) {
    const progress=960+i*960,course=createEndlessHighway(seed,{progress});
    for (const resolution of [8,16]) {
      const patches=new Map();
      for(let s=progress-320;s<=progress+600;s+=40) {
        const chunk=roadChunkAt(seed,s);
        const routes=chunk.branch?['safe','branch']:chunk.kind==='freight'?['safe','risky']:['safe'];
        for(const route of routes) {
          const center=endlessHighwayPoint(course,s,0,route);
          for(const fraction of [-.48,-.3,0,.3,.48]) {
            const point=endlessHighwayPoint(course,s,center.width*fraction,route);
            const cx=Math.floor(point.x/160),cz=Math.floor(point.z/160),id=`${cx}:${cz}`;
            if(!patches.has(id))patches.set(id,createCourseCellDescriptor(course,{id,coordinates:[cx,cz],bounds:{minX:cx*160,maxX:(cx+1)*160,minZ:cz*160,maxZ:(cz+1)*160}},{terrainSegments:resolution}));
            const earth=terrainTriangle(patches.get(id),point), deck=point.y,penetration=earth-deck;
            worst=Math.max(worst,penetration);checked++;
            assert.ok(earth<=deck-.08,`${seed} ${s} ${route} res${resolution}: terrain ${earth} obscures deck ${deck}`);
          }
        }
      }
    }
  }
}
console.log(JSON.stringify({status:'PASS',checks:checked,highestSubgradeRelativeToDeck:worst,contract:'Actual rendered earth triangles remain below the unchanged physical/visual road deck.'}));
