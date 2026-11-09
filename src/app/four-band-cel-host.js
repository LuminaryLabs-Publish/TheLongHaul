/* TLH-023: high-contrast four-band lighting on existing *lit* game surfaces.
 * Work on final fragment normals / actual albedo, not camera-facing vertex
 * normals or the entire already-lit image. Keep sky, labels, glass and HUD.
 * Existing NexusEngine scene, game camera, and subsequent Sobel own rendering.
 */
(() => {
  'use strict';
  const LEVELS=Object.freeze([.025,.12,.50,.98]);
  const THRESHOLDS=Object.freeze([.15,.45,.90]);
  const state={enabled:true,bands:4,levels:[...LEVELS],thresholds:[...THRESHOLDS],
    materials:0,frames:0,skipped:0,errors:0};
  window.LongHaulCelShading={getState:()=>({...state,levels:[...state.levels],thresholds:[...state.thresholds]})};
  const patched=new WeakSet();
  const direction=new THREE.Vector3(),viewSun=new THREE.Vector3(.4,.7,.5);
  const sunUniform={value:viewSun};
  const supported=material=>material&&(material.isMeshStandardMaterial||material.isMeshPhysicalMaterial||
    material.isMeshLambertMaterial||material.isMeshPhongMaterial||material.isMeshToonMaterial);
  function eligible(material,mesh){
    if(!supported(material)||material.userData?.noCelShading||material.wireframe||
      material.transparent||material.opacity<1||material.depthWrite===false||
      material.blending!==THREE.NormalBlending||material.alphaTest>0||
      mesh?.userData?.noCelShading)return false;
    // Lit luminous signage/lamps must not have their emissive detail erased.
    const glow=material.emissive;
    if(glow && material.emissiveIntensity>0 && glow.r+glow.g+glow.b>.05)return false;
    return true;
  }
  const kindBias={road:-.065,terrain:.075,structure:0,vehicle:0,foliage:.02};
  function apply(material,mesh){
    if(patched.has(material))return;
    if(!eligible(material,mesh)){state.skipped++;return;}
    const bias=kindBias[material.userData?.lhCelKind]??0;
    const previous=material.onBeforeCompile;
    material.onBeforeCompile=function vividFourBandLighting(shader,rendererContext){
      if(typeof previous==='function')previous.call(this,shader,rendererContext);
      // Three.js r165 lit materials expose a *fragment* normal here, after
      // normal maps, instancing, skeletal transforms, and double-side handling.
      // Basic/Shader materials lack this contract and are deliberately skipped.
      if(!shader.fragmentShader.includes('#include <normal_fragment_begin>')||
         !shader.fragmentShader.includes('#include <opaque_fragment>')){
        state.errors++;return;
      }
      shader.uniforms.uLHFourBandSun=sunUniform;
      shader.uniforms.uLHBandBias={value:bias};
      shader.fragmentShader=`uniform vec3 uLHFourBandSun;
        uniform float uLHBandBias;\n`+shader.fragmentShader.replace('#include <opaque_fragment>',`
        // Quantize real fragment-space illumination; preserve each material's
        // diffuse/vertex/texture color rather than repainting it gray.
        vec3 lhPigment=clamp(diffuseColor.rgb,0.0,1.0);
        vec3 lhLumaWeights=vec3(.2126,.7152,.0722);
        float lhPigmentLuma=dot(lhPigment,lhLumaWeights);
        vec3 lhChroma=lhPigment-vec3(lhPigmentLuma);
        float lhDirect=max(0.0,dot(normalize(normal),normalize(uLHFourBandSun)));
        // Existing engine lighting provides a small shadow/ambient cue.
        // Never quantize the whole screen or move the light with the camera.
        float lhEngineLight=clamp(dot(outgoingLight,lhLumaWeights)/max(.16,lhPigmentLuma),0.0,1.0);
        float lhLight=clamp(lhDirect*.88+lhEngineLight*.12,0.0,1.0);
        if(lhLight<${THRESHOLDS[0].toFixed(2)})
          outgoingLight=clamp(vec3(${LEVELS[0].toFixed(3)})+lhChroma*.055,0.0,1.0);
        else if(lhLight<${THRESHOLDS[1].toFixed(2)})
          outgoingLight=clamp(vec3(${LEVELS[1].toFixed(2)})+lhChroma*.19,0.0,1.0);
        else if(lhLight<${THRESHOLDS[2].toFixed(2)}) {
          float lhMid=clamp(${LEVELS[2].toFixed(2)}*.70+lhPigmentLuma*.40+uLHBandBias,.25,.70);
          outgoingLight=clamp(vec3(lhMid)+lhChroma*.84,0.0,1.0);
        } else
          outgoingLight=clamp(vec3(${LEVELS[3].toFixed(2)})+lhChroma*.095,0.0,1.0);
        #include <opaque_fragment>`);
    };
    const priorKey=material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey=()=>`${priorKey?priorKey():''}|lh-pigment-cel-v2|${bias}`;
    material.needsUpdate=true;patched.add(material);state.materials++;
  }
  const previousRender=renderer.render.bind(renderer);
  renderer.render=function renderFourBandWorld(renderScene,renderCamera){
    if(renderScene===scene&&renderCamera===camera){
      worldRoot.traverseVisible(obj=>{
        if(!obj.isMesh)return;
        if(Array.isArray(obj.material))for(const m of obj.material)apply(m,obj);
        else apply(obj.material,obj);
      });
      // Derive the sun vector from the game's authoritative directional light.
      // Transform to camera/view space because fragment `normal` is view-space.
      camera.updateMatrixWorld();
      direction.copy(sun.position).sub(sun.target.position).normalize();
      viewSun.copy(direction).transformDirection(camera.matrixWorldInverse);
      state.frames++;
    }
    return previousRender(renderScene,renderCamera);
  };
})();
