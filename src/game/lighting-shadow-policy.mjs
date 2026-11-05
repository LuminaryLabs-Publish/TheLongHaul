// The Long Haul presentation-only, deterministic lighting budgets.
// No physics, collisions, world state or renderer dependencies belong here.
export const LIGHTING_SHADOW_PRESETS = Object.freeze({
  high: Object.freeze({ mapSize: 1024, halfSpan: 70, shadowHz: 24, selectionHz: 7,
    texelSnap: 140 / 1024, casterRadius: 93, staticCasters: 16, treeCasters: 2,
    trafficVehicles: 3, trafficCastersEach: 6, heroCasters: 18,
    aoInstances: 46, aoRadius: 90 }),
  low: Object.freeze({ mapSize: 512, halfSpan: 52, shadowHz: 15, selectionHz: 4,
    texelSnap: 104 / 512, casterRadius: 64, staticCasters: 8, treeCasters: 1,
    trafficVehicles: 2, trafficCastersEach: 4, heroCasters: 12,
    aoInstances: 22, aoRadius: 64 })
});
export const LIGHTING_SOURCE = Object.freeze({
  id: 'long-haul:presentation:local-sun-shadows:v1',
  method: 'single-orthographic-PCF-map+bounded-local-occlusion',
  owner: 'long-haul-presentation',
  engine: 'unchanged',
  dependencies: ['sun', 'hemi', 'illustrated 4-band toon', 'actual truck/traffic/cell groups']
});
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
