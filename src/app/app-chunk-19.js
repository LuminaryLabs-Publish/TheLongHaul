    // Gameplay orchestration stays in The Long Haul. Core continues owning time,
    // resources, scenes, camera smoothing, world streaming and ledger receipts.
    const arcadeScore=createArcadeScore();
    const launchIntro={active:false,elapsed:0,duration:2.4,seen:false};
    let arcadeNetwork=null,arcadeNetworkCourse=null,arcadeEncounters=[],arcadeRecoveryGrace=0;
    let arcadeImpactStrength=0,arcadeLastCollisionCount=0,arcadeLastLanding=0,arcadeActiveStunt=null;
    let arcadeWeatherTime=0,arcadeWeatherAmount=0,arcadeTrafficSerial=0,arcadeEventLabel="OPEN ROAD";
    const arcadeEncounterHosts=new Map(),arcadeBrokenProps=new Set(),arcadeUsedRamps=new Set(),arcadeWarned=new Set(),arcadeEventHistory=[];
    function arcadeRecord(type,detail={}){arcadeEventHistory.push({type,time:Number(readRun().rawTime.toFixed(3)),...detail});if(arcadeEventHistory.length>128)arcadeEventHistory.shift()}
    function releaseDrivingInput(){for(const key of Object.keys(keys))keys[key]=false;pressed.clear();forwardBoost.clearTaps();engine.n.coreInput.setIntent({throttle:0,brake:0,steer:0,boost:false,handbrake:false})}
    function holdDrivingForPanel(){const state=readTruck(),ground=groundSample(state.position),surface=surfaceAt(state.position);engine.n.longHaulTruck.input({throttle:0,brake:0,steer:0,boost:false,handbrake:true,surface:surface.surface,surfaceGrip:surface.grip,groundHeight:ground.height,groundNormal:ground.normal});engine.n.longHaulRun.sample({position:state.position,speed:state.speed,surface:surface.surface,trying:false})}
    function closeArcadeGarage(){arcadeGaragePanel.hidden=true;releaseDrivingInput();$("#game-canvas").focus({preventScroll:true});audio.click()}

    const cinematic=document.createElement("section");cinematic.id="launch-cinematic";cinematic.hidden=true;
    cinematic.innerHTML='<div class="cinematic-top"><span>THE LONG HAUL</span><small>Nexus Engine · Luminary Labs</small></div><div class="cinematic-bottom"><div><small id="launch-route">FREIGHT RUN</small><strong>HAUL OUT.</strong><span>Drive hard. Bring it home.</span></div><button id="launch-skip" class="btn">DRIVE NOW ↗</button></div>';
    $("#game-stage").append(cinematic);$("#launch-skip").addEventListener("click",()=>finishLaunchIntro(true));
    function beginLaunchIntro(){
      releaseDrivingInput();try{launchIntro.seen=localStorage.getItem("longhaul-launch-seen-v1")==="1"}catch{}
      launchIntro.active=true;launchIntro.elapsed=0;launchIntro.duration=settings.motion?(launchIntro.seen?.7:2.4):.12;
      cinematic.hidden=!settings.motion;document.body.classList.add("cinematic");
      $("#launch-route").textContent=arcadeCampaign()?`${campaignLaunch.route.from.code} → ${campaignLaunch.route.to.code}`:`${course.contractId??"standard"} freight`;
      ensureArcadeNetwork();updateLaunchIntro(0);arcadeRecord("cinematic-start",{duration:launchIntro.duration});
    }
    function finishLaunchIntro(skipped=false,preserveRun=false){
      if(!launchIntro.active)return;launchIntro.active=false;cinematic.hidden=true;document.body.classList.remove("cinematic");
      try{localStorage.setItem("longhaul-launch-seen-v1","1")}catch{}
      const state=readTruck(),launchSpeed=course?.freightTerminal?0:readDynamics().maximumForwardSpeed*.5,ground=groundSample(state.position);
      if(!preserveRun){engine.n.longHaulTruck.teleport({x:state.position.x,y:ground.height+readDynamics().suspension.travel,z:state.position.z,heading:state.heading,speed:launchSpeed,groundHeight:ground.height,groundNormal:ground.normal});engine.n.longHaulRun.start(state.position)}
      meters.setLocked("remaining-time",false,"run-start");
      updateCameraTarget(state,surfaceAt(state.position));arcadeScore.tick(0,{active:true});
      audio.tone(130,.18,"sawtooth",.045);audio.tone(260,.15,"triangle",.04,.09);
      arcadeRecord("cinematic-finish",{skipped});$("#game-canvas").focus({preventScroll:true});
    }
    function updateLaunchIntro(dt){
      if(!launchIntro.active)return;
      if(keys.KeyW||keys.ArrowUp||keys.KeyS||keys.ArrowDown||pressed.has("Space")||pressed.has("Enter")||pressed.has("Escape")){finishLaunchIntro(true);return}
      launchIntro.elapsed+=dt;const t=clamp(launchIntro.elapsed/launchIntro.duration,0,1),smooth=t*t*(3-2*t),state=readTruck(),f={x:Math.sin(state.heading),z:Math.cos(state.heading)},r={x:f.z,z:-f.x};
      const side=lerp(12,1.8,smooth),back=lerp(-8,25,smooth),height=lerp(3.8,10.2,smooth),px=state.position.x-f.x*back+r.x*side,pz=state.position.z-f.z*back+r.z*side;
      const position=[px,Math.max(state.position.y+height,terrainHeight(course,px,pz)+3),pz],lookPoint=[state.position.x+f.x*lerp(0,20,smooth),state.position.y+2.3,state.position.z+f.z*lerp(0,20,smooth)];
      smoothing.snap("player-camera",{position,lookPoint,fov:lerp(51,64,smooth),mode:"chase"});
      if(t>=1)finishLaunchIntro(false);
    }

    let selectedContract="standard";
    for(const card of $$(".contract-card"))card.addEventListener("click",()=>{selectedContract=card.dataset.contract;for(const other of $$(".contract-card")){other.classList.toggle("selected",other===card);other.setAttribute("aria-pressed",String(other===card))}$("#contract-note").textContent=getCargoProfile(selectedContract)?.handlingHint??"A balanced first load.";audio.click()});
    $("#dispatch-back-btn").addEventListener("click",()=>transition("back"));
    $("#dispatch-go-btn").addEventListener("click",()=>{if(currentScene()!=="dispatch"||pendingSceneTransition)return;window.longHaulContract=selectedContract;audio.ensure();startGeneration(newSeed(),false,"start")});

    const touchControls=document.createElement("nav");touchControls.id="touch-controls";touchControls.setAttribute("aria-label","Driving controls");
    for(const action of LONG_HAUL_TOUCH_ACTIONS){
      const control=LONG_HAUL_CONTROLS[action],code=control.keys[0],button=document.createElement("button");
      button.type="button";button.textContent=control.short;button.dataset.action=action;button.setAttribute("aria-label",control.label);
      button.addEventListener("pointerdown",event=>{event.preventDefault();if(!touchDrivingAllowed(code))return;button.setPointerCapture(event.pointerId);setDrivingControl(code,true)});
      for(const name of ["pointerup","pointercancel","lostpointercapture"])button.addEventListener(name,()=>setDrivingControl(code,false));
      touchControls.append(button);
    }
    $("#game-stage").append(touchControls);

    const riskHud=document.createElement("div");riskHud.id="risk-hud";riskHud.setAttribute("aria-label","Driving combo");
    riskHud.innerHTML='<div class="risk-heading"><b id="risk-multiplier">×1</b><span id="risk-label">BUILD A COMBO</span></div><strong id="risk-pending">0</strong><span id="risk-bank">0 BANKED · $0</span><div class="risk-meter"><i id="risk-meter-fill"></i></div><small id="risk-hint">Close passes · Clean landings</small>';
    const encounterHud=document.createElement("div");encounterHud.id="encounter-hud";encounterHud.setAttribute("role","status");
    const impactVeil=document.createElement("div");impactVeil.id="impact-feedback";impactVeil.setAttribute("aria-hidden","true");
    $("#game-stage").append(riskHud,encounterHud,impactVeil);
    function syncArcadeCash(){arcadeBonuses=Math.floor(arcadeScore.snapshot().banked/20)}
    function bankArcadeScore(reason="SAFE DRIVING"){
      const receipt=arcadeScore.bank(reason);if(receipt){syncArcadeCash();arcadeFlashBonus(`+${receipt.points} BANKED`);arcadeRecord("combo-banked",receipt)}return receipt;
    }
    function resetArcadeCombo(reason="CRASH · COMBO LOST"){
      const receipt=arcadeScore.crash(reason);arcadeActiveStunt=null;
      if(receipt.lost){arcadeFlashBonus(`${receipt.lost} LOST · BUILD AGAIN`);arcadeRecord("combo-lost",receipt)}
      return receipt;
    }
    function awardArcadeEvent(event){
      const receipt=arcadeScore.event({...event,active:readRun().status==="running"&&!mapOpen&&arcadeGaragePanel.hidden&&!launchIntro.active});
      if(receipt.accepted){arcadeFlashBonus(`+${receipt.points} ${receipt.label} · ×${receipt.multiplier}`);audio.tone(330+receipt.multiplier*90,.1,"triangle",.05);audio.tone(660+receipt.multiplier*90,.09,"sine",.035,.07);arcadeRecord("score-event",receipt)}return receipt;
    }
    const arcadeDamageBase=spendTruckDamage;
    spendTruckDamage=function(amount,reason){const result=arcadeDamageBase(amount,reason);if(amount>0){resetArcadeCombo();arcadeImpactStrength=Math.max(arcadeImpactStrength,clamp(amount/24,.2,1));arcadeRecord("impact",{reason,damage:result})}return result};
    function applyImpactCamera(){
      if(comicShakeLife>0||!settings.motion||arcadeImpactStrength<.015)return;
      const now=skillVisualTime*65;camera.position.x+=Math.sin(now*1.7)*arcadeImpactStrength*.24;camera.position.y+=Math.cos(now)*arcadeImpactStrength*.16;
    }
    function updateRiskHud(){
      const state=arcadeScore.snapshot(),playing=currentScene()==="driving"&&!launchIntro.active;
      riskHud.hidden=!playing;encounterHud.hidden=!playing;
      $("#risk-multiplier").textContent=`×${state.multiplier}`;$("#risk-label").textContent=state.pending?state.lastEvent:"BUILD A COMBO";
      $("#risk-pending").textContent=state.pending.toLocaleString();$("#risk-bank").textContent=`${state.banked.toLocaleString()} BANKED · $${arcadeBonuses}`;
      $("#risk-meter-fill").style.transform=`scaleX(${clamp(state.remaining/skillProgression.effects().comboWindow,0,1)})`;
      $("#risk-hint").textContent=state.pending?`Bank in ${state.remaining.toFixed(1)}s · crash loses combo`:state.cooldown>0?"Steady the rig. Build again.":"Close passes · Clean landings";
      riskHud.classList.toggle("hot",state.multiplier>=3);encounterHud.textContent=arcadeEventLabel;
    }

    const encounterRoot=new THREE.Group();
    const encounterMaterials={ramp:new THREE.MeshLambertMaterial({color:0x214c62}),cyan:new THREE.MeshBasicMaterial({color:0x6fe8e8}),barrier:new THREE.MeshLambertMaterial({color:0xf5a33d}),stripe:new THREE.MeshLambertMaterial({color:0x20272e}),crate:new THREE.MeshLambertMaterial({color:0xc79554}),red:new THREE.MeshBasicMaterial({color:0xff5b57})};
    const rampShape=new THREE.Shape();rampShape.moveTo(-7,0);rampShape.lineTo(7,0);rampShape.lineTo(7,2.8);rampShape.closePath();
    const rampGeometry=new THREE.ExtrudeGeometry(rampShape,{depth:4.6,bevelEnabled:false,steps:1});rampGeometry.rotateY(-Math.PI/2);rampGeometry.translate(2.3,0,0);rampGeometry.computeVertexNormals();
    function addEncounterBox(group,material,x,y,z,w,h,d){const part=new THREE.Mesh(arcadeTrafficGeometry,material);part.position.set(x,y,z);part.scale.set(w,h,d);group.add(part);return part}
    function ensureArcadeNetwork(){
      if(!course||arcadeNetworkCourse===course)return;
      arcadeNetworkCourse=course;arcadeNetwork=buildArcadeRoutes(course);arcadeEncounters=planArcadeEncounters(course,arcadeNetwork);
      if(encounterRoot.parent!==dynamicRoot)dynamicRoot.add(encounterRoot);
    }
    function createEncounterHost(event){
      const group=new THREE.Group(),point=arcadePathPoint(event.path,event.distance,event.kind==="ramp"?event.lane:0);
      if(!point)return null;group.position.set(point.x,terrainHeight(course,point.x,point.z)+.15,point.z);group.rotation.y=point.heading;
      const props=[];
      if(event.kind==="ramp"){
        group.add(new THREE.Mesh(rampGeometry,encounterMaterials.ramp));
        for(const side of [-1,1]){const rail=addEncounterBox(group,encounterMaterials.cyan,side*2.2,1.5,0,.13,.13,14.3);rail.rotation.x=-Math.atan2(2.8,14)}
        for(let i=0;i<3;i++){const z=-4+i*3.7,y=(z+7)/14*2.8+.08;for(const side of [-1,1]){const mark=addEncounterBox(group,encounterMaterials.cyan,side*.65,y,z,.12,.05,1.9);mark.rotation.y=side*.65;mark.rotation.x=-.19}}
      }else if(event.kind==="breakables"){
        for(let i=0;i<4;i++){const lane=event.lane+(i%2?1.25:-1.25),localZ=(i>>1)*4-2,prop=addEncounterBox(group,encounterMaterials.crate,-lane,1.05,localZ,1.6,2.1,1.6);addEncounterBox(prop,encounterMaterials.stripe,0,0,0,1.04,.12,1.04);props.push({id:`${event.id}:crate:${i}`,mesh:prop,lane,localZ,radius:1.15,broken:false})}
      }else if(event.kind==="roadblock"){
        const width=point.edge.width,blockedLane=-Math.sign(event.safeLane)*Math.min(width*.24,6),barrierWidth=Math.max(3.4,width*.52-3.5);
        const barrier=addEncounterBox(group,encounterMaterials.barrier,-blockedLane,.85,0,barrierWidth,1.7,1.25);for(let i=-2;i<=2;i++){const stripe=addEncounterBox(barrier,encounterMaterials.stripe,i*.18,0,.53,.08,1.06,.04);stripe.rotation.z=-.4}
        props.push({id:`${event.id}:barrier`,mesh:barrier,lane:blockedLane,localZ:0,radius:barrierWidth*.5,barrier:true,width:barrierWidth});
        for(const z of [-12,-22,-32])addEncounterBox(group,encounterMaterials.red,-blockedLane,.6,z,.55,1.2,.55);
        for(const z of [-10,0,10])addEncounterBox(group,encounterMaterials.cyan,-event.safeLane,.1,z,3.8,.08,1.2);
      }else{
        for(const side of [-1,1])for(const z of [-12,0,12])addEncounterBox(group,encounterMaterials.cyan,side*(point.edge.width*.43),.7,z,.35,1.4,.35);
      }
      group.userData.encounterId=event.id;encounterRoot.add(group);const host={event,group,props};arcadeEncounterHosts.set(event.id,host);return host;
    }
    const debrisPool=Array.from({length:32},()=>{const mesh=new THREE.Mesh(arcadeTrafficGeometry,encounterMaterials.crate);mesh.scale.set(.4,.35,.55);mesh.visible=false;scene.add(mesh);return{mesh,life:0,velocity:new THREE.Vector3()}});let debrisCursor=0;
    function burstDebris(point,speed){for(let n=0;n<7;n++){const item=debrisPool[debrisCursor++%debrisPool.length],angle=n*2.39996;item.life=.65+n*.055;item.mesh.visible=true;item.mesh.position.copy(point);item.velocity.set(Math.cos(angle)*5,3+n*.5,Math.sin(angle)*5-speed*.12)}}
    function arcadeRampGround(position,baseHeight){
      for(const {event,group} of arcadeEncounterHosts.values()){
        if(event.kind!=="ramp")continue;
        const dx=position.x-group.position.x,dz=position.z-group.position.z,s=Math.sin(group.rotation.y),c=Math.cos(group.rotation.y),along=dx*s+dz*c,side=dx*c-dz*s;
        if(Math.abs(side)<=2.3&&along>=-7&&along<=7)return Math.max(baseHeight,group.position.y+(along+7)/14*2.8);
      }
      return baseHeight;
    }
    const arcadeGroundSampleBase=groundSample;
    groundSample=function(position){
      const base=arcadeGroundSampleBase(position),height=arcadeRampGround(position,base.height);if(height===base.height)return base;
      const e=.3,h=(x,z)=>arcadeRampGround({x,z},terrainHeight(course,x,z)),nx=h(position.x-e,position.z)-h(position.x+e,position.z),nz=h(position.x,position.z-e)-h(position.x,position.z+e),length=Math.hypot(nx,2*e,nz)||1;
      return{height,normal:{x:nx/length,y:2*e/length,z:nz/length}};
    };
    function updateArcadeEncounters(dt){
      ensureArcadeNetwork();if(!arcadeNetwork)return;
      const truck=readTruck(),road=nearestRoad(course,truck.position),progress=arcadeRoadProgress(road,arcadeNetwork),now=readRun().rawTime;
      arcadeEventLabel=arcadeWeatherAmount>.35?"RAIN · EASE INTO CORNERS":"OPEN ROAD · FIND YOUR LINE";
      for(const event of arcadeEncounters){
        const distance=Math.hypot(event.point.x-truck.position.x,event.point.z-truck.position.z);let host=arcadeEncounterHosts.get(event.id);
        if(distance<440&&!host)host=createEncounterHost(event);
        if(!host)continue;host.group.visible=distance<440;
        if(distance>620){host.group.removeFromParent();arcadeEncounterHosts.delete(event.id);continue}
        for(const prop of host.props){prop.broken=arcadeBrokenProps.has(prop.id);prop.mesh.visible=!prop.broken}
        if(!progress||progress.path!==event.path)continue;
        const ahead=event.distance-progress.distance;
        if(ahead>0&&ahead<event.warningLead){
          const label=event.kind==="ramp"?`RAMP · ${event.lane>0?"RIGHT":"LEFT"} LANE`:event.kind==="roadblock"?`ROADBLOCK · PASS ${event.safeLane>0?"RIGHT":"LEFT"}`:event.kind==="breakables"?"BREAKABLE CARGO · PICK A LINE":"TRAFFIC WEAVE · CLOSE PASSES";
          arcadeEventLabel=`${label} · ${Math.round(ahead)} m`;
          if(!arcadeWarned.has(event.id)){arcadeWarned.add(event.id);audio.tone(540,.055,"sine",.025);arcadeRecord("encounter-warning",{id:event.id,kind:event.kind,distance:ahead})}
        }
        const dx=truck.position.x-host.group.position.x,dz=truck.position.z-host.group.position.z,s=Math.sin(host.group.rotation.y),c=Math.cos(host.group.rotation.y),along=dx*s+dz*c,side=dx*c-dz*s;
        if(event.kind==="ramp"&&!arcadeUsedRamps.has(event.id)&&Math.abs(side)<2.8&&along>1.5&&along<10&&truck.speed>10&&Math.cos(truck.heading-host.group.rotation.y)>.7&&truck.position.y<host.group.position.y+6){
          arcadeUsedRamps.add(event.id);arcadeActiveStunt={id:event.id,start:now,clean:true};
          engine.n.longHaulTruck.impulse({y:clamp(7+truck.speed*.17,10,16),kind:"launch",allowTip:false});audio.tone(180,.2,"sawtooth",.04);arcadeRecord("ramp-launch",{id:event.id,speed:truck.speed});
        }
        if(!truck.grounded&&truck.position.y>host.group.position.y+4)continue;
        for(const prop of host.props){
          if(prop.broken||arcadeRecoveryGrace>0||Math.abs(along-prop.localZ)>5.6||Math.abs(side+prop.lane)>(prop.barrier?prop.width/2+1.6:2.7))continue;
          if(Math.abs(truck.speed)<3)continue;
          if(prop.barrier){
            if(prop.contact)continue;prop.contact=true;spendTruckDamage(12+Math.min(12,truck.speed*.25),"roadblock");spendCargoDamage(4,"roadblock");engine.n.longHaulTruck.impulse({speedDelta:-truck.speed*.58,headingDelta:Math.sign(event.safeLane)*.09,rollDelta:Math.sign(event.safeLane)*.65,y:2,kind:"roadblock"});engine.n.longHaulRun.penalty({id:prop.id,kind:"roadblock",label:"Roadblock impact",seconds:6,collision:true});audio.hit();arcadeRecord("roadblock-impact",{id:prop.id});
          }else{
            prop.broken=true;arcadeBrokenProps.add(prop.id);prop.mesh.visible=false;const worldPosition=new THREE.Vector3();prop.mesh.getWorldPosition(worldPosition);burstDebris(worldPosition,truck.speed);engine.n.longHaulTruck.impulse({speedDelta:-truck.speed*.025,kind:"prop",allowTip:false});awardArcadeEvent({id:prop.id,kind:"destruction",speed:truck.speed,forward:truck.speed>0});audio.tone(95,.09,"square",.045);arcadeRecord("prop-destroyed",{id:prop.id});
          }
        }
        for(const prop of host.props)if(prop.barrier&&(Math.abs(along)>10||Math.abs(side+prop.lane)>prop.width/2+3))prop.contact=false;
      }
    }

    const rainCount=120,rainPositions=new Float32Array(rainCount*6),rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute("position",new THREE.BufferAttribute(rainPositions,3).setUsage(THREE.DynamicDrawUsage));
    const rainMaterial=new THREE.LineBasicMaterial({color:0xb7d9ef,transparent:true,opacity:0,depthWrite:false});const rainMesh=new THREE.LineSegments(rainGeometry,rainMaterial);rainMesh.frustumCulled=false;camera.add(rainMesh);
    function updateArcadeWeather(dt){
      if(readRun().status!=="running")return;
      arcadeWeatherTime+=dt;const phase=arcadeWeatherTime%105,target=phase>24&&phase<66?1:0;
      arcadeWeatherAmount=lerp(arcadeWeatherAmount,target,1-Math.exp(-dt*.35));
      sun.intensity=lerp(.86,.44,arcadeWeatherAmount);hemi.intensity=lerp(1.05,.8,arcadeWeatherAmount);
      skyMaterial.uniforms.topColor.value.setRGB(lerp(.329,.19,arcadeWeatherAmount),lerp(.49,.29,arcadeWeatherAmount),lerp(.573,.37,arcadeWeatherAmount));
      skyMaterial.uniforms.horizonColor.value.setRGB(lerp(.933,.49,arcadeWeatherAmount),lerp(.718,.57,arcadeWeatherAmount),lerp(.467,.61,arcadeWeatherAmount));
      rainMaterial.opacity=arcadeWeatherAmount*.38;rainMesh.visible=arcadeWeatherAmount>.05;rainGeometry.setDrawRange(0,(settings.quality?rainCount:60)*2);
      for(let i=0;i<rainCount;i++){const j=i*6,x=((i*7.31)%48)-24,y=18-((i*4.17+arcadeWeatherTime*32)%38),z=-5-(i*1.89)%55;rainPositions.set([x,y,z,x-.35,y-1.5,z+.5],j)}rainGeometry.attributes.position.needsUpdate=true;
      _lhAsphaltMaterial.roughness=lerp(.9,.58,arcadeWeatherAmount);
    }
    const arcadeSurfaceBase=surfaceAt;
    surfaceAt=function(position){const surface=arcadeSurfaceBase(position);if(surface.surface==="road")surface.grip*=1-arcadeWeatherAmount*.12;return surface};
    function updateArcadeRules(dt){
      const run=readRun(),truck=readTruck(),active=run.status==="running"&&!launchIntro.active;
      arcadeRecoveryGrace=Math.max(0,arcadeRecoveryGrace-dt);arcadeImpactStrength=Math.max(0,arcadeImpactStrength-dt*1.8);
      impactVeil.style.opacity=String(settings.motion?arcadeImpactStrength*.4:0);
      if(run.collisions>arcadeLastCollisionCount){arcadeLastCollisionCount=run.collisions;resetArcadeCombo()}
      if(truck.landingSequence!==arcadeLastLanding){
        arcadeLastLanding=truck.landingSequence;const landing=truck.lastLanding;
        if(landing&&landing.airTime>=.6){
          arcadeImpactStrength=Math.max(arcadeImpactStrength,Math.min(.45,landing.impactSpeed/45));audio.tone(72,.13,"triangle",.06);
          if(arcadeActiveStunt&&!truck.tipped){awardArcadeEvent({id:`${arcadeActiveStunt.id}:landing`,kind:"landing",speed:Math.abs(truck.speed),forward:truck.speed>0,airTime:landing.airTime,distance:landing.distance,clean:arcadeActiveStunt.clean});arcadeRecord("stunt-landed",{...landing});arcadeActiveStunt=null}
        }
      }
      const receipt=arcadeScore.tick(dt,{active:active&&!mapOpen&&arcadeGaragePanel.hidden});if(receipt){syncArcadeCash();arcadeFlashBonus(`+${receipt.points} BANKED`);audio.tone(880,.12,"sine",.04);arcadeRecord("combo-banked",receipt)}
      if(active){updateArcadeEncounters(dt);updateArcadeWeather(dt)}
      for(const item of debrisPool){if(item.life<=0)continue;item.life-=dt;item.mesh.visible=item.life>0;item.velocity.y-=12*dt;item.mesh.position.addScaledVector(item.velocity,dt);item.mesh.rotation.x+=dt*5;item.mesh.rotation.z+=dt*3}
      updateRiskHud();
    }
    function resetArcadeOverhaul(){
      launchIntro.active=false;cinematic.hidden=true;document.body.classList.remove("cinematic");arcadeScore.reset();arcadeNetwork=null;arcadeNetworkCourse=null;arcadeEncounters=[];
      arcadeEncounterHosts.clear();encounterRoot.clear();arcadeBrokenProps.clear();arcadeUsedRamps.clear();arcadeWarned.clear();arcadeEventHistory.length=0;arcadeActiveStunt=null;
      arcadeRecoveryGrace=0;arcadeImpactStrength=0;arcadeLastCollisionCount=0;arcadeLastLanding=0;arcadeWeatherTime=0;arcadeWeatherAmount=0;arcadeTrafficSerial=0;
      sun.intensity=.86;hemi.intensity=1.05;skyMaterial.uniforms.topColor.value.set(0x547d92);skyMaterial.uniforms.horizonColor.value.set(0xeeb777);rainMaterial.opacity=0;rainMesh.visible=false;_lhAsphaltMaterial.roughness=.9;
      for(const item of debrisPool){item.life=0;item.mesh.visible=false}riskHud.hidden=true;encounterHud.hidden=true;impactVeil.style.opacity="0";
    }
