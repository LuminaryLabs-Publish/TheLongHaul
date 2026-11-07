/* Product presentation, loaded after the established game and road hosts.
 * No scoring, timing, road coordinates, controls or save authority lives here. */
(() => {
  'use strict';
  const { ATMOSPHERE_PROFILE: profile, cloudBankDescriptors, wrapCloudOffset, atmosphericRollOff,
    landscapeTint, freightHudModel } = LongHaulArt;
  const stage = document.querySelector('#game-stage');
  document.body.classList.add('visual-refresh');
  const make = (tag, id, label) => { const node = document.createElement(tag); node.id = id; if (label) node.setAttribute('aria-label', label); return node; };

  // Four stable groups; original controls and event listeners are retained.
  const objective = make('div', 'journey-objective', 'Current freight objective');
  objective.setAttribute('role', 'region');
  objective.append(freightHud, $('#run-box'), $('#timer-box'));
  riskHud.append($('#arcade-flash'));
  stage.append(objective);
  const cargoRow = $('#cargo-meter').closest('.meter-row');
  cargoRow.id = 'objective-cargo-meter'; freightHud.append(cargoRow);
  $('#drive-box').append($('#condition-box'));
  $('#truck-num').previousElementSibling.textContent = 'Condition';
  const driveMeta = make('div', 'drive-meta');
  for (const id of ['arcade-boost', 'arcade-distance']) driveMeta.append($('#' + id).parentElement);
  $('#drive-box').append(driveMeta);
  // Notifications retain one live region, not two copies of the same reward.
  const receipt = make('div', 'journey-receipt'); receipt.setAttribute('role', 'status');
  receipt.setAttribute('aria-live', 'polite'); receipt.hidden = true; objective.prepend(receipt);
  const session = make('span', 'journey-session'); $('#drive-box').append(session);
  $('#skill-hud').append($('#skill-open'));
  $('#skill-hud').setAttribute('aria-label', 'Abilities and progression');
  const help = make('div', 'driving-onboarding');
  help.textContent = 'WASD drive  ·  SPACE boost  ·  S + turn drift  ·  M map'; stage.append(help);
  let receiptKey = '', receiptUntil = 0;

  const baseHud = updateHud;
  updateHud = function(surface) {
    baseHud(surface);
    const playing = currentScene() === 'driving' && !launchIntro.active;
    objective.hidden = !playing; help.hidden = !playing || readRun().rawTime > 12;
    if (!playing || !course) return;
    const truckCondition = meters.get('truck-condition')?.value ?? 0;
    $('#truck-num').textContent = `${Math.round(truckCondition)}%`;
    $('#condition-box').classList.toggle('critical', truckCondition < 30 || (meters.get('fuel')?.value ?? 0) < 15);
    const run = readRun(); session.textContent = `${formatTime(run.rawTime)} ON THE ROAD`;
    if (!isContinuousFreight()) { receipt.hidden = true; return; }
    const f = freightState, model = freightHudModel(f, readTruck().position, meters.get('cargo-condition')?.value ?? 0, run.rawTime);
    $('#freight-state').textContent = model.status;
    $('#freight-cargo').textContent = model.transition ? (f.status === 'delivered' ? 'Next haul ahead' : 'Keep the journey going') : getCargoProfile(f.contract.profileId).label;
    $('#freight-next').textContent = model.next;
    $('#freight-mass').textContent = model.mass;
    $('#freight-advice').textContent = model.transition ? '' : f.onboard ? getCargoProfile(f.contract.profileId).handlingHint : 'Wide left: safe  /  Express right: bonus';
    $('#freight-pay').textContent = `${f.completed} DELIVERED`;
    cargoRow.hidden = !f.onboard;
    $('#timer-box').hidden = !f.onboard; // elapsed time belongs to the driving cluster
    $('#timer-box').classList.toggle('urgent', model.urgent);
    objective.classList.toggle('urgent', model.urgent);
    const key = f.lastOutcome ? `${f.lastOutcome.id ?? f.contract.id}:${f.completed}:${f.lost}` : '';
    if (model.transition && key !== receiptKey) {
      receiptKey = key; receiptUntil = run.rawTime + 3;
      receipt.textContent = f.status === 'delivered' ? `DELIVERED  +$${f.lastOutcome?.cash ?? 0}` : 'LOAD LOST · REPLACEMENT AHEAD';
      receipt.classList.toggle('loss', f.status !== 'delivered');
    }
    receipt.hidden = run.rawTime >= receiptUntil || !receiptKey;
  };
  const baseRiskHud = updateRiskHud;
  updateRiskHud = function() {
    baseRiskHud();
    const state = arcadeScore.snapshot(); riskHud.classList.toggle('idle', state.pending <= 0);
    $('#risk-bank').textContent = `${state.banked.toLocaleString()} BANKED`;
    // Repeated ambient flavor is not an actionable warning.
    encounterHud.hidden = currentScene() !== 'driving' || launchIntro.active || /^OPEN ROAD|^RAIN/.test(arcadeEventLabel);
  };
  const baseSkillHud = updateSkillHud;
  let artSkillHudAt = -Infinity;
  updateSkillHud = function(now) {
    baseSkillHud(now);
    if (skillHud.hidden || now - artSkillHudAt < 90) return;
    artSkillHudAt = now;
    const state = skillProgression.snapshot(), truck = readTruck(), pickups = drivingPickups.snapshot(), abilities = activeAbilities.snapshot();
    $('#skill-points').textContent = state.points ? `U · ${state.points} UPGRADE${state.points === 1 ? '' : 'S'}` : 'U · SKILLS';
    const drift = truck.drift ?? {};
    $('#skill-drift').hidden = !drift.active && !['release','released'].includes(drift.phase) && Math.abs(skillSteeringDamage) <= .12;
    const names = { boost: 'BOOST +25%', ability: 'POWER +50%', focus: 'COMBO / XP BONUS' };
    const effects = Object.entries(pickups.timers).filter(([, time]) => time > 0).map(([id, time]) => `${names[id]} · ${Math.ceil(time)}s`);
    if (abilities.shield.remaining > 0) effects.push(`SHIELD · ${abilities.shield.charges} HITS`);
    $('#skill-effects').textContent = effects.join('  /  ');
    $('#skill-effects').hidden = effects.length === 0;
  };

  // One gradient texture shared by solid illustrated surfaces.
  const gradient = new THREE.DataTexture(new Uint8Array([90, 140, 200, 255]), 4, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false; gradient.needsUpdate = true;
  const replacements = new Map();
  function toon(old, color, options = {}) {
    const mat = new THREE.MeshToonMaterial({ color: color ?? old.color, gradientMap: gradient,
      vertexColors: old.vertexColors, side: old.side, fog: true, ...options });
    replacements.set(old, mat); return mat;
  }
  for (const [key, color] of Object.entries({ terrain: 0xffffff, tree: 0xffffff, trunk: 0x72523b,
    rock: 0x8f8a7c, truckRed: 0xea5937, truckCream: 0xffdda0, truckDark: 0x293a49,
    wood: 0xa67b47, crate: 0xd89c58, crateDark: 0x765133, brick: 0xa75948,
    blue: 0x3689a3, yellow: 0xf6ba4f, white: 0xf2e9d6 })) {
    materials[key] = toon(materials[key], color);
  }
  const distantTerrain = toon(_lhUnifiedHorizonMaterial, 0xffffff, { side: THREE.DoubleSide });
  distantTerrain.onBeforeCompile = _lhUnifiedHorizonMaterial.onBeforeCompile;
  distantTerrain.customProgramCacheKey = () => 'long-haul-toon-horizon-v1';
  const applyMaterials = root => root.traverse(object => {
    if (Array.isArray(object.material)) object.material = object.material.map(m => replacements.get(m) ?? m);
    else if (replacements.has(object.material)) object.material = replacements.get(object.material);
  });
  applyMaterials(scene);
  const originalRealize = realizeCell;
  realizeCell = function(patch, options) { originalRealize(patch, options); const entry = cellHosts.get(patch.cellId); if (entry) applyMaterials(entry.group); };
  const originalHorizonRealize = realizeHorizonCell;
  realizeHorizonCell = function(patch) { originalHorizonRealize(patch); const entry = horizonHosts.get(patch.cellId); if (entry) applyMaterials(entry.group); };
  _lhAsphaltMaterial.color.set(0x344453); _lhPavedShoulderMaterial.color.set(0xa69b80);
  _lhWhiteLineMaterial.color.set(0xfff4cf); _lhYellowLineMaterial.color.set(0xffc767);
  _lhHorizonForestMaterial.color.set(0x446b61); _lhHorizonTownMaterial.color.set(0x9e8c7a);
  materials.chrome.color.set(0xc6dfe3); materials.chrome.metalness = .25; materials.chrome.roughness = .4;

  // Match sampled terrain color and geometry on both sides of the near/far seam.
  const oldColorAt = _lhColorAt;
  _lhColorAt = function(x, z, height, seed, forestDensity) {
    return course?.generatorVersion === ROAD_GENERATOR_VERSION ? landscapeTint(seed, x, z, height) : oldColorAt(x, z, height, seed, forestDensity);
  };
  horizonDrop = atmosphericRollOff;
  const originalPatch = buildHorizonPatch;
  buildHorizonPatch = function(cell, focus) {
    const patch = originalPatch(cell, focus);
    if (course?.generatorVersion !== ROAD_GENERATOR_VERSION) return patch;
    const b = patch.bounds, width = b.maxX - b.minX, depth = b.maxZ - b.minZ;
    const nearest = _lhDistanceToBounds(focus, b);
    // Bounded tessellation only where a silhouette can actually be seen.
    const segments = nearest < 1700 ? Math.min(24, Math.max(8, Math.ceil(Math.max(width, depth) / 65))) : patch.segments;
    patch.segments = segments; patch.positions = []; patch.colors = []; patch.baseHeights = [];
    for (let iz=0; iz<=segments; iz++) for (let ix=0; ix<=segments; ix++) {
      const x=b.minX+ix/segments*width, z=b.minZ+iz/segments*depth;
      const y=terrainHeight(course,x,z), distance=Math.hypot(x-focus.x,z-focus.z);
      patch.positions.push(x,y-atmosphericRollOff(distance),z); patch.baseHeights.push(y);
      patch.colors.push(...landscapeTint(course.seed,x,z,y));
    }
    return patch;
  };
  // Remove the old repeated darkening of shared vertices along the LOD boundary.
  _lhBuildHorizonGeometry = function(patch) {
    const geometry=new THREE.BufferGeometry(), indices=[], n=patch.segments;
    for(let z=0;z<n;z++) for(let x=0;x<n;x++) { const a=z*(n+1)+x,b=a+1,c=a+n+1,d=c+1; indices.push(a,c,b,b,c,d); }
    // Neighboring LOD grids sample the same continuous ground at different
    // spacings. Downward skirts cover their T-junctions, never raising the
    // visible surface or changing collision heights.
    const positions=[...patch.positions],colors=[...patch.colors],edge=[];
    for(let x=0;x<=n;x++)edge.push(x);
    for(let z=1;z<=n;z++)edge.push(z*(n+1)+n);
    for(let x=n-1;x>=0;x--)edge.push(n*(n+1)+x);
    for(let z=n-1;z>0;z--)edge.push(z*(n+1));
    // Close every terrain boundary below the lowest nearby landscape, not
    // merely a fixed distance below a high ridge. Shallow skirts left sky
    // visible under elevated distant tiles while their neighbours streamed.
    const bottom=positions.length/3;
    for(const a of edge){const x=positions[a*3],z=positions[a*3+2],floor=-256-atmosphericRollOff(Math.hypot(x-patch.focus.x,z-patch.focus.z));positions.push(x,Math.min(floor,positions[a*3+1]-64),z);colors.push(colors[a*3],colors[a*3+1],colors[a*3+2]);}
    for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length;indices.push(edge[i],bottom+j,bottom+i,edge[i],edge[j],bottom+j);}
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere(); return geometry;
  };

  // Replace finite horizontal cloud sheets, not merely their opacity.
  cloudRoot.removeFromParent();
  for (const layer of cloudLayers) { layer.texture.dispose(); layer.sheet.material.dispose(); }
  cloudPlane.dispose(); sky.visible = false;
  const atmosphere = new THREE.Group(); atmosphere.name='illustrated-atmosphere'; worldRoot.add(atmosphere);
  const skyUniforms = { topColor: {value:new THREE.Color(0x677ca9)}, horizonColor:{value:new THREE.Color(0xffce91)},
    groundColor:{value:new THREE.Color(0xc6b5a2)}, sunColor:{value:new THREE.Color(0xffebba)} };
  const domeMaterial = new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyUniforms,
    vertexShader:'varying vec3 ray;void main(){ray=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform vec3 topColor,horizonColor,groundColor,sunColor;varying vec3 ray;
      void main(){vec3 n=normalize(ray);float h=n.y;
      vec3 color=mix(groundColor,horizonColor,smoothstep(-.2,.035,h));
      color=mix(color,topColor,smoothstep(.025,.72,h));
      float light=dot(n,normalize(vec3(-.55,.19,-.77)));
      color=mix(color,sunColor,smoothstep(.995,.9985,light)*.92);
      color+=sunColor*pow(max(0.,light),28.)*.06;
      gl_FragColor=vec4(color,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1500,32,18),domeMaterial); dome.renderOrder=-100; atmosphere.add(dome);
  const clouds = new THREE.Group(); clouds.name='shaped-cloud-banks'; atmosphere.add(clouds);
  // One batch of 3D cloud point clusters; soft continuous alpha, no dithering.
  const count=profile.cloudBanks,pointsPerBank=112;
  const typeIds={cumulus:0,cumulonimbus:1,cirrus:2,stratus:3};
  const cloudUniforms={cloudColor:{value:new THREE.Color(0xfffaf2)},
    cloudShadow:{value:new THREE.Color(0x64758d)},weather:{value:0},
    viewportHeight:{value:renderer.domElement.height||720},
    driveProgress:{value:0},cloudSeconds:{value:0}};
  const cloudMaterial=new THREE.ShaderMaterial({uniforms:cloudUniforms,
    transparent:true,depthWrite:false,depthTest:true,blending:THREE.NormalBlending,fog:false,
    vertexShader:"attribute float aSize,aAlpha,aShade,aLayer,aWind,aNoise;\nuniform float viewportHeight,driveProgress,cloudSeconds;\nvarying float vAlpha,vShade,vNoise;\nvoid main(){\n  float travel=aLayer<.5?.0025:(aLayer<1.5?.001:.00035);\n  vec3 p=position;p.x+=cloudSeconds*aWind+driveProgress*travel;\n  vec4 view=modelViewMatrix*vec4(p,1.);\n  gl_Position=projectionMatrix*view;\n  gl_PointSize=clamp(aSize*viewportHeight*projectionMatrix[1][1]*.5/max(-view.z,1.),2.,48.);\n  gl_Position.z=gl_Position.w*.99998;\n  vAlpha=aAlpha;vShade=aShade;vNoise=aNoise;\n}",fragmentShader:"uniform vec3 cloudColor,cloudShadow;\nuniform float weather;\nvarying float vAlpha,vShade,vNoise;\nvoid main(){\n  vec2 uv=gl_PointCoord*2.-1.;\n  float angle=atan(uv.y,uv.x);\n  float edge=length(uv)+.07*sin(angle*7.+vNoise*6.)+.04*sin(angle*13.-vNoise*9.);\n  float alpha=(1.-smoothstep(.36,1.,edge))*vAlpha;\n  if(alpha<.006)discard;\n  float shade=clamp(vShade+.12*(1.-edge),0.,1.);\n  vec3 base=mix(cloudShadow,cloudColor,shade);\n  base+=vec3(1.,.93,.79)*pow(max(0.,edge-.5),2.)*.09*(1.-weather*.4);\n  gl_FragColor=vec4(base,alpha);\n  #include <tonemapping_fragment>\n  #include <colorspace_fragment>\n}"});
  const cloudMesh=new THREE.Points(new THREE.BufferGeometry(),cloudMaterial);
  cloudMesh.name='cloud-sdf-types'; // Keep existing host object lookup.
  cloudMesh.renderOrder=10;cloudMesh.frustumCulled=false;
  let cloudSeed=null,cloudLayoutUpdates=0;
  // Presentation-only seed: every generated run gets a new sky, including
  // retries of the exact same course. It never enters gameplay/save state.
  const makeCloudRunSeed=()=>{
    if(globalThis.crypto?.getRandomValues){
      const bits=new Uint32Array(2);globalThis.crypto.getRandomValues(bits);
      return bits[0].toString(36)+'-'+bits[1].toString(36);
    }
    return Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
  };
  let cloudRunSeed=makeCloudRunSeed(),cloudRunNumber=0;
  const originalCloudStartGeneration=startGeneration;
  startGeneration=function(...args){
    cloudRunSeed=makeCloudRunSeed();cloudRunNumber++;
    return originalCloudStartGeneration.apply(this,args);
  };
  const activeCloudSeed=()=>`${course?.seed||'long-haul-sky'}:sky-run:${cloudRunSeed}`;
  let cloudDescriptors=[],cloudForwardProgress=0,cloudLastUpdate=-Infinity;
  const cloudLayerCounts=[0,0,0],cloudSkyRadius=[730,1070,1450];
  const cloudAngularScale=[.95,1.12,1.28];
  function ensureCloudLayout(seed){
    const nextSeed=typeof seed==='string'&&seed.length?seed:'long-haul-sky';
    if(nextSeed===cloudSeed)return;
    cloudDescriptors=cloudBankDescriptors(nextSeed);
    if(cloudDescriptors.length!==count)throw Error('Cloud bank count mismatch');
    cloudLayerCounts.fill(0);
    const pos=[],size=[],alpha=[],shade=[],layer=[],wind=[],grain=[];
    let entropy=2166136261;
    for(let i=0;i<nextSeed.length;i++)entropy=Math.imul(entropy^nextSeed.charCodeAt(i),16777619)>>>0;
    const rnd=()=>{entropy=(Math.imul(entropy,1664525)+1013904223)>>>0;return entropy/4294967296;};
    const bell=()=>rnd()+rnd()+rnd()-1.5;
    for(const bank of cloudDescriptors){
      cloudLayerCounts[bank.layer]++;
      const slot=bank.id%profile.cloudBanksPerLayer;
      const bearing=(slot<6?(-1.26+(slot+.5)*2.52/6):(slot===6?2.35:-2.35))+(bank.variation-.5)*.15;
      const radius=cloudSkyRadius[bank.layer]+(bank.variation-.5)*90;
      const cx=Math.sin(bearing)*radius,cy=bank.altitude*.66,cz=-Math.cos(bearing)*radius;
      const width=bank.width*cloudAngularScale[bank.layer]*.5;
      const height=bank.height*cloudAngularScale[bank.layer]*.5;
      const depth=bank.width*[.28,.33,.39][bank.layer];
      const kind=typeIds[bank.type];
      for(let i=0;i<pointsPerBank;i++){
        let x=0,y=0,z=0;
        if(kind===0){
          const lobes=[[-.48,-.23,.04,.34,.26,.27],[-.12,.04,-.1,.36,.39,.29],[.31,-.14,.05,.42,.30,.28],[.12,.34,.09,.25,.26,.22]];
          const l=lobes[Math.floor(rnd()*4)];
          x=l[0]+bell()*l[3]*1.7;y=l[1]+bell()*l[4]*1.8;z=l[2]+bell()*l[5]*1.7;
        }else if(kind===1){
          const t=rnd();
          if(t<.37){x=bell()*.7;y=-.4+bell()*.22;z=bell()*.48;}
          else if(t<.83){x=bell()*.32;y=-.25+rnd()*.98;z=bell()*.34;}
          else{x=bell()*.76;y=.62+bell()*.14;z=bell()*.42;}
        }else if(kind===2){
          const t=rnd()*2.-1.;
          x=t*.9+bell()*.1;y=.17*Math.sin(t*4.+bank.variation*6.)+bell()*.085;
          z=.1*Math.sin(t*6.+bank.variation*4.)+bell()*.16;
        }else{
          x=(rnd()*2.-1.)*.9;y=bell()*.16+.075*Math.sin(x*9.+bank.variation*5.);z=bell()*.46;
        }
        pos.push(cx+x*width,cy+y*height,cz+z*depth);
        size.push(bank.width*(kind===2?.085:.105)*(.66+rnd()*.65));
        alpha.push((kind===2?.12:kind===3?.16:.21)*(.62+rnd()*.8));
        shade.push(Math.max(.18,Math.min(.98,.56+y*.35+(rnd()-.5)*.22)));
        layer.push(bank.layer);wind.push(bank.wind);grain.push(rnd());
      }
    }
    const geo=new THREE.BufferGeometry();
    for(const [key,data] of [['position',pos],['aSize',size],['aAlpha',alpha],['aShade',shade],['aLayer',layer],['aWind',wind],['aNoise',grain]])
      geo.setAttribute(key,new THREE.Float32BufferAttribute(data,key==='position'?3:1));
    cloudMesh.geometry.dispose();cloudMesh.geometry=geo;
    cloudSeed=nextSeed;cloudLayoutUpdates++;cloudLastUpdate=-Infinity;
  }
  function positionClouds(state,seconds){
    cloudForwardProgress=Math.max(0,-state.position.z);
    cloudUniforms.driveProgress.value=cloudForwardProgress;
    cloudUniforms.cloudSeconds.value=seconds;
    cloudUniforms.viewportHeight.value=renderer.domElement.height||720;
  }
  clouds.add(cloudMesh);
  ensureCloudLayout(activeCloudSeed());
  scene.fog=new THREE.Fog(0xf1cca4,profile.clearNear,profile.clearFar);
  const fill=new THREE.DirectionalLight(0xb6d9ff,.65);worldRoot.add(fill,fill.target);
  const colors={clearTop:new THREE.Color(0x697fae),rainTop:new THREE.Color(0x586d89),
    clearHorizon:new THREE.Color(0xffd29b),rainHorizon:new THREE.Color(0xb9c7cf),
    clearFog:new THREE.Color(0xebc8a4),rainFog:new THREE.Color(0xafc0c9),
    clearCloud:new THREE.Color(0xfffaf2),rainCloud:new THREE.Color(0xe5ebf5)};
  const groundColor=new THREE.Color(0x557568),sunColor=new THREE.Color(0xffd69b);
  const cloudRainShadow=new THREE.Color(0x63738a),cloudSunDirection=new THREE.Vector3(-.55,.19,-.77).normalize();
  const cloudCameraRight=new THREE.Vector3(),cloudCameraUp=new THREE.Vector3(),cloudCameraForward=new THREE.Vector3();
  hemi.color.set(0xd7e5ff);hemi.groundColor.copy(groundColor);sun.color.copy(sunColor);
  function atmosphereFrame(state, milliseconds) {
    const weather=clamp(arcadeWeatherAmount,0,1),seconds=milliseconds/1000;
    ensureCloudLayout(activeCloudSeed());
    atmosphere.position.set(state.position.x,0,state.position.z);dome.position.y=state.position.y;
    clouds.rotation.y=0;
    // Cloud placement runs after applyCamera(), in arcadeVisualFrame.
    // Updating sky colors here remains independent of camera position.
    skyUniforms.topColor.value.copy(colors.clearTop).lerp(colors.rainTop,weather);
    skyUniforms.horizonColor.value.copy(colors.clearHorizon).lerp(colors.rainHorizon,weather);
    skyUniforms.groundColor.value.copy(colors.clearFog).lerp(colors.rainFog,weather);
    scene.fog.color.copy(colors.clearFog).lerp(colors.rainFog,weather);
    scene.fog.near=lerp(profile.clearNear,profile.rainNear,weather);scene.fog.far=lerp(profile.clearFar,profile.rainFar,weather);
    cloudUniforms.cloudColor.value.copy(colors.clearCloud).lerp(colors.rainCloud,weather);
    cloudUniforms.cloudShadow.value.set(0x64758d).lerp(cloudRainShadow,weather);
    cloudUniforms.weather.value=weather;
    cloudCameraRight.set(1,0,0).applyQuaternion(camera.quaternion);
    cloudCameraUp.set(0,1,0).applyQuaternion(camera.quaternion);
    cloudCameraForward.set(0,0,-1).applyQuaternion(camera.quaternion);
    cloudUniforms.viewportHeight.value=renderer.domElement.height||720;
    sun.intensity=lerp(1.65,1.03,weather);hemi.intensity=lerp(1.4,1.25,weather);
    fill.position.set(state.position.x+80,state.position.y+75,state.position.z+110);
    fill.target.position.set(state.position.x,state.position.y,state.position.z);fill.target.updateMatrixWorld();
  }
  updateCloudLayers=atmosphereFrame;
  atmosphereFrame({position:{x:0,y:0,z:0}},0);

  // One soft contact shadow follows the true sampled ground, including flight.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const ctx=shadowCanvas.getContext('2d'),fade=ctx.createRadialGradient(32,32,8,32,32,32);
  fade.addColorStop(0,'rgba(9,20,29,.62)');fade.addColorStop(.6,'rgba(9,20,29,.30)');fade.addColorStop(1,'rgba(9,20,29,0)');
  ctx.fillStyle=fade;ctx.fillRect(0,0,64,64);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
  const shadowMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,fog:true});
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),shadowMaterial);shadow.name='truck-contact-shadow';worldRoot.add(shadow);
  const planeNormal=new THREE.Vector3(0,0,1),groundNormal=new THREE.Vector3();
  const oldVisualFrame=arcadeVisualFrame;
  arcadeVisualFrame=function(now) {
    oldVisualFrame(now);
    const playing=currentScene()==='driving' && Boolean(course); shadow.visible=playing;
    objective.hidden=!playing||launchIntro.active;
    if(!playing){
      help.hidden=true;receipt.hidden=true;
      // Keep the title's cinematic sky populated too, before a run starts.
      if(currentScene()==='title'&&(now<cloudLastUpdate||now-cloudLastUpdate>=33)){
        positionClouds({position:camera.position},now/1000);
        cloudLastUpdate=now;
      }
      return;
    }
    const state=readTruck(),ground=groundSample(state.position),altitude=Math.max(0,state.position.y-ground.height-1);
    if(now<cloudLastUpdate||now-cloudLastUpdate>=33){
      positionClouds(state,skillVisualTime);
      cloudLastUpdate=now;
    }
    groundNormal.set(ground.normal.x,ground.normal.y,ground.normal.z).normalize();
    shadow.position.set(state.position.x,ground.height+profile.shadowLift,state.position.z);
    shadow.quaternion.setFromUnitVectors(planeNormal,groundNormal);shadow.rotateZ(-state.heading);
    shadow.scale.set(5.8+altitude*.18,10.5+altitude*.22,1);shadowMaterial.opacity=clamp(1-altitude/30,.18,1);
  };
  window.LongHaulPresentation={getState:()=>({version:1,cloudBanks:profile.cloudBanks,cloudLobes:0,cloudSdfInstances:count,cloudTypes:Object.keys(typeIds),cloudDrawCalls:1,cloudPositioning:'world-bearing-sky',cloudTurnInfluence:0,cloudLayers:cloudLayerCounts.slice(),cloudForwardProgress,cloudDepthPolicy:'sky-first-landscape-overdraw',cloudGeometry:'shader-3d-point-clouds',cloudPointCount:cloudMesh.geometry.getAttribute('position')?.count||0,cloudVisibilityScale:[.95,1.12,1.28],cloudSeed,cloudRunNumber,cloudLayoutUpdates,
    oldCloudSheets:cloudRoot.parent!==null,fog:{near:scene.fog.near,far:scene.fog.far,color:scene.fog.color.getHexString()},
    hud:'four-corner-contextual',terrain:'shared-worker-and-horizon',contactShadow:shadow.visible})};
  window.__longHaulVisualsReady=true;
})();
