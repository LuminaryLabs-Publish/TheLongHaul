/* Luminary-authored neighborhood assemblies in the existing Nexus World / Three
 * presentation. Road topology and state are game-owned; models and GPU objects
 * remain here. This host owns no game tick, save state or map generator. */
(() => {
  'use strict';
  const base=new URL('../../assets/settlements/low-poly-neighborhood/',document.currentScript.src);
  const models=new Map(),root=new THREE.Group();root.name='LH_CONNECTED_TOWNS';worldRoot.add(root);
  const MAX_PER_TYPE=8,MAX_VISIBLE_DISTANCE=660;
  const state={ready:false,loaded:0,triangles:0,visible:0,activeTowns:0,collisionCandidates:0,errors:[],source:'LowPolyNeighborhood v0.9.0-rc1'};
  const api=window.LongHaulTowns={ready:false,readyPromise:null,getState:()=>({...state,errors:[...state.errors]})};
  const dummy=new THREE.Object3D();let lastAt=-Infinity,lastRevision=-1,lastPosition=null;
  function clear(){for(const model of models.values())model.mesh.count=0;state.visible=0;state.activeTowns=0;}
  function refresh(now){
    if(!state.ready)return;
    if(!course?.endless||currentScene()!=='driving'){clear();return;}
    const p=readTruck().position,revision=course.endless.revision;
    if(revision===lastRevision&&now-lastAt<350&&lastPosition&&Math.hypot(p.x-lastPosition.x,p.z-lastPosition.z)<45)return;
    lastAt=now;lastRevision=revision;lastPosition={x:p.x,z:p.z};
    const byType=new Map();let towns=0;
    for(const town of course.towns??[]){
      if(Math.hypot(town.x-p.x,town.z-p.z)>MAX_VISIBLE_DISTANCE+200)continue;
      towns++;
      for(const parcel of town.parcels){
        if(Math.hypot(parcel.x-p.x,parcel.z-p.z)>MAX_VISIBLE_DISTANCE)continue;
        const a=byType.get(parcel.assetId)??[];a.push(parcel);byType.set(parcel.assetId,a);
      }
    }
    let count=0;
    for(const [id,model] of models){
      const items=(byType.get(id)??[]).slice(0,MAX_PER_TYPE);
      model.mesh.count=items.length;count+=items.length;
      for(let i=0;i<items.length;i++){
        const p=items[i];
        dummy.position.set(p.x,terrainHeight(course,p.x,p.z)-model.bounds.minY+.12,p.z);
        dummy.rotation.set(0,p.heading,0);
        dummy.scale.set(1,1,1);dummy.updateMatrix();model.mesh.setMatrixAt(i,dummy.matrix);
      }
      if(items.length)model.mesh.instanceMatrix.needsUpdate=true;
    }
    state.visible=count;state.activeTowns=towns;
  }
  const oldCandidates=obstacleCandidates;
  obstacleCandidates=function withTownBuildings(position,radius=45){
    const found=oldCandidates(position,radius);
    if(!state.ready||!course?.towns)return found;
    let count=0;
    for(const town of course.towns){
      if(Math.hypot(town.x-position.x,town.z-position.z)>MAX_VISIBLE_DISTANCE+140)continue;
      for(const parcel of town.parcels){
        const model=models.get(parcel.assetId);if(!model)continue;
        const d=Math.hypot(parcel.x-position.x,parcel.z-position.z),r=Math.max(3,Math.min(9,model.radius));
        if(d>radius+r)continue;
        found.push({id:parcel.id,kind:'town-building',x:parcel.x,z:parcel.z,
          y:terrainHeight(course,parcel.x,parcel.z),height:model.bounds.maxY-model.bounds.minY,radius:r});
        count++;
      }
    }
    state.collisionCandidates=count;return found;
  };
  const oldFrame=arcadeVisualFrame;
  arcadeVisualFrame=function townPresentationFrame(now){oldFrame(now);refresh(now);};
  api.readyPromise=(async()=>{
    try{
      const index=await fetch(new URL('manifest.json',base));
      if(!index.ok)throw Error('Neighborhood manifest not found');
      const manifest=await index.json();
      if(manifest.schema!=='long-haul.settlement-assets/1'||manifest.buildings?.length!==17)
        throw Error('Unexpected neighborhood asset manifest');
      const entries=await Promise.all(manifest.buildings.map(async data=>{
        const response=await fetch(new URL(data.file,base),{cache:'force-cache'});
        if(!response.ok)throw Error(`${data.file}: HTTP ${response.status}`);
        const parsed=parseSettlementGlb(await response.arrayBuffer());
        return {data,parsed};
      }));
      for(const {data,parsed} of entries){
        const geometry=createSettlementGeometry(THREE,parsed);
        const material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,
          roughness:.94,metalness:0,flatShading:true,side:THREE.DoubleSide});
        material.userData.lhCelKind='structure';
        const mesh=new THREE.InstancedMesh(geometry,material,MAX_PER_TYPE);
        mesh.name='LH_TOWN_'+data.id;mesh.count=0;mesh.frustumCulled=false;
        mesh.receiveShadow=true;mesh.castShadow=false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        root.add(mesh);
        const b=parsed.bounds;
        models.set(data.id,{mesh,bounds:b,radius:Math.hypot(b.maxX-b.minX,b.maxZ-b.minZ)/2});
        state.triangles+=parsed.triangles;
      }
      state.loaded=models.size;state.ready=true;api.ready=true;return true;
    }catch(error){state.errors.push(String(error));console.warn('Connected towns retain roads but missing authored buildings',error);clear();return false;}
  })();
})();
