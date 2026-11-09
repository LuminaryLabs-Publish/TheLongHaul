/* TLH world ink. One post-process over the existing Three.js scene + camera.
 * Source render keeps all authored toon materials; Sobel detects color and
 * geometric depth edges, including truck, traffic, terrain and architecture.
 * The DOM HUD remains crisp and untouched. No second gameplay renderer/loop. */
(() => {
  const status={enabled:false,mode:'depth-prioritized-sobel',width:0,height:0,draws:0,fallback:null};
  window.LongHaulOutlines={getState:()=>({...status})};
  if(!renderer?.setRenderTarget||!THREE?.DepthTexture||!THREE?.WebGLRenderTarget){
    status.fallback='Render target or depth textures unsupported';return;
  }
  const bufferSize=new THREE.Vector2();
  const sourceRender=renderer.render.bind(renderer);
  const originalTarget=()=>renderer.getRenderTarget?.()??null;
  let target=null,pass=null,quad=null,passCamera=null,failed=false,running=false;
  try {
    target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false});
    target.texture.name='LH_SobelColor';target.texture.colorSpace=THREE.SRGBColorSpace;
    target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
    target.depthTexture.format=THREE.DepthFormat;
    target.depthTexture.name='LH_SobelDepth';
    const uniforms={
      tColor:{value:target.texture},tDepth:{value:target.depthTexture},
      texel:{value:new THREE.Vector2(1,1)},strength:{value:.84},
      depthGain:{value:40},colorGain:{value:.32},
      cameraNear:{value:camera.near},cameraFar:{value:camera.far}
    };
    pass=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,transparent:false,
      uniforms,
      vertexShader:`varying vec2 uvScreen;
        void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
      fragmentShader:`uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform vec2 texel;
        uniform float strength,depthGain,colorGain,cameraNear,cameraFar;
        varying vec2 uvScreen;
        float luminance(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
        float viewDepth(vec2 uv){
          float raw=texture2D(tDepth,uv).x;
          float z=raw*2.0-1.0;
          return (2.0*cameraNear*cameraFar)/(cameraFar+cameraNear-z*(cameraFar-cameraNear));
        }
        void main(){
          vec2 p=texel;
          float a=luminance(texture2D(tColor,uvScreen+vec2(-p.x,-p.y)).rgb);
          float b=luminance(texture2D(tColor,uvScreen+vec2(0.,-p.y)).rgb);
          float c=luminance(texture2D(tColor,uvScreen+vec2(p.x,-p.y)).rgb);
          float d=luminance(texture2D(tColor,uvScreen+vec2(-p.x,0.)).rgb);
          float f=luminance(texture2D(tColor,uvScreen+vec2(p.x,0.)).rgb);
          float g=luminance(texture2D(tColor,uvScreen+vec2(-p.x,p.y)).rgb);
          float h=luminance(texture2D(tColor,uvScreen+vec2(0.,p.y)).rgb);
          float i=luminance(texture2D(tColor,uvScreen+vec2(p.x,p.y)).rgb);
          float gx=-a+c-2.0*d+2.0*f-g+i;
          float gy=-a-2.0*b-c+g+2.0*h+i;
          float colorEdge=length(vec2(gx,gy))*colorGain;
          float center=viewDepth(uvScreen);
          float denom=max(1.0,center);
          float da=viewDepth(uvScreen+vec2(-p.x,-p.y))/denom;
          float db=viewDepth(uvScreen+vec2(0.,-p.y))/denom;
          float dc=viewDepth(uvScreen+vec2(p.x,-p.y))/denom;
          float dd=viewDepth(uvScreen+vec2(-p.x,0.))/denom;
          float df=viewDepth(uvScreen+vec2(p.x,0.))/denom;
          float dg=viewDepth(uvScreen+vec2(-p.x,p.y))/denom;
          float dh=viewDepth(uvScreen+vec2(0.,p.y))/denom;
          float di=viewDepth(uvScreen+vec2(p.x,p.y))/denom;
          float depthEdge=length(vec2(-da+dc-2.0*dd+2.0*df-dg+di,
            -da-2.0*db-dc+dg+2.0*dh+di))*depthGain;
          // Strong geometry/depth silhouettes, weak material-color detail.
          // Fade *color* edges with distance so clouds, alpha vegetation and
          // tiny horizon texture changes don't become a noisy ink blanket.
          float shapeInk=smoothstep(.20,.85,depthEdge);
          float nearSurface=1.0-smoothstep(190.0,590.0,center);
          float materialInk=smoothstep(.52,1.12,colorEdge)*nearSurface*.30;
          float distanceFade=1.0-.42*smoothstep(240.0,780.0,center);
          float edge=max(shapeInk,materialInk)*distanceFade;
          vec3 base=texture2D(tColor,uvScreen).rgb;
          vec3 ink=vec3(.018,.031,.049);
          gl_FragColor=vec4(mix(base,ink,edge*strength),1.0);
          #include <colorspace_fragment>
        }`
    });
    quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),pass);
    quad.frustumCulled=false;
    const passScene=new THREE.Scene();passScene.add(quad);
    passCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    status.enabled=true;
    renderer.render=function renderOutlinedWorld(renderScene,renderCamera){
      if(failed||running||renderScene!==scene||renderCamera!==camera)
        return sourceRender(renderScene,renderCamera);
      const prior=originalTarget();running=true;
      try {
        renderer.getDrawingBufferSize(bufferSize);
        const w=Math.max(1,Math.floor(bufferSize.x)),h=Math.max(1,Math.floor(bufferSize.y));
        if(w!==status.width||h!==status.height){
          target.setSize(w,h);status.width=w;status.height=h;
          uniforms.texel.value.set(1/w,1/h);
        }
        uniforms.cameraNear.value=camera.near;uniforms.cameraFar.value=camera.far;
        // Never leave the world renderer pointing at the offscreen buffer.
        renderer.setRenderTarget(target);
        sourceRender(renderScene,renderCamera);
        renderer.setRenderTarget(prior);
        sourceRender(passScene,passCamera);
        status.draws++;
      } catch(error){
        failed=true;status.enabled=false;status.fallback=String(error);
        renderer.setRenderTarget(prior);
        console.warn('Sobel postprocess unavailable; restored ordinary game rendering',error);
        return sourceRender(renderScene,renderCamera);
      } finally {running=false;}
    };
  }catch(error){
    status.fallback=String(error);
    target?.dispose();pass?.dispose();quad?.geometry?.dispose();
    console.warn('Sobel postprocess failed to initialize',error);
  }
})();
