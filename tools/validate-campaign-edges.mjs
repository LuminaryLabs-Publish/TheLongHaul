import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { freshCampaignSave } from '../src/campaign-policy.mjs';
import { loadBrowser, serveProject, sourceIdentity, saveJson, projectRoot, argValue, webglEvidence } from './validate-gameplay.mjs';

const output = path.resolve(argValue('--output', path.join(projectRoot, '.cache/validation', 'campaign-edges-' + new Date().toISOString().replace(/[:.]/g, '-'))));
const selectedScenario = argValue('--only', null);
await mkdir(output, { recursive: false });
const source = await sourceIdentity(), startedAt = new Date().toISOString();
const checks = [], scenarios = [], consoleLog = [], network = [], fixtures = [], screenshots = [];
let server, browser, runtime;
const check = (name, value, evidence = null) => {
  checks.push({ name, passed: Boolean(value), evidence });
  assert.ok(value, name);
  console.log(JSON.stringify({ check: name, passed: true }));
};
const shot = async (page, name) => {
  await page.waitForFunction(() => { const active = document.querySelector('.screen.active'); return !active || Number(getComputedStyle(active).opacity) >= .99; }, null, { timeout: 5000 });
  const file = path.join(output, name + '.png'); await page.screenshot({ path: file }); screenshots.push(file); return file;
};
await saveJson(path.join(output, 'target-lock.json'), { source, startedAt, target: projectRoot, mode: 'local working tree', scope: 'Campaign edge states; actual live OSRM for normal route launches; no performance claims under concurrent validation' });

async function newPage({ name, save = freshCampaignSave(), raw = null, failure = null, viewport = { width: 1280, height: 720 } } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', message => consoleLog.push({ scenario: name, type: message.type(), text: message.text(), at: new Date().toISOString() }));
  page.on('pageerror', error => consoleLog.push({ scenario: name, type: 'pageerror', text: String(error), at: new Date().toISOString() }));
  page.on('requestfailed', request => network.push({ scenario: name, type: 'failed', url: request.url(), reason: request.failure()?.errorText }));
  page.on('request', request => { if (request.url().includes('/route/v1/driving/')) network.push({ scenario: name, type: 'route-request', url: request.url() }); });
  page.on('response', response => { if (response.status() >= 400) network.push({ scenario: name, type: 'http-error', url: response.url(), status: response.status() }); });
  const initialRaw = raw ?? JSON.stringify(save);
  fixtures.push({ scenario: name, kind: failure ? 'declared failure fixture' : 'declared saved-career prerequisite', failure, rawSave: initialRaw });
  await page.addInitScript(({ initialRaw, failure }) => {
    const key = 'longhaul-campaign-v1', originalGet = Storage.prototype.getItem, originalSet = Storage.prototype.setItem;
    if (!sessionStorage.getItem('campaign-edge-fixture-seeded')) {
      originalSet.call(localStorage, key, initialRaw);
      originalSet.call(sessionStorage, 'campaign-edge-fixture-seeded', '1');
    }
    sessionStorage.setItem('long-haul-intro-credits-seen-v1', '1');
    localStorage.setItem('longhaul-launch-seen-v1', '1');
    localStorage.setItem('the-long-haul-settings-v2', JSON.stringify({ quality: false, sound: false, motion: false, steering: 100 }));
    window.__campaignFailureMode = failure;
    window.__readCampaignFixtureRaw = () => originalGet.call(localStorage, key);
    Storage.prototype.getItem = function (name) {
      if (window.__campaignFailureMode === 'local-read' && this === localStorage && name === key) throw new DOMException('Acceptance fixture: storage read unavailable', 'SecurityError');
      return originalGet.call(this, name);
    };
    Storage.prototype.setItem = function (name, value) {
      if (window.__campaignFailureMode === 'local-write' && this === localStorage && name === key) throw new DOMException('Acceptance fixture: storage quota unavailable', 'QuotaExceededError');
      if (window.__campaignFailureMode === 'session-write' && this === sessionStorage && name === 'longhaul-active-campaign') throw new DOMException('Acceptance fixture: session write unavailable', 'QuotaExceededError');
      return originalSet.call(this, name, value);
    };
  }, { initialRaw, failure });
  return { page, context, initialRaw };
}

async function openCampaign(page) {
  await page.goto(server.url + 'campaign.html#map', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.LongHaulGaragePerformance), null, { timeout: 20000 });
}
const wallet = save => Object.fromEntries(['cash', 'deliveries', 'careerMiles', 'truck', 'ownedTrucks', 'upgrades', 'freightJourney', 'freightReceipts'].map(key => [key, save[key]]));
const currentSave = page => page.evaluate(() => JSON.parse(window.__readCampaignFixtureRaw()));

async function scenario(name, action) {
  if (selectedScenario && name !== selectedScenario) return;
  const before = checks.length, begin = Date.now();
  try { await action(); scenarios.push({ name, passed: true, checks: checks.length - before, elapsedMs: Date.now() - begin }); }
  catch (error) { scenarios.push({ name, passed: false, checks: checks.length - before, elapsedMs: Date.now() - begin, error: String(error), stack: error.stack }); console.log(JSON.stringify({ scenario: name, passed: false, error: String(error) })); }
}

try {
  server = await serveProject(); ({ browser, runtime } = await loadBrowser());
  await saveJson(path.join(output, 'runtime.json'), runtime);

  await scenario('shipping-garage-live-maui', async () => {
    const initial = { ...freshCampaignSave(), location: 'CA', visited: ['NJ', 'CA'], coast: true, cash: 6450, deliveries: 6, careerMiles: 3200, truck: 'semi', ownedTrucks: ['delivery', 'semi'], freightJourney: { validationPreservationSentinel: ['continuous', 7] }, freightReceipts: { validationPreservationSentinel: ['paid-once'] } };
    const { page, context } = await newPage({ name: 'shipping-garage-live-maui', save: initial });
    try {
      await openCampaign(page);
      await page.locator('#garageFromMap').click();
      await page.waitForFunction(() => LongHaulGaragePerformance.getState().ready && LongHaulGaragePerformance.getState().geometries > 0, null, { timeout: 20000 });
      check('Campaign map GARAGE opens the full fleet and real 3D preview', await page.locator('#fleetPicker button').count() === 4, await page.evaluate(() => LongHaulGaragePerformance.getState()));
      const gl = await page.evaluate(() => {
        const canvas = document.querySelector('#garageCanvas'), gl = canvas.getContext('webgl2') || canvas.getContext('webgl'), ext = gl?.getExtension('WEBGL_debug_renderer_info');
        return { available: !!gl, lost: gl?.isContextLost(), renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '', vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : '', width: canvas.width, height: canvas.height, canvasCount: document.querySelectorAll('canvas').length };
      });
      check('Campaign garage uses a live SwiftShader WebGL context', gl.available && !gl.lost && /swiftshader/i.test(gl.renderer) && gl.width > 100, gl);
      await saveJson(path.join(output, 'garage-webgl.json'), gl);
      await shot(page, 'campaign-garage');
      await page.locator('#fleetPicker button').filter({ hasText: /^BOX TRUCK/ }).click();
      await page.locator('[data-buy="engine"]').click();
      const upgraded = await currentSave(page);
      check('Campaign fleet purchase and upgrade persist exactly once', upgraded.cash === initial.cash - 1200 - 650 && upgraded.truck === 'box' && upgraded.ownedTrucks.includes('box') && upgraded.upgrades.engine === 1, upgraded);
      check('Garage preserves continuous-freight owner fields', JSON.stringify(upgraded.freightJourney) === JSON.stringify(initial.freightJourney) && JSON.stringify(upgraded.freightReceipts) === JSON.stringify(initial.freightReceipts));
      await page.keyboard.press('Escape');
      check('Escape leaves garage and restores dispatch keyboard focus', await page.locator('#startRoute').isVisible() && await page.evaluate(() => document.activeElement?.id) === 'startRoute');
      await page.locator('#previousRoute').click();
      check('Unlocked Hawaii presents shipping rather than ocean driving', /SHIP TO HAWAII/.test(await page.locator('#startRoute').textContent()) && /NO DELIVERY REWARD/.test(await page.locator('#selectedRouteReward').textContent()));
      await shot(page, 'hawaii-ship-offer');
      await page.locator('#startRoute').click();
      await page.waitForFunction(() => document.querySelector('#selectedRouteDestination').textContent.includes('Kihei'));
      const hawaii = await currentSave(page);
      check('Outbound ship preserves wallet, completed hauls, vehicle and freight checkpoint', hawaii.location === 'HI' && hawaii.visited.includes('HI') && JSON.stringify(wallet(hawaii)) === JSON.stringify(wallet(upgraded)), hawaii);
      check('Shipping creates no active driving attempt', await page.evaluate(() => sessionStorage.getItem('longhaul-active-campaign')) === null);
      await page.locator('#nextRoute').click();
      check('Hawaii offers an explicit mainland return ship', /RETURN TO CALIFORNIA/.test(await page.locator('#startRoute').textContent()));
      await page.locator('#startRoute').click();
      const returned = await currentSave(page);
      check('Returning to California cannot farm cash, mileage or deliveries', returned.location === 'CA' && JSON.stringify(wallet(returned)) === JSON.stringify(wallet(upgraded)), returned);
      await page.locator('#previousRoute').click();
      const mauiResponse = page.waitForResponse(response => response.url().includes('/route/v1/driving/-156.4729,20.8893;-156.445,20.7644') && response.status() === 200, { timeout: 35000 });
      await page.locator('#startRoute').click();
      const live = await mauiResponse, routeData = await live.json();
      check('Maui preview receives connected live OSRM road geometry', routeData.code === 'Ok' && routeData.routes?.[0]?.geometry?.coordinates?.length > 2, { url: live.url(), status: live.status(), code: routeData.code, distance: routeData.routes?.[0]?.distance, points: routeData.routes?.[0]?.geometry?.coordinates?.length, waypoints: routeData.waypoints });
      await saveJson(path.join(output, 'maui-live-route.json'), { url: live.url(), status: live.status(), data: routeData });
      await page.waitForFunction(() => document.querySelector('#routeInfo').textContent.includes('Actual OSRM'), null, { timeout: 10000 });
      await shot(page, 'maui-road-offer');
      const oceanRequests = network.filter(item => item.scenario === 'shipping-garage-live-maui' && item.type === 'route-request' && item.url.includes('-119.5,37.3;-156.4,20.8'));
      check('Shipping never requests a fictional California–Hawaii driving route', oceanRequests.length === 0, oceanRequests);
      await page.locator('#startRoute').click();
      await page.waitForURL(/index\.html\?campaign=1/, { timeout: 25000 });
      await page.waitForFunction(() => window.__longHaulBooted && generation?.ready && !launchIntro.active && readRun().status === 'running', null, { timeout: 120000 });
      const launched = await page.evaluate(() => ({ route: campaignLaunch.route, geography: course.geography, frameFailed, scene: currentScene(), run: readRun().status, session: Boolean(sessionStorage.getItem('longhaul-active-campaign')) }));
      check('Live Maui alignment launches the actual Campaign driving engine', launched.route.id === 'HI-KAHULUI-KIHEI' && launched.geography.from === 'HI' && launched.geography.to === 'HI' && launched.geography.actualMeters > 10000 && !launched.frameFailed && launched.run === 'running', launched);
      const gameplayGl = await webglEvidence(page);
      check('Maui driving renders nonempty WebGL gameplay', gameplayGl.available && !gameplayGl.lost && gameplayGl.pixels.distinctColors > 40 && gameplayGl.triangles > 0, gameplayGl);
      await saveJson(path.join(output, 'maui-webgl.json'), gameplayGl);
      await page.keyboard.down('w'); await page.waitForTimeout(750); await page.keyboard.up('w');
      await shot(page, 'maui-driving');
      await saveJson(path.join(output, 'shipping-states.json'), { initial, upgraded, hawaii, returned, launched });
    } finally { await context.close(); }
  });

  for (const [name, raw] of [['corrupt-json', '{invalid'], ['invalid-cash', JSON.stringify({ ...freshCampaignSave(), cash: -1 })], ['invalid-upgrade', JSON.stringify({ ...freshCampaignSave(), upgrades: { engine: 999 } })]]) {
    await scenario(name, async () => {
      const { page, context } = await newPage({ name, raw, failure: 'corrupt-save' });
      try {
        await openCampaign(page);
        check(`${name}: dispatch refuses to launch and explains the preserved save`, await page.locator('#startRoute').isDisabled() && /original save|unavailable|invalid/i.test(await page.locator('#routeInfo').textContent()));
        check(`${name}: original save bytes are not overwritten`, await page.evaluate(() => __readCampaignFixtureRaw()) === raw);
        if (name === 'invalid-upgrade') {
          await page.locator('#garageFromMap').click();
          check('Invalid saved upgrades cannot be laundered through garage purchases', await page.locator('#upgradeList button:enabled, #fleetPicker button:enabled').count() === 0);
          await shot(page, 'invalid-save-garage');
        } else if (name === 'corrupt-json') await shot(page, 'corrupt-save-dispatch');
      } finally { await context.close(); }
    });
  }

  for (const failure of ['local-read', 'local-write']) {
    await scenario(failure, async () => {
      const { page, context, initialRaw } = await newPage({ name: failure, failure });
      try {
        await openCampaign(page);
        if (failure === 'local-read') check('Unavailable localStorage reads keep dispatch disabled', await page.locator('#startRoute').isDisabled() && /storage.*unavailable/i.test(await page.locator('#routeInfo').textContent()));
        else {
          await page.locator('#startRoute').click();
          check('Failed localStorage writes leave PLAY available with a recovery message', !(await page.locator('#startRoute').isDisabled()) && /saved progress.*unavailable/i.test(await page.locator('#routeInfo').textContent()));
          await page.locator('#garageFromMap').click(); await page.locator('[data-buy="engine"]').click();
          check('A failed upgrade write rolls back the purchase', /SAVE UNAVAILABLE/.test(await page.locator('#cash').textContent()) && (await page.locator('[data-buy="engine"]').textContent()).includes('650'));
        }
        check(`${failure}: existing saved progress remains intact`, await page.evaluate(() => __readCampaignFixtureRaw()) === initialRaw);
        await shot(page, failure);
      } finally { await context.close(); }
    });
  }

  await scenario('cross-tab-save-conflict', async () => {
    const { page, context } = await newPage({ name: 'cross-tab-save-conflict' });
    try {
      await openCampaign(page);
      const other = await context.newPage(); await other.goto(server.url + 'vendor/manifest.json');
      const changed = { ...freshCampaignSave(), cash: 2800, deliveries: 2 };
      await other.evaluate(save => localStorage.setItem('longhaul-campaign-v1', JSON.stringify(save)), changed);
      await page.waitForFunction(() => document.querySelector('#startRoute').disabled);
      check('Cross-tab updates disable stale Campaign writes without replacing newer progress', /another tab/.test(await page.locator('#routeInfo').textContent()) && JSON.stringify(await currentSave(page)) === JSON.stringify(changed));
    } finally { await context.close(); }
  });

  await scenario('route-failure-and-live-retry', async () => {
    const { page, context } = await newPage({ name: 'route-failure-and-live-retry' });
    const pattern = '**/route/v1/driving/**';
    fixtures.push({ scenario: 'route-failure-and-live-retry', kind: 'declared network failure', boundary: 'OSRM requests aborted until explicit retry' });
    try {
      await page.route(pattern, route => route.abort('failed'));
      await openCampaign(page); await page.locator('#startRoute').click();
      await page.waitForFunction(() => document.querySelector('#routeInfo').textContent.includes('Road data unavailable'));
      check('Unavailable roads restore PLAY without launching fictional geometry', !(await page.locator('#startRoute').isDisabled()) && await page.evaluate(() => sessionStorage.getItem('longhaul-active-campaign')) === null);
      await shot(page, 'road-unavailable');
      await page.unroute(pattern);
      await page.locator('#startRoute').click();
      await page.waitForURL(/index\.html\?campaign=1/, { timeout: 35000 });
      const payload = await page.evaluate(() => JSON.parse(sessionStorage.getItem('longhaul-active-campaign')));
      check('Retry after network recovery obtains a real geographic Campaign handoff', payload.route.id === 'NJ-PA' && payload.course.geography.actualMeters > 10000 && payload.course.edges.length > 2, { attemptId: payload.attemptId, geography: payload.course.geography, edges: payload.course.edges.length });
    } finally { await context.close(); }
  });

  await scenario('session-handoff-unavailable', async () => {
    const { page, context } = await newPage({ name: 'session-handoff-unavailable', failure: 'session-write' });
    try {
      await openCampaign(page);
      await page.waitForFunction(() => document.querySelector('#routeInfo').textContent.includes('Actual OSRM'), null, { timeout: 30000 });
      await page.locator('#startRoute').click();
      await page.waitForFunction(() => document.querySelector('#routeInfo').textContent.includes('session storage'));
      check('A ready real highway reports session-storage failure separately and permits retry', !(await page.locator('#startRoute').isDisabled()) && page.url().includes('campaign.html') && await page.evaluate(() => sessionStorage.getItem('longhaul-active-campaign')) === null);
      await shot(page, 'session-storage-unavailable');
      await page.evaluate(() => { window.__campaignFailureMode = null; });
      await page.locator('#startRoute').click(); await page.waitForURL(/index\.html\?campaign=1/, { timeout: 25000 });
      check('Session-storage recovery permits a fresh launch without reloading dispatch', await page.evaluate(() => Boolean(JSON.parse(sessionStorage.getItem('longhaul-active-campaign'))?.attemptId)));
    } finally { await context.close(); }
  });

  await scenario('pending-back-credits-fullscreen', async () => {
    const { page, context } = await newPage({ name: 'pending-back-credits-fullscreen' }), held = [];
    fixtures.push({ scenario: 'pending-back-credits-fullscreen', kind: 'declared network delay', boundary: 'OSRM requests remain pending until user leaves dispatch' });
    try {
      await page.route('**/route/v1/driving/**', route => { held.push(route); });
      await openCampaign(page); await page.locator('#startRoute').click();
      await page.waitForFunction(() => document.querySelector('#startRoute').textContent.includes('LOADING REAL'));
      await page.locator('#dispatchBack').click(); await page.waitForURL(/index\.html$/, { timeout: 25000 });
      for (const route of held) await route.abort('aborted').catch(() => {});
      await page.waitForFunction(() => window.__longHaulBooted && currentScene() === 'title', null, { timeout: 45000 });
      check('Back cancels pending route work without a late Campaign handoff', !page.url().includes('?campaign') && await page.evaluate(() => sessionStorage.getItem('longhaul-active-campaign')) === null);
      await page.locator('#credits-btn').click(); await page.waitForFunction(() => currentScene() === 'credits');
      check('Credits are reachable and attribute both game and engines', /Luminary Labs/.test(await page.locator('#credits-screen').textContent()) && /NexusEngine and Three.js/.test(await page.locator('#credits-screen').textContent()));
      await shot(page, 'credits');
      await page.locator('#credits-back-btn').click(); await page.waitForFunction(() => currentScene() === 'title');
      await page.locator('#fullscreen-btn').click();
      await page.waitForFunction(() => (Boolean(document.fullscreenElement) && document.querySelector('#fullscreen-btn').getAttribute('aria-pressed') === 'true') || /Fullscreen.*(unavailable|could not)/.test(document.querySelector('#toast').textContent), null, { timeout: 5000 });
      const full = await page.evaluate(() => ({ active: Boolean(document.fullscreenElement), element: document.fullscreenElement?.id, pressed: document.querySelector('#fullscreen-btn').getAttribute('aria-pressed'), message: document.querySelector('#toast').textContent }));
      check('Fullscreen activates on the game stage with matching accessible state', full.active && full.element === 'game-stage' && full.pressed === 'true', full);
      await shot(page, 'fullscreen-title');
      await page.locator('#fullscreen-btn').click(); await page.waitForFunction(() => !document.fullscreenElement && document.querySelector('#fullscreen-btn').getAttribute('aria-pressed') === 'false');
      check('Fullscreen exits cleanly back to the menu', await page.locator('#fullscreen-btn').getAttribute('aria-pressed') === 'false');
    } finally { await context.close(); }
  });
} catch (error) {
  scenarios.push({ name: 'infrastructure', passed: false, error: String(error), stack: error.stack });
} finally {
  await browser?.close().catch(() => {}); await server?.close().catch(() => {});
}

const finalSource = await sourceIdentity();
checks.push({ name: 'Application source stayed fixed during validation', passed: finalSource.aggregate === source.aggregate, evidence: { before: source.aggregate, after: finalSource.aggregate } });
const unexpectedErrors = consoleLog.filter(item => item.type === 'pageerror' || /Error creating WebGL|WebGL.*context.*lost/i.test(item.text));
checks.push({ name: 'No page-level exceptions or lost WebGL contexts', passed: unexpectedErrors.length === 0, evidence: unexpectedErrors });
const passed = scenarios.every(item => item.passed) && checks.every(item => item.passed);
await saveJson(path.join(output, 'console.json'), consoleLog);
await saveJson(path.join(output, 'network.json'), network);
await saveJson(path.join(output, 'fixtures.json'), fixtures);
await saveJson(path.join(output, 'validation-report.json'), { verdict: passed ? 'PASS' : 'FAIL', startedAt, completedAt: new Date().toISOString(), source, finalSource, runtime, scenarios, checks, screenshots, visuallyInspected: false, limitation: 'Chromium functional and presentation checks; no performance conclusions under concurrent software-renderer activity.' });
console.log(JSON.stringify({ verdict: passed ? 'PASS' : 'FAIL', output, scenarios: scenarios.length, checks: checks.length }));
if (!passed) process.exitCode = 1;
