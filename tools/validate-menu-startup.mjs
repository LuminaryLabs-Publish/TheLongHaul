// Release gate: real served game, native browser clicks, keyboard driving and save/reload.
// Fault injection only withholds optional resources; no state teleport or forced click.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {ROAD_V3_VERSION} from '../src/game/road-v3-geometry.mjs';
import {ROAD_GENERATOR_VERSION} from '../src/game/road-chunks.mjs';
import {serveProject,loadBrowser,sourceIdentity,projectRoot} from './validate-gameplay.mjs';
const output=path.resolve(process.env.LONG_HAUL_STARTUP_EVIDENCE || path.join(projectRoot,'.cache/startup-evidence'));
await mkdir(output,{recursive:true});
const report={cases:[],status:'incomplete'};
let server,browser;
async function ready(page){
  await page.waitForFunction(()=>window.LongHaulStartup?.getState().status!=='loading'&&window.LongHaulStartup,null,{timeout:60000});
  const boot=await page.evaluate(()=>LongHaulStartup.getState());assert.equal(boot.status,'ready',JSON.stringify(boot));
  assert.equal(await page.locator('#start-btn').isEnabled(),true);
  assert.equal(await page.locator('#async-loading-scene').isVisible(),false);
}
async function drive(page){
  await page.locator('#start-btn').click();
  await page.waitForFunction(()=>generation?.ready||generation?.error,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>generation?.error?String(generation.error):null),null);
  await page.waitForFunction(()=>currentScene()==='driving');
  if(await page.locator('#launch-skip').isVisible())await page.locator('#launch-skip').click();
  await page.waitForFunction(()=>!launchIntro.active);
  const before=await page.evaluate(()=>structuredClone(readTruck().position));
  await page.keyboard.down('w');
  try{
    await page.waitForFunction(p=>Math.hypot(readTruck().position.x-p.x,readTruck().position.z-p.z)>2,before,{timeout:15000});
  }finally{await page.keyboard.up('w');}
  assert.equal(await page.evaluate(()=>frameFailed),false);
  return page.evaluate(()=>({version:course.generatorVersion,scene:currentScene(),player:structuredClone(readTruck().position),freight:LongHaulFreight.getState(),startup:LongHaulStartup.getState()}));
}
try {
  report.source=await sourceIdentity();
  server=await serveProject();const runtime=await loadBrowser();browser=runtime.browser;report.runtime=runtime.runtime;
  for(const scenario of ['v3-new-and-resume','v2-fallback','missing-optional','essential-failure']){
    const context=await browser.newContext({viewport:{width:1280,height:720}});
    const errors=[];
    try{
      await context.addInitScript(()=>{
        sessionStorage.setItem('long-haul-intro-credits-seen-v1','1');
        localStorage.setItem('the-long-haul-settings-v2',JSON.stringify({sound:false,quality:false,motion:false,steering:100}));
      });
      if(scenario==='missing-optional')await context.route(/(?:prebuilt-tree-host|connected-town-host|menu-attract-host)\.js|\/assets\/(?:trees|settlements)\//,route=>route.abort());
      if(scenario==='essential-failure')await context.route('**/vendor/app-runtime.js',route=>route.abort());
      const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
      await page.goto(server.url+'index.html'+(scenario==='v2-fallback'?'?road=v2':''),{waitUntil:'domcontentloaded'});
      if(scenario==='essential-failure'){
        await page.waitForFunction(()=>window.LongHaulStartup?.getState().status==='failed');
        assert.equal(await page.locator('#start-btn').isEnabled(),false);
        assert.equal(await page.locator('#boot-failure').isVisible(),true);
        assert.equal(await page.locator('#async-loading-scene').isVisible(),false);
        report.cases.push({scenario,status:'passed',expectedFailure:await page.evaluate(()=>LongHaulStartup.getState())});
        continue;
      }
      await ready(page);const first=await drive(page);
      assert.equal(first.version,scenario==='v2-fallback'?ROAD_GENERATOR_VERSION:ROAD_V3_VERSION);
      await page.screenshot({path:path.join(output,scenario+'.png')});
      if(scenario==='v3-new-and-resume'){
        await page.keyboard.press('Escape');await page.waitForFunction(()=>currentScene()==='paused');
        const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('longhaul-campaign-v1')).freightJourney);
        assert.ok(save&&!save.terminal&&save.journey?.sessionId,'pause records a resumable real haul');
        await page.reload({waitUntil:'domcontentloaded'});await ready(page);const resumed=await drive(page);
        assert.equal(resumed.freight.sessionId,save.journey.sessionId,'Endless Drive resumes the same haul');
      }
      assert.deepEqual(errors,[]);report.cases.push({scenario,status:'passed',first,errors});
    } finally {await context.close();}
  }
  report.status='passed';
} catch(error) {
  report.status='failed-or-blocked';report.error=String(error?.stack||error);process.exitCode=1;
} finally {
  await browser?.close();await server?.close();
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,cases:report.cases.map(x=>({scenario:x.scenario,status:x.status})),error:report.error,output}));
}
