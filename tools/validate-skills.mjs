import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot, argValue, saveJson, sourceIdentity, serveProject, loadBrowser, preparePage, beginRun, gameSnapshot, webglEvidence } from './validate-gameplay.mjs';

// This suite drives the real local application. Setup fixtures select existing
// roads/encounters and a saved career balance; they never replace its physics,
// collision path, render scene, input loop or network responses.
export async function skillsBrowserSnapshot(page) {
  return page.evaluate(() => ({
    scene: currentScene(), run: structuredClone(readRun()), truck: structuredClone(readTruck()),
    skills: skillSnapshot(), progression: skillProgression.snapshot(), effects: skillProgression.effects(),
    abilities: activeAbilities.snapshot(), pickups: drivingPickups.snapshot(), steeringDamage: skillSteeringDamage,
    cargoMass: currentCargoMass(), dynamics: structuredClone(readDynamics()),
    appearance: { exhaustScaleY: truckRig?.skillParts?.exhausts.map(part => part.scale.y) ?? [], tireScale: truckRig?.wheels.map(wheel => wheel.scale.toArray()) ?? [] },
    meters: Object.fromEntries(['fuel', 'cargo-condition', 'truck-condition', 'remaining-time'].map(id => [id, meters.get(id)?.value])),
    input: engine.n.coreInput.getIntent(), keys: { ...keys }, frameFailed,
    menuOpen: skillMenuOpen(), risk: arcadeScore.snapshot(), boost: forwardBoost.snapshot(),
    weather: { time: arcadeWeatherTime, amount: arcadeWeatherAmount },
    traffic: arcadeVehicles.filter(vehicle => vehicle.active).map(vehicle => ({ id: vehicle.id, progress: vehicle.progress, speed: vehicle.speed, lane: vehicle.lane, position: vehicle.group.position.toArray(), disabled: vehicle.skillDisabled ?? null })),
    debris: debrisPool.filter(item => item.life > 0).map(item => ({ life: item.life, position: item.mesh.position.toArray() })),
    brokenProps: [...arcadeBrokenProps], recoveryGrace: arcadeRecoveryGrace,
    freight: typeof freightState !== 'undefined' ? structuredClone(freightState) : null,
    events: arcadeEventHistory.slice(-40),
  }));
}

function frozenFields(state) {
  // The run resource's transaction/observation sequence still increments when
  // the engine visits its paused system. It is not a gameplay clock or reward.
  const { sequence: observationSequence, ...run } = state.run;
  return {
    truck: state.truck, run, meters: state.meters,
    abilities: state.abilities, pickups: state.pickups, risk: state.risk,
    boost: state.boost, weather: state.weather, traffic: state.traffic,
    debris: state.debris, recoveryGrace: state.recoveryGrace, brokenProps: state.brokenProps, freight: state.freight,
  };
}

async function releaseKeys(page) {
  for (const key of ['w', 'a', 's', 'd', 'Shift', 'Space', 'x', 'q', 'e', 'u', 'f']) await page.keyboard.up(key);
}

async function openSkills(page) {
  if (!await page.evaluate(() => skillMenuOpen())) await page.keyboard.press('u');
  await page.waitForFunction(() => skillMenuOpen(), null, { timeout: 10000 });
}

async function closeSkills(page) {
  if (await page.evaluate(() => skillMenuOpen())) await page.keyboard.press('Escape');
  await page.waitForFunction(() => !skillMenuOpen(), null, { timeout: 10000 });
}

async function findChoice(page, id) {
  for (let index = 0; index < 16; index++) {
    const candidate = page.locator(`#skill-upgrade-panel [data-upgrade="${id}"]`);
    if (await candidate.count()) return candidate.first();
    await page.locator('#skill-upgrade-panel [data-skill-refresh]').click();
  }
  throw Error(`The three-choice menu never offered the eligible upgrade ${id}.`);
}

async function boundedCdp(session, method, parameters) {
  let timeout;
  try {
    return await Promise.race([session.send(method, parameters), new Promise((_, reject) => { timeout = setTimeout(() => reject(Error(`${method} did not finish within 15 seconds.`)), 15000); })]);
  } finally { clearTimeout(timeout); }
}

export async function validateActiveRunStorage(browser, url, { output, observations = [], check = (name, passed) => assert.ok(passed, name) } = {}) {
  const context = await browser.newContext({ viewport: { width: 960, height: 640 }, deviceScaleFactor: 1 });
  context.setDefaultTimeout(30000);
  const pages = [];
  const observe = page => page.evaluate(() => ({
    scene: currentScene(), status: readRun().status, menu: skillMenuOpen(), runId: skillRunId,
    model: skillProgression.snapshot(), savedRevision: skillSavedRevision, persistence: skillPersistence,
    raw: localStorage.getItem(SKILL_SAVE_KEY), storage: structuredClone(window.__skillStorageObservation), frameFailed,
  }));
  try {
    await context.addInitScript(() => {
      const key = 'longhaul-campaign-v1', originalSet = Storage.prototype.setItem;
      if (localStorage.getItem('longhaul-two-active-validation-seeded') !== '1') {
        originalSet.call(localStorage, key, JSON.stringify({ location: 'NJ', visited: ['NJ'], cash: 4321, truck: 'delivery', ownedTrucks: ['delivery'], upgrades: { engine: 2 }, deliveries: 3, careerMiles: 147, skillProgression: { version: 1, totalXp: 1200 } }));
        originalSet.call(localStorage, 'longhaul-two-active-validation-seeded', '1');
      }
      window.__skillStorageObservation = { writes: 0, events: 0 };
      Storage.prototype.setItem = function(name, value) {
        if (this === localStorage && name === key) window.__skillStorageObservation.writes++;
        return originalSet.call(this, name, value);
      };
      window.addEventListener('storage', event => { if (event.key === key) window.__skillStorageObservation.events++; });
    });
    for (const id of ['active-tab-A', 'active-tab-B']) {
      const observation = await preparePage(context, url, { returning: true }); observations.push(observation);
      const tab = observation.page; pages.push(tab);
      await beginRun(tab);
      if (await tab.evaluate(() => launchIntro.active)) await tab.keyboard.press('w');
      await tab.waitForFunction(() => !launchIntro.active && currentScene() === 'driving' && readRun().status === 'running', null, { timeout: 30000 });
      const award = await tab.evaluate(id => awardSkillEvent({ id, kind: 'near-miss', speed: 20, clearance: .8, clean: true, forward: true }), id);
      assert.equal(award.accepted, true, 'The declared receipt fixture must reach the real XP host.');
      await openSkills(tab);
    }
    const [a, b] = pages;
    await a.waitForFunction(() => skillProgression.snapshot().totalXp === JSON.parse(localStorage.getItem(SKILL_SAVE_KEY)).skillProgression.totalXp);
    const beforeIdle = await Promise.all(pages.map(observe));
    await b.waitForTimeout(650);
    const afterIdle = await Promise.all(pages.map(observe));
    check('Two live driving runs can keep Skills open without storage feedback or revision churn',
      afterIdle.every((state, index) => state.menu && state.scene === 'driving' && state.status === 'running' && !state.frameFailed && state.raw === beforeIdle[index].raw && JSON.stringify(state.storage) === JSON.stringify(beforeIdle[index].storage) && state.model.revision === beforeIdle[index].model.revision)
      && afterIdle[0].runId !== afterIdle[1].runId,
      { beforeIdle, afterIdle });
    check('An external active run preserves this tab’s maneuver receipts and imports the current shared XP',
      afterIdle.every((state, index) => state.model.runId === state.runId && state.model.seenIds.includes(index ? 'active-tab-B' : 'active-tab-A') && !state.model.seenIds.includes(index ? 'active-tab-A' : 'active-tab-B'))
      && afterIdle[0].model.totalXp === afterIdle[1].model.totalXp,
      afterIdle);
    const pointsBefore = afterIdle[1].model.points;
    await (await findChoice(b, 'engine')).click();
    await b.waitForFunction(() => !skillMenuOpen());
    await openSkills(b);
    await a.waitForFunction(() => skillProgression.snapshot().stats.engine === 1);
    const afterPurchase = await Promise.all(pages.map(observe));
    await b.waitForTimeout(650);
    const settled = await Promise.all(pages.map(observe));
    const writeDelta = settled.reduce((total, state, index) => total + state.storage.writes - afterIdle[index].storage.writes, 0);
    const eventDelta = settled.reduce((total, state, index) => total + state.storage.events - afterIdle[index].storage.events, 0);
    const raw = JSON.parse(settled[0].raw);
    check('One actual purchase converges both open driving menus with one write, one event and one point spent',
      writeDelta === 1 && eventDelta === 1 && settled[0].raw === settled[1].raw
      && settled.every((state, index) => state.menu && state.model.stats.engine === 1 && state.model.points === pointsBefore - 1 && state.model.totalXp === afterIdle[index].model.totalXp && state.raw === afterPurchase[index].raw && JSON.stringify(state.storage) === JSON.stringify(afterPurchase[index].storage) && state.savedRevision === raw.skillProgression.revision)
      && raw.cash === 4321 && raw.upgrades.engine === 2,
      { afterPurchase, settled, writeDelta, eventDelta });
    const duplicates = await Promise.all(pages.map((tab, index) => tab.evaluate(id => {
      const before = skillProgression.snapshot().totalXp;
      const result = skillProgression.event({ id, kind: 'near-miss', speed: 20, clearance: .8, clean: true, forward: true, active: true });
      return { before, after: skillProgression.snapshot().totalXp, result };
    }, index ? 'active-tab-B' : 'active-tab-A')));
    check('A real cross-tab purchase cannot make either active run replay its previous maneuver reward', duplicates.every(value => !value.result.accepted && value.result.reason === 'duplicate' && value.before === value.after), duplicates);
    if (output) await a.screenshot({ path: path.join(output, 'two-active-run-upgrades.png') });
    return { beforeIdle, afterIdle, afterPurchase, settled, writeDelta, eventDelta, duplicates };
  } catch (error) {
    if (output) {
      await saveJson(path.join(output, 'two-active-run-failure.json'), { error: String(error.stack || error), tabs: await Promise.all(pages.map(tab => observe(tab).catch(() => null))) });
      await pages.at(-1)?.screenshot({ path: path.join(output, 'two-active-run-failure.png') }).catch(() => {});
    }
    throw error;
  } finally { await context.close(); }
}

export async function validateSkills() {
  const output = path.resolve(argValue('--output', path.join(projectRoot, '.cache/validation', 'skills-' + new Date().toISOString().replace(/[:.]/g, '-'))));
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output, { recursive: false });
  const startedAt = new Date().toISOString(), source = await sourceIdentity();
  const checks = [], fixtures = [], states = {}, observations = [];
  let server, browser, runtime, page, diagnosticPage, failure = null, cleaned = false;
  const check = (name, passed, evidence = null) => { checks.push({ name, passed: Boolean(passed), evidence }); console.log(JSON.stringify({ check: name, passed: Boolean(passed) })); assert.ok(passed, name); };
  const fixture = async (description, action, argument) => {
    fixtures.push({ description, at: new Date().toISOString(), boundary: 'Declared setup using the actual application services/state; subsequent acceptance uses the production input and simulation path.' });
    return page.evaluate(action, argument);
  };
  const screenshot = async name => page.screenshot({ path: path.join(output, name + '.png') });
  const awaitTeleport = async point => page.waitForFunction(point => Math.hypot(readTruck().position.x - point.x, readTruck().position.z - point.z) < 4 && readTruck().grounded, point, { timeout: 20000 });
  const roadFixture = async (speed = 30, distance = 120) => {
    const placed = await fixture('Position the actual truck on the generated highway at a known initial speed; the maneuver itself uses normal keyboard input.', ({ speed, distance }) => {
    releaseDrivingInput(); forwardBoost.reset();
    const route = arcadeNetwork.paths.find(route => route.id.startsWith('trunk:')) ?? arcadeNetwork.paths[0];
    const point = course.endless ? endlessHighwayPoint(course, distance) : arcadePathPoint(route, distance, 0), ground = groundSample(point), surface = surfaceAt(point);
    engine.n.longHaulTruck.teleport({ ...point, y: ground.height + readDynamics().suspension.travel, speed, groundHeight: ground.height, groundNormal: ground.normal, surface: surface.surface, surfaceGrip: surface.grip });
    for (const vehicle of arcadeVehicles) vehicle.active = false;
    return { route: route.id, point, speed, surface: surface.surface, cargoMass: currentCargoMass() };
    }, { speed, distance });
    await awaitTeleport(placed.point);
    return placed;
  };

  await saveJson(path.join(output, 'target-lock.json'), { startedAt, source, target: projectRoot, scope: 'Skill, drift, upgrade, ability, pickup, damage, input and persistence integration.' });
  try {
    server = await serveProject(); ({ browser, runtime } = await loadBrowser());
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    context.setDefaultTimeout(30000);
    fixtures.push({ description: 'Seed an existing career with $4,321, two legacy engine upgrades and 1,200 previously earned XP so every purchase path can be reviewed without hours of farming.', boundary: 'Saved-career setup; this experience is not claimed as naturally earned during this run.' });
    await context.addInitScript(() => {
      if (localStorage.getItem('longhaul-skills-validation-seeded') === '1') return;
      localStorage.setItem('longhaul-campaign-v1', JSON.stringify({ location: 'NJ', visited: ['NJ'], cash: 4321, truck: 'delivery', ownedTrucks: ['delivery'], upgrades: { engine: 2, tires: 1 }, deliveries: 3, careerMiles: 147, skillProgression: { version: 1, totalXp: 1200 } }));
      localStorage.setItem('longhaul-skills-validation-seeded', '1');
    });
    const observation = await preparePage(context, server.url, { returning: true }); observations.push(observation); page = diagnosticPage = observation.page;
    await beginRun(page);
    if (await page.evaluate(() => launchIntro.active)) await page.keyboard.press('w');
    await page.waitForFunction(() => !launchIntro.active && readRun().status === 'running' && typeof skillSnapshot === 'function', null, { timeout: 30000 });
    states.entry = await skillsBrowserSnapshot(page);
    check('The current source boots with all skill systems attached to the actual game', !states.entry.frameFailed && states.entry.cargoMass === (states.entry.truck.cargo?.massKg ?? 0) && states.entry.abilities.slots.q === 'mini-trucks' && states.entry.abilities.slots.e === 'road-shield', states.entry.skills);
    const gl = await webglEvidence(page); await saveJson(path.join(output, 'webgl-render-report.json'), gl);
    check('The integrated game renders nonempty software WebGL pixels', gl.available && !gl.lost && /SwiftShader/i.test(gl.renderer) && gl.pixels.distinctColors > 40, gl);
    const mapping = await page.evaluate(() => Object.fromEntries(Object.entries(LONG_HAUL_CONTROLS).map(([key, value]) => [key, value.keys])));
    check('Shift drift, Space boost, Q/E abilities and F interaction have distinct bindings', mapping.drift.includes('ShiftLeft') && mapping.boost.includes('Space') && mapping.abilityQ.includes('KeyQ') && mapping.abilityE.includes('KeyE') && mapping.interact.includes('KeyF') && !mapping.interact.includes('KeyE'), mapping);

    const loadingSetup = await fixture('Position before the current real wide loading gate. Keyboard acceleration must cross it and load authoritative freight cargo before drift testing.', () => {
      releaseDrivingInput(); forwardBoost.reset();
      const gate = freightState.pickupStation.safe, point = gate.point;
      const start = { x: point.x - Math.sin(point.heading) * 18, z: point.z - Math.cos(point.heading) * 18 }, ground = groundSample(start), surface = surfaceAt(start);
      engine.n.longHaulTruck.teleport({ ...start, heading: point.heading, y: ground.height + readDynamics().suspension.travel, speed: 12, groundHeight: ground.height, groundNormal: ground.normal, surface: surface.surface, surfaceGrip: surface.grip });
      freightJourney.resetPosition();
      return { station: freightState.pickupStation.id, gate: point, start };
    });
    await awaitTeleport(loadingSetup.start);
    await page.keyboard.down('w');
    await page.waitForFunction(() => freightState.onboard && readTruck().cargo?.massKg > 0, null, { timeout: 20000 });
    await page.keyboard.up('w');
    states.loaded = await skillsBrowserSnapshot(page);
    check('Driving through a real loading gate gives the truck the same cargo owned by the continuous journey', states.loaded.cargoMass === states.loaded.freight.cargo.massKg && states.loaded.truck.cargo.profileId === states.loaded.freight.cargo.id && states.loaded.run.status === 'running', { loadingSetup, cargo: states.loaded.truck.cargo, freight: states.loaded.freight });

    await roadFixture(30);
    await page.waitForFunction(() => readTruck().speed > 28);
    const driftBefore = await skillsBrowserSnapshot(page);
    await page.keyboard.down('s'); await page.keyboard.down('a');
    await page.waitForFunction(() => readTruck().drift.active && readTruck().drift.duration >= .6 && readTruck().drift.momentum > 2, null, { timeout: 15000 });
    states.slide = await skillsBrowserSnapshot(page);
    check('Normal brake-and-steer input creates lateral slide, weight transfer and a finite reserve while losing speed', states.slide.truck.speed < driftBefore.truck.speed && Math.abs(states.slide.truck.lateralSpeed) > 1 && states.slide.truck.weightTransfer > .1 && states.slide.truck.drift.momentum > 2, { before: driftBefore.truck, slide: states.slide.truck });
    await page.keyboard.up('s'); await page.keyboard.up('a'); await page.keyboard.down('d');
    await page.waitForFunction(previous => readTruck().drift.releaseSequence > previous, driftBefore.truck.drift.releaseSequence, { timeout: 15000 });
    await page.keyboard.up('d');
    states.release = await skillsBrowserSnapshot(page); await screenshot('countersteer-release');
    check('Opposite steering redirects the stored reserve once and earns skill XP', states.release.truck.drift.lastManeuver?.countersteer && states.release.truck.drift.momentum === 0 && states.release.progression.totalXp > driftBefore.progression.totalXp && Math.hypot(states.release.truck.velocity.x, states.release.truck.velocity.z) <= 31, { beforeXp: driftBefore.progression.totalXp, after: states.release });
    const duplicate = await fixture('Replay the completed maneuver ID through the real XP ledger to verify duplicate rejection.', () => {
      const before = skillProgression.snapshot(), event = before.lastAward;
      const result = skillProgression.event({ id: event.id, kind: event.kind, speed: 30, duration: 1, distance: 20, angle: .5, reserve: 8, exitSpeed: 24, active: true, clean: true, forward: true });
      return { before: before.totalXp, after: skillProgression.snapshot().totalXp, result };
    });
    check('A repeated physical maneuver ID cannot award XP twice', !duplicate.result.accepted && duplicate.result.reason === 'duplicate' && duplicate.before === duplicate.after, duplicate);

    await roadFixture(20, 130); await page.waitForFunction(() => readTruck().speed > 18);
    const stopSequence = await page.evaluate(() => readTruck().drift.releaseSequence);
    await page.keyboard.down('Shift'); await page.keyboard.down('a');
    await page.waitForFunction(() => readTruck().drift.active && readTruck().drift.momentum > 1, null, { timeout: 12000 });
    check('Shift explicitly requests drift without consuming the boost binding', await page.evaluate(() => engine.n.coreInput.getIntent().drift && !engine.n.coreInput.getIntent().boost));
    await page.keyboard.up('Shift'); await page.keyboard.up('a'); await page.keyboard.down('s'); await page.keyboard.down('x');
    await page.waitForFunction(() => readTruck().longitudinalSpeed < .8, null, { timeout: 15000 });
    await page.keyboard.up('s');
    await page.waitForFunction(() => Math.hypot(readTruck().velocity.x, readTruck().velocity.z) < .3, null, { timeout: 30000 });
    await page.keyboard.up('x');
    states.stopped = await skillsBrowserSnapshot(page);
    await page.keyboard.down('d'); await page.waitForTimeout(350); await page.keyboard.up('d');
    check('A complete stop expires momentum and countersteering cannot resurrect it', states.stopped.truck.drift.momentum === 0 && !states.stopped.truck.drift.active && await page.evaluate(sequence => readTruck().drift.releaseSequence === sequence, stopSequence), states.stopped.truck);

    const miniSetup = await fixture('Position the truck 24 metres before an existing generated breakable encounter. Its real meshes and collision records remain in use.', () => {
      releaseDrivingInput(); forwardBoost.reset(); activeAbilities.reset({ slots: skillProgression.snapshot().slots, levels: skillProgression.snapshot().abilities });
      const event = arcadeEncounters.find(event => event.kind === 'breakables');
      if (!event) return null;
      const host = arcadeEncounterHosts.get(event.id) ?? createEncounterHost(event);
      const point = arcadePathPoint(event.path, event.distance - 24, event.lane), ground = groundSample(point), surface = surfaceAt(point);
      engine.n.longHaulTruck.teleport({ ...point, y: ground.height + readDynamics().suspension.travel, speed: 10, groundHeight: ground.height, groundNormal: ground.normal, surface: surface.surface, surfaceGrip: surface.grip });
      return { event: event.id, propIds: host.props.map(prop => prop.id), point };
    });
    check('The ability scenario targets actual generated obstacles', miniSetup?.propIds.length > 0, miniSetup);
    await awaitTeleport(miniSetup.point);
    await page.keyboard.press('q');
    await page.waitForFunction(() => activeAbilities.snapshot().activations > 0 && activeAbilities.snapshot().miniTrucks.length > 0, null, { timeout: 12000 });
    states.minis = await skillsBrowserSnapshot(page); await screenshot('mini-trucks');
    await page.waitForFunction(ids => ids.some(id => arcadeBrokenProps.has(id)), miniSetup.propIds, { timeout: 18000 });
    states.miniImpact = await skillsBrowserSnapshot(page);
    check('Q launches Mini Trucks that break real encounter obstacles through the host collision path', states.miniImpact.abilities.hits > 0 && miniSetup.propIds.some(id => states.miniImpact.brokenProps.includes(id)), states.miniImpact);
    const miniActivations = states.miniImpact.abilities.activations;
    await page.keyboard.press('q');
    check('Repeated Q cannot bypass its cooldown', (await skillsBrowserSnapshot(page)).abilities.activations === miniActivations);
    await page.waitForFunction(() => activeAbilities.snapshot().miniTrucks.length === 0, null, { timeout: 20000 });
    check('All deployed Mini Trucks clean up within their bounded lifetime', (await skillsBrowserSnapshot(page)).abilities.miniTrucks.length === 0);
    await page.keyboard.press('e');
    await page.waitForFunction(() => activeAbilities.snapshot().shield.charges > 0);
    const shieldEvidence = await fixture('Apply one ordinary impact through the real hull/cargo damage services while Road Shield is active.', () => {
      const before = { hull: meters.get('truck-condition').value, cargo: meters.get('cargo-condition').value, shield: activeAbilities.snapshot().shield };
      spendTruckDamage(12, 'skill-validation-impact'); spendCargoDamage(4, 'skill-validation-impact');
      return { before, after: { hull: meters.get('truck-condition').value, cargo: meters.get('cargo-condition').value, shield: activeAbilities.snapshot().shield } };
    });
    check('E activates a distinct ability and its protection changes actual impact consequences', shieldEvidence.after.hull === shieldEvidence.before.hull && shieldEvidence.after.cargo === shieldEvidence.before.cargo && shieldEvidence.after.shield.charges < shieldEvidence.before.shield.charges, shieldEvidence);

    await roadFixture(22, 160); await page.waitForFunction(() => readTruck().speed > 20);
    await fixture('Prime temporary pickup, combo and ability clocks to prove the full upgrade-menu pause contract.', () => {
      activeAbilities.reset({ slots: skillProgression.snapshot().slots, levels: skillProgression.snapshot().abilities });
      drivingPickups.collect({ id: 'acceptance:freeze-boost', kind: 'boost', distance: 0, active: true });
      drivingPickups.collect({ id: 'acceptance:freeze-ability', kind: 'ability', distance: 0, active: true });
      drivingPickups.collect({ id: 'acceptance:freeze-focus', kind: 'focus', distance: 0, active: true });
      arcadeScore.tick(0, { active: true }); arcadeScore.event({ id: 'acceptance:freeze-combo', kind: 'near-miss', speed: 25, clearance: .8, clean: true, active: true });
    });
    await page.keyboard.press('q'); await page.keyboard.press('e');
    await page.keyboard.down('w'); await page.keyboard.down('Space');
    await page.waitForFunction(() => engine.n.coreInput.getIntent().boost && !engine.n.coreInput.getIntent().drift);
    check('Space preserves ordinary boost independently of Shift drift', await page.evaluate(() => engine.n.coreInput.getIntent().boost));
    await openSkills(page); await releaseKeys(page);
    states.frozen = await skillsBrowserSnapshot(page);
    await page.keyboard.press('q'); await page.keyboard.press('e'); await page.keyboard.press('Shift'); await page.keyboard.press('w');
    await page.waitForTimeout(650);
    states.stillFrozen = await skillsBrowserSnapshot(page); await screenshot('three-choice-upgrade');
    check('U freezes exact vehicle motion, run/resource meters, hazards, combo, boost, pickups and ability time', JSON.stringify(frozenFields(states.frozen)) === JSON.stringify(frozenFields(states.stillFrozen)), { before: frozenFields(states.frozen), after: frozenFields(states.stillFrozen) });
    check('Open menus discard driving and ability inputs without latched keys', !Object.values(states.stillFrozen.keys).some(Boolean) && states.stillFrozen.input.throttle === 0 && !states.stillFrozen.input.boost && states.stillFrozen.abilities.activations === states.frozen.abilities.activations, { keys: states.stillFrozen.keys, input: states.stillFrozen.input });
    const cards = await page.locator('#skill-upgrade-panel .skill-choice').evaluateAll(nodes => nodes.map(node => ({ id: node.querySelector('[data-upgrade]').dataset.upgrade, text: node.textContent, disabled: node.querySelector('[data-upgrade]').disabled })));
    check('The upgrade menu presents exactly three actionable choices with practical effects', cards.length === 3 && cards.every(card => card.text.length > 35), cards);
    const engineChoice = await findChoice(page, 'engine');
    const beforePurchase = await skillsBrowserSnapshot(page);
    await engineChoice.click(); await page.waitForFunction(() => !skillMenuOpen());
    await page.waitForFunction(before => readDynamics().engineAcceleration > before, beforePurchase.dynamics.engineAcceleration);
    states.purchased = await skillsBrowserSnapshot(page);
    check('Buying one selected stat spends points, changes actual vehicle dynamics and visibly enlarges the exhaust geometry', states.purchased.progression.stats.engine === beforePurchase.progression.stats.engine + 1 && states.purchased.progression.points < beforePurchase.progression.points && states.purchased.dynamics.engineAcceleration > beforePurchase.dynamics.engineAcceleration && states.purchased.appearance.exhaustScaleY.length === 2 && states.purchased.appearance.exhaustScaleY.every((value, index) => value > beforePurchase.appearance.exhaustScaleY[index]), { before: beforePurchase, after: states.purchased });
    check('Upgrade resume preserves the existing truck trajectory without a teleport or stale throttle', Math.hypot(states.purchased.truck.position.x - beforePurchase.truck.position.x, states.purchased.truck.position.z - beforePurchase.truck.position.z) < 10 && states.purchased.input.throttle === 0 && !states.purchased.frameFailed, { before: beforePurchase.truck, after: states.purchased.truck });

    await openSkills(page);
    await findChoice(page, 'shockwave');
    await page.locator('#skill-upgrade-panel [data-upgrade="shockwave"][data-slot="q"]').click();
    await page.waitForFunction(() => !skillMenuOpen() && activeAbilities.snapshot().slots.q === 'shockwave');
    states.equipped = await skillsBrowserSnapshot(page);
    check('A newly acquired third ability replaces the selected Q slot and preserves E', states.equipped.progression.slots.q === 'shockwave' && states.equipped.abilities.slots.q === 'shockwave' && states.equipped.abilities.slots.e === 'road-shield' && states.equipped.progression.abilities.shockwave === 1, states.equipped.skills);
    await roadFixture(0, 170);
    const pulseSetup = await fixture('Position one existing traffic pool host 12 metres behind at rest to observe the new radial Shockwave through real road placement and collision services, clear of the preceding forward Mini Trucks.', () => {
      const truck = readTruck(), road = nearestRoad(course, truck.position), progress = arcadeRoadProgress(road, arcadeNetwork), vehicle = arcadeVehicles[0];
      const direction = arcadeRoadForward(road, truck.heading);
      Object.assign(vehicle, { active: true, path: progress.path, progress: progress.distance - direction * 12, direction, speed: 0, lane: 0, hit: false, passed: false, skillDisabled: 0 });
      return { id: vehicle.id, lane: vehicle.lane };
    });
    await page.waitForFunction(id => {
      const vehicle = arcadeVehicles.find(vehicle => vehicle.id === id);
      return vehicle?.group.visible && Math.hypot(vehicle.group.position.x - readTruck().position.x, vehicle.group.position.z - readTruck().position.z) < 14;
    }, pulseSetup.id);
    await page.keyboard.press('q'); await page.waitForFunction(() => activeAbilities.snapshot().cooldowns.shockwave > 0);
    await page.waitForFunction(id => arcadeEventHistory.some(event => event.type === 'ability-hit' && event.abilityId === 'shockwave' && event.obstacleId === id), pulseSetup.id, { timeout: 15000 });
    const pulseImpact = await page.evaluate(id => {
      const vehicle = arcadeVehicles.find(vehicle => vehicle.id === id);
      return { id, lane: vehicle?.lane, disabled: vehicle?.skillDisabled, hit: vehicle?.hit, events: arcadeEventHistory.filter(event => event.type === 'ability-hit' && event.abilityId === 'shockwave' && event.obstacleId === id) };
    }, pulseSetup.id);
    check('The acquired Shockwave pushes and briefly disables an actual traffic vehicle without destroying its host', pulseImpact.events.length === 1 && pulseImpact.hit && pulseImpact.disabled > 0 && pulseImpact.lane !== pulseSetup.lane && !pulseImpact.events[0].destroy, { pulseSetup, pulseImpact });
    states.pulseImpact = pulseImpact;
    await screenshot('equipped-shockwave');

    await openSkills(page);
    const beforeEquip = await skillsBrowserSnapshot(page);
    await page.locator('#skill-upgrade-panel [data-equip="mini-trucks"][data-slot="q"]').click();
    const afterEquip = await skillsBrowserSnapshot(page);
    check('Previously acquired abilities can be re-equipped without resetting cooldowns or spending points', afterEquip.progression.slots.q === 'mini-trucks' && afterEquip.progression.points === beforeEquip.progression.points && afterEquip.abilities.cooldowns.shockwave === beforeEquip.abilities.cooldowns.shockwave, { before: beforeEquip.abilities, after: afterEquip.abilities });
    await closeSkills(page);

    await roadFixture(20, 110); await page.waitForFunction(() => readTruck().speed > 18);
    const damageSetup = await fixture('Apply an ordinary unshielded traffic-strength impact through the real damage service to assess recoverable steering pull.', () => {
      activeAbilities.reset({ slots: skillProgression.snapshot().slots, levels: skillProgression.snapshot().abilities });
      meters.restore('truck-condition', 100, 'acceptance-reset'); meters.restore('cargo-condition', 100, 'acceptance-reset');
      const heading = readTruck().heading;
      spendTruckDamage(18, 'traffic-collision');
      return { heading, steeringDamage: skillSteeringDamage, time: readRun().rawTime };
    });
    await page.keyboard.down('w');
    await page.waitForFunction(start => readRun().rawTime >= start + .7, damageSetup.time, { timeout: 15000 });
    states.damaged = await skillsBrowserSnapshot(page);
    const pullAngle = Math.atan2(Math.sin(states.damaged.truck.heading - damageSetup.heading), Math.cos(states.damaged.truck.heading - damageSetup.heading));
    check('Steering damage causes predictable physical pull', Math.abs(states.damaged.steeringDamage) > .12 && Math.sign(pullAngle) === Math.sign(states.damaged.steeringDamage), { damageSetup, after: states.damaged.truck, pullAngle });
    const correction = states.damaged.steeringDamage > 0 ? 'd' : 'a';
    await page.keyboard.down(correction);
    await page.waitForFunction(sign => Math.sign(readTruck().yawRate) === -sign && Math.abs(readTruck().yawRate) > .03, Math.sign(states.damaged.steeringDamage), { timeout: 10000 });
    check('Normal opposing steering remains stronger than the damage pull', true, await page.evaluate(() => ({ yawRate: readTruck().yawRate, damage: skillSteeringDamage })));
    await releaseKeys(page);

    const pickupResults = [];
    for (const kind of ['focus', 'boost', 'ability', 'repair']) {
      const setup = await fixture(`Place the truck before one uncollected generated ${kind} pickup; driving across it uses the ordinary swept pickup path.`, kind => {
        releaseDrivingInput(); forwardBoost.reset(); planSkillPickups();
        const pickup = skillPickupPlan.find(pickup => pickup.kind === kind && !drivingPickups.has(pickup.id));
        if (!pickup) return null;
        const point = pickup.point, start = { x: point.x - Math.sin(point.heading) * 10, z: point.z - Math.cos(point.heading) * 10 }, ground = groundSample(start), surface = surfaceAt(start);
        engine.n.longHaulTruck.teleport({ ...start, heading: point.heading, y: ground.height + readDynamics().suspension.travel, speed: 7, groundHeight: ground.height, groundNormal: ground.normal, surface: surface.surface, surfaceGrip: surface.grip });
        return { id: pickup.id, kind, point, start, before: { pickups: drivingPickups.snapshot(), steeringDamage: skillSteeringDamage, hull: meters.get('truck-condition').value } };
      }, kind);
      check(`A generated ${kind} pickup exists`, Boolean(setup), setup);
      await awaitTeleport(setup.start);
      await page.keyboard.down('w');
      await page.waitForFunction(id => drivingPickups.has(id), setup.id, { timeout: 20000 });
      await page.keyboard.up('w');
      const after = await skillsBrowserSnapshot(page);
      const applied = kind === 'repair' ? after.steeringDamage === 0 && after.meters['truck-condition'] > setup.before.hull : after.pickups.timers[kind] > 0;
      check(`Driving through ${kind} applies its real mechanical effect once`, applied && await page.evaluate(id => drivingPickups.has(id), setup.id), { setup, after: { pickups: after.pickups, steeringDamage: after.steeringDamage, meters: after.meters } });
      const duplicate = await fixture('Attempt to collect the already consumed pickup ID again through its public host function.', value => ({ receipt: collectSkillPickup(value, 0, 0), after: drivingPickups.snapshot() }), { id: setup.id, kind });
      check(`The consumed ${kind} pickup cannot be replayed`, !duplicate.receipt.accepted && duplicate.after.collected === after.pickups.collected, duplicate);
      pickupResults.push({ setup, after, duplicate });
    }
    states.pickups = pickupResults; await screenshot('collectibles-and-repair');

    await roadFixture(0, 140); await page.waitForFunction(() => Math.abs(readTruck().speed) < 1);
    const recoverySetup = await fixture('Apply a second unshielded impact to exercise the accessible F steering-repair path from a stopped highway truck.', () => {
      activeAbilities.reset({ slots: skillProgression.snapshot().slots, levels: skillProgression.snapshot().abilities });
      spendTruckDamage(18, 'traffic-collision');
      return { damage: skillSteeringDamage, recoveryCount: readRun().recoveryCount, recoveryUsed: readRun().recoveryUsed, penaltyTotal: readRun().penaltyTotal, activations: activeAbilities.snapshot().activations };
    });
    await page.keyboard.press('f');
    await page.waitForFunction(before => skillSteeringDamage === 0 && readRun().penaltyTotal > before, recoverySetup.penaltyTotal, { timeout: 10000 });
    states.recovered = await skillsBrowserSnapshot(page); await screenshot('steering-recovery');
    check('F restores steering with a disclosed time cost while preserving emergency rescue and Q/E state', states.recovered.steeringDamage === 0 && states.recovered.run.penaltyTotal === recoverySetup.penaltyTotal + 5 && states.recovered.run.recoveryCount === recoverySetup.recoveryCount && states.recovered.run.recoveryUsed === recoverySetup.recoveryUsed && states.recovered.abilities.activations === recoverySetup.activations && !states.recovered.truck.tipped, { recoverySetup, after: states.recovered });
    await page.keyboard.down('w'); await page.keyboard.down('Shift');
    await page.waitForFunction(() => keys.KeyW && keys.ShiftLeft);
    await fixture('Deliver the browser blur event to exercise the same focus-loss cancellation listener used by the application.', () => window.dispatchEvent(new Event('blur')));
    await page.waitForFunction(() => !Object.values(keys).some(Boolean) && engine.n.coreInput.getIntent().throttle === 0 && !engine.n.coreInput.getIntent().drift);
    await releaseKeys(page);
    check('Focus loss cancels throttle, drift and held input cleanly', true, (await skillsBrowserSnapshot(page)).input);
    if (await page.evaluate(() => currentScene() === 'paused')) {
      await page.locator('#resume-btn').click();
      await page.waitForFunction(() => currentScene() === 'driving' && readRun().status === 'running');
    }

    // A real second tab writes a newer revision. The visible menu must either
    // refresh safely or refuse a stale purchase without losing external fields.
    await openSkills(page);
    const secondObservation = await preparePage(context, server.url, { returning: true }); observations.push(secondObservation);
    const external = await secondObservation.page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem('longhaul-campaign-v1'));
      save.cash += 333; save.skillProgression.totalXp += 1000; save.skillProgression.revision += 1;
      localStorage.setItem('longhaul-campaign-v1', JSON.stringify(save));
      return { cash: save.cash, totalXp: save.skillProgression.totalXp, revision: save.skillProgression.revision };
    });
    await page.bringToFront();
    await page.waitForFunction(xp => skillProgression.snapshot().totalXp >= xp, external.totalXp, { timeout: 10000 });
    const externalChoice = await findChoice(page, 'engine'); await externalChoice.click();
    await page.waitForFunction(() => !skillMenuOpen());
    const merged = await page.evaluate(() => JSON.parse(localStorage.getItem('longhaul-campaign-v1')));
    check('A real cross-tab update preserves newer XP and cash during the next purchase', merged.cash === external.cash && merged.skillProgression.totalXp >= external.totalXp && merged.skillProgression.revision > external.revision, { external, merged });
    await secondObservation.page.close();
    await openSkills(page);
    const race = await fixture('Commit a newer saved revision between the current menu read and its synchronous purchase, exercising the persistence lease check.', () => {
      const before = skillProgression.snapshot(), save = JSON.parse(localStorage.getItem(SKILL_SAVE_KEY));
      save.skillProgression.revision += 10; save.skillProgression.totalXp += 50;
      const raw = JSON.stringify(save); localStorage.setItem(SKILL_SAVE_KEY, raw);
      const result = skillPurchase('engine');
      return { result, before, after: skillProgression.snapshot(), externalPreserved: localStorage.getItem(SKILL_SAVE_KEY) === raw, persistence: skillPersistence };
    });
    check('A stale persistence revision rejects the purchase without spending points or overwriting the newer save', !race.result.accepted && race.result.reason === 'conflict' && race.before.points === race.after.points && race.before.stats.engine === race.after.stats.engine && race.externalPreserved, race);
    await closeSkills(page); await openSkills(page); await closeSkills(page);
    await fixture('Prime resumable ability, pickup and steering state through actual host services, then save while U freezes the simulation.', () => {
      activeAbilities.reset({ slots: skillProgression.snapshot().slots, levels: skillProgression.snapshot().abilities });
      spendTruckDamage(12, 'resume-impact');
      collectSkillPickup({ id: 'acceptance:resume-boost', kind: 'boost' });
      collectSkillPickup({ id: 'acceptance:resume-ability', kind: 'ability' });
    });
    await page.keyboard.press('q'); await page.keyboard.press('e');
    await page.waitForFunction(() => activeAbilities.snapshot().cooldowns['mini-trucks'] > 0 && activeAbilities.snapshot().cooldowns['road-shield'] > 0);
    await openSkills(page);
    const resumeCheckpoint = await page.evaluate(() => ({ saved: saveFreightCheckpoint(), skills: skillSnapshot(), payload: JSON.parse(localStorage.getItem(SKILL_SAVE_KEY)).freightJourney }));
    check('A frozen continuous-haul checkpoint includes remaining ability and pickup state', resumeCheckpoint.saved && resumeCheckpoint.payload.skillState.abilities.cooldowns['mini-trucks'] > 0 && resumeCheckpoint.payload.skillState.pickups.timers.boost > 0, resumeCheckpoint.payload.skillState);
    const persisted = await page.evaluate(() => ({ model: skillProgression.snapshot(), raw: JSON.parse(localStorage.getItem(SKILL_SAVE_KEY)) }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__longHaulBooted && currentScene() === 'title');
    const reloaded = await page.evaluate(() => ({ model: skillProgression.snapshot(), raw: JSON.parse(localStorage.getItem(SKILL_SAVE_KEY)), frameFailed }));
    check('Purchased tiers, XP and selected slots survive reload alongside existing cash, garage upgrades and earnings', !reloaded.frameFailed && reloaded.model.totalXp === persisted.model.totalXp && JSON.stringify(reloaded.model.stats) === JSON.stringify(persisted.model.stats) && JSON.stringify(reloaded.model.slots) === JSON.stringify(persisted.model.slots) && reloaded.raw.cash === persisted.raw.cash && reloaded.raw.upgrades.engine === 2 && reloaded.raw.deliveries === persisted.raw.deliveries && reloaded.raw.careerMiles === persisted.raw.careerMiles && reloaded.raw.careerMiles >= 147, { persisted, reloaded });
    fixtures.push({ description: 'Wrap the real finishLaunchIntro only to take an immediate read-only observation after its restore; the original function and normal simulation remain unchanged.', boundary: 'Read-only timing instrumentation for exact pre-tick resume evidence.' });
    await page.evaluate(() => {
      const original = finishLaunchIntro;
      finishLaunchIntro = function(...args) {
        const result = original.apply(this, args);
        if (!launchIntro.active && freightState) window.__skillResumeObservation = { skills: skillSnapshot(), truck: structuredClone(readTruck()), freight: structuredClone(freightState) };
        return result;
      };
    });
    await page.locator('#freight-resume-btn').click();
    await page.waitForFunction(() => window.__skillResumeObservation && readRun().status === 'running', null, { timeout: 120000 });
    const resumed = await page.evaluate(() => window.__skillResumeObservation);
    check('Resume preserves exact XP, remaining cooldowns, pickup timers and steering damage before the first driving tick', resumed.skills.progression.totalXp === resumeCheckpoint.skills.progression.totalXp && JSON.stringify(resumed.skills.abilities.cooldowns) === JSON.stringify(resumeCheckpoint.skills.abilities.cooldowns) && JSON.stringify(resumed.skills.pickups.timers) === JSON.stringify(resumeCheckpoint.skills.pickups.timers) && resumed.skills.steeringDamage === resumeCheckpoint.skills.steeringDamage && resumed.skills.progression.runId === resumeCheckpoint.skills.progression.runId, { before: resumeCheckpoint.skills, resumed: resumed.skills });
    check('Resume retires traveling ability effects so already resolved impacts cannot replay', resumed.skills.abilities.miniTrucks.length === 0 && resumed.skills.abilities.pulses.length === 0 && JSON.stringify(resumed.skills.abilities.shield) === JSON.stringify(resumeCheckpoint.skills.abilities.shield), resumed.skills.abilities);
    states.persistence = { external, merged, race, persisted, reloaded, resumeCheckpoint, resumed };

    fixtures.push({ description: 'Open two independent active driving runs in one isolated browser context, each with one declared qualified near-miss receipt and a 1,200 XP saved career. Count career writes/events without changing storage behavior; buy one engine tier through its real menu.', boundary: 'Separate shared-storage fixture to exercise active run scopes, read-only refresh and purchase convergence; no earned-XP or human-play claim.' });
    states.activeTabs = await validateActiveRunStorage(browser, server.url, { output, observations, check });

    for (const storageMode of ['corrupt', 'unavailable', 'legacy']) {
      const storageContext = await browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
      storageContext.setDefaultTimeout(30000);
      await storageContext.addInitScript(mode => {
        const key = 'longhaul-campaign-v1', originalGet = Storage.prototype.getItem, originalSet = Storage.prototype.setItem;
        const raw = mode === 'corrupt' ? '{"cash":1234,' : JSON.stringify({ cash: 1234, upgrades: { engine: 3 }, deliveries: 4, careerMiles: 222, location: 'NJ' });
        originalSet.call(localStorage, key, raw);
        window.__skillAcceptanceStored = () => originalGet.call(localStorage, key);
        window.__skillAcceptanceInitial = raw;
        if (mode === 'unavailable') {
          Storage.prototype.getItem = function(name) { if (name === key) throw new DOMException('Acceptance storage unavailable', 'SecurityError'); return originalGet.call(this, name); };
          Storage.prototype.setItem = function(name, value) { if (name === key) throw new DOMException('Acceptance storage unavailable', 'QuotaExceededError'); return originalSet.call(this, name, value); };
        }
      }, storageMode);
      const storageObservation = await preparePage(storageContext, server.url, { returning: true }); observations.push(storageObservation);
      const storagePage = storageObservation.page;
      diagnosticPage = storagePage;
      const storageBoot = await storagePage.evaluate(() => ({ model: skillProgression.snapshot(), save: arcadeUpgradeState(), frameFailed }));
      check(`${storageMode} storage permits a healthy boot with finite progression`, !storageBoot.frameFailed && Number.isFinite(storageBoot.model.points) && storageBoot.model.totalXp === 0, storageBoot);
      if (storageMode === 'legacy') {
        const migration = await storagePage.evaluate(() => { const result = persistSkills(); return { result, save: JSON.parse(window.__skillAcceptanceStored()) }; });
        check('Legacy save migration preserves all existing economy fields and adds only nested progression', migration.result && migration.save.cash === 1234 && migration.save.upgrades.engine === 3 && migration.save.deliveries === 4 && migration.save.careerMiles === 222 && migration.save.skillProgression.version === 1, migration);
      } else {
        await beginRun(storagePage); if (await storagePage.evaluate(() => launchIntro.active)) await storagePage.keyboard.press('w');
        await storagePage.waitForFunction(() => readRun().status === 'running' && !launchIntro.active);
        fixtures.push({ description: `Award four declared qualified event fixtures to expose a point-spending attempt under ${storageMode} storage.`, boundary: 'Adverse persistence setup; XP is not presented as naturally earned.' });
        await storagePage.evaluate(() => { for (let n = 0; n < 4; n++) awardSkillEvent({ id: `storage-award:${n}`, kind: 'near-miss', speed: 20, clearance: .8, clean: true, forward: true }); });
        await openSkills(storagePage);
        const refusal = await storagePage.evaluate(() => {
          const before = skillProgression.snapshot(), result = skillPurchase('engine');
          return { before, after: skillProgression.snapshot(), result, persistence: skillPersistence, preserved: window.__skillAcceptanceStored() === window.__skillAcceptanceInitial, buttonsDisabled: [...skillUpgradePanel.querySelectorAll('[data-upgrade]')].every(button => button.disabled), warning: skillUpgradePanel.querySelector('.skill-save-warning')?.textContent };
        });
        check(`${storageMode} storage refuses spending, preserves the original bytes and explains the problem`, !refusal.result.accepted && refusal.result.reason === 'unavailable' && refusal.before.points === refusal.after.points && refusal.before.stats.engine === refusal.after.stats.engine && refusal.preserved && refusal.buttonsDisabled && Boolean(refusal.warning), refusal);
      }
      await storageContext.close();
      diagnosticPage = page;
    }

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    mobileContext.setDefaultTimeout(30000);
    const mobileObservation = await preparePage(mobileContext, server.url, { returning: true }); observations.push(mobileObservation);
    const mobile = mobileObservation.page;
    diagnosticPage = mobile;
    await mobile.locator('#settings-btn').click(); await mobile.waitForFunction(() => currentScene() === 'settings');
    await mobile.locator('#motion-switch').click(); await mobile.locator('#settings-back-btn').click();
    await mobile.waitForFunction(() => currentScene() === 'title');
    await beginRun(mobile); await mobile.waitForFunction(() => !launchIntro.active && readRun().status === 'running');
    const mobileControls = await mobile.locator('#touch-controls button').evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return { action: node.dataset.action, label: node.getAttribute('aria-label'), x: b.x, y: b.y, width: b.width, height: b.height }; }));
    check('Portrait touch provides visible brake, drift, boost, Q/E, recovery and upgrade controls', ['brake', 'drift', 'boost', 'abilityQ', 'abilityE', 'interact', 'upgrades'].every(action => mobileControls.some(node => node.action === action && node.width >= 32 && node.height >= 32 && node.x >= 0 && node.y >= 0 && node.x + node.width <= 391 && node.y + node.height <= 845)), mobileControls);
    const touch = await mobileContext.newCDPSession(mobile);
    const driftButton = await mobile.locator('#touch-controls [data-action="drift"]').boundingBox();
    const steerButton = await mobile.locator('#touch-controls [data-action="steerLeft"]').boundingBox();
    await boundedCdp(touch, 'Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: driftButton.x + driftButton.width / 2, y: driftButton.y + driftButton.height / 2 }, { id: 2, x: steerButton.x + steerButton.width / 2, y: steerButton.y + steerButton.height / 2 }] });
    await mobile.waitForFunction(() => engine.n.coreInput.getIntent().drift && engine.n.coreInput.getIntent().steer > 0);
    const touchHeld = await skillsBrowserSnapshot(mobile);
    await boundedCdp(touch, 'Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await mobile.waitForFunction(() => !Object.values(keys).some(Boolean) && !engine.n.coreInput.getIntent().drift && engine.n.coreInput.getIntent().steer === 0);
    check('Multi-touch reaches the real drift/steer inputs and cancellation releases both', touchHeld.input.drift && touchHeld.input.steer > 0, touchHeld.input);
    await mobile.locator('#touch-controls [data-action="abilityQ"]').tap();
    await mobile.waitForFunction(() => activeAbilities.snapshot().cooldowns['mini-trucks'] > 0);
    await mobile.locator('#touch-controls [data-action="abilityE"]').tap();
    await mobile.waitForFunction(() => activeAbilities.snapshot().shield.charges > 0);
    check('Touch Q/E activate the two distinct equipped abilities', (await skillsBrowserSnapshot(mobile)).abilities.activations >= 2);
    await mobile.locator('#touch-controls [data-action="upgrades"]').tap(); await mobile.waitForFunction(() => skillMenuOpen());
    const mobileFreeze = await skillsBrowserSnapshot(mobile); await mobile.waitForTimeout(400); const mobileStill = await skillsBrowserSnapshot(mobile);
    check('The touch upgrade menu preserves the same complete simulation freeze', JSON.stringify(frozenFields(mobileFreeze)) === JSON.stringify(frozenFields(mobileStill)));
    await mobile.screenshot({ path: path.join(output, 'touch-upgrades-390x844.png') });
    const menuBeforeScroll = await mobile.locator('#skill-upgrade-panel').evaluate(node => ({ top: node.scrollTop, height: node.clientHeight, content: node.scrollHeight }));
    states.mobileMenuBeforeScroll = menuBeforeScroll;
    // This Chromium driver delivers touch taps and multi-touch input, but native
    // pan synthesis also fails on a minimal plain-HTML scroller. Check overflow
    // using real wheel input; do not mislabel that evidence as a touch swipe.
    await mobile.mouse.move(330, 690); await mobile.mouse.wheel(0, 420);
    await mobile.waitForFunction(() => skillUpgradePanel.scrollTop > 0);
    const menuAfterScroll = await mobile.locator('#skill-upgrade-panel').evaluate(node => ({ top: node.scrollTop, height: node.clientHeight, content: node.scrollHeight, cards: node.querySelectorAll('.skill-choice').length, loadout: node.querySelector('.skill-loadout').getBoundingClientRect().toJSON() }));
    states.mobileMenuAfterScroll = menuAfterScroll;
    check('The portrait three-choice menu scrolls to its remaining choices and equipped slots with real wheel input', menuBeforeScroll.content > menuBeforeScroll.height && menuAfterScroll.top > menuBeforeScroll.top && menuAfterScroll.cards === 3 && menuAfterScroll.loadout.bottom <= 845 && menuAfterScroll.loadout.top >= 0, { before: menuBeforeScroll, after: menuAfterScroll, input: 'wheel; native touch panning remains a physical-device check' });
    await mobile.screenshot({ path: path.join(output, 'touch-upgrades-scrolled-390x844.png') });
    await mobile.locator('#skill-close').tap(); await mobile.waitForFunction(() => !skillMenuOpen());
    const reduced = await mobile.evaluate(() => ({ enabled: !settings.motion, duration: launchIntro.duration, active: launchIntro.active, lean: truckRig.leanPivot.rotation.toArray(), cargoRotation: truckRig.crates.map(crate => crate.rotation.z), pickupRotation: [...pickupHosts.values()].map(host => host.rotation.y), frameFailed }));
    check('Reduced motion suppresses added body/cargo/pickup animation without disabling gameplay', reduced.enabled && reduced.duration === .12 && !reduced.active && Math.abs(reduced.lean[0]) < 1e-9 && Math.abs(reduced.lean[1]) < 1e-9 && reduced.cargoRotation.every(value => Math.abs(value) < 1e-9) && reduced.pickupRotation.every(value => Math.abs(value) < 1e-9) && !reduced.frameFailed, reduced);
    await mobile.screenshot({ path: path.join(output, 'touch-driving-390x844.png') });
    await mobileContext.close();
    diagnosticPage = page;

    const finalSource = await sourceIdentity();
    check('The validated application source remained identical throughout this run', source.aggregate === finalSource.aggregate, { before: source.aggregate, after: finalSource.aggregate });
    check('No fatal application or WebGL errors occurred', observations.every(value => !value.consoleLog.some(item => item.type === 'pageerror' || item.type === 'error' && !/favicon|404/.test(item.text))), observations.flatMap(value => value.consoleLog.filter(item => ['pageerror', 'error'].includes(item.type))));
    await screenshot('after');
  } catch (error) {
    failure = String(error.stack || error); console.error(failure);
    if (diagnosticPage) { states.failure = await skillsBrowserSnapshot(diagnosticPage).catch(() => null); await diagnosticPage.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {}); }
  } finally {
    await browser?.close().catch(() => {}); await server?.close().catch(() => {}); cleaned = true;
  }
  const passed = !failure && checks.length > 0 && checks.every(value => value.passed);
  await saveJson(path.join(output, 'states.json'), states);
  await saveJson(path.join(output, 'console.json'), observations.flatMap(value => value.consoleLog));
  await saveJson(path.join(output, 'network-failures.json'), observations.flatMap(value => value.networkFailures));
  await saveJson(path.join(output, 'fixtures.json'), fixtures);
  const report = { schemaVersion: 'long-haul.skills-validation/1', startedAt, completedAt: new Date().toISOString(), source, runtime, output, checks, fixtures, cleaned, verdict: passed ? 'pass' : 'fail', failure,
    coverageBoundary: 'Actual local browser input, DOM, WebGL and production simulation/services, with individually declared road/career/endpoint fixtures. Touch taps and multitouch cancellation are native CDP input; portrait overflow uses wheel input because this driver cannot pan even a minimal plain-HTML scroller. Native touch panning remains a physical-device check. Deterministic regression suites cover the wider parameter matrix. This is not human handling acceptance or target-device GPU performance certification.' };
  await saveJson(path.join(output, 'validation-report.json'), report);
  console.log(JSON.stringify({ verdict: report.verdict, output, checks: checks.length, failure }));
  if (!passed) process.exitCode = 1;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await validateSkills();
