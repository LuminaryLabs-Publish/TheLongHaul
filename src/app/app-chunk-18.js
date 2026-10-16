    // Arcade Campaign enhancement layer. Classic Mode retains its existing timed-haul behavior.
    const arcadeCampaign=()=>Boolean(campaignLaunch?.route&&course?.geography);
    const arcadeUpgradeState=()=>{try{return JSON.parse(localStorage.getItem("longhaul-campaign-v1")||"null")||{}}catch{return{}}};
    let arcadeConfiguredRun="",arcadeSettledRun="";
    const arcadeTrafficRoot=new THREE.Group();dynamicRoot.add(arcadeTrafficRoot);
    const arcadeTrafficGeometry=new THREE.BoxGeometry(1,1,1);
    const arcadeTrafficMaterials=[0x4c91b7,0xc7c2ac,0xb64c3c,0x496c57,0xb69d57].map(color=>new THREE.MeshLambertMaterial({color}));
    const arcadeVehicles=[];
    function arcadeMakeVehicle(index){
      const group=new THREE.Group(),kind=index%4,bodyLength=[4.7,5.8,7.5,11][kind],height=[1.35,1.8,2.5,3.15][kind];
      const body=new THREE.Mesh(arcadeTrafficGeometry,arcadeTrafficMaterials[index%arcadeTrafficMaterials.length]);
      body.scale.set([2,2.25,2.3,2.6][kind],height,bodyLength);body.position.y=.9+height/2;group.add(body);
      const cab=new THREE.Mesh(arcadeTrafficGeometry,arcadeTrafficMaterials[(index+2)%arcadeTrafficMaterials.length]);
      cab.scale.set(kind===3?2.4:1.8,kind===3?2:1.1,kind===3?2.7:1.9);
      cab.position.set(0,kind===3?2.8:1.85,kind===3?bodyLength*.26:-.25);group.add(cab);
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
          if(separation<12&&!vehicle.hit){vehicle.near=true;arcadeBonuses+=35;toast("NEAR MISS +$35","good",900)}
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
