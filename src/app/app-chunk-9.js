    // One preallocated camera-space line batch, no extra scene render or blur pass.
    const boostStreakCount=96,boostPositions=new Float32Array(boostStreakCount*6),boostDepths=new Float32Array(boostStreakCount);
    for(let i=0;i<boostStreakCount;i++)boostDepths[i]=3+(i*.61803398875%1)*52;
    const boostGeometry=new THREE.BufferGeometry();boostGeometry.setAttribute("position",new THREE.BufferAttribute(boostPositions,3).setUsage(THREE.DynamicDrawUsage));
    const boostMaterial=new THREE.LineBasicMaterial({color:0xffe4ad,transparent:true,opacity:0,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending});
    const boostStreaks=new THREE.LineSegments(boostGeometry,boostMaterial);boostStreaks.frustumCulled=false;boostStreaks.renderOrder=1000;boostStreaks.visible=false;camera.add(boostStreaks);scene.add(camera);
    const boostFocus=document.createElement("div");boostFocus.id="boost-focus";boostFocus.setAttribute("aria-hidden","true");document.getElementById("game-stage").append(boostFocus);
    const boostReadout=document.createElement("div");boostReadout.id="boost-readout";document.getElementById("game-stage").append(boostReadout);
    let boostVisualStrength=0,boostReadoutText="";
    function updateBoostVisuals(dt){
      const driving=currentScene()==="driving",active=driving&&forwardBoost.remaining>0,target=active&&settings.motion?1:0;
      boostVisualStrength=driving?lerp(boostVisualStrength,target,1-Math.exp(-dt*(target?9:6))):0;
      if(!settings.motion)boostVisualStrength=0;
      boostStreaks.visible=boostVisualStrength>.01;boostMaterial.opacity=boostVisualStrength*.65;
      boostFocus.style.opacity=String(boostVisualStrength*.7);
      boostReadout.classList.toggle("active",active);const label=`BOOST · ${forwardBoost.remaining.toFixed(1)}s`;
      if(label!==boostReadoutText){boostReadout.textContent=label;boostReadoutText=label}
      if(!boostStreaks.visible)return;
      const count=settings.quality?boostStreakCount:48;boostGeometry.setDrawRange(0,count*2);
      for(let i=0;i<count;i++){
        boostDepths[i]-=dt*65;if(boostDepths[i]<3)boostDepths[i]+=52;
        const depth=boostDepths[i],angle=i*2.39996323,radius=5+(i*.754877666%1)*25,x=Math.cos(angle)*radius,y=Math.sin(angle)*radius*.6,tail=depth+4+boostVisualStrength*4;
        const j=i*6;boostPositions[j]=x;boostPositions[j+1]=y;boostPositions[j+2]=-depth;
        boostPositions[j+3]=x;boostPositions[j+4]=y;boostPositions[j+5]=-tail;
      }
      boostGeometry.attributes.position.needsUpdate=true;
    }
    // A fixed world-space spark pool follows the visual scrape point, not the controller.
    const scrapeCount=72,scrapePositions=new Float32Array(scrapeCount*6),scrapeColors=new Float32Array(scrapeCount*6),scrapeLife=new Float32Array(scrapeCount),scrapeXYZ=new Float32Array(scrapeCount*3),scrapeVelocity=new Float32Array(scrapeCount*3),scrapeFloor=new Float32Array(scrapeCount);
    const scrapeGeometry=new THREE.BufferGeometry();scrapeGeometry.setAttribute("position",new THREE.BufferAttribute(scrapePositions,3).setUsage(THREE.DynamicDrawUsage));scrapeGeometry.setAttribute("color",new THREE.BufferAttribute(scrapeColors,3).setUsage(THREE.DynamicDrawUsage));
    const scrapeMaterial=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});
    const scrapeSparks=new THREE.LineSegments(scrapeGeometry,scrapeMaterial);scrapeSparks.frustumCulled=false;scrapeSparks.visible=false;scene.add(scrapeSparks);
    let scrapeCursor=0,scrapeBudget=0,scraping=false;
    function resetScrapeSparks(){scrapeLife.fill(0);scrapePositions.fill(0);scrapeColors.fill(0);scrapeSparks.visible=false;scrapeCursor=0;scrapeBudget=0;scraping=false}
    function updateScrapeSparks(dt,state,rig){
      const speed=Math.abs(state.speed),lean=Math.abs(rig.leanPivot.rotation.z),limit=settings.quality?scrapeCount:36;
      scraping=state.grounded&&speed>8&&lean>.25&&rig.grounding.lift>.025;
      scrapeBudget=scraping?Math.min(8,scrapeBudget+dt*(45+Math.min(speed,60))):0;
      while(scrapeBudget>=1){scrapeBudget--;const i=scrapeCursor++%limit,j=i*3,point=rig.grounding.contact,side=-Math.sign(rig.leanPivot.rotation.z),rightX=Math.cos(state.heading)*side,rightZ=-Math.sin(state.heading)*side,back=8+Math.random()*9;
        scrapeLife[i]=.22+Math.random()*.28;scrapeXYZ[j]=point.x;scrapeXYZ[j+1]=point.y+.06;scrapeXYZ[j+2]=point.z;scrapeFloor[i]=point.y;
        scrapeVelocity[j]=state.velocity.x*.22-Math.sin(state.heading)*back+rightX*(1+Math.random()*3);scrapeVelocity[j+1]=1+Math.random()*3;scrapeVelocity[j+2]=state.velocity.z*.22-Math.cos(state.heading)*back+rightZ*(1+Math.random()*3);
      }
      let alive=0;
      for(let i=0;i<scrapeCount;i++){const j=i*3,k=i*6;if(scrapeLife[i]<=0){scrapeColors.fill(0,k,k+6);continue}scrapeLife[i]-=dt;if(scrapeLife[i]<=0){scrapeColors.fill(0,k,k+6);continue}alive++;
        scrapeVelocity[j+1]-=9.8*dt;for(let axis=0;axis<3;axis++)scrapeXYZ[j+axis]+=scrapeVelocity[j+axis]*dt;
        if(scrapeXYZ[j+1]<scrapeFloor[i]){scrapeXYZ[j+1]=scrapeFloor[i];scrapeVelocity[j+1]=Math.abs(scrapeVelocity[j+1])*.25}
        const fade=Math.min(1,scrapeLife[i]*4);
        for(let axis=0;axis<3;axis++){scrapePositions[k+axis]=scrapeXYZ[j+axis];scrapePositions[k+3+axis]=scrapeXYZ[j+axis]-scrapeVelocity[j+axis]*.035}
        scrapeColors[k]=fade;scrapeColors[k+1]=fade*.66;scrapeColors[k+2]=fade*.16;scrapeColors[k+3]=fade*.7;scrapeColors[k+4]=fade*.16;scrapeColors[k+5]=0;
      }
      scrapeSparks.visible=alive>0;if(alive){scrapeGeometry.attributes.position.needsUpdate=true;scrapeGeometry.attributes.color.needsUpdate=true}
    }
    const truckSurfaceEntries=[];
    function truckRenderedGroundHeight(x,z){
      const cell=cellHosts.get(`${WORLD_ID}:uniform-grid:0:${Math.floor(x/CELL_SIZE)}:${Math.floor(z/CELL_SIZE)}`);
      // Grid keys are resolved from cached active entries, avoiding world snapshot APIs.
      const patch=(cell??truckSurfaceEntries.find(e=>x>=e.patch.bounds.minX&&x<e.patch.bounds.maxX&&z>=e.patch.bounds.minZ&&z<e.patch.bounds.maxZ))?.patch;
      let height;
      if(patch){const data=patch.terrain,n=data.segments,gx=clamp((x-patch.bounds.minX)/CELL_SIZE*n,0,n-1e-8),gz=clamp((z-patch.bounds.minZ)/CELL_SIZE*n,0,n-1e-8),ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,a=iz*(n+1)+ix,h=data.heights,h00=h[a],h10=h[a+1],h01=h[a+n+1],h11=h[a+n+2];height=u+v<=1?h00+(h10-h00)*u+(h01-h00)*v:h11+(h01-h11)*(1-u)+(h10-h11)*(1-v)}else height=terrainHeight(course,x,z);
      for(const entry of truckSurfaceEntries)height=sampleDriveSurface(entry.group.userData.driveSurface??[],x,z,height);
      return height;
    }
    function updateTruckVisual(dt){
      if(!truckRig)return;const state=readTruck(),rig=truckRig,travel=readDynamics().suspension?.travel??.92;
      // Upright steering root follows the spherical ground support, never body roll.
      rig.root.position.set(state.position.x,Math.max(state.position.y-travel+.02,terrainHeight(course,state.position.x,state.position.z)+.02),state.position.z);
      rig.root.rotation.set(0,state.heading,0);
      const normal=state.groundNormal??{x:0,y:1,z:0},s=Math.sin(state.heading),c=Math.cos(state.heading),forwardSlope=normal.x*s+normal.z*c,rightSlope=normal.x*c-normal.z*s;
      const pitch=Math.atan2(forwardSlope,Math.max(.25,normal.y)),slopeRoll=-Math.atan2(rightSlope,Math.max(.25,normal.y));
      const lean=state.tipped?state.rollAngle:clamp(state.bodyRoll,-.36,.36);
      rig.leanPivot.rotation.set(lerp(rig.leanPivot.rotation.x,clamp(state.bodyPitch+pitch,-.5,.5),1-Math.exp(-8*dt)),0,lerp(rig.leanPivot.rotation.z,lean+slopeRoll,1-Math.exp(-8*dt)));
      rig.leanPivot.position.y=1.5-clamp(state.suspensionCompression??0,-1,1)*.12;
      truckSurfaceEntries.length=0;const cx=Math.floor(state.position.x/CELL_SIZE),cz=Math.floor(state.position.z/CELL_SIZE);for(let z=cz-1;z<=cz+1;z++)for(let x=cx-1;x<=cx+1;x++){const entry=cellHosts.get(`${WORLD_ID}:uniform-grid:0:${x}:${z}`);if(entry)truckSurfaceEntries.push(entry)}
      rig.grounding.resolve(rig.root,rig.leanPivot,truckRenderedGroundHeight);
      for(const wheel of rig.wheels)wheel.rotation.x=state.wheelTravel/.82;
      for(const pivot of rig.steering)pivot.rotation.y=state.steeringAngle;
      const cargo=meters.get("cargo-condition")?.value??100;for(let i=0;i<rig.crates.length;i++)rig.crates[i].rotation.z=Math.sin(performance.now()*.002+i)*(100-cargo)*.00035;
      updateScrapeSparks(dt,state,rig);
      sky.position.set(state.position.x,0,state.position.z);cloudRoot.position.set(state.position.x,0,state.position.z);sun.position.set(state.position.x-150,230,state.position.z-110);sun.target.position.set(state.position.x,0,state.position.z);sun.target.updateMatrixWorld();
    }
    const wildlifeHazardsById=new Map();function updateWildlifeVisual(){if(!wildlifeRig)return;const hazards=readWildlife().hazards,hazardById=wildlifeHazardsById;hazardById.clear();for(const hazard of hazards)hazardById.set(hazard.id,hazard);for(const animal of wildlifeRig.animals){const hazard=hazardById.get(animal.userData.id);if(!hazard){animal.visible=false;continue}animal.visible=true;animal.position.set(hazard.x,terrainHeight(course,hazard.x,hazard.z),hazard.z);const dx=(hazard.end.x-hazard.start.x)*(hazard.direction||1),dz=(hazard.end.z-hazard.start.z)*(hazard.direction||1);animal.rotation.y=Math.atan2(dx,dz);const stride=performance.now()*.004+animal.userData.phase;animal.userData.legs.forEach((leg,index)=>leg.rotation.x=Math.sin(stride+(index%2?Math.PI:0))*.48);animal.position.y+=Math.abs(Math.sin(stride))*.06}}
    function applyCamera(){const descriptor=smoothing.getDescriptor("player-camera");camera.position.fromArray(descriptor.position);camera.quaternion.fromArray(descriptor.quaternion);const fov=descriptor.fov+boostVisualStrength*14;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix()}}

    function interactionPrompt(){const state=readTruck(),run=readRun(),condition={fuel:meters.get("fuel")?.value??0};const surface=surfaceAt(state.position);if((condition.fuel<=0||run.stuckSeconds>2.8||(surface.surface==="off-road"&&Math.abs(state.speed)<.8))&&!run.recoveryUsed)return"E · Call roadside recovery";const nearest=nearestDepot(course,state.position);if(nearest&&nearest.distance<=nearest.depot.radius+8)return Math.abs(state.speed)>1.1?"Brake to a full stop":`E · Check ${nearest.depot.name}`;return""}
    function setMeter(element,value,warning=30){const safe=clamp(value,0,100);element.style.width=`${safe}%`;element.style.background=safe<warning?"var(--red)":safe<55?"var(--amber)":"var(--green)"}
    function updateHud(surface){if(!course)return;const state=readTruck(),run=readRun(),delivery=readDelivery();const fuel=meters.get("fuel")?.value??0,truck=meters.get("truck-condition")?.value??0,cargo=meters.get("cargo-condition")?.value??0,time=meters.get("remaining-time")?.value??0;$("#timer").textContent=formatTime(time);$("#map-time").textContent=formatTime(time);$("#speed").textContent=String(Math.round(Math.abs(state.speed)*2.237));$("#road-name").textContent=surface?.road?.edge.branchName??(surface?.surface==="shoulder"?"Road shoulder":surface?.surface==="off-road"?"Off road":"Freight Road");$("#fuel-num").textContent=`${Math.ceil(fuel)}%`;$("#truck-num").textContent=`${Math.floor(100-truck)}% damage`;$("#cargo-num").textContent=`${Math.ceil(cargo)}%`;setMeter($("#fuel-meter"),fuel,22);setMeter($("#truck-meter"),truck,35);setMeter($("#cargo-meter"),cargo,40);$("#destination-name").textContent=course.depots.find(depot=>depot.id===delivery.validDepotId)?.name??"Receiving yard";$("#checked-num").textContent=`${delivery.checkedDepotIds.length} / ${course.depots.length}`;$("#penalty-num").textContent=`+${Math.round(run.penaltyTotal)}s`;$("#recovery-num").textContent=run.recoveryUsed?"Used":"Ready";document.body.classList.toggle("final-minute",time<=60&&run.status==="running");const prompt=interactionPrompt(),interact=$("#interact");interact.textContent=prompt;interact.classList.toggle("show",Boolean(prompt))}
    function updateMapPanel(){cachedMapBounds=null;const panel=$("#map-panel");panel.classList.toggle("open",mapOpen);panel.setAttribute("aria-hidden",String(!mapOpen))}
