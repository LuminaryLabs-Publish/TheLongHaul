const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const DESTRUCTIBLE_PROFILES=Object.freeze([
 Object.freeze({health:65,mass:1400}),Object.freeze({health:90,mass:2100}),
 Object.freeze({health:125,mass:3400}),Object.freeze({health:165,mass:6500})]);
export function createDestructibleVehicleKit({capacity=14}={}){
 const vehicles=new Map();
 return{
  register(id,kind=0){if(vehicles.has(id))return this.get(id);if(vehicles.size>=capacity)throw Error('Destructible vehicle pool full');const profile=DESTRUCTIBLE_PROFILES[kind]||DESTRUCTIBLE_PROFILES[0];vehicles.set(id,{id,kind,health:profile.health,state:'intact',lastEvent:null,events:[]});return this.get(id);},
  impact(id,event){const v=vehicles.get(id);if(!v||v.state==='destroyed'||v.state==='retired'||v.events.includes(event?.id))return{applied:false};if(!event?.id||!Number.isFinite(event.response?.targetDamage))return{applied:false};v.lastEvent=event.id;v.events.push(event.id);if(v.events.length>64)v.events.shift();
   v.health=Math.max(0,v.health-clamp(event.response.targetDamage,0,1000));
   v.state=v.health<=0?'destroyed':'damaged';return{applied:true,destroyed:v.state==='destroyed',...v};},
  get(id){const v=vehicles.get(id);return v?{...v,events:[...v.events]}:null;},
  retire(id){const v=vehicles.get(id);if(v)v.state='retired';},
  remove(id){vehicles.delete(id);},reset(){vehicles.clear();},
  snapshot(){return [...vehicles.values()].map(v=>({...v,events:[...v.events]}));}
 };
}
export function createComicCrashKits(N){
 return [N.defineDomainServiceKit({id:'long-haul-impact-kit',domain:'long-haul-impact',apiName:'longHaulImpact',version:'1.0.0',stability:'game-experimental',services:['vehicle-impact','contact-episodes'],createApi:()=>createImpactKit()}),
 N.defineDomainServiceKit({id:'long-haul-destructible-vehicle-kit',domain:'long-haul-destructible-vehicle',apiName:'longHaulDestructibles',version:'1.0.0',stability:'game-experimental',services:['vehicle-damage','vehicle-destruction'],createApi:()=>createDestructibleVehicleKit()})];
}
import {createImpactKit} from './impact-kit.mjs';
