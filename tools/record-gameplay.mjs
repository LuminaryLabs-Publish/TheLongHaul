import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { projectRoot, argValue, saveJson, sourceIdentity, serveProject, loadBrowser, preparePage, beginRun, gameSnapshot, layoutEvidence, webglEvidence, driveWithKeyboard, digest } from './validate-gameplay.mjs';

// Native browser recording of the actual local app. The driver sends keyboard
// events; it does not replace physics, move the truck, edit the scene, or award score.
const seconds = Number(argValue('--seconds', '60'));
const startOffset = Number(argValue('--start-offset', '0.5'));
assert.ok(Number.isFinite(seconds) && seconds > 0, 'A positive recording duration is required.');
assert.ok(Number.isFinite(startOffset) && startOffset >= 0 && startOffset <= 1, 'The shared cinematic start offset must be between zero and one second.');
const runId = 'gameplay-video-' + new Date().toISOString().replace(/[:.]/g, '-');
const output = path.resolve(argValue('--output', path.join(projectRoot, '.cache/validation', runId)));
await mkdir(path.dirname(output), { recursive: true });
await mkdir(output, { recursive: false });
const source = await sourceIdentity(), startedAt = new Date().toISOString();
const requested = { mode: 'local', target: projectRoot, revision: source.revision, expectedSurface: 'mixed', expectedState: `${seconds} seconds of continuous actual gameplay`, interaction: 'Scripted real keyboard throttle, steering, boost and recovery when needed.' };
const decisions = [{ at: startedAt, stage: 'inspect', kind: 'fact', statement: 'Recording uses the exact local source and generated runtime manifest.', basis: source.aggregate, effect: 'none' }, { at: startedAt, stage: 'route', kind: 'decision', statement: 'Record native browser frames because the game requires its actual WebGL shaders and DOM HUD.', basis: 'Sandbox browser and WebGL rendering guides; no scene substitution.', effect: 'route-change' }];
await saveJson(path.join(output, 'target-lock.json'), { runId, requested, source });
await saveJson(path.join(output, 'decision-log.json'), decisions);
let server, browser, context, page, runtime, observations, failure = null, rawVideo, rawAudio, snapshots = [], before, after, gl, captureTiming, audioCapture;
try {
  server = await serveProject(); ({ browser, runtime } = await loadBrowser());
  context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, recordVideo: { dir: path.join(output, 'raw'), size: { width: 1280, height: 720 } } });
  observations = await preparePage(context, server.url, { seed: argValue('--seed', 'haul-1nwc3cl-12goa01'), quality: false }); page = observations.page;
  await beginRun(page); await page.waitForFunction(() => currentScene() === 'driving', null, { timeout: 20000 });
  const launchLayout = await layoutEvidence(page);
  assert.ok(launchLayout.stageScroll.x === 0 && launchLayout.stageScroll.y === 0 && Math.abs(launchLayout.canvas.x - launchLayout.stage.x) < 1 && Math.abs(launchLayout.canvas.y - launchLayout.stage.y) < 1, 'Native capture must start with an unscrolled, correctly framed game stage.');
  audioCapture = await page.evaluate(async () => {
    audio.ensure(); if (!audio.context || !audio.master) throw new Error('The actual game audio graph is unavailable.');
    await audio.context.resume();
    const mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error('Native Opus capture is unavailable.');
    const destination = audio.context.createMediaStreamDestination(), analyser = audio.context.createAnalyser(); analyser.fftSize = 2048;
    audio.master.connect(destination); audio.master.connect(analyser);
    const recorder = new MediaRecorder(destination.stream, { mimeType, audioBitsPerSecond: 96000 }), chunks = [];
    recorder.addEventListener('dataavailable', event => { if (event.data.size) chunks.push(event.data); });
    const startedAtWallTime = performance.timeOrigin + performance.now(); recorder.start(1000);
    window.__longHaulCaptureAudio = { destination, analyser, recorder, chunks, startedAtWallTime };
    return { startedAtWallTime, mimeType, sampleRate: audio.context.sampleRate, contextState: audio.context.state, source: 'Unmodified game Web Audio master gain, including engine, wind, impacts and scoring cues' };
  });
  captureTiming = { originalGameplayStartedAtWallTime: audioCapture.startedAtWallTime, gameplayStartedAtWallTime: audioCapture.startedAtWallTime + startOffset * 1000, audioStartedAtWallTime: audioCapture.startedAtWallTime, sharedAdvanceSeconds: startOffset, reason: 'Select the visible integrated cinematic after native browser capture has delivered its final loading frame.' };
  before = await gameSnapshot(page); gl = await webglEvidence(page);
  await saveJson(path.join(output, 'webgl-render-report.json'), gl);
  assert.ok(gl.available && !gl.lost && /swiftshader/i.test(gl.renderer) && gl.pixels.distinctColors > 40, 'The actual gameplay canvas must render before recording acceptance.');
  await page.screenshot({ path: path.join(output, 'before.png') });
  // Let the integrated cinematic play naturally inside the same uninterrupted
  // recording window, then use ordinary keyboard input for the remaining time.
  await page.waitForFunction(() => !launchIntro.active && readRun().status === 'running');
  const drivingLayout = await layoutEvidence(page);
  assert.ok(drivingLayout.hud.every(box => box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0 && box.right <= 1281 && box.bottom <= 721), 'Every essential gameplay HUD must remain visible in the native recording.');
  await saveJson(path.join(output, 'layout-evidence.json'), { launch: launchLayout, driving: drivingLayout });
  const drivingStartOffset = (Date.now() - captureTiming.gameplayStartedAtWallTime) / 1000;
  const drivingSeconds = seconds + 1 - drivingStartOffset;
  assert.ok(drivingSeconds > seconds - 10, 'The cinematic must hand over promptly.');
  snapshots = await driveWithKeyboard(page, drivingSeconds, { boost: true, weave: true, onSample: async sample => {
    sample.captureTime = sample.elapsed + drivingStartOffset;
    sample.audio = await page.evaluate(() => { const values = new Float32Array(window.__longHaulCaptureAudio.analyser.fftSize); window.__longHaulCaptureAudio.analyser.getFloatTimeDomainData(values); return { contextState: audio.context.state, rms: Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length) }; });
    await saveJson(path.join(output, 'capture-progress.json'), { seconds: sample.captureTime, scene: sample.snapshot.scene, distance: sample.snapshot.runDetails.distance, frameFailed: sample.snapshot.frameFailed });
    if (Math.floor(sample.captureTime) % 10 < 2) console.log(JSON.stringify({ recording: Math.round(sample.captureTime), scene: sample.snapshot.scene, distance: Math.round(sample.snapshot.runDetails.distance), speed: Math.round(sample.snapshot.player.speed), audioRms: sample.audio.rms }));
  } });
  after = await gameSnapshot(page);
  assert.equal(after.scene, 'driving', 'The requested gameplay recording must remain an active run.');
  assert.ok(!after.frameFailed && after.runDetails.distance > before.runDetails.distance + 50, 'The actual game must advance during the continuous recording.');
  captureTiming.gameplayEndedAtWallTime = Date.now();
  assert.ok((captureTiming.gameplayEndedAtWallTime - captureTiming.gameplayStartedAtWallTime) / 1000 >= seconds, 'The capture must contain the complete requested continuous gameplay duration.');
  assert.ok(snapshots.some(value => value.audio.contextState === 'running' && value.audio.rms > .001), 'The captured audio must contain the actual audible game output.');
  await page.screenshot({ path: path.join(output, 'after.png') });
  const stoppedAudio = await page.evaluate(async () => {
    const capture = window.__longHaulCaptureAudio, stopped = new Promise(resolve => capture.recorder.addEventListener('stop', resolve, { once: true }));
    capture.recorder.stop(); await stopped;
    const blob = new Blob(capture.chunks, { type: capture.recorder.mimeType });
    const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); });
    audio.master.disconnect(capture.destination); audio.master.disconnect(capture.analyser); capture.destination.stream.getTracks().forEach(track => track.stop());
    return { base64: data, stoppedAtWallTime: performance.timeOrigin + performance.now(), bytes: blob.size };
  });
  rawAudio = path.join(output, 'game-audio.webm'); await writeFile(rawAudio, Buffer.from(stoppedAudio.base64, 'base64'));
  audioCapture = { ...audioCapture, stoppedAtWallTime: stoppedAudio.stoppedAtWallTime, bytes: stoppedAudio.bytes, samples: snapshots.map(value => ({ time: value.captureTime, ...value.audio })) };
  rawVideo = await page.video().path();
  await context.close(); context = null;
  const rawProbe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', rawVideo], { encoding: 'utf8' }));
  const duration = Number(rawProbe.format.duration);
  assert.ok(duration >= seconds, 'Native browser recording is too short.');
  const audioProbe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', rawAudio], { encoding: 'utf8' }));
  // MediaRecorder WebM has no container Duration element. Prove coverage from
  // the genuine Opus packet timestamps instead of treating omitted metadata as
  // missing audio or padding a fabricated sound track.
  if (!Number.isFinite(Number(audioProbe.format.duration))) {
    const packets = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_packets', '-show_entries', 'packet=pts_time,duration_time', '-of', 'json', rawAudio], { encoding: 'utf8' })).packets;
    audioProbe.format.duration = String(Math.max(...packets.map(value => Number(value.pts_time) + Number(value.duration_time || 0))));
    audioProbe.durationBasis = 'Actual Opus packet timestamps; MediaRecorder omits the container Duration element';
  }
  // Playwright embeds the native recorder creation wall time in its WebM. Both
  // trims derive from the same gameplay epoch; independently taking the final
  // N seconds would include the recorder's final hold frame and desync audio.
  captureTiming.videoStartedAtWallTime = Date.parse(rawProbe.format.tags?.creation_time || '');
  assert.ok(Number.isFinite(captureTiming.videoStartedAtWallTime), 'The native video creation timestamp is required for audio synchronization.');
  captureTiming.videoTrimStart = (captureTiming.gameplayStartedAtWallTime - captureTiming.videoStartedAtWallTime) / 1000;
  captureTiming.audioTrimStart = (captureTiming.gameplayStartedAtWallTime - captureTiming.audioStartedAtWallTime) / 1000;
  assert.ok(captureTiming.videoTrimStart >= 0 && duration - captureTiming.videoTrimStart >= seconds, 'The native video must cover the complete shared gameplay interval.');
  assert.ok(Number(audioProbe.format.duration) - captureTiming.audioTrimStart >= seconds, 'The genuine audio must cover the same gameplay interval.');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(captureTiming.videoTrimStart), '-i', rawVideo, '-ss', String(captureTiming.audioTrimStart), '-i', rawAudio, '-t', String(seconds), '-map', '0:v:0', '-map', '1:a:0', '-vf', 'setpts=PTS-STARTPTS,fps=30:start_time=0,scale=1280:720:flags=lanczos', '-frames:v', String(Math.round(seconds * 30)), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', path.join(output, 'TheLongHaul-Gameplay-60s.mp4')], { stdio: 'pipe' });
  const video = path.join(output, 'TheLongHaul-Gameplay-60s.mp4');
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', video], { encoding: 'utf8' }));
  const stream = probe.streams.find(value => value.codec_type === 'video');
  assert.ok(Math.abs(Number(probe.format.duration) - seconds) < .05, 'MP4 duration must match the request.');
  assert.equal(stream.width, 1280); assert.equal(stream.height, 720); assert.equal(Number(stream.nb_read_frames), Math.round(seconds * 30));
  assert.ok(probe.streams.some(value => value.codec_type === 'audio' && value.codec_name === 'aac'), 'The final video must retain the genuine game audio.');
  await mkdir(path.join(output, 'frames'));
  for (const [name, time] of [['start', 0], ['middle', seconds / 2], ['end', seconds - .2]]) execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(time), '-i', video, '-frames:v', '1', path.join(output, 'frames', name + '.png')]);
  const finalSource = await sourceIdentity(); assert.equal(source.aggregate, finalSource.aggregate, 'The application source changed during recording.');
  const errors = observations.consoleLog.filter(value => value.type === 'pageerror' || value.type === 'error' && !/favicon|404/.test(value.text));
  assert.equal(errors.length, 0, 'No fatal browser error may be hidden by a successful video encode.');
  await saveJson(path.join(output, 'ffprobe.json'), { raw: rawProbe, audio: audioProbe, output: probe });
  await saveJson(path.join(output, 'audio-capture.json'), audioCapture);
  await saveJson(path.join(output, 'capture-timing.json'), captureTiming);
  await saveJson(path.join(output, 'validation.json'), { verdict: 'pass', duration: Number(probe.format.duration), fps: stream.avg_frame_rate, frameCount: Number(stream.nb_read_frames), width: stream.width, height: stream.height, codec: stream.codec_name, audio: 'AAC from genuine game Web Audio master', videoSha256: digest(await readFile(video)), render: gl, stateAdvanced: after.runDetails.distance - before.runDetails.distance, sourceUnchanged: true, visualReview: 'Representative frames retained for human/model inspection; technical checks alone do not certify game feel.' });
} catch (error) { failure = String(error.stack || error); console.error(failure); if (page) await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {}); }
finally { await context?.close().catch(() => {}); await browser?.close().catch(() => {}); await server?.close().catch(() => {}); }
const verdict = failure ? 'fail' : 'pass';
await saveJson(path.join(output, 'console.json'), observations?.consoleLog ?? []); await saveJson(path.join(output, 'network-failures.json'), observations?.networkFailures ?? []); await saveJson(path.join(output, 'interaction.json'), snapshots);
await saveJson(path.join(output, 'report.json'), { verdict, runId, startedAt, completedAt: new Date().toISOString(), requested, source, runtime, seconds, video: path.join(output, 'TheLongHaul-Gameplay-60s.mp4'), rawVideo, rawAudio, captureTiming, audioCapture, before, after, failure, boundary: 'Continuous native browser recording of real local gameplay and HUD, synchronized to the actual game audio master on a shared wall-clock interval. Input is a read-only route-following driver sending real keyboard events. No teleport, physics edits, score injection, synthetic sound or fabricated geometry. Software-renderer timing is not hardware GPU performance evidence.', cleanup: { browserClosed: true, serverClosed: true } });
await writeFile(path.join(output, 'review-summary.md'), `# The Long Haul gameplay capture\n\n- Verdict: ${verdict}\n- Requested duration: ${seconds} seconds\n- Format: H.264 MP4, 1280×720, 30 FPS, AAC audio\n- Source: local working tree at ${source.revision}; source manifest ${source.aggregate}\n- Capture: native browser video, real WebGL shaders and DOM HUD, integrated cinematic, scripted keyboard steering and boost\n- Audio: actual game Web Audio master; native source recording retained and trimmed using the same gameplay epoch as video\n- Review frames: start, middle, end\n- Scope: gameplay presentation and observable state; human feel/balance and hardware performance remain separate\n${failure ? '\n## Failure\n\n' + failure + '\n' : ''}`);
console.log(JSON.stringify({ verdict, output, failure })); if (failure) process.exitCode = 1;
