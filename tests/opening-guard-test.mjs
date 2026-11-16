import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('fresh run never depends on terminal GLB load timing',()=>{
 const host=read('src/app/freight-terminal-host.js');
 assert.match(host,/const freshGroundStart=!saved && seed\.startsWith\('haul-winding-ground-'\)/);
 assert.match(host,/loaded && generated\?\.endless && !freshGroundStart/);
});
test('opening viaduct flags removed independently of an optional spur',()=>{
 const src=read('src/game/road-v3-playable-course.mjs');
 const start=src.indexOf('if(groundLevelOpening)edges=removeOpeningBridgeSpan(edges,2);');
 const loop=src.indexOf('for(let index=3;index<=last;index+=9)');
 assert.ok(start>=0 && loop>start);
});
test('saved routes and later roads retain previous layout contracts',()=>{
 const host=read('src/app/freight-terminal-host.js');
 assert.match(host,/\(!saved\|\|saved\.freightTerminal===FREIGHT_TERMINAL_VERSION\)/);
 const src=read('src/game/road-v3-playable-course.mjs');
 assert.match(src,/opening\?removeOpeningBridgeSpan\(edges,index\):applyInterchangeDeckSpan\(edges,site\)/);
});
