/** Actual browser evidence for the product visual pass. Distant inspections are
 * explicitly identified fixtures; the separate film is continuous input-driven. */
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {projectRoot,argValue,sourceIdentity,serveProject,loadBrowser,preparePage,beginRun,webglEvidence,saveJson} from './validate-gameplay.mjs';
import {installFixedBrowserClock,freezeClock,stepClock} from './fixed-browser-clock.mjs';
const output=path.resolve(argValue('--output',path.join(projectRoot,'.cache/visual-validation')));
await mkdir(output,{recursive:true});
const source=await sourceIdentity(),checks=[],fixtures=[],shots=[];
const check=(name,value,detail)=>{checks.push({name,passed:Boolean(value),detail});assert.ok(value,name);};
let server,browser,context,page,runtime,observed,failure=null;
async function step(n){for(let i=0;i<n;i++)await stepClock(page,1/60);}
async function screenshot(name){const file=path.join(output,name+'.png');await page.screenshot({path:file});shots.push(name+'.png');}
async function geometry(){return page.evaluate(()=>{
  const selectors=['#journey-objective','#drive-box','#skill-hud','#risk-hud'];
  const r=n=>{const a=n.getBoundingClientRect();return{x:a.x,y:a.y,w:a.width,h:a.height,right:a.right,bottom:a.bottom};};
  return{stage:r(document.querySelector('#game-stage')),panels:selectors.map(s=>({selector:s,...r(document.querySelector(s)),hidden:document.querySelector(s).hidden})),center:r(document.querySelector('#game-canvas'))};
});}
function checkLayout(label,layout){
  const visible=layout.panels.filter(p=>!p.hidden&&p.w>0&&p.h>0),b=layout.stage;
  for(const p of visible)check(`${label}: ${p.selector} in stage`,p.x>=b.x-1&&p.y>=b.y-1&&p.right<=b.right+1&&p.bottom<=b.bottom+1,p);
  for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){
    const a=visible[i],c=visible[j],overlap=Math.min(a.right,c.right)-Math.max(a.x,c.x)>2&&Math.min(a.bottom,c.bottom)-Math.max(a.y,c.y)>2;
    check(`${label}: ${a.selector}/${c.selector} separated`,!overlap,{a,c});
  }
}
try{
  server=await serveProject();({browser,runtime}=await loadBrowser());
  context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await context.addInitScript(installFixedBrowserClock,{audioSeconds:700});
  observed=await preparePage(context,server.url,{seed:'road-matrix-1',quality:true});page=observed.page;
  await page.waitForFunction(()=>window.__longHaulVisualsReady&&window.__longHaulRoadsReady);
  check('Campaign unavailable, content link preserved',await page.locator('#campaign-coming-soon').isDisabled()&&await page.locator('a[href="./campaign.html#garage"]').count()===1);
  await screenshot('01-title');await beginRun(page);await freezeClock(page);await page.keyboard.press('w');await step(150);
  const start=await page.evaluate(()=>({...readTruck().position}));await page.keyboard.down('w');await step(180);await page.keyboard.up('w');
  check('Ordinary keyboard driving remains responsive',await page.evaluate(p=>Math.hypot(readTruck().position.x-p.x,readTruck().position.z-p.z)>5,start));
  const presentation=await page.evaluate(()=>LongHaulPresentation.getState());
  check('Horizontal cloud sheets removed',presentation.oldCloudSheets===false,presentation);
  check('Shaped clouds and readable near fog',presentation.cloudSdfInstances===24&&presentation.cloudLayers.join(',')==='8,8,8'&&presentation.fog.near>=180,presentation);
  const cloudBefore=await page.evaluate(()=>{
    const mesh=scene.getObjectByName('cloud-sdf-types');
    if(!mesh)return null;
    return [0,8,16].map(i=>{const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);return m.elements.slice(12,15);});
  });
  check('Three SDF cloud layers have GPU instance transforms',Boolean(cloudBefore)&&cloudBefore.every(p=>p.every(Number.isFinite)),cloudBefore);
  const cloudScreen=await page.evaluate(()=>{
    const mesh=scene.getObjectByName('cloud-sdf-types'),p=new THREE.Vector3(),m=new THREE.Matrix4();
    mesh.updateWorldMatrix(true,false);camera.updateMatrixWorld();
    return Array.from({length:mesh.count},(_,i)=>{
      mesh.getMatrixAt(i,m);
      p.setFromMatrixPosition(m).applyMatrix4(mesh.matrixWorld).project(camera);
      return {x:p.x,y:p.y,z:p.z};
    });
  });
  check('Cloud centers populate the visible upper driving view',
    cloudScreen.filter(p=>Math.abs(p.x)<1&&p.y>.25&&p.y<1.05&&p.z>=-1&&p.z<=1).length>=12,cloudScreen);
  check('High-world-sky clouds are active',presentation.cloudPositioning==='world-biased-high-sky',presentation);
  const cloudPixelEvidence=await page.evaluate(()=>{
    const mesh=scene.getObjectByName('cloud-sdf-types');
    const gl=renderer.getContext();
    const width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
    const stride=12,base=new Uint8Array(4),cloud=new Uint8Array(4);
    let changed=0,samples=0,peak=0;
    // A/B comparison of actual frame pixels at the same camera pose.
    // Read back only a sparse upper-screen grid; no gameplay modifications.
    mesh.visible=false;renderer.render(scene,camera);
    const before=[];
    for(let y=Math.floor(height*.46);y<height;y+=stride)
      for(let x=0;x<width;x+=stride){
        gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,base);
        before.push([x,y,base[0],base[1],base[2]]);
      }
    mesh.visible=true;renderer.render(scene,camera);
    for(const [x,y,r,g,b] of before){
      gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,cloud);
      const diff=Math.abs(cloud[0]-r)+Math.abs(cloud[1]-g)+Math.abs(cloud[2]-b);
      if(diff>=24)changed++;
      peak=Math.max(peak,diff);samples++;
    }
    return {changed,samples,peak,fraction:changed/Math.max(1,samples),glError:gl.getError()};
  });
  check('Clouds visibly change actual upper-sky pixels',
    cloudPixelEvidence.changed>60&&cloudPixelEvidence.fraction>.015&&cloudPixelEvidence.peak>40,cloudPixelEvidence);
  check('Cloud depth always behind terrain',presentation.cloudDepthPolicy==='background-depth',presentation);
  await page.keyboard.down('w');await step(180);await page.keyboard.up('w');
  const cloudAfter=await page.evaluate(()=>{
    const mesh=scene.getObjectByName('cloud-sdf-types');
    return [0,8,16].map(i=>{const m=new THREE.Matrix4();mesh.getMatrixAt(i,m);return m.elements.slice(12,15);});
  });
  const cloudMovement=cloudAfter.map((p,i)=>Math.hypot(p[0]-cloudBefore[i][0],p[2]-cloudBefore[i][2]));
  check('Driving produces three independently moving cloud depths',cloudMovement.every(n=>n>0.01)&&new Set(cloudMovement.map(n=>n.toFixed(2))).size===3,cloudMovement);
  check('Truck condition uses remaining integrity',!(/damage/i.test(await page.locator('#truck-num').textContent())));
  check('Idle flavor banner is quiet',await page.locator('#encounter-hud').isHidden());
  const gl=await webglEvidence(page);check('Native 1080p WebGL pixels',gl.width>=1920&&gl.height>=1080&&gl.pixels.distinctColors>100&&!gl.lost,gl);
  checkLayout('1080p',await geometry());await screenshot('02-driving');
  await page.keyboard.press('u');await step(2);const frozen=await page.evaluate(()=>({position:structuredClone(readTruck().position),time:readRun().rawTime}));await step(60);
  check('Skills menu freezes simulation',await page.evaluate(v=>readRun().rawTime===v.time&&readTruck().position.z===v.position.z,frozen));await screenshot('03-skills');
  await page.keyboard.press('u');await step(4);
  const done=new Set();
  for(let i=0;i<12;i++){
    const info=await page.evaluate(i=>{const s=960+i*960,c=roadChunkAt(course.seed,s);return{kind:c.kind,progress:s};},i);
    if(done.has(info.kind))continue;done.add(info.kind);
    await page.evaluate(({progress})=>{const p=roadChunkSample(course.seed,progress);engine.n.longHaulTruck.teleport({x:p.x,y:p.y+.92,z:p.z,heading:p.heading,speed:0,groundHeight:p.y,groundNormal:{x:0,y:1,z:0},surface:'road',surfaceGrip:1});engine.tick(0);updateWorldStreaming();},info);
    fixtures.push({...info,setup:'explicit distant geometry-inspection teleport, not continuous driving'});
    await step(150);check(`Road family ${info.kind} has real rendered pixels`,(await webglEvidence(page)).pixels.distinctColors>100);check(info.kind+' horizon boundaries close below the landscape',await page.evaluate(()=>[...horizonHosts.values()].every(host=>{const n=host.patch.segments,position=host.geometry.getAttribute('position');for(let i=(n+1)*(n+1);i<position.count;i++)if(position.getY(i)>-255.99)return false;return position.count>(n+1)*(n+1);})));await screenshot('road-'+info.kind);
  }
  // Explicit weather fixture; the continuous movie proves the normal transition.
  await page.evaluate(()=>{arcadeWeatherAmount=1;updateCloudLayers(readTruck(),skillVisualTime*1000);});
  fixtures.push({setup:'weather appearance fixture',amount:1});await screenshot('04-rain');
  for(const viewport of [{width:960,height:540},{width:390,height:844}]){
    await page.setViewportSize(viewport);await page.evaluate(()=>resize());await step(3);
    checkLayout(`${viewport.width}x${viewport.height}`,await geometry());await screenshot(`layout-${viewport.width}`);
    // Presentation-only state fixture: full combo and onboard deadline occupy
    // more space than idle; verify the same layout without changing rewards.
    await page.evaluate(()=>{document.querySelector('#risk-hud').classList.remove('idle');document.querySelector('#risk-multiplier').textContent='×5';document.querySelector('#risk-pending').textContent='9,999';document.querySelector('#timer-box').hidden=false;document.querySelector('#objective-cargo-meter').hidden=false;});
    checkLayout(`${viewport.width}x${viewport.height} expanded`,await geometry());
    if(viewport.width<600){
      // Explicit simultaneous presentation fixture: old specificity rules and
      // a separate toast previously evaded a hidden-encounter-only check.
      await page.evaluate(()=>{
        const message=document.querySelector('#toast');message.className='show';message.textContent='ROADBLOCK AHEAD · KEEP RIGHT';
        const warning=document.querySelector('#encounter-hud');warning.hidden=false;warning.textContent='Freight pickup ahead';
        document.querySelector('#timer-label').textContent='CARGO DEADLINE';
        document.querySelector('#timer').textContent='0:28';
      });
      const layout=await page.evaluate(()=>{
        const rect=id=>{const e=document.querySelector(id),r=e.getBoundingClientRect(),s=getComputedStyle(e);return{top:r.top,bottom:r.bottom,width:r.width,height:r.height,visible:!e.hidden&&s.display!=='none'&&s.visibility!=='hidden'};};
        return{deadline:rect('#timer-box'),toast:rect('#toast'),warning:rect('#encounter-hud'),drive:rect('#drive-box'),flash:rect('#arcade-flash')};
      });
      check('Portrait cargo deadline remains visible',layout.deadline.visible&&layout.deadline.height>0,layout);
      check('Portrait priority toast clears cargo and driving controls',layout.toast.visible&&layout.toast.top>=layout.deadline.bottom+8&&layout.toast.bottom+8<=layout.drive.top,layout);
      check('Portrait shows only one priority notification',!layout.warning.visible&&!layout.flash.visible,layout);
      await screenshot(`layout-${viewport.width}-expanded`);
      await page.evaluate(()=>{document.querySelector('#toast').className='';});
      check('Portrait encounter returns in the same clear notification lane',await page.evaluate(()=>{
        const a=document.querySelector('#timer-box').getBoundingClientRect(),w=document.querySelector('#encounter-hud'),b=w.getBoundingClientRect(),s=getComputedStyle(w);
        return !w.hidden&&s.display!=='none'&&s.visibility==='visible'&&b.top>=a.bottom+8;
      }));
      await screenshot(`layout-${viewport.width}-encounter`);
    }else await screenshot(`layout-${viewport.width}-expanded`);
    fixtures.push({setup:'DOM-only expanded combo/cargo/deadline layout fixture',viewport});
    await step(2);
  }
  await page.setViewportSize({width:1920,height:1080});await page.evaluate(()=>resize());await step(2);
  check('No frame failure',await page.evaluate(()=>!frameFailed));
  check('No failed asset requests',observed.networkFailures.length===0,observed.networkFailures);
  check('No unsupported material properties',!observed.consoleLog.some(e=>/not a property of THREE/i.test(e.text)),observed.consoleLog);
  check('No fatal JS/shader errors',!observed.consoleLog.some(e=>e.type==='pageerror'||e.type==='error'),observed.consoleLog);
  check('Source identity unchanged',(await sourceIdentity()).aggregate===source.aggregate);
}catch(error){failure=String(error.stack??error);if(page)await screenshot('failure').catch(()=>{});}
finally{await context?.close();await browser?.close();await server?.close();}
const report={verdict:failure?'FAIL':'PASS',source,runtime,checks,fixtures,shots,failure,console:observed?.consoleLog??[],networkFailures:observed?.networkFailures??[],cleanup:true,boundary:'Actual browser/DOM/WebGL. Distant geometry/weather fixtures declared. Not physical GPU or human fun acceptance.'};
await saveJson(path.join(output,'report.json'),report);console.log(JSON.stringify({verdict:report.verdict,checks:checks.length,failure}));if(failure)process.exitCode=1;
