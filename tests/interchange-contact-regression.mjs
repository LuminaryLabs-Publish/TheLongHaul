import test from 'node:test';
import assert from 'node:assert/strict';
import {createHighwayInterchange,applyInterchangeDeckSpan} from '../src/game/highway-interchange.mjs';
import {selectRoadDeckContact} from '../src/game/road-deck-contact.mjs';
const index=3,offset=index*320;
const main={id:'endless:highway:3',from:'endless:node:3',to:'endless:node:4',branchId:'trunk',
 type:'endless-highway',startProgress:offset,endProgress:offset+320,sectionIndex:index,width:28,
 samples:Array.from({length:65},(_,k)=>({x:0,y:16,z:-(offset+k*5),progress:offset+k*5,
  width:28,heading:Math.PI,nx:-1,nz:0,grade:0,bank:0}))};
const site=createHighwayInterchange([main],index);
if(!site)throw Error('Fixture must yield an interchange');
const roads=[...applyInterchangeDeckSpan([main],site),...site.edges];
const candidatesAt=(pos)=>roads.flatMap(edge=>edge.samples.slice(1).map((b,i)=>({a:edge.samples[i],b,edge,segmentIndex:i}))).filter(({a,b})=>{
 const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz||1;
 const t=Math.max(0,Math.min(1,((pos.x-a.x)*dx+(pos.z-a.z)*dz)/den));
 return Math.hypot(pos.x-(a.x+dx*t),pos.z-(a.z+dz*t))<22;
});
test('lower underpass supports the truck without lifting it to highway',()=>{
 const low=site.edges[0].samples[15];
 const p={x:low.x,y:low.y+.92,z:low.z};
 const result=selectRoadDeckContact(p,candidatesAt(p));
 assert.ok(result);assert.ok(Math.abs(result.height-low.y)<.05);
 assert.equal(result.road.edge.type,'underpass');
});
test('upper bridge supports a truck on deck, not the lower road',()=>{
 const p={x:site.crossing.x,y:site.crossing.y+.92,z:site.crossing.z};
 const result=selectRoadDeckContact(p,candidatesAt(p));
 assert.ok(result);assert.ok(Math.abs(result.height-site.crossing.y)<.05);
 assert.equal(result.road.edge.type,'endless-highway');
});
test('ramp is selectable along its actual physical elevation',()=>{
 const p0=site.edges[1].samples[55];
 const p={x:p0.x,y:p0.y+.92,z:p0.z};
 const result=selectRoadDeckContact(p,candidatesAt(p));
 assert.ok(result);assert.ok(Math.abs(result.height-p0.y)<.2);
});
test('merge seam supports truck on the highway',()=>{
 const p={x:site.merge.x,y:site.merge.y+.92,z:site.merge.z};
 const result=selectRoadDeckContact(p,candidatesAt(p));
 assert.ok(result);assert.ok(Math.abs(result.height-site.merge.y)<.01);
});
