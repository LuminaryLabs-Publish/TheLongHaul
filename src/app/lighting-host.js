/* Long Haul presentation lighting. Nexus owns time/weather state; this host
 * alone writes global Three light colors, intensity and sun direction.
 * The existing shadow scheduler only supplies a snapped camera-relative anchor. */
(() => {
  'use strict';
  const policy=globalThis.LongHaulToonStyle?.illumination;
  if(!policy)throw Error('Illustrated illumination policy is missing');
  const fill=worldRoot.children.find(node=>node.isDirectionalLight&&node!==sun);
  const mix=(a,b,t)=>a+(b-a)*t;
  const setColors=()=>{
    sun.color.set(policy.sunColor);
    hemi.color.set(policy.skyColor);
    hemi.groundColor.set(policy.groundColor);
    if(fill){fill.color.set(policy.fillColor);fill.castShadow=false;}
  };
  setColors();
  const prior=arcadeVisualFrame;
  let updates=0,weather=0;
  arcadeVisualFrame=function finalIlluminationFrame(now){
    prior(now); // Existing host chooses shadow candidates and its snapped anchor.
    weather=clamp(arcadeWeatherAmount,0,1);
    const base=policy.clear,rain=policy.rain;
    sun.intensity=mix(base.sun,rain.sun,weather);
    hemi.intensity=mix(base.hemisphere,rain.hemisphere,weather);
    if(fill)fill.intensity=mix(base.fill,rain.fill,weather);
    const focus=currentScene()==='driving'&&course
      ?window.__longHaulShadowFocus??readTruck().position:null;
    if(focus){
      sun.position.set(focus.x-112,focus.y+165,focus.z-98);
      sun.target.position.set(focus.x,focus.y,focus.z);
      sun.target.updateMatrixWorld();
    }
    updates++;
  };
  window.LongHaulIllumination={getState:()=>({owner:'long-haul:lighting-host',
    updates,weather,sun:sun.intensity,hemisphere:hemi.intensity,
    fill:fill?.intensity??0,shadowFocus:window.__longHaulShadowFocus??null})};
})();
