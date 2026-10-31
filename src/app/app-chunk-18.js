    // Arcade Campaign and Endless enhancement layer. Both modes share the Nexus route and truck contracts.
    const arcadeCampaign=()=>Boolean(campaignLaunch?.route&&course?.geography);
    const arcadeRoadsideMode=()=>Boolean(course&&!arcadeCampaign());
    const arcadeFreshSave=()=>({location:"NJ",visited:["NJ"],mastered:[],cash:1800,truck:"delivery",ownedTrucks:["delivery"],upgrades:{engine:0,brakes:0,handling:0,fuel:0,efficiency:0,transmission:0,tires:0,suspension:0,armor:0,boost:0},deliveries:0,careerMiles:0,coast:false});
    const arcadeUpgradeState=()=>{const defaults=arcadeFreshSave();try{const saved=JSON.parse(localStorage.getItem("longhaul-campaign-v1")||"null");if(!saved||typeof saved!=="object"||Array.isArray(saved))return defaults;const result={...defaults,...saved},cash=Number(saved.cash);result.cash=Number.isFinite(cash)&&cash>=0?cash:defaults.cash;const upgrades=saved.upgrades&&typeof saved.upgrades==="object"&&!Array.isArray(saved.upgrades)?saved.upgrades:{};result.upgrades={};for(const id of Object.keys(defaults.upgrades)){const value=Number(upgrades[id]);result.upgrades[id]=Number.isFinite(value)?Math.max(0,Math.min(5,Math.floor(value))):0}return result}catch{return defaults}};
    function arcadeSaveWritable(){try{const raw=localStorage.getItem("longhaul-campaign-v1");if(raw===null)return true;const value=JSON.parse(raw);if(!value||typeof value!=="object"||Array.isArray(value))return false;if(value.cash!==undefined&&(!Number.isFinite(Number(value.cash))||Number(value.cash)<0))return false;if(value.upgrades!==undefined){if(!value.upgrades||typeof value.upgrades!=="object"||Array.isArray(value.upgrades))return false;for(const level of Object.values(value.upgrades)){const n=Number(level);if(!Number.isInteger(n)||n<0||n>5)return false}}return true}catch{return false}}
    let arcadeConfiguredRun="",arcadeSettledRun="";
    const arcadeTrafficRoot=new THREE.Group();dynamicRoot.add(arcadeTrafficRoot);
    const arcadeTrafficGeometry=new THREE.BoxGeometry(1,1,1);
    const arcadeTrafficMaterials=[0x4c91b7,0xc7c2ac,0xb64c3c,0x496c57,0xb69d57].map(color=>new THREE.MeshLambertMaterial({color}));
    const arcadeVehicles=[];let arcadeCachedSave=null,arcadeEdgeCache=null,arcadeGarageCourse=null,arcadeGarageStops=[],arcadeTrafficEdge=null,arcadeTrafficEdgeCandidate=null,arcadeTrafficEdgeWait=0;
    const arcadeGarageRoot=new THREE.Group();dynamicRoot.add(arcadeGarageRoot);
    const arcadeGarageMaterials={paint:new THREE.MeshLambertMaterial({color:0x9c5a32}),roof:new THREE.MeshLambertMaterial({color:0x293a3e}),sign:new THREE.MeshLambertMaterial({color:0xe7b560}),dark:new THREE.MeshLambertMaterial({color:0x172329})};
    const arcadeGarageSignCanvas=document.createElement("canvas");arcadeGarageSignCanvas.width=256;arcadeGarageSignCanvas.height=96;const arcadeGarageSignContext=arcadeGarageSignCanvas.getContext("2d");arcadeGarageSignContext.fillStyle="#173a50";arcadeGarageSignContext.fillRect(0,0,256,96);arcadeGarageSignContext.fillStyle="#fff1d0";arcadeGarageSignContext.font="900 47px system-ui";arcadeGarageSignContext.textAlign="center";arcadeGarageSignContext.fillText("GARAGE",128,63);const arcadeGarageSignTexture=new THREE.CanvasTexture(arcadeGarageSignCanvas);arcadeGarageSignTexture.colorSpace=THREE.SRGBColorSpace;const arcadeGarageSignMaterial=new THREE.MeshBasicMaterial({map:arcadeGarageSignTexture,side:THREE.DoubleSide}),arcadeGarageSignGeometry=new THREE.PlaneGeometry(5.4,2);
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
      group.visible=false;arcadeTrafficRoot.add(group);
      const collider=ARCADE_TRAFFIC_COLLIDERS[kind],collisionReach=(Math.hypot(LONG_HAUL_TRUCK_COLLIDER.width,LONG_HAUL_TRUCK_COLLIDER.length)+Math.hypot(collider.width,collider.length))*.5+Math.abs(LONG_HAUL_TRUCK_COLLIDER.offsetZ||0)+Math.abs(collider.offsetZ||0);
      return {group,kind,collider,collisionReach,progress:0,lane:0,hit:false,passed:false,near:false,active:false};
    }
    for(let i=0;i<14;i++)arcadeVehicles.push(arcadeMakeVehicle(i));
    const arcadeOriginalBuildTruck=buildTruck;
    buildTruck=function(){
      const rig=arcadeOriginalBuildTruck(),fleet=(arcadeCachedSave??=arcadeUpgradeState()).truck;
      if(!["box","semi","heavy"].includes(fleet))return rig;
      const cargo=new THREE.Group(),paint=fleet==="box"?materials.white:fleet==="semi"?materials.blue:materials.yellow;
      const add=(material,x,y,z,w,h,d)=>{const part=new THREE.Mesh(arcadeTrafficGeometry,material);part.position.set(x,y,z);part.scale.set(w,h,d);cargo.add(part)};
      add(paint,0,3.1,-1.65,3.05,2.4,4.2);
      add(materials.truckDark,0,1.95,-1.65,3.1,.2,4.25);
      if(fleet!=="box")for(const x of [-1.48,1.48])add(materials.chrome,x,3.1,-1.65,.08,2.35,4.15);
      if(fleet==="heavy")for(const z of [-3.35,-1.65,.05])add(materials.truckDark,0,4.35,z,3.1,.12,.15);
      rig.body.add(cargo);for(const crate of rig.crates)crate.visible=false;
      rig.grounding=createTruckGrounding(THREE,rig.body);return rig;
    };
    function arcadeEdgeData(edge){
      if(arcadeEdgeCache?.course!==course)arcadeEdgeCache={course,edges:new Map()};
      let data=arcadeEdgeCache.edges.get(edge);if(data)return data;
      const samples=edge?.samples??[],cumulative=[0];for(let i=1;i<samples.length;i++)cumulative.push(cumulative[i-1]+Math.hypot(samples[i].x-samples[i-1].x,samples[i].z-samples[i-1].z));
      data={samples,cumulative,total:cumulative.at(-1)||0};arcadeEdgeCache.edges.set(edge,data);return data;
    }
    function arcadeEdgePosition(edge,distance,lane=0){
      const {samples,cumulative,total}=arcadeEdgeData(edge);if(samples.length<2||distance<0||distance>total)return null;
      let lo=0,hi=cumulative.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(cumulative[mid]<distance)lo=mid+1;else hi=mid}
      const index=Math.max(1,lo),a=samples[index-1],b=samples[index],segment=Math.hypot(b.x-a.x,b.z-a.z)||1,t=clamp((distance-cumulative[index-1])/segment,0,1),dx=b.x-a.x,dz=b.z-a.z;
      return{x:lerp(a.x,b.x,t)-dz/segment*lane,z:lerp(a.z,b.z,t)+dx/segment*lane,heading:Math.atan2(dx,dz),laneWidth:Number(edge.laneWidth)||3.4,laneCount:Math.max(1,Number(edge.laneCount)||2),roadWidth:Number(edge.width)||17};
    }
    function arcadeRoadForward(road,truckHeading){return Math.cos(truckHeading-road.heading)>=0?1:-1}
    function arcadeNearestOnEdge(edge,point){
      const samples=edge?.samples??[];let best=null;
      for(let i=1;i<samples.length;i++){
        const a=samples[i-1],b=samples[i],dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz||1,t=clamp(((point.x-a.x)*dx+(point.z-a.z)*dz)/length2,0,1),x=a.x+dx*t,z=a.z+dz*t,distance=Math.hypot(point.x-x,point.z-z);
        if(!best||distance<best.distance)best={edge,segmentIndex:i-1,t,x,z,distance,heading:Math.atan2(dx,dz)};
      }
      return best;
    }
    function arcadeStableTrafficRoad(nearest,position,dt){
      if(!nearest)return null;
      if(!arcadeTrafficEdge||nearest.edge===arcadeTrafficEdge){arcadeTrafficEdge=nearest.edge;arcadeTrafficEdgeCandidate=null;arcadeTrafficEdgeWait=0;return nearest}
      if(nearest.edge!==arcadeTrafficEdgeCandidate){arcadeTrafficEdgeCandidate=nearest.edge;arcadeTrafficEdgeWait=0}
      arcadeTrafficEdgeWait+=dt;
      const current=arcadeNearestOnEdge(arcadeTrafficEdge,position),stayDistance=(Number(arcadeTrafficEdge.width)||18)*.55+1.4;
      if(current&&current.distance<=stayDistance&&arcadeTrafficEdgeWait<.28)return current;
      arcadeTrafficEdge=nearest.edge;arcadeTrafficEdgeCandidate=null;arcadeTrafficEdgeWait=0;return nearest;
    }
    function arcadeTrafficLane(edge,index){
      const width=Number(edge?.laneWidth)||3.4,count=Math.max(1,Math.floor(Number(edge?.laneCount)||2));
      return width*(index%count-(count-1)/2);
    }
    function arcadeTrafficUpdate(dt){
      if(!course||currentScene()!=="driving") {arcadeTrafficRoot.visible=false;return}
      arcadeTrafficRoot.visible=true;if(arcadeTrafficRoot.parent!==dynamicRoot)dynamicRoot.add(arcadeTrafficRoot);
      const truck=readTruck(),road=arcadeStableTrafficRoad(nearestRoad(course,truck.position),truck.position,dt);if(!road){for(const vehicle of arcadeVehicles)vehicle.group.visible=false;return}
      const truckCollider=createVehicleCollider(truck.position,truck.heading,LONG_HAUL_TRUCK_COLLIDER),edgeData=arcadeEdgeData(road.edge),at=road.segmentIndex,along=(edgeData.cumulative[at]||0)+road.t*Math.hypot(road.edge.samples[at+1].x-road.edge.samples[at].x,road.edge.samples[at+1].z-road.edge.samples[at].z),direction=arcadeRoadForward(road,truck.heading);
      for(let i=0;i<arcadeVehicles.length;i++){
        const vehicle=arcadeVehicles[i];
        if(!vehicle.active||vehicle.edge!==road.edge||vehicle.offset < -48){
          vehicle.edge=road.edge;vehicle.offset=72+i*16;vehicle.lane=arcadeTrafficLane(road.edge,i);
          vehicle.hit=false;vehicle.passed=false;vehicle.near=false;vehicle.active=true;
        }
        const previousOffset=vehicle.offset;vehicle.offset-=dt*(6+vehicle.kind*1.7);const pos=arcadeEdgePosition(road.edge,along+direction*vehicle.offset,vehicle.lane);if(!pos){vehicle.group.visible=false;if(vehicle.offset>0)vehicle.active=false;continue}
        const vehicleHeading=pos.heading+(direction<0?Math.PI:0);
        vehicle.group.visible=true;vehicle.group.position.set(pos.x,terrainHeight(course,pos.x,pos.z)+.05,pos.z);vehicle.group.rotation.y=vehicleHeading;
        const separation=Math.hypot(pos.x-truck.position.x,pos.z-truck.position.z);
        if(!vehicle.hit&&Math.abs(truck.speed)>3&&separation<=vehicle.collisionReach&&vehicleCollidersOverlap(truckCollider,createVehicleCollider(pos,vehicleHeading,vehicle.collider))){
          vehicle.hit=true;
          const key="traffic:"+road.edge.id+":"+i+":"+Math.floor(along+direction*vehicle.offset);
          const receipt=applyLongHaulOperationOnce(engine,runKey,key,()=>({seconds:5}));
          if(receipt.applied){
            spendTruckDamage(14,"traffic-collision");
            spendCargoDamage(5,"traffic-collision");
            engine.n.longHaulTruck.impulse({speedDelta:-truck.speed*.38,headingDelta:(i%2?1:-1)*.07});
            engine.n.longHaulRun.penalty({id:key,kind:"traffic",label:"Highway traffic collision",seconds:5,collision:true});
            toast("Traffic collision · protect your rig","bad",1300);audio.hit();
          }
        }
        if(!vehicle.passed&&previousOffset>0&&vehicle.offset<=0){
          vehicle.passed=true;
          if(Math.abs(truck.speed)>3&&!vehicle.hit){
            if(separation<12){vehicle.near=true;arcadeBonuses+=35;arcadeFlashBonus("+$35 NEAR MISS");toast("NEAR MISS +$35","good",900)}
            else arcadeBonuses+=15;
          }
        }
      }
    }
    let arcadeBonuses=0;
    const arcadeStartGeneration=startGeneration;
    startGeneration=function(...args){const sceneId=engine.n.coreScene.getCurrentScene()?.id;if(generation&&!generation.ready&&!generation.error||!["title","paused","results","loss","driving"].includes(sceneId))return;arcadeBonuses=0;arcadeConfiguredRun="";arcadeCachedSave=null;arcadeEdgeCache=null;arcadeGarageCourse=null;arcadeGarageStops=[];arcadeTrafficEdge=null;arcadeTrafficEdgeCandidate=null;arcadeTrafficEdgeWait=0;arcadeGaragePanel.hidden=true;$("#arcade-loss-payout")?.remove();for(const cell of $$("#arcade-endless-payout"))cell.remove();$("#loss-retry-btn").textContent="Retry Same Course";$("#loss-new-btn").textContent="New Course";$("#loss-title-btn").textContent="Title";$("#result-new-btn").textContent="New Course";$("#result-title-btn").textContent="Title";arcadeTrafficRoot.children.forEach(child=>child.visible=false);for(const v of arcadeVehicles)v.active=false;return arcadeStartGeneration(...args)};
    function arcadeApplyUpgrades(){
      if(!course||arcadeConfiguredRun===runKey)return;
      arcadeConfiguredRun=runKey;
      const save=arcadeCachedSave??=arcadeUpgradeState(),u=save.upgrades||{},fleet=save.truck||"delivery";
      const level=id=>Math.max(0,Math.min(5,Number(u[id])||0));
      const base=arcadeCampaign()?({delivery:[36,5.1],box:[39,5.35],semi:[42,5.65],heavy:[45,5.9]}[fleet]||[36,5.1]):({delivery:[30.5,3.6],box:[32.5,3.85],semi:[34.5,4.1],heavy:[36.5,4.35]}[fleet]||[30.5,3.6]);
      const campaign=arcadeCampaign();
      engine.n.longHaulTruckDynamicsProfile.configure({
        maximumForwardSpeed:base[0]+level("engine")*2.8+level("transmission")*1.7,
        engineAcceleration:base[1]+level("engine")*.7+level("transmission")*.28,
        brakeForce:(campaign?10.5:9.4)+level("brakes")*1.5,
        steering:{response:(campaign?8:6.8)+level("handling")*.65+level("tires")*.25},
        grip:{highway:(campaign?5.2:4.5)+level("tires")*.65,road:(campaign?4.3:3.8)+level("tires")*.55},
        suspension:{travel:.92+level("suspension")*.07},
        boost:{forceMultiplier:(arcadeCampaign()?1.35:1.1)+level("boost")*.19,speedMultiplier:(arcadeCampaign()?1.16:1.08)+level("boost")*.045}
      });
    }
    function arcadeFuelCost(dt,state,throttle,boost){
      const upgrades=(arcadeCachedSave??=arcadeUpgradeState()).upgrades||{};
      const efficiency=1/(1+(Number(upgrades.efficiency)||0)*.19+(Number(upgrades.fuel)||0)*.24);
      if(arcadeCampaign()){
        const distance=Math.max(1,Number(course.scoring?.parDistance)||1),cruiseSpeed=Math.max(1,readDynamics().maximumForwardSpeed*.65),expectedSeconds=Math.max(30,distance/cruiseSpeed);
        return 60/expectedSeconds*(.7+Math.max(0,throttle)*.3+(boost?.25:0))*dt*efficiency;
      }
      return (.014+Math.abs(state.speed)*.0018+throttle*.026+(boost?.12:0))*dt*efficiency;
    }
    function arcadeSettleFailedRun(){
      if(!arcadeCampaign()||arcadeSettledRun===runKey)return;
      const run=readRun();if(run.status!=="failed")return;
      arcadeSettledRun=runKey;
      const route=campaignLaunch.route,save=arcadeUpgradeState();
      if(!Number.isFinite(Number(save.cash)))return;
      const traveled=Math.max(0,run.distance||0),cash=Math.max(75,Math.round(traveled*.11))+arcadeBonuses;
      const attemptId=String(campaignLaunch.attemptId||runKey),receipts=Array.isArray(save.failedCampaignAttempts)?save.failedCampaignAttempts.filter(id=>typeof id==="string"):[],alreadyPaid=receipts.includes(attemptId);
      let saved=alreadyPaid;
      if(!alreadyPaid){
        save.cash+=cash;save.careerMiles=(Number(save.careerMiles)||0)+traveled/1609.344;
        save.attempts=(Number(save.attempts)||0)+1;
        save.bestArcadeDistance=Math.max(Number(save.bestArcadeDistance)||0,traveled);
        save.failedCampaignAttempts=[...receipts,attemptId].slice(-128);
        try{if(!arcadeSaveWritable())throw Error("Save unavailable");localStorage.setItem("longhaul-campaign-v1",JSON.stringify(save));saved=true}catch{}
      }
      const loss=$("#loss-screen .result-card");
      if(loss){
        let payout=$("#arcade-loss-payout");
        if(!payout){payout=document.createElement("div");payout.id="arcade-loss-payout";payout.className="score-grid";loss.insertBefore(payout,loss.querySelector(".panel-footer"))}
        payout.textContent="";
        for(const [label,value] of [["Distance",formatDistance(traveled)],["Driving bonuses","$"+arcadeBonuses],["Cash earned",alreadyPaid?"Already paid":saved?"$"+cash:"Save unavailable"],["Best run",formatDistance(save.bestArcadeDistance)]]){const cell=document.createElement("div");cell.className="score-cell";const a=document.createElement("span"),b=document.createElement("b");a.textContent=label;b.textContent=value;cell.append(a,b);payout.append(cell)}
      }
      $("#loss-retry-btn").textContent="RETRY HIGHWAY";
      $("#loss-new-btn").textContent="GARAGE · UPGRADE";
      $("#loss-title-btn").textContent="CAMPAIGN MAP";
    }
    function arcadeSettleRoadsideRun(){
      if(!arcadeRoadsideMode()||arcadeSettledRun===runKey)return;
      const run=readRun();if(run.status!=="completed"&&run.status!=="failed")return;
      arcadeSettledRun=runKey;
      const save=arcadeUpgradeState(),traveled=Math.max(0,run.distance||0),delivered=run.status==="completed";
      const contractMultiplier=course.contractId==="express"?1.5:course.contractId==="fragile"?1.25:1;
      const destination=course.depots.find(depot=>depot.id===course.validDepotId),branch=course.branches.find(item=>item.id===destination?.branchId),trunkDistance=course.edges.filter(edge=>edge.branchId==="trunk").reduce((sum,edge)=>sum+(Number(edge.length)||0),0),plannedDistance=trunkDistance+(Number(branch?.length)||0);
      const paidDistance=plannedDistance>0?plannedDistance:Number(course.scoring?.parDistance)||0;
      const deliveryPay=delivered?Math.round(Math.max(150,paidDistance*.16)*contractMultiplier):Math.max(50,Math.round(Math.min(traveled,paidDistance||traveled)*.07));
      const parTime=Number(run.result?.parTime),adjustedTime=Number(run.result?.adjustedTime);
      const timeBonus=delivered&&Number.isFinite(parTime)&&Number.isFinite(adjustedTime)?Math.round(Math.max(0,parTime-adjustedTime)*1.5):0;
      const cash=deliveryPay+timeBonus+arcadeBonuses;
      save.cash=(Number(save.cash)||0)+cash;save.attempts=(Number(save.attempts)||0)+1;
      save.bestArcadeDistance=Math.max(Number(save.bestArcadeDistance)||0,traveled);
      let saved=false;try{if(!arcadeSaveWritable())throw Error("Save unavailable");localStorage.setItem("longhaul-campaign-v1",JSON.stringify(save));arcadeCachedSave=save;saved=true}catch{}
      const host=delivered?$("#score-grid"):$("#loss-screen .result-card");if(!host)return;
      let cell=host.querySelector("#arcade-endless-payout");if(!cell){cell=document.createElement("div");cell.id="arcade-endless-payout";cell.className="score-cell major";const footer=host.querySelector(".panel-footer");if(footer)host.insertBefore(cell,footer);else host.append(cell)}
      cell.replaceChildren();const label=document.createElement("span"),amount=document.createElement("b");label.textContent=delivered?`Delivery $${deliveryPay} · time bonus $${timeBonus} · driving bonuses $${arcadeBonuses}`:`Run pay $${deliveryPay} · driving bonuses $${arcadeBonuses}`;amount.textContent=saved?`$${cash} · Garage balance $${save.cash.toLocaleString()}`:`$${cash} · Save unavailable`;cell.append(label,amount);
    }
    const arcadeOriginalPostTick=postTickGameplay;
    const arcadeGarageCatalog=[
      {id:"fuel",label:"EXTENDED TANK",description:"Adds 24% effective tank range per level",base:230,max:5},
      {id:"efficiency",label:"ECO TUNE",description:"Adds 19% effective fuel range per level",base:260,max:5},
      {id:"transmission",label:"GEARBOX",description:"Adds 1.7 m/s top speed and 0.28 m/s² acceleration per level",base:380,max:5},
      {id:"tires",label:"HIGHWAY TIRES",description:"Adds highway and road grip per level",base:260,max:5},
      {id:"suspension",label:"SUSPENSION",description:"Adds 0.07 m suspension travel per level",base:290,max:5},
      {id:"armor",label:"CRASH GUARD",description:"Reduces truck impact damage by 8% per level",base:300,max:5},
      {id:"boost",label:"NITRO SYSTEM",description:"Increases boost force and top speed per level",base:420,max:5},
      {id:"engine",label:"TURBO DIESEL",description:"Adds 2.8 m/s top speed and 0.7 m/s² acceleration per level",base:650,max:5},
      {id:"brakes",label:"ROAD BRAKES",description:"Adds 1.5 m/s² braking force per level",base:480,max:5},
      {id:"handling",label:"STABILITY KIT",description:"Increases steering response per level",base:550,max:5}
    ];
    const arcadeGaragePanel=document.createElement("div");arcadeGaragePanel.id="arcade-garage-panel";arcadeGaragePanel.setAttribute("aria-label","Roadside garage upgrades");arcadeGaragePanel.setAttribute("role","region");arcadeGaragePanel.tabIndex=-1;arcadeGaragePanel.hidden=true;document.getElementById("game-stage").append(arcadeGaragePanel);
    const arcadeGarageStyle=document.createElement("style");arcadeGarageStyle.textContent="#arcade-garage-panel{position:absolute;z-index:30;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,calc(100% - 28px));max-height:80%;overflow:auto;padding:18px;background:#101b20f2;border:1px solid #d7a85f;color:#f8f1df;box-shadow:0 14px 55px #000b;font:14px system-ui}#arcade-garage-panel h2{margin:0 0 5px;font-size:22px}#arcade-garage-panel p{margin:0 0 12px;color:#c5d0cc}#arcade-garage-panel .garage-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid #ffffff26}#arcade-garage-panel small{display:block;color:#bdc9c5}#arcade-garage-panel button{padding:8px 10px;border:1px solid #d3aa68;background:#27383c;color:#fff;cursor:pointer}#arcade-garage-panel button:disabled{opacity:.45;cursor:default}";document.head.append(arcadeGarageStyle);
    function arcadeGaragePosition(edge,distance,lane=0){const p=arcadeEdgePosition(edge,distance,lane);if(!p)return null;return{...p,y:terrainHeight(course,p.x,p.z)}}
    function arcadeLabelGarage(group,lane){const label=new THREE.Mesh(arcadeGarageSignGeometry,arcadeGarageSignMaterial);label.position.set(Math.sign(lane)*4.27,4.6,0);label.rotation.y=Math.sign(lane)*Math.PI/2;group.add(label)}
    function arcadeGarageSite(edge,fraction,preferredSide){
      const total=arcadeEdgeData(edge).total;
      for(const offset of [0,.12,-.12,.24,-.24])for(const side of [preferredSide,-preferredSide]){
        const progress=total*clamp(fraction+offset,.15,.85),lane=side*((Number(edge.width)||17)*.5+9),pos=arcadeGaragePosition(edge,progress,lane);
        if(!pos)continue;
        const blocked=(course.edges??[]).some(other=>{const nearest=arcadeNearestOnEdge(other,pos);return nearest&&nearest.distance<(Number(other.width)||17)*.5+5.5})||
          (course.depots??[]).some(depot=>Math.hypot(pos.x-depot.x,pos.z-depot.z)<depot.radius+12)||
          (course.roundabouts??[]).some(junction=>junction.center&&Math.hypot(pos.x-junction.center.x,pos.z-junction.center.z)<junction.radius+10);
        if(!blocked)return{progress,lane,pos};
      }
      return null;
    }
    function arcadeBuildGarages(){
      if(!arcadeRoadsideMode()||arcadeGarageCourse===course)return;
      arcadeGarageCourse=course;arcadeGarageStops=[];arcadeGarageRoot.clear();if(arcadeGarageRoot.parent!==dynamicRoot)dynamicRoot.add(arcadeGarageRoot);
      const eligibleEdges=(course.edges??[]).filter(edge=>edge.surface==="paved"&&edge.type!=="roundabout"&&!String(edge.type||"").includes("ramp")&&Number(edge.width||0)<=32);
      for(let index=0;index<eligibleEdges.length;index++){
        const edge=eligibleEdges[index],seed=hashText(`${course.seed}:roadside-garage:${edge.id}`);if(edge.id!=="trunk-edge-1"&&seed%6!==0)continue;
        const data=arcadeEdgeData(edge);if(data.total<100)continue;
        const site=arcadeGarageSite(edge,.24+((seed>>>8)%520)/1000,(seed>>>19)&1?1:-1);if(!site)continue;const {progress,lane,pos}=site;
        const group=new THREE.Group(),{paint,roof,sign,dark}=arcadeGarageMaterials;
        const add=(mat,w,h,d,x,y,z)=>{const mesh=new THREE.Mesh(arcadeTrafficGeometry,mat);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);group.add(mesh)};
        add(paint,8,3.6,6,0,2,0);add(roof,8.5,.45,6.5,0,4,0);add(dark,2.4,2.5,.2,-2,1.45,3.08);add(dark,2.4,2.5,.2,2,1.45,3.08);add(sign,4.8,.7,.2,0,4.9,3.25);
        arcadeLabelGarage(group,lane);group.position.set(pos.x,pos.y,pos.z);group.rotation.y=pos.heading;group.visible=false;arcadeGarageRoot.add(group);arcadeGarageStops.push({id:`roadside-garage:${edge.id}`,edge,progress,lane,x:pos.x,z:pos.z,group});
      }
      if(!arcadeGarageStops.length){
        const edges=eligibleEdges,start=hashText(`${course.seed}:roadside-garage:fallback`)%Math.max(1,edges.length);
        for(let step=0;step<edges.length&&!arcadeGarageStops.length;step++){
          const edge=edges[(start+step)%edges.length],data=arcadeEdgeData(edge);if(data.total<100)continue;
          const site=arcadeGarageSite(edge,.5,1);if(!site)continue;const {progress,lane,pos}=site;
          const group=new THREE.Group(),{paint,roof,sign,dark}=arcadeGarageMaterials;
          const add=(mat,w,h,d,x,y,z)=>{const mesh=new THREE.Mesh(arcadeTrafficGeometry,mat);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);group.add(mesh)};
          add(paint,8,3.6,6,0,2,0);add(roof,8.5,.45,6.5,0,4,0);add(dark,2.4,2.5,.2,-2,1.45,3.08);add(dark,2.4,2.5,.2,2,1.45,3.08);add(sign,4.8,.7,.2,0,4.9,3.25);
          arcadeLabelGarage(group,lane);group.position.set(pos.x,pos.y,pos.z);group.rotation.y=pos.heading;group.visible=false;arcadeGarageRoot.add(group);arcadeGarageStops.push({id:`roadside-garage:${edge.id}`,edge,progress,lane,x:pos.x,z:pos.z,group});
        }
      }
    }
    function arcadeNearestGarage(position){let nearest=null;for(const stop of arcadeGarageStops){const distance=Math.hypot(position.x-stop.x,position.z-stop.z);if(distance<18&&(!nearest||distance<nearest.distance))nearest={stop,distance}}return nearest}
    let arcadeLastGarageCull=-Infinity;
    function arcadeCullGarages(now){if(now-arcadeLastGarageCull<250)return;arcadeLastGarageCull=now;const position=readTruck().position;for(const stop of arcadeGarageStops){const dx=stop.x-position.x,dz=stop.z-position.z;stop.group.visible=dx*dx+dz*dz<650*650}}
    function arcadeShowGarage(focusItem=null){
      const wasHidden=arcadeGaragePanel.hidden,restoreFocus=wasHidden||arcadeGaragePanel.contains(document.activeElement),scrollTop=arcadeGaragePanel.scrollTop;
      if(wasHidden){for(const key of Object.keys(keys))keys[key]=false;pressed.clear();forwardBoost.reset()}
      const save=arcadeUpgradeState(),upgrades=save.upgrades||{},cash=Number(save.cash)||0,saveAvailable=arcadeSaveWritable();
      arcadeGaragePanel.innerHTML="";const title=document.createElement("h2");title.textContent="ROADSIDE GARAGE";const summary=document.createElement("p");summary.textContent=saveAvailable?`Available cash $${cash.toLocaleString()} · The delivery clock keeps running while you shop.`:"Save unavailable · Upgrades cannot be purchased. The delivery clock keeps running.";arcadeGaragePanel.append(title,summary);
      for(const item of arcadeGarageCatalog){const level=Math.max(0,Number(upgrades[item.id])||0),cost=Math.round(item.base*Math.pow(1.65,level)),row=document.createElement("div");row.className="garage-row";const info=document.createElement("div"),name=document.createElement("b"),description=document.createElement("small"),button=document.createElement("button");name.textContent=`${item.label} · LEVEL ${level}/${item.max}`;description.textContent=item.description;info.append(name,description);button.dataset.upgrade=item.id;button.textContent=level>=item.max?"MAX":`UPGRADE $${cost}`;button.disabled=!saveAvailable||level>=item.max||cash<cost;button.addEventListener("click",()=>{const latest=arcadeUpgradeState(),nextCash=Number(latest.cash)||0,nextLevel=Number(latest.upgrades?.[item.id])||0;if(nextLevel!==level||nextCash<cost){arcadeShowGarage(item.id);return}if(nextLevel>=item.max)return;latest.cash=nextCash-cost;latest.upgrades={...(latest.upgrades||{}),[item.id]:nextLevel+1};try{if(!arcadeSaveWritable())throw Error("Save unavailable");localStorage.setItem("longhaul-campaign-v1",JSON.stringify(latest));arcadeCachedSave=latest;arcadeConfiguredRun="";arcadeApplyUpgrades();arcadeShowGarage(item.id)}catch{toast("Garage save unavailable","bad",1600)}});row.append(info,button);arcadeGaragePanel.append(row)}
      const close=document.createElement("button");close.textContent="CLOSE · E TO DRIVE";close.addEventListener("click",()=>{arcadeGaragePanel.hidden=true});arcadeGaragePanel.append(close);arcadeGaragePanel.hidden=false;arcadeGaragePanel.scrollTop=scrollTop;if(restoreFocus){const target=focusItem?arcadeGaragePanel.querySelector(`button[data-upgrade="${focusItem}"]:not(:disabled)`):arcadeGaragePanel;(target||close).focus({preventScroll:true})}
    }
    const arcadeOriginalInteractionPrompt=interactionPrompt;
    interactionPrompt=function(){const base=arcadeOriginalInteractionPrompt();if(!arcadeRoadsideMode()||currentScene()!=="driving")return base;const state=readTruck(),run=readRun(),garage=arcadeNearestGarage(state.position),depot=nearestDepot(course,state.position);if(!garage||depot&&depot.distance<=depot.depot.radius+6||!run.recoveryUsed&&(state.tipped||(meters.get("fuel")?.value??0)<=.01||run.stuckSeconds>2.8))return base;return Math.abs(state.speed)>1.1?"Brake to a full stop at the garage":arcadeGaragePanel.hidden?"E · Open roadside garage":"E · Close roadside garage"};
    const arcadeOriginalHandleInteraction=handleInteraction;
    handleInteraction=function(state,run,condition,surface){if(arcadeRoadsideMode()){const garage=arcadeNearestGarage(state.position),depot=nearestDepot(course,state.position),atDepot=depot&&depot.distance<=depot.depot.radius+6,needsRecovery=!run.recoveryUsed&&(state.tipped||condition.fuel<=.01||run.stuckSeconds>2.8);if(garage&&!atDepot&&!needsRecovery){if(Math.abs(state.speed)>1.1){toast("Stop at the garage to upgrade","bad",1500);return}if(arcadeGaragePanel.hidden)arcadeShowGarage();else arcadeGaragePanel.hidden=true;audio.click();return}}arcadeOriginalHandleInteraction(state,run,condition,surface)};
    postTickGameplay=function(surface,dt){
      if(course){arcadeApplyUpgrades();const delivery=readDelivery(),deliveryCheckPending=delivery.lastCheck&&delivery.lastCheck.sequence!==lastDeliverySequence,run=readRun();if(run.status==="running"&&!deliveryCheckPending&&(course.geography||(meters.get("remaining-time")?.value??1)>0))arcadeTrafficUpdate(dt);else arcadeTrafficRoot.visible=false;arcadeBuildGarages()}
      if(!arcadeGaragePanel.hidden&&Math.abs(readTruck().speed)>1.1)arcadeGaragePanel.hidden=true;
      arcadeOriginalPostTick(surface);
      arcadeSettleFailedRun();
      arcadeSettleRoadsideRun();
    };

    // Visual-first arcade display and procedural title vehicle.
    const arcadeOverlay=document.createElement("div");arcadeOverlay.id="arcade-overlay";arcadeOverlay.innerHTML='<div class="arcade-stat">⛽ <b id="arcade-fuel">100%</b></div><div class="arcade-stat">⚡ <b id="arcade-boost">W ×2 / ↑ ×2</b></div><div class="arcade-stat">↗ <b id="arcade-distance">0 mi</b></div><div class="arcade-stat">＄ <b id="arcade-earnings">$0</b></div><div id="arcade-flash" aria-live="polite"></div>';document.getElementById("game-stage").append(arcadeOverlay);
    function arcadeFlashBonus(message){const el=document.getElementById("arcade-flash");el.textContent=message;el.classList.remove("active");void el.offsetWidth;el.classList.add("active")}
    const arcadeMenuTruck=new THREE.Group(),arcadeMenuPaint=new THREE.MeshLambertMaterial({color:0xe1a14e});
    function arcadeMenuBox(mat,w,h,d,x,y,z){const part=new THREE.Mesh(arcadeTrafficGeometry,mat);part.scale.set(w,h,d);part.position.set(x,y,z);arcadeMenuTruck.add(part)}
    arcadeMenuBox(arcadeMenuPaint,2.9,2.5,3.3,0,2.2,1.4);
    arcadeMenuBox(arcadeTrafficMaterials[0],3,3.1,5.5,0,2.8,-2.8);
    arcadeMenuBox(arcadeGlassMat,2.6,1,.12,0,3.03,3.1);
    for(const side of [-1,1])for(const z of [-4.2,2.15]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.88,.88,.55,12),arcadeWheelMat);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.72,1,z);arcadeMenuTruck.add(wheel)}
    scene.add(arcadeMenuTruck);arcadeMenuTruck.position.set(4,0,0);
    let arcadeLastHud=0;
    function arcadeVisualFrame(now){
      const view=currentScene(),title=view==="title"&&!campaignLaunch?.course;
      if(view!=="driving")arcadeGaragePanel.hidden=true;else if(arcadeRoadsideMode())arcadeCullGarages(now);
      arcadeMenuTruck.visible=title;
      if(title){arcadeMenuTruck.rotation.y=-.5+Math.sin(now*.00031)*.22;arcadeMenuTruck.position.y=Math.sin(now*.0011)*.09;camera.position.set(11,6,17);camera.lookAt(2,2,-1)}
      const playing=view==="driving"&&arcadeCampaign();arcadeOverlay.classList.toggle("active",playing);
      if(playing&&now-arcadeLastHud>=66){arcadeLastHud=now;const run=readRun(),fuel=meters.get("fuel")?.value??0,intent=engine.n.coreInput.getIntent(),distance=run.distance||0;
        document.getElementById("arcade-fuel").textContent=Math.ceil(fuel)+"%";
        document.getElementById("arcade-boost").textContent=forwardBoost.remaining>0?`${forwardBoost.remaining.toFixed(1)}s`:intent.boost?"ACTIVE":"W ×2 / ↑ ×2";
        document.getElementById("arcade-distance").textContent=(distance/1609.344).toFixed(2)+" mi";
        document.getElementById("arcade-earnings").textContent="$"+(Math.max(75,Math.round(distance*.11))+arcadeBonuses)}
    }
