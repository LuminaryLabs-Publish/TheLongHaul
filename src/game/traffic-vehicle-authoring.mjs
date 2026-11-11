// The Long Haul / n:authoring:art vehicle-source adapter.
// Product-owned mesh/material/assembly recipes; never mutate traffic physics.
// The browser bundle does not install the optional Nexus Authoring Project runtime.
// Canonical n:authoring project/GLB publication is a separate authoring gate.
const PI = Math.PI;
export const TRAFFIC_FLEET_SOURCE = Object.freeze({
  id: 'long-haul:traffic-fleet:v1',
  authoringPaths: Object.freeze(['n:authoring:mesh', 'n:authoring:material', 'n:authoring:assembly', 'n:authoring:art']),
  style: 'illustrated-3d/toon-4-band',
  reference: '2026-11-04 six-vehicle approved concept lineup',
  physicalAuthority: 'unchanged:ARCADE_TRAFFIC_COLLIDERS',
  materialAuthority: 'illustrated-host/gradient-map',
  vehicleIds: Object.freeze(['sedan','muscle','pickup','van','suv','box']),
});
// Collision class 0=car, 1=pickup, 2=box truck, 3=semi. The visual
// dimensions fit within the existing generous collision footprints.
export const TRAFFIC_FLEET_PROFILES = Object.freeze({
  sedan:  Object.freeze({id:'sedan',  category:'compact sedan',kind:0,length:4.65,width:2.18,height:2.08,wheelRadius:.49,paint:0x237fe2,accent:0xbeeafa,cab:'sedan'}),
  muscle: Object.freeze({id:'muscle', category:'muscle coupe',kind:1,length:5.64,width:2.48,height:1.98,wheelRadius:.55,paint:0xd52d37,accent:0xed8b50,cab:'muscle'}),
  pickup: Object.freeze({id:'pickup', category:'crew-cab pickup',kind:2,length:7.32,width:2.55,height:2.60,wheelRadius:.62,paint:0x20884b,accent:0x75d09a,cab:'pickup'}),
  van:    Object.freeze({id:'van',    category:'high-roof cargo van',kind:2,length:7.33,width:2.53,height:3.22,wheelRadius:.61,paint:0xf4a91f,accent:0xffdf88,cab:'van'}),
  suv:    Object.freeze({id:'suv',    category:'rugged SUV',kind:1,length:5.78,width:2.47,height:2.58,wheelRadius:.56,paint:0x8b41d1,accent:0xc8a7ff,cab:'suv'}),
  box:    Object.freeze({id:'box',    category:'medium box truck',kind:3,length:10.72,width:2.86,height:4.21,wheelRadius:.67,paint:0x0f979c,accent:0x90dbd4,cab:'box'}),
});
const trimPalette=Object.freeze({cream:0xffe4b6, frame:0x18232e, chrome:0xc4d3df, steel:0x748b9c,
  glass:0x244f72,glassHighlight:0x6baccf, rubber:0x19232a,sidewall:0x33414c,
  light:0xffe9c3,amber:0xffb548,tail:0xe94743, wood:0x977048,grille:0x121b25});
// Read-only, bounded selections. Distinct body styles share old collision classes.
export function trafficVariantForClass(kind, index, spawnSerial = 0) {
  if (kind === 0) return 'sedan';
  if (kind === 1) return (Math.floor(spawnSerial / 2) + index) % 2 ? 'suv' : 'muscle';
  if (kind === 2) return (Math.floor(spawnSerial / 2) + index) % 2 ? 'van' : 'pickup';
  if (kind === 3) return 'box';
  throw new RangeError(`Unknown traffic collision class: ${kind}`);
}

export function createTrafficVehicleFactory({THREE, materials}) {
  if (!THREE?.MeshToonMaterial || !THREE?.BufferGeometry || !THREE?.ExtrudeGeometry ||
      !materials?.truckRed)
    throw new Error('Traffic Authoring requires the existing illustrated Three.js host and four-band ramp');
  const ownedMaterials=[], shapes=new Map(), templates=new Map(), palette=new Map(), breakupTemplates=new Map();
  const gradient=materials.truckRed.gradientMap||new THREE.DataTexture(new Uint8Array([70,130,195,255]),4,1,THREE.RedFormat);
  gradient.minFilter=THREE.NearestFilter;gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
  const tone=(hex,extra={})=>{
    const key=`${hex}:${extra.emissive||0}:${extra.emissiveIntensity||0}`;
    if(palette.has(key))return palette.get(key);
    const mat=new THREE.MeshToonMaterial({color:hex,gradientMap:gradient,fog:true,side:THREE.DoubleSide,...extra});
    (mat.userData??={}).lhCelKind='vehicle';ownedMaterials.push(mat);palette.set(key,mat);return mat;
  };
  const defaults={};for(const [k,v] of Object.entries(trimPalette)){
    const extra=k==='light'?{emissive:0xfabe78,emissiveIntensity:.46}:
      k==='amber'?{emissive:0x9d4d11,emissiveIntensity:.4}:
      k==='tail'?{emissive:0x90211d,emissiveIntensity:.35}:{};
    defaults[k]=tone(v,extra);
  }
  const shared=(key,producer)=>{if(!shapes.has(key))shapes.set(key,producer());return shapes.get(key)};
  function roundedBox(w,h,d,b=.055){
    b=Math.min(b,w*.20,h*.20,d*.20);const key=`box:${w}:${h}:${d}:${b}`;
    return shared(key,()=>{
      const iw=w-2*b,ih=h-2*b,rr=Math.min(b*2,iw*.22,ih*.22),x=iw/2,y=ih/2;
      const s=new THREE.Shape();s.moveTo(-x+rr,-y);s.lineTo(x-rr,-y);s.quadraticCurveTo(x,-y,x,-y+rr);
      s.lineTo(x,y-rr);s.quadraticCurveTo(x,y,x-rr,y);s.lineTo(-x+rr,y);
      s.quadraticCurveTo(-x,y,-x,y-rr);s.lineTo(-x,-y+rr);
      s.quadraticCurveTo(-x,-y,-x+rr,-y);
      const depth=Math.max(.003,d-2*b),g=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,
        bevelThickness:b,bevelSize:b,bevelSegments:1,curveSegments:2});g.translate(0,0,-depth/2);return g;
    });
  }
  const cylinder=(r,depth,n=16)=>shared(`cyl:${r}:${depth}:${n}`,()=>new THREE.CylinderGeometry(r,r,depth,n));
  const torus=(r,t,n=20)=>shared(`torus:${r}:${t}:${n}`,()=>new THREE.TorusGeometry(r,t,5,n));
  const panel=(points,depth=.014)=>shared(`panel:${JSON.stringify(points)}:${depth}`,()=>{
    const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:false});g.translate(0,0,-depth/2);return g;
  });
  // Cross-section loft: authored layered body with faceted bevels and a clean
  // silhouette, rather than one stretched primitive box.
  function bodyLoft(stations){
    return shared(`loft:${JSON.stringify(stations)}`,()=>{
      const verts=[],tri=[],N=10;
      for(const [z,w,base,shoulder,top,roof] of stations){
        for(const [x,y] of [[-w*.86,base],[w*.86,base],[w,base+.16],[w,shoulder],
          [roof,top-.12],[roof*.85,top],[-roof*.85,top],[-roof,top-.12],[-w,shoulder],[-w,base+.16]])verts.push(x,y,z);
      }
      for(let i=0;i<stations.length-1;i++)for(let k=0;k<N;k++){
        const a=i*N+k,b=i*N+(k+1)%N,c=(i+1)*N+k,d=(i+1)*N+(k+1)%N;
        tri.push(a,c,b,b,c,d);
      }
      for(let k=1;k<N-1;k++){tri.push(0,k,k+1);const off=(stations.length-1)*N;tri.push(off,off+k+1,off+k)}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(tri);g.computeVertexNormals();return g;
    });
  }
  function arch(radius,thickness=.15){
    return shared(`arch:${radius}:${thickness}`,()=>{
      const path=new THREE.Shape();const segments=14,outer=radius*1.24,inner=radius*1.045;
      for(let i=0;i<=segments;i++){const a=PI*i/segments;
        const z=Math.cos(a)*outer,y=Math.sin(a)*outer;
        if(i===0)path.moveTo(z,y);else path.lineTo(z,y);
      }
      for(let i=segments;i>=0;i--){const a=PI*i/segments;path.lineTo(Math.cos(a)*inner,Math.sin(a)*inner)}
      path.closePath();const g=new THREE.ExtrudeGeometry(path,{depth:thickness,steps:1,bevelEnabled:false});
      g.translate(0,0,-thickness/2);return g;
    });
  }
  // Avoid a second Mesh owner per greeble: authored primitive parts bake by
  // material into a bounded set of static GPU meshes at presentation time.
  function transform(v,position,rotation,scale){
    let [x,y,z]=v;const [sx,sy,sz]=scale;x*=sx;y*=sy;z*=sz;
    const [rx,ry,rz]=rotation;
    if(rx){const a=y*Math.cos(rx)-z*Math.sin(rx);z=y*Math.sin(rx)+z*Math.cos(rx);y=a}
    if(ry){const a=x*Math.cos(ry)+z*Math.sin(ry);z=-x*Math.sin(ry)+z*Math.cos(ry);x=a}
    if(rz){const a=x*Math.cos(rz)-y*Math.sin(rz);y=x*Math.sin(rz)+y*Math.cos(rz);x=a}
    return [x+position[0],y+position[1],z+position[2]];
  }
  function bakeParts(parts){
    const groups=new Map();let triangleCount=0;
    for(const {geometry,material,position,rotation,scale} of parts){
      const attr=geometry.getAttribute('position');if(!attr)throw new Error('Authored geometry lacks positions');
      const index=geometry.index?.array??Array.from({length:attr.count},(_,i)=>i);
      if(index.length%3)throw new Error('Authored triangle indices are incomplete');
      const a=groups.get(material)||[];groups.set(material,a);
      for(let i=0;i<index.length;i++){
        const j=index[i];a.push(...transform([attr.getX(j),attr.getY(j),attr.getZ(j)],position,rotation,scale));
      }
      triangleCount+=index.length/3;
    }
    const outputs=[];
    for(const [material,points] of groups){
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
      geo.computeVertexNormals();geo.computeBoundingSphere();outputs.push({geometry:geo,material});
    }
    return {outputs,triangleCount};
  }
  function buildRecipe(p,level){
    const parts=[],L=p.length,W=p.width,H=p.height,R=p.wheelRadius,paint=tone(p.paint),shade=tone(p.accent);
    const near=level==='near';
    const add=(id,g,material,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1])=>parts.push({id,geometry:g,material,position:pos,rotation:rot,scale});
    const box=(id,w,h,d,mat,pos,rot=[0,0,0])=>add(id,roundedBox(w,h,d,near?.055:.025),mat,pos,rot);
    const pair=(fn)=>{for(const s of [-1,1])fn(s)};
    const isBox=p.id==='box',isVan=p.id==='van',isPickup=p.id==='pickup',isSUV=p.id==='suv',isMuscle=p.id==='muscle';
    const wheelFront=isBox?L*.325:isPickup||isVan?L*.31:L*.31;
    const wheelRear=isBox?-L*.33:isPickup||isVan?-L*.34:-L*.31;
    const wheels=isBox?[[wheelFront,0],[wheelRear,0],[-L*.42,0]]:[[wheelFront,0],[wheelRear,0]];
    const glassY=isBox?2.35:isVan?2.32:isPickup?1.85:isSUV?1.83:1.52;
    // Chassis never reaches below the tire contact plane.
    box('frame_center',W*.72,.24,L*.91,defaults.frame,[0,R+.10,0]);
    pair(s=>box(`frame_rail_${s}`,.16,.28,L*.84,defaults.steel,[s*W*.31,R+.12,0]));
    const stations=[[-L*.50,W*.38,R+.14,1.12,1.38,W*.24],[-L*.43,W*.48,R+.14,1.35,1.56,W*.38],
      [L*.36,W*.49,R+.14,1.40,1.63,W*.37],[L*.48,W*.39,R+.14,1.14,1.37,W*.24]];
    add('sculpted_lower_body',bodyLoft(stations),paint);
    box('beltline_front',W*.78,.065,L*.38,shade,[0,1.58,L*.24]);
    if(isBox){
      // Tall riveted box with separate cab, corner frames and reflector stripe.
      const cargoLen=L*.60,cargoZ=-L*.185;
      box('rear_box',W*.92,2.95,cargoLen,defaults.cream,[0,2.55,cargoZ]);
      box('box_roof',W*.95,.14,cargoLen+.12,defaults.chrome,[0,4.07,cargoZ]);
      box('cab_lower',W*.84,1.75,L*.27,paint,[0,1.76,L*.34]);
      add('cab_roof',bodyLoft([[L*.20,W*.40,1.95,2.65,3.04,W*.32],[L*.26,W*.43,1.95,2.86,3.15,W*.35],
        [L*.40,W*.41,1.95,2.80,3.08,W*.33],[L*.47,W*.35,1.95,2.45,2.85,W*.24]]),paint);
      for(let i=0;i<6;i++)box(`box_vertical_seam_${i}`,.035,2.62,.045,defaults.chrome,[sFor(i)*W*.467,2.6,-L*.47+i*cargoLen/5]);
      pair(s=>{
        for(const z of [-L*.48,-L*.19,L*.1])box(`box_corner_${s}_${z}`,.09,2.95,.09,defaults.steel,[s*W*.466,2.58,z]);
        box(`box_side_cream_${s}`,.023,.35,cargoLen*.91,paint,[s*W*.474,2.35,cargoZ]);
        for(let i=0;i<9;i++)box(`box_rivet_${s}_${i}`,.085,.065,.09,defaults.steel,[s*W*.49,3.88,-L*.46+i*cargoLen/9]);
        for(let i=0;i<7;i++)box(`box_reflector_${s}_${i}`,.07,.08,.24,i%2?defaults.tail:defaults.cream,[s*W*.49,1.35,-L*.45+i*cargoLen/7]);
      });
      box('rear_rollup_door',W*.77,2.5,.075,defaults.cream,[0,2.52,-L*.49]);
      if(near)for(let i=0;i<10;i++)box(`rear_shutter_${i}`,W*.69,.05,.10,defaults.steel,[0,1.4+i*.24,-L*.505]);
      box('cab_sun_visor',W*.78,.12,.45,defaults.chrome,[0,3.12,L*.46]);
    }else if(isVan){
      add('high_roof_sculpt',bodyLoft([[-L*.47,W*.43,1.25,2.94,3.02,W*.36],[-L*.40,W*.44,1.23,3.05,H,W*.36],
        [L*.25,W*.45,1.21,3.05,H,W*.37],[L*.36,W*.43,1.25,2.92,3.15,W*.36],[L*.475,W*.33,1.28,2.46,2.75,W*.27]]),paint);
      box('sliding_door_track',.045,.055,2.7,defaults.chrome,[W*.442,2.46,-L*.16]);
      pair(s=>box(`van_side_panel_${s}`,.032,1.17,L*.41,paint,[s*W*.45,2.16,-L*.19]));
      if(near)for(let i=0;i<5;i++)box(`roof_rib_${i}`,.055,.055,L*.72,shade,[(i-2)*W*.19,H+.012,-L*.02]);
    }else if(isPickup){
      const roof=[[-L*.03,W*.41,1.43,2.13,2.32,W*.31],[L*.05,W*.43,1.43,2.29,H,W*.34],
        [L*.28,W*.43,1.43,2.29,H,W*.34],[L*.39,W*.35,1.43,2.12,2.31,W*.26]];
      add('pickup_cab',bodyLoft(roof),paint);
      const bedZ=-L*.255,bedLen=L*.49;
      box('bed_liner',W*.84,.13,bedLen,defaults.wood,[0,1.40,bedZ]);
      box('tailgate',W*.92,.73,.16,paint,[0,1.56,-L*.47]);
      pair(s=>{
        box(`bed_side_${s}`,.17,.74,bedLen,paint,[s*W*.455,1.62,bedZ]);
        box(`bed_rail_${s}`,.15,.11,bedLen,defaults.chrome,[s*W*.458,2.05,bedZ]);
      });
    }else{
      let roofLoft;
      if(isMuscle)roofLoft=[[-L*.31,W*.40,1.31,1.58,1.67,W*.32],[-L*.21,W*.41,1.31,1.77,H,W*.30],
        [L*.05,W*.42,1.31,1.77,H,W*.31],[L*.19,W*.38,1.31,1.58,1.66,W*.28]];
      else if(isSUV)roofLoft=[[-L*.34,W*.41,1.30,2.19,2.35,W*.31],[-L*.27,W*.43,1.30,2.34,H,W*.34],
        [L*.12,W*.43,1.30,2.34,H,W*.34],[L*.30,W*.38,1.30,2.06,2.30,W*.29]];
      else roofLoft=[[-L*.30,W*.39,1.28,1.72,1.84,W*.30],[-L*.20,W*.40,1.28,1.95,H,W*.31],
        [L*.09,W*.40,1.28,1.95,H,W*.31],[L*.26,W*.34,1.28,1.68,1.83,W*.26]];
      add('sculpted_roof_and_pillars',bodyLoft(roofLoft),paint);
      if(isMuscle){box('hood_scoop',W*.35,.18,.75,defaults.frame,[0,1.75,L*.31]);
        box('rear_spoiler',W*.83,.12,.35,paint,[0,1.66,-L*.46]);}
      if(isSUV){pair(s=>box(`roof_rail_${s}`,.09,.13,L*.5,defaults.chrome,[s*W*.34,H+.06,-L*.045]));}
    }
    // Deep, recessed grille and separately modeled chrome slats.
    const grilleW=W*(isBox?.57:.58), front=L*.495;
    box('grille_cavity',grilleW,.61,.08,defaults.grille,[0,1.19,front+.026]);
    box('grille_chrome_frame',grilleW+.14,.72,.07,defaults.chrome,[0,1.20,front+.074]);
    box('grille_black_recess',grilleW-.1,.55,.052,defaults.grille,[0,1.20,front+.117]);
    if(near)for(let i=0;i<5;i++)box(`grille_slat_${i}`,grilleW*.92,.039,.07,defaults.steel,[0,.99+i*.105,front+.155]);
    box('front_bumper',W*.93,.28,.20,defaults.chrome,[0,.93,front-.02]);
    box('bumper_lower_airduct',W*.52,.13,.06,defaults.grille,[0,.86,front+.115]);
    box('rear_bumper',W*.93,.24,.21,defaults.steel,[0,.94,-front+.035]);
    pair(s=>{
      box(`headlight_recess_${s}`,W*.265,.34,.10,defaults.frame,[s*W*.358,1.29,front+.025]);
      for(let i=0;i<(near?2:1);i++)box(`headlamp_${s}_${i}`,W*.105,.225,.055,defaults.light,[s*(W*.32+(i-.5)*W*.1),1.30,front+.092]);
      box(`turn_marker_${s}`,W*.24,.063,.053,defaults.amber,[s*W*.36,1.09,front+.102]);
      box(`rear_lamp_${s}`,W*.18,.26,.065,defaults.tail,[s*W*.37,1.25,-front-.04]);
      if(near)box(`rear_amber_${s}`,W*.15,.052,.07,defaults.amber,[s*W*.38,1.10,-front-.047]);
      if(near){
        box(`front_fog_${s}`,W*.21,.14,.055,defaults.amber,[s*W*.35,.91,front+.12]);
        box(`mirror_arm_${s}`,.32,.065,.075,defaults.frame,[s*W*.48,glassY,L*.14]);
        box(`mirror_${s}`,.14,.31,.26,defaults.chrome,[s*W*.50,glassY,L*.16]);
        box(`mirror_reflect_${s}`,.035,.24,.18,defaults.glassHighlight,[s*W*.517,glassY,L*.16]);
      }
    });
    // Layered glass; low-poly silhouettes share the same angle vocabulary.
    const windW=W*(isBox?.66:.70),windZ=isBox?L*.47:isVan?L*.448:isPickup?L*.385:isSUV?L*.297:isMuscle?L*.185:L*.259;
    const windshieldH=isBox?.80:isVan?.95:isPickup?.70:isSUV?.67:.56;
    box('windshield_black_seal',windW+.11,windshieldH+.09,.055,defaults.frame,[0,glassY,windZ],[isBox?-.14:-.26,0,0]);
    box('windshield_blue_glass',windW,windshieldH,.045,defaults.glass,[0,glassY,windZ+.045],[isBox?-.14:-.26,0,0]);
    if(near){
      box('windshield_sheen',windW*.3,windshieldH*.92,.012,defaults.glassHighlight,[windW*.15,glassY,windZ+.082],[-.22,0,-.29]);
      pair(s=>box(`wiper_${s}`,windW*.39,.025,.025,defaults.frame,[s*windW*.23,glassY-windshieldH*.44,windZ+.11],[0,0,s*.11]));
    }
    // Side windows, individual front/rear pane partitions and body livery.
    pair(s=>{
      const frontSide=isBox?L*.345:isVan?L*.30:isPickup?L*.20:L*.04;
      const sideHeight=isBox?.74:isVan?.73:isPickup?.59:isSUV?.68:.51;
      for(let i=0;i<(isBox||isVan?1:2);i++){
        const z=frontSide-(i?(isPickup?.9:1.05):0),len=(isBox||isVan)?.79:isMuscle?.9:1.10;
        box(`glass_recess_${s}_${i}`,.045,sideHeight+.11,len+.09,defaults.frame,[s*W*.459,glassY+.02,z]);
        box(`glass_${s}_${i}`,.048,sideHeight,len,defaults.glass,[s*W*.475,glassY+.03,z]);
        if(near)box(`glass_glint_${s}_${i}`,.012,sideHeight*.74,len*.18,defaults.glassHighlight,[s*W*.506,glassY+.08,z+.15],[0,0,-.16]);
      }
      if(near){
        for(const z of isBox?[L*.32]:isVan?[L*.15,-L*.28]:[L*.1,-L*.20])
          box(`door_handle_${s}_${z}`,.08,.052,.26,defaults.chrome,[s*W*.496,1.34,z]);
        box(`side_sill_${s}`,.09,.15,L*.63,defaults.steel,[s*W*.483,.91,0]);
      }
      // Cream side stripe carries the common livery without a decal texture.
      const stripeZ=isBox?-L*.12:isVan?-L*.16:0;
      box(`cream_livery_${s}`,.022,.22,L*(isBox?.47:.50),defaults.cream,[s*W*.497,1.48,stripeZ]);
      if(near){
        box(`lower_livery_${s}`,.027,.052,L*.39,shade,[s*W*.505,1.29,stripeZ-.06]);
        for(const z of [wheelFront,wheelRear]){
          add(`arched_fender_${s}_${z}`,arch(R),shade,[s*W*.46,R,z],[0,s*PI/2,0]);
          box(`fender_rivet_${s}_${z}`,.055,.063,.065,defaults.chrome,[s*W*.50,R+R*1.16,z]);
        }
      }
    });
    if(near){
      if(isPickup||isBox)pair(s=>{
        box(`metal_side_step_${s}`,.19,.09,.75,defaults.chrome,[s*W*.455,.86,L*.22]);
        for(let i=0;i<4;i++)box(`step_grip_${s}_${i}`,.08,.016,.06,defaults.frame,[s*W*.47,.913,L*.22-.25+i*.16]);
      });
      if(isBox||isPickup)for(let i=0;i<4;i++)box(`roof_marker_${i}`,.18,.11,.18,defaults.amber,[(i-1.5)*W*.18,H-(isBox?1.08:.07),L*(isBox?.35:.20)]);
      if(isVan)for(let i=0;i<4;i++)box(`van_roof_channel_${i}`,.045,.025,L*.61,shade,[(i-1.5)*W*.18,H+.03,0]);
    }
    // Far LOD includes deliberately simplified wheel silhouettes, baked in.
    if(!near)for(const [z] of wheels)pair(s=>{
      add(`far_tire_${s}_${z}`,cylinder(R,R*.54,10),defaults.rubber,[s*W*.45,R,z],[0,0,PI/2]);
      add(`far_hub_${s}_${z}`,cylinder(R*.5,.025,9),defaults.chrome,[s*W*.48,R,z],[0,0,PI/2]);
    });
    const baked=bakeParts(parts);
    return {parts,partIds:parts.map(x=>x.id),meshes:baked.outputs,triangles:baked.triangleCount,wheels,profile:p,level};
  }
  function sFor(i){return i%2?-1:1}
  function getTemplate(id,level){const key=`${id}:${level}`;if(!templates.has(key)){
    if(!TRAFFIC_FLEET_PROFILES[id])throw new RangeError(`No traffic authoring profile: ${id}`);
    templates.set(key,buildRecipe(TRAFFIC_FLEET_PROFILES[id],level));
  }return templates.get(key)}
  function wheelPart(id,r,side,z,near){
    const holder=new THREE.Group();holder.name=`LH_Traffic_${id}_wheel_${side}_${z}`;
    holder.position.set(side*TRAFFIC_FLEET_PROFILES[id].width*.455,r,z);
    const tire=new THREE.Mesh(cylinder(r,r*.52,near?22:10),defaults.rubber);tire.rotation.z=PI/2;holder.add(tire);
    const rim=new THREE.Mesh(cylinder(r*.62,r*.555,near?18:10),defaults.chrome);rim.rotation.z=PI/2;holder.add(rim);
    if(near){
      const sidewall=new THREE.Mesh(torus(r*.86,r*.10,20),defaults.sidewall);sidewall.position.x=side*.29;sidewall.rotation.y=PI/2;holder.add(sidewall);
      const ring=new THREE.Mesh(torus(r*.55,r*.036,20),defaults.steel);ring.position.x=side*.29;ring.rotation.y=PI/2;holder.add(ring);
      const dummy=new THREE.Object3D();
      const studs=new THREE.InstancedMesh(cylinder(r*.074,.052,6),defaults.chrome,8);
      const tread=new THREE.InstancedMesh(roundedBox(r*.14,r*.22,r*.12,.012),defaults.sidewall,18);
      for(let k=0;k<8;k++){const a=2*PI*k/8;
        dummy.position.set(side*.302,r*.40*Math.cos(a),r*.40*Math.sin(a));dummy.rotation.set(0,0,PI/2);
        dummy.updateMatrix();studs.setMatrixAt(k,dummy.matrix);
      }
      for(let k=0;k<18;k++){const a=2*PI*k/18;
        dummy.position.set(0,r*.96*Math.cos(a),r*.96*Math.sin(a));dummy.rotation.set(a,0,0);
        dummy.updateMatrix();tread.setMatrixAt(k,dummy.matrix);
      }
      studs.instanceMatrix.needsUpdate=true;tread.instanceMatrix.needsUpdate=true;
      studs.computeBoundingSphere();tread.computeBoundingSphere();holder.add(studs,tread);
    }
    return holder;
  }
  function createVehicle(id){
    const p=TRAFFIC_FLEET_PROFILES[id];if(!p)throw new RangeError(`Unknown traffic source: ${id}`);
    const root=new THREE.Group(),hi=new THREE.Group(),far=new THREE.Group(),rotors=[];
    root.name=`LH_Traffic_${id}`;root.userData.source=TRAFFIC_FLEET_SOURCE.id;
    hi.name=`LH_Traffic_${id}_near`;far.name=`LH_Traffic_${id}_far`;
    for(const [level,group] of [['near',hi],['far',far]]){
      const template=getTemplate(id,level);
      for(const {geometry,material} of template.meshes){const mesh=new THREE.Mesh(geometry,material);
        mesh.name=`LH_${id}_${level}_${geometry.uuid??'baked'}`;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}
    }
    for(const [z] of getTemplate(id,'near').wheels)for(const side of [-1,1]){
      const wheel=wheelPart(id,p.wheelRadius,side,z,true);hi.add(wheel);rotors.push(wheel);
    }
    root.add(hi,far);far.visible=false;
    const nearTriangles=getTemplate(id,'near').triangles,farTriangles=getTemplate(id,'far').triangles;
    let lastLevel='near';
    return {root,profile:p,rotors,authoring:{source:TRAFFIC_FLEET_SOURCE.id,parts:getTemplate(id,'near').partIds,
      triangles:nearTriangles,farTriangles},
      setDistance(distance){
        const next=distance>155?'far':distance<115?'near':lastLevel;
        if(next!==lastLevel){hi.visible=next==='near';far.visible=next==='far';lastLevel=next}
      },
      spin(dt,speed){if(lastLevel!=='near')return;for(const wheel of rotors)wheel.rotation.x+=Math.max(-40,Math.min(40,speed))*dt/p.wheelRadius;},
      get lod(){return lastLevel}
    };
  }
  function createBreakup(id){
    const p=TRAFFIC_FLEET_PROFILES[id];if(!p)throw new RangeError('Unknown breakup vehicle');
    if(!breakupTemplates.has(id)){
      const recipe=getTemplate(id,'near'),groups=new Map();
      const breakParts=[];
      for(const part of recipe.parts){
        if(part.id!=='sculpted_lower_body'||id==='box'||id==='van'){breakParts.push(part);continue;}
        // Split existing front/top triangles into a matching hood panel. No
        // duplicate intact geometry or unrelated replacement debris.
        const attr=part.geometry.getAttribute('position'),indices=part.geometry.index?.array||Array.from({length:attr.count},(_,i)=>i),hood=[],body=[];
        for(let i=0;i<indices.length;i+=3){const tri=Array.from(indices.slice(i,i+3));const front=tri.reduce((n,k)=>n+attr.getZ(k),0)/3>p.length*.23;
          const top=tri.reduce((n,k)=>n+attr.getY(k),0)/3>1.40;const out=front&&top?hood:body;
          for(const k of tri)out.push(attr.getX(k),attr.getY(k),attr.getZ(k));}
        for(const [name,vertices]of [['hood_panel',hood],['sculpted_lower_body',body]])if(vertices.length){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));breakParts.push({...part,id:name,geometry});}
      }
      for(const part of breakParts){
        const key=/door/.test(part.id)?(part.position[0]<0?'door-left':'door-right'):
          /hood|bonnet/.test(part.id)?'hood':/bumper|grille/.test(part.id)?'bumper':
          /roof|cab|glass|window/.test(part.id)?'cab':'body';
        if(!groups.has(key))groups.set(key,[]);groups.get(key).push(part);
      }
      const outputs=[];
      for(const [name,parts]of groups){
        const baked=bakeParts(parts),group=new THREE.Group();group.name=`LH_${id}_break_${name}`;
        for(const part of baked.outputs)group.add(new THREE.Mesh(part.geometry,part.material));
        const center=new THREE.Box3().setFromObject(group).getCenter(new THREE.Vector3());
        for(const part of group.children)part.geometry.translate(-center.x,-center.y,-center.z);
        group.position.copy(center);outputs.push(group);
      }
      for(const [z]of recipe.wheels)for(const side of [-1,1])outputs.push(wheelPart(id,p.wheelRadius,side,z,false));
      breakupTemplates.set(id,outputs);
    }
    return breakupTemplates.get(id).map(group=>group.clone(true));
  }
  function prewarm(){for(const id of TRAFFIC_FLEET_SOURCE.vehicleIds){getTemplate(id,'near');getTemplate(id,'far')}}
  function stats(){return {templates:templates.size,primitives:shapes.size,materials:ownedMaterials.length,
      variants:TRAFFIC_FLEET_SOURCE.vehicleIds.map(id=>({id,nearParts:getTemplate(id,'near').partIds.length,
       nearTriangles:getTemplate(id,'near').triangles,farTriangles:getTemplate(id,'far').triangles,
       renderMeshesNear:getTemplate(id,'near').meshes.length,renderMeshesFar:getTemplate(id,'far').meshes.length}))}}
  return {createVehicle,createBreakup,prewarm,stats,source:TRAFFIC_FLEET_SOURCE};
}