// Bounded browser error diagnostics. Observes but never suppresses exceptions.
export function createRuntimeErrorLedger(limit=16){
 const records=[],counts=new Map();let total=0;
 return {
  record(kind,message,source='',line=0,column=0){
   total++;
   const key=`${kind}|${message}|${source}|${line}|${column}`;
   const count=(counts.get(key)||0)+1;counts.set(key,count);
   if(!records.some(row=>row.key===key)){
    if(records.length>=limit){const removed=records.shift();counts.delete(removed.key);}
    records.push({key,kind,message:String(message).slice(0,900),source:String(source).slice(0,240),line,column,count:0});
   }
   const record=records.find(row=>row.key===key);
   if(record)record.count=count;
   return count;
  },
  getState(){return {total,distinct:records.length,records:records.map(({key,...item})=>({...item}))};}
 };
}
export function installLongHaulErrorLedger(view){
 if(view.LongHaulRuntimeErrors)return view.LongHaulRuntimeErrors;
 const ledger=createRuntimeErrorLedger();
 view.LongHaulRuntimeErrors=ledger;
 view.addEventListener('error',event=>{
  const error=event.error;
  ledger.record('error',error?.stack||error?.message||event.message||'Unknown error',event.filename||'',event.lineno||0,event.colno||0);
 });
 view.addEventListener('unhandledrejection',event=>{
  const reason=event.reason;
  ledger.record('unhandledrejection',reason?.stack||reason?.message||String(reason));
 });
 return ledger;
}
