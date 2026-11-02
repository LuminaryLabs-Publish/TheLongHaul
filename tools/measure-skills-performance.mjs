import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot, argValue, saveJson, digest, loadBrowser, preparePage, beginRun, steeringCommand } from './validate-gameplay.mjs';
import { summarize } from '../src/game/performance-stats.mjs';

// Real-time measurement of the shipped app. This tool never installs the
// capture clock, changes physics, teleports the truck or substitutes assets.
// --root can serve a clean git-archive baseline while this tool stays current.
const numberOption = (name, fallback, low, high) => {
  const value = Number(argValue(name, String(fallback)));
  assert.ok(Number.isFinite(value) && value >= low && value <= high, `${name} must be between ${low} and ${high}.`);
  return value;
};

async function sourceAt(root, revisionHint) {
  const files = [];
  async function walk(relative) {
    for (const entry of (await readdir(path.join(root, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) files.push(name);
    }
  }
  await walk('src'); await walk('vendor');
  files.push('index.html', 'campaign.html', 'styles.css');
  const hashes = {};
  for (const file of files.sort()) hashes[file] = digest(await readFile(path.join(root, file)));
  let revision = null, dirty = null;
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    // An archive inside .cache can otherwise inherit the enclosing worktree's
    // HEAD and incorrectly present that as its own source identity.
    if (path.resolve(git('rev-parse', '--show-toplevel')) === root) {
      revision = git('rev-parse', 'HEAD'); dirty = git('status', '--short');
    }
  } catch { /* A plain archived tree is a valid measurement target. */ }
  let revisionHintMatchesRuntime = null;
  if (!revision && revisionHint) {
    assert.match(revisionHint, /^[a-f0-9]{7,40}$/i, '--revision must be a commit hash.');
    const expected = execFileSync('git', ['show', `${revisionHint}:vendor/app-runtime.js`], { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
    revisionHintMatchesRuntime = digest(expected) === hashes['vendor/app-runtime.js'];
    assert.ok(revisionHintMatchesRuntime, 'The archived runtime must match its declared baseline revision.');
  }
  return { root, revision, revisionHint: revisionHint || null, revisionHintMatchesRuntime, dirty, hashes, aggregate: digest(JSON.stringify(Object.entries(hashes).sort())) };
}

async function serveRoot(root) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };
  const requests = [];
  const server = createServer(async (request, response) => {
    try {
      const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = path.resolve(root, '.' + (name.endsWith('/') ? name + 'index.html' : name));
      if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
      const bytes = await readFile(file);
      requests.push({ path: name, status: 200, bytes: bytes.length });
      response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(bytes);
    } catch { requests.push({ path: request.url, status: 404 }); response.writeHead(404).end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}/`, requests, close: () => new Promise(resolve => server.close(resolve)) };
}

async function installProbe(page) {
  return page.evaluate(() => {
    if (window.__fixedCapture) throw Error('Performance measurement requires the native browser clock.');
    if (!window.LongHaulPerformance || typeof performanceStats === 'undefined') throw Error('The application performance instrumentation is unavailable.');
    const probe = { active: false, frameCpu: [], frames: 0, startedAt: 0, endedAt: 0, startedRunTime: 0 };
    window.__skillsPerformanceProbe = probe;
    const begin = performanceStats.begin, end = performanceStats.end;
    let frameStart = null;
    performanceStats.begin = function(...args) {
      frameStart = probe.active ? performance.now() : null;
      return begin.apply(this, args);
    };
    performanceStats.end = function(...args) {
      const result = end.apply(this, args);
      if (probe.active && frameStart !== null) {
        probe.frameCpu[probe.frames % 1800] = performance.now() - frameStart;
        probe.frames++;
      }
      frameStart = null;
      return result;
    };
    // Existing phase reports omit these host calls. Time their unmodified
    // argument/return path with the same product instrumentation as other work.
    if (typeof updateSkillGameplay === 'function') {
      const previous = updateSkillGameplay;
      updateSkillGameplay = function(...args) { return performanceStats.measure('skillsGameplay', () => previous.apply(this, args)); };
    }
    if (typeof updateArcadeRules === 'function') {
      const previous = updateArcadeRules;
      updateArcadeRules = function(...args) { return performanceStats.measure('arcadeRules', () => previous.apply(this, args)); };
    }
    const gl = renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      abilitiesSupported: typeof activeAbilities !== 'undefined',
      recoveryKey: typeof LONG_HAUL_BINDINGS !== 'undefined' ? 'f' : 'e',
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      glVersion: gl.getParameter(gl.VERSION), canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight],
      quality: settings.quality, nativeClock: !window.__fixedCapture,
    };
  });
}

async function retainedState(page, detailed = false) {
  return page.evaluate(detailed => {
    const truck = readTruck(), run = readRun();
    const abilities = typeof activeAbilities !== 'undefined' ? activeAbilities.snapshot() : null;
    const pickups = typeof drivingPickups !== 'undefined' ? drivingPickups.snapshot() : null;
    let objects = null;
    if (detailed) { objects = 0; scene.traverse(() => { objects++; }); }
    return {
      scene: currentScene(), failed: frameFailed, runTime: run.rawTime, distance: run.distance,
      speed: truck.speed, position: truck.position, cargoMass: truck.cargoMass ?? 0, recoveryCount: run.recoveryCount,
      drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs?.length ?? null,
      heapUsed: performance.memory?.usedJSHeapSize ?? null, heapTotal: performance.memory?.totalJSHeapSize ?? null,
      retained: {
        objects, cells: cellHosts.size, horizonCells: horizonHosts.size, roadEdges: course?.edges?.length ?? 0,
        traffic: arcadeVehicles.filter(value => value.active).length, encounters: arcadeEncounterHosts.size,
        brokenProps: arcadeBrokenProps.size, usedRamps: arcadeUsedRamps.size,
        freightStations: typeof freightStationHosts !== 'undefined' ? freightStationHosts.size : null,
        freightLabels: typeof freightLabelAssets !== 'undefined' ? freightLabelAssets.size : null,
        pickupMeshes: typeof pickupHosts !== 'undefined' ? pickupHosts.size : 0,
        pickupReceipts: pickups?.collected ?? 0, retiredPickupsThrough: pickups?.retiredThrough ?? null,
        miniTrucks: abilities?.miniTrucks.length ?? 0, pulses: abilities?.pulses.length ?? 0,
        abilityHitReceipts: abilities?.recentHits ?? 0,
        skillReceipts: detailed && typeof skillProgression !== 'undefined' ? skillProgression.snapshot().seenIds.length : null,
      },
      abilities: abilities ? { activations: abilities.activations, hits: abilities.hits, expired: abilities.expired, cooldowns: abilities.cooldowns, shield: abilities.shield } : null,
      diagnostics: detailed ? engine.n.coreWorld.getDiagnostics(HORIZON_WORLD_ID).filter(value => value.severity === 'error') : [],
    };
  }, detailed);
}

const metrics = async cdp => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(value => [value.name, value.value]));
function difference(before, after) {
  return Object.fromEntries(['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount'].map(key => [key, (after[key] ?? 0) - (before[key] ?? 0)]));
}

function comparisonWith(baseline, report) {
  const configurationKeys = ['seed', 'viewport', 'deviceScaleFactor', 'quality', 'warmupSeconds', 'phaseSeconds', 'inputPollMs'];
  const sameConfiguration = configurationKeys.every(key => JSON.stringify(baseline.conditions?.[key]) === JSON.stringify(report.conditions[key]));
  const phases = [], investigate = [];
  const ratio = (before, after) => before > 0 ? after / before : null;
  for (const current of report.phases) {
    const before = baseline.phases?.find(value => value.name === current.name);
    if (!before) continue;
    const timings = {};
    for (const name of ['frameCpu', ...new Set([...Object.keys(before.performance.phases), ...Object.keys(current.performance.phases)])]) {
      const a = name === 'frameCpu' ? before.frameCpu : before.performance.phases[name];
      const b = name === 'frameCpu' ? current.frameCpu : current.performance.phases[name];
      timings[name] = { baseline: a ?? null, current: b ?? null, p50Ratio: a && b ? ratio(a.p50, b.p50) : null, p95Ratio: a && b ? ratio(a.p95, b.p95) : null };
      if (a && b && b.p95 > a.p95 * 1.2 && b.p95 - a.p95 > (name === 'interval' ? 4 : 2)) investigate.push({ phase: current.name, metric: name, baselineP95: a.p95, currentP95: b.p95 });
    }
    phases.push({ name: current.name, timings, baselineResources: before.end, currentResources: current.end,
      abilitiesBaseline: before.abilitiesSupported, abilitiesCurrent: current.abilitiesSupported,
      simulationSeconds: { baseline: before.simulatedSeconds, current: current.simulatedSeconds } });
  }
  return { sameConfiguration, baselineSource: baseline.source, baselineRuntime: baseline.runtime, phases, investigate,
    interpretation: 'Real-time software-WebGL comparison. Gameplay positions and simulated seconds may differ with measured frame pacing. Ability phase adds real powers only on builds that support them. Deltas identify work to investigate; they do not isolate causality or certify physical hardware.' };
}

export async function measureSkillsPerformance() {
  const root = path.resolve(argValue('--root', projectRoot)), seed = argValue('--seed', 'haul-1nwc3cl-12goa01');
  const phaseSeconds = numberOption('--seconds', 20, 3, 120), warmupSeconds = numberOption('--warmup', 5, 0, 30);
  const inputPollMs = numberOption('--poll-ms', 125, 50, 500), label = argValue('--label', root === projectRoot ? 'current' : 'baseline');
  const output = path.resolve(argValue('--output', path.join(projectRoot, '.cache/validation', `skills-performance-${label}-${new Date().toISOString().replace(/[:.]/g, '-')}`)));
  await mkdir(path.dirname(output), { recursive: true }); await mkdir(output, { recursive: false });
  const report = { schema: 'long-haul.skills-performance/1', label, startedAt: new Date().toISOString(), source: await sourceAt(root, argValue('--revision', null)),
    toolSha256: digest(await readFile(fileURLToPath(import.meta.url))),
    conditions: { seed, viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, quality: false, warmupSeconds, phaseSeconds, inputPollMs,
      clock: 'Native requestAnimationFrame and performance.now; wall-clock phase duration; no fixed capture clock',
      instrumentation: 'Existing LongHaulPerformance phases; transparent begin/end timestamps for total processed-frame CPU, plus skillsGameplay and arcadeRules call timing; one resource sample every two seconds; CDP metrics at phase boundaries.',
      inputs: 'Normal Playwright W/A/D/S keyboard events following the existing generated road. Q/E during the second phase when abilities exist; existing recovery key when tipped. No truck state fixtures or scene/physics replacement.' },
    phases: [], inputs: [], startup: {}, runtime: null, surface: null, failure: null, comparison: null,
    units: { timings: 'milliseconds', heap: 'bytes', cdpDurations: 'seconds', frameRate: 'processed application frames per wall-clock second' },
    boundary: 'SwiftShader software WebGL in this environment. This is actual real-time browser CPU/frame evidence, not target-hardware GPU performance or human handling assessment.' };
  let server, browser, context, page, observation, cdp, cleaned = false;
  const held = new Set(); let lastThrottleDown = -Infinity, lastRecovery = -Infinity, lastAbilityPress = -Infinity;
  async function keyboard(wanted, phase, elapsed) {
    const next = new Set(wanted);
    if (next.has('w') && !held.has('w') && Date.now() - lastThrottleDown < 360) next.delete('w');
    for (const key of held) if (!next.has(key)) { await page.keyboard.up(key); report.inputs.push({ phase, elapsed, action: 'up', key }); held.delete(key); }
    for (const key of next) if (!held.has(key)) { await page.keyboard.down(key); report.inputs.push({ phase, elapsed, action: 'down', key }); held.add(key); if (key === 'w') lastThrottleDown = Date.now(); }
  }
  async function drive(seconds, name, abilities, samples = null) {
    const started = Date.now(); let nextSample = 0, nextProgress = 10;
    while (Date.now() - started < seconds * 1000) {
      const elapsed = (Date.now() - started) / 1000;
      const command = await steeringCommand(page, elapsed, { boost: false, weave: false, aimRamps: false, targetLane: -3.5 });
      assert.equal(command.scene, 'driving', `The ${name} phase must remain in active driving.`);
      await keyboard(command.keys, name, elapsed);
      if (command.tipped && Date.now() - lastRecovery > 2500) {
        await page.keyboard.press(report.surface.recoveryKey); lastRecovery = Date.now();
        report.inputs.push({ phase: name, elapsed, action: 'press', key: report.surface.recoveryKey, reason: 'Observed tipped truck' });
      }
      if (abilities && report.surface.abilitiesSupported && Date.now() - lastAbilityPress > 2000) {
        const ready = await page.evaluate(() => { const state = activeAbilities.snapshot(); return ['q', 'e'].filter(slot => state.cooldowns[state.slots[slot]] <= 0); });
        for (const key of ready) { await page.keyboard.press(key); report.inputs.push({ phase: name, elapsed, action: 'press', key, reason: 'Ready equipped ability' }); }
        lastAbilityPress = Date.now();
      }
      if (samples && elapsed >= nextSample) {
        const state = await retainedState(page); samples.push({ elapsed, ...state });
        assert.equal(state.failed, false, 'The real application frame must not fail.');
        nextSample += 2;
      }
      if (elapsed >= nextProgress) { console.log(JSON.stringify({ label, phase: name, elapsed: Math.round(elapsed), distance: Math.round(command.distance), speed: Math.round(command.speed) })); nextProgress += 10; }
      await page.waitForTimeout(inputPollMs);
    }
  }
  try {
    server = await serveRoot(root);
    let started = Date.now(); const loaded = await loadBrowser(); browser = loaded.browser; report.runtime = loaded.runtime; report.startup.browserLaunchMs = Date.now() - started;
    context = await browser.newContext({ viewport: report.conditions.viewport, deviceScaleFactor: 1 });
    observation = await preparePage(context, server.url, { seed, quality: false, returning: true }); page = observation.page;
    report.startup.bootMs = observation.bootMs; started = Date.now(); await beginRun(page);
    await page.waitForFunction(() => currentScene() === 'driving' && !launchIntro.active && readRun().status === 'running', null, { timeout: 45000 });
    report.startup.generationAndIntroMs = Date.now() - started;
    report.surface = await installProbe(page); assert.equal(report.surface.quality, false); assert.equal(report.surface.nativeClock, true);
    cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
    await drive(warmupSeconds, 'warmup', false);
    for (const [name, abilities] of [['cruise', false], ['ability-input', true]]) {
      const phase = { name, abilitiesSupported: report.surface.abilitiesSupported, requestedAbilities: abilities, start: await retainedState(page, true), samples: [] };
      const beforeMetrics = await metrics(cdp);
      await page.evaluate(() => { LongHaulPerformance.reset(); const probe = window.__skillsPerformanceProbe; probe.frameCpu = []; probe.frames = 0; probe.active = true; probe.startedAt = performance.now(); probe.startedRunTime = readRun().rawTime; });
      await drive(phaseSeconds, name, abilities, phase.samples);
      const measured = await page.evaluate(() => { const probe = window.__skillsPerformanceProbe; probe.active = false; probe.endedAt = performance.now(); return { performance: LongHaulPerformance.getState(), frameCpu: probe.frameCpu, frames: probe.frames, elapsedMs: probe.endedAt - probe.startedAt, simulatedSeconds: readRun().rawTime - probe.startedRunTime }; });
      const afterMetrics = await metrics(cdp);
      phase.end = await retainedState(page, true); phase.elapsedMs = measured.elapsedMs; phase.frames = measured.frames;
      phase.simulatedSeconds = measured.simulatedSeconds; phase.framesPerWallSecond = measured.frames / (measured.elapsedMs / 1000);
      phase.frameCpu = summarize(measured.frameCpu); phase.rawFrameCpuMs = measured.frameCpu; phase.performance = measured.performance;
      phase.cdp = { before: beforeMetrics, after: afterMetrics, delta: difference(beforeMetrics, afterMetrics) };
      const resources = [phase.start, ...phase.samples, phase.end];
      phase.resourceSummary = Object.fromEntries(['drawCalls', 'triangles', 'geometries', 'textures', 'programs', 'heapUsed', 'heapTotal'].map(key => [key, summarize(resources.map(value => value[key]).filter(Number.isFinite))]));
      phase.abilityActivations = (phase.end.abilities?.activations ?? 0) - (phase.start.abilities?.activations ?? 0);
      assert.ok(phase.frames > 0 && phase.performance.phases.interval?.samples > 0, 'Native gameplay must produce measured frames.');
      assert.equal(phase.end.failed, false); assert.equal(phase.end.scene, 'driving');
      if (abilities && phase.abilitiesSupported) assert.ok(phase.abilityActivations > 0, 'The ability phase must activate a real equipped ability through keyboard input.');
      report.phases.push(phase); await saveJson(path.join(output, 'progress.json'), report);
      console.log(JSON.stringify({ label, phase: name, frames: phase.frames, frameCpuP50: phase.frameCpu.p50, frameCpuP95: phase.frameCpu.p95, intervalP95: phase.performance.phases.interval.p95, drawCalls: phase.end.drawCalls, geometries: phase.end.geometries }));
    }
    await keyboard([], 'finish', 0); await page.screenshot({ path: path.join(output, 'gameplay.png') });
    const baseline = argValue('--compare', null);
    if (baseline) report.comparison = comparisonWith(JSON.parse(await readFile(path.resolve(baseline), 'utf8')), report);
  } catch (error) { report.failure = { message: String(error?.message ?? error), stack: String(error?.stack ?? '') }; }
  finally {
    if (page && !page.isClosed()) { for (const key of held) await page.keyboard.up(key).catch(() => {}); }
    const cleanupErrors = [];
    for (const close of [() => context?.close(), () => browser?.close(), () => server?.close()]) {
      try { await close(); } catch (error) { cleanupErrors.push(String(error)); }
    }
    cleaned = cleanupErrors.length === 0;
    if (!cleaned) report.cleanupErrors = cleanupErrors;
  }
  report.completedAt = new Date().toISOString(); report.cleanupCompleted = cleaned;
  report.console = observation?.consoleLog ?? []; report.networkFailures = observation?.networkFailures ?? []; report.requests = server?.requests ?? [];
  report.fatalErrors = report.console.filter(value => value.type === 'pageerror' || value.type === 'error' && !/favicon|404/.test(value.text));
  report.verdict = !report.failure && !report.fatalErrors.length && report.phases.length === 2 ? 'measured' : report.runtime ? 'failed' : 'blocked';
  await saveJson(path.join(output, 'performance-report.json'), report);
  console.log(JSON.stringify({ verdict: report.verdict, output, failure: report.failure, investigate: report.comparison?.investigate ?? [] }));
  if (report.verdict !== 'measured') process.exitCode = 1;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await measureSkillsPerformance();
