import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host=read('src/app/endless-roads.js');
test('depot corridor never invokes procedural structure collision',()=>{
  const at=host.indexOf('const terminalOpening = isV3()');
  const end=host.indexOf('if (contact)',at);
  assert.ok(at>0&&end>at);
  const fragment=host.slice(at,end);
  assert.match(fragment,/!!course\?\.freightTerminal/);
  assert.match(fragment,/progress >= 0 && progress < 960/);
  assert.match(fragment,/terminalOpening \? null\s*:\s*resolveRoadStructureContact/);
});
test('visual bridge exclusion matches collision exclusion',()=>{
  assert.match(host,/if\(course\?\.freightTerminal && a\.progress<960\)return;/);
});
test('outside opening, normal collision resolution remains active',()=>{
  assert.match(host,/resolveRoadStructureContact\(truck, previousRoadPosition, p\)/);
  assert.match(host,/if \(contact\) \{/);
});
test('new startup token reloads the corrected road host',()=>{
  assert.match(read('src/app/bootstrap.mjs'),/RELEASE_TOKEN='tlh-depot-collider-03'/);
  assert.match(read('index.html'),/bootstrap\.mjs\?v=tlh-depot-collider-03/);
});
