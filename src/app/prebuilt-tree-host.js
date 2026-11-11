/* The Long Haul: deterministic prebuilt GLB tree presentation.
 * Loaded after environment and shadow hosts. No World/physics/road mutations.
 * A failed asset load retains the existing procedural fallback. */
(() => {
  'use strict';
  const MAX_INSTANCES=240;
  const perSpecies=new Map();
  const assetBase=new URL('../../assets/trees/',document.currentScript.src);
  const root=new THREE.Group();
  root.name='LH_PREBUILT_TREE_LIBRARY';
  const dummy=new THREE.Object3D();
  const state={version:PREBUILT_TREE_VERSION,status:'loading',ready:false,source:'prebuilt-embedded-GLBs',
    species:TREE_SPECIES.map(x=>x.id),levels:3,visible:0,batches:0,triangles:0,
    farInstances:0,activeCells:0,quality:true,lastError:null};
  const exposed=window.LongHaulPrebuiltTrees={ready:false,readyPromise:null,getState:()=>({...state})};
  const filename=(species,lod)=>new URL(species.files[lod],assetBase).href;
  // The host uses exactly the committed GLB files, not a procedural substitute.
  async function fetchGlb(url){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{
      const response=await fetch(url,{signal:controller.signal,cache:'force-cache'});
      if(!response.ok)throw Error(`Tree GLB HTTP ${response.status}: ${url}`);
      return parsePrebuiltTreeGlb(await response.arrayBuffer());
    }finally{clearTimeout(timer);}
  }
  function releaseStaged(){
    root.removeFromParent();
    for(const models of perSpecies.values())for(const level of models){
      for(const part of level.parts){part.mesh?.removeFromParent();part.mesh?.dispose?.();part.geometry?.dispose?.();}
    }
    for(const models of perSpecies.values())for(const material of models[0]?.materials??[]){material.map?.dispose?.();material.dispose?.();}
    perSpecies.clear();
  }
  async function loadLibrary(){
    try{
      // Fetch concurrently to bound startup latency. LOD0 owns the two
      // canonical embedded textures; lighter LODs reuse its PBR materials.
      await Promise.all(TREE_SPECIES.map(async species=>{
        if(species.id==='red_maple'&&typeof createNeighborhoodTree==='function'){
          const response=await fetch(new URL('../neighborhood/Tree_Maple.glb',assetBase));
          if(!response.ok)throw Error('Neighborhood maple unavailable');
          const bytes=await response.arrayBuffer();
          // The solid canopy is only 292 triangles. Fixed geometry at all
          // distances avoids leaf-card noise and changes of silhouette.
          perSpecies.set(species.id,[0,1,2].map(()=>createNeighborhoodTree(THREE,bytes,species.height)));
          return;
        }
        const parsed=await Promise.all(species.files.map((_,lod)=>fetchGlb(filename(species,lod))));
        const first=await createPrebuiltTreeMeshes(THREE,parsed[0]);
        const levels=[first];
        for(let lod=1;lod<=2;lod++)levels.push(await createPrebuiltTreeMeshes(THREE,parsed[lod],first.materials));
        if(!(levels[0].triangles>levels[1].triangles&&levels[1].triangles>levels[2].triangles))throw Error(`Tree LOD order invalid: ${species.id}`);
        perSpecies.set(species.id,levels);
      }));
      for(const levels of perSpecies.values())for(const level of levels)for(const part of level.parts){
        const mesh=new THREE.InstancedMesh(part.geometry,part.material,MAX_INSTANCES);
        mesh.name=`LH_PREBUILT_${part.role}`;
        mesh.count=0;
        mesh.frustumCulled=false; // moving global instance bounds are explicitly budgeted
        mesh.castShadow=false;
        mesh.receiveShadow=true;
        mesh.userData.prebuiltTrees=true;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        root.add(mesh);part.mesh=mesh;state.batches++;
      }
      cellRoot.add(root);
      state.status='loaded';state.ready=true;exposed.ready=true;
      removeProceduralTreeMeshes();
      rebuild(true);
      return true;
    }catch(error){
      state.status='fallback';state.lastError=String(error);state.ready=false;exposed.ready=false;
      releaseStaged();console.warn('Prebuilt trees unavailable; retained original geometry',error);
      return false;
    }
  }
  function removeProceduralTreeMeshes(entryOnly=null){
    if(!state.ready)return;
    for(const entry of (entryOnly?[entryOnly]:cellHosts.values())){
      for(const child of [...entry.group.children]){
        if(!child.isMesh||child.material!==materials.tree)continue;
        child.removeFromParent();
        const owned=entry.owned?.geometries,idx=owned?.indexOf(child.geometry)??-1;
        if(idx>=0)owned.splice(idx,1);
        child.geometry.dispose();
      }
    }
  }
  function captureCandidates(){
    const found=[];const position=readTruck().position;
    for(const entry of cellHosts.values()){
      const patch=entry.patch,b=patch?.bounds;
      if(b&&Math.hypot(Math.max(b.minX-position.x,0,position.x-b.maxX),Math.max(b.minZ-position.z,0,position.z-b.maxZ))>590)continue;
      for(const [i,tree] of (patch?.vegetation??[]).entries()){
        // Far World cells already use one in six trees in the original host.
        if(entry.visualOnly&&i%6!==0)continue;
        found.push({id:tree.id,position:tree.position,
          species:speciesForTree(tree),height:12*tree.scale[1],
          widthX:tree.scale[0],widthZ:tree.scale[2],angle:Number(tree.rotation)||0,kind:'world'});
      }
      // The 200m authored environment tree descriptions remain the sole
      // placement authority; the primitive canopy adapter skips only when
      // the ready GLB host will supply their visual geometry here.
      for(const obj of entry.environmentTileState?.plan?.objects??[]){
        if(!isTreeEnvironmentObject(obj))continue;
        const pos=obj.position;
        found.push({id:obj.id,position:[pos.x,pos.y,pos.z],
          species:speciesForTree(obj),height:Math.max(5.5,Math.min(15,7.2*obj.scale)),
          widthX:1,widthZ:1,angle:Number(obj.heading)||0,kind:'authored'});
      }
    }
    return found;
  }
  const previousLod=new Map();
  function lodWithHysteresis(tree,quality){
    const preferred=tree.lod,previous=previousLod.get(tree.id);
    if(previous===undefined){previousLod.set(tree.id,preferred);return preferred;}
    const near=quality?105:65,mid=quality?260:145;
    const d=tree.distance;
    const lod=previous===0&&d<near*1.17?0:
      previous===1&&d>near*.86&&d<mid*1.17?1:
      previous===2&&d>mid*.86?2:preferred;
    previousLod.set(tree.id,lod);return lod;
  }
  function rebuild(force=false){
    if(!state.ready)return;
    if(root.parent!==cellRoot)cellRoot.add(root);
    let truck;
    try{truck=readTruck()?.position;}catch{return;}
    if(!truck||![truck.x,truck.y,truck.z].every(Number.isFinite))return;
    const quality=settings.quality!==false;
    const candidates=selectVisibleTreeInstances(captureCandidates(),[truck.x,truck.y,truck.z],{quality});
    const assigned=new Map();
    for(const species of TREE_SPECIES)for(let lod=0;lod<3;lod++)assigned.set(`${species.id}:${lod}`,[]);
    for(const item of candidates){
      const lod=lodWithHysteresis(item,quality);
      assigned.get(`${item.species}:${lod}`).push(item);
    }
    for(const [species,levels] of perSpecies.entries())for(const [lod,level] of levels.entries()){
      const items=assigned.get(`${species}:${lod}`);
      for(const part of level.parts){
        const mesh=part.mesh;mesh.count=items.length;
        for(let i=0;i<items.length;i++){
          const item=items[i],info=TREE_SPECIES.find(x=>x.id===item.species);
          const scale=item.height/info.height;
          dummy.position.set(item.position[0],item.position[1],item.position[2]);
          dummy.rotation.set(0,item.angle,0);
          dummy.scale.set(scale*item.widthX,scale,scale*item.widthZ);
          dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate=true;
      }
    }
    state.status='active';state.activeCells=cellHosts.size;
    state.visible=candidates.length;state.farInstances=candidates.filter(x=>x.lod===2).length;
    state.triangles=TREE_SPECIES.reduce((total,species)=>total+perSpecies.get(species.id).reduce((sum,level,lod)=>sum+level.triangles*assigned.get(`${species.id}:${lod}`).length,0),0);
    state.quality=quality;
    // Memory is bounded by world-cell release and fixed InstancedMesh capacity.
    if(previousLod.size>5000){const kept=new Set(candidates.map(x=>x.id));for(const id of previousLod.keys())if(!kept.has(id))previousLod.delete(id);}
  }
  const beforeDecorate=decorateCell;
  decorateCell=function prebuiltTreesDecorate(job){
    const result=beforeDecorate(job);
    if(state.ready){const entry=cellHosts.get(job?.id);if(entry===job?.entry)removeProceduralTreeMeshes(entry);}
    return result;
  };
  const beforeRelease=releaseCell;
  releaseCell=function prebuiltTreesRelease(id){
    const result=beforeRelease(id);
    previousLod.delete(id);
    return result;
  };
  const beforeClear=clearWorld;
  clearWorld=function prebuiltTreesClear(...args){
    for(const levels of perSpecies.values())for(const level of levels)for(const part of level.parts)part.mesh.count=0;
    previousLod.clear();state.visible=0;state.activeCells=0;
    return beforeClear(...args);
  };
  const beforeCloud=updateCloudLayers;let lastUpdated=-Infinity;
  updateCloudLayers=function prebuiltTreesFrame(stateArg,milliseconds){
    const result=beforeCloud(stateArg,milliseconds);
    if(state.ready&&(milliseconds-lastUpdated>=250||lastUpdated>milliseconds)){
      lastUpdated=milliseconds;removeProceduralTreeMeshes();rebuild();
    }
    return result;
  };
  // Reuse the exact loaded GLB meshes for the isolated title/loading world.
  // The gameplay-owned cell registry and World state are never touched here.
  // The regular gameplay rebuild takes the batches back on scene transition.
  exposed.renderPreview=function renderTitlePreview(placements,focus,parent){
    if(!state.ready||!parent||!Array.isArray(placements)||!Array.isArray(focus))return false;
    try{
      if(root.parent!==parent)parent.add(root);
      const found=placements.map(tree=>({
        id:tree.id,position:tree.position,species:speciesForTree(tree),
        height:12*(tree.scale?.[1]??1),widthX:tree.scale?.[0]??1,
        widthZ:tree.scale?.[2]??1,angle:Number(tree.rotation)||0
      }));
      const selected=selectVisibleTreeInstances(found,focus,{quality:settings.quality!==false});
      const assigned=new Map();
      for(const species of TREE_SPECIES)for(let lod=0;lod<3;lod++)
        assigned.set(species.id+':'+lod,[]);
      for(const tree of selected)
        assigned.get(tree.species+':'+tree.lod)?.push(tree);
      for(const [species,levels] of perSpecies.entries())
        for(const [lod,level] of levels.entries()){
          const trees=assigned.get(species+':'+lod)??[];
          const info=TREE_SPECIES.find(t=>t.id===species);
          for(const part of level.parts){
            const count=Math.min(trees.length,MAX_INSTANCES),mesh=part.mesh;
            mesh.count=count;
            for(let i=0;i<count;i++){
              const tree=trees[i],scale=tree.height/info.height;
              dummy.position.set(...tree.position);
              dummy.rotation.set(0,tree.angle,0);
              dummy.scale.set(scale*tree.widthX,scale,scale*tree.widthZ);
              dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate=true;
          }
        }
      return true;
    }catch(error){
      console.warn('Title tree preview fallback',error);
      return false;
    }
  };
  exposed.readyPromise=loadLibrary();
})();