/** Actual continuous play and simulation-clock capture. No gameplay state
 * fixtures: a test-only analog steering adapter emits the same TruckInput
 * contract as the keyboard host. Throttle, brakes and powers use keyboard input.
 * The reference is 600 s / 10 fps; the edit is 60 s / 30 fps at native 1080p.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import {projectRoot,argValue,sourceIdentity,serveProject,loadBrowser,preparePage,beginRun,webglEvidence,saveJson,digest} from './validate-gameplay.mjs';
import {installFixedBrowserClock,freezeClock,setKeyboard} from './fixed-browser-clock.mjs';
const output=path.resolve(argValue('--output',path.join(projectRoot,'.cache/visual-film')));
const seconds=Number(argValue('--seconds','600')), fps=30, referenceFps=10, hz=60;
assert.ok(Number.isInteger(seconds)&&seconds>=60&&seconds<=600,'Duration is a bounded integral simulation time.');
await mkdir(output,{recursive:true});
const source=await sourceIdentity(), traces=[],samples=[],frames=[],segments=[],checks=[];
const check=(name,value,detail)=>{checks.push({name,passed:Boolean(value),detail});assert.ok(value,name);};
let server,browser,context,page,runtime,observations,held=new Set(),failure=null;
let editEncoder,sourceEncoder,editCount=0,referenceCount=0,active=null;
const encoder=file=>{
  const p=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',file.includes('Reference')?String(referenceFps):String(fps),'-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,file)],{stdio:['pipe','ignore','pipe']});
  const entry={p,errors:'',done:null};p.stderr.on('data',b=>entry.errors+=b);entry.done=once(p,'close').then(([code])=>{if(code)throw new Error('FFmpeg: '+entry.errors);});
  // Attach a handler immediately so an early exit is retained, not unhandled.
  entry.done.catch(()=>{});return entry;
};
const writeFrame=async(e,bytes)=>{if(!e.p.stdin.write(bytes))await once(e.p.stdin,'drain');};
const finish=async e=>{if(!e)return;e.p.stdin.end();await e.done;};
const selected=new Set();
const targets=['departure','first-pickup','delivery','sweep','hill','bridge','tunnel','weather','ability','finish'];
try {
  server=await serveProject();({browser,runtime}=await loadBrowser());
  context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await context.addInitScript(installFixedBrowserClock,{audioSeconds:seconds+8,sampleRate:48000});
  observations=await preparePage(context,server.url,{seed:'road-matrix-1',quality:true});page=observations.page;
  await page.waitForFunction(()=>window.__longHaulVisualsReady&&window.__longHaulRoadsReady);
  await beginRun(page);await freezeClock(page);
  const gl=await webglEvidence(page);check('Native 1920 x 1080 real WebGL',gl.width===1920&&gl.height===1080&&gl.pixels.distinctColors>100&&!gl.lost,gl);
  await saveJson(path.join(output,'render-profile.json'),gl);
  await page.evaluate(()=>{
    const base=preTickDriving;let smoothSteer=0;
    window.__journeyDriver={steer:0,command:null,draw:true,tick:0};
    const render=renderer.render.bind(renderer);
    renderer.render=(...args)=>{if(__journeyDriver.draw)render(...args);};
    preTickDriving=function(dt){
      const surface=base(dt);
      if(currentScene()!=='driving'||simulationFrozen()||launchIntro.active)return surface;
      const truck=readTruck(),intent=engine.n.coreInput.getIntent(),ground=groundSample(truck.position);
      const desired=__journeyDriver.steer;
      smoothSteer+=Math.max(-dt*2.5,Math.min(dt*2.5,desired-smoothSteer));
      const next={...intent,steer:smoothSteer};engine.n.coreInput.setIntent(next);
      engine.n.longHaulTruck.input({...next,rush:forwardBoost.snapshot().remaining>0,pitchControl:intent.throttle-intent.brake,
        steeringDamage:skillSteeringDamage,surface:surface.surface,surfaceGrip:surface.grip,
        roadClass:surface.road?.edge.roadClass,roadMaterial:surface.material,groundHeight:ground.height,groundNormal:ground.normal,
        barrierContacts:obstacleCandidates(truck.position,60).filter(o=>o.kind==='roundabout-island')});
      return surface;
    };
  });
  editEncoder=encoder('Highlights-Silent.mp4');sourceEncoder=encoder('Reference-600s-Silent.mp4');
  let lastThrottle=-Infinity,lastPower=-Infinity,lastRecovery=-Infinity,lane=-4.4,laneLock=-Infinity;
  const sessionId=await page.evaluate(()=>freightState.sessionId);
  for(let tick=0;tick<seconds*hz;tick+=2){
    const time=tick/hz;
    const state=await page.evaluate(({time,lane,laneLock})=>{
      const t=readTruck(),f=freightState,s=-t.position.z,chunk=roadChunkAt(course.seed,s);
      const protectedApproach=isEndlessLoadingZone(s),road=nearestRoad(course,t.position),progress=arcadeRoadProgress(road,arcadeNetwork);
      let targetLane=protectedApproach?-4.4:lane,lock=laneLock,nearestThreat=null;
      if(!protectedApproach&&progress){
        const hazards=arcadeEncounters.filter(e=>e.path===progress.path&&e.distance-progress.distance>10&&e.distance-progress.distance<155).sort((a,b)=>a.distance-b.distance);
        const obstacle=hazards[0];
        if(obstacle?.kind==='roadblock'){targetLane=-obstacle.safeLane;lock=time+4;}
        else if(obstacle?.kind==='ramp'&&f.ordinal===1){targetLane=-obstacle.lane;lock=time+4;}
        const forward={x:Math.sin(t.heading),z:Math.cos(t.heading)};
        nearestThreat=arcadeVehicles.filter(v=>v.group?.visible).map(v=>{const dx=v.group.position.x-t.position.x,dz=v.group.position.z-t.position.z;return{id:v.id,forward:dx*forward.x+dz*forward.z,lateral:dx*forward.z-dz*forward.x};}).filter(v=>v.forward>0&&v.forward<65&&Math.abs(v.lateral)<3.8).sort((a,b)=>a.forward-b.forward)[0];
        if(nearestThreat&&time>lock&&!obstacle){targetLane=targetLane<-1?4.4:-4.4;lock=time+3.5;}
      }
      if(protectedApproach)targetLane=-4.4;
      const ahead=endlessHighwayPoint(course,s+16+Math.max(0,t.speed)*.65,targetLane,'safe');
      const heading=Math.atan2(ahead.x-t.position.x,ahead.z-t.position.z),error=Math.atan2(Math.sin(heading-t.heading),Math.cos(heading-t.heading));
      const steer=clamp(error*2.1-t.yawRate*.55,-.8,.8);
      const speed=protectedApproach?20.5:chunk.kind==='tunnel'?25:Math.abs(error)>.35?23:29;
      __journeyDriver.steer=Math.abs(steer)<.004?0:steer;
      return {scene:currentScene(),failed:frameFailed,intro:launchIntro.active,speed:t.speed,steer,targetSpeed:speed,lane:targetLane,laneLock:lock,
        chunk:{id:chunk.id,kind:chunk.kind,offset:s-chunk.start,length:chunk.length},progress:s,position:{...t.position},tipped:t.tipped,
        grounded:t.grounded,cargo:{...f.contract},status:f.status,ordinal:f.ordinal,completed:f.completed,lost:f.lost,onboard:f.onboard,session:f.sessionId,
        fuel:meters.get('fuel').value,hull:meters.get('truck-condition').value,weather:arcadeWeatherAmount,events:arcadeEventHistory.slice(-12),
        power:activeAbilities.snapshot().activations,threat:nearestThreat??null,roadEdges:course.edges.length,cells:cellHosts.size,clock:__fixedCapture.snapshot().seconds};
    },{time,lane,laneLock});
    assert.equal(state.failed,false,'No application frame failure');assert.equal(state.scene,'driving','Journey must not terminate');assert.equal(state.session,sessionId,'One uninterrupted session');
    lane=state.lane;laneLock=state.laneLock;
    let wanted=[];
    if(!state.intro){
      if(state.speed<state.targetSpeed-.8)wanted.push('w');
      else if(state.speed>state.targetSpeed+2)wanted.push('s');
      // Throttle edges are intentional, never accidental double-tap rush.
      if(wanted.includes('w')&&!held.has('w')){if(time-lastThrottle<.4)wanted=[];else lastThrottle=time;}
      if(time>4&&time<7&&Math.abs(state.steer)<.1&&!isNaN(state.speed))wanted=['w','Space'];
    }
    held=await setKeyboard(page,held,wanted);
    if(state.tipped&&time-lastRecovery>8.2){await page.keyboard.press('f');lastRecovery=time;}
    if(!state.intro&&time-lastPower>22&&(state.threat||time>18)){
      await page.keyboard.press(state.threat?'e':'q');lastPower=time;
    }
    const eligible={departure:time===0,'first-pickup':state.ordinal===1&&state.cargo.pickupProgress-state.progress<100,
      delivery:state.onboard&&state.cargo.deliveryProgress-state.progress<100,
      sweep:state.chunk.kind==='sweep'&&state.chunk.offset>120,hill:state.chunk.kind==='hill'&&state.chunk.offset>100,
      bridge:state.chunk.kind==='bridge'&&state.chunk.offset>120,tunnel:state.chunk.kind==='tunnel'&&state.chunk.offset>130,
      weather:state.weather>.75,ability:state.power>0&&time>30,finish:time>=seconds-6};
    if(!active&&editCount<60*fps){
      let id=targets.find(id=>!selected.has(id)&&eligible[id]);
      // Fill otherwise unobserved editorial slots with honest driving footage,
      // retaining the requested and actual labels in the cut manifest.
      const clipsLeft=10-selected.size;
      if(!id&&time>=seconds-clipsLeft*6)id=targets.find(id=>!selected.has(id));
      if(id){selected.add(id);active={id,actualKind:state.chunk.kind,sourceStart:state.clock,frames:0,firstFrame:editCount,outputStart:editCount/fps,conditionMet:Boolean(eligible[id])};}
    }
    const needReference=tick%6===0,draw=Boolean(active)||needReference;
    // Two fixed 1/60 physics steps per candidate 30 fps output frame. Skipping
    // only GPU submission between captured frames never changes gameplay time.
    await page.evaluate(({tick,draw})=>{__journeyDriver.draw=false;__journeyDriver.tick=tick;__fixedCapture.step(1/60);__journeyDriver.draw=draw;__journeyDriver.tick=tick+1;__fixedCapture.step(1/60);},{tick,draw});
    if(draw){
      const bytes=await page.screenshot({type:'jpeg',quality:96});
      if(needReference){await writeFrame(sourceEncoder,bytes);referenceCount++;}
      if(active){await writeFrame(editEncoder,bytes);frames.push({index:editCount,tick:tick+2,sourceSeconds:state.clock+2/hz,segment:active.id,sha256:digest(bytes)});editCount++;active.frames++;
        if(active.frames===6*fps){active.duration=6;active.sourceEnd=active.sourceStart+6;segments.push(active);active=null;}}
      if(tick%(60*hz)===0)await writeFile(path.join(output,`minute-${Math.floor(time/60)}.jpg`),bytes);
    }
    traces.push({tick,held:[...held],steer:state.steer,lane,sourceSeconds:state.clock});
    if(tick%hz===0)samples.push({time,...state});
    if(tick%(10*hz)===0){console.log(JSON.stringify({time,editCount,referenceCount,metres:state.progress,kind:state.chunk.kind,delivered:state.completed,hull:state.hull,fuel:state.fuel}));}
  }
  held=await setKeyboard(page,held,[]);
  const final=await page.evaluate(()=>({freight:structuredClone(freightState),truck:structuredClone(readTruck()),abilities:activeAbilities.snapshot(),presentation:LongHaulPresentation.getState(),failed:frameFailed}));
  check('Exactly 600 seconds simulated',seconds===600);
  check('Exactly 60 seconds of selected fresh frames',editCount===1800&&segments.length===10);
  check('Complete uninterrupted reference frames',referenceCount===seconds*referenceFps);
  check('No repeated encoded source captures',new Set(frames.map(f=>f.sha256)).size===frames.length);
  check('Repeated real deliveries',final.freight.completed>=5,final.freight.completed);
  check('Modular road diversity',new Set(samples.map(s=>s.chunk.kind)).size>=8,[...new Set(samples.map(s=>s.chunk.kind))]);
  check('Bounded road and cell windows',samples.every(s=>s.roadEdges<=20&&s.cells<=81));
  check('No fatal browser or shader errors',!observations.consoleLog.some(e=>e.type==='pageerror'||e.type==='error'),observations.consoleLog);
  check('All application requests succeed',observations.networkFailures.length===0,observations.networkFailures);
  await page.screenshot({path:path.join(output,'final.png')});
  await finish(editEncoder);editEncoder=null;await finish(sourceEncoder);sourceEncoder=null;
  const audio=await page.evaluate(async({seconds,segments})=>__fixedCapture.renderAudio(seconds+3,segments.map(s=>({start:s.sourceStart,duration:s.duration}))),{seconds,segments});
  await writeFile(path.join(output,'Highlights.wav'),Buffer.from(audio.base64,'base64'));delete audio.base64;
  check('Original game audio is non-silent',audio.peak>.01&&audio.rms>.001,audio);
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path.join(output,'Highlights-Silent.mp4'),'-i',path.join(output,'Highlights.wav'),'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-t','60','-movflags','+faststart',path.join(output,'TheLongHaul-Illustrated-Highway-60s.mp4')]);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path.join(output,'TheLongHaul-Illustrated-Highway-60s.mp4')],{encoding:'utf8'}));
  check('Final MP4 duration and actual frame count',Number(probe.format.duration)===60&&probe.streams.find(s=>s.codec_type==='video').nb_frames==='1800',probe);
  await saveJson(path.join(output,'media-probe.json'),probe);await saveJson(path.join(output,'audio.json'),audio);await saveJson(path.join(output,'final-state.json'),final);
  check('Captured application matches accepted source',(await sourceIdentity()).aggregate===source.aggregate);
}catch(error){failure=String(error.stack??error);await page?.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
finally{
  for(const e of [editEncoder,sourceEncoder])if(e){e.p.stdin.end();await e.done.catch(()=>{});}
  await context?.close();await browser?.close();await server?.close();
}
await writeFile(path.join(output,'inputs.jsonl'),traces.map(x=>JSON.stringify(x)).join('\n')+'\n');
await writeFile(path.join(output,'journey.jsonl'),samples.map(x=>JSON.stringify(x)).join('\n')+'\n');
await saveJson(path.join(output,'frames.json'),frames);await saveJson(path.join(output,'cuts.json'),segments);
await saveJson(path.join(output,'report.json'),{verdict:failure?'FAIL':'PASS',source,runtime,checks,failure,editCount,referenceCount,cleanup:true,
  capture:{physicsHz:hz,editFps:fps,referenceFps,seconds,width:1920,height:1080},
  provenance:'One real continuous journey. Seeded initial run; no position, cargo, damage, reward or weather fixtures. Scripted analog steering replaces only the steering axis through the actual product input event; keyboard handles throttle/brakes/powers. Rendering is sampled independently from fixed 60 Hz simulation. Reference video is silent 10 fps audit footage, not a 30 fps trailer. Edited audio is the original game graph at matching cut times. Not real-time GPU performance.'});
console.log(JSON.stringify({verdict:failure?'FAIL':'PASS',editCount,referenceCount,failure}));if(failure)process.exitCode=1;
