import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {ENVIRONMENT_TILE_CATALOG,ENV_TILE_VARIANTS,ENV_TILE_METERS,ENVIRONMENT_TILE_CATALOG_VERSION} from '../src/game/environment-tile-catalog.mjs';
import {authorEnvironmentTile,ENVIRONMENT_AUTHORING_SOURCE} from '../src/game/environment-tile-authoring.mjs';
const out=resolve(process.argv[2]??'manifests/environment-tiles-authoring.json');
const assemblies=ENVIRONMENT_TILE_CATALOG.flatMap(t=>ENV_TILE_VARIANTS.map(v=>authorEnvironmentTile(t.id,v.id)));
if(ENVIRONMENT_TILE_CATALOG.length!==100||assemblies.length!==400||new Set(assemblies.map(x=>x.id)).size!==400)throw Error('Missing 100 templates / 400 assemblies');
const content={version:ENVIRONMENT_TILE_CATALOG_VERSION,tileLengthMeters:ENV_TILE_METERS,
  existingWorldCellMeters:160,authoringSource:ENVIRONMENT_AUTHORING_SOURCE,
  authoredTemplates:ENVIRONMENT_TILE_CATALOG.length,authoredVariants:assemblies.length,
  assemblies:assemblies.map(a=>({id:a.id,templateId:a.id.split(':')[0],variant:a.variant,biome:a.biome,
    composition:a.composition,length:a.length,sourceObjects:a.sourceObjects}))};
await mkdir(dirname(out),{recursive:true});
const header={...content,assemblies:undefined};
const head=JSON.stringify(header,null,2).replace(/\n}$/,',\n  \"assemblies\": [');
const rows=content.assemblies.map(a=>'    '+JSON.stringify(a));
await writeFile(out,head+'\n'+rows.join(',\n')+'\n  ]\n}\n');
console.log(`PASS: generated ${assemblies.length} source-bound tile assemblies from 100 types (${ENV_TILE_METERS}m each) at ${out}`);
