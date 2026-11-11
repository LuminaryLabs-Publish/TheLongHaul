/* Product-owned traffic presentation. Loaded AFTER illustrated materials and
 * the road host. Never replaces the traffic controller, its collision classes,
 * velocities, near-miss identities, route generation, or NexusEngine state. */
(() => {
  const initial = {source:TRAFFIC_FLEET_SOURCE.id,status:'unavailable',pool:0,degraded:[]};
  const report = window.LongHaulTrafficArt = {getState:()=>({...initial})};
  try {
    const factory=createTrafficVehicleFactory({THREE,materials});factory.prewarm();
    const oldUpdate=arcadeTrafficUpdate;
    const slots=[];
    for(let i=0;i<arcadeVehicles.length;i++){
      const vehicle=arcadeVehicles[i],legacy=vehicle.group;
      const root=new THREE.Group();root.name=`LH_TrafficPool_${i}`;root.visible=false;
      legacy.removeFromParent();arcadeTrafficRoot.add(root);vehicle.group=root;
      slots.push({vehicle,root,legacy,visuals:new Map(),selected:null,lastId:null});
    }
    function select(slot,id){
      if(slot.selected==='legacy')return null;
      if(slot.selected===id)return slot.visuals.get(id);
      let visual=slot.visuals.get(id);
      if(!visual){visual=factory.createVehicle(id);visual.root.visible=false;
        slot.root.add(visual.root);slot.visuals.set(id,visual)}
      if(slot.selected)slot.visuals.get(slot.selected).root.visible=false;
      visual.root.visible=true;slot.selected=id;return visual;
    }
    arcadeTrafficUpdate=function updateAuthoredTraffic(dt){
      const outcome=oldUpdate(dt);
      if(!arcadeTrafficRoot.visible || simulationFrozen())return outcome;
      const truck=readTruck();
      for(let i=0;i<slots.length;i++){
        const slot=slots[i],v=slot.vehicle;
        if(!v.active||!slot.root.visible)continue;
        if(v.id!==slot.lastId){
          const serial=Number(String(v.id??'').split(':').pop())||0;
          const profile=trafficVariantForClass(v.kind,i,serial);
          try{select(slot,profile)}catch(error){
            if(slot.selected)slot.visuals.get(slot.selected)?.root.removeFromParent();
            slot.legacy.visible=true;slot.root.add(slot.legacy);slot.selected='legacy';
            initial.status='degraded';initial.degraded.push({slot:i,reason:String(error)});
            console.warn('Traffic variant failed; restoring this slot to its original model.',error);
          }
          slot.lastId=v.id;
        }
        const active=slot.visuals.get(slot.selected);
        if(!active)continue;
        const distance=Math.hypot(v.group.position.x-truck.position.x,v.group.position.z-truck.position.z);
        v.comicBreakup=()=>factory.createBreakup(slot.selected);
        active.setDistance(distance);
        active.spin(dt,v.direction<0?-v.speed:v.speed);
      }
      return outcome;
    };
    initial.status='authored';initial.pool=slots.length;initial.variants=TRAFFIC_FLEET_SOURCE.vehicleIds;
    initial.geometry=factory.stats();
    report.getState=()=>({...initial,active:slots.filter(s=>s.vehicle.active&&s.vehicle.group.visible)
      .map(s=>({slot:slots.indexOf(s),type:s.selected,lod:s.visuals.get(s.selected)?.lod??'none'}))});
  }catch(error){
    initial.status='fallback';initial.reason=String(error);
    console.warn('Traffic art assembly failed; original road vehicles remain.',error);
  }
})();