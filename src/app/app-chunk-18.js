    // Arcade Campaign enhancement layer. Classic Mode retains its existing timed-haul behavior.
    const arcadeCampaign=()=>Boolean(campaignLaunch?.route&&course?.geography);
    const arcadeUpgradeState=()=>{try{return JSON.parse(localStorage.getItem("longhaul-campaign-v1")||"null")||{}}catch{return{}}};
    let arcadeConfiguredRun="",arcadeSettledRun="";
    const arcadeTrafficRoot=new THREE.Group();dynamicRoot.add(arcadeTrafficRoot);
    const arcadeTrafficGeometry=new THREE.BoxGeometry(1,1,1);
    const arcadeTrafficMaterials=[0x4c91b7,0xc7c2ac,0xb64c3c,0x496c57,0xb69d57].map(color=>new THREE.MeshLambertMaterial({color}));
    const arcadeVehicles=[];
    const arcadeWheelGeo=new THREE.CylinderGeometry(.5,.5,.36,12);
    const arcadeWheelMat=new THREE.MeshLambertMaterial({color:0x171c22});
    const arcadeGlassMat=new THREE.MeshLambertMaterial({color:0x75aec0});
    const arcadeLampMat=new THREE.MeshBasicMaterial({color:0xffdd99});
    const arcadeTailMat=new THREE.MeshBasicMaterial({color:0xc42f29});
    function arcadeMakeVehicle(index){
      const group=new THREE.Group(),kind=index%4,bodyLength=[4.7,5.8,7.5,11][kind],height=[1.35,1.8,2.5,3.15][kind],width=[1.9,2.18,2.28,2.55][kind],paint=arcadeTrafficMaterials[index%arcadeTrafficMaterials.length];
      function box(mat,w,h,d,x,y,z){const part=new THREE.Mesh(arcadeTrafficGeometry,mat);part.scale.set(w,h,d);part.position.set(x,y,z);group.add(part)}
      box(arcadeWheelMat,width,.35,bodyLength,0,.73,0);
      box(paint,width,height,bodyLength*(kind===3?.58:.86),0,1.15+height*.5,kind===3?-bodyLength*.18:0);
      if(kind!==2)box(paint,width*.92,kind===3?1.65:.85,kind===3?2.65:2.3,0,1.55+height*.65,kind===3?bodyLength*.32:bodyLength*.12);
      const front=kind===3?bodyLength*.47:bodyLength*.39;
      box(arcadeGlassMat,width*.77,.55,.08,0,1.45+height*.73,front);
      for(const side of [-1,1]){for(const z of [-bodyLength*.31,bodyLength*.31]){const wheel=new THREE.Mesh(arcadeWheelGeo,arcadeWheelMat);wheel.rotation.z=Math.PI/2;wheel.position.set(side*(width*.5+.08),.52,z);group.add(wheel)}
       box(arcadeLampMat,.25,.21,.12,side*width*.33,1.06,bodyLength*.49);box(arcadeTailMat,.27,.22,.12,side*width*.33,1.04,-bodyLength*.49)}
      arcadeTrafficRoot.add(group);
      return {group,kind,length:bodyLength,progress:0,lane:0,hit:false,passed:false,near:false,active:false};
    }
    for(let i=0;i<14;i++)arcadeVehicles.push(arcadeMakeVehicle(i));
    function arcadeRoutePosition(progress,lane=0){
      const edges=course?.edges??[];if(!edges.length)return null;
      const pointAt=index=>edges[Math.max(0,Math.min(edges.length-1,index))]?.samples;
      let remaining=Math.max(0,progress);
      for(let i=0;i<edges.length;i++){
        const edge=edges[i],length=edge.length||Math.hypot(edge.samples.at(-1).x-edge.samples[0].x,edge.samples.at(-1).z-edge.samples[0].z);
        if(remaining>length&&i<edges.length-1){remaining-=length;continue}
        const a=edge.samples[0],b=edge.samples.at(-1),t=clamp(remaining/Math.max(1,length),0,1),dx=b.x-a.x,dz=b.z-a.z,mag=Math.hypot(dx,dz)||1;
        return{x:lerp(a.x,b.x,t)-dz/mag*lane,z:lerp(a.z,b.z,t)+dx/mag*lane,heading:Math.atan2(dx,dz)};
      }
      return null;
    }
    function arcadeTrafficUpdate(dt){
      if(!arcadeCampaign()) {arcadeTrafficRoot.visible=false;return}
      arcadeTrafficRoot.visible=true;if(arcadeTrafficRoot.parent!==dynamicRoot)dynamicRoot.add(arcadeTrafficRoot);
      const truck=engine.n.longHaulTruck.getState(),run=engine.n.longHaulRun.getState(),distance=run.distance||0;
      const upgrades=arcadeUpgradeState().upgrades||{},armor=Number(upgrades.armor)||0;
      for(let i=0;i<arcadeVehicles.length;i++){
        const vehicle=arcadeVehicles[i];
        if(!vehicle.active||vehicle.progress<distance-65||vehicle.progress>distance+330){
          vehicle.progress=distance+90+i*19;vehicle.lane=[-6,-2.9,3.1,6.2][(i+Math.floor(distance/280))%4];
          vehicle.hit=false;vehicle.passed=false;vehicle.near=false;vehicle.active=true;
        }
        vehicle.progress+=dt*(6+vehicle.kind*1.7);
        const pos=arcadeRoutePosition(vehicle.progress,vehicle.lane);if(!pos){vehicle.group.visible=false;continue}
        vehicle.group.visible=true;vehicle.group.position.set(pos.x,terrainHeight(course,pos.x,pos.z)+.05,pos.z);vehicle.group.rotation.y=pos.heading;
        const separation=Math.hypot(pos.x-truck.position.x,pos.z-truck.position.z);
        if(separation<vehicle.length*.48+2.2&&!vehicle.hit&&Math.abs(truck.speed)>3){
          vehicle.hit=true;
          const key="traffic:"+i+":"+Math.floor(vehicle.progress/70);
          const receipt=applyLongHaulOperationOnce(engine,runKey,key,()=>({seconds:5}));
          if(receipt.applied){
            meters.spend("truck-condition",Math.max(3,14-armor*2),"traffic-collision");
            engine.n.longHaulTruck.impulse({speedDelta:-truck.speed*.38,headingDelta:(i%2?1:-1)*.07});
            engine.n.longHaulRun.penalty({id:key,kind:"traffic",label:"Highway traffic collision",seconds:5,collision:true});
            toast("Traffic collision · protect your rig","bad",1300);audio.hit();
          }
        }
        if(!vehicle.passed&&vehicle.progress<distance+3){
          vehicle.passed=true;
          if(separation<12&&!vehicle.hit){vehicle.near=true;arcadeBonuses+=35;arcadeFlashBonus("+$35 NEAR MISS");toast("NEAR MISS +$35","good",900)}
          else if(!vehicle.hit){arcadeBonuses+=15}
        }
      }
    }
    let arcadeBonuses=0;
    const arcadeStartGeneration=startGeneration;
    startGeneration=function(...args){arcadeBonuses=0;arcadeConfiguredRun="";arcadeTrafficRoot.children.forEach(child=>child.visible=false);for(const v of arcadeVehicles)v.active=false;return arcadeStartGeneration(...args)};
    function arcadeApplyUpgrades(){
      if(!arcadeCampaign()||arcadeConfiguredRun===runKey)return;
      arcadeConfiguredRun=runKey;
      const save=arcadeUpgradeState(),u=save.upgrades||{},fleet=save.truck||"delivery";
      const level=id=>Math.max(0,Math.min(5,Number(u[id])||0));
      const base={delivery:[36,5.1],box:[39,5.35],semi:[42,5.65],heavy:[45,5.9]}[fleet]||[36,5.1];
      engine.n.longHaulTruckDynamicsProfile.configure({
        maximumForwardSpeed:base[0]+level("engine")*2.8+level("transmission")*1.7,
        engineAcceleration:base[1]+level("engine")*.7+level("transmission")*.28,
        brakeForce:10.5+level("brakes")*1.5,
        steering:{response:8+level("handling")*.65+level("tires")*.25},
        grip:{highway:5.2+level("tires")*.65,road:4.3+level("tires")*.55},
        suspension:{travel:.92+level("suspension")*.07},
        boost:{forceMultiplier:1.35+level("boost")*.19,speedMultiplier:1.16+level("boost")*.045}
      });
    }
    const arcadeOriginalPreTick=preTickDriving;
    preTickDriving=function(dt){
      const surface=arcadeOriginalPreTick(dt);
      if(arcadeCampaign()){
        const state=engine.n.longHaulTruck.getState(),intent=engine.n.coreInput.getIntent(),u=arcadeUpgradeState().upgrades||{};
        const efficiency=1/(1+(Number(u.efficiency)||0)*.19+(Number(u.fuel)||0)*.24);
        const extra=(.48+Math.max(0,Number(intent.throttle)||0)*.33+(intent.boost?.7:0)+Math.abs(state.speed)*.005)*dt*efficiency;
        meters.spend("fuel",extra,"arcade-highway-consumption");
      }
      return surface;
    };
    function arcadeSettleFailedRun(){
      if(!arcadeCampaign()||arcadeSettledRun===runKey)return;
      const run=engine.n.longHaulRun.getState();if(run.status!=="failed")return;
      arcadeSettledRun=runKey;
      const route=campaignLaunch.route,save=arcadeUpgradeState();
      if(!Number.isFinite(Number(save.cash)))return;
      const traveled=Math.max(0,run.distance||0),cash=Math.max(75,Math.round(traveled*.11))+arcadeBonuses;
      save.cash+=cash;save.careerMiles=(Number(save.careerMiles)||0)+traveled/1609.344;
      save.attempts=(Number(save.attempts)||0)+1;
      save.bestArcadeDistance=Math.max(Number(save.bestArcadeDistance)||0,traveled);
      try{localStorage.setItem("longhaul-campaign-v1",JSON.stringify(save))}catch{}
      const loss=$("#loss-screen .result-card");
      if(loss){
        let payout=$("#arcade-loss-payout");
        if(!payout){payout=document.createElement("div");payout.id="arcade-loss-payout";payout.className="score-grid";loss.insertBefore(payout,loss.querySelector(".panel-footer"))}
        payout.textContent="";
        for(const [label,value] of [["Distance",formatDistance(traveled)],["Driving bonuses","$"+arcadeBonuses],["Cash earned","$"+cash],["Best run",formatDistance(save.bestArcadeDistance)]]){const cell=document.createElement("div");cell.className="score-cell";const a=document.createElement("span"),b=document.createElement("b");a.textContent=label;b.textContent=value;cell.append(a,b);payout.append(cell)}
      }
      $("#loss-retry-btn").textContent="RETRY HIGHWAY";
      $("#loss-new-btn").textContent="GARAGE · UPGRADE";
      $("#loss-title-btn").textContent="CAMPAIGN MAP";
      $("#loss-new-btn").onclick=()=>location.href="./campaign.html#garage";
      $("#loss-title-btn").onclick=()=>location.href="./campaign.html";
    }
    const arcadeOriginalPostTick=postTickGameplay;
    postTickGameplay=function(surface){
      if(arcadeCampaign()){arcadeApplyUpgrades();arcadeTrafficUpdate(1/60)}
      arcadeOriginalPostTick(surface);
      arcadeSettleFailedRun();
    };

    // Visual-first arcade display and procedural title vehicle.
    const arcadeOverlay=document.createElement("div");arcadeOverlay.id="arcade-overlay";arcadeOverlay.innerHTML='<div class="arcade-stat">⛽ <b id="arcade-fuel">100%</b></div><div class="arcade-stat">⚡ <b id="arcade-boost">SHIFT</b></div><div class="arcade-stat">↗ <b id="arcade-distance">0 mi</b></div><div class="arcade-stat">＄ <b id="arcade-earnings">$0</b></div><div id="arcade-flash" aria-live="polite"></div>';document.body.append(arcadeOverlay);
    function arcadeFlashBonus(message){const el=document.getElementById("arcade-flash");el.textContent=message;el.classList.remove("active");void el.offsetWidth;el.classList.add("active")}
    const arcadeMenuTruck=new THREE.Group(),arcadeMenuPaint=new THREE.MeshLambertMaterial({color:0xe1a14e});
    function arcadeMenuBox(mat,w,h,d,x,y,z){const part=new THREE.Mesh(arcadeTrafficGeometry,mat);part.scale.set(w,h,d);part.position.set(x,y,z);arcadeMenuTruck.add(part)}
    arcadeMenuBox(arcadeMenuPaint,2.9,2.5,3.3,0,2.2,1.4);
    arcadeMenuBox(arcadeTrafficMaterials[0],3,3.1,5.5,0,2.8,-2.8);
    arcadeMenuBox(arcadeGlassMat,2.6,1,.12,0,3.03,3.1);
    for(const side of [-1,1])for(const z of [-4.2,2.15]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.88,.88,.55,12),arcadeWheelMat);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.72,1,z);arcadeMenuTruck.add(wheel)}
    scene.add(arcadeMenuTruck);arcadeMenuTruck.position.set(4,0,0);
    function arcadeVisualFrame(now){
      const view=currentScene(),title=view==="title"&&!campaignLaunch?.course;
      arcadeMenuTruck.visible=title;
      if(title){arcadeMenuTruck.rotation.y=-.5+Math.sin(now*.00031)*.22;arcadeMenuTruck.position.y=Math.sin(now*.0011)*.09;camera.position.set(11,6,17);camera.lookAt(2,2,-1)}
      const playing=view==="driving"&&arcadeCampaign();arcadeOverlay.classList.toggle("active",playing);
      if(playing){const run=engine.n.longHaulRun.getState(),fuel=meters.get("fuel")?.value??0,intent=engine.n.coreInput.getIntent(),distance=run.distance||0;
        document.getElementById("arcade-fuel").textContent=Math.ceil(fuel)+"%";
        document.getElementById("arcade-boost").textContent=intent.boost?"ACTIVE":"SHIFT";
        document.getElementById("arcade-distance").textContent=(distance/1609.344).toFixed(2)+" mi";
        document.getElementById("arcade-earnings").textContent="$"+(Math.max(75,Math.round(distance*.11))+arcadeBonuses)}
    }
