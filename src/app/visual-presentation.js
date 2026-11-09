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
  // XP is a sibling of the ability dock, never an overlay inside it.
  // Preserve its original button, click handler and gameplay-owned data.
  const xpButton = $('#skill-open');
  stage.append(xpButton);
  $('#skill-hud').setAttribute('aria-label', 'Abilities and progression');
  const help = make('div', 'driving-onboarding');
  help.textContent = 'WASD drive  ·  SPACE boost  ·  S + turn drift  ·  M map'; stage.append(help);
  // TLH-023: The alternative layout reuses the existing DOM/live HUD owners.
  // Only the freight-specific choice hint is new; no gameplay logic is duplicated.
  document.body.classList.add('alternative-b-hud');
  const routeChoice = make('div', 'alternative-b-route', 'Freight route choice');
  routeChoice.hidden = true;
  routeChoice.setAttribute('role', 'group');
  routeChoice.innerHTML = '<div class="alternative-b-choice safe"><span class="alternative-b-arrow" aria-hidden="true"></span><strong>WIDE LEFT<small>SAFER</small></strong></div><div class="alternative-b-choice express"><strong>EXPRESS RIGHT<small>BONUS</small></strong><span class="alternative-b-arrow" aria-hidden="true"></span></div>';
  stage.append(routeChoice);
  // TLH-023: Presentation-owned HUD materials, not a stylesheet cutover.
  // These are static render properties: write them once, never on each frame.
  // Keep the authored art, live data owners, input targets and fixed tile sizes.
  const material = (element, properties) => {
    if (!element) return;
    for (const [name, value] of Object.entries(properties)) element.style.setProperty(name, value);
  };
  const transparentSurface = {
    background: 'transparent', 'background-color': 'transparent',
    'box-shadow': 'none', 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none',
    border: '0', 'clip-path': 'none'
  };
  // Text-heavy information gets a shallow glass material instead of an opaque slab.
  material(freightHud, {
    background: 'rgba(8,20,34,0.26)', 'backdrop-filter': 'blur(2px)',
    '-webkit-backdrop-filter': 'blur(2px)',
    border: '0', 'border-left': '3px solid rgba(80,237,240,0.85)',
    'clip-path': 'none', 'box-shadow': 'none'
  });
  // Everything needed at a glance floats above the world.
  material(riskHud, transparentSurface);
  material($('#drive-box'), transparentSurface);
  material(skillHud, { background: 'transparent', 'box-shadow': 'none' });
  material($('#skill-open'), {
    background: 'rgba(10,22,34,0.20)', border: '0',
    'border-left': '2px solid rgba(80,236,237,0.78)',
    'clip-path': 'none', 'box-shadow': 'none',
    'backdrop-filter': 'blur(2px)', '-webkit-backdrop-filter': 'blur(2px)'
  });
  material(routeChoice, { background: 'transparent', 'box-shadow': 'none' });
  for (const choice of routeChoice.querySelectorAll('.alternative-b-choice')) {
    material(choice, transparentSurface);
  }
  for (const ability of skillHud.querySelectorAll('.skill-ability')) {
    // No panel paint; keep its intrinsic geometry and cooldown hit area.
    material(ability, transparentSurface);
  }
  const contrast = '0 1px 2px rgba(0,0,0,.9), 0 2px 8px rgba(0,0,0,.68)';
  const readable = [
    '#freight-cargo','#freight-state','#freight-next',
    '#risk-multiplier','#risk-pending','#risk-bank','#speed',
    '#skill-level','#skill-xp','#skill-points'
  ];
  for (const selector of readable) material(document.querySelector(selector), { 'text-shadow': contrast });
  for (const element of [
    ...routeChoice.querySelectorAll('strong, small'),
    ...skillHud.querySelectorAll('.skill-ability span, .skill-ability small')
  ]) material(element, { 'text-shadow': contrast });
  // Shallow meter tracks still communicate remaining fuel/condition.
  for (const track of $('#condition-box').querySelectorAll('.meter')) {
    material(track, { background: 'rgba(24,36,48,0.32)', 'border-color': 'rgba(255,255,255,0.08)' });
  }

  // Presentation-owned docking: reserve independent edge zones rather than
  // stacking auto-sized panels over each other. No gameplay/input ownership.
  const dock = (element, properties) => material(element, properties);
  const oneLine = element => dock(element, {
    'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis',
    'max-width': '100%', 'min-width': '0'
  });
  for (const selector of [
    '#freight-state', '#freight-cargo', '#freight-next', '#freight-mass',
    '#risk-multiplier', '#risk-pending', '#risk-bank', '#speed',
    '#skill-level', '#skill-xp', '#skill-points'
  ]) oneLine(document.querySelector(selector));
  for (const label of stage.querySelectorAll(
    '#skill-hud .skill-ability span, #skill-hud .skill-ability small, #alternative-b-route strong'
  )) oneLine(label);
  dock($('#risk-pending'), { 'font-variant-numeric': 'tabular-nums', 'min-width': '5ch' });
  dock($('#speed'), { 'font-variant-numeric': 'tabular-nums', 'min-width': '3ch' });
  for (const cooldown of skillHud.querySelectorAll('.skill-ability small')) {
    dock(cooldown, { 'font-variant-numeric': 'tabular-nums', width: '7ch', 'min-width': '7ch', 'text-align': 'center' });
  }

  // One Presentation layout owner; all three docks are siblings in #game-stage.
  // Avoid fixed positioning inside filtered/transformed parent containers.
  const applyHudDock = () => {
    const width = stage.clientWidth || window.innerWidth;
    const height = stage.clientHeight || window.innerHeight;
    const mobile = width < 620, compact = width < 980;
    const edge = mobile ? 10 : 20;
    const touch = matchMedia('(pointer: coarse)').matches;
    const safeBottom = mobile && touch ? 112 : 18;
    const sideWidth = mobile ? Math.min(180,Math.floor((width-32)/2)) :
      compact ? Math.min(230,Math.floor(width*.31)) : Math.min(300,Math.floor(width*.28));
    const side = sideWidth + 'px';
    const bottom = Math.max(safeBottom, Math.floor(height*.045))+'px';
    // Top rails: concise objective on left, score on right.
    dock(objective, {
      position:'absolute',top:mobile?'58px':'22px',bottom:'auto',
      left:edge+'px',right:'auto',width:mobile?'calc(100% - 20px)':side,
      'max-width':mobile?'none':side,'box-sizing':'border-box'
    });
    dock(riskHud, {
      position:'absolute',top:mobile?'8px':'22px',bottom:'auto',
      right:edge+'px',left:'auto',width:mobile?'160px':side,
      'max-width':mobile?'48%':side,'min-width':'0','box-sizing':'border-box'
    });
    // Bottom edges use two independent rails, with a guaranteed center gap.
    dock($('#drive-box'), {
      position:'absolute',left:edge+'px',right:'auto',
      top:'auto',bottom,width:side,'max-width':side,
      'box-sizing':'border-box','flex-wrap':'nowrap','overflow':'hidden'
    });
    dock(skillHud, {
      position:'absolute',left:'auto',right:edge+'px',
      top:'auto',bottom,width:side,'max-width':side,
      transform:'none','box-sizing':'border-box','overflow':'visible',
      'pointer-events':'auto'
    });
    // Center strip remains below the ability art, not in the Q/E grid.
    const centerGap = Math.max(0,width - 2*(sideWidth+edge+12));
    const xpWidth = mobile ? Math.min(188,width-24) :
      Math.min(240,Math.max(105,centerGap-8));
    dock(xpButton, {
      position:'absolute',left:'50%',right:'auto',top:'auto',
      bottom:mobile&&touch?'calc(52px + env(safe-area-inset-bottom))':bottom,
      width:xpWidth+'px','max-width':xpWidth+'px',
      height:mobile?'46px':'50px','min-height':'0',
      transform:'translateX(-50%)',margin:'0',padding:'6px 10px 11px',
      'box-sizing':'border-box',display:'flex','flex-direction':'row',
      'align-items':'center','justify-content':'space-between',
      gap:'6px','white-space':'nowrap',overflow:'hidden',
      background:'rgba(10,22,34,0.18)',border:'0','border-radius':'5px',
      'clip-path':'none','pointer-events':'auto','z-index':'12',
      'font-variant-numeric':'tabular-nums'
    });
    for(const [node,basis] of [
      [$('#skill-level'),'52px'],[$('#skill-xp'),'86px'],[$('#skill-points'),'50px']
    ]) dock(node,{
      display:'block',position:'static',flex:'0 1 '+basis,
      'min-width':'0',overflow:'hidden','text-overflow':'ellipsis',
      'white-space':'nowrap','font-size':mobile?'9px':'11px',
      'line-height':'18px','text-align':'center'
    });
    dock($('#skill-xp-fill').parentElement, {
      position:'absolute',left:'7px',right:'7px',bottom:'3px',top:'auto',
      height:'4px',margin:'0',width:'auto',display:'block'
    });
    // Keep the two authored icons in a fixed grid without interfering with XP.
    const slots = $('#skill-ability-slots');
    dock(slots,{
      display:'grid','grid-template-columns':'repeat(2,minmax(0,1fr))',
      gap:'8px',width:'100%','box-sizing':'border-box'
    });
    for(const ability of slots.querySelectorAll('.skill-ability')){
      dock(ability,{
        'box-sizing':'border-box','min-width':'0','max-width':'100%',
        flex:'none','font-variant-numeric':'tabular-nums'
      });
    }
    // Critical notices stay within the right rail, above (not across) Q/E.
    for(const id of ['skill-drift','skill-effects']){
      dock($('#'+id), {
        left:'auto',right:'0',bottom:id==='skill-drift'?'calc(100% + 37px)':'calc(100% + 5px)',
        width:side,'max-width':side,'box-sizing':'border-box',
        'white-space':'nowrap',overflow:'hidden','text-overflow':'ellipsis',
        'font-size':mobile?'10px':'11px'
      });
    }
    dock(routeChoice,{
      position:'absolute',left:'50%',right:'auto',
      top:mobile?'36%':'30%',bottom:'auto',
      width:mobile?'calc(100% - 24px)':'min(400px,44%)',
      'max-width':'100%',transform:'translateX(-50%)',
      'box-sizing':'border-box'
    });
  };
  applyHudDock();
  window.addEventListener('resize', applyHudDock, {passive:true});

  let receiptKey = '', receiptUntil = 0;

  const baseHud = updateHud;
  updateHud = function(surface) {
    baseHud(surface);
    const playing = currentScene() === 'driving' && !launchIntro.active;
    objective.hidden = !playing; help.hidden = !playing || readRun().rawTime > 12;
    routeChoice.hidden = true;
    if (!playing || !course) return;
    const truckCondition = meters.get('truck-condition')?.value ?? 0;
    $('#truck-num').textContent = `${Math.round(truckCondition)}%`;
    $('#condition-box').classList.toggle('critical', truckCondition < 30 || (meters.get('fuel')?.value ?? 0) < 15);
    const run = readRun(); session.textContent = `${formatTime(run.rawTime)} ON THE ROAD`;
    if (!isContinuousFreight()) { receipt.hidden = true; return; }
    const f = freightState, model = freightHudModel(f, course?.generatorVersion===ROAD_V3_VERSION
      ?{progress:endlessHighwayProgress(course,readTruck().position)}:readTruck().position,
      meters.get('cargo-condition')?.value ?? 0, run.rawTime);
    $('#freight-state').textContent = model.status;
    $('#freight-cargo').textContent = model.transition ? (f.status === 'delivered' ? 'Next haul ahead' : 'Keep the journey going') : getCargoProfile(f.contract.profileId).label;
    $('#freight-next').textContent = model.next;
    $('#freight-mass').textContent = model.mass;
    $('#freight-advice').textContent = model.transition ? '' : f.onboard ? getCargoProfile(f.contract.profileId).handlingHint : 'Wide left: safe  /  Express right: bonus';
    // Follow the real road/sign contract. Do not display a fork simply because
    // the freight advice mentions the wide/express options.
    const route = LongHaulGuidance.relevantRouteChoice(course, course?.generatorVersion === ROAD_V3_VERSION
      ? endlessHighwayProgress(course, readTruck().position) : -readTruck().position.z, 270);
    const visibleFork = !model.transition && !f.onboard && route?.kind === 'loading-route' &&
      route.consistent && route.leadMeters < 270 &&
      ['left','right'].includes(route.sides.safe) &&
      ['left','right'].includes(route.sides.express) &&
      route.sides.safe !== route.sides.express;
    routeChoice.hidden = !visibleFork;
    if (visibleFork && routeChoice.dataset.routeId !== String(route.id)) {
      routeChoice.dataset.routeId = String(route.id);
      const safe = routeChoice.querySelector('.alternative-b-choice.safe');
      const express = routeChoice.querySelector('.alternative-b-choice.express');
      safe.querySelector('strong').firstChild.textContent = `WIDE ${route.sides.safe.toUpperCase()}`;
      express.querySelector('strong').firstChild.textContent = `EXPRESS ${route.sides.express.toUpperCase()}`;
      safe.querySelector('.alternative-b-arrow').style.transform = route.sides.safe === 'left' ? 'scaleX(-1)' : 'none';
      express.querySelector('.alternative-b-arrow').style.transform = route.sides.express === 'left' ? 'scaleX(-1)' : 'none';
    }
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
    // Base Presentation already writes the authoritative score; do not overwrite
    // its text a second time in the same frame (visible label oscillation).
    // Repeated ambient flavor is not an actionable warning.
    encounterHud.hidden = currentScene() !== 'driving' || launchIntro.active || /^OPEN ROAD|^RAIN/.test(arcadeEventLabel);
  };
  const baseSkillHud = updateSkillHud;
  let artSkillHudAt = -Infinity;
  updateSkillHud = function(now) {
    baseSkillHud(now);
    // The independent XP dock has the same lifecycle as the ability HUD.
    const xpDisplay = skillHud.hidden ? 'none' : 'flex';
    if (xpButton.style.display !== xpDisplay) xpButton.style.display = xpDisplay;
    if (skillHud.hidden || now - artSkillHudAt < 90) return;
    artSkillHudAt = now;
    const state = skillProgression.snapshot(), truck = readTruck(), pickups = drivingPickups.snapshot(), abilities = activeAbilities.snapshot();
    // Keep the base skills label as its single writer; no alternating copy.
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
    return (course?.generatorVersion === ROAD_GENERATOR_VERSION || course?.generatorVersion === ROAD_V3_VERSION) ? landscapeTint(seed, x, z, height) : oldColorAt(x, z, height, seed, forestDensity);
  };
  horizonDrop = atmosphericRollOff;
  const originalPatch = buildHorizonPatch;
  buildHorizonPatch = function(cell, focus) {
    const patch = originalPatch(cell, focus);
    if (course?.generatorVersion !== ROAD_GENERATOR_VERSION && course?.generatorVersion !== ROAD_V3_VERSION) return patch;
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
  // Procedural density volumes with Beer-Lambert extinction and sun-ray sampling.
  // Only 24 instanced box proxies; no toon material, billboards or dithering.
  const cloudGeometry=new THREE.BoxGeometry(2,2,2),count=profile.cloudBanks;
  const typeIds={cumulus:0,cumulonimbus:1,cirrus:2,stratus:3};
  const cloudTypes=new Float32Array(count),cloudVariations=new Float32Array(count);
  cloudGeometry.setAttribute('cloudType',new THREE.InstancedBufferAttribute(cloudTypes,1));
  cloudGeometry.setAttribute('cloudVariation',new THREE.InstancedBufferAttribute(cloudVariations,1));
  const cloudUniforms={
    cloudColor:{value:new THREE.Color(0xfff8ee)},
    cloudShadow:{value:new THREE.Color(0x8799ae)},
    sunColor:{value:new THREE.Color(0xffebcd)},
    sunDirection:{value:new THREE.Vector3(-.45,.82,-.34).normalize()},
    weather:{value:0},extinction:{value:2.2}
  };
  const cloudRainShadow=new THREE.Color(0x5e6c83);
  const cloudMaterial=new THREE.ShaderMaterial({
    uniforms:cloudUniforms,transparent:true,depthTest:true,depthWrite:false,
    side:THREE.FrontSide,fog:false,blending:THREE.NormalBlending,
    vertexShader:"\nattribute float cloudType,cloudVariation;\nuniform vec3 sunDirection;\nvarying vec3 vFace,vEye,vSun;\nvarying float vType,vSeed,vBacklit;\nvoid main(){\n  mat4 world=modelMatrix*instanceMatrix;\n  vec3 x=world[0].xyz,y=world[1].xyz,z=world[2].xyz;\n  float sx=max(length(x),.001),sy=max(length(y),.001),sz=max(length(z),.001);\n  x/=sx;y/=sy;z/=sz;\n  vec3 eye=cameraPosition-world[3].xyz;\n  vEye=vec3(dot(eye,x)/sx,dot(eye,y)/sy,dot(eye,z)/sz);\n  vSun=normalize(vec3(dot(sunDirection,x)/sx,dot(sunDirection,y)/sy,dot(sunDirection,z)/sz));\n  vBacklit=max(dot(normalize(world[3].xyz-cameraPosition),sunDirection),0.);\n  vFace=position;vType=cloudType;vSeed=cloudVariation;\n  gl_Position=projectionMatrix*viewMatrix*world*vec4(position,1.);\n  gl_Position.z=gl_Position.w*.99998;\n}",fragmentShader:"\nuniform vec3 cloudColor,cloudShadow,sunColor;\nuniform float extinction,weather;\nvarying vec3 vFace,vEye,vSun;\nvarying float vType,vSeed,vBacklit;\nfloat blob(vec3 p,vec3 c,vec3 r){\n  return 1.-smoothstep(.61,1.14,length((p-c)/r));\n}\nfloat densityAt(vec3 p){\n  if(any(greaterThan(abs(p),vec3(1.))))return 0.;\n  // Low-frequency deformation produces different, nonuniform silhouettes\n  // per bank while keeping the smooth density fade at proxy boundaries.\n  float curl=sin(p.x*4.7+p.z*3.9+vSeed*11.2);\n  vec3 sculpt=p+vec3(.11*curl,\n    .085*sin(p.y*5.1-p.z*3.6+vSeed*8.7),\n    .09*curl);\n  float shape=0.;\n  if(vType<.5){\n    shape=max(blob(sculpt,vec3(-.38,-.22,0.),vec3(.57,.46,.62)),\n              blob(sculpt,vec3(.27,-.14,.06),vec3(.60,.50,.61)));\n    shape=max(shape,blob(sculpt,vec3(-.08,.29,-.09),vec3(.47,.51,.48)));\n    shape=max(shape,blob(sculpt,vec3(.44,.14,-.05),vec3(.39,.42,.47)));\n  }else if(vType<1.5){\n    shape=max(blob(sculpt,vec3(0.,-.52,0.),vec3(.81,.31,.66)),\n              blob(sculpt,vec3(-.14,-.12,0.),vec3(.53,.52,.54)));\n    shape=max(shape,blob(sculpt,vec3(.05,.39,0.),vec3(.43,.55,.45)));\n    shape=max(shape,blob(sculpt,vec3(.18,.78,0.),vec3(.78,.16,.56)));\n  }else if(vType<2.5){\n    shape=max(blob(sculpt,vec3(-.36,.11,0.),vec3(.70,.13,.31)),\n              blob(sculpt,vec3(.35,.20,.03),vec3(.71,.11,.31)));\n    shape=max(shape,blob(sculpt,vec3(.03,-.10,-.1),vec3(.80,.09,.25)));\n  }else{\n    shape=max(blob(sculpt,vec3(-.41,-.09,0.),vec3(.67,.27,.69)),\n              blob(sculpt,vec3(.39,-.09,0.),vec3(.67,.25,.68)));\n    shape=max(shape,blob(sculpt,vec3(0.,.11,.09),vec3(.74,.18,.53)));\n  }\n  vec3 q=p*vec3(8.3,7.1,9.2)+vSeed*7.;\n  float large=sin(q.x*.57)*cos(q.y*.71)*sin(q.z*.63);\n  float small=sin(q.x*1.27+q.z*.68)*sin(q.y*1.21-q.z*.59);\n  float variability=clamp(.64+.31*large+.19*small,.14,1.);\n  float kind=vType<.5?1.0:(vType<1.5?1.22:(vType<2.5?.45:.75));\n  float boundary=1.-max(max(abs(p.x),abs(p.y)),abs(p.z));\n  float fade=smoothstep(0.,.14,boundary);\n  return shape*variability*kind*fade;\n}\nfloat lightThrough(vec3 p){\n  // Three density probes towards the actual directional light.\n  float tau=0.;\n  for(int j=0;j<3;j++){\n    p+=vSun*.26;\n    tau+=densityAt(p)*.26;\n  }\n  return exp(-extinction*1.7*tau);\n}\nvoid main(){\n  vec3 rd=normalize(vFace-vEye);\n  vec3 target=vec3(rd.x<0.?-1.:1.,rd.y<0.?-1.:1.,rd.z<0.?-1.:1.);\n  vec3 tfar=abs(target-vFace)/max(abs(rd),vec3(.00001));\n  float extent=max(0.,min(min(tfar.x,tfar.y),tfar.z));\n  if(extent<.0001)discard;\n  float stepLength=extent/12.;\n  float transmittance=1.,sunAtEdge=0.,edgeFound=0.;\n  vec3 lightAccum=vec3(0.),edgePoint=vFace;\n  for(int i=0;i<12;i++){\n    vec3 p=vFace+rd*(float(i)+.5)*stepLength;\n    float density=densityAt(p);\n    if(density>.015){\n      float lightT=lightThrough(p);\n      float absorption=1.-exp(-extinction*density*stepLength);\n      vec3 localColor=mix(cloudShadow,cloudColor,\n        clamp(.20+.68*lightT+.12*p.y,0.,1.));\n      localColor+=sunColor*(.08+.22*vBacklit)*lightT;\n      lightAccum+=transmittance*absorption*localColor;\n      transmittance*=1.-absorption;\n      if(edgeFound<.5){edgePoint=p;edgeFound=1.;}\n      sunAtEdge=max(sunAtEdge,lightT);\n      if(transmittance<.025)break;\n    }\n  }\n  float opacity=1.-transmittance;\n  if(opacity<.012)discard;\n  // Density-gradient rim: strongest at the translucent, sun-facing contour.\n  float e=.045;\n  vec3 grad=vec3(\n    densityAt(edgePoint+vec3(e,0.,0.))-densityAt(edgePoint-vec3(e,0.,0.)),\n    densityAt(edgePoint+vec3(0.,e,0.))-densityAt(edgePoint-vec3(0.,e,0.)),\n    densityAt(edgePoint+vec3(0.,0.,e))-densityAt(edgePoint-vec3(0.,0.,e)));\n  float rimNormal=pow(1.-abs(dot(normalize(grad+vec3(.00001)),rd)),3.);\n  float thinEdge=1.-smoothstep(.38,.97,opacity);\n  float silverRim=rimNormal*thinEdge*sunAtEdge*(.18+1.3*vBacklit);\n  vec3 shaded=lightAccum/max(opacity,.001)+sunColor*silverRim*.85;\n  gl_FragColor=vec4(shaded,opacity);\n  #include <tonemapping_fragment>\n  #include <colorspace_fragment>\n}"
  });
  const cloudMesh=new THREE.InstancedMesh(cloudGeometry,cloudMaterial,count);
  cloudMesh.name='cloud-volumes';
  cloudMesh.renderOrder=10;cloudMesh.frustumCulled=false;
  const cloudDummy=new THREE.Object3D();
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
  const cloudLayerCounts=[0,0,0];
  // Three ranges: sky alongside the road, overhead approaches, distant backdrop.
  // Slots are in truck-relative world coordinates; heading never rotates them.
  const cloudBankSlots=[
    [[-500,-430],[-290,-180],[-60,-370],[290,-310],
     [500,-570],[-550,-780],[120,210],[390,270]],
    [[-800,-780],[-480,-1040],[-150,-1110],[200,-1010],
     [580,-870],[820,-620],[-330,490],[380,620]],
    [[-1130,-1280],[-810,-1480],[-420,-1530],[0,-1460],
     [460,-1500],[840,-1410],[1120,-1230],[60,1110]]
  ];
  const cloudDriftDepth=[.12,.045,.012],cloudLoopDepth=[1800,2600,3400];
  const cloudTypeNames=['cumulus','cumulonimbus','cirrus','stratus'];
  function ensureCloudLayout(seed){
    const nextSeed=typeof seed==='string'&&seed.length?seed:'long-haul-sky';
    if(nextSeed===cloudSeed)return;
    cloudDescriptors=cloudBankDescriptors(nextSeed);
    if(cloudDescriptors.length!==count)throw Error('Cloud bank count mismatch');
    cloudLayerCounts.fill(0);
    for(const bank of cloudDescriptors){
      cloudLayerCounts[bank.layer]++;
      cloudTypes[bank.id]=typeIds[bank.type];
      cloudVariations[bank.id]=bank.variation;
    }
    cloudGeometry.attributes.cloudType.needsUpdate=true;
    cloudGeometry.attributes.cloudVariation.needsUpdate=true;
    cloudSeed=nextSeed;cloudLayoutUpdates++;cloudLastUpdate=-Infinity;
  }
  function positionClouds(state,seconds){
    // A slow, repeating approach lets the truck drive beneath nearby banks.
    // Drift stays independent of camera or steering; the sky never billboards.
    cloudForwardProgress=course?.generatorVersion===ROAD_V3_VERSION
      ?Math.max(0,endlessHighwayProgress(course,state.position))
      :Math.max(0,-state.position.z);
    for(const bank of cloudDescriptors){
      const slot=bank.id%profile.cloudBanksPerLayer;
      const layer=bank.layer;
      const base=cloudBankSlots[layer][slot];
      const jitterX=(bank.variation-.5)*155;
      const jitterZ=(bank.variation-.5)*175;
      const wind=seconds*bank.wind+[.0025,.001,.00035][layer]*cloudForwardProgress;
      const span=cloudLoopDepth[layer];
      const advance=cloudForwardProgress*cloudDriftDepth[layer];
      // Recycle banks behind the truck into the distant forward sky.
      const z=((base[1]+jitterZ+advance+span*.5)%span+span)%span-span*.5;
      const x=base[0]+jitterX+wind;
      const nearBank=layer===0;
      const cloudHeight=bank.altitude*.66
        +(nearBank?60:0)
        -(bank.type==='cumulonimbus'?bank.height*.22:0);
      cloudDummy.position.set(x,cloudHeight,z);
      cloudDummy.rotation.set(0,bank.variation*Math.PI*2,0);
      // Broad banks at varied depths, without raising their existing crowns.
      const widthScale=[.91,1.13,1.32][layer];
      const depthScale=[.61,.48,.42][layer];
      const heightScale=bank.type==='cumulonimbus'?.67:.74;
      cloudDummy.scale.set(bank.width*widthScale,bank.height*heightScale,
        bank.width*depthScale);
      cloudDummy.updateMatrix();
      cloudMesh.setMatrixAt(bank.id,cloudDummy.matrix);
    }
    cloudMesh.instanceMatrix.needsUpdate=true;
  }
  clouds.add(cloudMesh);
  ensureCloudLayout(activeCloudSeed());
  scene.fog=new THREE.Fog(0xf1cca4,profile.clearNear,profile.clearFar);
  const fill=new THREE.DirectionalLight(0xb6d9ff,.65);worldRoot.add(fill,fill.target);
  const colors={clearTop:new THREE.Color(0x697fae),rainTop:new THREE.Color(0x586d89),
    clearHorizon:new THREE.Color(0xffd29b),rainHorizon:new THREE.Color(0xb9c7cf),
    clearFog:new THREE.Color(0xebc8a4),rainFog:new THREE.Color(0xafc0c9),
    clearCloud:new THREE.Color(0xf8f8f4),rainCloud:new THREE.Color(0xc9d0de)};
  const groundColor=new THREE.Color(0x557568),sunColor=new THREE.Color(0xffd69b);
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
    cloudUniforms.cloudShadow.value.set(0x8799ae).lerp(cloudRainShadow,weather);
    cloudUniforms.sunDirection.value.copy(sun.position).sub(sun.target.position).normalize();
    cloudUniforms.sunColor.value.copy(sun.color);
    cloudUniforms.weather.value=weather;
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
  window.LongHaulPresentation={getState:()=>({version:1,cloudBanks:profile.cloudBanks,cloudLobes:0,cloudSdfInstances:count,cloudTypes:cloudTypeNames,cloudDrawCalls:1,cloudPositioning:'world-bearing-sky',cloudTurnInfluence:0,cloudLayers:cloudLayerCounts.slice(),cloudForwardProgress,cloudDepthPolicy:'sky-first-landscape-overdraw',cloudGeometry:'beer-lambert-variable-density',cloudLobeInstances:0,cloudVisibilityScale:[1,1,1],cloudSeed,cloudRunNumber,cloudLayoutUpdates,
    oldCloudSheets:cloudRoot.parent!==null,fog:{near:scene.fog.near,far:scene.fog.far,color:scene.fog.color.getHexString()},
    hud:'four-corner-contextual',terrain:'shared-worker-and-horizon',contactShadow:shadow.visible})};
  window.__longHaulVisualsReady=true;
})();
