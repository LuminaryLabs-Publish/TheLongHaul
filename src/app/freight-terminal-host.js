/* Freight hub overlay. NexusEngine's existing course, World cells, and Truck
 * Kit remain authoritative. The GLB is visual art; the connected Road edge
 * is the only paved driving surface. No duplicate highway/physics meshes. */
(() => {
  const assetUrl=new URL('../../assets/freight-terminal/terminal-yard.glb',document.currentScript.src);
  let art=null,activeCourse=null,obstacles=[],lastError=null,loaded=false;
  let trafficElapsed=0,trafficFactory=null,trafficVehicles=[],trafficProxies=[];
  const status=window.LongHaulFreightTerminal={ready:false,readyPromise:null,
    getState:()=>({ready:loaded,visible:!!art?.visible,assetUrl:assetUrl.href,
      site:activeCourse?.freightTerminal?.id??null,obstacles:obstacles.length,
      movingTrucks:trafficVehicles.filter(v=>v.root.visible).length,traffic:trafficVehicles.map(v=>({id:v.id,visible:v.root.visible,position:v.root.position.toArray()})),
      elapsed:trafficElapsed,error:lastError})};
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
    if(!isReady){if(art)art.visible=false;activeCourse=null;obstacles=[];trafficProxies=[];return;}
    const site=course.freightTerminal;
    if(activeCourse!==course || art?.userData.site!==site){
      activeCourse=course;trafficElapsed=0;trafficProxies=[];
      obstacles=terminalObstacleVolumes(site);
      if(art){art.position.set(site.x,site.y,site.z);art.rotation.y=site.yaw;art.userData.site=site;}
    }
    const p=readTruck().position;
    if(art)art.visible=Math.hypot(p.x-course.origin.x,p.z-course.origin.z)<1100;
  }
  // Traffic is added to the existing obstacle query, not stamped into static
  // world cells. Moving proxies follow the animated trucks and disappear
  // immediately when the yard is inactive; static objects keep cell ownership.
  const previousCandidates=typeof obstacleCandidates==='function'?obstacleCandidates:()=>[];
  obstacleCandidates=function(position,radius=45){
    const found=previousCandidates(position,radius);
    if(activeCourse?.freightTerminal&&art?.visible){
      for(const item of trafficProxies)if(Math.abs(item.x-position.x)<radius+4 &&
        Math.abs(item.z-position.z)<radius+4)found.push(item);
    }
    return found;
  };
  function buildParkingApron(){
    const apron=new THREE.Mesh(new THREE.BoxGeometry(81,.14,101),
      new THREE.MeshStandardMaterial({color:0x41484e,roughness:.91}));
    apron.name='TLH_FREIGHT_PLAYER_PARKING_APRON';apron.position.set(8.5,.055,-157);
    apron.receiveShadow=true;art.add(apron);
    const paint=new THREE.MeshBasicMaterial({color:0xe9e0c4,depthWrite:false});
    const bar=(x,z,w,d)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.025,d),paint);
      m.position.set(x,.16,z);art.add(m);return m;};
    // Actual player parking spot at x=0, z=-132 with an aisle to the ramp.
    for(const x of [-20,-10,0,10,20]){
      bar(x-4.2,-130,.16,22);bar(x+4.2,-130,.16,22);
      bar(x,-119.2,8.5,.17);
    }
    for(const z of [-161,-175,-189])bar(27,z,7,.17);
  }
  function buildMovingTruck(index){
    const authored=trafficFactory.createVehicle('box');
    const root=new THREE.Group();root.name=`TLH_FREIGHT_LIVE_TRUCK_${index}`;
    // Match the authored fleet's materials and silhouette, then attach a
    // freight trailer. This is scene art; the moving collision proxy is separate.
    root.add(authored.root);
    const trailer=new THREE.Mesh(new THREE.BoxGeometry(2.9,3.55,10.5),
      new THREE.MeshToonMaterial({color:[0xe7ded0,0x23778c,0xc97446][index],
        gradientMap:materials.truckRed.gradientMap}));
    trailer.name='TLH_AUTHORED_FREIGHT_TRAILER';trailer.position.set(0,2.65,-9.1);
    trailer.castShadow=true;trailer.receiveShadow=true;root.add(trailer);
    const wheels=new THREE.CylinderGeometry(.68,.68,.38,12),rubber=new THREE.MeshStandardMaterial({color:0x202932,roughness:1});
    for(const z of [-12.7,-10.5])for(const x of [-1.45,1.45]){
      const m=new THREE.Mesh(wheels,rubber);m.position.set(x,.72,z);m.rotation.z=Math.PI/2;root.add(m);
    }
    root.visible=false;art.add(root);
    return {id:index,root,authored};
  }
  function updateFreightTraffic(dt){
    if(!art?.visible||!activeCourse?.freightTerminal||(typeof simulationFrozen==='function'&&simulationFrozen())){
      trafficProxies=[];for(const v of trafficVehicles)v.root.visible=false;return;
    }
    trafficElapsed+=Math.max(0,Math.min(dt,.1));
    const actors=evaluateFreightTerminalTraffic(trafficElapsed);
    const byId=new Map(actors.map(a=>[a.id,a]));
    const ids=['outbound-staging','inbound-loading','outbound-loading'];
    for(let i=0;i<trafficVehicles.length;i++){
      const vehicle=trafficVehicles[i],data=byId.get(ids[i]);
      vehicle.root.visible=!!data;
      if(!data)continue;
      vehicle.root.position.set(data.x,.2,data.z);
      vehicle.root.rotation.y=data.heading;
      vehicle.authored.spin(dt,data.speed);
      vehicle.authored.setDistance(Math.hypot(data.x, data.z+132));
    }
    trafficProxies=terminalTrafficCollisionProxies(activeCourse.freightTerminal,actors);
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
  preTickDriving=function(dt){reconcileSite();updateFreightTraffic(dt);return previousPreTick(dt);};
  const previousIdle=preTickIdle;
  preTickIdle=function(){reconcileSite();return previousIdle();};
  status.readyPromise=(async()=>{
    try{
      const response=await fetch(assetUrl.href,{cache:'force-cache'});
      if(!response.ok)throw Error(`Freight terminal asset HTTP ${response.status}`);
      const parsed=parseFreightTerminalGlb(await response.arrayBuffer());
      art=createFreightTerminalThreeObject(THREE,parsed);
      art.visible=false;art.userData.triangles=parsed.triangles;
      buildParkingApron();
      // Use exactly one authored source factory shared across this bounded fleet.
      try{
        trafficFactory=createTrafficVehicleFactory({THREE,materials});
        trafficVehicles=[0,1,2].map(buildMovingTruck);
      }catch(error){console.warn('Terminal moving fleet unavailable; static yard retained',error);trafficVehicles=[];}
      worldRoot.add(art);loaded=true;status.ready=true;
      return true;
    }catch(e){lastError=String(e);console.warn('Freight terminal asset unavailable; legacy road start retained',e);return false;}
  })();
})();
