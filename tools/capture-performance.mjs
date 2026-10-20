import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
const seconds=Number(process.argv.find(a=>a.startsWith('--seconds='))?.split('=')[1]||30);
const output=process.argv.find(a=>a.startsWith('--output='))?.split('=')[1]||'.cache/performance-run';
await mkdir(output,{recursive:true});
const sourceSha256=createHash('sha256').update(await readFile('vendor/app-runtime.js')).digest('hex');
const browser=await chromium.launch({channel:'chrome',headless:!process.argv.includes('--headed')});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:2}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text())});
await page.addInitScript(()=>sessionStorage.setItem('long-haul-intro-credits-seen-v1','1'));
const started=Date.now();await page.goto('http://127.0.0.1:4173/index.html');await page.waitForFunction(()=>window.__longHaulBooted);
const bootMs=Date.now()-started;
await page.evaluate(()=>{newSeed=()=> 'haul-1nwc3cl-12goa01'});
await page.locator('#start-btn').click();await page.locator('#dispatch-go-btn').click();await page.waitForFunction(()=>currentScene()==='driving',null,{timeout:30000});
await page.waitForTimeout(3000);await page.evaluate(()=>LongHaulPerformance.reset());
const runs=[],begin=Date.now();let cycle=begin,nextCheckpoint=begin+15000;
while(Date.now()-begin<seconds*1000){
 await page.evaluate(()=>{if(currentScene()!=='driving')return;const state=readTruck(),road=nearestRoad(course,state.position);keys.KeyW=true;const diff=road?Math.atan2(Math.sin(road.heading-state.heading),Math.cos(road.heading-state.heading)):0;keys.KeyA=diff>.035;keys.KeyD=diff<-.035});
 await page.waitForTimeout(200);
 if(Date.now()>=nextCheckpoint){const sample=await page.evaluate(()=>({state:LongHaulPerformance.getState(),truck:JSON.parse(render_game_to_text()),heap:performance.memory?.usedJSHeapSize,failedProviders:engine.n.coreWorld.getDiagnostics(HORIZON_WORLD_ID).filter(d=>d.severity==='error').length}));runs.push({elapsedMs:Date.now()-begin,...sample});await writeFile(output+'/progress.json',JSON.stringify({bootMs,elapsedMs:Date.now()-begin,runs,errors},null,2));console.log(JSON.stringify({elapsed:Math.round((Date.now()-begin)/1000),cells:sample.state.cells,drawCalls:sample.state.drawCalls,p95:sample.state.phases.interval?.p95,errors:errors.length}));nextCheckpoint=Date.now()+15000}
 if(Date.now()-cycle>42000||await page.evaluate(()=>currentScene()==='loss')){await page.evaluate(()=>{for(const k of Object.keys(keys))keys[k]=false;retrySame()});await page.waitForFunction(()=>currentScene()==='driving',null,{timeout:30000});await page.evaluate(()=>LongHaulPerformance.reset());cycle=Date.now()}
}
await page.evaluate(()=>{for(const k of Object.keys(keys))keys[k]=false});
await page.screenshot({path:output+'/gameplay.png'});
const state=await page.evaluate(()=>{const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {canvas:[renderer.domElement.width,renderer.domElement.height],performance:LongHaulPerformance.getState(),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown',bootBlocked:document.querySelector('#boot-failure').classList.contains('show')}});
const report={seconds,bootMs,sourceSha256,conditions:{viewport:[1280,800],quality:'high',deviceScaleFactor:2,seed:'haul-1nwc3cl-12goa01'},runs,errors,...state};
await writeFile(output+'/report.json',JSON.stringify(report,null,2));await browser.close();
if(errors.length||state.bootBlocked)process.exitCode=1;
