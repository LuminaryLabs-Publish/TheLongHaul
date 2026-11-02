import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash, X509Certificate } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const argValue = (name, fallback) => process.argv.find(value => value.startsWith(name + '='))?.slice(name.length + 1) ?? fallback;
export const saveJson = async (target, value) => writeFile(target, JSON.stringify(value, null, 2) + '\n');
export const exists = async target => access(target).then(() => true, () => false);
export const git = (...args) => execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' }).trim();
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');

export async function sourceIdentity() {
  const files = git('ls-files', 'src', 'vendor', 'index.html', 'campaign.html', 'styles.css').split('\n').filter(Boolean);
  const hashes = {};
  for (const file of files) hashes[file] = digest(await readFile(path.join(projectRoot, file)));
  // New application modules also belong to the exact working-tree identity.
  for (const file of git('ls-files', '--others', '--exclude-standard', 'src').split('\n').filter(Boolean)) hashes[file] = digest(await readFile(path.join(projectRoot, file)));
  return { root: projectRoot, remote: git('remote', 'get-url', 'origin'), branch: git('branch', '--show-current'), revision: git('rev-parse', 'HEAD'), dirty: git('status', '--short'), hashes, aggregate: digest(JSON.stringify(Object.entries(hashes).sort())) };
}

export async function serveProject() {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };
  const requests = [];
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const target = path.resolve(projectRoot, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      if (!target.startsWith(projectRoot + path.sep)) { response.writeHead(403).end(); return; }
      const bytes = await readFile(target);
      requests.push({ path: pathname, status: 200, bytes: bytes.length });
      response.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(bytes);
    } catch { requests.push({ path: request.url, status: 404 }); response.writeHead(404).end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}/`, requests, close: () => new Promise(resolve => server.close(resolve)) };
}

export async function loadBrowser() {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(projectRoot, '.cache/playwright');
  // Chromium creates Unix sockets below TMPDIR; keep this task-local path short.
  const browserTemporaryDirectory = path.join(projectRoot, '.cache/t');
  await mkdir(browserTemporaryDirectory, { recursive: true });
  process.env.TMPDIR = browserTemporaryDirectory;
  const candidates = [process.env.LONG_HAUL_PLAYWRIGHT, path.join(projectRoot, 'node_modules/playwright/index.mjs'), process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES && path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright/index.mjs'), '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'].filter(Boolean);
  let playwright;
  for (const candidate of candidates) if (await exists(candidate)) { playwright = await import(pathToFileURL(candidate)); break; }
  if (!playwright) throw new Error('Playwright is unavailable; install the project development dependencies.');
  const executables = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, path.join(projectRoot, '.cache/browser/chrome-linux64/chrome'), playwright.chromium.executablePath()].filter(Boolean);
  let executable;
  for (const value of executables) if (await exists(value)) { executable = value; break; }
  if (!executable) throw new Error('No task-local Chromium executable is available. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE.');
  const directory = path.dirname(executable), libraries = {};
  for (const name of ['libEGL.so', 'libGLESv2.so', 'libvk_swiftshader.so', 'vk_swiftshader_icd.json']) libraries[name] = await exists(path.join(directory, name));
  const certificateTrust = [];
  // Opt in only to the sandbox's installed public proxy CA keys. No blanket TLS
  // bypass or application/network substitution is used for geographic routes.
  for (const file of (process.env.LONG_HAUL_SANDBOX_CA_FILES || '').split(path.delimiter).filter(Boolean)) {
    const certificate = new X509Certificate(await readFile(file));
    certificateTrust.push({ file, fingerprint256: certificate.fingerprint256, spki: createHash('sha256').update(certificate.publicKey.export({ type: 'spki', format: 'der' })).digest('base64') });
  }
  const args = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'];
  if (certificateTrust.length) args.push('--ignore-certificate-errors-spki-list=' + certificateTrust.map(value => value.spki).join(','));
  const browser = await playwright.chromium.launch({ executablePath: executable, headless: true, args });
  return { browser, runtime: { node: process.version, executable, browserVersion: browser.version(), libraries, backend: 'SwiftShader software WebGL', certificateTrust } };
}

export async function preparePage(context, url, { seed = 'haul-1nwc3cl-12goa01', quality = false, returning = false } = {}) {
  const page = await context.newPage(), consoleLog = [], networkFailures = [];
  page.on('console', message => consoleLog.push({ type: message.type(), text: message.text(), at: new Date().toISOString() }));
  page.on('pageerror', error => consoleLog.push({ type: 'pageerror', text: String(error), at: new Date().toISOString() }));
  page.on('requestfailed', request => networkFailures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) networkFailures.push({ url: response.url(), status: response.status() }); });
  await page.addInitScript(({ quality, returning }) => {
    sessionStorage.setItem('long-haul-intro-credits-seen-v1', '1');
    localStorage.setItem('the-long-haul-settings-v2', JSON.stringify({ sound: true, steering: 100, quality, motion: true }));
    if (returning) localStorage.setItem('longhaul-launch-seen-v1', '1');
  }, { quality, returning });
  const started = Date.now();
  await page.goto(url + 'index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__longHaulBooted || document.querySelector('#boot-failure')?.classList.contains('show'), null, { timeout: 45000 });
  assert.equal(await page.locator('#boot-failure').evaluate(node => node.classList.contains('show')), false, 'The actual game must boot without its failure panel.');
  await page.evaluate(seed => { newSeed = () => seed; }, seed);
  return { page, consoleLog, networkFailures, bootMs: Date.now() - started, seed };
}

export async function beginRun(page) {
  await page.locator('#start-btn').click();
  await page.waitForFunction(() => currentScene() === 'dispatch');
  await page.locator('#dispatch-go-btn').click();
  await page.waitForFunction(() => generation?.ready || generation?.error, null, { timeout: 120000 });
  assert.equal(await page.evaluate(() => generation?.error ? String(generation.error) : null), null, 'Course generation must complete.');
}

export async function gameSnapshot(page) {
  return page.evaluate(() => ({ ...JSON.parse(render_game_to_text()), runDetails: structuredClone(readRun()), truckDetails: structuredClone(readTruck()), intro: { ...launchIntro }, risk: arcadeScore.snapshot(), eventHistory: structuredClone(arcadeEventHistory), weather: { elapsed: arcadeWeatherTime, amount: arcadeWeatherAmount, rainVisible: rainMesh.visible, grip: course ? surfaceAt(readTruck().position).grip : null }, remainingTime: meters.get('remaining-time')?.value, camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov }, garage: { visible: !arcadeGaragePanel.hidden, stops: arcadeGarageStops.length }, delivery: structuredClone(readDelivery()), save: arcadeUpgradeState(), performance: LongHaulPerformance.getState(), frameFailed, prompt: course ? interactionPrompt() : '' }));
}

export async function layoutEvidence(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('#game-stage'), canvas = document.querySelector('#game-canvas');
    const rect = node => { const value = node.getBoundingClientRect(); return { x: value.x, y: value.y, width: value.width, height: value.height, right: value.right, bottom: value.bottom }; };
    return { viewport: { width: innerWidth, height: innerHeight }, stage: rect(stage), canvas: rect(canvas), stageScroll: { x: stage.scrollLeft, y: stage.scrollTop }, hud: ['#condition-box', '#timer-box', '#risk-hud', '#drive-box', '#run-box'].map(selector => ({ selector, ...rect(document.querySelector(selector)) })) };
  });
}

export async function webglEvidence(page) {
  return page.evaluate(() => {
    renderer.render(scene, camera);
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), width = gl.drawingBufferWidth, height = gl.drawingBufferHeight, pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let minimum = 255, maximum = 0, nonBlack = 0, count = 0; const colors = new Set();
    for (let i = 0; i < pixels.length; i += 4 * 137) { const value = Math.round((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3); minimum = Math.min(minimum, value); maximum = Math.max(maximum, value); if (value > 8) nonBlack++; count++; colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`); }
    return { available: Boolean(gl), lost: gl.isContextLost(), renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR), version: gl.getParameter(gl.VERSION), width, height, canvasCount: document.querySelectorAll('canvas').length, pixels: { minimum, maximum, distinctColors: colors.size, nonBlackFraction: nonBlack / count }, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
  });
}

export async function steeringCommand(page, elapsed, { boost = true, weave = false, aimRamps = true, targetLane = null } = {}) {
  return page.evaluate(({ elapsed, boost, weave, aimRamps, targetLane }) => {
    const state = readTruck(), road = course && nearestRoad(course, state.position);
    if (currentScene() !== 'driving' || !road) return { keys: [], scene: currentScene(), tipped: state.tipped };
    const direction = Math.cos(state.heading - road.heading) >= 0 ? 1 : -1, data = arcadeEdgeData(road.edge);
    const segment = road.edge.samples[road.segmentIndex + 1], start = road.edge.samples[road.segmentIndex];
    const along = data.cumulative[road.segmentIndex] + road.t * Math.hypot(segment.x - start.x, segment.z - start.z);
    let lane = targetLane ?? -direction * Math.min((Number(road.edge.width) || 17) * .26, 4.8) + (weave ? Math.sin(elapsed * .38) * 1.1 : 0);
    const ahead = Math.min(data.total - .01, Math.max(.01, along + direction * (13 + Math.abs(state.speed) * .7)));
    let point = arcadeEdgePosition(road.edge, ahead, lane), encounter = null;
    const progress = arcadeNetwork && arcadeRoadProgress(road, arcadeNetwork);
    if (progress && direction > 0) {
      encounter = arcadeEncounters.filter(value => value.path === progress.path && value.distance - progress.distance > -35 && value.distance - progress.distance < 150).sort((a, b) => a.distance - b.distance)[0];
      if (encounter && targetLane === null) {
        if (encounter.kind === 'ramp' && aimRamps || encounter.kind === 'breakables') lane = encounter.lane;
        else if (encounter.kind === 'roadblock') lane = encounter.safeLane;
        point = arcadePathPoint(progress.path, Math.min(progress.path.length, progress.distance + 13 + Math.abs(state.speed) * .65), lane);
      }
      const look = 13 + Math.abs(state.speed) * .7;
      if (data.total - along < look) {
        const destination = course.depots.find(value => value.id === course.validDepotId);
        const next = course.edges.filter(value => value.from === road.edge.to && value.type !== 'roundabout').sort((a, b) => Number(b.branchId === destination?.branchId || b.branchId === 'trunk') - Number(a.branchId === destination?.branchId || a.branchId === 'trunk'))[0];
        if (next) point = arcadeEdgePosition(next, Math.min(arcadeEdgeData(next).total, Math.max(2, look - (data.total - along))), lane);
      }
    }
    const heading = point ? Math.atan2(point.x - state.position.x, point.z - state.position.z) : road.heading + (direction < 0 ? Math.PI : 0);
    const error = Math.atan2(Math.sin(heading - state.heading), Math.cos(heading - state.heading));
    const wanted = ['w']; if (error > .035) wanted.push('a'); if (error < -.035) wanted.push('d');
    if (boost && elapsed % 14 > 7 && elapsed % 14 < 9 && Math.abs(error) < .12) wanted.push('Shift');
    if (Math.abs(error) > .68 && Math.abs(state.speed) > 17) { wanted.splice(0, 1); wanted.push('s'); }
    return { keys: wanted, scene: currentScene(), tipped: state.tipped, speed: state.speed, error, road: road.edge.id, encounter: encounter ? { kind: encounter.kind, id: encounter.id } : null, distance: readRun().distance, position: { ...state.position } };
  }, { elapsed, boost, weave, aimRamps, targetLane });
}

export async function driveWithKeyboard(page, seconds, { boost = true, weave = false, aimRamps = true, targetLane = null, onSample = null } = {}) {
  let held = new Set(); const start = Date.now(), samples = []; let nextSample = 0, lastRecovery = -Infinity;
  while ((Date.now() - start) / 1000 < seconds) {
    const elapsed = (Date.now() - start) / 1000, command = await steeringCommand(page, elapsed, { boost, weave, aimRamps, targetLane }), wanted = new Set(command.keys);
    for (const key of held) if (!wanted.has(key)) await page.keyboard.up(key);
    for (const key of wanted) if (!held.has(key)) await page.keyboard.down(key);
    held = wanted;
    if (command.tipped && elapsed - lastRecovery > 3) { await page.keyboard.press('e'); lastRecovery = elapsed; }
    if (elapsed >= nextSample) { const snapshot = await gameSnapshot(page); const sample = { elapsed, command, snapshot }; samples.push(sample); if (onSample) await onSample(sample); nextSample += 2; }
    if (['loss', 'results'].includes(command.scene)) break;
    await page.waitForTimeout(100);
  }
  for (const key of held) await page.keyboard.up(key);
  return samples;
}

async function validate() {
  const generatedId = 'gameplay-' + new Date().toISOString().replace(/[:.]/g, '-'), output = path.resolve(argValue('--output', path.join(projectRoot, '.cache/validation', generatedId))), runId = path.basename(output);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output, { recursive: false });
  const startedAt = new Date().toISOString(), source = await sourceIdentity(), requested = { mode: 'local', target: projectRoot, revision: source.revision, expectedSurface: 'mixed', expectedState: 'Playable cinematic, responsive driving, score and encounter feedback, recovery, garage, delivery, progression, and next run.', interaction: 'Actual browser clicks and keys; isolated endpoint fixtures use the real game services.' };
  const decisions = [{ at: startedAt, stage: 'inspect', kind: 'fact', statement: 'Validate this local working tree, including source hashes; no live deployment substitution.', basis: source, effect: 'none' }, { at: startedAt, stage: 'route', kind: 'decision', statement: 'The application requires DOM menus, CanvasTexture and arbitrary GLSL; use sandbox-record-browser-it plus webgl-render-sandbox-it with the real browser page.', basis: 'Source inspected and render-3d-sandbox-it browser-dependent boundary.', effect: 'route-change' }];
  await saveJson(path.join(output, 'target-lock.json'), { runId, requested, source });
  await saveJson(path.join(output, 'decision-log.json'), decisions);
  let server, browser, page, observations, runtime, failure = null, cleaned = false; const checks = [], interactions = [];
  const check = (name, value, evidence) => { checks.push({ name, passed: Boolean(value), evidence }); assert.ok(value, name); console.log(JSON.stringify({ check: name, passed: true })); };
  const fixture = async (description, action) => { interactions.push({ boundary: 'Isolated endpoint fixture through actual game service', description, at: new Date().toISOString() }); return page.evaluate(action); };
  try {
    server = await serveProject(); ({ browser, runtime } = await loadBrowser());
    if (runtime.certificateTrust.length) decisions.push({ at: new Date().toISOString(), stage: 'environment', kind: 'fact', statement: 'The sandbox Chromium did not initially trust its environment proxy CA and the real Campaign route correctly stayed unavailable. This run opts into only the installed public CA SPKI keys; OSRM/CDN responses remain live and unmodified.', basis: { priorRun: 'gameplay-2026-11-02T09-07-20-375Z', observedError: 'net::ERR_CERT_AUTHORITY_INVALID', certificates: runtime.certificateTrust }, effect: 'environment-repair' });
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    observations = await preparePage(context, server.url); page = observations.page;
    await page.screenshot({ path: path.join(output, 'before.png') });
    await beginRun(page); interactions.push({ action: 'Click Endless, select Standard contract, click Drive', boundary: 'Browser DOM and keyboard' });
    const entry = await gameSnapshot(page);
    check('First-run cinematic uses the actual scene', entry.intro.active && entry.intro.duration === 2.4, entry.intro);
    await page.waitForTimeout(300); const cinematicMotion = await gameSnapshot(page);
    check('Cinematic animates the camera without consuming the run', cinematicMotion.intro.active && cinematicMotion.runDetails.rawTime === entry.runDetails.rawTime && cinematicMotion.remainingTime === entry.remainingTime && JSON.stringify(cinematicMotion.player.position) === JSON.stringify(entry.player.position) && cinematicMotion.camera.position.some((value, i) => Math.abs(value - entry.camera.position[i]) > .05), { before: entry, after: cinematicMotion });
    await page.screenshot({ path: path.join(output, 'cinematic.png') });
    await page.locator('#launch-skip').click();
    await page.waitForFunction(() => currentScene() === 'driving' && !launchIntro.active && readRun().status === 'running', null, { timeout: 20000 });
    check('DRIVE NOW immediately hands control to the active run', (await gameSnapshot(page)).eventHistory.some(event => event.type === 'cinematic-finish' && event.skipped), entry);
    const launchLayout = await layoutEvidence(page);
    check('Fresh 1280x720 launch keeps the stage unscrolled and every essential HUD visible', launchLayout.stageScroll.x === 0 && launchLayout.stageScroll.y === 0 && Math.abs(launchLayout.canvas.x - launchLayout.stage.x) < 1 && Math.abs(launchLayout.canvas.y - launchLayout.stage.y) < 1 && launchLayout.hud.every(box => box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0 && box.right <= 1281 && box.bottom <= 721), launchLayout);
    const gl = await webglEvidence(page); await saveJson(path.join(output, 'webgl-render-report.json'), gl);
    check('Real software WebGL renders non-empty gameplay', gl.available && !gl.lost && /swiftshader/i.test(gl.renderer) && gl.pixels.distinctColors > 40 && gl.triangles > 0, gl);
    const start = await gameSnapshot(page), movement = await driveWithKeyboard(page, 9, { boost: true });
    const driven = await gameSnapshot(page); await page.screenshot({ path: path.join(output, 'driving.png') });
    check('Keyboard throttle and steering move the actual truck', driven.runDetails.distance > start.runDetails.distance + 15 && !driven.frameFailed, { before: start.player, after: driven.player, movement });
    const planned = await page.evaluate(() => arcadeEncounters.map(event => ({ id: event.id, kind: event.kind, distance: event.distance, path: event.path.id, warningLead: event.warningLead, clearWidth: event.clearWidth })));
    check('Generated encounters include paced ramps, cargo, blocks and weaving', ['ramp', 'breakables', 'roadblock', 'weave'].every(kind => planned.some(event => event.kind === kind)) && planned.every(event => event.warningLead >= 150 && event.clearWidth >= 7), planned);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => currentScene() === 'paused');
    const paused = await gameSnapshot(page); await page.waitForTimeout(450); const stillPaused = await gameSnapshot(page);
    check('Pause freezes the run clock and vehicle', Math.abs(paused.runDetails.rawTime - stillPaused.runDetails.rawTime) < .01 && Math.abs(paused.player.position.x - stillPaused.player.position.x) < .01 && Math.abs(paused.player.position.z - stillPaused.player.position.z) < .01, { paused, stillPaused });
    await page.locator('#resume-btn').click(); await page.waitForFunction(() => currentScene() === 'driving');
    for (let n = 0; n < 4; n++) { await page.keyboard.press('Escape'); await page.waitForFunction(() => currentScene() === 'paused'); await page.locator('#resume-btn').click(); await page.waitForFunction(() => currentScene() === 'driving'); }
    check('Rapid pause and resume preserve a single healthy run', !(await gameSnapshot(page)).frameFailed && (await gameSnapshot(page)).runDetails.status === 'running');
    const transitionRun = await page.evaluate(() => runKey);
    await page.keyboard.press('w'); await page.keyboard.down('w'); await page.keyboard.down('Shift');
    await page.waitForFunction(() => forwardBoost.remaining > 0);
    await page.keyboard.press('m'); await page.waitForFunction(() => mapOpen);
    const mapHeld = await page.evaluate(() => ({ scene: currentScene(), keys: { ...keys }, intent: engine.n.coreInput.getIntent(), boost: forwardBoost.snapshot(), runKey }));
    check('Opening the map releases throttle and cancels rush into recharge', mapHeld.scene === 'driving' && !Object.values(mapHeld.keys).some(Boolean) && mapHeld.intent.throttle === 0 && !mapHeld.intent.boost && mapHeld.boost.remaining === 0 && mapHeld.boost.cooldown > 0, mapHeld);
    await page.keyboard.up('w'); await page.keyboard.up('Shift');
    await page.screenshot({ path: path.join(output, 'map.png') });
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !mapOpen && currentScene() === 'driving');
    for (let n = 0; n < 4; n++) { await page.keyboard.press('m'); await page.waitForFunction(() => mapOpen); await page.keyboard.press('Escape'); await page.waitForFunction(() => !mapOpen && currentScene() === 'driving'); }
    check('Rapid map entry and Escape return preserve the same healthy run', await page.evaluate(key => runKey === key && !frameFailed && readRun().status === 'running' && !Object.values(keys).some(Boolean), transitionRun));
    await page.keyboard.press('Escape'); await page.waitForFunction(() => currentScene() === 'paused' && readRun().status === 'paused', null, { timeout: 3000 });
    const settingsClock = await page.evaluate(() => readRun().rawTime);
    await page.locator('#pause-settings-btn').click(); await page.waitForFunction(() => currentScene() === 'settings');
    await page.waitForTimeout(200); await page.screenshot({ path: path.join(output, 'pause-settings.png') });
    const settingsState = await page.evaluate(() => ({ runKey, time: readRun().rawTime, keys: { ...keys } }));
    await page.locator('#settings-back-btn').click(); await page.waitForFunction(() => currentScene() === 'paused');
    await page.locator('#resume-btn').click(); await page.waitForFunction(() => currentScene() === 'driving' && readRun().status === 'running', null, { timeout: 3000 });
    const settingsResumed = await page.evaluate(() => ({ runKey, status: readRun().status, frameFailed, time: readRun().rawTime }));
    check('Pause Settings Back Resume keeps one frozen and resumable run', settingsState.runKey === transitionRun && settingsState.time === settingsClock && !Object.values(settingsState.keys).some(Boolean) && settingsResumed.runKey === transitionRun && !settingsResumed.frameFailed && settingsResumed.status === 'running', { before: { runKey: transitionRun, time: settingsClock }, during: settingsState, after: settingsResumed });
    await page.keyboard.press('Escape'); await page.waitForFunction(() => currentScene() === 'paused');
    for (const viewport of [{ width: 1365, height: 768 }, { width: 960, height: 540 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport); await page.screenshot({ path: path.join(output, `display-${viewport.width}x${viewport.height}.png`) });
      const bounds = await page.locator('#resume-btn').boundingBox(); check(`Pause action remains reachable at ${viewport.width}x${viewport.height}`, bounds && bounds.width > 30 && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, bounds);
    }
    await page.setViewportSize({ width: 1280, height: 720 }); await page.locator('#resume-btn').click(); await page.waitForFunction(() => currentScene() === 'driving');

    const trafficFixture = await fixture('Place one real traffic actor ahead on its route and the truck in an adjacent lane; actual movement must create the near miss.', () => {
      const path = arcadeNetwork.paths.find(value => value.id.startsWith('trunk:')) ?? arcadeNetwork.paths[0], point = arcadePathPoint(path, 100, -1.85), ground = groundSample(point), surface = surfaceAt(point);
      releaseDrivingInput(); forwardBoost.reset(); engine.n.longHaulTruck.teleport({ ...point, y: ground.height + readDynamics().suspension.travel, speed: 32, groundHeight: ground.height, groundNormal: ground.normal, surface: surface.surface, surfaceGrip: surface.grip });
      for (const vehicle of arcadeVehicles) vehicle.active = false;
      const vehicle = arcadeVehicles[0]; Object.assign(vehicle, { id: `traffic:${++arcadeTrafficSerial}`, path, progress: 129, direction: 1, speed: 12, lane: 1.85, hit: false, passed: false, minClearance: Infinity, nearSpeed: 0, active: true });
      return { id: vehicle.id, truckLane: -1.85, trafficLane: vehicle.lane, gap: 3.7 - (LONG_HAUL_TRUCK_COLLIDER.width + vehicle.collider.width) / 2 };
    });
    await driveWithKeyboard(page, 5, { boost: false, aimRamps: false, targetLane: -1.85 });
    const nearMiss = await gameSnapshot(page); await page.screenshot({ path: path.join(output, 'near-miss.png') });
    check('A real forward traffic overtake awards a bounded near miss', nearMiss.eventHistory.some(event => event.type === 'score-event' && event.kind === 'near-miss' && event.id === trafficFixture.id), { trafficFixture, risk: nearMiss.risk, events: nearMiss.eventHistory });

    const rampFixture = await fixture('Place truck 35 m before a real generated ramp with launch speed; actual keyboard driving must trigger ramp and landing.', () => {
      const event = arcadeEncounters.find(value => value.kind === 'ramp' && !arcadeUsedRamps.has(value.id)); if (!event) return null;
      releaseDrivingInput(); forwardBoost.reset(); const point = arcadePathPoint(event.path, event.distance - 35, event.lane), ground = groundSample(point), surface = surfaceAt(point);
      engine.n.longHaulTruck.teleport({ ...point, y: ground.height + readDynamics().suspension.travel, speed: 24, groundHeight: ground.height, groundNormal: ground.normal, surface: surface.surface, surfaceGrip: surface.grip });
      for (const vehicle of arcadeVehicles) vehicle.active = false;
      return { id: event.id, position: { x: point.x, z: point.z }, lane: event.lane };
    });
    check('Ramp fixture identifies actual generated geometry', Boolean(rampFixture), rampFixture);
    const rampMovement = await driveWithKeyboard(page, 11, { boost: false, aimRamps: true });
    const rampState = await gameSnapshot(page); await page.screenshot({ path: path.join(output, 'stunt.png') });
    check('Driving across the generated ramp produces a real airborne landing', rampState.eventHistory.some(event => event.type === 'ramp-launch' && event.id === rampFixture.id) && rampState.eventHistory.some(event => event.type === 'stunt-landed' && event.airTime >= .6 && event.distance >= 8), { rampFixture, events: rampState.eventHistory, samples: rampMovement.map(value => ({ elapsed: value.elapsed, height: value.snapshot.player.position.y, airborne: !value.snapshot.truckDetails.grounded })) });

    const crateFixture = await fixture('Place truck on an actual breakable-cargo approach; collisions and score must arise from the ordinary game loop.', () => {
      const event = arcadeEncounters.find(value => value.kind === 'breakables'); if (!event) return null;
      releaseDrivingInput(); forwardBoost.reset(); const point = arcadePathPoint(event.path, event.distance - 25, event.lane), ground = groundSample(point), surface = surfaceAt(point);
      engine.n.longHaulTruck.teleport({ ...point, y: ground.height + readDynamics().suspension.travel, speed: 0, groundHeight: ground.height, groundNormal: ground.normal, surface: surface.surface, surfaceGrip: surface.grip });
      for (const vehicle of arcadeVehicles) vehicle.active = false;
      return { id: event.id, lane: event.lane };
    });
    await page.waitForTimeout(200);
    await fixture('After the teleport is committed, space traffic ahead of the cargo fixture so the tested score is caused by the crates rather than a coincident stale vehicle overlap.', () => {
      const progress = arcadeRoadProgress(nearestRoad(course, readTruck().position), arcadeNetwork);
      for (const [index, vehicle] of arcadeVehicles.entries()) { vehicle.path = progress.path; vehicle.progress = progress.distance + 220 + index * 40; vehicle.direction = 1; vehicle.active = true; vehicle.hit = vehicle.passed = false; vehicle.minClearance = Infinity; vehicle.nearSpeed = 0; }
    });
    await page.waitForFunction(() => arcadeScore.snapshot().cooldown === 0);
    await driveWithKeyboard(page, 6, { boost: false, aimRamps: false, targetLane: crateFixture.lane });
    const scored = await gameSnapshot(page); await page.screenshot({ path: path.join(output, 'risk-reward.png') });
    const destructionScores = scored.eventHistory.filter(event => event.type === 'score-event' && event.kind === 'destruction' && event.id.startsWith(crateFixture.id));
    check('Destructible cargo produces visible score and multiplier feedback', destructionScores.length >= 2 && destructionScores.some(event => event.multiplier >= 2) && scored.risk.pending > 0 && await page.locator('#risk-multiplier').isVisible(), { risk: scored.risk, destructionScores, events: scored.eventHistory });
    const rejection = await fixture('Submit duplicate and invalid scoring evidence to the production ledger; these calls must never increase score.', () => {
      const prior = arcadeEventHistory.find(value => value.type === 'score-event'), before = arcadeScore.snapshot();
      const results = [awardArcadeEvent({ id: prior.id, kind: 'destruction', speed: 25, forward: true }), awardArcadeEvent({ id: 'acceptance:stationary', kind: 'near-miss', speed: 0, clearance: .6 }), awardArcadeEvent({ id: 'acceptance:reverse', kind: 'near-miss', speed: 20, clearance: .6, forward: false })];
      return { before, after: arcadeScore.snapshot(), results };
    });
    check('Duplicate, stationary and reverse awards are rejected', rejection.results.every(value => !value.accepted) && rejection.before.events === rejection.after.events && rejection.before.pending === rejection.after.pending && rejection.before.banked === rejection.after.banked, rejection);

    const impact = await fixture('Exercise a severe impact through the actual damage and impulse services; recovery must use E.', () => {
      const before = { truck: structuredClone(readTruck()), risk: arcadeScore.snapshot(), run: structuredClone(readRun()) }; releaseDrivingInput(); forwardBoost.reset();
      if (Math.abs(before.truck.speed) < 8) engine.n.longHaulTruck.teleport({ ...before.truck.position, heading: before.truck.heading, speed: 16 });
      spendTruckDamage(8, 'acceptance-impact'); engine.n.longHaulTruck.impulse({ speedDelta: -5, rollDelta: 1.8, y: 1.5, kind: 'acceptance-impact' }); return before;
    });
    await page.waitForFunction(() => readTruck().tipped, null, { timeout: 5000 }); await page.screenshot({ path: path.join(output, 'crash.png') });
    await page.keyboard.press('e'); await page.waitForFunction(count => !readTruck().tipped && (readRun().recoveryCount || 0) > count, impact.run.recoveryCount || 0, { timeout: 6000 });
    const recovered = await gameSnapshot(page); await page.screenshot({ path: path.join(output, 'recovery.png') });
    check('A crash loses only the pending combo and E restores a drivable truck', recovered.risk.pending === 0 && recovered.risk.banked === impact.risk.banked && !recovered.truckDetails.tipped && recovered.runDetails.recoveryCount === (impact.run.recoveryCount || 0) + 1 && recovered.runDetails.penaltyTotal > impact.run.penaltyTotal && recovered.scene === 'driving', { impact, recovered });
    await page.keyboard.press('e'); const repeatedRecovery = await gameSnapshot(page);
    check('Recovery cannot be repeatedly farmed', repeatedRecovery.runDetails.recoveryCount === recovered.runDetails.recoveryCount, repeatedRecovery.runDetails);

    await fixture('Advance only the weather phase to the rain interval; the real update/render path must change rain, lighting and grip.', () => { arcadeWeatherTime = 30; });
    await page.waitForFunction(() => arcadeWeatherAmount > .4 && rainMesh.visible, null, { timeout: 12000 });
    const weather = await gameSnapshot(page); await page.screenshot({ path: path.join(output, 'weather.png') });
    check('Weather transition produces actual rain and changed conditions', weather.weather.rainVisible && weather.weather.amount > .4, weather.weather);

    const garageFixture = await fixture('Position stopped truck at a generated roadside garage; opening and purchasing use browser input.', () => { const stop = arcadeGarageStops[0]; if (!stop) return null; for (const key of Object.keys(keys)) keys[key] = false; forwardBoost.reset(); engine.n.longHaulTruck.teleport({ x: stop.x, y: terrainHeight(course, stop.x, stop.z) + .85, z: stop.z, heading: readTruck().heading, speed: 0 }); return { id: stop.id, x: stop.x, z: stop.z }; });
    check('A real roadside garage exists in the generated course', Boolean(garageFixture), garageFixture);
    await page.waitForTimeout(200); await page.keyboard.press('e'); await page.locator('#arcade-garage-panel').waitFor({ state: 'visible' });
    const beforePurchase = await page.evaluate(() => arcadeUpgradeState()); await page.locator('#arcade-garage-panel button[data-upgrade="engine"]').click(); const afterPurchase = await page.evaluate(() => arcadeUpgradeState());
    check('Garage purchase persists cash and the selected upgrade', afterPurchase.cash < beforePurchase.cash && afterPurchase.upgrades.engine === beforePurchase.upgrades.engine + 1, { beforePurchase, afterPurchase });
    await page.screenshot({ path: path.join(output, 'garage.png') }); await page.getByRole('button', { name: /CLOSE.*E TO DRIVE/ }).click();
    check('Closing the garage immediately returns control', !(await gameSnapshot(page)).garage.visible);

    await fixture('Position stopped truck at the assigned receiving gate; delivery uses the real E key path.', () => { const depot = course.depots.find(value => value.id === course.validDepotId); for (const key of Object.keys(keys)) keys[key] = false; forwardBoost.reset(); engine.n.longHaulTruck.teleport({ x: depot.x, y: terrainHeight(course, depot.x, depot.z) + .85, z: depot.z, heading: readTruck().heading, speed: 0 }); return depot; });
    await page.waitForTimeout(250); await page.keyboard.press('e'); await page.waitForFunction(() => currentScene() === 'results', null, { timeout: 10000 });
    await page.locator('#results-screen').evaluate(async node => { await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))); });
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#results-screen')).opacity) >= .99 && !document.querySelector('#toast').classList.contains('show'), null, { timeout: 6000 });
    const delivered = await gameSnapshot(page); await page.screenshot({ path: path.join(output, 'delivery.png') });
    check('Delivery resolves through the retained progression loop', delivered.runDetails.status === 'completed' && delivered.delivery.delivered && delivered.save.cash >= afterPurchase.cash, delivered);
    const cash = delivered.save.cash;
    await fixture('Re-render the same settled result to verify payment idempotency.', () => { showResults(readRun().result); arcadeSettleRoadsideRun(); });
    check('Repeated settlement does not duplicate cash', (await gameSnapshot(page)).save.cash === cash);
    await page.locator('#result-retry-btn').click(); await page.waitForFunction(() => generation?.ready && currentScene() === 'driving', null, { timeout: 120000 });
    check('Returning drivers get a shortened cinematic', (await gameSnapshot(page)).intro.duration <= .7);
    await page.keyboard.press('w'); await page.waitForFunction(() => !launchIntro.active && readRun().status === 'running');
    const nextRun = await gameSnapshot(page); check('Next run starts with retained garage progression', nextRun.runDetails.status === 'running' && nextRun.save.upgrades.engine === afterPurchase.upgrades.engine && !nextRun.delivery.delivered, nextRun);
    await page.screenshot({ path: path.join(output, 'after.png') });
    await saveJson(path.join(output, 'states.json'), { entry, cinematicMotion, start, driven, nearMiss, rampState, scored, recovered, weather, delivered, nextRun });

    await page.setViewportSize({ width: 960, height: 540 });
    await page.screenshot({ path: path.join(output, 'driving-960x540.png') });
    const compactHud = await page.evaluate(() => ['#timer-box', '#risk-hud', '#drive-box'].map(selector => { const node = document.querySelector(selector), box = node.getBoundingClientRect(); return { selector, visible: getComputedStyle(node).display !== 'none', x: box.x, y: box.y, width: box.width, height: box.height }; }));
    check('Active driving HUD fits the compact desktop display', compactHud.every(box => box.visible && box.x >= 0 && box.y >= 0 && box.x + box.width <= 961 && box.y + box.height <= 541), compactHud);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => currentScene() === 'paused');

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const mobileObservation = await preparePage(mobileContext, server.url, { returning: true }); const mobile = mobileObservation.page;
    await mobile.locator('#settings-btn').click(); await mobile.waitForFunction(() => currentScene() === 'settings');
    await mobile.locator('#motion-switch').click(); await mobile.locator('#settings-back-btn').click(); await mobile.waitForFunction(() => currentScene() === 'title');
    await beginRun(mobile); await mobile.waitForFunction(() => !launchIntro.active && readRun().status === 'running');
    const reducedMotion = await mobile.evaluate(() => ({ enabled: !settings.motion, intro: { ...launchIntro }, hidden: cinematic.hidden, stored: JSON.parse(localStorage.getItem('the-long-haul-settings-v2')).motion, events: arcadeEventHistory.filter(value => value.type.startsWith('cinematic')) }));
    check('Reduced camera motion gives an unobtrusive short launch and immediate control', reducedMotion.enabled && reducedMotion.stored === false && reducedMotion.intro.duration === .12 && !reducedMotion.intro.active && reducedMotion.hidden && reducedMotion.events.some(value => value.type === 'cinematic-start' && value.duration === .12), reducedMotion);
    const mobileHud = await mobile.evaluate(() => ({ coarse: matchMedia('(pointer:coarse)').matches, keyboardBoostHintVisible: getComputedStyle(document.querySelector('#arcade-overlay .arcade-stat:nth-child(2)')).display !== 'none', boxes: ['#condition-box', '#timer-box', '#risk-hud', '#drive-box', '#touch-controls'].map(selector => { const node = document.querySelector(selector), box = node.getBoundingClientRect(); return { selector, visible: getComputedStyle(node).display !== 'none', x: box.x, y: box.y, width: box.width, height: box.height }; }) }));
    const overlap = mobileHud.boxes.some((a, i) => mobileHud.boxes.slice(i + 1).some(b => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1));
    check('Portrait driving HUD and coarse-pointer controls are visible without overlap', mobileHud.coarse && !mobileHud.keyboardBoostHintVisible && !overlap && mobileHud.boxes.every(box => box.visible && box.x >= 0 && box.y >= 0 && box.x + box.width <= 391 && box.y + box.height <= 845), mobileHud);
    const go = await mobile.getByRole('button', { name: 'Accelerate', exact: true }).boundingBox(), touch = await mobileContext.newCDPSession(mobile);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: go.x + go.width / 2, y: go.y + go.height / 2 }] });
    await mobile.waitForTimeout(600); const touchHeld = await mobile.evaluate(() => ({ held: keys.KeyW, throttle: engine.n.coreInput.getIntent().throttle, position: { ...readTruck().position } }));
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await mobile.waitForFunction(() => !keys.KeyW);
    check('Touch acceleration reaches the real input path and cancel releases it', touchHeld.held && touchHeld.throttle === 1, touchHeld);
    await mobile.screenshot({ path: path.join(output, 'driving-touch-390x844.png') });
    await mobile.getByRole('button', { name: 'Pause', exact: true }).tap(); await mobile.waitForFunction(() => currentScene() === 'paused');
    await mobile.locator('#resume-btn').tap(); await mobile.waitForFunction(() => currentScene() === 'driving');
    check('Touch pause and resume preserve playable control', !(await gameSnapshot(mobile)).frameFailed);
    observations.consoleLog.push(...mobileObservation.consoleLog.map(value => ({ ...value, page: 'portrait-touch' }))); observations.networkFailures.push(...mobileObservation.networkFailures);
    await mobileContext.close();

    const campaign = await context.newPage(); campaign.on('pageerror', error => observations.consoleLog.push({ type: 'pageerror', text: String(error), page: 'campaign' }));
    campaign.on('console', message => observations.consoleLog.push({ type: message.type(), text: message.text(), page: 'campaign' }));
    campaign.on('requestfailed', request => observations.networkFailures.push({ url: request.url(), error: request.failure()?.errorText, page: 'campaign' }));
    await campaign.goto(server.url + 'campaign.html#map'); await campaign.locator('#selectedRouteHeading').waitFor(); await campaign.locator('#nextRoute').click(); const routeAfter = await campaign.locator('#selectedRouteHeading').textContent();
    await campaign.locator('#garageFromMap').click(); await campaign.locator('#garageBack').waitFor({ state: 'visible' }); await campaign.locator('#garageBack').click();
    check('Campaign route selection and garage navigation remain usable', Boolean(routeAfter) && await campaign.locator('#startRoute').isVisible(), routeAfter);
    await campaign.screenshot({ path: path.join(output, 'campaign.png') });
    await page.close(); page = campaign;
    await campaign.locator('#previousRoute').click(); await campaign.locator('#startRoute').click();
    await campaign.waitForURL(/index\.html\?campaign=1/, { timeout: 25000 });
    await campaign.waitForFunction(() => window.__longHaulBooted && generation?.ready && !launchIntro.active && readRun().status === 'running', null, { timeout: 120000 });
    const campaignStart = await campaign.evaluate(() => ({ attempt: campaignLaunch.attemptId, rawSession: sessionStorage.getItem('longhaul-active-campaign'), save: arcadeUpgradeState(), geography: course.geography }));
    check('Campaign launches actual geographic highway gameplay', Boolean(campaignStart.geography?.source && campaignStart.attempt), campaignStart.geography);
    interactions.push({ boundary: 'Isolated endpoint fixture through actual run service', description: 'Fail a live Campaign attempt, reload it, and verify receipt/session retirement.' });
    await campaign.evaluate(() => engine.n.longHaulRun.fail('Acceptance failure/reload scenario'));
    await campaign.waitForFunction(() => currentScene() === 'loss');
    const campaignFailed = await campaign.evaluate(() => ({ save: arcadeUpgradeState(), session: sessionStorage.getItem('longhaul-active-campaign') }));
    check('Campaign failure is settled once and retires the active session', campaignFailed.session === null && campaignFailed.save.failedCampaignAttempts.includes(campaignStart.attempt), campaignFailed);
    await campaign.reload(); await campaign.waitForFunction(() => window.__longHaulBooted && currentScene() === 'title');
    const afterFailureReload = await campaign.evaluate(() => ({ save: arcadeUpgradeState(), launch: campaignLaunch, session: sessionStorage.getItem('longhaul-active-campaign') }));
    check('Reload after failure returns to title without duplicate pay', !afterFailureReload.launch && afterFailureReload.session === null && afterFailureReload.save.cash === campaignFailed.save.cash, afterFailureReload);
    await campaign.evaluate(raw => sessionStorage.setItem('longhaul-active-campaign', raw), campaignStart.rawSession);
    await campaign.reload(); await campaign.waitForFunction(() => window.__longHaulBooted && currentScene() === 'title');
    check('A legacy settled session cannot revive a consumed Campaign attempt', await campaign.evaluate(() => !campaignLaunch && sessionStorage.getItem('longhaul-active-campaign') === null && !generation));
    await campaign.getByRole('link', { name: 'Campaign', exact: true }).click(); await campaign.locator('#startRoute').click();
    await campaign.waitForURL(/index\.html\?campaign=1/, { timeout: 25000 });
    await campaign.waitForFunction(() => window.__longHaulBooted && generation?.ready && !launchIntro.active && readRun().status === 'running', null, { timeout: 120000 });
    const freshAttempt = await campaign.evaluate(() => campaignLaunch.attemptId);
    check('The next explicitly launched Campaign run receives a fresh attempt', Boolean(freshAttempt) && freshAttempt !== campaignStart.attempt, { retired: campaignStart.attempt, freshAttempt });
    const staleReplay = await campaign.evaluate(oldAttempt => { const current = campaignLaunch.attemptId, session = sessionStorage.getItem('longhaul-active-campaign'), before = arcadeUpgradeState().cash; try { campaignLaunch.attemptId = oldAttempt; completeCampaignDelivery({ cargoCondition: 100 }); return { before, after: arcadeUpgradeState().cash }; } finally { campaignLaunch.attemptId = current; sessionStorage.setItem('longhaul-active-campaign', session); } }, campaignStart.attempt);
    check('A failed receipt also blocks a stale success settlement', staleReplay.before === staleReplay.after, staleReplay);
    await campaign.evaluate(() => { releaseDrivingInput(); forwardBoost.reset(); const depot = course.depots.find(value => value.id === course.validDepotId), ground = groundSample(depot); engine.n.longHaulTruck.teleport({ x: depot.x, y: ground.height + readDynamics().suspension.travel, z: depot.z, heading: readTruck().heading, speed: 0, groundHeight: ground.height, groundNormal: ground.normal }); });
    await campaign.waitForTimeout(200); await campaign.keyboard.press('e'); await campaign.waitForFunction(() => currentScene() === 'results', null, { timeout: 15000 });
    await campaign.locator('#results-screen').evaluate(async node => { await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))); });
    await campaign.waitForFunction(() => Number(getComputedStyle(document.querySelector('#results-screen')).opacity) >= .99 && !document.querySelector('#toast').classList.contains('show'), null, { timeout: 6000 });
    const campaignComplete = await gameSnapshot(campaign); await campaign.screenshot({ path: path.join(output, 'campaign-delivery.png') });
    check('Fresh Campaign delivery advances location and pays its own receipt once', campaignComplete.delivery.delivered && campaignComplete.save.completedCampaignAttempts.includes(freshAttempt) && campaignComplete.save.deliveries === campaignFailed.save.deliveries + 1 && campaignComplete.save.cash > campaignFailed.save.cash, campaignComplete.save);
    const duplicateCampaign = await campaign.evaluate(() => { const before = arcadeUpgradeState().cash; completeCampaignDelivery(readRun().result); return { before, after: arcadeUpgradeState().cash }; });
    check('Repeated successful Campaign settlement cannot pay twice', duplicateCampaign.before === duplicateCampaign.after, duplicateCampaign);
    await saveJson(path.join(output, 'campaign-receipts.json'), { campaignStart, campaignFailed, afterFailureReload, freshAttempt, staleReplay, campaignComplete, duplicateCampaign });
    check('No fatal application or WebGL errors', !observations.consoleLog.some(value => value.type === 'pageerror' || value.type === 'error' && !/favicon|404/.test(value.text)), observations.consoleLog.filter(value => ['error', 'pageerror'].includes(value.type)));
    const endSource = await sourceIdentity(); check('Validated source stayed identical throughout capture', source.aggregate === endSource.aggregate, { before: source.aggregate, after: endSource.aggregate });
  } catch (error) { failure = String(error.stack || error); console.error(failure); if (page) await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {}); }
  finally { await browser?.close().catch(() => {}); await server?.close().catch(() => {}); cleaned = true; }
  const completedAt = new Date().toISOString(), fatal = observations?.consoleLog.filter(value => value.type === 'pageerror' || value.type === 'error' && !/favicon|404/.test(value.text)) ?? [];
  const artifacts = { before: path.join(output, 'before.png'), after: path.join(output, 'after.png'), decisionLog: path.join(output, 'decision-log.json'), console: path.join(output, 'console.json'), networkFailures: path.join(output, 'network-failures.json'), interaction: path.join(output, 'interaction.json') };
  await saveJson(artifacts.console, observations?.consoleLog ?? []); await saveJson(artifacts.networkFailures, observations?.networkFailures ?? []); await saveJson(artifacts.interaction, { actions: interactions, checks });
  decisions.push({ at: completedAt, stage: 'cleanup', kind: 'fact', statement: 'Task-local browser and HTTP server closed.', basis: { cleaned }, effect: 'none' }); await saveJson(artifacts.decisionLog, decisions);
  const passed = !failure && checks.every(check => check.passed), verdict = passed ? 'pass' : page ? 'fail' : 'blocked';
  const report = { schemaVersion: 'sandbox.web-render-validation/1', runId, startedAt, completedAt, runDirectory: output, requested, observed: { target: projectRoot, revision: source.revision, finalUrl: server?.url + 'index.html', surface: 'mixed' }, source, runtime, identity: { matchesRequestedMode: true, matchesRequestedTarget: true, matchesRequestedRevision: true }, freshness: { currentRunOnly: true, historicalEvidenceExcluded: true }, render: { visible: passed, nonEmpty: passed, surfaceProven: passed, fatalErrors: fatal }, interaction: { required: true, performed: interactions.length > 0, changeProven: passed }, children: [{ name: 'sandbox-record-browser-it', verdict, evidence: artifacts.interaction }, { name: 'webgl-render-sandbox-it', verdict, evidence: path.join(output, 'webgl-render-report.json') }], artifacts, supplementalRuns: [], cleanup: { required: true, completed: cleaned }, verdict, checks, failure, coverageBoundary: 'Actual local working-tree browser DOM, keyboard, WebGL pixels, garage and delivery progression. Endpoint setup uses declared real-service teleport fixtures; this is not human feel testing or hardware GPU performance certification.' };
  await saveJson(path.join(output, 'validation-report.json'), report); console.log(JSON.stringify({ verdict, output, checks: checks.length, failure })); if (!passed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await validate();
