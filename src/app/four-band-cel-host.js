/* Shared surface lighting for the actual Three.js r165 host. Nexus owns game
 * state; this adapter owns GPU materials. No provider or engine substitution. */
(() => {
  'use strict';
  const style=globalThis.LongHaulToonStyle;
  if(!style)throw Error('Long Haul toon style must load before the surface adapter');
  const state={enabled:true,style:style.id,bands:4,levels:[...style.levels],thresholds:[...style.thresholds],
    materials:0,frames:0,skipped:0,errors:0,visible:{}};
  window.LongHaulCelShading={getState:()=>({...state,visible:{...state.visible},levels:[...state.levels],thresholds:[...state.thresholds]})};
  const patched=new WeakSet(),skipped=new WeakSet();
  const direction=new THREE.Vector3(),viewSun=new THREE.Vector3(.4,.7,.5);
  const sunUniform={value:viewSun};
  const supported=m=>m&&(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial||m.isMeshToonMaterial);
  const shared={uLHLevels:{value:new THREE.Vector4(...style.levels)},uLHThresholds:{value:new THREE.Vector3(...style.thresholds)},
    uLHSoftness:{value:style.softness},uLHShadow:{value:new THREE.Vector3(...style.shadowTint)},
    uLHMid:{value:new THREE.Vector3(...style.midTint)},uLHHighlight:{value:new THREE.Vector3(...style.highlightTint)}};
  function role(m){return m.userData?.lhCelKind||(m.alphaTest>0?'foliage':m.metalness>.4?'metal':'structure');}
  function eligible(m,obj){
    const policy=style.roles[role(m)]??style.roles.structure;
    return supported(m)&&!m.userData?.noCelShading&&!obj?.userData?.noCelShading&&!m.wireframe&&
      m.blending===THREE.NormalBlending&&
      ((!m.transparent&&m.opacity>=1&&m.depthWrite!==false)||policy.blend===true);
  }
  function apply(m,obj){
    if(!m)return;
    const kind=role(m),policy=style.roles[kind]??style.roles.structure;
    if(!eligible(m,obj)){
      if(!skipped.has(m)){skipped.add(m);state.skipped++;}
      const exclusion=m.isShaderMaterial?'atmosphere/custom':m.transparent?'transparent/effect':'unlit/sign';
      state.visible[exclusion]=(state.visible[exclusion]??0)+1;return;
    }
    state.visible[kind]=(state.visible[kind]??0)+1;
    if(patched.has(m))return;
    const previous=m.onBeforeCompile;
    m.onBeforeCompile=function sharedToonLighting(shader,context){
      previous?.call(this,shader,context);
      if(!shader.fragmentShader.includes('#include <normal_fragment_begin>')||!shader.fragmentShader.includes('#include <opaque_fragment>')){
        state.errors++;throw Error(`Unsupported toon shader chunks: ${this.type}`);
      }
      Object.assign(shader.uniforms,shared,{uLHFourBandSun:sunUniform,uLHBandBias:{value:policy.bias},
        uLHSpecular:{value:policy.specular},uLHRim:{value:policy.rim}});
      // Toon assets retain their maps/instances but don't quantize light twice.
      shader.fragmentShader=shader.fragmentShader.replace('#include <gradientmap_pars_fragment>',
        'vec3 getGradientIrradiance(vec3 normal,vec3 lightDirection){return vec3(max(0.0,dot(normal,lightDirection)));}');
      shader.fragmentShader=`uniform vec3 uLHFourBandSun,uLHThresholds,uLHShadow,uLHMid,uLHHighlight;
        uniform vec4 uLHLevels;
        uniform float uLHBandBias,uLHSoftness,uLHSpecular,uLHRim;\n`+
        shader.fragmentShader.replace('#include <opaque_fragment>',`
        vec3 lhPigment=clamp(diffuseColor.rgb,0.0,1.0);
        vec3 lhLumaWeights=vec3(.2126,.7152,.0722);
        float lhPigmentLuma=dot(lhPigment,lhLumaWeights);
        vec3 lhDiffuse=max(reflectedLight.directDiffuse+reflectedLight.indirectDiffuse,vec3(0.0));
        float lhDiffuseWeight=1.0;
        #ifdef STANDARD
          lhDiffuseWeight=max(.04,1.0-metalnessFactor);
        #endif
        float lhEngineLight=dot(lhDiffuse,lhLumaWeights)/max(.001,lhPigmentLuma*lhDiffuseWeight);
        // Fully metallic surfaces derive illumination from their real reflected
        // specular light, including shadows; never from an unshadowed fake sun.
        #ifdef STANDARD
          lhEngineLight=mix(lhEngineLight,dot(reflectedLight.directSpecular+reflectedLight.indirectSpecular,lhLumaWeights)/max(.02,lhPigmentLuma),smoothstep(.85,1.0,metalnessFactor));
        #endif
        float lhLight=clamp(lhEngineLight+uLHBandBias,0.0,1.0);
        float lhWidth=max(uLHSoftness,min(.04,fwidth(lhLight)));
        vec3 lhSteps=smoothstep(uLHThresholds-vec3(lhWidth),uLHThresholds+vec3(lhWidth),vec3(lhLight));
        float lhBand=uLHLevels.x+dot(lhSteps,uLHLevels.yzw-uLHLevels.xyz);
        vec3 lhTint=mix(uLHShadow,uLHMid,lhSteps.x);
        lhTint=mix(lhTint,vec3(1.0),lhSteps.y);
        lhTint=mix(lhTint,uLHHighlight,lhSteps.z);
        vec3 lhToon=lhPigment*lhBand;
        float lhNight=min(1.0,lhEngineLight/.15);
        vec3 lhReflected=max(reflectedLight.directSpecular+reflectedLight.indirectSpecular,vec3(0.0));
        float lhSpecLuma=dot(lhReflected,lhLumaWeights);
        vec3 lhSpecular=lhReflected/max(1.0,max(lhReflected.r,max(lhReflected.g,lhReflected.b)));
        lhSpecular*=uLHSpecular*smoothstep(.025,.075,lhSpecLuma);
        float lhRim=pow(1.0-clamp(abs(dot(normal,normalize(vViewPosition))),0.0,1.0),3.0);
        lhRim*=uLHRim*lhNight*smoothstep(.0,.7,dot(normal,uLHFourBandSun));
        outgoingLight=max(lhToon*lhTint*lhNight+lhSpecular+lhPigment*lhRim,vec3(0.0))+totalEmissiveRadiance;
        #include <opaque_fragment>`);
    };
    const priorKey=m.customProgramCacheKey?.bind(m);
    m.customProgramCacheKey=()=>`${priorKey?priorKey():''}|${style.id}|${kind}`;
    m.needsUpdate=true;patched.add(m);state.materials++;
  }
  const previousRender=renderer.render.bind(renderer);
  renderer.render=function renderToonWorld(renderScene,renderCamera){
    if(renderScene===scene&&renderCamera===camera){
      state.visible={};
      // Includes scene-level traffic, pickups and pooled debris, not only cells.
      scene.traverseVisible(obj=>{
        if(!obj.isMesh)return;
        if(Array.isArray(obj.material))for(const m of obj.material)apply(m,obj);
        else apply(obj.material,obj);
      });
      camera.updateMatrixWorld();direction.copy(sun.position).sub(sun.target.position).normalize();
      viewSun.copy(direction).transformDirection(camera.matrixWorldInverse);state.frames++;
    }
    return previousRender(renderScene,renderCamera);
  };
})();
