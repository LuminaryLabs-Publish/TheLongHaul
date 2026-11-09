/* TLH-023: high-contrast four-band lighting on existing *lit* game surfaces.
 * Work on final fragment normals / actual albedo, not camera-facing vertex
 * normals or the entire already-lit image. Keep sky, labels, glass and HUD.
 * Existing NexusEngine scene, game camera, and subsequent Sobel own rendering.
 */
(() => {
  'use strict';
  const LEVELS=Object.freeze([.30,.52,.78,1.05]);
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
        float lhDirect=max(0.0,dot(normalize(normal),normalize(uLHFourBandSun)));
        float lhEngineLight=clamp(dot(max(outgoingLight,vec3(0.0)),lhLumaWeights)/max(.12,lhPigmentLuma),0.0,1.0);
        float lhLight=clamp(lhDirect*.76+lhEngineLight*.24+uLHBandBias,0.0,1.0);
        float lhBand=lhLight<.15?0.30:(lhLight<.45?0.52:(lhLight<.90?0.78:1.05));
        // Shade original pigment in distinct bands, instead of repainting it gray/white.
        vec3 lhToon=lhPigment*lhBand;
        outgoingLight=clamp(mix(lhToon,max(outgoingLight,vec3(0.0)),.12),0.0,1.0);
        #include <opaque_fragment>`);
    };
    const priorKey=material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey=()=>`${priorKey?priorKey():''}|lh-pigment-cel-v3|${bias}`;
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
