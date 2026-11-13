/* TLH-LOAD-001: reusable host-side async scene presentation.
 * NexusEngine CoreScene remains the only authority for committing scene identity.
 * This host owns temporary split-door presentation and async reveal, never gameplay.
 * The pinned CoreScene lacks native loadScene; use requestTransition only at commit.
 */
(() => {
  'use strict';
  const root = document.getElementById('async-loading-scene');
  const doorLeft = document.getElementById('async-loading-door-left');
  const doorRight = document.getElementById('async-loading-door-right');
  const caption = document.getElementById('async-loading-caption');
  const phase = document.getElementById('async-loading-phase');
  const meter = document.getElementById('async-loading-progress');
  if (!root || !doorLeft || !doorRight || !caption || !phase || !meter) return;
  const MIN_VISIBLE_MS = 500;
  let serial = 0, current = null;
  let commits = 0, cancellations = 0;
  let doorsOpened=false;

  const delay = (ms, signal) => new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('SCENE_LOAD_CANCELLED')); return; }
    const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, Math.max(0, ms));
    function onAbort() { clearTimeout(timer); reject(new Error('SCENE_LOAD_CANCELLED')); }
    signal.addEventListener('abort', onAbort, {once:true});
  });
  const animate = (element, frames, duration, signal) => new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('SCENE_LOAD_CANCELLED')); return; }
    // Presentation-only animation. Native Web Animations keeps geometry fixed.
    if (typeof element.animate !== 'function') {
      Object.assign(element.style, frames[frames.length - 1]);
      delay(duration, signal).then(resolve, reject);
      return;
    }
    const motion = element.animate(frames, {duration, easing:'cubic-bezier(.22,.72,.28,1)', fill:'forwards'});
    let settled=false;
    const finishMotion=error=>{
      if(settled)return;settled=true;
      clearTimeout(timer);signal.removeEventListener('abort',onAbort);
      if(!error)Object.assign(element.style,frames[frames.length-1]);
      motion.cancel();
      if(error)reject(error);else resolve();
    };
    function onAbort(){finishMotion(new Error('SCENE_LOAD_CANCELLED'));}
    // Web Animations can stay pending in suspended/background tabs. Presentation
    // may finish without animation, but a failed scene commit never becomes success.
    const timer=setTimeout(()=>finishMotion(),duration+1000);
    signal.addEventListener('abort',onAbort,{once:true});
    motion.finished.then(()=>finishMotion(),()=>finishMotion(new Error('SCENE_LOAD_CANCELLED')));
  });
  const report = (operation=current, info = {}) => {
    if (current !== operation) return;
    const progress = Number.isFinite(info.progress) ? Math.max(0,Math.min(1,info.progress)) : null;
    if (progress !== null) {
      const percent=Math.round(progress*100);
      meter.style.width=percent+'%';
      meter.parentElement?.setAttribute('aria-valuenow',String(percent));
    }
    if (typeof info.phase==='string') phase.textContent=info.phase.slice(0,96);
  };
  function begin({kind='scene', minVisibleMs=MIN_VISIBLE_MS} = {}) {
    if (current) cancel(current, 'superseded');
    const controller = new AbortController();
    const operation = {id:++serial,kind,started:performance.now(),minimum:Math.max(MIN_VISIBLE_MS,Number(minVisibleMs)||0),
      controller,status:'preparing',committed:false};
    current=operation;
    root.hidden=false;root.style.display='block';root.style.visibility='visible';root.style.pointerEvents='auto';
    root.style.opacity='1';root.style.transform='none';
    for(const door of [doorLeft,doorRight]){
      door.getAnimations?.().forEach(a=>a.cancel());
      door.style.transform='none';
      door.style.scale='1';
      door.style.width='50%';
      door.style.minWidth='50%';
      door.style.maxWidth='50%';
      door.style.translate='0px 0px';
    }
    doorLeft.style.left='0%';
    doorRight.style.right='0%';
    caption.style.opacity='1';
    doorsOpened=false;
    meter.style.width='0%';phase.textContent=kind==='boot'?'STARTING ENGINE':'BUILDING THE HAUL';
    root.setAttribute('aria-busy','true');
    return operation;
  }
  function cancel(operation=current, reason='cancelled') {
    if (!operation || current!==operation) return false;
    operation.status=reason;operation.controller.abort();cancellations++;
    root.hidden=true;root.style.display='none';root.style.pointerEvents='none';
    root.setAttribute('aria-busy','false');current=null;
    return true;
  }
  async function finish({operation=current,commit=()=>{},phaseText='READY'} = {}) {
    if (!operation || current!==operation || operation.status!=='preparing') return false;
    operation.status='waiting';
    const signal=operation.controller.signal;
    try {
      report(operation,{progress:1,phase:phaseText});
      await delay(Math.max(0,operation.minimum-(performance.now()-operation.started)),signal);
      if (current!==operation) return false;
      operation.status='revealing';
      const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      // Both metal halves remain closed until the destination is committed.
      if (current!==operation || signal.aborted) return false;
      // Commit exactly once while the opaque trailer door still covers the
      // destination. The next animation frame lets the new scene render.
      await commit();
      operation.committed=true;commits++;
      if (signal.aborted || current!==operation) return false;
      // A background tab may throttle animation frames indefinitely.
      // Bound the handoff without making the scene reveal timer-dependent.
      await Promise.race([
        new Promise(resolve=>requestAnimationFrame(resolve)),
        delay(90,signal)
      ]);
      caption.style.opacity='0';
      await Promise.all([
        // Translate each full-size half out by more than its own width.
        // Neither the menu nor the panels are scaled, squeezed, or rotated.
        animate(doorLeft,[
          {translate:'0px 0px'},
          {translate:'-104% 0px'}
        ],reduced?1:700,signal),
        animate(doorRight,[
          {translate:'0px 0px'},
          {translate:'104% 0px'}
        ],reduced?1:700,signal)
      ]);
      doorsOpened=true;
      if (current===operation) {
        operation.status='complete';current=null;
        root.hidden=true;root.style.display='none';root.style.pointerEvents='none';
        root.setAttribute('aria-busy','false');
      }
      return true;
    } catch(error) {
      const wasCancelled=signal.aborted;
      if (current===operation) cancel(operation,'failed');
      if (!wasCancelled) throw error;
      return false;
    }
  }
  async function run({kind='scene',prepare,commit,minimum=MIN_VISIBLE_MS}={}) {
    if (typeof prepare!=='function' || typeof commit!=='function')
      throw new TypeError('Async scene loading requires prepare and commit callbacks');
    const operation=begin({kind,minVisibleMs:minimum});
    try {
      await prepare({signal:operation.controller.signal, report:info=>report(operation,info)});
      if (operation.controller.signal.aborted) return false;
      return await finish({operation,commit});
    } catch(error) {
      const wasCancelled=operation.controller.signal.aborted;
      if (current===operation) cancel(operation,'failed');
      if (!wasCancelled) throw error;
      return false;
    }
  }
  const boot=begin({kind:'boot'});
  let bootFinish=null;
  function finishBoot() {
    if (current!==boot || boot.status!=='preparing') return bootFinish??Promise.resolve(false);
    bootFinish=finish({operation:boot,phaseText:'READY TO DRIVE'});
    return bootFinish;
  }
  window.LongHaulAsyncLoading={
    begin,run,finish,finishBoot,cancel,report,
    releaseBoot(reason='boot-released'){return current===boot?cancel(boot,reason):false;},
    fail(error){if(current)cancel(current,'failed');return error;},
    getState:()=>({active:Boolean(current),kind:current?.kind??null,
      status:current?.status??'inactive',minimumMs:MIN_VISIBLE_MS,
      committed:commits,cancelled:cancellations,pinnedSceneAdapter:true,
      visualMode:'translate-only-doors',doorsOpened})
  };
})();
