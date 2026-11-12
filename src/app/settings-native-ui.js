/* Game-owned renderer-neutral descriptors with a Three.js presentation adapter.
 * Core owns no DOM or authored layout; existing game settings/scene remain authoritative. */
(() => {
  "use strict";
  const W=1600,H=900,CYAN="#84f2f4",WHITE="#f6faff",MUTED="#c3e0e0";
  const tabs=["Gameplay","Audio","Video"];
  const schema={
    Gameplay:[
      {id:"steering",label:"Steering Response",icon:7,type:"slider",min:75,max:125},
      {id:"motion",label:"Camera Motion",icon:8,type:"toggle"},
      {id:"hitStop",label:"Impact Slow Motion",icon:9,type:"slider",min:0,max:100,scale:100},
      {id:"guide",label:"Control Guide",icon:10,type:"action"}],
    Audio:[
      {id:"sound",label:"Sound Enabled",icon:11,type:"toggle"},
      {id:"masterVolume",label:"Master Volume",icon:12,type:"slider",min:0,max:100},
      {id:"musicVolume",label:"Music Volume",icon:13,type:"slider",min:0,max:100,unavailable:true},
      {id:"effectsVolume",label:"Effects Volume",icon:14,type:"slider",min:0,max:100}],
    Video:[
      {id:"graphicsQuality",label:"Graphics Quality",icon:15,type:"choice",choices:["Low","Medium","High"]},
      {id:"renderResolution",label:"Rendering Resolution",icon:16,type:"choice",choices:["Performance","Balanced","Sharp"]},
      {id:"uiScale",label:"UI Scale",icon:17,type:"slider",min:75,max:150},
      {id:"fov",label:"Camera Field of View",icon:18,type:"slider",min:50,max:90},
      {id:"reducedEffects",label:"Reduced Visual Effects",icon:19,type:"toggle"}]
  };
  const descriptors=Object.freeze(Object.fromEntries(tabs.map(name=>[name,Object.freeze(schema[name].map(row=>Object.freeze({...row,id:"settings."+name.toLowerCase()+"."+row.id})))])));
  function createLongHaulSettingsUI({THREE,renderer,settings,currentScene,saveSettings,applySettings,resize,audio,camera,onBack,onCreditsBack}) {
    document.body?.classList?.add("native-settings-ui-ready");const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
    const context=canvas.getContext("2d",{alpha:true});
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mat=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
    const overlay=new THREE.Scene(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);overlay.add(quad);
    const ortho=new THREE.OrthographicCamera(-1,1,1,-1,0,10);ortho.position.z=1;
    const icons=new Map();let tab="Gameplay",guide=false,focus=0,creditsFocus=2,drag=-1,lastScene="",lastSignature="",dirty=true;
    for(let n=1;n<=34;n++){const image=new Image();image.onload=()=>{icons.set(n,image);dirty=true};image.src="./assets/ui/settings/icons/ui-"+String(n).padStart(3,"0")+".svg"}
    const C=context;
    function icon(n,x,y,size=46){size*=Math.max(1,Math.min(1.5,(settings.uiScale||100)/100));const image=icons.get(n);if(image)C.drawImage(image,x-size/2,y-size/2,size,size);else {C.fillStyle=WHITE;C.font="bold 30px sans-serif";C.fillText("◈",x,y)}}
    function text(t,x,y,size=30,color=WHITE,align="left"){size*=Math.max(1,Math.min(1.5,(settings.uiScale||100)/100));C.font="750 "+size+"px Arial, sans-serif";C.textAlign=align;C.fillStyle="#091b21";C.fillText(String(t),x+2,y+3);C.fillStyle=color;C.fillText(String(t),x,y)}
    function panel(x,y,w,h,outline=CYAN,fill="rgba(4,25,33,.3)"){C.beginPath();C.roundRect(x,y,w,h,15);C.fillStyle=fill;C.fill();C.lineWidth=3;C.strokeStyle=outline;C.stroke()}
    function line(y){C.fillStyle="rgba(120,230,235,.42)";C.fillRect(250,y,1100,2)}
    function get(row){return row.scale?Math.round(settings[row.id]*row.scale):settings[row.id]}
    function change(row,value) {
      if(row.unavailable)return;
      if(row.type==="action"){guide=true;dirty=true;return}
      if(row.type==="toggle")settings[row.id]=!settings[row.id];
      else if(row.type==="choice")settings[row.id]=value;
      else settings[row.id]=row.scale?value/row.scale:value;
      if(row.id==="graphicsQuality")settings.quality=settings.graphicsQuality!=="Low";
      applySettings();saveSettings();dirty=true;
      if(row.id==="sound")audio.ensure();
      if(row.id==="fov"){camera.fov=settings.fov;camera.updateProjectionMatrix()}
      if(row.id==="graphicsQuality"||row.id==="renderResolution")resize();
    }
    function paint(){
      C.clearRect(0,0,W,H);
      C.save();const scale=Math.max(.75,Math.min(1,(settings.uiScale||100)/100));
      C.translate(W/2,H/2);C.scale(scale,scale);C.translate(-W/2,-H/2);
      if(currentScene()==="credits"){
        text("THE LONG HAUL",265,185,82);line(225);
        text("CREATED BY LUMINARY LABS",275,315,39);
        text("Powered by NexusEngine and Three.js",275,379,29,MUTED);
        text("Procedural vehicles, roads, scenery, effects and audio",275,444,25,MUTED);
        text("NexusEngine source",275,540,23,CYAN);text("Three.js license",725,540,23,CYAN);if(creditsFocus===0)panel(265,502,335,60);if(creditsFocus===1)panel(710,502,290,60);if(creditsFocus===2)panel(264,780,265,75);
        icon(5,298,815);text("BACK",345,825);C.restore();texture.needsUpdate=true;dirty=false;return
      }
      text("SETTINGS",260,150,79);icon(1,1184,117,68);
      tabs.forEach((name,i)=>{const x=255+370*i;if(tab===name)panel(x,180,341,80);icon(2+i,x+49,222,50);text(name.toUpperCase(),x+100,232,28,tab===name?CYAN:WHITE)});
      line(287);
      if(guide){text("CONTROL GUIDE",275,385,44);text("WASD / ARROWS   DRIVE & STEER",305,455,29);text("SPACE   BOOST     SHIFT   DRIFT     X   HANDBRAKE",305,517,25);text("F   INTERACT     C   CAMERA     M   MAP",305,579,26);text("Touch controls appear on supported devices",305,645,24,MUTED)}
      else schema[tab].forEach((row,i)=>{
        const y=350+94*i;
        if(i===focus)panel(248,y-56,1102,82,"rgba(116,240,245,.75)","rgba(4,25,33,.13)");
        icon(row.icon,298,y-10,50);text(row.label,358,y,29,row.unavailable?"#9bafb2":WHITE);
        if(row.unavailable){text("MUSIC UNAVAILABLE",1290,y,19,MUTED,"right");return}
        if(row.type==="toggle"){const on=Boolean(settings[row.id]);panel(1160,y-42,168,60,on?CYAN:MUTED,on?"rgba(7,135,146,.5)":"rgba(7,21,26,.5)");C.beginPath();C.arc(on?1293:1195,y-12,23,0,Math.PI*2);C.fillStyle=WHITE;C.fill()}
        else if(row.type==="slider"){
          const value=get(row),fraction=Math.max(0,Math.min(1,(value-row.min)/(row.max-row.min)));
          panel(810,y-21,326,12,"#597e84","rgba(8,24,30,.7)");
          C.fillStyle=CYAN;C.fillRect(816,y-14,314*fraction,7);
          C.beginPath();C.arc(816+314*fraction,y-14,18,0,Math.PI*2);C.fillStyle=WHITE;C.fill();C.lineWidth=4;C.strokeStyle=CYAN;C.stroke();
          text(value+(row.id==="fov"?"°":"%"),1330,y,27,CYAN,"right")
        }else if(row.type==="choice")text("‹   "+String(settings[row.id]||row.choices[0]).toUpperCase()+"   ›",1330,y,24,CYAN,"right");
        else icon(21,1290,y-10,39)
      });
      line(771);icon(5,300,823);text(guide?"BACK TO GAMEPLAY":"BACK TO PAUSE",345,834,29);
      C.restore();texture.needsUpdate=true;dirty=false
    }
    const point=e=>{const b=renderer.domElement.getBoundingClientRect(),scale=Math.max(.75,Math.min(1.5,(settings.uiScale||100)/100));return{x:((e.clientX-b.left)/b.width*W-W/2)/scale+W/2,y:((e.clientY-b.top)/b.height*H-H/2)/scale+H/2}};
    function hit(p,move=false){
      if(currentScene()==="credits"){if(!move&&p.y>730)onCreditsBack();else if(!move&&p.y>490&&p.y<575){if(p.x<700)window.open("https://github.com/LuminaryLabs-Dev/NexusEngine","_blank","noopener");else window.open("./vendor/THREE-LICENSE.txt","_blank","noopener")}return}
      if(p.y>=180&&p.y<=265){const i=Math.floor((p.x-255)/370);if(!move&&i>=0&&i<3){tab=tabs[i];guide=false;focus=0;dirty=true}return}
      if(p.y>770){if(!move){if(guide){guide=false;dirty=true}else onBack()}return}
      if(guide)return;
      const i=Math.floor((p.y-294)/94),row=schema[tab][i];
      if(!row||p.y<294)return;
      if(i!==focus){focus=i;dirty=true}
      if(move&&drag!==i)return;
      if(row.type==="slider"&&p.x>=770&&p.x<=1180){if(!move)drag=i;const v=row.min+Math.max(0,Math.min(1,(p.x-816)/314))*(row.max-row.min);change(row,Math.round(v))}
      else if(!move){if(row.type==="choice"){const a=row.choices,k=a.indexOf(settings[row.id]);change(row,a[(k+(p.x<1050?a.length-1:1))%a.length])}else change(row)}
    }
    const pointerDown=e=>{if(!["settings","credits"].includes(currentScene()))return;e.preventDefault();hit(point(e))};
    const pointerMove=e=>{if(currentScene()!=="settings")return;const p=point(e);if(drag>=0){hit(p,true);return}if(!guide&&p.y>=294&&p.y<780){const index=Math.floor((p.y-294)/94);if(schema[tab][index]&&index!==focus){focus=index;dirty=true}}};
    const pointerUp=()=>{drag=-1};
    const keyDown=e=>{
      if(!["settings","credits"].includes(currentScene())||!["Escape","Tab","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter"," "].includes(e.key))return;
      e.preventDefault();e.stopImmediatePropagation?.();
      if(e.key==="Escape"){if(currentScene()==="credits")onCreditsBack();else if(guide)guide=false;else onBack();dirty=true;return}
      if(currentScene()==="credits"){if(["Tab","ArrowDown","ArrowRight","ArrowUp","ArrowLeft"].includes(e.key)){const dir=e.key==="ArrowUp"||e.key==="ArrowLeft"||(e.key==="Tab"&&e.shiftKey)?2:1;creditsFocus=(creditsFocus+dir)%3;dirty=true}else if(e.key==="Enter"||e.key===" "){if(creditsFocus===2)onCreditsBack();else window.open(creditsFocus===0?"https://github.com/LuminaryLabs-Dev/NexusEngine":"./vendor/THREE-LICENSE.txt","_blank","noopener")}return}
      if(e.key==="Tab"){tab=tabs[(tabs.indexOf(tab)+(e.shiftKey?2:1))%3];guide=false;focus=0;dirty=true;return}
      if(guide){if(e.key==="Enter")guide=false;dirty=true;return}
      if(e.key==="ArrowDown"||e.key==="ArrowUp"){focus=(focus+(e.key==="ArrowDown"?1:schema[tab].length-1))%schema[tab].length;dirty=true;return}
      const row=schema[tab][focus];if(e.key==="Enter"||e.key===" "){if(row.type==="toggle"||row.type==="action")change(row);return}
      const dir=e.key==="ArrowRight"?1:-1;
      if(row.type==="slider")change(row,Math.max(row.min,Math.min(row.max,get(row)+dir)));
      if(row.type==="choice"){const a=row.choices;change(row,a[(a.indexOf(settings[row.id])+dir+a.length)%a.length])}
    };
    renderer.domElement.addEventListener("pointerdown",pointerDown);
    window.addEventListener("pointermove",pointerMove);window.addEventListener("pointerup",pointerUp);
    document.addEventListener("keydown",keyDown,true);
    return {
      descriptors,
      getState:()=>({scene:currentScene(),tab,guide,focus,creditsFocus,iconCount:icons.size,backend:"three-canvas-texture"}),
      render(){
        const sceneId=currentScene();if(sceneId!=="settings"&&sceneId!=="credits"){lastScene=sceneId;return}
        if(lastScene!==sceneId){lastScene=sceneId;guide=false;focus=0;dirty=true}
        const signature=JSON.stringify({sceneId,settings,tab,guide,focus});
        if(dirty||signature!==lastSignature){lastSignature=signature;paint()}
        const previousAutoClear=renderer.autoClear;renderer.autoClear=false;try{renderer.clearDepth();renderer.render(overlay,ortho)}finally{renderer.autoClear=previousAutoClear}
      },
      dispose(){renderer.domElement.removeEventListener("pointerdown",pointerDown);window.removeEventListener("pointermove",pointerMove);window.removeEventListener("pointerup",pointerUp);document.removeEventListener("keydown",keyDown,true);texture.dispose();mat.dispose();quad.geometry.dispose()}
    }
  }
  window.createLongHaulSettingsUI=createLongHaulSettingsUI;
})();