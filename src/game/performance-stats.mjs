export function summarize(values) {
  if(!values.length)return {samples:0,mean:0,p50:0,p95:0,p99:0,max:0};
  const sorted=[...values].sort((a,b)=>a-b);
  return {samples:values.length,mean:values.reduce((n,v)=>n+v,0)/values.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],p99:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.99))],max:sorted.at(-1)};
}
export function createPerformanceStats(capacity=1800) {
  const phases=new Map(),counts={};let frames=0,scene=null;
  function sample(name,ms){let ring=phases.get(name);if(!ring)phases.set(name,ring=[]);ring[frames%capacity]=ms}
  return {
    begin(nextScene,interval){if(scene!==nextScene){phases.clear();frames=0;scene=nextScene}sample('interval',interval)},
    measure(name,operation){const start=performance.now();try{return operation()}finally{sample(name,performance.now()-start)}},
    end(){frames++},count(name,delta=1){counts[name]=(counts[name]||0)+delta},
    reset(){phases.clear();frames=0},
    snapshot(){return {scene,frames,counts:{...counts},phases:Object.fromEntries([...phases].map(([name,values])=>[name,summarize(values.filter(Number.isFinite))]))}}
  };
}
