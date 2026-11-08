// Endless road host adapter. Loaded after the established host, before user
// entry is enabled. Campaign and the generated base runtime remain untouched.
(() => {
  const isV3 = () => course?.generatorVersion === ROAD_V3_VERSION && course?.terrainAware;
  const isModular = () => course?.generatorVersion === ROAD_GENERATOR_VERSION || isV3();
  // Explicit opt-in for *new* sessions. Resume always honors the checkpoint's
  // actual generator. The legacy format and untouched V2 default remain safe.
  const roadOptIn = /(?:^|[?&])road=v3(?:&|$)/.test(typeof location === 'undefined' ? '' : location.search);
  const previousPoint = endlessHighwayPoint, previousProgress = endlessHighwayProgress;
  const previousAdvance = advanceEndlessHighway;
  endlessHighwayPoint = function(source,progress,lateral=0,route='safe') {
    return source?.generatorVersion === ROAD_V3_VERSION
      ? playableRoadV3Point(source,progress,lateral,route)
      : previousPoint(source,progress,lateral,route);
  };
  endlessHighwayProgress = function(source,position) {
    if(source?.generatorVersion !== ROAD_V3_VERSION)return previousProgress(source,position);
    const hint=Number.isFinite(source?.endless?.furthestProgress)?source.endless.furthestProgress:null;
    return playableRoadV3Progress(source,position,hint)??0;
  };
  advanceEndlessHighway = function(source,positionOrProgress) {
    return source?.generatorVersion === ROAD_V3_VERSION
      ? advancePlayableRoadV3Course(source,positionOrProgress)
      : previousAdvance(source,positionOrProgress);
  };
  generateEndlessCourse = function(seed) {
    const saved = freightResumeCheckpoint, progress=saved?.journey.progress ?? 0;
    const generatorVersion=saved ? saved.journey.generatorVersion ?? LEGACY_ROAD_VERSION
      : roadOptIn ? ROAD_V3_VERSION : ROAD_GENERATOR_VERSION;
    const value=generatorVersion===ROAD_V3_VERSION
      ? engine.n.longHaulRoadV3.buildPlayable(seed,{progress})
      : createEndlessHighway(seed,{progress,generatorVersion});
    if(saved)value.origin={...value.origin,...saved.truck.position,heading:saved.truck.heading};
    return value;
  };

  const previousRibbon = ribbonGeometry;
  ribbonGeometry = function(roads, widthScale, yOffset) {
    if (!roads.length || !roads[0].modular) return previousRibbon(roads, widthScale, yOffset);
    const data = roadRibbonData(roads, widthScale, yOffset), geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
    geometry.setIndex(data.indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
    return geometry;
  };

  // Batch small paint ribbons by material. Each endpoint uses the same normal
  // and lane profile as the surface, including between independently owned cells.
  const previousLine = _lhRoadLine;
  _lhRoadLine = function(group, segment, offset, width, material, dashed = false) {
    if (!segment.modular) return previousLine(group, segment, offset, width, material, dashed);
    if (dashed && Math.floor((segment.a.progress + .01) / 10) % 2) return;
    const points = [segment.a, segment.b], vertices = [];
    for (const p of points) {
      const taper = clamp((p.laneFactor - 3) / 2, 0, 1), five = segment.laneCount === 5;
      const edgeLine = five && Math.abs(offset) > 8;
      const outer = five && Math.abs(Math.abs(offset) - 5.1) < .1 && dashed;
      const lateral = edgeLine ? Math.sign(offset) * p.laneFactor * 1.7 : offset;
      const paintWidth = outer ? width * taper : width;
      for (const side of [-1, 1]) {
        // Existing markings use the opposite lateral normal to highway points.
        const v = -lateral + side * paintWidth / 2;
        vertices.push(p.x + p.nx * v, p.y + .145 + p.bank * v, p.z + p.nz * v);
      }
    }
    const queue = group.userData.roadPaint ??= new Map();
    const batch = queue.get(material) ?? { positions: [], indices: [] }, n = batch.positions.length / 3;
    batch.positions.push(...vertices); batch.indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); queue.set(material, batch);
  };
  const concrete = new THREE.MeshStandardMaterial({ color: 0x798084, roughness: .94 });
  const rail = new THREE.MeshStandardMaterial({ color: 0xc4c7b9, roughness: .62 });
  const warmLight = new THREE.MeshBasicMaterial({ color: 0xffdc8e });

  function structure(entry, segment, visualOnly) {
    const a = segment.a, b = segment.b, feature = a.structure;
    if (segment.chunk?.kind === 'construction' && segment.type === 'endless-highway' && Math.round(a.progress / 5) % 6 === 0 && a.laneFactor < 3.4) {
      for (const side of [-1, 1]) {
        const x = a.x + a.nx * side * 6.6, z = a.z + a.nz * side * 6.6;
        entry.group.add(mesh(geometries.cone, materials.yellow, { x, y: a.y + .65, z }, { x: .38, y: 1.1, z: .38 }));
        if (!visualOnly) entry.obstacles.push({ id: `${segment.id}:cone:${side}`, x, z, y: a.y, height: 1.3, radius: .4, kind: 'lane-hazard' });
      }
    }
    if (!['bridge','tunnel'].includes(feature) || b.structure !== feature) return;
    const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz), heading = Math.atan2(dx, dz);
    const x = (a.x + b.x) / 2, z = (a.z + b.z) / 2, y = (a.y + b.y) / 2 + .12;
    const nx = (a.nx + b.nx) / 2, nz = (a.nz + b.nz) / 2, width = (a.width + b.width) / 2;
    const bank = (a.bank + b.bank) / 2;
    const addBox = (lateral, height, sx, sy, sz, material = concrete) => {
      const item = mesh(geometries.box, material, { x: x + nx * lateral, y: y + height + bank * lateral, z: z + nz * lateral }, { x: sx, y: sy, z: sz }, { y: heading });
      item.rotation.order = 'YXZ'; item.rotation.x = -Math.atan2(b.y - a.y, length); item.receiveShadow = true; entry.group.add(item); return item;
    };
    if (feature === 'bridge') {
      addBox(0, -.55, width * 1.12, .85, length + .08);
      for (const side of [-1, 1]) addBox(side * (width / 2 + 1), .62, .36, 1.05, length + .1, rail);
      if (Math.round(a.progress / 5) % 8 === 0) {
        for (const side of [-1, 1]) addBox(side * width * .29, -5, 1.5, 9, 2.2);
      }
    } else {
      // A covered mountain gallery with open portals, not a decorative facade.
      for (const side of [-1, 1]) addBox(side * (width / 2 + 1.2), 4.1, 1.1, 8.2, length + .08);
      addBox(0, 8.6, width + 3.5, .8, length + .08);
      if (Math.round(a.progress / 5) % 4 === 0) addBox(0, 8.12, .7, .08, 2, warmLight);
    }

  }
  const priorRealize = realizeCell;
  realizeCell = function(patch, options = {}) {
    priorRealize(patch, options);
    const entry = cellHosts.get(patch.cellId); if (!entry || !isModular()) return;
    for (const [material, data] of entry.group.userData.roadPaint ?? []) {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
      geometry.setIndex(data.indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
      entry.owned.geometries.push(geometry); entry.group.add(new THREE.Mesh(geometry, material));
    }
    delete entry.group.userData.roadPaint;
    for (const segment of patch.roads) structure(entry, segment, options.visualOnly);
    if (!options.visualOnly) refreshObstacles();
    batchCellStatics(entry);
  };

  // No jumps under a roof, roadblocks in a lane taper, or garage entrances on
  // elevated structures. The underlying challenge/deadline systems are retained.
  const priorPlan = planFreightEncounters;
  planFreightEncounters = function() {
    const events = priorPlan(); if (!isModular()) return events;
    return events.filter(event => {
      const feature = roadChunkAt(course.seed, event.absoluteProgress);
      return !['bridge', 'tunnel', 'lane-transition', 'construction'].includes(feature.kind);
    });
  };
  const priorProtected = freightProtectedProgress;
  freightProtectedProgress = function(progress) {
    if (priorProtected(progress)) return true;
    if (!isModular()) return false;
    const chunk = roadChunkAt(course.seed, progress), t = (progress - chunk.start) / chunk.length;
    return chunk.branch && (t < .18 || t > .82);
  };
  const priorGarageSite = arcadeGarageSite;
  arcadeGarageSite = function(edge, fraction, side) {
    if (edge.modular && ['bridge', 'tunnel', 'lane-transition', 'construction'].includes(edge.chunk?.kind)) return null;
    return priorGarageSite(edge, fraction, side);
  };

  const priorTraffic = arcadeTrafficUpdate;
  arcadeTrafficUpdate = function(dt) {
    if (simulationFrozen()) return priorTraffic(dt);
    if (isModular()) {
      // Reserve three through lanes throughout the run, so disappearing outer
      // lanes never force AI cars into each other or into a loading approach.
      for (let i = 0; i < arcadeVehicles.length; i++) {
        const v = arcadeVehicles[i];
        if (v.active && v.roadLaneId !== v.id) {
          const hazard = arcadeEncounters.find(event => event.path === v.path && Math.abs(event.distance - v.progress) < 100);
          // Keep the original spawn's ramp / roadblock escape lane. These
          // encounters are excluded from tapers and narrow structures above.
          if (!hazard || !['ramp', 'roadblock'].includes(hazard.kind)) v.lane = ((i % 3) - 1) * 3.4;
          v.roadLaneId = v.id;
        }
      }
    }
    priorTraffic(dt);
    if (isModular()) for (const v of arcadeVehicles) if (v.active && v.group.visible) {
      const p = isV3() ? endlessHighwayPoint(course, endlessHighwayProgress(course,v.group.position)) : roadChunkSample(course.seed, -v.group.position.z);
      v.group.rotation.order = 'YXZ';
      v.group.rotation.x = -Math.atan(p.grade) * (v.direction < 0 ? -1 : 1);
      v.group.rotation.z = Math.atan(p.bank) * (v.direction < 0 ? -1 : 1);
    }
  };

  // The regular chase camera sits above the gallery roof. Ease it inside
  // before the portal rather than changing the player's selected camera mode.
  const priorCameraTarget = updateCameraTarget;
  updateCameraTarget = function(state, surface) {
    const progress = isV3() ? endlessHighwayProgress(course,state.position) : -state.position.z, chunk = isModular() && roadChunkAt(course.seed, progress);
    const t = chunk ? (progress - chunk.start) / chunk.length : 0;
    if (!chunk || chunk.kind !== 'tunnel' || cameraMode !== 0 || t <= .08 || t >= .94) return priorCameraTarget(state, surface);
    const ease = value => { const x = clamp(value, 0, 1); return x * x * (3 - 2 * x); };
    const blend = ease((t - .08) / .1) * ease((.94 - t) / .1);
    const speed = Math.hypot(state.velocity?.x ?? 0, state.velocity?.z ?? 0);
    const distance = (22 + clamp(speed / 48, 0, 1) * 7) * (1 - blend) + 18 * blend;
    const eye = isV3() ? endlessHighwayPoint(course,progress-distance) : roadChunkSample(course.seed, progress-distance), look = isV3() ? endlessHighwayPoint(course,progress+24) : roadChunkSample(course.seed,progress+24);
    smoothing.setTarget('player-camera', {
      position: [eye.x + eye.nx * 1.2, eye.y + 5.8 + 5.5 * (1 - blend), eye.z + eye.nz * 1.2],
      lookPoint: [look.x, look.y + 2.8, look.z], fov: 60, mode: 'chase'
    });
  };

  const priorPost = postTickGameplay;
  let previousRoadPosition = null, lastStructureImpact = -Infinity, structureRun = null;
  postTickGameplay = function(surface, dt) {
    if (isModular() && !simulationFrozen() && currentScene() === 'driving') {
      if (structureRun !== runKey) { structureRun = runKey; previousRoadPosition = null; lastStructureImpact = -Infinity; }
      const truck = readTruck(), progress = isV3() ? endlessHighwayProgress(course,truck.position) : -truck.position.z, p = isV3() ? {...endlessHighwayPoint(course,progress),chunkId:roadChunkAt(course.seed,progress).id} : roadChunkSample(course.seed,progress);
      const contact = resolveRoadStructureContact(truck, previousRoadPosition, p);
      if (contact) {
        const { contacts, strength, ...resolved } = contact;
        engine.n.longHaulTruck.loadSnapshot({ ...engine.n.longHaulTruck.snapshot(), ...resolved });
        const now = readRun().rawTime;
        if (strength > 2 && now - lastStructureImpact > .7) {
          lastStructureImpact = now; spendTruckDamage(Math.min(12, 3 + strength * .25), 'road-structure');
          spendCargoDamage(2, 'road-structure'); resetArcadeCombo(contacts.includes('roof') ? 'ROOF CONTACT' : 'BARRIER CONTACT'); audio.hit();
          arcadeRecord('road-structure-contact', { contacts, strength, chunk: p.chunkId });
        }
      }
      previousRoadPosition = { ...readTruck().position };
    } else if (!isModular()) { previousRoadPosition = null; structureRun = null; }
    return priorPost(surface, dt);
  };
  const priorHorizon = realizeHorizonCell;
  realizeHorizonCell = function(patch) {
    priorHorizon(patch); if (!isModular() || isV3()) return;
    const geometry = horizonHosts.get(patch.cellId)?.group.userData.roadGeometry;
    if (!geometry) return;
    const positions = geometry.getAttribute('position'), profile = engine.n.longHaulWorldProfile.getState();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i), p = roadChunkSample(course.seed, -z);
      positions.setY(i, p.y - horizonDrop(Math.hypot(x - patch.focus.x, z - patch.focus.z), profile) + 1.1);
    }
    positions.needsUpdate = true; geometry.computeBoundingSphere();
  };
  const baseText = render_game_to_text;
  window.render_game_to_text = () => {
    const value = JSON.parse(baseText());
    if (isModular()) {const progress=isV3()?endlessHighwayProgress(course,readTruck().position):-readTruck().position.z;value.road={generatorVersion:course.generatorVersion,feature:roadChunkAt(course.seed,progress),retainedFeatures:course.roadChunks.length,progress,terrainAware:isV3()};}
    return JSON.stringify(value);
  };
  window.__longHaulRoadsReady = true;
})();
