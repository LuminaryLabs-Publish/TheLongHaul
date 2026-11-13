// The Long Haul presentation-only, deterministic lighting budgets.
// No physics, collisions, world state or renderer dependencies belong here.
import {PRESENTATION_PROFILE} from './scene-profiles.mjs';
export const LIGHTING_SHADOW_PRESETS=PRESENTATION_PROFILE.lightingShadowPresets;
export const LIGHTING_SOURCE=PRESENTATION_PROFILE.lightingSource;
export const lightingPreset = quality => quality ? LIGHTING_SHADOW_PRESETS.high : LIGHTING_SHADOW_PRESETS.low;
export const planarDistanceSquared = (a, b) => (a.x-b.x)**2 + (a.z-b.z)**2;
export function shadowAnchor(truck, preset) {
  const heading = Number.isFinite(truck?.heading) ? truck.heading : 0;
  const position = truck?.position ?? {x:0,y:0,z:0};
  const q=preset.texelSnap;
  const snap=n=>Math.round(n/q)*q;
  return {x:snap(position.x+Math.sin(heading)*12), y:snap(Math.max(0,position.y)+1), z:snap(position.z+Math.cos(heading)*12)};
}
export function shouldRefresh(lastAt, now, lastAnchor, nextAnchor, preset) {
  if(!Number.isFinite(lastAt)||!lastAnchor)return true;
  if(now-lastAt>=1000/preset.shadowHz)return true;
  return planarDistanceSquared(lastAnchor,nextAnchor)>16;
}
export function selectClosest(candidates,center,radius,maximum) {
  if(!Array.isArray(candidates)||!maximum||!radius)return [];
  const limit=radius*radius;
  return candidates.filter(x=>x?.position&&Number.isFinite(x.position.x)&&Number.isFinite(x.position.z))
    .map((x,i)=>({x,i,d:planarDistanceSquared(x.position,center)}))
    .filter(item=>item.d<=limit)
    .sort((a,b)=>a.d-b.d||a.i-b.i)
    .slice(0,maximum).map(x=>x.x);
}
export function profileSummary(quality) {
  const p=lightingPreset(quality);
  return {mapSize:p.mapSize,shadowHz:p.shadowHz,selectionHz:p.selectionHz,
    casterCap:p.heroCasters+p.staticCasters+p.treeCasters+p.trafficVehicles*p.trafficCastersEach,
    occlusionCap:p.aoInstances};
}
