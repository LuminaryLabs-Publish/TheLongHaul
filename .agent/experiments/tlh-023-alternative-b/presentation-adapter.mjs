/* TLH-023 experimental Presentation adapter.
 * NOT loaded by the game; source artwork and browser acceptance pending.
 * Read existing display state only; no game/input/save ownership. */
const q=(root,id)=>root.querySelector('#'+id);
const num=value=>{const match=String(value??'').match(/-?\d+(?:\.\d+)?/);return match?Number(match[0]):null};
const value=(doc,id)=>q(doc,id)?.textContent?.trim()??'';
export function readExistingHud(doc=document){
 const xp=doc.querySelector('#skill-open i em');
 const score=value(doc,'risk-bank');
 return {
  driving:doc.body.classList.contains('driving'),
  cargo:value(doc,'freight-cargo'),destination:value(doc,'freight-next'),
  speed:num(value(doc,'speed')),fuel:num(value(doc,'fuel-num')),
  condition:num(value(doc,'truck-num')),multiplier:num(value(doc,'risk-multiplier')),
  score:num(score),level:num(value(doc,'skill-level')),
  xpPercent:num(xp?.style.width),
  qAbility:doc.querySelector('#skill-ability-slots .skill-ability:nth-child(1) span')?.textContent?.trim()||'',
  eAbility:doc.querySelector('#skill-ability-slots .skill-ability:nth-child(2) span')?.textContent?.trim()||''
 };
}
export function mountAlternativeB(stage){
 if (!stage || stage.querySelector('#tlh-alternative-b')) throw Error('Expected one game stage and no existing Alternative B HUD');
 const root=document.createElement('div');root.id='tlh-alternative-b';root.hidden=true;root.setAttribute('role','region');root.setAttribute('aria-label','Driving information');
 const fields={};
 for(const [key,cls] of [['cargo','delivery'],['destination','delivery'],['speed','vehicle'],['fuel','vehicle'],['condition','vehicle'],['multiplier','score'],['score','score'],['level','progression'],['xpPercent','progression'],['qAbility','abilities'],['eAbility','abilities']]){
   const region=root.querySelector('[data-region="'+cls+'"]')||document.createElement('div');
   if(!region.dataset.region){region.dataset.region=cls;root.append(region);}
   const span=document.createElement('span');span.dataset.field=key;region.append(span);fields[key]=span;
 }
 stage.append(root);
 return {root,render(state){
  root.hidden=!state?.driving;if(root.hidden)return;
  for(const [key,el] of Object.entries(fields))el.textContent=state[key] == null?'':String(state[key]);
 },dispose(){root.remove();}};
}
