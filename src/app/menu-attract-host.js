/* TLH-257/258/259: visual-only cinematic title. The actual roads are sampled
 * from Road Corridor's canonical deterministic function. This host never
 * modifies `course`, NexusEngine tick, freight, input, or persisted state.
 * No second render loop; the established frame invokes this once per frame. */
(() => {
  'use strict';
  try {
    const seed = 'the-long-haul:title:straight-v1';
    const title = document.querySelector('#title-screen');
    const holder = new THREE.Group(); holder.name = 'LH_TitleRoadAttract';
    holder.visible = false; worldRoot.add(holder);
    const shade = {
      earth: new THREE.MeshLambertMaterial({color:0x765341,side:THREE.DoubleSide,depthWrite:true}),
      shoulder: new THREE.MeshLambertMaterial({color:0x9a6f45,side:THREE.DoubleSide}),
      road: new THREE.MeshLambertMaterial({color:0x273747,side:THREE.DoubleSide}),
      yellow: new THREE.MeshBasicMaterial({color:0xffbd42,side:THREE.DoubleSide}),
      white: new THREE.MeshBasicMaterial({color:0xffe7c5,side:THREE.DoubleSide})
    };
    // Reuse the existing plane geometry for ground. Highway ribbons use the
    // shipped roadRibbonData sampler, never a new terrain/road model recipe.
    const earth = new THREE.Mesh(geometries.plane, shade.earth);
    earth.rotation.x = -Math.PI / 2; earth.scale.set(2000,2000,1);
    earth.renderOrder = -5;holder.add(earth);
    const roadMeshes = [];
    let sampleCount = 0, travel = -760, builtAt = Infinity, previous = null, enabled = false;
    let authored = null;
    try {
      authored = createHeroTruckMesh({THREE, materials, createTruckGrounding});
      authored.root.name = 'LH_TitleExistingHero'; authored.root.visible = false;
      worldRoot.add(authored.root);
    } catch (error) {
      console.warn('Menu hero reuses existing title truck fallback', error);
    }
    function ribbon(parts, color, widthScale=1, yOffset=0, shift=0) {
      if (!parts.length) return;
      const moved = shift === 0 ? parts : parts.map(({a,b})=>({
        a:{...a,x:a.x+a.nx*shift,z:a.z+a.nz*shift,width:.22},
        b:{...b,x:b.x+b.nx*shift,z:b.z+b.nz*shift,width:.22}
      }));
      const data = roadRibbonData(moved, shift === 0 ? widthScale : 1, yOffset);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute(data.uvs,2));
      g.setIndex(data.indices);g.computeVertexNormals();
      const mesh = new THREE.Mesh(g,shade[color]);mesh.frustumCulled = false;
      holder.add(mesh);roadMeshes.push(mesh);
    }
    function disposeRibbons(){for(const mesh of roadMeshes.splice(0)){mesh.removeFromParent();mesh.geometry.dispose();}}
    function rebuild(progress){
      // The negative-progress approach is a canonical straight highway. It
      // extends indefinitely without loading the player's saved journey.
      const nearest = Math.floor((progress + 190)/20)*20;
      const start = nearest - 1080, end = nearest + 360;
      const strips = [], dashes=[];
      let last=roadChunkSample(seed,start);
      for(let s=start+20;s<=end;s+=20){
        const next=roadChunkSample(seed,s); const strip={a:last,b:next};
        strips.push(strip);
        if(Math.floor(s/20)%3!==0)dashes.push(strip);
        last=next;
      }
      disposeRibbons();
      ribbon(strips,'shoulder',1.35,-.13);
      ribbon(strips,'road',1,.02);
      ribbon(strips,'yellow',.01,.09);
      for(const lane of [-10.2,-6.8,-3.4,3.4,6.8,10.2])ribbon(dashes,'white',1,.1,lane);
      builtAt=progress; sampleCount+=1;
    }
    function update(now){
      const active = currentScene() === 'title' && title?.classList.contains('active');
      const dt = previous===null?0:Math.min(.05,Math.max(0,(now-previous)/1000));previous=now;
      if(!active){
        holder.visible = false;
        if(authored)authored.root.visible=false;
        if(enabled){disposeRibbons();builtAt=Infinity; enabled=false;}
        return;
      }
      enabled=true; holder.visible=true;
      // `settings.motion` includes the system reduced-motion preference.
      const moving = settings.motion && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if(moving) travel -= dt*23;
      if(Math.abs(builtAt-travel)>85)rebuild(travel);
      const point = roadChunkSample(seed,travel), ahead=roadChunkSample(seed,travel-14);
      const heading=Math.atan2(ahead.x-point.x,ahead.z-point.z);
      earth.position.set(point.x,point.y-.28,point.z);
      const truck = authored?.root || arcadeMenuTruck;
      truck.visible=true;
      if(authored)arcadeMenuTruck.visible=false;
      truck.position.set(point.x,point.y+.38,point.z);
      truck.rotation.set(0,heading,0);
      // Animate the existing authored wheel pivots without changing dynamics.
      if (moving && authored?.wheels) for (const wheel of authored.wheels) wheel.rotateY(-dt * 23 / .85);
      // Camera to truck's right puts the hero on the left of the centered UI.
      camera.position.set(point.x+10,point.y+7.2,point.z-24);
      camera.lookAt(point.x+1,point.y+2.6,point.z+23);
      const atmosphere=worldRoot.getObjectByName('illustrated-atmosphere');
      if(atmosphere)atmosphere.position.set(point.x,0,point.z);
    }
    const previousFrame=arcadeVisualFrame;
    arcadeVisualFrame=function titleAttractFrame(now){previousFrame(now);update(now);};
    window.LongHaulTitleAttract={getState:()=>({active:enabled,moving:enabled&&settings.motion,progress:travel,roadRebuilds:sampleCount,meshCount:roadMeshes.length,hero:authored?'existing-authored-hero':'existing-menu-fallback',saveWrites:0})};
  } catch(error) {
    console.warn('Cinematic title unavailable; original game remains playable',error);
  }
})();
