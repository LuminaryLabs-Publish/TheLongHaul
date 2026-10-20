    $("#start-btn").addEventListener("click",()=>{audio.ensure();startGeneration(newSeed(),false,"start")});$("#how-btn").addEventListener("click",()=>transition("how"));$("#settings-btn").addEventListener("click",()=>{settingsReturn="title";transition("settings")});$("#how-back-btn").addEventListener("click",()=>transition("back"));$("#settings-back-btn").addEventListener("click",()=>{saveSettings();transition(settingsReturn==="paused"?"pause":"title")});$("#sound-switch").addEventListener("click",()=>{settings.sound=!settings.sound;applySettings();audio.ensure()});$("#quality-switch").addEventListener("click",()=>{settings.quality=!settings.quality;applySettings()});$("#motion-switch").addEventListener("click",()=>{settings.motion=!settings.motion;applySettings()});$("#steer-range").addEventListener("input",event=>{settings.steering=finite(event.target.value,100)});$("#resume-btn").addEventListener("click",resumeGame);$("#pause-settings-btn").addEventListener("click",()=>{settingsReturn="paused";transition("settings")});$("#pause-retry-btn").addEventListener("click",retrySame);$("#pause-title-btn").addEventListener("click",goTitle);$("#result-retry-btn").addEventListener("click",retrySame);$("#result-new-btn").addEventListener("click",newCourse);$("#result-title-btn").addEventListener("click",goTitle);$("#loss-retry-btn").addEventListener("click",retrySame);$("#loss-new-btn").addEventListener("click",newCourse);$("#loss-title-btn").addEventListener("click",goTitle);$("#reload-btn").addEventListener("click",()=>location.reload());
    function showBootError(error){console.error(error);$("#boot-error").textContent=String(error?.message??error);$("#boot-failure").classList.add("show")}
    function resize(){const stage=document.getElementById("game-stage")||document.documentElement;const {width:rawWidth,height:rawHeight}=stage.getBoundingClientRect();const width=Math.max(1,Math.round(rawWidth)),height=Math.max(1,Math.round(rawHeight));const pixelBudget=settings.quality?2304000:1036800;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,settings.quality?1.25:.85,Math.sqrt(pixelBudget/(width*height))));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}addEventListener("resize",resize);resize();applySettings();

    window.render_game_to_text=()=>{const truck=readTruck(),run=readRun();return JSON.stringify({scene:currentScene(),mode:arcadeCampaign()?"campaign":"endless",coordinates:"meters; x east, y up, z south; heading 0 faces +z",player:{position:truck.position,velocity:truck.velocity,heading:truck.heading,speed:truck.speed,normalTopSpeed:readDynamics().maximumForwardSpeed},run:{status:run.status,distance:run.distance},fuel:meters.get("fuel")?.value,boost:{remaining:forwardBoost.remaining,visualStrength:boostVisualStrength,streaks:boostStreaks.visible},loading:generation&&!generation.ready?generation.cursor:null})};
    window.__longHaulBooted=true;window.longHaulBootReady?.();transition("ready");
    const performanceStats=createPerformanceStats();let previous=performance.now(),scheduled=previous,lastHud=-Infinity,lastMap=-Infinity;
    window.LongHaulPerformance={reset:()=>performanceStats.reset(),getState:()=>({...performanceStats.snapshot(),scene:currentScene(),cells:cellHosts.size,horizonCells:horizonHosts.size,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,patches:preparation?.getStats(),worker:patchClient?.getState(),streamingPending:cellRealizeQueue.length+cellDecorationQueue.length})};
    window.addEventListener("blur",()=>{for(const key of Object.keys(keys))keys[key]=false;pressed.clear();forwardBoost.reset()});
    document.addEventListener("visibilitychange",()=>{previous=scheduled=performance.now();if(document.hidden&&currentScene()==="driving")pauseGame()});
    function frame(now){
      requestAnimationFrame(frame);if(document.hidden){previous=scheduled=now;return}
      const beforeScene=currentScene(),target=beforeScene==="driving"||beforeScene==="generating"?1000/60:1000/30;
      if(now<scheduled-1.5)return;const interval=now-previous;previous=now;scheduled+=target;if(scheduled<now-target)scheduled=now+target;performanceStats.begin(beforeScene,interval);
      const dt=clamp(interval/1000,0,1/15);
      try{
        if(beforeScene==="generating")performanceStats.measure("generation",stepGeneration);
        let surface=null;if(beforeScene==="driving")surface=performanceStats.measure("input",()=>preTickDriving(dt));else if(beforeScene==="paused"&&consume("Escape"))resumeGame();
        engine.world.__longHaulScene=beforeScene;
        performanceStats.measure("simulation",()=>engine.tick(beforeScene==="driving"?dt:0));
        const sceneId=updateSceneUi();
        if(sceneId==="title"&&campaignLaunch?.course&&!campaignAutoStarted){campaignAutoStarted=true;startGeneration(campaignLaunch.course.seed,false,"start")}
        if(sceneId==="driving"){
          performanceStats.measure("gameplay",()=>postTickGameplay(surface??surfaceAt(readTruck().position),dt));
          performanceStats.measure("streaming",updateWorldStreaming);performanceStats.measure("horizon",updateHorizonWorld);
          performanceStats.measure("visuals",()=>{updateTruckVisual(dt);updateCloudLayers(readTruck(),now);updateWildlifeVisual();updateBoostVisuals(dt);applyCamera()});
          if(now-lastHud>=66){lastHud=now;performanceStats.measure("hud",()=>updateHud(surface??surfaceAt(readTruck().position)))}
          audio.update(readTruck().speed,engine.n.coreInput.getIntent().throttle,true);
        }else {updateBoostVisuals(dt);audio.update(0,0,false)}
        if(sceneId==="generating")updateLoadingUi();
        if(now-lastMap>=66){lastMap=now;drawMap()}
        arcadeVisualFrame(now);performanceStats.measure("renderCpu",()=>renderer.render(scene,camera));
        performanceStats.end();pressed.clear();
      }catch(error){showBootError(error)}
    }
    requestAnimationFrame(frame);
