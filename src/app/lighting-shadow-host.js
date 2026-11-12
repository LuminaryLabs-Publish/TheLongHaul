/* Local illustrated sunlight and contact occlusion. One moving near-camera
 * shadow map; never owns gameplay/physics, scene streaming, or weather state.
 * Load after the authored hero and traffic hosts, before Start is enabled. */
(() => {
  'use strict';
  const config = lightingPreset(settings.quality);
  let preset = config, lastMapAt=-Infinity, lastSelectAt=-Infinity;
  let anchor=null, casters=new Set(), selectionCount=0, mapUpdates=0, aoCount=0;
  const local = new THREE.Vector3(), dummy=new THREE.Object3D();
  const candidates=[], trees=[], occlusion=[];
  // Light colors and strengths belong to lighting-host.js, not this shadow scheduler.
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=true;
  sun.castShadow=true;
  // Layer 1 holds only bounded tree-shadow proxies; camera gameplay remains layer 0.
  sun.shadow.camera.layers?.enable?.(1);
  sun.shadow.camera.near=1;
  sun.shadow.camera.far=390;
  sun.shadow.bias=-0.00018;
  sun.shadow.normalBias=.022;
  sun.shadow.radius=2;
  sun.shadow.camera.left=-preset.halfSpan;
  sun.shadow.camera.right=preset.halfSpan;
  sun.shadow.camera.top=preset.halfSpan;
  sun.shadow.camera.bottom=-preset.halfSpan;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.mapSize.set(preset.mapSize,preset.mapSize);

  // One instanced batch of soft grounding decals; no full-screen SSAO pass.
  const aoCanvas=document.createElement('canvas');aoCanvas.width=aoCanvas.height=64;
  const ctx=aoCanvas.getContext('2d');
  const radial=ctx.createRadialGradient(32,32,3,32,32,31);
  radial.addColorStop(0,'rgba(15,23,35,.58)');
  radial.addColorStop(.52,'rgba(15,23,35,.23)');
  radial.addColorStop(1,'rgba(15,23,35,0)');
  ctx.fillStyle=radial;ctx.fillRect(0,0,64,64);
  const aoTexture=new THREE.CanvasTexture(aoCanvas);
  const aoMaterial=new THREE.MeshBasicMaterial({map:aoTexture,transparent:true,opacity:.65,
    depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,side:THREE.DoubleSide,fog:true});
  const aoGeometry=new THREE.PlaneGeometry(1,1);aoGeometry.rotateX(-Math.PI/2);
  const aoMesh=new THREE.InstancedMesh(aoGeometry,aoMaterial,LIGHTING_SHADOW_PRESETS.high.aoInstances);
  aoMesh.name='LH_BudgetedAmbientContact';aoMesh.frustumCulled=false;
  aoMesh.castShadow=false;aoMesh.receiveShadow=false;aoMesh.count=0;aoMesh.renderOrder=1;
  worldRoot.add(aoMesh);

  const nonCasterMaterials=new Set([materials.terrain,materials.road,
    materials.grass,materials.marking]);
  for(const candidate of [
    typeof _lhAsphaltMaterial==='undefined'?null:_lhAsphaltMaterial,
    typeof _lhPavedShoulderMaterial==='undefined'?null:_lhPavedShoulderMaterial,
    typeof _lhWhiteLineMaterial==='undefined'?null:_lhWhiteLineMaterial,
    typeof _lhYellowLineMaterial==='undefined'?null:_lhYellowLineMaterial,
  ])if(candidate)nonCasterMaterials.add(candidate);
  const isSolid = node => node?.isMesh && node.material &&
    !(Array.isArray(node.material)?node.material.some(m=>m.transparent||m.isMeshBasicMaterial):
      node.material.transparent||node.material.isMeshBasicMaterial);
  const prepared = new WeakSet();
  function prepareGroup(group){
    group?.traverse(obj=>{
      if(!obj.isMesh || prepared.has(obj))return;
      prepared.add(obj);obj.castShadow=false;
      if(isSolid(obj))obj.receiveShadow=true;
    });
  }
  prepareGroup(arcadeTrafficRoot);
  if(truckRig?.root)prepareGroup(truckRig.root);
  for(const entry of cellHosts.values())prepareGroup(entry.group);
  const previousRealize=realizeCell;
  realizeCell=function shadowAwareRealize(...args){const result=previousRealize(...args);
    prepareGroup(cellHosts.get(args[0]?.cellId)?.group);return result;};
  const previousDecorate=decorateCell;
  decorateCell=function shadowAwareDecorate(...args){const result=previousDecorate(...args);
    prepareGroup(cellHosts.get(args[0]?.id)?.group);return result;};
  // Authored traffic variants arrive lazily. Disable default casting BEFORE
  // their first shadow render, including all hidden far-LOD geometry.
  const preparedTrafficIds=new WeakMap();
  const previousTraffic=arcadeTrafficUpdate;
  arcadeTrafficUpdate=function shadowAwareTraffic(...args){
    const result=previousTraffic(...args);
    for(const vehicle of arcadeVehicles){
      if(!vehicle.active||preparedTrafficIds.get(vehicle)===vehicle.id)continue;
      prepareGroup(vehicle.group);
      preparedTrafficIds.set(vehicle,vehicle.id);
    }
    return result;
  };
  const previousBuild=buildTruck;
  buildTruck=function shadowAwareTruck(...args){const rig=previousBuild(...args);
    prepareGroup(rig?.root);return rig;};

  const heroCaster=/cab_shell|hood_sculpt|fender|freight_bed_base|tail_gate|wheel.*tire|chassis|bumper|roof|door|fuel_.*tank|grille_recess/i;
  function addCandidate(node,position){
    if(!isSolid(node))return;
    candidates.push({node,position});
  }
  function refreshCasters(truck) {
    candidates.length=0;trees.length=0;
    const center=truck.position, nearSq=preset.casterRadius*preset.casterRadius;
    if(truckRig?.root){
      const important=[];
      truckRig.root.traverse(node=>{
        if(isSolid(node)&&heroCaster.test(node.name))important.push(node);
      });
      for(const node of important.slice(0,preset.heroCasters))addCandidate(node,center);
    }
    const close=selectClosest(arcadeVehicles.filter(v=>v.active&&v.group.visible)
      .map(v=>({position:v.group.position,v})),center,preset.casterRadius,preset.trafficVehicles);
    for(const item of close){
      let count=0;
      item.v.group.traverseVisible(node=>{
        if(count>=preset.trafficCastersEach||!isSolid(node))return;
        if(node.name.includes('_far_'))return;
        addCandidate(node,item.position);count++;
      });
    }
    const staticOptions=[];
    for(const entry of cellHosts.values()){
      if(entry.visualOnly||!entry.patch?.bounds)continue;
      const b=entry.patch.bounds, x=Math.max(b.minX,Math.min(center.x,b.maxX)),
        z=Math.max(b.minZ,Math.min(center.z,b.maxZ));
      if((center.x-x)**2+(center.z-z)**2>nearSq)continue;
      entry.group.traverse(node=>{
        if(!isSolid(node) || nonCasterMaterials.has(node.material))return;
        if(node.material===materials.tree){
          trees.push({node,position:{x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2}});return;
        }
        if(node.scale.y<.55||node.scale.x<.17||node.scale.z<.17)return;
        node.getWorldPosition(local);
        const pos={x:local.x,z:local.z};
        if(planarDistanceSquared(pos,center)<=nearSq)staticOptions.push({node,position:pos});
      });
    }
    for(const item of selectClosest(staticOptions,center,preset.casterRadius,preset.staticCasters))
      addCandidate(item.node,item.position);
    for(const item of selectClosest(trees,center,preset.casterRadius,preset.treeCasters))
      addCandidate(item.node,item.position);
    const next=new Set(candidates.map(item=>item.node));
    for(const mesh of casters)if(!next.has(mesh))mesh.castShadow=false;
    for(const mesh of next){prepareGroup(mesh);mesh.castShadow=true;}
    casters=next;selectionCount++;
  }
  function rebuildOcclusion(truck) {
    occlusion.length=0;
    const center=truck.position,r2=preset.aoRadius*preset.aoRadius;
    for(const entry of cellHosts.values()){
      if(entry.visualOnly)continue;
      for(const o of entry.obstacles||[]){
        if(o.kind!=='tree'&&o.kind!=='rock')continue;
        const dx=o.x-center.x,dz=o.z-center.z;
        if(dx*dx+dz*dz>r2)continue;
        occlusion.push({position:{x:o.x,z:o.z},size:o.kind==='tree'?2.8:1.7,kind:o.kind});
      }
      for(const segment of entry.patch?.roads||[]){
        if(segment.a?.structure!=='bridge'&&segment.a?.structure!=='tunnel')continue;
        const p=segment.a,dx=p.x-center.x,dz=p.z-center.z;
        if(dx*dx+dz*dz>r2)continue;
        occlusion.push({position:{x:p.x,z:p.z},size:3,kind:'structure'});
      }
    }
    for(const v of arcadeVehicles){
      if(!v.active||!v.group.visible)continue;
      occlusion.push({position:{x:v.group.position.x,y:v.group.position.y+.09,z:v.group.position.z},size:Math.min(4,v.collider.width*1.3),kind:'traffic'});
    }
    const selected=selectClosest(occlusion,center,preset.aoRadius,preset.aoInstances);
    let i=0;
    for(const item of selected){
      const x=item.position.x,z=item.position.z;
      dummy.position.set(x,item.position.y??terrainHeight(course,x,z)+.055,z);
      dummy.rotation.set(0,0,0);
      dummy.scale.set(item.size,1,item.size*(item.kind==='traffic'?1.8:1));
      dummy.updateMatrix();aoMesh.setMatrixAt(i++,dummy.matrix);
    }
    aoMesh.count=i;aoCount=i;
    if(i)aoMesh.instanceMatrix.needsUpdate=true;
  }
  function configureQuality(quality) {
    const next=lightingPreset(quality);
    if(next===preset)return;
    preset=next;
    sun.shadow.mapSize.set(preset.mapSize,preset.mapSize);
    sun.shadow.camera.left=-preset.halfSpan;sun.shadow.camera.right=preset.halfSpan;
    sun.shadow.camera.top=preset.halfSpan;sun.shadow.camera.bottom=-preset.halfSpan;
    sun.shadow.camera.updateProjectionMatrix();
    if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
    lastMapAt=-Infinity;lastSelectAt=-Infinity;
    renderer.shadowMap.needsUpdate=true;
  }
  function updateLighting(now) {
    configureQuality(settings.quality);
    const active=currentScene()==='driving'&&Boolean(course);
    aoMesh.visible=active;
    if(!active)return;
    const state=readTruck();
    const wanted=shadowAnchor(state,preset);
    if(shouldRefresh(lastMapAt,now,anchor,wanted,preset)){
      anchor=wanted;lastMapAt=now;mapUpdates++;
      renderer.shadowMap.needsUpdate=true;
    }
    // Keep direction fixed to the last map focus between shadow updates.
    const focus=anchor||wanted;
    // The illumination host consumes the same snapped pose before the render.
    window.__longHaulShadowFocus=focus;
    if(!Number.isFinite(lastSelectAt)||now-lastSelectAt>=1000/preset.selectionHz){
      lastSelectAt=now;refreshCasters(state);rebuildOcclusion(state);
      renderer.shadowMap.needsUpdate=true;
    }
    const truckBlob=worldRoot.getObjectByName('truck-contact-shadow');
    if(truckBlob?.visible)truckBlob.material.opacity*=.34;
  }
  const originalFrame=arcadeVisualFrame;
  arcadeVisualFrame=function illustratedLightingFrame(now){originalFrame(now);updateLighting(now);};
  window.LongHaulLighting={getState:()=>({source:LIGHTING_SOURCE.id,
    status:'active',quality:settings.quality?'high':'low',mapSize:preset.mapSize,
    shadowHz:preset.shadowHz,shadowUpdates:mapUpdates,selectionPasses:selectionCount,
    shadowCasters:casters.size,shadowCasterCap:profileSummary(settings.quality).casterCap,
    occlusionInstances:aoCount,occlusionCap:preset.aoInstances,
    shadowMapEnabled:renderer.shadowMap.enabled,sunCasts:sun.castShadow,
    physicalGpuVerified:false})};
  window.__longHaulLightingReady=true;
})();
