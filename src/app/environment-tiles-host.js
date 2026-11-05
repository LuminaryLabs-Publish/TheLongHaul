/* Runtime presentation bridge for 200m Nexus Authoring environment assemblies.
 * Existing 160m World cells, road collisions, route choices and gameplay are
 * untouched. Invoked inside the existing budgeted cell decoration queue. */
(() => {
  'use strict';
  const source=ENVIRONMENT_AUTHORING_SOURCE;
  const initial={source:source.id,status:'unavailable',tileLength:ENV_TILE_METERS,
    templates:ENVIRONMENT_TILE_CATALOG.length,variants:ENV_TILE_VARIANTS.length,
    originalCellSize:CELL_SIZE,activeCells:0,builtCells:0,errors:[]};
  const report=window.LongHaulEnvironmentTiles={getState:()=>({...initial})};
  try{
    if(CELL_SIZE!==160||CELL_SIZE!==ENV_CELL_METERS)throw Error('World cell partition must remain 160m');
    if(ENVIRONMENT_TILE_CATALOG.length!==100||ENV_TILE_VARIANTS.length!==4)throw Error('Missing authored 100x4 environment catalog');
    const factory=createEnvironmentTileRenderer({THREE,materials});
    const failure=(stage,error,id)=>{initial.status='degraded';
      if(initial.errors.length<12)initial.errors.push({stage,id,reason:String(error)});
      console.warn('Environment tile presentation fallback',id,error);};
    function resetEntry(entry){
      const state=entry?.environmentTileState;
      if(!state)return;
      factory.releaseCell(state.render);
      entry.environmentTileState=null;
      initial.activeCells=Math.max(0,initial.activeCells-1);
    }
    const beforeRelease=releaseCell;
    releaseCell=function authoredEnvironmentRelease(id){
      resetEntry(cellHosts.get(id));return beforeRelease(id);
    };
    const distanceToCell=(p,b)=>Math.hypot(Math.max(b.minX-p.x,0,p.x-b.maxX),Math.max(b.minZ-p.z,0,p.z-b.maxZ));
    function startEntry(entry){
      if(!course||course.generatorVersion!==ROAD_GENERATOR_VERSION||!entry.patch?.bounds)return null;
      if(entry.visualOnly){
        const limit=settings.quality?420:300;
        if(distanceToCell(readTruck().position,entry.patch.bounds)>limit){
          entry.environmentTileDeferred=true;return null;
        }
      }
      entry.environmentTileDeferred=false;
      const quality=settings.quality&&!entry.visualOnly;
      const iterator=environmentCellPlanSteps(course.seed,entry.patch.bounds,{
        terrainHeight:(x,z)=>terrainHeight(course,x,z),quality,
        roadSafety:(x,z,margin)=>{const near=nearestRoad(course,{x,z});
          return !near||near.distance>=(Number(near.edge?.width)||28)*.5+margin;} });
      const state={id:entry.patch.cellId,quality,plan:null,iterator,index:0,phase:'planning',
        render:factory.startCell({quality,visualOnly:entry.visualOnly}),applied:false};
      entry.environmentTileState=state;initial.activeCells++;
      return state;
    }
    const beforeDecorate=decorateCell;
    decorateCell=function authoredEnvironmentDecorate(job){
      const result=beforeDecorate(job),entry=cellHosts.get(job?.id);
      if(!entry||entry!==job.entry||entry.decorationStage<2)return result;
      entry.environmentTilePending=false;
      let state=entry.environmentTileState;
      if(!state){try{state=startEntry(entry)}catch(error){
        // A scenery problem must not break streaming or become a physics fault.
        entry.environmentTileState={id:entry.patch?.cellId,failed:true};
        failure('plan',error,entry.patch?.cellId);return result;
      }}
      if(!state||state.failed||state.applied)return result;
      try{
        if(state.phase==='planning'){
          const page=state.iterator.next();
          if(page.done){state.plan=page.value;state.phase='parts';state.iterator=null;}
          else {cellDecorationQueue.push(job);return result;}
        }
        if(state.phase==='parts'){
          const budget=state.quality?ENVIRONMENT_RENDER_LIMITS.highPropsPerStep:ENVIRONMENT_RENDER_LIMITS.lowPropsPerStep;
          for(let n=0;state.index<state.plan.objects.length&&n<budget;n++){
            factory.queueObject(state.render,state.plan.objects[state.index++]);
          }
          if(state.index===state.plan.objects.length)state.phase='batches';
        }
        if(state.phase==='batches'){
          if(factory.finalizeStep(state.render,entry.group).finished){state.applied=true;initial.builtCells++;}
        }
        if(!state.applied)cellDecorationQueue.push(job);
      }catch(error){
        failure('assembly',error,state.id);resetEntry(entry);
        entry.environmentTileState={id:state.id,failed:true};
      }
      return result;
    };
    // Prefetch already-streamed visual cells as they enter the near scenic band.
    // This runs at low frequency and queues at most one existing cell; it does
    // not create cells, alter World membership, or install another scheduler.
    const priorCloud=updateCloudLayers;let lastNearbyScan=-Infinity;
    updateCloudLayers=function environmentTileNearby(state,milliseconds){
      const result=priorCloud(state,milliseconds);
      if(milliseconds-lastNearbyScan<650)return result;lastNearbyScan=milliseconds;
      if(!course||course.generatorVersion!==ROAD_GENERATOR_VERSION)return result;
      for(const entry of cellHosts.values()){
        if(!entry.environmentTileDeferred||entry.environmentTilePending)continue;
        const limit=settings.quality?420:300;
        if(distanceToCell(state.position,entry.patch.bounds)>limit)continue;
        entry.environmentTilePending=true;
        cellDecorationQueue.push({id:entry.patch.cellId,entry});break;
      }
      return result;
    };
    const beforeSettings=applySettings;
    applySettings=function authoredEnvironmentSettings(...args){
      const result=beforeSettings(...args);
      for(const entry of cellHosts.values()){
        const state=entry.environmentTileState;
        if(!state||state.failed||state.quality===(settings.quality&&!entry.visualOnly))continue;
        resetEntry(entry);
        cellDecorationQueue.push({id:entry.patch.cellId,entry});
      }
      return result;
    };
    initial.status='authored';
    report.getState=()=>({...initial,renderer:factory.stats(),
      streamingCells:cellHosts.size,activeTiles:[...cellHosts.values()].flatMap(entry=>entry.environmentTileState?.plan?.tiles??[]).length});
  }catch(error){
    initial.status='fallback';initial.errors.push({stage:'initialization',reason:String(error)});
    console.warn('Environment tile host unavailable; original procedural scenery retained',error);
  }
})();
