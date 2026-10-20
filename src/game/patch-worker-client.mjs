import { createCourseCellDescriptor } from './cell-descriptor.mjs';
import { prepareTreeDataIncremental } from './patch-geometry.mjs';

// One bounded worker per run. Retiring it cancels old-generation requests.
export function createPatchWorkerClient(course,{quality=true}={}) {
  let worker=null,sequence=0,disposed=false,failed=false,fallbackPending=0;
  const pending=new Map();
  const fallback=cell=>{fallbackPending++;return new Promise((resolve,reject)=>setTimeout(async()=>{
    if(disposed){reject(new Error('Retired patch generation'));return}
    try{resolve(await prepareTreeDataIncremental(createCourseCellDescriptor(course,cell,{terrainSegments:course.geography?12:16}),quality,()=>disposed))}catch(error){reject(error)}
  },0)).finally(()=>fallbackPending--)};
  try {
    worker=new Worker(new URL('./patch-worker.mjs',import.meta.url),{type:'module'});
    worker.postMessage({type:'init',course,quality});
    worker.onmessage=({data})=>{const job=pending.get(data.id);if(!job)return;pending.delete(data.id);data.error?job.reject(new Error(data.error)):job.resolve(data.patch)};
    worker.onerror=()=>{failed=true;worker.terminate();worker=null;for(const job of pending.values())fallback(job.cell).then(job.resolve,job.reject);pending.clear()};
  }catch{failed=true}
  return {
    prepare(cell){if(disposed)return Promise.reject(new Error('Retired patch generation'));if(!worker)return fallback(cell);const id=++sequence;return new Promise((resolve,reject)=>{pending.set(id,{cell,resolve,reject});worker.postMessage({id,cell})})},
    getState:()=>({worker:!!worker,fallback:failed,pending:pending.size+fallbackPending}),
    dispose(){disposed=true;worker?.terminate();worker=null;for(const job of pending.values())job.reject(new Error('Retired patch generation'));pending.clear()}
  };
}
