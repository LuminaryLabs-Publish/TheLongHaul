// The Long Haul environment assets: n:authoring source recipes and scene assemblies.
// No renderer, storage, collision, road-deck modification or runtime ownership.
import { ENVIRONMENT_TILE_BY_ID, ENV_TILE_VARIANTS } from './environment-tile-catalog.mjs';

export const ENVIRONMENT_AUTHORING_SOURCE=Object.freeze({
  id:'long-haul:environment:authored-200m:v1',
  domains:['n:authoring:project','n:authoring:mesh','n:authoring:material','n:authoring:assembly','n:authoring:art'],
  type:'portable-editable-parametric-assembly-recipe',
  visual:'illustrated-three-to-four-band-toon',
  authoringStatus:'native-project-export-not-yet-verified',
  road:'visual overlays only; canonical road/collision remains authoritative'
});

// All shapes resolve to shared chamfered/faceted GPU geometry via the presentation adapter.
const part=(shape,mat,pos,scale,rotation=[0,0,0],extra={})=>Object.freeze({
  shape,material:mat,position:pos,scale,rotation,cast:extra.cast!==false,
  transparent:extra.transparent===true,detail:extra.detail??'structural'
});
const P=Math.PI;
const sides=[-1,1];
export const ENVIRONMENT_PALETTE=Object.freeze({
  leaf:0x6f9b59,leafLight:0xa7ba6a,leafDark:0x496b55,bark:0x685342,wood:0x987255,
  rock:0x898e84,rockLight:0xb2ab99,clay:0xbb765c,sand:0xc4a27b,
  steel:0xb8c6c6,steelDark:0x465964,trim:0xffddb4,roadPaint:0xf1dcae,
  worn:0x7d6f63,glass:0x608aa5,roof:0xb45345,brick:0xb97860,light:0xffd5a1,
  cyan:0x60b5c7,shadow:0x38484b
});
const profileTrees=new Set(['tree','maple','oak','pine','fir','juniper','willow','cactus','reeds','crop','grass','shrub']);
export function resolveEnvironmentKind(kind,biome){
  if(kind==='tree')return {
    'new-england':'maple','high-pines':'pine','alpine':'fir','golden-hills':'oak',
    farmland:'oak',badlands:'cactus','high-desert':'juniper',canyon:'juniper',
    coastal:'pine',wetlands:'willow'
  }[biome]||'oak';
  if(kind==='rock'&&['badlands','canyon'].includes(biome))return 'redrock';
  return kind;
}
export function authoredEnvironmentObject(descriptor,{lod='near'}={}){
  if(!descriptor?.id||![descriptor.position?.x,descriptor.position?.y,descriptor.position?.z,descriptor.scale,descriptor.heading].every(Number.isFinite))throw TypeError('Authored object needs a finite identity, pose and scale');
  if(!['near','far'].includes(lod))throw RangeError('Unknown environment LOD');
  const tile=ENVIRONMENT_TILE_BY_ID.get(descriptor.catalogId);
  if(!tile)throw RangeError(`Unknown authored environment template: ${descriptor.catalogId}`);
  const variant=ENV_TILE_VARIANTS.find(v=>v.id===descriptor.variantId);
  if(!variant)throw RangeError('Environment variant missing');
  const near=lod==='near',biome=tile.biome,motif=tile.motif,kind=resolveEnvironmentKind(descriptor.kind,biome);
  const parts=[],add=(shape,mat,x,y,z,sx,sy,sz,rot=[0,0,0],e={})=>parts.push(part(shape,mat,[x,y,z],[sx,sy,sz],rot,e));
  const tint=tile.palette;
  if(descriptor.role==='on-road-paint'){
    // Road overlays are image/paint only, never physical obstacles.  The source
    // road deck, bank, colliders, route signs, traffic and freight gates win.
    const ink=variant.wear>.3?'worn':'roadPaint';
    if(descriptor.kind==='edge-studs'||descriptor.kind==='road-studs')for(const x of [-1.2,0,1.2])add('decal',ink,x,.018,0,.34,.16,1,[-P/2,0,0],{cast:false,transparent:true});
    else if(descriptor.kind==='rumble')for(let i=-2;i<=2;i++)add('decal',ink,i*.62,.018,0,.35,.10,1,[-P/2,0,0],{cast:false,transparent:true});
    else if(descriptor.kind==='guide-arrows')for(const side of [-1,1])add('decal',ink,side*.62,.019,-.25,.15,1.45,1,[-P/2,0,side*.6],{cast:false,transparent:true});
    else if(descriptor.kind==='drain-hatch'){
      add('decal','steelDark',0,.014,0,1.1,.85,1,[-P/2,0,0],{cast:false,transparent:true});
      for(let i=-2;i<=2;i++)add('decal','steel',i*.18,.022,0,.05,.7,1,[-P/2,0,0],{cast:false,transparent:true});
    }else if(descriptor.kind==='seam')add('decal',ink,0,.018,0,1.9,.12,1,[-P/2,0,0],{cast:false,transparent:true});
    else add('decal','worn',0,.015,0,2.2,.78,1,[-P/2,0,0],{cast:false,transparent:true});
  }else if(profileTrees.has(kind)){
    const evergreen=['pine','fir','juniper'].includes(kind),low=['grass','reeds','crop','shrub'].includes(kind);
    if(kind==='cactus'){
      add('column','leafDark',0,2.3,0,.57,4.1,.57);
      for(const s of sides){add('column','leaf',s*.65,2.45,0,.24,2.1,.24,[0,0,s*.62]);add('cap','leafLight',s*1.08,3.25,0,.29,.45,.29);}
      add('cap','leaf',0,4.42,0,.6,.8,.6);
    }else if(low){
      const stemCount=near?(kind==='shrub'?7:kind==='crop'?8:6):3;
      for(let n=0;n<stemCount;n++){
        const angle=n*2.39996,off=n?(.34+.1*(n%3)):0,x=Math.cos(angle)*off,z=Math.sin(angle)*off;
        const length=(kind==='crop'?1.6:kind==='reeds'?2.2:kind==='shrub'?1.1:.65)*(0.84+(n%3)*.13);
        add('stem','leafDark',x,length*.48,z,.075,length,.075,[Math.sin(angle)*.18,0,Math.cos(angle)*.16]);
        add('leaf',n%2?'leafLight':'leaf',x+.11,length*.9,z,.32,length*.48,.24);
        if(near&&kind==='reeds')add('cap','bark',x,length*1.02,z,.11,.34,.11);
      }
    }else{
      let crownY=3.6,stemH=4.6;
      if(kind==='willow'){crownY=3.9;stemH=4.3;}
      if(kind==='juniper'){crownY=2.7;stemH=3.3;}
      add('trunk','bark',0,stemH*.43,0,kind==='oak'?.55:.36,stemH*.86,kind==='oak'?.55:.36,[0,0,.04]);
      add('root','wood',0,.22,0,1.05,.36,.96);
      if(evergreen){
        for(let i=0;i<(near?4:2);i++)add('fir','leafDark',0,crownY+i*.9,0,2.4-i*.44,2.7-i*.17,2.3-i*.35);
        add('cap','leafLight',0,stemH+2.1,0,.45,.65,.45);
      }else{
        const lobes=near?(kind==='willow'?6:kind==='maple'?6:5):2;
        for(let i=0;i<lobes;i++){
          const angle=i*2.39996,x=Math.cos(angle)*(i?1.3:0),z=Math.sin(angle)*(i?1.1:0);
          add('branch','wood',x*.45,crownY-.3,z*.45,.2,1.5,.2,[Math.sin(angle)*.15,0,-Math.cos(angle)*.19]);
          add('canopy',i%3?'leaf':'leafLight',x,crownY+.75+(i%3)*.22,z,1.65,1.2,1.45);
        }
        if(kind==='willow'&&near)for(let i=0;i<6;i++){
          const a=i*P/3;add('stem','leafDark',Math.cos(a)*1.65,crownY-.25,Math.sin(a)*1.65,.07,2.7,.07);
        }
      }
    }
  }else if(['rock','redrock','boulder'].includes(kind)){
    const red=kind==='redrock',mass=kind==='boulder'?1.35:1;
    add('boulder',red?'clay':'rock',0,1.05,0,2.3*mass,1.85,1.9*mass,[.06,.38,.1]);
    add('boulder',red?'sand':'rockLight',.8,.75,-.65,1.15*mass,1.08,1.25*mass,[.18,.3,.12]);
    if(near)for(let i=0;i<3;i++)add('slab',red?'clay':'rockLight',-.7+i*.73,1.15+i*.24,0,.63,.11,1.75,[.05,i*.2,0]);
  }else if(kind==='pole'){
    add('column','wood',0,4.65,0,.33,9.3,.33);
    add('beam','wood',0,8.65,0,5.6,.24,.34);
    for(const x of [-2,0,2]){add('cap','steelDark',x,8.95,0,.27,.34,.27);if(near)add('insulator','trim',x,9.24,0,.16,.27,.16);}
    if(near)add('beam','steel',0,6.1,.34,.23,1.8,.15);
  }else if(kind==='fence'){
    const n=near?5:3;
    for(let i=0;i<n;i++){const z=(i-(n-1)/2)*3.3;add('post','wood',0,1.3,z,.25,2.6,.26);add('cap','trim',0,2.65,z,.3,.18,.3);}
    for(const y of [.85,1.85])add('beam','wood',0,y,0,.16,.20,Math.max(7,(n-1)*3.3+.4));
  }else if(kind==='shelter'){
    add('foundation','rock',0,.25,0,7,.5,5.3);
    for(const x of [-2.7,2.7])for(const z of [-1.9,1.9])add('column','wood',x,2.5,z,.34,4.5,.34);
    add('roof','roof',0,5.0,0,8.2,.62,6.5);
    add('roofTrim','trim',0,5.42,0,8.3,.11,6.6);
    if(near){add('bench','wood',0,1.05,0,3.4,.24,.65);add('panel','glass',0,3.1,-2.65,3.7,1.6,.08);}
  }else if(kind==='culvert'){
    add('foundation','rock',0,.12,0,8,.3,6);
    add('pipe','steelDark',0,1.6,0,2.7,2.7,3.4,[P/2,0,0]);
    add('pipe','steel',0,1.6,0,2.3,2.3,3.45,[P/2,0,0]);
    add('rock','rockLight',-2.45,1.3,.7,2.0,2.2,4.0);
    add('rock','rockLight',2.45,1.3,.7,2.0,2.2,4.0);
    if(near)for(const s of sides)add('cap','steel',s*3,2.9,0,.8,.2,3.8);
  }else if(kind==='barrier'){
    add('foundation','rock',0,.28,0,4.0,.56,1.2);
    for(const x of [-1.3,0,1.3]){add('bollard','clay',x,1.0,0,.78,1.4,.76);add('band','trim',x,1.25,0,.86,.24,.82);}
    if(near)add('beam','steelDark',0,1.92,0,4.9,.18,.19);
  }else if(kind==='depot'||kind==='diner'){
    const diner=kind==='diner',w=diner?9:11,d=diner?6:8;
    add('foundation','rock',0,.16,0,w+1,.3,d+1);
    add('bevelBody',diner?'brick':'wood',0,2.9,0,w,5.5,d);
    add('roof',diner?'roof':'steelDark',0,5.85,0,w+1.2,.65,d+1.5);
    add('roofTrim','trim',0,6.25,0,w+1.3,.13,d+1.5);
    for(const x of [-w*.28,w*.28]){
      add('windowRecess','steelDark',x,3.2,d*.5+.07,2.1,1.55,.12);
      add('windowGlass','glass',x,3.2,d*.5+.16,1.85,1.29,.07);
      if(near)add('windowPane','trim',x,3.2,d*.5+.24,.08,1.32,.09);
    }
    add('door','steelDark',w*.4,1.72,d*.5+.1,1.22,3.08,.18);
    if(diner){
      add('awning','roof',0,4.3,d*.65,7,.35,2.4);
      add('sign','cyan',0,7.1,0,3,.58,.4);
    }else{
      add('loadingCanopy','steelDark',-2,3.2,d*.7,4.2,.28,3.1);
      if(near)for(let i=0;i<3;i++)add('crate','wood',-3+i*1.2,.65,d*.62,.9,1,.8);
    }
  }else throw new RangeError(`Unsupported environment asset kind: ${kind}`);
  if(motif.id==='works'&&descriptor.role==='landmark'&&near){
    add('marker','trim',-2,1.7,-1,.32,3.4,.32);add('marker','trim',2,1.7,-1,.32,3.4,.32);
  }
  if(variant.id==='weathered'&&near&&descriptor.role!=='on-road-paint'){
    // Small edge-wear/rust patch, never additional collision geometry.
    if(['shelter','depot','diner','barrier','fence'].includes(kind))add('wear','worn',.35,.58,.5,.8,.065,.5);
  }
  return Object.freeze({id:descriptor.id,kind,biome,templateId:tile.id,variantId:variant.id,
    localScale:descriptor.scale,materialTint:tint,position:descriptor.position,heading:descriptor.heading,
    level:lod,parts:Object.freeze(parts),collision:'none; visual presentation only'});
}
export function authorEnvironmentTile(templateId,variantId){
  const template=ENVIRONMENT_TILE_BY_ID.get(templateId),variant=ENV_TILE_VARIANTS.find(v=>v.id===variantId);
  if(!template||!variant)throw RangeError('Unknown authored environment tile');
  return Object.freeze({id:`${template.id}:${variant.id}`,version:'long-haul:200m:tile-assembly:v1',
    length:200,composition:template.composition,biome:template.biome,variant:variant.id,
    authoring:ENVIRONMENT_AUTHORING_SOURCE,
    interfaces:Object.freeze({entry:'continuous-road-cross-section',exit:'continuous-road-cross-section',
      terrain:'existing-streamed-surface',onRoad:'paint-only',roadside:'outside-canonical-road-clearance',
      occupancy:'existing-160m-cell-by-anchor'}),
    sourceObjects:Object.freeze([template.motif.landmark,template.region.primary,template.region.secondary,template.region.rock]),
    quality:Object.freeze({near:'bevelled-multi-part-styled-meshes',far:'simplified-profile-LOD'})});
}
