    // Continuous freight composition. Geographic Campaign keeps its existing
    // route, depot and result lifecycle; Endless runs one ongoing simulation.
    let freightJourney=null,freightState=null,freightResumeCheckpoint=null,freightRevision=0;
    let freightSaveElapsed=0,freightLastPenalty=0,freightLandingSequence=0,freightDamageRevision=0;
    let freightStorageStatus="",freightStorageConflict=false,freightLastSavedSequence=-1;
    let freightNetworkRevision=-1,freightHorizonKey="",freightLastVisualKey="",freightLastStage=-1;
    let freightGateContact=null,freightInitialType="standard";
    const freightStationRoot=new THREE.Group(),freightStationHosts=new Map();
    const freightColors={safe:new THREE.MeshBasicMaterial({color:0x6ee4c2}),risky:new THREE.MeshBasicMaterial({color:0xffc273}),delivery:new THREE.MeshBasicMaterial({color:0x81cfff}),dark:new THREE.MeshLambertMaterial({color:0x213d45})};
    const freightLabelAssets=new Map();
    const isContinuousFreight=()=>Boolean(course?.endless&&freightJourney);
    function freightProtectedProgress(progress){
      if(!course?.endless)return false;
      return isEndlessLoadingZone(progress)||Boolean(freightState?.onboard&&Math.abs(progress-freightState.contract.deliveryProgress)<110);
    }
    $("#fullscreen-btn").addEventListener("click",async()=>{try{const stage=$("#game-stage");if(document.fullscreenElement)await document.exitFullscreen();else if(stage.requestFullscreen)await stage.requestFullscreen();else{toast("Fullscreen is unavailable in this browser","",1800);return}resize()}catch{toast("Fullscreen could not be opened here","",1800)}});
    document.addEventListener("fullscreenchange",()=>{$("#fullscreen-btn").setAttribute("aria-pressed",String(Boolean(document.fullscreenElement)));resize()});

    function readFreightCheckpoint(){
      try{
        if(!arcadeSaveWritable())return null;
        const saved=readCampaignSave(localStorage.getItem("longhaul-campaign-v1")).save,checkpoint=saved?.freightJourney;
        if(!checkpoint||checkpoint.schema!=="long-haul.freight-checkpoint/1"||checkpoint.terminal)return null;
        if(!checkpoint.truck?.position||![checkpoint.truck.position.x,checkpoint.truck.position.y,checkpoint.truck.position.z,checkpoint.truck.heading].every(Number.isFinite))return null;
        if(!checkpoint.meters||![checkpoint.meters.fuel,checkpoint.meters.truck,checkpoint.meters.cargo].every(v=>Number.isFinite(v)&&v>=0&&v<=100)||checkpoint.meters.truck<=0)return null;
        const v3=checkpoint.journey.generatorVersion===ROAD_V3_VERSION;
        const graph=v3?engine.n.longHaulRoadV3.buildPlayable(checkpoint.journey.seed,{progress:checkpoint.journey.progress}):null;
        createFreightJourney({seed:checkpoint.journey.seed,sessionId:checkpoint.journey.sessionId,initialType:checkpoint.initialType,snapshot:checkpoint.journey,
          generatorVersion:checkpoint.journey.generatorVersion,roadGraph:graph});
        if(!prepareFreightSave(saved,checkpoint,{expectedRevision:checkpoint.revision}).ok)return null;
        return checkpoint;
      }catch{return null}
    }
    function generateEndlessCourse(seed){
      const saved=freightResumeCheckpoint,progress=saved?.journey?.progress??0,value=createEndlessHighway(seed,{progress});
      if(saved){value.origin={...value.origin,x:saved.truck.position.x,z:saved.truck.position.z,heading:saved.truck.heading}}
      return value;
    }
    const freightResumeButton=document.createElement("button");freightResumeButton.id="freight-resume-btn";freightResumeButton.className="btn";
    freightResumeButton.textContent="Resume haul";$("#title-screen .menu-actions").append(freightResumeButton);
    function refreshFreightResume(){freightResumeButton.hidden=!readFreightCheckpoint()}
    freightResumeButton.addEventListener("click",()=>{const saved=readFreightCheckpoint();if(!saved){refreshFreightResume();toast("This haul cannot be resumed. Your garage balance is preserved.","",2500);return}freightResumeCheckpoint=saved;audio.ensure();startGeneration(saved.journey.seed,false,"start")});
    refreshFreightResume();

    const freightStartGenerationBase=startGeneration;
    startGeneration=function(seed,reuse=false,exit="start"){
      if(generation&&!generation.ready&&!generation.error)return;
      if(isContinuousFreight())saveFreightCheckpoint();
      // A retry deliberately starts a new contract identity, with fresh roads.
      return freightStartGenerationBase(seed,course?.geography?reuse:false,exit);
    };
    const freightBeginIntroBase=beginLaunchIntro;
    beginLaunchIntro=function(){
      if(course?.endless){
        const saved=freightResumeCheckpoint;
        freightInitialType=saved?.initialType??selectedContract;
        freightJourney=createFreightJourney({seed:course.seed,sessionId:saved?.journey.sessionId??(globalThis.crypto?.randomUUID?.()??`haul-${Date.now()}-${runSerial}`),initialType:freightInitialType,snapshot:saved?.journey??null,generatorVersion:course.generatorVersion,roadGraph:course.generatorVersion===ROAD_V3_VERSION?()=>course:null});
        freightState=freightJourney.getState();freightStorageStatus="";freightStorageConflict=false;freightDamageRevision=0;
        try{freightRevision=JSON.parse(localStorage.getItem("longhaul-campaign-v1")||"null")?.freightJourney?.revision??0}catch{freightRevision=0}
        if(saved){engine.n.longHaulTruck.loadSnapshot(saved.truck);arcadeScore.restoreBanked(saved.bankedPoints??0,saved.bestMultiplier??1)}
        engine.n.longHaulTruck.setCargo(freightState.cargo);arcadeScore.beginLeg(freightState.ordinal);syncArcadeCash();
        freightLastPenalty=saved?.run?.penaltyTotal??0;freightLandingSequence=readTruck().landingSequence??0;
        freightSaveElapsed=0;freightLastStage=-1;freightNetworkRevision=-1;document.body.classList.add("continuous-freight");
      }
      freightBeginIntroBase();if(course?.endless)$("#launch-route").textContent=freightResumeCheckpoint?"YOUR HAUL CONTINUES":"ENDLESS FREIGHT · KEEP ROLLING";
    };
    const freightFinishIntroBase=finishLaunchIntro;
    finishLaunchIntro=function(skipped=false){
      const wasActive=launchIntro.active;freightFinishIntroBase(skipped,Boolean(freightResumeCheckpoint));
      if(!wasActive||!isContinuousFreight())return;
      const saved=freightResumeCheckpoint;
      if(saved){
        engine.n.longHaulTruck.loadSnapshot(saved.truck);
        engine.n.longHaulRun.loadSnapshot({...saved.run,status:"running",lastPosition:{x:saved.truck.position.x,z:saved.truck.position.z}});
        for(const [id,value] of [["fuel",saved.meters.fuel],["truck-condition",saved.meters.truck],["cargo-condition",saved.meters.cargo]])meters.set(id,value,"freight-resume",{allowLockedOverride:true});
        updateCameraTarget(readTruck(),surfaceAt(readTruck().position));
        toast("HAUL RESUMED · KEEP ROLLING","good",2000);
      }else toast("PICK UP AHEAD · WIDE LEFT / EXPRESS RIGHT","",3000);
      engine.n.longHaulTruck.setCargo(freightState.cargo);
      freightJourney.resetPosition?.(readTruck().position);
      meters.setLocked("remaining-time",true,"continuous-contract-clock");
      meters.setRate("remaining-time",0,"continuous-contract-clock");
      freightResumeCheckpoint=null;saveFreightCheckpoint();
    };

    function saveFreightCheckpoint(terminal=false,walletCost=0){
      if(!isContinuousFreight()||launchIntro.active||freightStorageConflict)return false;
      try{
        if(!arcadeSaveWritable())throw Error("invalid-or-unavailable-save");
        const raw=localStorage.getItem("longhaul-campaign-v1"),save=readCampaignSave(raw).save,risk=arcadeScore.snapshot();
        if(!Number.isSafeInteger(walletCost)||walletCost<0||save.cash<walletCost)return false;
        save.cash-=walletCost;
        const checkpoint={schema:"long-haul.freight-checkpoint/1",journey:freightJourney.snapshot(),truck:engine.n.longHaulTruck.snapshot(),run:engine.n.longHaulRun.snapshot(),
          meters:{fuel:meters.get("fuel").value,truck:meters.get("truck-condition").value,cargo:meters.get("cargo-condition").value},bankedPoints:risk.banked,bestMultiplier:risk.bestMultiplier,
          initialType:freightInitialType,freightTerminal:course.freightTerminal?.id??null,terminal:terminal||readRun().status==="failed",skillState:skillCheckpointState()};
        const result=prepareFreightSave(save,checkpoint,{expectedRevision:freightRevision});
        if(!result.ok){if(["save-conflict","stale-contract","stale-checkpoint","inactive-session","closed-session"].includes(result.reason)){freightStorageConflict=true;freightStorageStatus="Another tab changed this haul · save paused"}else freightStorageStatus="Save unavailable · haul kept in this tab";return false}
        localStorage.setItem("longhaul-campaign-v1",JSON.stringify(result.save));
        freightRevision=result.revision;arcadeCachedSave=result.save;freightSaveElapsed=0;freightStorageStatus="";freightLastSavedSequence=freightState.sequence;
        return true;
      }catch{freightStorageStatus="Save unavailable · haul kept in this tab";return false}
    }
    addEventListener("pagehide",()=>saveFreightCheckpoint());
    addEventListener("storage",event=>{if(event.key!=="longhaul-campaign-v1"||!isContinuousFreight())return;try{const value=JSON.parse(event.newValue||"null");if((value?.freightJourney?.revision??0)!==freightRevision){freightStorageConflict=true;freightStorageStatus="Another tab changed this haul · save paused"}arcadeCachedSave=null}catch{freightStorageStatus="Save unavailable · haul kept in this tab"}});
    const freightPauseBase=pauseGame;pauseGame=function(){if(isContinuousFreight())saveFreightCheckpoint();return freightPauseBase()};
    const freightTitleBase=goTitle;goTitle=function(){saveFreightCheckpoint();freightTitleBase();refreshFreightResume()};
    const freightClearBase=clearWorld;
    clearWorld=function(clearCourse=true){
      if(course?.endless){try{engine.n.coreTransactionLedger.clear(`long-haul:${runKey}`)}catch{}}
      freightClearBase(clearCourse);freightJourney=null;freightState=null;freightNetworkRevision=-1;freightHorizonKey="";freightLastVisualKey="";freightGateContact=null;
      freightStationHosts.clear();freightStationRoot.clear();freightCargoRoot=null;document.body.classList.remove("continuous-freight");freightHud.hidden=true;
    };

    const freightCargoDamageBase=spendCargoDamage;
    spendCargoDamage=function(amount,reason){if(!isContinuousFreight())return freightCargoDamageBase(amount,reason);if(!freightJourney.cargoOnboard())return 0;const damage=Math.max(0,finite(amount))*cargoDamageMultiplier(freightState.cargo,reason);meters.spend("cargo-condition",damage,reason);return damage};
    const freightTruckDamageBase=spendTruckDamage;
    spendTruckDamage=function(amount,reason){if(isContinuousFreight()&&amount>0)freightDamageRevision++;return freightTruckDamageBase(amount,reason)};
    const freightAwardBase=awardArcadeEvent;
    awardArcadeEvent=function(event){
      if(isContinuousFreight()){
        const p=-readTruck().position.z;if(p<freightState.highWaterProgress-8||readTruck().speed<=0)return{accepted:false,reason:"retired-road"};
      }
      return freightAwardBase(event);
    };

    function updateFreightJourney(dt){
      if(!isContinuousFreight()||readRun().status!=="running")return;
      const truck=readTruck(),run=readRun(),before=freightState;
      const landed=truck.landingSequence!==freightLandingSequence;freightLandingSequence=truck.landingSequence;
      if(freightJourney.cargoOnboard()){
        if(landed){const impact=truck.lastLanding?.impactSpeed??0;if(impact>8)spendCargoDamage(Math.min(18,(impact-8)*.7),"bad-landing")}
        if(truck.loadStress>.55)spendCargoDamage((truck.loadStress-.55)*dt*3.5,"cargo-shift");
      }
      const events=freightJourney.tick({dt,progress:endlessHighwayProgress(course,truck.position),position:truck.position,speed:truck.speed,heading:truck.heading,grounded:truck.grounded,
        cargoCondition:meters.get("cargo-condition").value,truckCondition:meters.get("truck-condition").value,collisionCount:run.collisions+freightDamageRevision,
        penaltySeconds:Math.max(0,run.penaltyTotal-freightLastPenalty),active:true});
      freightLastPenalty=run.penaltyTotal;freightState=freightJourney.getState();
      for(const event of events){
        arcadeRecord(event.type,event);
        if(event.type==="contract-assigned"){
          arcadeScore.beginLeg(freightState.ordinal);engine.n.longHaulTruck.setCargo(null);
          toast(`${getCargoProfile(event.profileId).label.toUpperCase()} · PICKUP AHEAD`,"",2300);
        }else if(event.type==="cargo-picked-up"){
          meters.set("cargo-condition",100,"cargo-loaded");engine.n.longHaulTruck.setCargo({profileId:event.profileId,massKg:event.massKg});
          arcadeFlashBonus(`${(event.massKg/1000).toFixed(1)} t LOADED · KEEP ROLLING`);audio.good();freightLastVisualKey="";
        }else if(event.type==="cargo-delivered"){
          bankArcadeScore("DELIVERY");engine.n.longHaulTruck.setCargo(null);meters.restore("fuel",22,"delivery-service");meters.restore("truck-condition",8,"delivery-service");
          arcadeFlashBonus(`DELIVERED +$${event.cash} · NEXT LOAD AHEAD`);audio.good();saveFreightCheckpoint();freightLastVisualKey="";
        }else if(event.type==="cargo-lost"){
          engine.n.longHaulTruck.setCargo(null);resetArcadeCombo("CARGO LOST");
          const hazard=getCargoProfile(event.profileId)?.hazardousFailureDamage??0;if(hazard&&event.reason==="cargo-destroyed")spendTruckDamage(hazard,"hazardous-spill");
          arcadeFlashBonus(event.reason==="deadline-expired"?"CONTRACT EXPIRED · KEEP DRIVING":"CARGO LOST · NEXT LOAD AHEAD");audio.wrong();saveFreightCheckpoint();freightLastVisualKey="";
        }else if(event.type==="pickup-missed"){
          const rescue=event.offerRecovery&&arcadeScore.offerRecovery(event.contractId);
          toast(rescue?"MISSED LOAD · CLEAN EXPRESS PICKUP SAVES MULTIPLIER":"MISSED LOAD · ANOTHER PICKUP AHEAD","",2600);
        }else if(event.type==="loading-route-complete"){
          awardArcadeEvent({id:event.id,kind:"loading-route",route:"risky",speed:event.speed,distance:event.distance,clean:event.clean,forward:true,recovery:event.recovery,contractId:event.contractId});
        }else if(event.type==="receiver-missed")toast("MISSED RECEIVER · FOLLOW THE NEXT BLUE GATE","",2400);
      }
      if(freightState.difficulty.level!==freightLastStage){freightLastStage=freightState.difficulty.level;freightNetworkRevision=-1;if(freightLastStage>0)toast(`HIGHWAY LEVEL ${freightLastStage+1} · READ THE ROAD`,"",1800)}
      freightSaveElapsed+=dt;if(freightSaveElapsed>=5)saveFreightCheckpoint();
      if((meters.get("truck-condition")?.value??0)<=0||((meters.get("fuel")?.value??0)<=0&&run.recoveryUsed)){
        const reason=meters.get("truck-condition").value<=0?"The truck could not continue. Your completed freight is saved.":"The tank is empty after roadside recovery. Completed freight is saved.";
        bankArcadeScore("JOURNEY ENDED");saveFreightCheckpoint(true);engine.n.longHaulRun.fail(reason);
      }
      if(before?.onboard!==freightState.onboard)freightLastVisualKey="";
    }
    const freightPostTickBase=postTickGameplay;
    postTickGameplay=function(surface,dt){
      freightPostTickBase(surface,dt);if(!isContinuousFreight())return;
      updateFreightJourney(dt);
      if(readRun().status==="failed"&&!lossTransitioned){lossTransitioned=true;saveFreightCheckpoint(true);releaseDrivingInput();mapOpen=false;updateMapPanel();transition("fail");$("#loss-reason").textContent=readRun().failureReason;audio.wrong()}
    };

    function planFreightEncounters(){
      const events=[];const first=Math.max(0,Math.floor((course.endless.windowStart-820)/960)),last=Math.ceil((course.endless.windowEnd-820)/960),kinds=["ramp","breakables","roadblock","weave"];
      for(let index=first;index<=last;index++){
        if(index%5===3)continue;const p=820+index*960;if(p<course.endless.windowStart+60||p>course.endless.windowEnd-100)continue;
        const point=endlessHighwayPoint(course,p),road=nearestRoad(course,point),pathProgress=arcadeRoadProgress(road,arcadeNetwork);if(!pathProgress)continue;
        const difficulty=freightState?.difficulty??freightDifficulty(p),kind=kinds[index%4],side=hashText(`${course.seed}:freight-event:${index}`)%2?1:-1;
        events.push({id:`endless-encounter:${index}`,kind,path:pathProgress.path,distance:pathProgress.distance,absoluteProgress:p,lane:side*3.5,safeLane:side*6.2,warningLead:difficulty.warningLead,clearWidth:difficulty.minimumClearWidth,point:{...point,edge:road.edge}});
      }
      return events;
    }
    const freightNetworkBase=ensureArcadeNetwork;
    ensureArcadeNetwork=function(){
      if(!course?.endless)return freightNetworkBase();
      if(freightNetworkRevision===course.endless.revision&&arcadeNetwork)return;
      const oldVehicles=arcadeVehicles.filter(v=>v.active).map(v=>({v,point:arcadePathPoint(v.path,v.progress,v.lane)}));
      arcadeNetwork=buildArcadeRoutes(course);arcadeNetworkCourse=course;freightNetworkRevision=course.endless.revision;
      arcadeEncounters=planFreightEncounters();if(encounterRoot.parent!==dynamicRoot)dynamicRoot.add(encounterRoot);
      const ids=new Set(arcadeEncounters.map(e=>e.id));
      for(const [id,host] of arcadeEncounterHosts){const fresh=arcadeEncounters.find(e=>e.id===id);if(!fresh){host.group.removeFromParent();arcadeEncounterHosts.delete(id)}else host.event=fresh}
      for(const set of [arcadeUsedRamps,arcadeWarned])for(const id of set)if(!ids.has(id))set.delete(id);
      for(const id of arcadeBrokenProps)if(!arcadeEncounters.some(e=>id.startsWith(e.id+":")))arcadeBrokenProps.delete(id);
      for(const {v,point} of oldVehicles){const next=point&&arcadeRoadProgress(nearestRoad(course,point),arcadeNetwork);if(next){v.path=next.path;v.progress=next.distance}else{v.active=false;v.group.visible=false}}
    };
    const freightStreamingBase=updateWorldStreaming;
    updateWorldStreaming=function(){
      if(course?.endless){
        const change=advanceEndlessHighway(course,readTruck().position);
        if(change.changed){
          patchClient?.updateCourse(course);engine.n.longHaulCourse.refreshWindow(course);ensureArcadeNetwork();arcadeEdgeCache=null;arcadeGarageCourse=null;mapLayerCourse=null;
          courseEnvelope=createLongHaulCourseEnvelope(engine,packagePayload(course),{game:"The Long Haul",continuous:true,revision:change.revision});
          pruneLongHaulContactLedger(engine,runKey,{limit:256,activeContacts:[...activeContacts]});
          arcadeRecord("highway-extended",{revision:change.revision,edges:change.edgeCount,windowEnd:course.endless.windowEnd});
        }
      }
      freightStreamingBase();if(isContinuousFreight())updateFreightStations();
    };

    const freightRegisterHorizonBase=registerHorizonWorld;
    registerHorizonWorld=function(){
      if(!course?.endless){freightHorizonKey="";return freightRegisterHorizonBase()}
      clearHorizonWorld();const profile=engine.n.longHaulWorldProfile.getState(),rootBounds=endlessHorizonBounds(readTruck().position);freightHorizonKey=JSON.stringify(rootBounds);
      engine.n.coreWorld.registerWorld({id:HORIZON_WORLD_ID,seed:course.seed,partition:N.createQuadtreePartition({id:"long-haul-horizon-tree",rootBounds,maxDepth:profile.horizon.maxDepth,minCellSize:profile.horizon.minCellSize,refineRadius:profile.horizon.refineRadius}),surface:N.createCurvedHorizonSurface({id:"long-haul-curved-horizon",curveStart:profile.horizon.curveStart,curveEnd:profile.horizon.curveEnd,visualRadius:profile.horizon.visualRadius}),providers:[createHorizonProvider()]});
      engine.n.coreWorld.setFocus(HORIZON_WORLD_ID,{position:readTruck().position});engine.n.coreWorld.updateWorld(HORIZON_WORLD_ID);
    };
    const freightHorizonBase=updateHorizonWorld;
    updateHorizonWorld=function(){if(course?.endless&&JSON.stringify(endlessHorizonBounds(readTruck().position))!==freightHorizonKey)registerHorizonWorld();freightHorizonBase()};

    function freightLabel(text,color){
      const key=`${text}:${color}`;if(freightLabelAssets.has(key))return freightLabelAssets.get(key);
      const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;const ctx=canvas.getContext("2d");
      ctx.fillStyle="#102d35";ctx.fillRect(0,0,512,128);ctx.strokeStyle=color;ctx.lineWidth=7;ctx.strokeRect(6,6,500,116);ctx.fillStyle="#f4fbf4";ctx.font="900 43px system-ui";ctx.textAlign="center";ctx.fillText(text,256,79);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});freightLabelAssets.set(key,material);return material;
    }
    const freightGateHeight=point=>course?.generatorVersion===ROAD_V3_VERSION&&Number.isFinite(point.y)
      ?point.y:terrainHeight(course,point.x,point.z);
    function makeFreightGate(gate,kind){
      const group=new THREE.Group(),point=gate.point,width=kind==="risky"?6.4:24,color=freightColors[kind],title=kind==="delivery"?"DELIVER → KEEP GOING":kind==="risky"?"EXPRESS · +COMBO":"WIDE · PICK UP";
      group.position.set(point.x,freightGateHeight(point)+.15,point.z);group.rotation.y=point.heading;
      for(const side of [-1,1]){addEncounterBox(group,color,side*(width/2+1),3.3,0,.45,6.6,.45);for(let z=-24;z<=12;z+=6)addEncounterBox(group,color,side*(width/2+.4),.16,z,.2,.22,3.5)}
      addEncounterBox(group,color,0,6.6,0,width+2.5,.35,.45);
      const label=new THREE.Mesh(geometries.plane,freightLabel(title,kind==="risky"?"#ffc273":kind==="delivery"?"#81cfff":"#6ee4c2"));label.position.set(0,7.8,0);label.rotation.y=Math.PI;label.scale.set(kind==="risky"?10:16,3.2,1);group.add(label);
      for(let z=-10;z<=10;z+=5)addEncounterBox(group,color,0,.04,z,Math.min(width,12),.035,.7);
      return group;
    }
    function updateFreightStations(){
      if(freightStationRoot.parent!==dynamicRoot)dynamicRoot.add(freightStationRoot);
      const state=freightState,truck=readTruck(),wanted=new Map(),roadProgress=endlessHighwayProgress(course,truck.position);
      for(const station of course.loadingStations??[]){
        if(Math.abs(station.progress-roadProgress)>750)continue;
        for(const route of ["safe","risky"]){const id=`${station.id}:${route}`;wanted.set(id,{gate:station[route],kind:route,active:state.contract?.stationIndex===station.index&&endlessHighwayProgress(course,truck.position)<station.progress+60,station})}
      }
      if(state.onboard&&Math.abs(state.contract.deliveryProgress-roadProgress)<850)wanted.set(state.deliveryGate.id,{gate:state.deliveryGate,kind:"delivery",active:true});
      for(const [id,group] of freightStationHosts)if(!wanted.has(id)){group.removeFromParent();freightStationHosts.delete(id)}
      for(const [id,entry] of wanted){let group=freightStationHosts.get(id);if(!group){group=makeFreightGate(entry.gate,entry.kind);freightStationHosts.set(id,group);freightStationRoot.add(group)}const point=entry.gate.point;group.position.set(point.x,freightGateHeight(point)+.15,point.z);group.rotation.y=point.heading;group.visible=entry.active;}
      // Only the active express route has solid side barriers. The centre opening
      // is wider than the truck, while the wide route never has these obstacles.
      {const station=state.pickupStation;if(station&&Math.abs(station.progress-endlessHighwayProgress(course,truck.position))<48){const p=station.risky.point,dx=truck.position.x-p.x,dz=truck.position.z-p.z,along=dx*Math.sin(p.heading)+dz*Math.cos(p.heading),side=dx*Math.cos(p.heading)-dz*Math.sin(p.heading);
        const contact=truck.grounded&&Math.abs(along)<4.4&&Math.abs(side)>2.4&&Math.abs(side)<6.1;
        if(!simulationFrozen()&&contact&&truck.speed>3&&freightGateContact!==station.id){freightGateContact=station.id;spendTruckDamage(5,"loading-gate");engine.n.longHaulTruck.impulse({speedDelta:-truck.speed*.16,kind:"prop",allowTip:false});audio.hit()}
        if(!simulationFrozen()&&!contact&&freightGateContact===station.id)freightGateContact=null;
      }else if(!simulationFrozen())freightGateContact=null}
    }

    let freightCargoRoot=null;
    function updateFreightCargoVisual(){
      if(!truckRig||!isContinuousFreight())return;
      const key=`${runKey}:${freightState.cargo?.id??"empty"}`;
      if(key!==freightLastVisualKey){
        freightLastVisualKey=key;freightCargoRoot?.removeFromParent();freightCargoRoot=new THREE.Group();truckRig.body.add(freightCargoRoot);
        const cargo=freightState.cargo;for(const crate of truckRig.crates)crate.visible=false;
        if(cargo){for(let i=0;i<4;i++){const part=new THREE.Mesh(arcadeTrafficGeometry,freightColors.dark);part.position.set(i%2?1:-1,3.1,-1.7-Math.floor(i/2)*1.9);part.scale.set(1.65,cargo.id==="heavy"?1:1.6,1.5);freightCargoRoot.add(part);const marker=new THREE.Mesh(arcadeTrafficGeometry,freightColors[cargo.id==="hazardous"?"risky":"safe"]);marker.position.set(0,.54,.51);marker.scale.set(.8,.16,.06);part.add(marker)}
          freightCargoRoot.userData.profileId=cargo.id;
        }
      }
      if(freightCargoRoot){freightCargoRoot.position.x=settings.motion?(readTruck().loadShift?.x??0)*.45:0;freightCargoRoot.rotation.z=settings.motion?(readTruck().loadShift?.x??0)*.08:0}
    }
    const freightTruckVisualBase=updateTruckVisual;updateTruckVisual=function(dt){freightTruckVisualBase(dt);updateFreightCargoVisual()};

    const freightHud=document.createElement("section");freightHud.id="freight-hud";freightHud.hidden=true;freightHud.setAttribute("aria-label","Continuous freight");
    freightHud.innerHTML='<div class="freight-top"><span id="freight-state">PICKUP AHEAD</span><b id="freight-leg">01</b></div><strong id="freight-cargo">General freight</strong><div id="freight-next">Drive through the marked gate</div><div class="freight-meta"><span id="freight-mass">EMPTY</span><span id="freight-pay">$0 DELIVERED</span></div><small id="freight-advice">WIDE LEFT / EXPRESS RIGHT</small><small id="freight-save" role="status"></small>';
    $("#game-stage").append(freightHud);
    const freightHudBase=updateHud;
    const freightVisualFrameBase=arcadeVisualFrame;
    arcadeVisualFrame=function(now){freightVisualFrameBase(now);if(currentScene()!=="driving"||launchIntro.active)freightHud.hidden=true};
    updateHud=function(surface){
      freightHudBase(surface);freightHud.hidden=!isContinuousFreight()||currentScene()!=="driving"||launchIntro.active;
      if(!isContinuousFreight())return;
      const f=freightState,c=f.contract,p=-readTruck().position.z,target=f.onboard?c.deliveryProgress:c.pickupProgress,remaining=Math.max(0,target-p),profile=getCargoProfile(c.profileId);
      const labels={"awaiting-pickup":"PICKUP AHEAD","awaiting-replacement":"REPLACEMENT AHEAD","cargo-onboard":"FREIGHT LOADED","in-transit":"DELIVER WHILE DRIVING",delivered:"DELIVERED · KEEP ROLLING","cargo-lost":"LOAD LOST · KEEP ROLLING"};
      $("#freight-state").textContent=labels[f.status]??"KEEP ROLLING";$("#freight-leg").textContent=String(c.ordinal).padStart(2,"0");$("#freight-cargo").textContent=profile.label;
      $("#freight-next").textContent=f.status==="delivered"?`+$${f.lastOutcome.cash} · next contract incoming`:f.status==="cargo-lost"?"No delivery pay · replacement incoming":`${f.onboard?"BLUE RECEIVER":"LOADING FORK"} · ${Math.round(remaining)} m`;
      $("#freight-mass").textContent=f.onboard?`${(c.massKg/1000).toFixed(1)} t · ${Math.round(meters.get("cargo-condition").value)}%`:`EMPTY · ${(c.massKg/1000).toFixed(1)} t NEXT`;
      $("#freight-pay").textContent=`$${f.earnedCash.toLocaleString()} · ${f.completed} DELIVERED`;
      $("#freight-advice").textContent=arcadeScore.snapshot().recovery?"CLEAN EXPRESS ROUTE RESCUES MULTIPLIER":f.onboard?profile.handlingHint:"WIDE LEFT / EXPRESS RIGHT +COMBO";
      $("#freight-save").textContent=freightStorageStatus;
      $("#timer-label").textContent=f.onboard?"Cargo deadline":"Journey time";$("#timer").textContent=formatTime(f.onboard?c.remaining:readRun().rawTime);$("#map-time").textContent=f.onboard?`LOAD ${formatTime(c.remaining)}`:"KEEP ROLLING";
      $("#cargo-num").textContent=f.onboard?`${Math.round(meters.get("cargo-condition").value)}%`:"EMPTY";$("#cargo-meter").style.width=f.onboard?`${meters.get("cargo-condition").value}%`:"0%";
      $("#destination-name").textContent=`${f.onboard?"Receiver":"Freight relay"} · ${Math.round(remaining)} m`;
      document.body.classList.toggle("final-minute",f.onboard&&c.remaining<20);
    };

    const freightMapBase=drawMap;
    drawMap=function(){
      if(!isContinuousFreight())return freightMapBase();if(!mapOpen)return;
      const canvas=$("#map-canvas"),rect=canvas.getBoundingClientRect();if(rect.width<2||rect.height<2)return;const ratio=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
      const ctx=canvas.getContext("2d");ctx.setTransform(ratio,0,0,ratio,0,0);const w=rect.width,h=rect.height,p=endlessHighwayProgress(course,readTruck().position),start=Math.max(-160,p-250),end=p+1350,center=endlessHighwayPoint(course,p).x,scale=Math.min((w-40)/210,(h-40)/(end-start)),project=(x,z)=>({x:w/2+(x-center)*scale,y:h-20-(-z-start)*scale});
      ctx.clearRect(0,0,w,h);for(const route of ["safe","risky"]){ctx.beginPath();for(let q=start;q<=end;q+=8){const v=endlessHighwayPoint(course,q,0,route),s=project(v.x,v.z);q===start?ctx.moveTo(s.x,s.y):ctx.lineTo(s.x,s.y)}ctx.strokeStyle=route==="safe"?"#287d72":"#cb822e";ctx.lineWidth=route==="safe"?6:2;ctx.stroke()}
      const target=freightState.onboard?freightState.deliveryGate.point:freightState.pickupStation.safe.point,at=project(target.x,target.z);ctx.fillStyle=freightState.onboard?"#3387ba":"#21866c";ctx.beginPath();ctx.arc(at.x,at.y,7,0,Math.PI*2);ctx.fill();ctx.font="bold 10px system-ui";ctx.textAlign="center";ctx.fillText(freightState.onboard?"DELIVER":"PICK UP",at.x,at.y-12);
      for(const garage of arcadeGarageStops){const pt=project(garage.x,garage.z);ctx.fillStyle="#315d79";ctx.fillRect(pt.x-4,pt.y-4,8,8)}drawMapTruck(ctx,project);
    };
    const freightPromptBase=interactionPrompt;
    interactionPrompt=function(){const prompt=freightPromptBase();if(!isContinuousFreight())return prompt;return /Deliver to|full stop/.test(prompt)&&!arcadeNearestGarage(readTruck().position)?"Drive through marked freight gates":prompt};
    const freightInteractionBase=handleInteraction;
    handleInteraction=function(state,run,condition,surface){
      const recovery=state.tipped||run.stuckSeconds>2.8||condition.fuel<=.01||(surface.surface==="off-road"&&Math.abs(state.speed)<.8);
      if(isContinuousFreight()&&!recovery&&!arcadeNearestGarage(state.position)){toast("Keep rolling through the marked freight gates","",1400);return}
      freightInteractionBase(state,run,condition,surface);if(isContinuousFreight()&&recovery)freightJourney.resetPosition?.(readTruck().position);
    };

    const freightGarageSiteBase=arcadeGarageSite;
    arcadeGarageSite=function(edge,fraction,side){const site=freightGarageSiteBase(edge,fraction,side);if(!site||!course?.endless)return site;const p=-site.pos.z;return isEndlessLoadingZone(p)||Math.abs(p-(freightState?.contract?.deliveryProgress??-1000))<90?null:site};
    const freightGarageShowBase=arcadeShowGarage;
    arcadeShowGarage=function(focusItem){
      freightGarageShowBase(focusItem);if(!isContinuousFreight())return;
      const saved=arcadeUpgradeState();const summary=arcadeGaragePanel.querySelector("p");summary.textContent=`$${saved.cash.toLocaleString()} · Driving and cargo deadline are paused.`;
      for(const [id,label,meter,cost] of [["service-fuel","REFUEL +45%","fuel",90],["service-repair","REPAIR +35%","truck-condition",120]]){
        const button=document.createElement("button");button.dataset.service=id;button.textContent=`${label} · $${cost}`;button.disabled=freightStorageConflict||!arcadeSaveWritable()||saved.cash<cost||meters.get(meter).value>=99;
        button.addEventListener("click",()=>{if(freightStorageConflict||!arcadeSaveWritable())return;const prior=meters.get(meter).value;meters.restore(meter,meter==="fuel"?45:35,"paid-garage-service");if(!saveFreightCheckpoint(false,cost)){meters.set(meter,prior,"service-rollback",{allowLockedOverride:true});toast("Service could not be saved","bad",1600)}arcadeShowGarage()});
        arcadeGaragePanel.insertBefore(button,arcadeGaragePanel.lastElementChild);
      }
    };
    window.LongHaulFreight={getState:()=>freightState?{...clone(freightState),storage:freightStorageStatus,revision:freightRevision,road:clone(course.endless),stationHosts:freightStationHosts.size,contactLedger:engine.n.coreTransactionLedger.list(`long-haul:${runKey}`).length}:null};
