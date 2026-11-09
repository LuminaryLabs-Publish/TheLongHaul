/* TLH Loading Presentation V2: title + loading use the live game's renderer,
 * canonical Endless Road course/patch worker, terrain/road materials, authored
 * environment renderer and authored truck. No second render loop or gameplay
 * simulation. The preview owns its world data, never the player's course/save.
 */
(() => {
  'use strict';
  try {
    const title = document.querySelector('#title-screen');
    const loading = document.querySelector('#generating-screen');
    const seed = 'the-long-haul:cinematic-preview-v2';
    const previewCourse = createEndlessHighway(seed, {progress:0,generatorVersion:ROAD_GENERATOR_VERSION});
    const root = new THREE.Group();
    root.name='LH_CANONICAL_PREVIEW_WORLD';
    root.visible=false;
    worldRoot.add(root);
    const cells = new Map(), requested = new Set(), arrivals = [];
    const CENTER_RADIUS=2, MAX_CELLS=25, MAX_PENDING=2, SPEED=22;
    let worker=null, pending=0, lastFrame=null, progress=110, lastRevision=previewCourse.endless.revision;
    let mode='inactive', active=false, error=null, builds=0, releases=0, generations=0;
    let atmosphere=null, hero=null, lastTreeRefresh=-Infinity;
    const factory = createEnvironmentTileRenderer({THREE,materials});
    try {
      hero=createHeroTruckMesh({THREE,materials,createTruckGrounding});
      root.add(hero.root);
    } catch(e) { console.warn('Preview truck unavailable',e); }
    const removeOwned = entry => {
      if(!entry)return;
      entry.group.removeFromParent();
      if(entry.env)factory.releaseCell(entry.env.render);
      for(const geometry of entry.owned)geometry.dispose();
      cells.delete(entry.id);releases++;
    };
    function retireWorker() {
      worker?.dispose();worker=null;requested.clear();pending=0;arrivals.length=0;
    }
    function retireWorld() {
      retireWorker();
      for(const entry of [...cells.values()])removeOwned(entry);
    }
    const cellFor = (x,z) => ({
      id: WORLD_ID+':uniform-grid:0:'+x+':'+z,
      coordinates:[x,z],
      bounds:{minX:x*CELL_SIZE,maxX:(x+1)*CELL_SIZE,minZ:z*CELL_SIZE,maxZ:(z+1)*CELL_SIZE}
    });
    const distanceSq=(cell,p)=>{
      const dx=(cell.coordinates[0]+.5)*CELL_SIZE-p.x;
      const dz=(cell.coordinates[1]+.5)*CELL_SIZE-p.z;
      return dx*dx+dz*dz;
    };
    function onPatch(patch) {
      const group=new THREE.Group(),owned=[],id=patch.cellId;
      const ground=createTerrainMesh(patch);
      group.add(ground.mesh);owned.push(ground.geometry);
      // This is the actual road assembly from the driving renderer, not
      // independent title ribbons, an illustrated flat plane, or copied shaders.
      for(const [surface,asphalt,shoulder] of [
        ['paved',_lhAsphaltMaterial,_lhPavedShoulderMaterial],
        ['gravel',_lhRoughRoadMaterial??materials.roughRoad,materials.shoulder],
        ['dirt',materials.roughRoad,materials.shoulder]
      ]) {
        const segments=patch.roads.filter(r=>r.surface===surface);
        if(!segments.length)continue;
        const ownedEntry={geometries:owned};
        _lhRoadMesh(group,ownedEntry,segments,asphalt,shoulder);
      }
      // Reuse the existing precomputed vegetation mesh when the authored GLB
      // host has not loaded; that host takes over the same deterministic
      // placements when ready.
      const trees=patch.nearTrees;
      let proceduralTree=null;
      if(trees?.positions?.length){
        const geometry=new THREE.BufferGeometry();
        for(const [field,name] of [['positions','position'],['colors','color'],['normals','normal']])
          geometry.setAttribute(name,new THREE.BufferAttribute(trees[field],3));
        geometry.setIndex(new THREE.BufferAttribute(trees.indices,1));
        geometry.computeBoundingSphere();
        proceduralTree=new THREE.Mesh(geometry,materials.tree);
        group.add(proceduralTree);owned.push(geometry);
      }
      // The same n:authoring planner/renderer creates the gameplay roadside
      // scenery, and is incrementally stepped in this existing frame callback.
      const iterator=environmentCellPlanSteps(seed,patch.bounds,{
        terrainHeight:(x,z)=>terrainHeight(previewCourse,x,z),quality:settings.quality,
        roadSafety:(x,z,margin)=>{
          const nearest=nearestRoad(previewCourse,{x,z});
          return !nearest||nearest.distance>=(Number(nearest.edge?.width)||28)*.5+margin;
        }
      });
      const env={iterator,render:factory.startCell({quality:settings.quality,visualOnly:false}),
        phase:'plan',objects:null,index:0,finished:false};
      const entry={id,patch,group,owned,env,proceduralTree,coordinates:patch.coordinates};
      cells.set(id,entry);root.add(group);builds++;
    }
    function stepEnvironment(){
      for(const entry of cells.values()){
        const env=entry.env;
        if(env.finished)continue;
        try{
          if(env.phase==='plan'){
            const page=env.iterator.next();
            if(page.done){env.objects=page.value.objects;env.phase='objects';env.iterator=null;}
            return;
          }
          if(env.phase==='objects'){
            for(let i=0;i<3&&env.index<env.objects.length;i++)
              factory.queueObject(env.render,env.objects[env.index++]);
            if(env.index===env.objects.length)env.phase='batches';
            return;
          }
          if(env.phase==='batches')env.finished=factory.finalizeStep(env.render,entry.group,2).finished;
        } catch(e) {
          env.finished=true;
          console.warn('Preview environment cell fallback',entry.id,e);
        }
        return;
      }
    }
    function streamNear(point){
      if(!worker)worker=createPatchWorkerClient(previewCourse,{quality:settings.quality});
      const x=Math.floor(point.x/CELL_SIZE),z=Math.floor(point.z/CELL_SIZE),wanted=[];
      for(let dz=-CENTER_RADIUS;dz<=CENTER_RADIUS;dz++)
        for(let dx=-CENTER_RADIUS;dx<=CENTER_RADIUS;dx++)
          wanted.push(cellFor(x+dx,z+dz));
      wanted.sort((a,b)=>distanceSq(a,point)-distanceSq(b,point));
      const keep=new Set(wanted.map(c=>c.id));
      for(const entry of [...cells.values()])if(!keep.has(entry.id))removeOwned(entry);
      for(const cell of wanted){
        if(pending>=MAX_PENDING)break;
        if(cells.has(cell.id)||requested.has(cell.id))continue;
        requested.add(cell.id);pending++;generations++;
        worker.prepare(cell).then(patch=>{
          if(requested.has(cell.id))arrivals.push({cell,patch});
        }).catch(e=>{
          if(requested.has(cell.id)&&mode!=='inactive')console.warn('Preview patch fallback',cell.id,e);
        }).finally(()=>{requested.delete(cell.id);pending=Math.max(0,pending-1);});
      }
      // Never allocate more than one new mesh-cell per frame.
      const ready=arrivals.shift();
      if(ready&&keep.has(ready.cell.id)&&!cells.has(ready.cell.id))onPatch(ready.patch);
      if(cells.size>MAX_CELLS)for(const entry of [...cells.values()].slice(0,cells.size-MAX_CELLS))removeOwned(entry);
      stepEnvironment();
    }
    const previewFocus=()=>{
      const p=endlessHighwayPoint(previewCourse,progress);
      return {x:p.x,y:p.y??terrainHeight(previewCourse,p.x,p.z),z:p.z};
    };
    function update(now){
      const sceneId=currentScene();
      const show=sceneId==='title'||sceneId==='generating';
      const dt=lastFrame===null?0:Math.min(.05,Math.max(0,(now-lastFrame)/1000));
      lastFrame=now;
      if(!show){
        root.visible=false;active=false;mode='inactive';
        if(worker)retireWorld();
        if(sceneId==='driving')document.body.classList.remove('preview-world-visible');
        return;
      }
      active=true;mode=sceneId;root.visible=true;
      // Keep menu artwork and the real progress indicators, but expose the
      // existing WebGL canvas instead of the former static menu/loading paints.
      title.style.background='transparent';
      loading.style.background='rgba(5,12,17,.20)';
      if(loading.firstElementChild){
        loading.firstElementChild.style.background='rgba(8,18,25,.45)';
        loading.firstElementChild.style.backdropFilter='blur(3px)';
        loading.firstElementChild.style.padding='min(4cqh,32px)';
        loading.firstElementChild.style.borderRadius='8px';
      }
      document.body.classList.add('world-visible','preview-world-visible');
      const moving=settings.motion&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if(moving)progress+=dt*SPEED;
      const state=advanceEndlessHighway(previewCourse,progress);
      if(state.changed&&worker){worker.updateCourse(previewCourse);lastRevision=state.revision;}
      const point=previewFocus();
      streamNear(point);
      const look=endlessHighwayPoint(previewCourse,progress+18);
      const dx=look.x-point.x,dz=look.z-point.z,len=Math.hypot(dx,dz)||1;
      const fx=dx/len,fz=dz/len;
      const heading=Math.atan2(dx,dz);
      if(hero){
        hero.root.position.set(point.x,point.y+.38,point.z);
        hero.root.rotation.set(0,heading,0);
        hero.root.visible=true;
        if(moving&&hero.wheels)for(const wheel of hero.wheels)wheel.rotateY(-dt*SPEED/.85);
      }
      camera.position.set(point.x-fx*26+fz*8,point.y+9.2,point.z-fz*26-fx*8);
      camera.lookAt(point.x+fx*25,point.y+3.1,point.z+fz*25);
      atmosphere??=worldRoot.getObjectByName('illustrated-atmosphere');
      if(atmosphere)atmosphere.position.set(point.x,0,point.z);
      // Do not draw the newly preparing gameplay course on top of the preview.
      // The real world becomes visible only when driving takes ownership.
      cellRoot.visible=false;dynamicRoot.visible=false;
      if(typeof horizonRoot!=='undefined')horizonRoot.visible=false;
      if(now-lastTreeRefresh>=250){
        lastTreeRefresh=now;
        const placements=[...cells.values()].flatMap(entry=>entry.patch.vegetation??[]);
        const ready=window.LongHaulPrebuiltTrees?.renderPreview?.(placements,[point.x,point.y,point.z],root);
        for(const entry of cells.values())if(entry.proceduralTree)
          entry.proceduralTree.visible=!ready;
      }
    }
    const oldFrame=arcadeVisualFrame;
    arcadeVisualFrame=function previewPresentationFrame(now){
      // Restore game presentation before the existing hosts update/render.
      if(currentScene()!=='title'&&currentScene()!=='generating'){
        cellRoot.visible=true;dynamicRoot.visible=true;
        if(typeof horizonRoot!=='undefined')horizonRoot.visible=true;
      }
      oldFrame(now);update(now);
    };
    window.LongHaulTitleAttract={
      getState:()=>({active,mode,progress,meshCount:cells.size,roadRebuilds:builds,
        retiredCells:releases,requestedPatches:generations,workerPending:pending,
        canonicalRoads:true,authoredEnvironment:true,previewOnly:true,
        hero:hero?'existing-authored-hero':'unavailable',saveWrites:0,error}),
      getPreviewTreeCandidates:()=>[...cells.values()].flatMap(e=>e.patch.vegetation??[])
    };
  }catch(e){
    console.warn('Canonical title/loading preview unavailable; game controls stay usable',e);
    window.LongHaulTitleAttract={getState:()=>({active:false,status:'fallback',error:String(e),saveWrites:0})};
  }
})();
