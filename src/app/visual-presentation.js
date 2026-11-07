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
  // Instanced 3D SDF volumes: no camera-facing planes and no dithering.
  const cloudGeometry=new THREE.SphereGeometry(1,16,12);
  const count=profile.cloudBanks;
  const typeIds={cumulus:0,cumulonimbus:1,cirrus:2,stratus:3};
  const cloudTypes=new Float32Array(count),cloudVariations=new Float32Array(count);
  cloudGeometry.setAttribute('cloudType',new THREE.InstancedBufferAttribute(cloudTypes,1));
  cloudGeometry.setAttribute('cloudVariation',new THREE.InstancedBufferAttribute(cloudVariations,1));
  const cloudUniforms={
    cloudColor:{value:new THREE.Color(0xfffaf2)},
    cloudShadow:{value:new THREE.Color(0x64758d)},
    sunDirection:{value:new THREE.Vector3(-.55,.19,-.77).normalize()},
    weather:{value:0}
  };
  const cloudMaterial=new THREE.ShaderMaterial({
    uniforms:cloudUniforms,transparent:false,depthWrite:false,depthTest:false,
    side:THREE.FrontSide,fog:false,
    vertexShader:"attribute float cloudType,cloudVariation;\nvarying vec3 vLocalPoint,vLocalEye,vAxisX,vAxisY,vAxisZ;\nvarying float vType,vVariation;\nvoid main(){\n  vType=cloudType;vVariation=cloudVariation;\n  vLocalPoint=position;\n  mat4 transform=modelMatrix*instanceMatrix;\n  vec3 x=transform[0].xyz,y=transform[1].xyz,z=transform[2].xyz;\n  float sx=length(x),sy=length(y),sz=length(z);\n  vAxisX=x/max(sx,.001);vAxisY=y/max(sy,.001);vAxisZ=z/max(sz,.001);\n  vec3 offset=cameraPosition-transform[3].xyz;\n  vLocalEye=vec3(dot(offset,vAxisX)/max(sx,.001),dot(offset,vAxisY)/max(sy,.001),dot(offset,vAxisZ)/max(sz,.001));\n  gl_Position=projectionMatrix*viewMatrix*transform*vec4(position,1.);\n}",
    fragmentShader:"uniform vec3 cloudColor,cloudShadow,sunDirection;\nuniform float weather;\nvarying vec3 vLocalPoint,vLocalEye,vAxisX,vAxisY,vAxisZ;\nvarying float vType,vVariation;\nfloat blob(vec3 p,vec3 center,vec3 radius){\n  return (length((p-center)/radius)-1.)*min(min(radius.x,radius.y),radius.z);\n}\nfloat smoothUnion(float a,float b,float k){\n  float h=max(k-abs(a-b),0.)/k;\n  return min(a,b)-h*h*k*.25;\n}\nfloat cloudSdf(vec3 p){\n  float d=1.;\n  if(vType<.5){\n    d=blob(p,vec3(-.43,-.22,0.),vec3(.43,.34,.38));\n    d=smoothUnion(d,blob(p,vec3(.05,-.14,.04),vec3(.50,.45,.44)),.22);\n    d=smoothUnion(d,blob(p,vec3(-.06,.23,-.1),vec3(.36,.47,.37)),.19);\n    d=smoothUnion(d,blob(p,vec3(.47,.03,-.1),vec3(.34,.34,.37)),.17);\n  }else if(vType<1.5){\n    d=blob(p,vec3(0.,-.45,0.),vec3(.77,.18,.44));\n    d=smoothUnion(d,blob(p,vec3(-.2,-.12,0.),vec3(.37,.36,.38)),.16);\n    d=smoothUnion(d,blob(p,vec3(.08,.23,0.),vec3(.38,.52,.39)),.20);\n    d=smoothUnion(d,blob(p,vec3(.06,.61,0.),vec3(.33,.24,.34)),.14);\n  }else if(vType<2.5){\n    d=blob(p,vec3(0.,.09,0.),vec3(.85,.13,.22));\n    d=smoothUnion(d,blob(p,vec3(-.32,-.05,.06),vec3(.50,.075,.18)),.07);\n    d=smoothUnion(d,blob(p,vec3(.26,.23,-.07),vec3(.58,.08,.17)),.08);\n  }else{\n    d=blob(p,vec3(0.,-.08,0.),vec3(.89,.24,.35));\n    d=smoothUnion(d,blob(p,vec3(-.4,.04,-.04),vec3(.52,.18,.35)),.11);\n    d=smoothUnion(d,blob(p,vec3(.39,.025,.02),vec3(.51,.17,.34)),.12);\n  }\n  float irregular=sin(p.x*12.+vVariation*6.)*sin(p.y*9.-vVariation*4.)*sin(p.z*11.+vVariation*3.);\n  return d+irregular*.015;\n}\nvoid main(){\n  vec3 rd=normalize(vLocalPoint-vLocalEye),p=vLocalPoint;\n  float distanceTraveled=0.;\n  bool hit=false;\n  for(int i=0;i<24;i++){\n    float d=cloudSdf(p);\n    if(d<.012){hit=true;break;}\n    float stepSize=clamp(d*.72,.018,.23);\n    distanceTraveled+=stepSize;\n    if(distanceTraveled>2.1)break;\n    p+=rd*stepSize;\n  }\n  if(!hit)discard;\n  vec2 e=vec2(.025,0.);\n  vec3 n=normalize(vec3(\n    cloudSdf(p+e.xyy)-cloudSdf(p-e.xyy),\n    cloudSdf(p+e.yxy)-cloudSdf(p-e.yxy),\n    cloudSdf(p+e.yyx)-cloudSdf(p-e.yyx)));\n  vec3 worldNormal=normalize(vAxisX*n.x+vAxisY*n.y+vAxisZ*n.z);\n  float sunlight=max(dot(worldNormal,normalize(sunDirection)),0.);\n  float fill=.38+.54*max(worldNormal.y,0.)+.32*sunlight;\n  float rim=pow(1.-abs(dot(n,rd)),3.);\n  vec3 base=mix(cloudShadow,cloudColor,clamp(fill,0.,1.));\n  base+=vec3(1.,.96,.83)*rim*(.15+.45*sunlight)*(1.-weather*.3);\n  gl_FragColor=vec4(base,1.);\n  #include <tonemapping_fragment>\n  #include <colorspace_fragment>\n}"
  });
  const cloudMesh=new THREE.InstancedMesh(cloudGeometry,cloudMaterial,count);
  cloudMesh.name='cloud-sdf-types';
  cloudMesh.renderOrder=-90; // Sky, then 3D clouds, then opaque terrain.
  cloudMesh.frustumCulled=false; // Ring follows driving position, not camera aim.
  const dummy=new THREE.Object3D();let cloudSeed=null,cloudLayoutUpdates=0;
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
  const cloudPosition=new THREE.Vector3();
  const cloudLayerCounts=[0,0,0];
  function ensureCloudLayout(seed) {
    const nextSeed=typeof seed==='string'&&seed.length?seed:'long-haul-sky';
    if(nextSeed===cloudSeed)return;
    cloudDescriptors=cloudBankDescriptors(nextSeed);
    if(cloudDescriptors.length!==count)throw Error('SDF cloud budget mismatch');
    cloudLayerCounts.fill(0);
    for(const bank of cloudDescriptors){
      cloudLayerCounts[bank.layer]++;
      cloudTypes[bank.id]=typeIds[bank.type];
      cloudVariations[bank.id]=bank.variation;
    }
    cloudGeometry.attributes.cloudType.needsUpdate=true;
    cloudGeometry.attributes.cloudVariation.needsUpdate=true;
    cloudSeed=nextSeed;cloudLayoutUpdates++;
    cloudLastUpdate=-Infinity;
  }
  // Camera-independent sky. Cloud centers occupy shallow elevation angles
  // around a distant ring, not a screen-aligned strip above the truck.
  // Six of each layer's eight banks favor the road ahead; two fill the rear.
  const cloudSkyRadius=[730,1070,1450];
  const cloudAngularScale=[1.45,1.75,2.05];
  const cloudDepthScale=[.55,.62,.72];
  function positionClouds(state,seconds) {
    // Truck translation and turning do not rotate the cloud field.
    // Only forward travel contributes a subtle horizontal drift.
    cloudForwardProgress=Math.max(0,-state.position.z);
    for(const bank of cloudDescriptors){
      const slot=bank.id%profile.cloudBanksPerLayer;
      const angle=slot<6
        ? (-1.26+(slot+.5)*2.52/6)
        : (slot===6?2.35:-2.35);
      const bearing=angle+(bank.variation-.5)*.15;
      const radius=cloudSkyRadius[bank.layer]+(bank.variation-.5)*90;
      const drift=seconds*bank.wind+[.0025,.001,.00035][bank.layer]*cloudForwardProgress;
      // The local atmosphere root follows truck X/Z. Keep relative bearings
      // fixed: no camera-space offset, pitch, or sideways steering response.
      cloudPosition.set(Math.sin(bearing)*radius+drift,
        bank.altitude*.66,
        -Math.cos(bearing)*radius);
      dummy.position.copy(cloudPosition);
      dummy.rotation.set(0,0,0);
      dummy.scale.set(bank.width*cloudAngularScale[bank.layer],
        bank.height*cloudAngularScale[bank.layer],
        bank.width*cloudDepthScale[bank.layer]);
      dummy.updateMatrix();
      cloudMesh.setMatrixAt(bank.id,dummy.matrix);
    }
    cloudMesh.instanceMatrix.needsUpdate=true;
    cloudMesh.computeBoundingSphere();
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
    cloudUniforms.sunDirection.value.copy(cloudSunDirection);
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
  window.LongHaulPresentation={getState:()=>({version:1,cloudBanks:profile.cloudBanks,cloudLobes:0,cloudSdfInstances:count,cloudTypes:Object.keys(typeIds),cloudDrawCalls:1,cloudPositioning:'world-bearing-sky',cloudTurnInfluence:0,cloudLayers:cloudLayerCounts.slice(),cloudForwardProgress,cloudDepthPolicy:'sky-first-landscape-overdraw',cloudGeometry:'instanced-3d-sdf-volumes',cloudVisibilityScale:[1.45,1.75,2.05],cloudSeed,cloudRunNumber,cloudLayoutUpdates,
    oldCloudSheets:cloudRoot.parent!==null,fog:{near:scene.fog.near,far:scene.fog.far,color:scene.fog.color.getHexString()},
    hud:'four-corner-contextual',terrain:'shared-worker-and-horizon',contactShadow:shadow.visible})};
  window.__longHaulVisualsReady=true;
})();
