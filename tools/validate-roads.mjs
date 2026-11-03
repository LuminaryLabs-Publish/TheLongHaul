/** Real browser acceptance. Run only where browser access is permitted. */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, argValue, sourceIdentity, serveProject, loadBrowser, preparePage, beginRun, webglEvidence, saveJson } from './validate-gameplay.mjs';
import { installFixedBrowserClock, freezeClock, stepClock } from './fixed-browser-clock.mjs';
const output=path.resolve(argValue('--output',path.join(projectRoot,'.cache/validation','roads-'+new Date().toISOString().replace(/[:.]/g,'-'))));
await mkdir(output,{recursive:true});
const source=await sourceIdentity(), checks=[], fixtures=[];
let server,browser,context,page,runtime,observations,verdict='FAIL',failure=null,cleaned=false;
const check=(name,value,detail=null)=>{checks.push({name,passed:Boolean(value),detail});assert.ok(value,name);};
try {
  server=await serveProject();({browser,runtime}=await loadBrowser());
  context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
  await context.addInitScript(installFixedBrowserClock,{audioSeconds:180,sampleRate:48000});
  observations=await preparePage(context,server.url,{seed:'road-matrix-1',quality:true});page=observations.page;
  await page.waitForFunction(()=>Boolean(window.__longHaulRoadsReady),null,{timeout:15000});
  const menu=page.locator('#campaign-coming-soon');
  check('Campaign is disabled with preserved title',await menu.isDisabled()&&(await menu.textContent()).includes('Coming Soon')&&await menu.locator('s').textContent()==='Campaign');
  await page.screenshot({path:path.join(output,'title.png')});
  await beginRun(page);await freezeClock(page);await page.keyboard.press('w');
  for(let i=0;i<90;i++)await stepClock(page,1/60);
  const before=await page.evaluate(()=>structuredClone(readTruck()));
  await page.keyboard.down('w');
  for(let i=0;i<180;i++)await stepClock(page,1/60);
  await page.keyboard.up('w');
  const after=await page.evaluate(()=>({truck:structuredClone(readTruck()),road:JSON.parse(render_game_to_text()).road,failed:frameFailed}));
  check('Actual keyboard input moves truck on modular roads',after.road?.generatorVersion==='long-haul-endless-v2'&&Math.hypot(after.truck.position.x-before.position.x,after.truck.position.z-before.position.z)>5&&!after.failed,after);
  await page.screenshot({path:path.join(output,'ordinary-driving.png')});
  // Declared endpoint fixtures inspect distant geometry; they are not counted
  // as continuous driving or as the ten-minute replay/video deliverable.
  for(let i=0;i<12;i++) {
    const fixture=await page.evaluate(i=>{
      const progress=960+i*960,p=roadChunkSample(course.seed,progress),chunk=roadChunkAt(course.seed,progress);
      engine.n.longHaulTruck.teleport({x:p.x,y:p.y+.92,z:p.z,heading:p.heading,speed:0,groundHeight:p.y,groundNormal:{x:0,y:1,z:0},surface:'road',surfaceGrip:1});
      engine.tick(0);updateWorldStreaming();return {progress,kind:chunk.kind,chunkId:chunk.id};
    },i);fixtures.push({...fixture,kindOfSetup:'explicit geometry-inspection teleport'});
    for(let j=0;j<120;j++)await stepClock(page,1/60);
    const gl=await webglEvidence(page);
    check(`Actual WebGL surface: ${i}-${fixture.kind}`,gl.available&&!gl.lost&&gl.pixels.distinctColors>40,gl);
    check(`No fatal frame failure: ${i}`,await page.evaluate(()=>!frameFailed));
    await page.screenshot({path:path.join(output,`${String(i).padStart(2,'0')}-${fixture.kind}.png`)});
  }
  check('Application source unchanged during validation',(await sourceIdentity()).aggregate===source.aggregate);
  check('No failed requests',observations.networkFailures.length===0,observations.networkFailures);
  check('No fatal script errors',!observations.consoleLog.some(e=>e.type==='pageerror'),observations.consoleLog);
  verdict='PASS';
} catch(error) {
  failure=String(error?.stack??error);
  verdict=/ERR_BLOCKED_BY_ADMINISTRATOR|unavailable; install|No task-local Chromium|browserType.launch.*(Permission|not permitted)/s.test(failure)?'BLOCKED':'FAIL';
  if(page&&verdict==='FAIL')await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
} finally {
  try{await context?.close();await browser?.close();await server?.close();cleaned=true;}catch(error){failure=(failure??'')+'\nCleanup: '+error;verdict='FAIL';}
}
await saveJson(path.join(output,'validation-report.json'),{verdict,source,runtime,checks,fixtures,failure,cleanup:{completed:cleaned},console:observations?.consoleLog??[],networkFailures:observations?.networkFailures??[],boundary:'Actual browser DOM/keyboard/WebGL; declared distant geometry fixtures. Not a ten-minute continuous journey, subjective human review or hardware benchmark.'});
console.log(JSON.stringify({verdict,checks:checks.length,output,failure}));
if(verdict!=='PASS')process.exitCode=1;
