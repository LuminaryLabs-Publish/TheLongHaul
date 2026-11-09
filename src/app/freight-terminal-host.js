/* Freight hub overlay. NexusEngine's existing course, World cells, and Truck
 * Kit remain authoritative. The GLB is visual art; the connected Road edge
 * is the only paved driving surface. No duplicate highway/physics meshes. */
(() => {
  const assetUrl=new URL('../../assets/freight-terminal/terminal-yard.glb',document.currentScript.src);
  let art=null,activeCourse=null,obstacles=[],lastError=null,loaded=false;
  const status=window.LongHaulFreightTerminal={ready:false,readyPromise:null,
    getState:()=>({ready:loaded,visible:!!art?.visible,assetUrl:assetUrl.href,
      site:activeCourse?.freightTerminal?.id??null,obstacles:obstacles.length,error:lastError})};
  const priorGenerate=generateEndlessCourse;
  generateEndlessCourse=function(seed){
    const generated=priorGenerate(seed),saved=freightResumeCheckpoint;
    const enable=loaded && generated?.endless && (!saved||saved.freightTerminal===FREIGHT_TERMINAL_VERSION);
    return attachFreightTerminalStart(generated,{enabled:enable});
  };
  // When the Endless window regenerates, retain the terminal's merge edge and
  // footprint only for a journey that began at the terminal. Existing saves
  // lacking the explicit marker keep the historical highway origin.
  const priorAdvance=advanceEndlessHighway;
  advanceEndlessHighway=function(source,positionOrProgress){
    const hadTerminal=!!source?.freightTerminal;
    const outcome=priorAdvance(source,positionOrProgress);
    if(hadTerminal && outcome?.changed)attachFreightTerminalStart(source);
    return outcome;
  };
  const priorProgress=endlessHighwayProgress;
  endlessHighwayProgress=function(source,position){
    if(source?.freightTerminal){
      const nearest=nearestRoad(source,position);
      if(nearest?.edge?.id==='terminal:start-ramp' && nearest.distance<18){
        const a=nearest.edge.samples[nearest.segmentIndex],b=nearest.edge.samples[nearest.segmentIndex+1];
        if(a&&b)return a.progress+(b.progress-a.progress)*nearest.t;
      }
    }
    return priorProgress(source,position);
  };
  function reconcileSite(){
    const isReady=loaded&&course?.freightTerminal;
    if(!isReady){if(art)art.visible=false;activeCourse=null;obstacles=[];return;}
    const site=course.freightTerminal;
    if(activeCourse!==course || art?.userData.site!==site){
      activeCourse=course;
      obstacles=terminalObstacleVolumes(site);
      if(art){art.position.set(site.x,site.y,site.z);art.rotation.y=site.yaw;art.userData.site=site;}
    }
    const p=readTruck().position;
    if(art)art.visible=Math.hypot(p.x-course.origin.x,p.z-course.origin.z)<1100;
  }
  const previousRealize=realizeCell;
  realizeCell=function(patch,options={}){
    previousRealize(patch,options);
    if(options.visualOnly||!course?.freightTerminal||!loaded)return;
    if(activeCourse!==course)reconcileSite();
    const entry=cellHosts.get(patch.cellId);if(!entry)return;
    const minX=patch.bounds.minX,maxX=patch.bounds.maxX,minZ=patch.bounds.minZ,maxZ=patch.bounds.maxZ;
    const colliders=obstacles.filter(v=>v.x>=minX&&v.x<maxX&&v.z>=minZ&&v.z<maxZ);
    if(colliders.length){entry.obstacles.push(...colliders);refreshObstacles();}
  };
  const previousPreTick=preTickDriving;
  preTickDriving=function(dt){reconcileSite();return previousPreTick(dt);};
  const previousIdle=preTickIdle;
  preTickIdle=function(){reconcileSite();return previousIdle();};
  status.readyPromise=(async()=>{
    try{
      const response=await fetch(assetUrl.href,{cache:'force-cache'});
      if(!response.ok)throw Error(`Freight terminal asset HTTP ${response.status}`);
      const parsed=parseFreightTerminalGlb(await response.arrayBuffer());
      art=createFreightTerminalThreeObject(THREE,parsed);
      art.visible=false;art.userData.triangles=parsed.triangles;
      worldRoot.add(art);loaded=true;status.ready=true;
      return true;
    }catch(e){lastError=String(e);console.warn('Freight terminal asset unavailable; legacy road start retained',e);return false;}
  })();
})();
