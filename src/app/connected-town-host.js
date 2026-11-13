/* Luminary-authored neighborhood assemblies in the existing Nexus World / Three
 * presentation. Road topology and state are game-owned; models and GPU objects
 * remain here. This host owns no game tick, save state or map generator. */
(() => {
  'use strict';
  const base=new URL('../../assets/settlements/low-poly-neighborhood/',document.currentScript.src);
  const models=new Map(),root=new THREE.Group();root.name='LH_CONNECTED_TOWNS';worldRoot.add(root);
  const detailMaterial=new THREE.MeshStandardMaterial({color:0x74d6d9,roughness:.76,flatShading:true});
  detailMaterial.userData.lhCelKind='structure';
  const detailGeometry=new THREE.BoxGeometry(1,1,1),detailLocal=new THREE.Matrix4();
  const HERO_BUILDINGS=new Set(['Shop_Cafe','Shop_CornerMarket','House_Victorian','House_Craftsman','Apartment_LowRise']);
  const MAX_PER_TYPE=32,MAX_VISIBLE_DISTANCE=1050;
  const state={ready:false,loaded:0,triangles:0,visible:0,activeTowns:0,collisionCandidates:0,facadeDetails:0,outerDistricts:0,roadsideTrees:0,errors:[],source:'LowPolyNeighborhood v0.9.0-rc1'};
  const api=window.LongHaulTowns={ready:false,readyPromise:null,getState:()=>({...state,errors:[...state.errors]})};
  const dummy=new THREE.Object3D();let lastAt=-Infinity,lastRevision=-1,lastPosition=null,treeModel=null;
  function clear(){
    for(const model of models.values()){model.mesh.count=0;for(const part of model.details??[])part.mesh.count=0;}
    if(treeModel)treeModel.mesh.count=0;
    state.visible=0;state.activeTowns=0;state.outerDistricts=0;state.roadsideTrees=0;state.facadeDetails=0;
  }
  function refresh(now){
    if(!state.ready)return;
    if(['paused','settings','credits'].includes(currentScene()))return;
    if(!course?.endless||currentScene()!=='driving'){clear();return;}
    const p=readTruck().position,revision=course.endless.revision;
    if(revision===lastRevision&&now-lastAt<350&&lastPosition&&Math.hypot(p.x-lastPosition.x,p.z-lastPosition.z)<45)return;
    lastAt=now;lastRevision=revision;lastPosition={x:p.x,z:p.z};
    const byType=new Map(),treeItems=[];let towns=0,outerDistricts=0;
    for(const town of course.towns??[]){
      if(Math.hypot(town.x-p.x,town.z-p.z)>MAX_VISIBLE_DISTANCE+(town.distanceFromHighway??178)+220)continue;
      let active=false;
      for(const parcel of [...town.parcels,...(town.outlyingParcels??[])]){
        if(Math.hypot(parcel.x-p.x,parcel.z-p.z)>MAX_VISIBLE_DISTANCE)continue;
        const a=byType.get(parcel.assetId)??[];a.push(parcel);byType.set(parcel.assetId,a);
        active=true;if(parcel.districtId)outerDistricts++;
      }
      for(const tree of town.trees??[])if(Math.hypot(tree.x-p.x,tree.z-p.z)<=MAX_VISIBLE_DISTANCE)treeItems.push(tree);
      if(active)towns++;
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
      for(const part of model.details??[]){
        part.mesh.count=items.length;
        for(let i=0;i<items.length;i++){
          const parcel=items[i],y=terrainHeight(course,parcel.x,parcel.z)-model.bounds.minY+.12;
          dummy.position.set(parcel.x,y,parcel.z);dummy.rotation.set(0,parcel.heading,0);
          dummy.scale.set(1,1,1);dummy.updateMatrix();
          detailLocal.makeTranslation(...part.offset);detailLocal.scale(new THREE.Vector3(...part.size));
          part.mesh.setMatrixAt(i,dummy.matrix.clone().multiply(detailLocal));
        }
        if(items.length)part.mesh.instanceMatrix.needsUpdate=true;
      }
    }
    if(treeModel){
      const trees=treeItems.slice(0,96);treeModel.mesh.count=trees.length;
      for(let i=0;i<trees.length;i++){
        const tree=trees[i];dummy.position.set(tree.x,terrainHeight(course,tree.x,tree.z)-treeModel.bounds.minY,tree.z);
        dummy.rotation.set(0,(i*2.39996)%(Math.PI*2),0);dummy.scale.set(1,1,1);dummy.updateMatrix();
        treeModel.mesh.setMatrixAt(i,dummy.matrix);
      }
      if(trees.length)treeModel.mesh.instanceMatrix.needsUpdate=true;
      state.roadsideTrees=trees.length;
    }
    state.visible=count;state.activeTowns=towns;state.outerDistricts=outerDistricts;
    state.facadeDetails=[...models.values()].reduce((n,m)=>n+(m.details?.length??0)*m.mesh.count,0);
  }
  const oldCandidates=obstacleCandidates;
  obstacleCandidates=function withTownBuildings(position,radius=45){
    const found=oldCandidates(position,radius);
    if(!state.ready||!course?.towns)return found;
    let count=0;
    for(const town of course.towns){
      if(Math.hypot(town.x-position.x,town.z-position.z)>MAX_VISIBLE_DISTANCE+140)continue;
      for(const parcel of [...town.parcels,...(town.outlyingParcels??[])]){
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
        const details=[];
        if(HERO_BUILDINGS.has(data.id)){
          const w=b.maxX-b.minX,h=b.maxY-b.minY,front=b.maxZ+.17;
          const fittings=[
            {offset:[0,b.minY+h*.56,front],size:[w*.48,.13,.25]},
            {offset:[0,b.minY+h*.79,front-.12],size:[w*.68,.2,.3]},
            {offset:[0,b.minY+h*.31,front+.12],size:[w*.3,.1,.45]}
          ];
          for(let n=0;n<fittings.length;n++){
            const part=new THREE.InstancedMesh(detailGeometry,detailMaterial,MAX_PER_TYPE);
            part.name='LH_FACADE_'+data.id+'_'+n;part.count=0;part.frustumCulled=false;
            part.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(part);
            details.push({mesh:part,...fittings[n]});
          }
        }
        models.set(data.id,{mesh,bounds:b,radius:Math.hypot(b.maxX-b.minX,b.maxZ-b.minZ)/2,details});
        state.triangles+=parsed.triangles;
      }
      // Low-poly maple is an optional authored GLB, never a blocking dependency.
      try{
        const source=new URL('../../assets/neighborhood/Tree_Maple.glb',document.currentScript.src);
        const response=await fetch(source,{cache:'force-cache'});
        if(response.ok){
          const parsed=parseSettlementGlb(await response.arrayBuffer());
          const geometry=createSettlementGeometry(THREE,parsed);
          const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true,side:THREE.DoubleSide});
          material.userData.lhCelKind='foliage';
          const mesh=new THREE.InstancedMesh(geometry,material,96);
          mesh.name='LH_TOWN_MAPLE';mesh.count=0;mesh.frustumCulled=false;
          mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(mesh);
          treeModel={mesh,bounds:parsed.bounds};
        }
      }catch(error){state.errors.push('Optional maple: '+String(error));}
      state.loaded=models.size;state.ready=true;api.ready=true;return true;
    }catch(error){state.errors.push(String(error));console.warn('Connected towns retain roads but missing authored buildings',error);clear();return false;}
  })();
})();
