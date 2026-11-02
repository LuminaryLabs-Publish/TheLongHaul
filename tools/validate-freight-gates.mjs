import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, argValue, sourceIdentity, serveProject, loadBrowser, preparePage, beginRun, saveJson } from './validate-gameplay.mjs';

// Endpoint setup is explicitly a fixture. Pickups and missed gates below still
// use real truck movement, overlap detection, clocks, cargo and visual hosts.
const output = path.resolve(argValue('--output', path.join(projectRoot, '.cache/validation', 'freight-gates-' + new Date().toISOString().replace(/[:.]/g, '-'))));
await mkdir(path.dirname(output), { recursive: true }); await mkdir(output);
const source = await sourceIdentity(), startedAt = new Date().toISOString(), checks = [], fixtures = [];
let server, browser, page, observations, runtime, failure = null;
const check = (name, value, evidence) => { checks.push({ name, passed: Boolean(value), evidence }); assert.ok(value, name); console.log(JSON.stringify({ name, passed: true })); };
const snapshot = () => page.evaluate(() => {
  const freight = LongHaulFreight.getState(), group = freightStationHosts.get(freight.deliveryGate.id);
  return { freight, scene: currentScene(), run: readRun(), cargoMass: readTruck().cargoMass, cargoVisible: (freightCargoRoot?.children.length ?? 0) > 0, gate: group ? { id: freight.deliveryGate.id, visible: group.visible, position: group.position.toArray() } : null, cash: arcadeUpgradeState().cash, failed: frameFailed };
});
try {
  server = await serveProject(); ({ browser, runtime } = await loadBrowser());
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  observations = await preparePage(context, server.url, { seed: 'freight-gates-2026', returning: true }); page = observations.page;
  await beginRun(page); await page.keyboard.press('w'); await page.waitForFunction(() => !launchIntro.active && readRun().status === 'running', null, { timeout: 20000 });
  fixtures.push(await page.evaluate(() => {
    releaseDrivingInput(); forwardBoost.reset(); const progress = freightState.contract.pickupProgress - 25, point = endlessHighwayPoint(course, progress, -4.4), ground = groundSample(point);
    engine.n.longHaulTruck.teleport({ ...point, y: ground.height + readDynamics().suspension.travel, speed: 14, groundHeight: ground.height, groundNormal: ground.normal });
    return { kind: 'actual-truck-endpoint', purpose: 'Start before the safe loading gate; collect by forward keyboard driving', progress };
  }));
  await page.keyboard.down('w'); await page.waitForFunction(() => freightState.onboard, null, { timeout: 30000 }); await page.keyboard.up('w');
  await page.waitForFunction(() => freightStationHosts.get(freightState.deliveryGate.id)?.visible, null, { timeout: 10000 });
  const loaded = await snapshot();
  check('A physical forward loading pass attaches cargo and starts its deadline', loaded.freight.onboard && loaded.cargoMass > 0 && loaded.cargoVisible && loaded.freight.contract.remaining > 0, loaded);
  await page.screenshot({ path: path.join(output, 'loaded.png') });
  async function missReceiver() {
    fixtures.push(await page.evaluate(() => {
      releaseDrivingInput(); forwardBoost.reset(); const progress = freightState.contract.deliveryProgress - 16, point = endlessHighwayPoint(course, progress, 30), ground = groundSample(point);
      engine.n.longHaulTruck.teleport({ ...point, y: ground.height + readDynamics().suspension.travel, speed: 16, groundHeight: ground.height, groundNormal: ground.normal });
      return { kind: 'actual-truck-endpoint', purpose: 'Drive past the marked receiver in an incorrect lateral lane', progress, lateral: 30 };
    }));
    await page.keyboard.down('w');
  }
  await missReceiver();
  await page.waitForFunction(() => freightState.contract.receiverMisses === 1, null, { timeout: 30000 }); await page.keyboard.up('w');
  await page.waitForFunction(() => Math.abs(freightStationHosts.get(freightState.deliveryGate.id)?.position.z - freightState.deliveryGate.point.z) < .01, null, { timeout: 10000 });
  const retry = await snapshot();
  check('A missed receiver offers one physical gate ahead with the same cargo', retry.freight.onboard && retry.freight.contract.id === loaded.freight.contract.id && retry.freight.contract.deliveryProgress > loaded.freight.contract.deliveryProgress + 200 && retry.freight.contract.receiverMisses === 1, retry);
  check('The blue receiver visual moves with the logical retry gate', retry.gate?.visible && retry.gate.id === loaded.gate.id && Math.abs(retry.gate.position[0] - retry.freight.deliveryGate.point.x) < .01 && Math.abs(retry.gate.position[2] - retry.freight.deliveryGate.point.z) < .01 && retry.gate.position[2] !== loaded.gate.position[2], { before: loaded.gate, after: retry.gate, expected: retry.freight.deliveryGate.point });
  await page.screenshot({ path: path.join(output, 'receiver-retry.png') });
  await missReceiver();
  await page.waitForFunction(() => freightState.lost === 1, null, { timeout: 30000 }); await page.keyboard.up('w');
  const lost = await snapshot();
  check('Missing the retry loses only the load and never pays a delivery', lost.scene === 'driving' && lost.run.status === 'running' && lost.freight.lost === 1 && !lost.freight.onboard && lost.cargoMass === 0 && lost.cash === loaded.cash && lost.freight.completed === 0, lost);
  await page.waitForFunction(() => freightState.status === 'awaiting-replacement', null, { timeout: 15000 });
  const replacement = await snapshot();
  check('Replacement cargo has a fresh contract and the same continuous journey', replacement.freight.sessionId === loaded.freight.sessionId && replacement.freight.contract.id !== loaded.freight.contract.id && !replacement.cargoVisible && !replacement.failed, replacement);
  await page.screenshot({ path: path.join(output, 'replacement.png') });
  check('No uncaught application errors', !observations.consoleLog.some(value => value.type === 'pageerror' || value.type === 'error' && !/favicon|404/.test(value.text)), observations.consoleLog);
  check('The exact application source remained unchanged', source.aggregate === (await sourceIdentity()).aggregate, source.aggregate);
} catch (error) { failure = String(error.stack || error); console.error(failure); await page?.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {}); }
finally { await browser?.close().catch(() => {}); await server?.close().catch(() => {}); }
await saveJson(path.join(output, 'report.json'), { verdict: failure ? 'fail' : 'pass', startedAt, completedAt: new Date().toISOString(), source, runtime, checks, fixtures, console: observations?.consoleLog, networkFailures: observations?.networkFailures, failure, boundary: 'Declared endpoint teleport fixtures followed by actual ordinary keyboard movement, actual freight rules and visible receiver hosts. Natural uninterrupted driving is validated separately.' });
console.log(JSON.stringify({ verdict: failure ? 'fail' : 'pass', output, failure })); if (failure) process.exitCode = 1;
