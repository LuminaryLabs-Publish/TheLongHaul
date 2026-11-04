// The Long Haul / n:authoring:art product source adapter.
// Pure Three.js geometry authoring; no gameplay state, physics or UI ownership.
// This recipe follows the Nexus authoring Mesh/Material/Assembly responsibilities.
// It does not claim to install the optional n:authoring runtime in the shipped bundle.
export const HERO_TRUCK_SOURCE = Object.freeze({
  id: 'long-haul:vehicle:hero-hauler:v1',
  authoringPaths: ['n:authoring:mesh', 'n:authoring:material', 'n:authoring:assembly', 'n:authoring:art'],
  style: 'illustrated-3d/toon-4-band',
  reference: 'LH-01-001/concept-vermilion-heavy-hauler',
  length: 9.2, width: 3.8, wheelCount: 6,
  gameCollider: 'unchanged:LONG_HAUL_TRUCK_COLLIDER',
});

const PI = Math.PI;
// Build visual meshes only. The supplied grounder continues to own render
// clearance; gameplay truck dynamics, steering and saved data are untouched.
export function createHeroTruckMesh({ THREE, materials, createTruckGrounding }) {
  if (!THREE?.MeshToonMaterial || !materials?.truckRed || typeof createTruckGrounding !== 'function')
    throw new Error('HeroTruck requires the existing Three/toon and truck grounding contracts');
  const cache = new Map(), ownedMaterials = [];
  const root = new THREE.Group(), leanPivot = new THREE.Group(), body = new THREE.Group();
  root.name = 'LH_HeroHauler'; leanPivot.name = 'LH_BodyRoll'; body.name = 'LH_ArticulatedBody';
  root.add(leanPivot); leanPivot.add(body); body.position.y = -1.6; leanPivot.position.y = 1.5;
  root.scale.setScalar(.92);
  const wheelPivots = [], steerPivots = [], crates = [], visualParts = [];
  const grad = materials.truckRed.gradientMap;
  const tone = (color, extra = {}) => {
    const mat = new THREE.MeshToonMaterial({ color, gradientMap: grad, fog: true, ...extra });
    ownedMaterials.push(mat); return mat;
  };
  const m = {
    red: materials.truckRed, cream: materials.truckCream, dark: materials.truckDark,
    wood: materials.wood, crate: materials.crate, crateDark: materials.crateDark,
    orange: tone(0xff8c2f), shade: tone(0xb72c25), fender: tone(0xea5937, { side: THREE.DoubleSide }), outline: tone(0x17242e),
    rubber: tone(0x1a2631), tireSide: tone(0x27333e), steel: tone(0x9fb1be),
    bright: tone(0xe7edf0), chrome: tone(0xbdd2db), chromeShadow: tone(0x58758a),
    glass: tone(0x254864, { side: THREE.DoubleSide }), glassTint: tone(0x487a99, { side: THREE.DoubleSide }),
    highlight: tone(0x91c6d9, { side: THREE.DoubleSide }),
    grille: tone(0x15202b), amber: tone(0xffc06b, { emissive: 0xb34e15, emissiveIntensity: .5 }),
    light: tone(0xfff2d4, { emissive: 0xf8be73, emissiveIntensity: .55 }),
    tail: tone(0xff4738, { emissive: 0xac2f22, emissiveIntensity: .55 }),
    plank: tone(0x80573a), gap: tone(0x342f32),
  };
  function shared(key, ctor) {
    if (!cache.has(key)) cache.set(key, ctor());
    return cache.get(key);
  }
  function roundBox(w, h, d, bevel = .07) {
    const b = Math.min(bevel, w * .18, h * .18, d * .24);
    const key = `round:${w}:${h}:${d}:${b}`;
    return shared(key, () => {
      const iw = w - 2*b, ih = h - 2*b, r = Math.min(b * 2.2, iw * .28, ih * .28), x = iw/2, y = ih/2;
      const shape = new THREE.Shape();
      shape.moveTo(-x+r, -y); shape.lineTo(x-r,-y); shape.quadraticCurveTo(x,-y,x,-y+r);
      shape.lineTo(x,y-r); shape.quadraticCurveTo(x,y,x-r,y);
      shape.lineTo(-x+r,y); shape.quadraticCurveTo(-x,y,-x,y-r);
      shape.lineTo(-x,-y+r); shape.quadraticCurveTo(-x,-y,-x+r,-y);
      const depth = Math.max(.003, d - 2*b);
      const geometry = new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:3});
      geometry.translate(0,0,-depth/2); geometry.computeBoundingBox(); return geometry;
    });
  }
  function cylinder(radTop,radBottom,depth,segments=12) {
    const key=`cyl:${radTop}:${radBottom}:${depth}:${segments}`;
    return shared(key,()=>new THREE.CylinderGeometry(radTop,radBottom,depth,segments));
  }
  function torus(radius,tube,segments=18) {
    return shared(`torus:${radius}:${tube}:${segments}`,()=>new THREE.TorusGeometry(radius,tube,6,segments));
  }
  function shapePanel(points,depth=.06) {
    // Planar polygon in XY, extruded in Z. Points are source-authoring units.
    const key = `panel:${JSON.stringify(points)}:${depth}`;
    return shared(key,()=>{
      const path = new THREE.Shape();
      points.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));
      path.closePath();
      const geo=new THREE.ExtrudeGeometry(path,{depth,bevelEnabled:false,steps:1});
      geo.translate(0,0,-depth/2);return geo;
    });
  }
  function part(id,geometry,material,position=[0,0,0],rotation=[0,0,0],parent=body) {
    const mesh = new THREE.Mesh(geometry,material);mesh.name=`LH_${id}`;
    mesh.position.set(...position);mesh.rotation.set(...rotation);mesh.castShadow=true;
    mesh.receiveShadow=true;mesh.userData.heroTruckRole=id;
    parent.add(mesh); visualParts.push(mesh);return mesh;
  }
  function box(id,w,h,d,material,position,rotation,parent) {
    return part(id,roundBox(w,h,d),material,position,rotation,parent);
  }
  function support(mesh){mesh.userData.heroGroundingSupport=true;return mesh;}
  const addPair = (prefix,fn) => { for (const side of [-1,1]) fn(side,`${prefix}_${side<0?'L':'R'}`); };

  // Independent dark ladder frame, substantial crossmembers and axle housings.
  addPair('chassis', (side,id)=>support(box(id,.3,.43,7.85,m.outline,[side*1.12,1.12,-.36])));
  for (const z of [-3.55,-2.25,-.72,1.65,3.3]) box(`crossbeam_${z}`,2.3,.26,.34,m.steel,[0,1.13,z]);
  box('engine_undertray',2.48,.65,2.2,m.outline,[0,1.57,2.6]);
  for (const z of [-3.15,-.95]) {
    box(`axle_${z}`,3.0,.24,.28,m.chromeShadow,[0,.92,z]);
    addPair(`spring_${z}`, (side,id)=>box(id,.22,.15,1.36,m.chromeShadow,[side*1.07,1.19,z]));
    box(`differential_${z}`,.67,.59,.62,m.steel,[0,.91,z]);
  }
  addPair('fuel', (side,id)=>{
    part(`${id}_tank`,cylinder(.5,.5,1.8,18),m.steel,[side*1.18,1.42,.3],[PI/2,0,0]);
    for (const z of [-.29,.86]) box(`${id}_strap_${z}`,.16,.98,.1,m.chromeShadow,[side*1.19,1.42,z]);
    box(`${id}_step`,.68,.13,.95,m.chrome,[side*1.56,1.28,1.34]);
    for(let i=0;i<4;i++)box(`${id}_tread_${i}`,.54,.015,.035,m.outline,[side*1.57,1.355,1.01+i*.21]);
  });

  // Cab and hood are true chamfered polygon extrusions, not six boxes.
  support(box('cab_shell',3.18,3.23,2.58,m.red,[0,3.04,1.43],[ -.045,0,0]));
  box('cab_roof',3.28,.3,2.56,m.shade,[0,4.59,1.35]);
  box('cab_roof_cap',3.3,.14,2.50,m.red,[0,4.7,1.39]);
  box('back_sleeper',2.86,2.73,.54,m.shade,[0,3.01,.0]);
  support(box('hood_sculpt',3.10,1.48,1.62,m.red,[0,2.44,3.38],[.065,0,0]));
  box('hood_crown',2.66,.16,1.27,m.orange,[0,3.26,3.42],[.055,0,0]);
  for(const x of [-.92,0,.92]) box(`hood_spine_${x}`,.065,.08,1.18,m.cream,[x,3.36,3.39]);
  box('hood_intake',.91,.21,.62,m.outline,[0,3.37,3.30]);
  for(let i=0;i<4;i++)box(`hood_intake_fin_${i}`,.67,.025,.045,m.chromeShadow,[0,3.49,3.07+i*.15]);
  box('grille_recess',2.38,1.29,.09,m.grille,[0,2.32,4.205]);
  box('grille_frame',2.58,1.48,.13,m.chrome,[0,2.3,4.26]);
  box('grille_black_inner',2.31,1.18,.055,m.grille,[0,2.31,4.338]);
  for(let i=-3;i<=3;i++)box(`grille_slat_${i}`,2.17,.075,.07,m.chrome,[0,2.31+i*.16,4.4]);
  for(const x of [-.89,0,.89])box(`grille_bar_${x}`,.105,1.2,.09,m.chromeShadow,[x,2.31,4.43]);
  box('front_bumper',3.62,.35,.35,m.chrome,[0,1.45,4.21]);
  box('bumper_dark_inset',2.34,.17,.09,m.outline,[0,1.38,4.44]);
  box('rear_bumper',3.55,.3,.35,m.steel,[0,1.16,-4.42]);
  addPair('front_corner', (side,id)=>{
    box(`${id}_guard`,.42,.48,.52,m.orange,[side*1.54,2.1,4.06]);
    box(`${id}_lamp_housing`,.71,.47,.19,m.outline,[side*1.2,2.3,4.2]);
    for (const a of [-.17,.17]) box(`${id}_lamp_${a}`,.27,.29,.08,m.light,[side*1.2+a,2.32,4.32]);
    box(`${id}_indicator`,.65,.11,.09,m.amber,[side*1.2,2.04,4.32]);
    box(`${id}_fog`,.41,.12,.09,m.amber,[side*1.31,1.44,4.47]);
    for(let i=0;i<3;i++)box(`${id}_hood_vent_${i}`,.06,.23,.32,m.outline,[side*1.55,2.54,3.0+i*.21]);
  });

  // Fenders: extruded annular arcs in vehicle YZ plane over the front wheels.
  function fenderGeometry() {
    return shared('fender-front',()=>{
      const points=[],tri=[],n=16,outer=1.22,inner=1.04,width=.30;
      for(let i=0;i<=n;i++){
        const t=PI*i/n, ca=Math.cos(t), sa=Math.sin(t);
        for(const x of [-width/2,width/2])for(const r of [outer,inner])points.push(x,sa*r,ca*r);
      }
      for(let i=0;i<n;i++){const a=i*4,b=a+4;
        tri.push(a,b,a+2,a+2,b,b+2, a+1,a+3,b+1,a+3,b+3,b+1,
          a,a+1,b,a+1,b+1,b, a+2,b+2,a+3,a+3,b+2,b+3);
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
      geo.setIndex(tri);geo.computeVertexNormals();return geo;
    });
  }
  addPair('fender', (side,id)=>{
    part(id,fenderGeometry(),m.fender,[side*1.61,.95,2.55]);
    box(`${id}_front_skirt`,.35,.40,.52,m.shade,[side*1.55,1.0,3.63]);
    box(`${id}_back_skirt`,.32,.35,.54,m.shade,[side*1.52,1.03,1.52]);
  });
  // Rear-wheel fender carriers and mud flaps.
  addPair('rear_guard', (side,id)=>{
    for(const z of [-.95,-3.15]){
      part(`${id}_arch_${z}`,fenderGeometry(),m.fender,[side*1.62,.95,z]);
      box(`${id}_flap_${z}`,.14,.75,.58,m.outline,[side*1.81,.8,z-.71]);
    }
  });

  // Split windscreen: deep bezel, inside glass and top cyan reflection planes.
  box('windshield_recess',2.81,1.23,.16,m.outline,[0,3.83,2.755],[-.16,0,0]);
  addPair('windshield',(side,id)=>{
    box(`${id}_glass`,1.32,1.10,.035,m.glass,[side*.70,3.82,2.855],[-.17,0,0]);
    const reflection=shapePanel([[-.5,.55],[-.11,.55],[.52,-.55],[.1,-.55]],.019);
    part(`${id}_sky_reflection`,reflection,m.glassTint,[side*.7,3.82,2.889],[-.17,0,0]);
    box(`${id}_wiper`,1.12,.042,.042,m.outline,[side*.70,3.31,2.99],[0,0,side*.14]);
    box(`${id}_pillar`,.10,1.29,.16,m.chromeShadow,[side*1.43,3.83,2.78],[-.16,0,0]);
  });
  box('windscreen_middle_mullion',.09,1.3,.14,m.chrome,[0,3.83,2.80],[-.16,0,0]);
  box('cab_sun_viser',3.47,.23,.65,m.chrome,[0,4.55,2.89]);
  for(let i=-2;i<=2;i++)box(`roof_marker_${i}`,.24,.18,.25,m.amber,[i*.55,4.81,2.4]);
  addPair('side_cab', (side,id)=>{
    box(`${id}_window_recess`,.07,1.13,1.47,m.outline,[side*1.663,3.65,1.34]);
    box(`${id}_window`,.075,1.02,1.33,m.glass,[side*1.714,3.66,1.38]);
    box(`${id}_window_glint`,.025,.79,.15,m.glassTint,[side*1.765,3.76,1.13],[0,0,-.16]);
    box(`${id}_door_border`,.09,1.81,.075,m.shade,[side*1.68,2.7,1.4]);
    box(`${id}_handle`,.16,.06,.39,m.chrome,[side*1.76,2.89,1.18]);
    box(`${id}_cream_stripe`,.08,.18,1.98,m.cream,[side*1.737,2.44,1.45]);
    box(`${id}_mirror_stalk`,.6,.07,.07,m.chrome,[side*1.96,3.8,2.13]);
    box(`${id}_mirror_housing`,.22,.74,.42,m.chrome,[side*2.24,3.79,2.12]);
    box(`${id}_mirror_glass`,.04,.6,.30,m.glassTint,[side*2.38,3.8,2.12]);
    part(`${id}_exhaust`,cylinder(.15,.17,2.93,14),m.chrome,[side*1.41,3.65,-.08]);
    part(`${id}_exhaust_tip`,cylinder(.19,.17,.38,14),m.steel,[side*1.41,5.19,-.08],[.22,0,0]);
    for(let i=0;i<8;i++)box(`${id}_heat_guard_${i}`,.23,.12,.02,m.chromeShadow,[side*1.42,3.0+i*.25,.11]);
  });

  // Freight bed: modeled perimeter, planks, rails, uprights and bed greebles.
  support(box('freight_bed_base',3.43,.29,4.73,m.wood,[0,1.68,-1.79]));
  for(let i=-3;i<=3;i++)box(`bed_plank_${i}`,.43,.055,4.38,i%2?m.wood:m.plank,[i*.45,1.87,-1.83]);
  addPair('cargo_side', (side,id)=>{
    for(let i=0;i<3;i++)box(`${id}_rail_${i}`,.19,.17,4.88,i===1?m.cream:m.red,[side*1.73,2.05+i*.40,-1.83]);
    for(const z of [-4.12,-3,-1.9,-.78,.48]){
      box(`${id}_post_${z}`,.19,1.49,.19,m.chromeShadow,[side*1.73,2.46,z]);
      box(`${id}_bolt_${z}`,.10,.11,.10,m.bright,[side*1.85,2.93,z]);
    }
    for(let i=0;i<4;i++)box(`${id}_marker_${i}`,.12,.12,.25,m.amber,[side*1.85,1.85,-3.56+i*1.05]);
  });
  for(const z of [-4.22,.5]){
    box(`cargo_cross_rail_${z}`,3.46,.23,.16,m.red,[0,2.62,z]);
    box(`cargo_cross_top_${z}`,3.46,.15,.18,m.chromeShadow,[0,3.1,z]);
  }
  box('tail_gate',3.2,.81,.19,m.red,[0,2.13,-4.21]);
  for(let i=-1;i<=1;i++)box(`tailgate_slat_${i}`,.045,.62,.095,m.chromeShadow,[i*.94,2.13,-4.34]);
  addPair('rear_light',(side,id)=>{
    box(`${id}_brake`,.33,.35,.12,m.tail,[side*1.55,1.83,-4.40]);
    box(`${id}_reflector`,.32,.09,.08,m.amber,[side*1.55,1.58,-4.48]);
  });

  // Wheel mesh, bolt heads and grouped lug rings remain anchored to exactly
  // the old six steering/spinning pivots; no replacement physics contacts.
  const wheelGeometry=cylinder(1.06,1.06,.72,22);
  const sidewallGeometry=cylinder(.97,.97,.755,22);
  const hubGeometry=cylinder(.46,.46,.79,18);
  const ringGeometry=torus(.62,.055,24);
  for(const [side,z,isFront] of [-1,1].flatMap(side=>[[side,2.55,true],[side,-.95,false],[side,-3.15,false]])){
    const id=`wheel_${side<0?'L':'R'}_${z}`;
    const pivot=new THREE.Group();pivot.name=`LH_${id}_steer`;
    pivot.position.set(side*1.68,.92,z);body.add(pivot);
    const wheel=new THREE.Group();wheel.name=`LH_${id}_spin`;wheel.rotation.z=PI/2;
    wheel.scale.set(.82,.82,.82);pivot.add(wheel);
    const wheelTire=part(`${id}_tire`,wheelGeometry,m.rubber,[0,0,0],[0,0,0],wheel);
    support(wheelTire);
    part(`${id}_sidewall`,sidewallGeometry,m.tireSide,[0,0,0],[0,0,0],wheel);
    part(`${id}_hub`,hubGeometry,m.chrome,[0,0,0],[0,0,0],wheel);
    for (const face of [-1,1])
      part(`${id}_rim_${face}`,ringGeometry,m.steel,[0,face*.40,0],[PI/2,0,0],wheel);
    // One instanced mesh per detail type prevents hundreds of draw calls.
    const boltBatch = new THREE.InstancedMesh(cylinder(.065,.065,.07,6),m.bright,16);
    boltBatch.name=`LH_${id}_rim_bolts`;
    const treadBatch = new THREE.InstancedMesh(roundBox(.30,.72,.11,.026),m.tireSide,16);
    treadBatch.name=`LH_${id}_tread_lugs`;
    const dummy=new THREE.Object3D();
    for(let i=0;i<16;i++){
      const face=i<8?-1:1, a=2*PI*(i%8)/8;
      dummy.position.set(Math.cos(a)*.36,face*.45,Math.sin(a)*.36);
      dummy.rotation.set(0,0,0);dummy.updateMatrix();boltBatch.setMatrixAt(i,dummy.matrix);
      const t=2*PI*i/16;
      dummy.position.set(Math.cos(t)*1.064,0,Math.sin(t)*1.064);
      dummy.rotation.set(0,PI/2-t,0);dummy.updateMatrix();treadBatch.setMatrixAt(i,dummy.matrix);
    }
    for(const detail of [boltBatch,treadBatch]){
      detail.castShadow=true;detail.receiveShadow=true;wheel.add(detail);visualParts.push(detail);
      detail.instanceMatrix.needsUpdate=true;detail.computeBoundingSphere();
    }
    wheelPivots.push(wheel);if(isFront)steerPivots.push(pivot);
  }
  // Preserve legacy crate references for freight cargo replacement and ability
  // effects; cargo ownership still lives in the real freight gameplay system.
  const positions=[[-.82,2.38,-3.1,.9],[.82,2.35,-3.05,.82],[-.86,2.28,-1.65,.72],[.82,2.4,-1.58,.96],[-.82,2.3,-.2,.76],[.82,2.32,-.15,.8]];
  positions.forEach(([x,y,z,s],i)=>{
    const c=box(`legacy_cargo_${i}`,1.25*s,1.3*s,1.18*s,i%2?m.crate:m.crateDark,[x,y,z]);
    crates.push(c);box(`cargo_binding_${i}`,1.3*s,.075,1.23*s,m.chrome,[x,y+.05,z]);
  });
  const grounding=createTruckGrounding(THREE,body,{heroSupportOnly:true});
  const rig={root,body,leanPivot,wheels:wheelPivots,steering:steerPivots,crates,grounding};
  rig.heroAuthored=true;rig.heroSourceId=HERO_TRUCK_SOURCE.id;
  rig.heroStats={meshCount:visualParts.length,geometryCount:cache.size,materialCount:ownedMaterials.length,
    wheelCount:wheelPivots.length, toon:true};
  rig.heroRelease=()=>{
    for(const geometry of cache.values())geometry.dispose();
    for(const material of ownedMaterials)material.dispose();
  };
  return rig;
}
