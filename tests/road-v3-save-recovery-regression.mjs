// Real V3 course descriptors + freight journey + atomic save admission.
// Deliberately excludes WebGL/localStorage: browser/device acceptance is separate.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { createPlayableRoadV3Course, playableRoadV3Point } from '../src/game/road-v3-playable-course.mjs';
import { createFreightJourney, prepareFreightSave } from '../src/game/freight-journey.mjs';
import { ROAD_V3_VERSION } from '../src/game/road-v3-geometry.mjs';

const seed='v3-physical-freight-save-2026', sessionId='v3-physical-freight-2026';
const course=createPlayableRoadV3Course(seed);
const journey=createFreightJourney({seed,sessionId,generatorVersion:ROAD_V3_VERSION,roadGraph:()=>course});
const wallet={cash:750,deliveries:0,careerMiles:0,upgrades:{engine:2},unrelated:{keep:true}};
function checkpoint(progress){
  const p=playableRoadV3Point(course,progress),state=journey.snapshot();
  return {schema:'long-haul.freight-checkpoint/1',journey:state,
    truck:{position:{x:p.x,y:p.y+.92,z:p.z},velocity:{x:0,y:0,z:-26},heading:p.heading},
    run:{status:'running',rawTime:state.elapsed,distance:state.highWaterProgress},
    meters:{fuel:80,truck:92,cargo:state.contract.condition},bankedPoints:0,
    bestMultiplier:1,initialType:'standard',terminal:false};
}
const initial=checkpoint(0);
let saved=prepareFreightSave(wallet,initial,{expectedRevision:0});
assert.equal(saved.ok,true,'V3 initial snapshot can be saved');
const original=structuredClone(saved.save),initialRevision=saved.revision;
let progress=0,delivered=false,physicalPickups=0;
for(let i=0;i<3300;i++){
  progress+=(26/60);
  const point=playableRoadV3Point(course,progress);
  const events=journey.tick({progress,position:point,speed:26,dt:1/60,heading:point.heading,
    grounded:true,active:true,cargoCondition:100,truckCondition:92,collisionCount:0});
  physicalPickups+=events.filter(e=>e.type==='cargo-picked-up').length;
  if(events.some(e=>e.type==='cargo-delivered')){delivered=true;break;}
}
assert.equal(delivered,true,'V3 physically spaced wide pickup leads to a paid receiver');
assert.equal(physicalPickups,1);
assert.equal(journey.getState().completed,1);
const after=checkpoint(progress);
const paid=prepareFreightSave(saved.save,after,{expectedRevision:initialRevision});
assert.equal(paid.ok,true,'completed V3 haul settles against saved revision');
assert.equal(paid.cash,journey.getState().earnedCash);
assert.equal(paid.save.deliveries,1);
assert.deepEqual(paid.save.upgrades,wallet.upgrades);
assert.deepEqual(paid.save.unrelated,wallet.unrelated);
assert.equal(prepareFreightSave(paid.save,after,{expectedRevision:paid.revision}).cash,0,
  'replaying an identical V3 checkpoint cannot pay twice');
assert.equal(prepareFreightSave(paid.save,initial,{expectedRevision:paid.revision}).reason,'stale-checkpoint');
assert.equal(prepareFreightSave(paid.save,after,{expectedRevision:initialRevision}).reason,'save-conflict');
const incompatible=structuredClone(after);incompatible.journey.generatorVersion='long-haul-endless-v2';
assert.equal(prepareFreightSave(paid.save,incompatible,{expectedRevision:paid.revision}).ok,false,
  'saved V3 game cannot be resumed through a V2 generator');
assert.equal(original.freightJourney.journey.generatorVersion,ROAD_V3_VERSION);
const rebuilt=createPlayableRoadV3Course(seed,{progress:after.journey.progress});
const restored=createFreightJourney({seed,sessionId,generatorVersion:ROAD_V3_VERSION,
  snapshot:after.journey,roadGraph:()=>rebuilt});
assert.deepEqual(restored.snapshot(),after.journey,'V3 journey survives deterministic rebuild');
assert.equal(restored.getState().completed,1);
assert.equal(restored.getState().pickupStation.id,rebuilt.loadingStations.find(s=>s.index===0).id);

// An actual express shortcut is 40+ metres away from the main road at the
// pickup. Its entry decision, gate, clean-path check and reward must all use
// that same edge, not a synthetic lane near the highway centre.
const riskSeed='v3-risky-track-contract';
const riskCourse=createPlayableRoadV3Course(riskSeed);
const riskJourney=createFreightJourney({seed:riskSeed,sessionId:'v3-test-risky',
  generatorVersion:ROAD_V3_VERSION,roadGraph:()=>riskCourse});
const riskStation=riskCourse.loadingStations[0];
const riskEdge=riskCourse.edges.find(e=>riskStation.risky.edgeIds.includes(e.id));
assert.ok(riskEdge,'the risky lane is a connected physical edge');
function onRiskEdge(at){
  const points=riskEdge.samples;
  let i=1;while(i<points.length-1&&points[i].progress<at)i++;
  const a=points[i-1],b=points[i],t=Math.max(0,Math.min(1,(at-a.progress)/(b.progress-a.progress||1)));
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,
    heading:Math.atan2(b.x-a.x,b.z-a.z)};
}
const riskEvents=[];
let riskProgress=0;
for(let tick=0;tick<3300;tick++){
  riskProgress+=26/60;
  const point=riskProgress>=riskEdge.startProgress&&riskProgress<=riskEdge.endProgress
    ?onRiskEdge(riskProgress):playableRoadV3Point(riskCourse,riskProgress);
  const emitted=riskJourney.tick({position:point,progress:riskProgress,speed:26,dt:1/60,
    heading:point.heading,grounded:true,active:true,cargoCondition:100,truckCondition:92,collisionCount:0});
  riskEvents.push(...emitted);
  if(emitted.some(e=>e.type==='cargo-delivered'))break;
}
assert.equal(riskJourney.getState().completed,1,'the risky physical branch leads to the receiver');
assert.equal(riskJourney.getState().contract.pickedRoute,'risky');
assert.equal(riskJourney.getState().contract.routeRewarded,true);
assert.equal(riskEvents.filter(e=>e.type==='loading-route-complete').length,1,
  'one clean express route produces exactly one reward event');
assert.equal(riskEvents.filter(e=>e.type==='cargo-picked-up'&&e.route==='risky').length,1);
// Browser host guards: road-deck altitude and graph progress must own the
// visible freight gate; V2 retains its legacy terrain-height fallback.
const freightHost=readFileSync(new URL('../src/app/app-chunk-20.js',import.meta.url),'utf8');
assert.match(freightHost,/freightGateHeight=point=>course\?\.generatorVersion===ROAD_V3_VERSION/);
assert.match(freightHost,/freightGateHeight\(point\)\+\.15/);
assert.match(freightHost,/station\.progress-roadProgress/);
assert.match(freightHost,/deliveryProgress-roadProgress/);
assert.doesNotMatch(freightHost,/station\.progress\+truck\.position\.z/);
assert.doesNotMatch(freightHost,/deliveryProgress\+truck\.position\.z/);
console.log(JSON.stringify({status:'PASS',scope:'actual V3 safe and risky loading geometry, physical paid delivery, express reward, atomic save, generator isolation and restore',progress,physicalPickups,deliveries:paid.save.deliveries,cash:paid.cash,riskyProgress:riskProgress,riskyRewardEvents:1}));
