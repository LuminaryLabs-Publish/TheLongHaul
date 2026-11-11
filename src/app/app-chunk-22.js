// TLH-043 presentation adapter. Physics and transient kit state remain in Nexus;
// meshes, comic lettering and real-time hit-stop presentation live in this host.
let comicDamageSide=null;
let comicHitStopHeld=false,comicPreviousTruckCollider=null,comicShakeLife=0;
const comicClock=createImpactClock(),comicOffset=new THREE.Vector3(),comicDirection=new THREE.Vector3();
let comicPresentationTime=0,comicRun='',comicImpactCount=0,comicDestructionCount=0;
const comicRoot=new THREE.Group();comicRoot.name='LH_COMIC_CRASH_EFFECTS';worldRoot.add(comicRoot);
const comicStage=$('#game-stage'),comicBursts=Array.from({length:4},()=>{
 const node=document.createElement('div');node.className='comic-impact-burst';node.setAttribute('aria-hidden','true');node.hidden=true;comicStage.append(node);return{node,life:0,point:new THREE.Vector3(),tier:'solid'};
});
const comicFragments=Array.from({length:80},()=>({root:new THREE.Group(),life:0,ownerId:null,velocity:new THREE.Vector3(),spin:new THREE.Vector3(),floor:0,radius:.2}));
for(const item of comicFragments){item.root.visible=false;comicRoot.add(item.root);}
const comicPuffGeo=new THREE.IcosahedronGeometry(1,1);
const comicPuffMats=[0xffcf3e,0xf2782f,0x5c536d].map(color=>{const mat=new THREE.MeshToonMaterial({color,emissive:color,emissiveIntensity:color===0x5c536d?0:.3});mat.userData.lhCelKind='structure';return mat;});
const comicPuffs=Array.from({length:24},(_,i)=>{const mesh=new THREE.Mesh(comicPuffGeo,comicPuffMats[i%3]);mesh.visible=false;comicRoot.add(mesh);return{mesh,life:0,total:0,velocity:new THREE.Vector3(),size:1};});
function clearComicPresentation(){
 camera.position.sub(comicOffset);comicOffset.set(0,0,0);comicClock.reset();comicHitStopHeld=false;comicShakeLife=0;
 for(const b of comicBursts){b.life=0;b.node.hidden=true;}
 for(const p of comicPuffs){p.life=0;p.mesh.visible=false;}
 for(const f of comicFragments){f.life=0;f.root.visible=false;f.root.clear();}
}
function resetComicCrashes(){clearComicPresentation();comicPreviousTruckCollider=null;comicRun=runKey;engine.n.longHaulImpact.reset();engine.n.longHaulDestructibles.reset();for(const v of arcadeVehicles){v.previousCollider=null;v.comicFlight=null;v.comicBreakup=null;v.group.scale.set(1,1,1);} }
const comicPreviousReset=resetArcadeOverhaul;
resetArcadeOverhaul=function(){resetComicCrashes();comicPreviousReset();};
window.addEventListener('blur',()=>{comicClock.reset();comicHitStopHeld=false;comicPreviousTruckCollider=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){comicClock.reset();comicHitStopHeld=false;comicPreviousTruckCollider=null;}});
function resetComicTrafficVehicle(v){
 if(v.id){engine.n.longHaulDestructibles.remove(v.id);engine.n.longHaulImpact.release(v.id);}
 v.previousCollider=null;v.comicFlight=null;v.comicBreakup=null;v.group.scale.set(1,1,1);
}
function queueComicImpulse(truck,impulse){
 // Movement owns cargo momentum scaling. Remove its existing scalar here to
 // avoid applying mass twice: Impact Kit already used both physical masses.
 // V1 is a byte-preserved rollback kit. Its public snapshot API clears the
 // old cruise floor before queuing an impact, without changing V1 source.
 if(truck.boostCruiseSpeed>0)engine.n.longHaulTruck.loadSnapshot({...truck,boostCruiseSpeed:0});
 const scale=Math.max(.01,finite(truck.loadFactors?.momentumScale,1));
 engine.n.longHaulTruck.impulse({...impulse,x:impulse.x/scale,z:impulse.z/scale});
}
function spendComicTruckDamage(amount,reason,event){
 comicDamageSide=event?-Math.sign(event.normal.x*Math.cos(event.heading)-event.normal.z*Math.sin(event.heading)):null;
 try{return spendTruckDamage(amount,reason);}finally{comicDamageSide=null;}
}
function applyComicTrafficImpact(vehicle,event,targetVelocity){
 const response=event.response,receipt=applyLongHaulOperationOnce(engine,runKey,event.id,()=>({seconds:response.tier==='scrape'?0:5}));
 if(!receipt.applied)return;
 vehicle.hit=true;
 // Keep the existing armor/shield, cargo protection and score owners.
 const damage=spendComicTruckDamage(response.truckDamage,'traffic-collision',event);spendCargoDamage(response.cargoDamage,'traffic-collision');
 queueComicImpulse(readTruck(),response.impulse);
 engine.n.longHaulRun.penalty({id:event.id,kind:'traffic',label:'Traffic collision',seconds:response.tier==='scrape'?0:5,collision:true});
 const destruction=engine.n.longHaulDestructibles.impact(vehicle.id,event);
 // Propel the visible car away from the impact, with forward momentum.
 const truck=readTruck(),heading=finite(truck.heading),forwardX=Math.sin(heading),forwardZ=Math.cos(heading);
 const speed=Math.max(18,Math.abs(finite(truck.speed))+12+response.severity*8);
 const awayX=-event.normal.x,awayZ=-event.normal.z;
 const dx=forwardX*.82+awayX*.18,dz=forwardZ*.82+awayZ*.18,len=Math.hypot(dx,dz)||1;
 vehicle.comicFlight={vx:dx/len*speed,vz:dz/len*speed,vy:5+response.severity*4,age:0,distance:0,event,destroyed:destruction.destroyed===true};
 vehicle.previousCollider=null;
 if(destruction.destroyed){comicDestructionCount++;}
 else if(destruction.state==='damaged')vehicle.group.scale.y=Math.max(.88,destruction.health/DESTRUCTIBLE_PROFILES[vehicle.kind].health*.12+.88);
 presentComicImpact({...event,response:{...response,hitStop:.2}},destruction.destroyed);
 arcadeRecord('comic-impact',{id:event.id,target:event.targetId,tier:response.tier,closingSpeed:event.closingSpeed,normal:event.normal,damage,destroyed:destruction.destroyed===true});
 audio.hit();
}
function comicObstacleEvent(truck,obstacle){
 const dx=truck.position.x-obstacle.x,dz=truck.position.z-obstacle.z,length=Math.hypot(dx,dz)||1;
 const normal={x:dx/length,z:dz/length};
 return engine.n.longHaulImpact.contact({targetId:`obstacle:${obstacle.id}`,truck,targetMass:100000,seed:course?.seed,
  targetVelocity:{x:finite(obstacle.velocity?.x),z:finite(obstacle.velocity?.z)},contact:{normal,point:{x:obstacle.x+normal.x*obstacle.radius,y:truck.position.y+1,z:obstacle.z+normal.z*obstacle.radius}}});
}
function presentComicImpact(event,destroyed=false){
 comicImpactCount++;const r=event.response;
 const stopScale=settings.motion?finite(settings.hitStop,1):0;
 comicClock.request(r.hitStop,stopScale);
 if(settings.motion){comicShakeLife=Math.max(comicShakeLife,r.tier==='scrape'?.08:.25+r.severity*.10);comicDirection.set(event.normal.x,0,event.normal.z);}
 let b=comicBursts.find(x=>x.life<=0);if(!b)b=comicBursts.reduce((a,c)=>a.life<c.life?a:c);
 const words=r.tier==='scrape'?['SKRR!']:destroyed?['KAPOW!','WHAM!']:['BAM!','WAP!'];
 b.node.textContent=words[(comicImpactCount-1)%words.length];b.tier=r.tier;b.life=r.tier==='scrape'?.3:.48;b.point.set(event.point.x,event.point.y+1,event.point.z);
 b.node.dataset.tier=r.tier;b.node.hidden=false;b.node.style.rotate=`${settings.motion?(comicImpactCount%3-1)*8:0}deg`;
 if(destroyed)for(let i=0;i<(settings.motion?9:3);i++){
  const p=comicPuffs.find(x=>x.life<=0);if(!p)break;
  p.total=p.life=.35+(i%3)*.18;p.size=.6+(i%3)*.4;p.mesh.material=comicPuffMats[settings.motion?i%3:2];
  p.mesh.position.set(event.point.x,event.point.y,event.point.z);p.mesh.scale.setScalar(.1);p.mesh.visible=true;
  const angle=i*2.399;p.velocity.set(Math.cos(angle)*(2+i*.2),2+i*.35,Math.sin(angle)*(2+i*.2));
 }
}
function spawnComicBreakup(vehicle,event,velocity){
 vehicle.group.updateWorldMatrix(true,true);
 const pieces=vehicle.comicBreakup?vehicle.comicBreakup():vehicle.group.children.filter(p=>p.visible).slice(0,12).map(p=>p.clone(true));
 const matrix=vehicle.group.matrixWorld;
 for(let i=0;i<Math.min(14,pieces.length);i++){
  const f=comicFragments.find(x=>x.life<=0);if(!f)break;
  const piece=pieces[i];piece.updateMatrix();const worldMatrix=matrix.clone().multiply(piece.matrix);
  f.ownerId=vehicle.id;f.root.clear();f.root.add(piece);piece.position.set(0,0,0);piece.quaternion.identity();piece.scale.set(1,1,1);
  worldMatrix.decompose(f.root.position,f.root.quaternion,f.root.scale);
  const angle=(i+event.tick%7)*2.399,spread=2+event.response.severity*5;
  f.velocity.set(velocity.x-event.normal.x*spread+Math.cos(angle)*spread,3+i%3,velocity.z-event.normal.z*spread+Math.sin(angle)*spread);
  f.spin.set(Math.sin(angle)*4,Math.cos(angle)*3,2);f.floor=vehicle.group.position.y;
  const box=new THREE.Box3().setFromObject(f.root);f.radius=Math.max(.1,(box.max.y-box.min.y)*.5);
  f.root.position.y=Math.max(f.root.position.y,f.floor+f.radius);f.life=3.4;f.root.visible=true;
 }
}
function beginComicCrashFrame(dt,sceneId){
 camera.position.sub(comicOffset);comicOffset.set(0,0,0);
 if(comicRun!==runKey)resetComicCrashes();
 if(sceneId!=='driving'){
  comicClock.reset();comicHitStopHeld=false;
  if(sceneId!=='paused'&&sceneId!=='settings')clearComicPresentation();
  return;
 }
 if(mapOpen||skillMenuOpen()||!arcadeGaragePanel.hidden||launchIntro.active){comicClock.reset();comicHitStopHeld=false;return;}
 comicHitStopHeld=comicClock.advance(dt);
}
function updateComicCrashPresentation(dt,sceneId,simulate,simulationDt=dt){
 if(sceneId!=='driving'||mapOpen||skillMenuOpen()||!arcadeGaragePanel.hidden)return;
 comicPresentationTime+=dt;
 if(comicRoot.parent!==worldRoot)worldRoot.add(comicRoot);
 const truck=readTruck();
 for(const f of comicFragments){if(f.life<=0)continue;
  if(simulate){const step=simulationDt;f.life=Math.max(0,f.life-step);f.velocity.y-=14*step;f.root.position.addScaledVector(f.velocity,step);
   if(f.root.position.y<f.floor+f.radius){f.root.position.y=f.floor+f.radius;f.velocity.y=Math.abs(f.velocity.y)*.25;f.velocity.x*=.72;f.velocity.z*=.72;}
   f.root.rotation.x+=f.spin.x*step;f.root.rotation.y+=f.spin.y*step;f.root.rotation.z+=f.spin.z*step;
  }
  if(f.life<=0||Math.hypot(f.root.position.x-truck.position.x,f.root.position.y-truck.position.y,f.root.position.z-truck.position.z)>160){f.life=0;f.root.visible=false;f.root.clear();}
 }
 for(const p of comicPuffs){if(p.life<=0)continue;p.life=Math.max(0,p.life-dt);p.mesh.visible=p.life>0;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.scale.setScalar(p.size*(1-p.life/p.total)*2+.1);}
 for(const v of engine.n.longHaulDestructibles.snapshot())if(v.state==='destroyed'&&!arcadeVehicles.some(car=>car.id===v.id&&car.comicFlight)&&!comicFragments.some(f=>f.life>0&&f.ownerId===v.id))engine.n.longHaulDestructibles.retire(v.id);
 const stage=comicStage.getBoundingClientRect();
 const protectedRects=['#freight-hud','#journey-objective','#skill-hud','#risk-hud','#drive-box'].flatMap(selector=>{const el=$(selector);if(!el||el.hidden)return[];const r=el.getBoundingClientRect();return r.width&&r.height?[r]:[];});
 camera.updateMatrixWorld();
 for(const b of comicBursts){if(b.life<=0)continue;b.life=Math.max(0,b.life-dt);b.node.hidden=b.life<=0;
  const p=b.point.clone().project(camera);if(p.z< -1||p.z>1){b.node.hidden=true;continue;}
  const w=Math.min(stage.width*.5,b.tier==='heavy'?240:180),h=100;
  const baseX=clamp((p.x*.5+.5)*stage.width,w*.5+8,stage.width-w*.5-8),baseY=clamp((-p.y*.5+.5)*stage.height,h*.5+8,stage.height-h*.5-8);
  let position=null;
  for(const [dx,dy]of [[0,0],[0,-120],[180,0],[-180,0],[0,120]]){
   const x=clamp(baseX+dx,w*.5+8,stage.width-w*.5-8),y=clamp(baseY+dy,h*.5+8,stage.height-h*.5-8);
   if(!protectedRects.some(r=>x+w*.5>r.left-stage.left&&x-w*.5<r.right-stage.left&&y+h*.5>r.top-stage.top&&y-h*.5<r.bottom-stage.top)){position={x,y};break;}
  }
  if(!position){b.node.hidden=true;continue;}
  b.node.style.left=`${position.x}px`;b.node.style.top=`${position.y}px`;b.node.style.width=`${w}px`;b.node.style.opacity=String(Math.min(1,b.life/.12));
 }
 if(comicShakeLife>0){comicShakeLife=Math.max(0,comicShakeLife-dt);if(settings.motion){
  const amount=Math.min(.35,comicShakeLife)*Math.sin(comicPresentationTime*67)*.8;
  comicOffset.copy(comicDirection).multiplyScalar(amount);comicOffset.y=Math.cos(comicPresentationTime*81)*amount*.35;camera.position.add(comicOffset);camera.updateMatrixWorld();
 }}
}
// Explicit authoring/diagnostic attachment; no temporary state enters saves.
window.LongHaulComicCrashes={getState:()=>({truckId:engine.n.longHaulImpact.profile.truckId,impact:engine.n.longHaulImpact.snapshot(),vehicles:engine.n.longHaulDestructibles.snapshot(),held:comicHitStopHeld,remaining:comicClock.remaining,impacts:comicImpactCount,destroyed:comicDestructionCount,fragments:comicFragments.filter(f=>f.life>0).length,puffs:comicPuffs.filter(p=>p.life>0).length,bursts:comicBursts.filter(b=>b.life>0).length,limits:{fragments:80,puffs:24,bursts:4}})};
