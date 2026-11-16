import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('fresh-run seed selects the terminal-direct opening while older seeds retain geometry',()=>{
 const host=load('src/app/app-chunk-5.js'),adapter=load('src/game/road-v3-playable-course.mjs');
 assert.match(host,/let seed=`haul-terminal-direct-\$\{/);
 assert.match(adapter,/seed\.startsWith\('haul-terminal-direct-'\)/);
 assert.match(adapter,/if\(directTerminal&&index===3\)continue/);
});
test('title resume button never allocates a V3 graph',()=>{
 const host=load('src/app/app-chunk-20.js');
 assert.match(host,/function readFreightCheckpoint\(fullValidation=false\)/);
 assert.match(host,/if\(fullValidation\)\{\s*const v3=/);
 assert.match(host,/freightResumeButton\.hidden=!readFreightCheckpoint\(\)/);
 assert.match(host,/const saved=readFreightCheckpoint\(true\)/);
});
