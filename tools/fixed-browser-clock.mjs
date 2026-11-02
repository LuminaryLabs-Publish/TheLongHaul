/**
 * Capture-only browser clock. The shipped application remains unchanged.
 * Every step runs its existing RAF callbacks once with an exact timestamp;
 * screenshots therefore represent simulation frames, not wall-clock repeats.
 */
export function installFixedBrowserClock({ audioSeconds = 600, sampleRate = 48000 } = {}) {
  const native = {
    raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window),
    now: performance.now.bind(performance), dateNow: Date.now.bind(Date),
    timeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window),
    interval: window.setInterval.bind(window), clearInterval: window.clearInterval.bind(window),
  };
  let frozen = false, now = native.now(), start = now, offset = 0, nativeFrame = null, nextId = 1, steps = 0;
  const callbacks = new Map(), timers = new Map(), animations = new Map(), audioContexts = [];
  const currentNow = () => frozen ? now : native.now() + offset;
  const dispatch = timestamp => {
    now = timestamp;
    const batch = [...callbacks.values()]; callbacks.clear();
    for (const callback of batch) callback(timestamp);
  };
  const schedule = () => {
    if (frozen || nativeFrame !== null || !callbacks.size) return;
    nativeFrame = native.raf(timestamp => { nativeFrame = null; dispatch(timestamp + offset); schedule(); });
  };
  window.requestAnimationFrame = callback => { const id = nextId++; callbacks.set(id, callback); schedule(); return id; };
  window.cancelAnimationFrame = id => callbacks.delete(id);
  Object.defineProperty(performance, 'now', { configurable: true, value: currentNow });
  Date.now = () => native.dateNow() + (frozen ? now - native.now() : offset);
  const addTimer = (callback, delay, repeat, args) => {
    const id = nextId++, wait = Math.max(repeat ? 1 : 0, Number(delay) || 0);
    const task = { id, callback, args, delay: wait, repeat, due: currentNow() + wait, handle: null };
    const run = () => {
      if (!timers.has(id)) return;
      if (!repeat) timers.delete(id); else task.due = currentNow() + wait;
      if (typeof callback === 'function') callback(...args); else (0, eval)(String(callback));
    };
    task.run = run;
    if (!frozen) task.handle = repeat ? native.interval(run, wait) : native.timeout(run, wait);
    timers.set(id, task); return id;
  };
  const clearTimer = id => {
    const task = timers.get(id); if (!task) return;
    if (task.handle !== null) (task.repeat ? native.clearInterval : native.clearTimeout)(task.handle);
    timers.delete(id);
  };
  window.setTimeout = (callback, delay, ...args) => addTimer(callback, delay, false, args);
  window.setInterval = (callback, delay, ...args) => addTimer(callback, delay, true, args);
  window.clearTimeout = window.clearInterval = clearTimer;

  // The unmodified game's Web Audio graph schedules original engine, wind and
  // effect nodes on a real offline renderer. Its parameter times follow the
  // same simulation clock as the captured frames, independent of CPU speed.
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (Offline) {
    const OfflineGameContext = function () {
      const context = new Offline(2, Math.ceil(audioSeconds * sampleRate), sampleRate);
      const realStartRendering = context.startRendering.bind(context);
      Object.defineProperty(context, 'currentTime', { configurable: true, get: () => frozen ? Math.max(0, (now - start) / 1000) : 0 });
      Object.defineProperty(context, 'resume', { configurable: true, value: () => Promise.resolve() });
      audioContexts.push({ context, realStartRendering });
      return context;
    };
    window.AudioContext = window.webkitAudioContext = OfflineGameContext;
  }
  window.__fixedCapture = {
    freeze() {
      if (frozen) return this.snapshot();
      if (nativeFrame !== null) native.caf(nativeFrame); nativeFrame = null;
      // Last dispatched RAF timestamp matches the application's previous time.
      start = now; frozen = true;
      for (const task of timers.values()) {
        if (task.handle !== null) (task.repeat ? native.clearInterval : native.clearTimeout)(task.handle);
        task.handle = null;
      }
      return this.snapshot();
    },
    step(deltaSeconds = 1 / 30) {
      if (!frozen) throw new Error('Freeze the capture clock before stepping.');
      if (!(deltaSeconds > 0 && deltaSeconds <= 1 / 15 + 1e-8)) throw new Error('Capture timestep must be in (0, 1/15].');
      now += deltaSeconds * 1000;
      let budget = 1000;
      while (budget-- > 0) {
        const due = [...timers.values()].filter(task => task.due <= now).sort((a, b) => a.due - b.due || a.id - b.id)[0];
        if (!due) break;
        due.run();
      }
      if (budget <= 0) throw new Error('Timer loop exceeded capture safety budget.');
      dispatch(now); steps++;
      for (const animation of document.getAnimations()) {
        if (!animations.has(animation)) { animations.set(animation, { start: now, initial: Number(animation.currentTime) || 0 }); animation.pause(); }
        const saved = animations.get(animation); animation.currentTime = saved.initial + now - saved.start;
      }
      return this.snapshot();
    },
    snapshot() { return { frozen, seconds: Math.max(0, (now - start) / 1000), timestamp: now, steps, pendingFrames: callbacks.size, audioContexts: audioContexts.length, audioSeconds, sampleRate }; },
    async renderAudio(usedSeconds, selections = null) {
      if (!audioContexts.length) throw new Error('No original game Web Audio graph was created.');
      if (usedSeconds > audioSeconds) throw new Error('Simulation exceeded offline audio duration.');
      const entry = audioContexts[0], buffer = await entry.realStartRendering();
      const spans = selections?.length ? selections.map(value => ({ start: Math.round(value.start * sampleRate), frames: Math.round(value.duration * sampleRate) })) : [{ start: 0, frames: Math.min(buffer.length, Math.ceil(usedSeconds * sampleRate)) }];
      if (spans.some(span => span.start < 0 || span.start + span.frames > buffer.length)) throw new Error('Audio edit exceeds rendered simulation coverage.');
      const frames = spans.reduce((sum, span) => sum + span.frames, 0), channels = buffer.numberOfChannels;
      const bytes = new ArrayBuffer(44 + frames * channels * 2), view = new DataView(bytes);
      const word = (at, value) => [...value].forEach((letter, i) => view.setUint8(at + i, letter.charCodeAt(0)));
      word(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); word(8, 'WAVE'); word(12, 'fmt ');
      view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
      view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * channels * 2, true);
      view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); word(36, 'data'); view.setUint32(40, bytes.byteLength - 44, true);
      const data = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
      let peak = 0, squares = 0;
      let outputFrame = 0;
      for (const span of spans) for (let frame = 0; frame < span.frames; frame++, outputFrame++) for (let channel = 0; channel < channels; channel++) {
        // Four-millisecond edge fades prevent audio clicks at editorial cuts.
        const envelope = Math.min(1, frame / (sampleRate * .004), (span.frames - 1 - frame) / (sampleRate * .004));
        const value = Math.max(-1, Math.min(1, data[channel][span.start + frame])) * envelope; peak = Math.max(peak, Math.abs(value)); squares += value * value;
        view.setInt16(44 + (outputFrame * channels + channel) * 2, Math.round(value * 32767), true);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); });
      return { base64, frames, sampleRate, channels, peak, rms: Math.sqrt(squares / (frames * channels)), spans, graphCount: audioContexts.length, source: 'Original game oscillator/noise/filter/effect graph rendered by OfflineAudioContext at recorded simulation timestamps; same editorial spans as video.' };
    },
  };
}

export async function freezeClock(page) { return page.evaluate(() => window.__fixedCapture.freeze()); }
export async function stepClock(page, deltaSeconds = 1 / 30) { return page.evaluate(delta => window.__fixedCapture.step(delta), deltaSeconds); }

export async function setKeyboard(page, held, wanted) {
  const target = new Set(wanted);
  for (const key of held) if (!target.has(key)) await page.keyboard.up(key);
  for (const key of target) if (!held.has(key)) await page.keyboard.down(key);
  return target;
}
