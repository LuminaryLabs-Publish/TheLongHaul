// Distinct road levels in the same X/Z footprint must not share the same
// ground-height reading. Especially important for truck and traffic bridges.
import assert from 'node:assert/strict';
import {createRoadV3Journey,roadV3PointAt} from '../src/game/road-v3-journey.mjs';
import {roadV3GroundContact} from '../src/game/world-base.mjs';
import {createEndlessHighway} from '../src/game/endless-highway.mjs';
const near=(a,b,e=.2)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const course=createRoadV3Journey('road-v3-journey-proof',{mountains:12});
assert.ok(course.crossings.length>=12);
for(const c of course.crossings){
 const lower=roadV3PointAt(course,c.lowerProgress),upper=roadV3PointAt(course,c.upperProgress);
 const a=roadV3GroundContact(course,{...lower,y:lower.y+.92}),b=roadV3GroundContact(course,{...upper,y:upper.y+.92});
 assert.ok(a&&b,'both bridge levels have a road collision contact');
 near(a.height,lower.y);near(b.height,upper.y);
 // A truck driving on the natural ground beneath an elevated bridge must
 // never snap to the upper road just because its X/Z footprint overlaps.
 const beneath=roadV3GroundContact(course,{...upper,y:upper.y-12});
 assert.ok(!beneath||beneath.height<upper.y-4,
   'a truck beneath a bridge must not be snapped to the upper road');
 assert.ok(roadV3GroundContact(course,{...upper,y:upper.y+2}),
   'truck above the deck still gets road contact');
 assert.ok(b.height-a.height>=9,'vertical clearance survives contact sampling');
 assert.ok(a.normal.y>.85&&b.normal.y>.85,'normalized road-deck normals');
}
assert.equal(roadV3GroundContact(createEndlessHighway('unchanged-v2'),{x:0,y:0,z:0}),null);
console.log(JSON.stringify({status:'PASS',crossings:course.crossings.length,scope:'V3 separate-height deck contact; V2 unchanged'}));
