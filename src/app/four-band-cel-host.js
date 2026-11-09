/* TLH-023: Four sharply separated lighting values on the game's existing 3D
 * meshes. Injects into the real Three.js material shader before the existing
 * Sobel compositor; no new scene, render target, or simulation authority.
 * Sky/clouds, translucent effects, emissive signs, and DOM HUD are unchanged.
 */
(() => {
  'use strict';
  const LEVELS=Object.freeze([.025,.12,.50,.98]);
  const THRESHOLDS=Object.freeze([.20,.49,.76]);
  const state={enabled:true,bands:4,levels:[...LEVELS],thresholds:[...THRESHOLDS],
    materials:0,frames:0,skipped:0,errors:0};
  window.LongHaulCelShading={getState:()=>({...state,levels:[...state.levels],thresholds:[...state.thresholds]})};
  const patched=new WeakSet();
  const sunDirection=new THREE.Vector3(.4,.7,.5);
  const viewSun=new THREE.Vector3();
  const sunUniform={value:viewSun};
  const supported=material=>material&&(material.isMeshStandardMaterial||material.isMeshPhysicalMaterial||
    material.isMeshLambertMaterial||material.isMeshPhongMaterial||material.isMeshToonMaterial||
    material.isMeshBasicMaterial);
  function eligible(material,mesh){
    if(!supported(material)||material.userData?.noCelShading||material.wireframe||
      material.transparent||material.opacity<1||material.depthWrite===false||
      material.blending!==THREE.NormalBlending||material.alphaTest>0)return false;
    // Painted labels and luminous details must remain readable, not graded as
    // physical faces. The full game 3D environment uses solid lit materials.
    if(material.isMeshBasicMaterial&&(material.map||material.emissive))return false;
    if(mesh?.userData?.noCelShading)return false;
    return true;
  }
  function apply(material,mesh){
    if(patched.has(material))return;
    if(!eligible(material,mesh)){state.skipped++;return;}
    const previous=material.onBeforeCompile;
    material.onBeforeCompile=function fourBandCelShader(shader,rendererContext){
      if(typeof previous==='function')previous.call(this,shader,rendererContext);
      const vertexHook=this.isMeshBasicMaterial?'#include <begin_vertex>':'#include <defaultnormal_vertex>';
      const normalAssignment=this.isMeshBasicMaterial
        ?'vLHFourBandNormal = normalize(normalMatrix * normal);'
        :'vLHFourBandNormal = normalize(transformedNormal);';
      if(!shader.vertexShader.includes(vertexHook)||!shader.fragmentShader.includes('#include <opaque_fragment>')){
        state.errors++;return;
      }
      shader.uniforms.uLHFourBandSun=sunUniform;
      shader.vertexShader='varying vec3 vLHFourBandNormal;\n'+shader.vertexShader.replace(vertexHook,
        vertexHook+'\n'+normalAssignment);
      shader.fragmentShader=`varying vec3 vLHFourBandNormal;
        uniform vec3 uLHFourBandSun;\n`+shader.fragmentShader.replace('#include <opaque_fragment>',`
        // Exactly four *lighting* values. Preserve authored diffuse material,
        // vertex tint, and PBR texture color, but allow the brightest plane
        // to approach white rather than merely brightening its albedo.
        vec3 lhNormal = normalize(vLHFourBandNormal);
        if (!gl_FrontFacing) lhNormal = -lhNormal;
        float lhLight = clamp(.5 + .5 * dot(lhNormal,normalize(uLHFourBandSun)),0.0,1.0);
        vec3 lhPigment=clamp(diffuseColor.rgb,0.0,1.0);
        if(lhLight<${THRESHOLDS[0].toFixed(2)}) outgoingLight=lhPigment*${LEVELS[0].toFixed(3)};
        else if(lhLight<${THRESHOLDS[1].toFixed(2)}) outgoingLight=lhPigment*${LEVELS[1].toFixed(2)};
        else if(lhLight<${THRESHOLDS[2].toFixed(2)}) outgoingLight=lhPigment*${LEVELS[2].toFixed(2)};
        else outgoingLight=mix(lhPigment,vec3(${LEVELS[3].toFixed(2)}),.92);
        #include <opaque_fragment>`);
    };
    const cache=material.customProgramCacheKey?.bind(material);
    material.customProgramCacheKey=()=>`${cache?cache():''}|lh-four-band-v1`;
    material.needsUpdate=true;
    patched.add(material);state.materials++;
  }
  const previousRender=renderer.render.bind(renderer);
  renderer.render=function renderFourBandWorld(renderScene,renderCamera){
    if(renderScene===scene&&renderCamera===camera){
      // World is streamed dynamically. A WeakSet makes the per-frame traversal
      // cheap to repeat and covers lazily loaded GLBs/instanced traffic meshes.
      worldRoot.traverseVisible(obj=>{
        if(!obj.isMesh)return;
        if(Array.isArray(obj.material))for(const m of obj.material)apply(m,obj);
        else apply(obj.material,obj);
      });
      camera.updateMatrixWorld();
      sunDirection.copy(sun.position).sub(sun.target.position).normalize();
      viewSun.copy(sunDirection).transformDirection(camera.matrixWorldInverse);
      state.frames++;
    }
    return previousRender(renderScene,renderCamera);
  };
})();
