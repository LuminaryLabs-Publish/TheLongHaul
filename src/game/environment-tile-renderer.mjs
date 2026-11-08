// Three.js presentation adapter for canonical n:authoring geometry assemblies.
// Meshes/materials belong to this renderer, not the road or world stream. Cells
// own instance buffers, and must release those when they are streamed out.
import {authoredEnvironmentObject,ENVIRONMENT_PALETTE,ENVIRONMENT_AUTHORING_SOURCE} from './environment-tile-authoring.mjs';

const hash=(input)=>{let h=2166136261;for(const c of String(input)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export const ENVIRONMENT_RENDER_LIMITS=Object.freeze({
  batchKeysPerCell:72,highPropsPerStep:4,lowPropsPerStep:3,batchesPerStep:3,
  highInstancesPerCell:650,lowInstancesPerCell:240
});

export function createEnvironmentTileRenderer({THREE,materials}){
  if(typeof THREE?.InstancedMesh!=='function'||typeof THREE?.MeshToonMaterial!=='function'||!materials?.truckRed?.gradientMap)
    throw new TypeError('Environment tiles require the illustrated game renderer and its cel-shaded ramp');
  const geometries=new Map(),tones=new Map(),created=new Set();
  const gradient=materials.truckRed.gradientMap;
  const rgb=hex=>[(hex>>>16&255)/255,(hex>>>8&255)/255,(hex&255)/255];
  function geometry(shape,lod){
    const key=`${shape}:${lod}`;
    if(geometries.has(key))return geometries.get(key);
    let g;
    if(shape==='decal')g=new THREE.PlaneGeometry(1,1);
    else if(['column','trunk','post','root','stem','bollard','branch','cap','insulator'].includes(shape))
      g=new THREE.CylinderGeometry(shape==='trunk'?.33:shape==='root'?.5:.42,shape==='trunk'?.55:.5,1,lod==='near'?9:6,1);
    else if(['canopy','leaf','boulder','rock'].includes(shape))g=new THREE.IcosahedronGeometry(.6,lod==='near'?1:0);
    else if(shape==='fir')g=new THREE.ConeGeometry(.58,1,lod==='near'?9:6,2);
    else if(shape==='pipe')g=new THREE.TorusGeometry(.5,.14,lod==='near'?8:4,lod==='near'?20:12);
    else if(['roof','bevelBody','foundation','roofTrim','awning','windowRecess','windowGlass'].includes(shape)&&lod==='near'){
      // Standard bevelled, multi-face architectural module: one cached mesh
      // shape, instantiated at authored dimensions rather than another box.
      const s=new THREE.Shape(),r=.11;
      s.moveTo(-.5+r,-.5);s.lineTo(.5-r,-.5);s.quadraticCurveTo(.5,-.5,.5,-.5+r);
      s.lineTo(.5,.5-r);s.quadraticCurveTo(.5,.5,.5-r,.5);
      s.lineTo(-.5+r,.5);s.quadraticCurveTo(-.5,.5,-.5,.5-r);
      s.lineTo(-.5,-.5+r);s.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
      g=new THREE.ExtrudeGeometry(s,{depth:.78,steps:1,bevelEnabled:true,bevelThickness:.11,bevelSize:.055,bevelSegments:2,curveSegments:3});
      g.translate(0,0,-.39);
    }else g=new THREE.BoxGeometry(1,1,1);
    g.computeVertexNormals?.();g.computeBoundingSphere?.();geometries.set(key,g);return g;
  }
  function material(role,transparent=false){
    const key=`${role}:${transparent}`;if(tones.has(key))return tones.get(key);
    const hex=ENVIRONMENT_PALETTE[role]??0xc4aea1;
    const mat=transparent?new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.82,side:THREE.DoubleSide,depthWrite:false,
      polygonOffset:true,polygonOffsetFactor:-2,fog:true}):
      new THREE.MeshToonMaterial({color:0xffffff,gradientMap:gradient,side:THREE.DoubleSide,fog:true});
    tones.set(key,mat);return mat;
  }
  function startCell({quality=true,visualOnly=false}={}){
    const cell={quality,visualOnly,buckets:new Map(),keys:null,cursor:0,instanceCount:0,objectCount:0,meshCount:0,
      meshes:[],finished:false};created.add(cell);return cell;
  }
  function queueObject(cell,obj){
    if(cell.finished)throw Error('Cannot edit committed environment tile cell');
    // Replace the original primitive/canopy tree art only while all three
    // prebuilt GLB families are loaded; preserve old art on asset failure.
    if(globalThis.LongHaulPrebuiltTrees?.ready && obj.role!=='on-road-paint' &&
      ['tree','maple','oak','pine','fir','juniper','willow'].includes(obj.kind)){
      cell.objectCount++;
      return;
    }
    const lod=cell.visualOnly||!cell.quality?'far':'near';
    const assembly=authoredEnvironmentObject(obj,{lod});
    const lim=cell.visualOnly||!cell.quality?ENVIRONMENT_RENDER_LIMITS.lowInstancesPerCell:ENVIRONMENT_RENDER_LIMITS.highInstancesPerCell;
    const heading=assembly.heading,sc=assembly.localScale;
    const sh=Math.sin(heading),ch=Math.cos(heading);
    for(const part of assembly.parts){
      if(cell.instanceCount>=lim)break;
      const key=`${part.shape}:${part.material}:${part.transparent?'decal':'solid'}:${lod}`;
      let bucket=cell.buckets.get(key);
      if(!bucket){
        if(cell.buckets.size>=ENVIRONMENT_RENDER_LIMITS.batchKeysPerCell)break;
        bucket={shape:part.shape,material:part.material,transparent:part.transparent,level:lod,instances:[]};
        cell.buckets.set(key,bucket);
      }
      const [x,y,z]=part.position;
      const p={
        x:assembly.position.x+(x*ch+z*sh)*sc,
        y:assembly.position.y+y*sc,
        z:assembly.position.z+(z*ch-x*sh)*sc,
      };
      const jitter=.88+(hash(`${obj.id}:${part.material}`)%33)/100;
      const base=rgb(ENVIRONMENT_PALETTE[part.material]??0xc4aea1),region=rgb(assembly.materialTint);
      const strength=['leaf','leafLight','leafDark','rock','rockLight','clay','sand'].includes(part.material)?0.36:0.08;
      const color=base.map((v,i)=>Math.min(1,Math.max(.03,(v*(1-strength)+region[i]*strength)*jitter)));
      bucket.instances.push({position:p,color,
        scale:part.scale.map(x=>x*sc),rotation:[part.rotation[0],heading+part.rotation[1],part.rotation[2]],
        tint:jitter,cast:part.cast});
      cell.instanceCount++;
    }
    cell.objectCount++;
  }
  function finalizeStep(cell,parent,maxBatches=ENVIRONMENT_RENDER_LIMITS.batchesPerStep){
    if(!cell.keys)cell.keys=[...cell.buckets.keys()].sort();
    let made=0;
    while(cell.cursor<cell.keys.length && made<maxBatches){
      const bucket=cell.buckets.get(cell.keys[cell.cursor++]);
      const mesh=new THREE.InstancedMesh(geometry(bucket.shape,bucket.level),material(bucket.material,bucket.transparent),bucket.instances.length);
      mesh.name=`LH_ENV_${bucket.shape}_${bucket.material}_${bucket.level}`;
      // Lighting host selects near casters from this authored batch; never
      // globally turn on every 200 m tile as a shadow caster.
      mesh.castShadow=false;
      mesh.receiveShadow=!bucket.transparent;
      mesh.userData.environmentAuthored=true;
      mesh.userData.source=ENVIRONMENT_AUTHORING_SOURCE.id;
      mesh.instanceMatrix.setUsage?.(THREE.StaticDrawUsage);
      const dummy=new THREE.Object3D();
      for(const [i,part] of bucket.instances.entries()){
        dummy.position.set(part.position.x,part.position.y,part.position.z);
        dummy.rotation.order='YXZ';dummy.rotation.set(...part.rotation);
        dummy.scale.set(...part.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
        mesh.setColorAt?.(i,new THREE.Color(...part.color));
      }
      mesh.instanceMatrix.needsUpdate=true;
      if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
      mesh.computeBoundingSphere?.();
      parent.add(mesh);cell.meshes.push(mesh);cell.meshCount++;made++;
    }
    cell.finished=cell.cursor>=cell.keys.length;
    return {finished:cell.finished,batches:made,meshes:cell.meshCount};
  }
  function releaseCell(cell){
    if(!cell)return;
    for(const mesh of cell.meshes){mesh.removeFromParent();mesh.dispose?.();}
    cell.meshes.length=0;cell.buckets.clear();cell.keys=null;cell.finished=true;created.delete(cell);
  }
  function stats(){return {source:ENVIRONMENT_AUTHORING_SOURCE.id,sharedGeometryCount:geometries.size,
    sharedMaterialCount:tones.size,activeCells:created.size};}
  return {startCell,queueObject,finalizeStep,releaseCell,stats};
}
