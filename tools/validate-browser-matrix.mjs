import assert from 'node:assert/strict';
import { mkdir, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { projectRoot, argValue, sourceIdentity, serveProject, preparePage, beginRun, gameSnapshot, webglEvidence, driveWithKeyboard, saveJson } from './validate-gameplay.mjs';

const runId = 'browser-matrix-' + new Date().toISOString().replace(/[:.]/g, '-');
const output = path.resolve(argValue('--output', path.join(projectRoot,'.cache/validation',runId)));
await mkdir(path.dirname(output),{recursive:true}); await mkdir(output,{recursive:false});
const source = await sourceIdentity(), startedAt = new Date().toISOString();
const requested = {mode:'local',target:projectRoot,revision:source.revision,expectedSurface:'mixed',expectedState:'Continuous highway gameplay, keyboard movement and coherent menus in Firefox and WebKit',interaction:'Native browser DOM clicks and keyboard; real application renderer.'};
await saveJson(path.join(output,'target-lock.json'),{runId,source,requested});
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(projectRoot,'.cache/playwright');
const {firefox,webkit}=await import('playwright');
const libraryRoot=path.join(projectRoot,'.cache/browser-runtime/root/usr/lib/x86_64-linux-gnu');
const env={...process.env,LD_LIBRARY_PATH:[libraryRoot,process.env.LD_LIBRARY_PATH].filter(Boolean).join(':'),LIBGL_ALWAYS_SOFTWARE:'1',WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS:'1'};
// Dependencies are unpacked in a task-local prefix. The runtime check below,
// rather than the optional host-package inventory, proves actual support.
process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS='1';
let display,server;const results=[];let failure=null,displayLog='';
try{
 server=await serveProject();
 if(!env.DISPLAY){
  const executable=process.env.LONG_HAUL_XVFB||path.join(projectRoot,'.cache/browser-runtime/Xvfb-local');
  await access(executable);env.DISPLAY=':97';
  display=spawn(executable,[env.DISPLAY,'-screen','0','1280x720x24','-nolisten','tcp','-ac'],{cwd:path.join(projectRoot,'.cache/browser-runtime'),env,stdio:['ignore','ignore','pipe']});
  display.stderr.on('data',data=>displayLog+=data.toString());
  await new Promise(resolve=>setTimeout(resolve,1200));assert.equal(display.exitCode,null,'Task-local display must stay running.');
 }
 for(const [name,type,options] of [['firefox',firefox,{headless:false,firefoxUserPrefs:{'webgl.force-enabled':true,'webgl.disabled':false}}],['webkit',webkit,{headless:true}]]){
  let browser,context,observed;const checks=[];const item={name,checks,verdict:'blocked'};
  const check=(label,value,evidence)=>{checks.push({label,passed:!!value,evidence});assert.ok(value,label)};
  try{
   browser=await type.launch({...options,env});item.version=browser.version();
   context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
   observed=await preparePage(context,server.url,{seed:'continuous-matrix-2026'});const page=observed.page;
   await page.screenshot({path:path.join(output,`${name}-before.png`)});await beginRun(page);
   await page.waitForFunction(()=>currentScene()==='driving',null,{timeout:20000});
   await page.keyboard.press('w');await page.waitForFunction(()=>!launchIntro.active&&readRun().status==='running');
   const before=await gameSnapshot(page),render=await webglEvidence(page);item.render=render;
   check('Real WebGL gameplay canvas',render.available&&!render.lost&&render.pixels.distinctColors>40&&render.triangles>0,render);
   check('Continuous freight state is present',await page.evaluate(()=>Boolean(course.endless&&LongHaulFreight.getState()?.contract)));
   await driveWithKeyboard(page,8,{boost:false,simulationTime:true});const after=await gameSnapshot(page);
   check('Keyboard throttle advances actual physics',after.runDetails.distance>before.runDetails.distance+3&&!after.frameFailed,{before:before.player,after:after.player,distance:after.runDetails.distance-before.runDetails.distance});
   const fork=await page.evaluate(()=>{const station=freightState.pickupStation,project=point=>new THREE.Vector3(point.x,terrainHeight(course,point.x,point.z)+4,point.z).project(camera).x;return{wide:project(station.safe.point),express:project(station.risky.point),advice:document.querySelector('#freight-advice').textContent}});
   check('Loading fork guidance matches its actual projected left/right geometry',fork.wide<fork.express&&/WIDE LEFT \/ EXPRESS RIGHT/.test(fork.advice),fork);
   await page.keyboard.press('m');await page.waitForFunction(()=>mapOpen);
   const map=await page.evaluate(()=>({visible:mapOpen,freight:LongHaulFreight.getState(),text:document.querySelector('#destination-name').textContent}));
   check('Freight map opens with current guidance',map.visible&&map.freight.contract&&/Freight relay|Receiver/.test(map.text),map.text);
   await page.keyboard.press('Escape');await page.waitForFunction(()=>!mapOpen);
   await page.keyboard.press('Escape');await page.waitForFunction(()=>currentScene()==='paused');
   const paused=await gameSnapshot(page);await page.waitForTimeout(250);const still=await gameSnapshot(page);
   check('Pause freezes the continuous run',paused.runDetails.rawTime===still.runDetails.rawTime);
   await page.evaluate(()=>toast('Menu feedback layout check','',1000));await page.waitForTimeout(200);
   const toastLayout=await page.evaluate(()=>{const box=document.querySelector('#toast').getBoundingClientRect(),heading=document.querySelector('#pause-screen h2').getBoundingClientRect();return{top:box.top,bottom:box.bottom,left:box.left,right:box.right,headingTop:heading.top,viewport:innerWidth}});
   check('Non-driving feedback stays above the menu heading and inside the viewport',toastLayout.top>=0&&toastLayout.top<=14&&toastLayout.left>=0&&toastLayout.right<=toastLayout.viewport+1&&toastLayout.bottom<toastLayout.headingTop,toastLayout);
   await page.screenshot({path:path.join(output,`${name}-menu-toast.png`)});
   await page.locator('#resume-btn').click();await page.waitForFunction(()=>currentScene()==='driving'&&readRun().status==='running',null,{timeout:15000});
   check('Resume returns to the same healthy journey',await page.evaluate(()=>!frameFailed&&readRun().status==='running'));
   await page.screenshot({path:path.join(output,`${name}-after.png`)});
   const errors=observed.consoleLog.filter(value=>value.type==='pageerror'||value.type==='error'&&!/favicon|404/.test(value.text));
   check('No fatal application or WebGL errors',errors.length===0,errors);
   item.before=before;item.after=after;item.verdict='pass';
  }catch(error){item.failure=String(error.stack||error);item.verdict=observed?'fail':'blocked';if(observed){item.failureState=await gameSnapshot(observed.page).catch(()=>null);await observed.page.screenshot({path:path.join(output,`${name}-failure.png`)}).catch(()=>{});}}
  finally{item.console=observed?.consoleLog??[];item.networkFailures=observed?.networkFailures??[];await context?.close().catch(()=>{});await browser?.close().catch(()=>{});}
  results.push(item);console.log(JSON.stringify({browser:name,verdict:item.verdict,checks:checks.length,failure:item.failure}));
 }
 assert.ok(results.every(result=>result.verdict==='pass'),'Every available browser must pass the declared compatibility checks.');
 assert.equal((await sourceIdentity()).aggregate,source.aggregate,'Application source changed during browser validation.');
}catch(error){failure=String(error.stack||error)}
finally{display?.kill();await server?.close().catch(()=>{});}
await saveJson(path.join(output,'report.json'),{verdict:failure?'fail':'pass',runId,startedAt,completedAt:new Date().toISOString(),source,requested,results,displayLog,failure,cleanup:{displayStopped:true,browsersClosed:true,serverClosed:true},boundary:'Linux Firefox and Playwright WebKit software-rendering checks. WebKit is not a native Safari/MacBook hardware certification; masked Apple GPU strings do not identify host hardware.'});
console.log(JSON.stringify({verdict:failure?'fail':'pass',output,failure}));if(failure)process.exitCode=1;
