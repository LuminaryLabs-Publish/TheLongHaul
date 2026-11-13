/* One browser-host startup authority. Nexus CoreScene still owns game scenes.
 * Preview scenery and loading animations never decide whether a haul can start. */
(() => {
  'use strict';
  if (window.LongHaulStartup) return;
  const entrySelector = '#start-btn, #freight-resume-btn';
  const buttons = new Map(), optionalScripts = new Set(), warnings = [];
  const state = {status:'loading', phase:'game modules', runtimeReady:false, error:null};
  let completion = null;
  window.__longHaulBooted = false;
  window.__longHaulRuntimeReady = false;
  const statusNode = () => document.getElementById('startup-status');
  function captureButtons() {
    for (const button of document.querySelectorAll(entrySelector)) {
      if (!buttons.has(button)) buttons.set(button, button.disabled);
      button.disabled = true;
    }
  }
  function guard(event) {
    if (state.status !== 'ready' && event.target?.closest?.(entrySelector)) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }
  function cleanup() {
    clearTimeout(slowTimer); clearTimeout(deadline);
    document.removeEventListener('click', guard, true);
    window.removeEventListener('error', onError, true);
    window.removeEventListener('unhandledrejection', onRejection);
  }
  function warn(error) {
    const message = String(error?.message ?? error);
    if (warnings.length < 16) warnings.push(message);
    console.warn('Optional presentation unavailable:', message);
  }
  function releaseBoot(reason) {
    const loading=window.LongHaulAsyncLoading;
    if(loading?.releaseBoot) { loading.releaseBoot(reason); return; }
    if(loading?.getState?.().kind==='boot') { loading.cancel(undefined,reason); return; }
    // The presentation script itself may have failed before this controller loaded.
    if(!loading) {
      const overlay=document.getElementById('async-loading-scene');
      if(overlay){overlay.hidden=true;overlay.style.display='none';overlay.style.pointerEvents='none';overlay.setAttribute('aria-busy','false');}
    }
  }
  function fail(error) {
    if (state.status !== 'loading') return false;
    state.status = 'failed'; state.error = String(error?.message ?? error);
    window.__longHaulBooted = false;
    captureButtons(); cleanup();
    releaseBoot('startup-failed');
    const text = document.getElementById('boot-error');
    if (text) text.textContent = state.error;
    document.getElementById('boot-failure')?.classList.add('show');
    if (statusNode()) statusNode().hidden = true;
    return true;
  }
  function onError(event) {
    const src = event.filename || event.target?.src;
    if (src && optionalScripts.has(src)) { warn(event.error || event.message || src); return; }
    // Images/audio are presentation resources, not a failed JavaScript startup.
    if (!event.error && !event.message && event.target?.tagName !== 'SCRIPT') return;
    fail(event.error || event.message || `Could not load ${src || state.phase}`);
  }
  function onRejection(event) { fail(event.reason || new Error('Startup promise rejected')); }
  document.addEventListener('click', guard, true);
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onRejection);
  captureButtons();
  const slowTimer = setTimeout(() => {
    if (state.status !== 'loading') return;
    const message = `Still loading ${state.phase}…`;
    const node = statusNode();
    if (node) { node.hidden = false; node.textContent = message; }
    window.LongHaulAsyncLoading?.report?.(undefined, {phase:message});
  }, 12000);
  const deadline = setTimeout(() => fail(new Error(`Startup timed out while loading ${state.phase}. Reload to retry.`)), 60000);

  function required(promise, phase, timeoutMs = 30000) {
    if (state.status !== 'loading') return Promise.reject(new Error(state.error || 'Startup is not loading'));
    state.phase = phase;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out loading ${phase}`)), timeoutMs);
      Promise.resolve(promise).then(resolve, reject).finally(() => clearTimeout(timer));
    });
  }
  function loadScript(url, {optional = false, timeoutMs = 30000} = {}) {
    if (!optional && state.status !== 'loading') return Promise.reject(new Error(state.error || 'Startup is not loading'));
    const href = String(url);
    if (optional) optionalScripts.add(href);
    else state.phase = href.split('/').pop();
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let settled = false;
      function finish(error) {
        if (settled) return;
        settled = true; clearTimeout(timer);
        window.removeEventListener('error', executionError, true);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve(true);
      }
      function executionError(event) {
        if (event.filename === href || event.target === script)
          finish(event.error || new Error(event.message || `Could not execute ${href}`));
      }
      const timer = setTimeout(() => finish(new Error(`Timed out loading ${href}`)), timeoutMs);
      script.src = href; script.async = false;
      script.onload = () => finish();
      script.onerror = () => finish(new Error(`Could not load ${href}`));
      window.addEventListener('error', executionError, true);
      document.head.append(script);
    });
    return optional ? promise.catch(error => { warn(error); return false; }) : promise;
  }
  function complete() {
    if (completion) return completion;
    completion = (async () => {
      if (state.status !== 'loading') return false;
      if (!state.runtimeReady) { fail(new Error('Core runtime did not initialize')); return false; }
      state.phase = 'opening menu';
      try { await required(window.LongHaulAsyncLoading?.finishBoot?.(), 'opening menu', 3000); }
      catch (error) { warn(error); }
      // A failed/suspended animation may not retain a transparent click shield.
      // Only the original boot operation is released, never a newer course load.
      releaseBoot('menu-ready');
      if (state.status !== 'loading') return false;
      captureButtons();
      for (const [button, wasDisabled] of buttons) button.disabled = wasDisabled;
      cleanup();
      document.getElementById('boot-failure')?.classList.remove('show');
      if (statusNode()) statusNode().hidden = true;
      state.status = 'ready'; state.phase = 'ready';
      window.__longHaulBooted = true;
      window.dispatchEvent(new Event('longhaul:ready'));
      return true;
    })();
    return completion;
  }
  window.LongHaulStartup = {
    loadScript, required, complete, fail, warn,
    runtimeReady() {
      if (state.status !== 'loading') return;
      state.runtimeReady = true; window.__longHaulRuntimeReady = true; captureButtons();
    },
    getState: () => ({...state, warnings:[...warnings]})
  };
})();
