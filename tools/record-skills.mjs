import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {
  projectRoot, argValue, saveJson, sourceIdentity, serveProject, loadBrowser,
  gameSnapshot, layoutEvidence, webglEvidence, beginRun, digest,
} from './validate-gameplay.mjs';
import { installFixedBrowserClock, freezeClock } from './fixed-browser-clock.mjs';
import { prepareFreightDriver, freightSteering } from './freight-browser-driver.mjs';

// Every output frame follows one real application frame at a prescribed delta.
// Only initial settings/seed and the capture-only browser clock are controlled.
// The original Web Audio graph renders offline on this same clock. The driver
// uses Playwright keyboard/click input, never teleports or awards XP.
const seconds = Number(argValue('--seconds', '60'));
const fps = Number(argValue('--fps', '30'));
const width = Number(argValue('--width', '1280')), height = Number(argValue('--height', '720'));
const seed = argValue('--seed', 'haul-1nwc3cl-12goa01');
const rehearsal = process.argv.includes('--rehearsal');
const frameFormat = argValue('--frame-format', 'png');
assert.ok(['png', 'jpeg'].includes(frameFormat), 'Frame format must be png or jpeg.');
const frameExtension = frameFormat === 'jpeg' ? 'jpg' : 'png';
const screenshotOptions = frameFormat === 'jpeg' ? { type: 'jpeg', quality: 95 } : { type: 'png' };
assert.ok(Number.isFinite(seconds) && seconds > 0 && seconds <= 180);
assert.ok(Number.isInteger(fps) && fps >= 15 && fps <= 60);
assert.ok(Number.isInteger(width) && Number.isInteger(height) && width >= 640 && height >= 360 && width % 2 === 0 && height % 2 === 0);
const frameCount = Math.round(seconds * fps), dt = 1 / fps;
assert.ok(Math.abs(frameCount / fps - seconds) < 1e-8, 'Duration must contain whole output frames.');
const runId = 'skill-gameplay-' + new Date().toISOString().replace(/[:.]/g, '-');
const output = path.resolve(argValue('--output', path.join(projectRoot, '.cache/validation', runId)));
await mkdir(path.dirname(output), { recursive: true });
await mkdir(output, { recursive: false });
await mkdir(path.join(output, 'frames'));
const source = await sourceIdentity(), startedAt = new Date().toISOString();
const requested = { target: projectRoot, seed, seconds, fps, width, height, frameCount, frameFormat,
  capture: rehearsal ? 'Input rehearsal; selected screenshots only, no video' : 'Simulation-time browser screenshots encoded as video',
  expected: 'Natural keyboard drifting, earned XP and one upgrade, two equipped abilities, roadside recovery.' };
await saveJson(path.join(output, 'target-lock.json'), { runId, source, requested });
let server, browser, context, page, runtime, failure = null, before, after, gl, probe, audioEvidence, clockEvidence;
const consoleLog = [], networkFailures = [], inputs = [], snapshots = [], frameHashes = [];
let held = new Set(), menu = null, boughtUpgrade = null, menuProof = null;
let driftAttempt = null, nextDrift = 5, driftAttempts = 0, recoveryStage = null;
let nextMini = 11, nextShield = 18, lastRecovery = -100, previousState = null;
let lastThrottleDown = -100;
const coverage = { drift: false, countersteer: false, wheelLift: false, xp: false, upgrade: false, miniTrucks: false, shield: false, recovery: false };

async function step(count = 1) {
  return page.evaluate(({ dt, count }) => {
    for (let i = 0; i < count; i += 1) window.__fixedCapture.step(dt);
    return { scene: currentScene(), ready: Boolean(generation?.ready), error: generation?.error ? String(generation.error) : null, failed: frameFailed };
  }, { dt, count });
}
async function setKeys(wanted, time, reason) {
  const next = new Set(wanted);
  // Binary speed regulation must not accidentally request the game's optional
  // double-tap rush. Intentional boost is demonstrated separately with Space.
  if (next.has('w') && !held.has('w')) {
    if (time - lastThrottleDown < .35) next.delete('w');
    else lastThrottleDown = time;
  }
  for (const key of held) if (!next.has(key)) { await page.keyboard.up(key); inputs.push({ time, action: 'up', key, reason }); }
  for (const key of next) if (!held.has(key)) { await page.keyboard.down(key); inputs.push({ time, action: 'down', key, reason }); }
  held = next;
}
async function press(key, time, reason) {
  await page.keyboard.press(key);
  inputs.push({ time, action: 'press', key, reason });
}
async function driverState() {
  return page.evaluate(() => {
    const truck = readTruck(), run = readRun(), surface = surfaceAt(truck.position);
    return {
      scene: currentScene(), intro: launchIntro.active, failed: frameFailed,
      speed: truck.speed, tipped: truck.tipped, grounded: truck.grounded,
      rollAngle: truck.rollAngle, rollMode: truck.rollMode,
      wheelLiftLeft: truck.wheelLiftLeft, wheelLiftRight: truck.wheelLiftRight, rolloverRisk: truck.rolloverRisk,
      position: { ...truck.position }, velocity: { ...truck.velocity }, heading: truck.heading,
      drift: structuredClone(truck.drift || null), surface: surface.surface,
      roadWidth: surface.road?.edge.width || 24,
      run: { distance: run.distance, rawTime: run.rawTime, recoveryCount: run.recoveryCount, status: run.status },
      progression: skillProgression.snapshot(), abilities: activeAbilities.snapshot(),
      skill: typeof skillSnapshot === 'function' ? skillSnapshot() : null,
      prompt: interactionPrompt(), weatherTime: arcadeWeatherTime,
      remainingTime: meters.get('remaining-time')?.value,
    };
  });
}
function frozenState(state) {
  return { position: state.position, velocity: state.velocity, time: state.run.rawTime,
    remaining: state.remainingTime, weather: state.weatherTime, abilities: state.abilities.clock };
}

try {
  server = await serveProject(); ({ browser, runtime } = await loadBrowser());
  context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await context.addInitScript(installFixedBrowserClock, { audioSeconds: seconds + 3, sampleRate: 48000 });
  page = await context.newPage();
  page.on('console', message => consoleLog.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', error => consoleLog.push({ type: 'pageerror', text: String(error) }));
  page.on('requestfailed', request => networkFailures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) networkFailures.push({ url: response.url(), status: response.status() }); });
  await page.addInitScript(() => {
    sessionStorage.setItem('long-haul-intro-credits-seen-v1', '1');
    localStorage.setItem('the-long-haul-settings-v2', JSON.stringify({ sound: true, steering: 100, quality: false, motion: true }));
  });
  await page.goto(server.url + 'index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__longHaulBooted || document.querySelector('#boot-failure')?.classList.contains('show'), null, { timeout: 45000 });
  assert.equal(await page.locator('#boot-failure').evaluate(node => node.classList.contains('show')), false, 'Game boot failed.');
  assert.equal(await page.evaluate(() => typeof window.__fixedCapture?.step), 'function', 'The capture-only fixed browser clock is required.');
  await page.evaluate(value => { newSeed = () => value; }, seed);
  await beginRun(page);
  await page.waitForFunction(() => currentScene() === 'driving' && generation?.ready, null, { timeout: 30000 });
  await freezeClock(page);
  await prepareFreightDriver(page);
  before = await gameSnapshot(page); gl = await webglEvidence(page);
  assert.ok(gl.available && !gl.lost && gl.pixels.distinctColors > 40, 'Game WebGL output must be nonblank.');
  await saveJson(path.join(output, 'webgl-render-report.json'), gl);
  await saveJson(path.join(output, 'layout-evidence.json'), await layoutEvidence(page));
  await page.screenshot({ path: path.join(output, 'before.png') });

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / fps;
    let alreadyStepped = false;
    if (frame % Math.max(1, Math.round(fps / 10)) === 0) {
      const state = await driverState();
      assert.equal(state.failed, false, 'An application frame failed during capture.');
      assert.ok(!['loss', 'results', 'title'].includes(state.scene), `Gameplay ended early in ${state.scene}.`);
      coverage.drift ||= Boolean(state.drift?.active && state.drift.maxAngle >= .12);
      coverage.countersteer ||= (state.drift?.releaseSequence || 0) > 0;
      coverage.wheelLift ||= Math.max(state.wheelLiftLeft || 0, state.wheelLiftRight || 0) > 0.12;
      coverage.xp ||= state.progression.totalXp > 0;
      coverage.miniTrucks ||= state.abilities.miniTrucks.length > 0;
      coverage.shield ||= state.abilities.shield.remaining > 0;
      coverage.recovery ||= state.run.recoveryCount > 0;
      if (frame % fps === 0) {
        snapshots.push({ time, state });
        await saveJson(path.join(output, 'capture-progress.json'), { time, frames: frame, coverage, position: state.position, speed: state.speed, xp: state.progression.totalXp });
        if (frame % (fps * 5) === 0) console.log(JSON.stringify({ time, speed: Math.round(state.speed), xp: state.progression.totalXp, drift: state.drift?.phase, coverage }));
      }

      if (menu) {
        await setKeys([], time, 'Upgrade menu freezes simulation');
        if (time - menu.opened >= 2.7 && !boughtUpgrade) {
          const now = await driverState();
          menuProof = { before: menu.frozen, after: frozenState(now) };
          assert.deepEqual(menuProof.after, menuProof.before, 'Upgrade viewing must not advance the actual gameplay clock or truck.');
          const choice = page.locator('#skill-upgrade-panel [data-upgrade]:not([disabled])').first();
          assert.ok(await choice.count(), 'At least one earned skill point must offer an affordable upgrade.');
          const id = await choice.getAttribute('data-upgrade');
          assert.equal(await choice.isVisible(), true, 'The selected upgrade must be visibly offered.');
          // The capture clock intentionally owns RAF. Skip Playwright's own
          // two-RAF stability wait after proving this semantic target visible.
          await choice.click({ force: true }); inputs.push({ time, action: 'click', selector: '#skill-upgrade-panel [data-upgrade]', id, reason: 'Spend a naturally earned skill point' });
          boughtUpgrade = { id, previous: now.progression };
        } else if (boughtUpgrade && time - menu.opened >= 3.5) {
          const now = await driverState();
          coverage.upgrade = now.progression.spentPoints > boughtUpgrade.previous.spentPoints;
          assert.ok(coverage.upgrade, 'An actual skill point must be spent by the upgrade selection.');
          if (now.scene !== 'driving') await press('Escape', time, 'Resume the same driving state');
          menu = null;
        }
      } else if (state.intro) {
        await setKeys([], time, 'Integrated scene introduction');
      } else if (!boughtUpgrade && state.progression.points > 0 && time >= 13 && time < seconds - 10 && !state.drift?.active) {
        await setKeys([], time, 'Open the earned upgrade choice');
        await press('u', time, 'Upgrade menu');
        await step();
        alreadyStepped = true;
        const paused = await driverState();
        menu = { opened: time, frozen: frozenState(paused) };
        driftAttempt = null;
      } else {
        let command = await freightSteering(page, { boost: false, route: 'safe', targetSpeed: 28, lane: -4.4, aimRamp: true });
        let keys = command.keys, reason = 'Follow the actual generated road with keyboard steering';
        if (state.tipped || /recover/i.test(state.prompt) && state.speed < 1 && time - lastRecovery > 2) {
          await setKeys([], time, 'Recover using the existing roadside action');
          await press('f', time, 'Roadside recovery');
          lastRecovery = time; driftAttempt = null; recoveryStage = null;
          keys = []; reason = 'Recovery input';
        } else {
          if (!driftAttempt && time >= nextDrift && time < seconds - 14 && state.speed >= 18 && state.grounded && state.surface !== 'off-road' && Math.abs(command.error) < .35 && driftAttempts < 4) {
            driftAttempts += 1;
            driftAttempt = { started: time, direction: driftAttempts % 2 ? 'a' : 'd', releaseBefore: state.drift?.releaseSequence || 0 };
          }
          if (driftAttempt) {
            const age = time - driftAttempt.started;
            if (age < .8) { keys = ['s', 'Shift', driftAttempt.direction]; reason = 'Brake and steer to build a drift'; }
            else if (age < 1.9 && (state.drift?.releaseSequence || 0) === driftAttempt.releaseBefore) {
              keys = ['w', driftAttempt.direction === 'a' ? 'd' : 'a']; reason = 'Countersteer and release the drift';
            } else { nextDrift = time + 7; driftAttempt = null; }
          }
          if (!driftAttempt && state.run.recoveryCount === 0 && time >= seconds - 13) {
            recoveryStage ||= { started: time };
            if (state.surface !== 'off-road') {
              command = await freightSteering(page, { boost: false, route: 'safe', targetSpeed: 9, lane: -state.roadWidth, aimRamp: false });
              keys = command.keys.filter(key => key !== 'w');
              if (state.speed < 7) keys.push('w'); else keys.push('s');
              reason = 'Pull safely onto the shoulder for a roadside recovery';
            } else { keys = ['s', 'x']; reason = 'Stop off-road to request roadside assistance'; }
          }
          if (!driftAttempt && !recoveryStage && time > 3 && time % 16 > 10 && time % 16 < 11.5 && Math.abs(command.error) < .12) {
            keys = [...keys, 'Space']; reason = 'Boost on a clear straight';
          }
          if (time >= nextMini && state.grounded && state.speed > 5 && !recoveryStage) {
            await press('q', time, 'Deploy Mini Trucks through the Q slot'); nextMini = time + 15;
          }
          if (time >= nextShield && !recoveryStage) {
            await press('e', time, 'Activate Road Shield through the E slot'); nextShield = time + 21;
          }
        }
        await setKeys(keys, time, reason);
      }
      previousState = state;
    }
    if (!alreadyStepped) await step();
    if (!rehearsal || frame % (fps * 5) === 0 || frame === frameCount - 1) {
      const filename = `frame-${String(frame).padStart(6, '0')}.${frameExtension}`;
      const bytes = await page.screenshot({ path: path.join(output, 'frames', filename), animations: 'allow', ...screenshotOptions });
      frameHashes.push({ frame, time: frame / fps, file: filename, sha256: digest(bytes) });
    }
  }
  await setKeys([], seconds, 'End capture');
  after = await gameSnapshot(page);
  clockEvidence = await page.evaluate(() => window.__fixedCapture.snapshot());
  assert.equal(clockEvidence.steps, frameCount, 'Every captured frame must advance the original RAF loop exactly once.');
  assert.ok(Math.abs(clockEvidence.seconds - seconds) < 1e-6, 'Captured simulation duration must match video duration.');
  const final = await driverState();
  coverage.xp ||= final.progression.totalXp > 0;
  coverage.countersteer ||= (final.drift?.releaseSequence || 0) > 0;
  coverage.wheelLift ||= Math.max(final.wheelLiftLeft || 0, final.wheelLiftRight || 0) > 0.12;
  coverage.recovery ||= final.run.recoveryCount > 0;
  snapshots.push({ time: seconds, state: final });
  await page.screenshot({ path: path.join(output, 'after.png') });
  assert.ok(after.runDetails.distance > before.runDetails.distance + 100, 'Actual gameplay must travel through the generated road.');
  assert.equal((await sourceIdentity()).aggregate, source.aggregate, 'Application source changed while recording.');
  const errors = consoleLog.filter(item => item.type === 'pageerror' || item.type === 'error' && !/favicon|404/.test(item.text));
  assert.equal(errors.length, 0, 'Captured gameplay must not hide a fatal browser error.');
  assert.ok(new Set(frameHashes.map(item => item.sha256)).size > frameHashes.length * .9, 'Capture must contain changing rendered gameplay; only the deliberate paused menu may repeat.');

  if (!rehearsal) {
  const recordedAudio = await page.evaluate(duration => window.__fixedCapture.renderAudio(duration), seconds);
  assert.ok(recordedAudio.rms > .001 && recordedAudio.peak > .01, 'The original game audio graph must produce audible output.');
  const audioPath = path.join(output, 'game-audio.wav');
  await writeFile(audioPath, Buffer.from(recordedAudio.base64, 'base64'));
  delete recordedAudio.base64;
  audioEvidence = recordedAudio;
  await saveJson(path.join(output, 'audio-capture.json'), audioEvidence);
  const video = path.join(output, 'TheLongHaul-Skill-Gameplay.mp4');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(output, `frames/frame-%06d.${frameExtension}`), '-i', audioPath, '-frames:v', String(frameCount), '-t', String(seconds), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', video], { stdio: 'pipe' });
  probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', video], { encoding: 'utf8' }));
  const stream = probe.streams.find(item => item.codec_type === 'video');
  assert.equal(stream.width, width); assert.equal(stream.height, height);
  assert.equal(Number(stream.nb_read_frames), frameCount);
  assert.ok(Math.abs(Number(probe.format.duration) - seconds) < .05);
  assert.ok(probe.streams.some(item => item.codec_type === 'audio' && item.codec_name === 'aac'), 'The final video must retain the synchronized original game audio.');
  for (const [name, time] of [['start', 0], ['middle', seconds / 2], ['end', seconds - 1 / fps]]) execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(time), '-i', video, '-frames:v', '1', path.join(output, name + '.png')]);
  await saveJson(path.join(output, 'ffprobe.json'), probe);
  await saveJson(path.join(output, 'media-validation.json'), { pass: true, duration: Number(probe.format.duration), frames: frameCount, distinctFrames: new Set(frameHashes.map(item => item.sha256)).size, fps, width, height, clock: clockEvidence, videoSha256: digest(await readFile(video)), audio: audioEvidence.source });
  }
} catch (error) {
  failure = String(error.stack || error); console.error(failure);
  if (page) await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
} finally {
  await context?.close().catch(() => {}); await browser?.close().catch(() => {}); await server?.close().catch(() => {});
}
const missing = Object.entries(coverage).filter(([, value]) => !value).map(([key]) => key);
const verdict = failure ? 'fail' : missing.length ? 'partial' : 'pass';
await saveJson(path.join(output, 'console.json'), consoleLog);
await saveJson(path.join(output, 'network-failures.json'), networkFailures);
await saveJson(path.join(output, 'interaction.json'), inputs);
await saveJson(path.join(output, 'state-snapshots.json'), snapshots);
await saveJson(path.join(output, 'frame-checksums.json'), frameHashes);
await saveJson(path.join(output, 'validation.json'), { verdict, coverage, missing, failure, menuProof,
  visualReview: 'Start/middle/end and event frames retained; inspect before accepting presentation or human handling quality.' });
await saveJson(path.join(output, 'report.json'), { verdict, runId, startedAt, finishedAt: new Date().toISOString(), source, runtime, requested, coverage, missing, failure, before, after, boughtUpgrade, clock: clockEvidence,
  boundary: 'Every frame renders the actual local browser game with the same frame function and fixed simulation delta. Ordinary Playwright keyboard/click inputs drive, drift, activate powers, select an earned upgrade and recover. No teleports, score injection or substituted scene. Original game Web Audio graph rendered offline on the identical simulation time base; simulation-time capture is not a real-time performance measurement.' });
await writeFile(path.join(output, 'review-summary.md'), `# The Long Haul skill gameplay capture\n\n- Verdict: ${verdict}\n- Source commit: ${source.revision}\n- Application manifest: ${source.aggregate}\n- Duration: ${seconds} simulation seconds; ${frameCount} steps at ${fps} FPS; ${width} × ${height}\n- Mode: ${rehearsal ? 'Input rehearsal with selected screenshots; no video produced' : 'Complete frame sequence and H.264/AAC MP4'}\n- Method: real browser screenshots after fixed-delta application frames; ordinary keyboard and UI inputs\n- Sound: original game oscillator/noise/filter/effect graph rendered by OfflineAudioContext at the same simulation timestamps\n- Coverage: ${Object.entries(coverage).map(([key, value]) => `${key}: ${value ? 'observed' : 'not observed'}`).join('; ')}\n- Inspect retained frames before presentation acceptance.\n- Human handling quality and representative device performance require separate assessment.\n${failure ? '\n## Failure\n\n' + failure + '\n' : ''}`);
console.log(JSON.stringify({ verdict, output, coverage, missing, failure }));
if (verdict !== 'pass') process.exitCode = 1;
