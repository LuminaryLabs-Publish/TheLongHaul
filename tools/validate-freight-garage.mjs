import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, sourceIdentity, serveProject, loadBrowser, preparePage, beginRun, saveJson } from './validate-gameplay.mjs';

const output = path.join(projectRoot, '.cache/validation', 'freight-garage-' + new Date().toISOString().replace(/[:.]/g, '-'));
await mkdir(output, { recursive: true });
const source = await sourceIdentity(), checks = [], fixtures = []; let browser, server, page, observations, failure = null;
const check = (name, value, evidence) => { checks.push({ name, passed: Boolean(value), evidence }); assert.ok(value, name); console.log(JSON.stringify({ name, passed: true })); };
const read = () => page.evaluate(() => ({ fuel: meters.get('fuel').value, truck: meters.get('truck-condition').value, save: arcadeUpgradeState(), raw: localStorage.getItem('longhaul-campaign-v1'), freight: LongHaulFreight.getState(), panel: !arcadeGaragePanel.hidden, failed: frameFailed }));
try {
  server = await serveProject(); ({ browser } = await loadBrowser());
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } }); observations = await preparePage(context, server.url, { returning: true }); page = observations.page;
  await beginRun(page); await page.keyboard.press('w'); await page.waitForFunction(() => !launchIntro.active && readRun().status === 'running');
  await page.waitForFunction(() => arcadeGarageStops.some(stop => -stop.z > 0));
  const target = await page.evaluate(() => { const stop = arcadeGarageStops.filter(value => -value.z > 0).sort((a,b) => -a.z + b.z)[0]; return { id: stop.id, x: stop.x, z: stop.z, revision: course.endless.revision }; });
  fixtures.push({ kind: 'endpoint-and-resource-setup', description: 'Advance a real road window beyond a known garage, return to its original coordinates, and spend fuel/truck meters so paid services can be exercised.', target });
  await page.evaluate(target => { releaseDrivingInput(); const point = endlessHighwayPoint(course, -target.z + 400, -4.4), ground = groundSample(point); engine.n.longHaulTruck.teleport({ ...point, y: ground.height + .92, speed: 0, groundHeight: ground.height, groundNormal: ground.normal }); }, target);
  await page.waitForFunction(revision => course.endless.revision > revision, target.revision); await page.waitForTimeout(300);
  const retained = await page.evaluate(id => { const stop = arcadeGarageStops.find(value => value.id === id); return stop ? { id: stop.id, x: stop.x, z: stop.z, revision: course.endless.revision } : null; }, target.id);
  check('An existing garage keeps its exact position after the highway window advances', retained && retained.revision > target.revision && Math.hypot(retained.x - target.x, retained.z - target.z) < .01, { target, retained });
  await page.evaluate(target => { const ground = groundSample(target); engine.n.longHaulTruck.teleport({ x: target.x, z: target.z, y: ground.height + .92, speed: 0, heading: readTruck().heading, groundHeight: ground.height, groundNormal: ground.normal }); meters.spend('fuel', 30, 'validation-service-fixture'); meters.spend('truck-condition', 35, 'validation-service-fixture'); }, target);
  await page.waitForFunction(id => arcadeNearestGarage(readTruck().position)?.stop.id === id && Math.abs(readTruck().speed) < 1, target.id);
  await page.keyboard.press('e'); await page.locator('#arcade-garage-panel').waitFor({ state: 'visible' });
  const before = await read();
  await page.evaluate(() => { window.__serviceOriginalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = function(key,value) { if (this === localStorage && key === 'longhaul-campaign-v1') throw new DOMException('Explicit service-write failure fixture', 'QuotaExceededError'); return window.__serviceOriginalSetItem.call(this,key,value); }; });
  try { await page.locator('[data-service="service-fuel"]').click(); }
  finally { await page.evaluate(() => { Storage.prototype.setItem = window.__serviceOriginalSetItem; delete window.__serviceOriginalSetItem; }); }
  const denied = await read();
  check('A rejected service save preserves both cash and fuel', denied.fuel === before.fuel && denied.save.cash === before.save.cash && denied.raw === before.raw, { before: { fuel: before.fuel, cash: before.save.cash }, after: { fuel: denied.fuel, cash: denied.save.cash } });
  await page.locator('[data-service="service-fuel"]').click(); const fueled = await read();
  check('Paid refueling saves the meter and wallet atomically', fueled.fuel > denied.fuel && fueled.save.cash === denied.save.cash - 90 && fueled.save.freightJourney.meters.fuel === fueled.fuel && await page.locator('[data-service="service-fuel"]').isDisabled(), { before: denied.fuel, after: fueled.fuel, cash: fueled.save.cash });
  await page.locator('[data-service="service-repair"]').click(); const repaired = await read();
  check('Paid repair saves the restored truck condition and correct cost', repaired.truck > fueled.truck && repaired.save.cash === fueled.save.cash - 120 && repaired.save.freightJourney.meters.truck === repaired.truck, { before: fueled.truck, after: repaired.truck, cash: repaired.save.cash });
  await page.locator('#arcade-garage-panel [data-upgrade="engine"]').click(); const upgraded = await read();
  check('Garage upgrades retain the same freight checkpoint and service balance', upgraded.save.upgrades.engine === before.save.upgrades.engine + 1 && upgraded.save.cash < repaired.save.cash && upgraded.save.freightJourney.journey.sessionId === before.freight.sessionId, { cash: upgraded.save.cash, engine: upgraded.save.upgrades.engine });
  await page.screenshot({ path: path.join(output, 'paid-services.png') });
  await page.getByRole('button', { name: /CLOSE.*E TO DRIVE/ }).click(); await page.reload();
  await page.waitForFunction(() => window.__longHaulBooted && currentScene() === 'title'); await page.locator('#freight-resume-btn').click(); await page.waitForFunction(() => generation?.ready, null, { timeout: 120000 }); await page.keyboard.press('w'); await page.waitForFunction(() => !launchIntro.active && readRun().status === 'running');
  const resumed = await read();
  check('Reload and Resume retain paid services, upgrades and the original journey', resumed.freight.sessionId === before.freight.sessionId && resumed.save.cash === upgraded.save.cash && resumed.save.upgrades.engine === upgraded.save.upgrades.engine && Math.abs(resumed.fuel - repaired.fuel) < .1 && Math.abs(resumed.truck - repaired.truck) < .1 && !resumed.failed, { sessionId: resumed.freight.sessionId, cash: resumed.save.cash, fuel: resumed.fuel, truck: resumed.truck });
  check('No uncaught application errors', !observations.consoleLog.some(value => value.type === 'pageerror' || value.type === 'error' && !/favicon|404/.test(value.text)), observations.consoleLog);
  check('Application source remained unchanged', source.aggregate === (await sourceIdentity()).aggregate, source.aggregate);
} catch (error) { failure = String(error.stack || error); console.error(failure); await page?.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {}); }
finally { await browser?.close().catch(() => {}); await server?.close().catch(() => {}); }
await saveJson(path.join(output, 'report.json'), { verdict: failure ? 'fail' : 'pass', source, checks, fixtures, failure, console: observations?.consoleLog, boundary: 'Actual game service buttons, wallet writes, rejected-write rollback, upgrade and checkpoint reload, with disclosed endpoint/resource setup. Natural footage uses no endpoint or resource fixtures.' });
console.log(JSON.stringify({ verdict: failure ? 'fail' : 'pass', output, failure })); if (failure) process.exitCode = 1;
