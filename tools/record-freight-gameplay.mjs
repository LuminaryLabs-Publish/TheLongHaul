import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { projectRoot, argValue, sourceIdentity, serveProject, loadBrowser, preparePage, beginRun, saveJson, layoutEvidence, webglEvidence, digest } from './validate-gameplay.mjs';
import { installFixedBrowserClock, freezeClock } from './fixed-browser-clock.mjs';
import { prepareFreightDriver, freightSnapshot, FreightKeyboardDriver } from './freight-browser-driver.mjs';

// Edited media is captured from one continuous keyboard-driven journey. Fixed
// simulation stepping prevents a slow software GPU from duplicating frames.
// The original Web Audio graph is rendered offline on this same time base.
const fps = 30, width = 1280, height = 720, duration = 60;
const maximumSeconds = Number(argValue('--max-simulation-seconds', '420'));
const journeyOnly = argValue('--journey-only', 'false') === 'true';
const quality = argValue('--quality', journeyOnly ? 'false' : 'true') === 'true';
const generatedId = (journeyOnly ? 'freight-journey-' : 'freight-video-') + new Date().toISOString().replace(/[:.]/g, '-');
const output = path.resolve(argValue('--output', path.join(projectRoot, '.cache/validation', generatedId))), runId = path.basename(output);
const captureOnly = argValue('--capture-only', 'false') === 'true';
await mkdir(path.dirname(output), { recursive: true }); await mkdir(output, { recursive: false }); await mkdir(path.join(output, 'frames'));
const source = await sourceIdentity(), startedAt = new Date().toISOString();
const requested = { mode: 'local', target: projectRoot, revision: source.revision, expectedSurface: 'mixed', expectedState: 'Continuous freight driving, pickups, delivery, route rewards, cargo loss and replacement', interaction: 'Real keyboard controls; frame-step clock and original offline Web Audio for smooth edited capture.' };
await saveJson(path.join(output, 'target-lock.json'), { runId, requested, source });
await saveJson(path.join(output, 'decision-log.json'), [
  { at: startedAt, stage: 'inspect', kind: 'fact', statement: 'Application source and generated runtime are locked by SHA-256 manifest.', basis: source.aggregate, effect: 'none' },
  { at: startedAt, stage: 'route', kind: 'decision', statement: 'Use real browser WebGL plus DOM screenshots at 1/30 second simulation increments. The user requested delta-time-scaled edited footage; native wall-clock recording previously repeated slow-renderer frames.', basis: 'User request and sandbox capture guides.', effect: 'route-change' },
  { at: startedAt, stage: 'capture', kind: 'decision', statement: 'Original game AudioContext graph uses OfflineAudioContext at the captured simulation timestamps. Video and audio use identical source intervals; only 4 ms audio edge fades are applied.', basis: 'No synthetic replacement sound or gameplay state injection.', effect: 'none' }
]);

const edit = [
  { id: 'launch', label: 'THE LONG HAUL', seconds: 5 },
  { id: 'pickup', label: 'DRIVE THROUGH. LOAD UP.', seconds: 8 },
  { id: 'loaded', label: 'FEEL THE FREIGHT', seconds: 8 },
  { id: 'delivery', label: 'DELIVER. KEEP DRIVING.', seconds: 9 },
  { id: 'risky', label: 'TAKE THE EXPRESS CUT', seconds: 12 },
  { id: 'loss', label: 'LOSE THE LOAD. KEEP THE JOURNEY.', seconds: 8 },
  { id: 'replacement', label: 'ANOTHER LOAD. ANOTHER CHANCE.', seconds: 10 },
];
assert.equal(edit.reduce((sum, value) => sum + value.seconds, 0), duration);
let server, browser, context, page, runtime, observations, driver, failure = null, before, after, gl;
let frameIndex = 0, editIndex = 0, active = null, firstPickupTime = null, lostAt = null, simulationSeconds = 0, lastSample = -1;
const frames = [], journey = [], segments = [], transitions = [];
try {
  server = await serveProject(); ({ browser, runtime } = await loadBrowser());
  context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await context.addInitScript(installFixedBrowserClock, { audioSeconds: maximumSeconds + 2, sampleRate: 48000 });
  observations = await preparePage(context, server.url, { seed: argValue('--seed', 'continuous-haul-2026'), quality }); page = observations.page;
  await beginRun(page); await freezeClock(page); await prepareFreightDriver(page); driver = new FreightKeyboardDriver(page);
  before = await freightSnapshot(page); assert.ok(before.freight && before.topology.endless, 'The recorded build must use the continuous freight and endless highway systems.');
  gl = await webglEvidence(page); assert.ok(gl.available && !gl.lost && gl.pixels.distinctColors > 40, 'Actual WebGL gameplay pixels are required.');
  if (quality) { assert.equal(gl.width, width, 'The high quality capture uses native-width WebGL pixels.'); assert.equal(gl.height, height, 'The high quality capture uses native-height WebGL pixels.'); }
  await saveJson(path.join(output, 'webgl-render-report.json'), gl);
  await page.screenshot({ path: path.join(output, 'before.png') });
  let priorStatus = before.freight.status, priorOrdinal = before.freight.ordinal;
  while (simulationSeconds < maximumSeconds) {
    const state = await page.evaluate(() => ({ freight: JSON.parse(render_game_to_text()).freight, intro: launchIntro.active, scene: currentScene(), failed: frameFailed, clock: __fixedCapture.snapshot(), camera: cameraMode }));
    assert.equal(state.failed, false, 'No application frame failure may be hidden by capture.');
    assert.equal(state.scene, 'driving', 'The continuous journey must remain in its driving scene.');
    const freight = state.freight, contract = freight.contract;
    if (freight.status !== priorStatus || freight.ordinal !== priorOrdinal) {
      transitions.push({ time: state.clock.seconds, status: freight.status, ordinal: freight.ordinal, completed: freight.completed, lost: freight.lost });
      priorStatus = freight.status; priorOrdinal = freight.ordinal;
    }
    if (freight.onboard && firstPickupTime === null) firstPickupTime = state.clock.seconds;
    if (freight.lost > 0 && lostAt === null) lostAt = state.clock.seconds;
    const next = edit[editIndex];
    const starts = next && !active && (
      next.id === 'launch' ||
      next.id === 'pickup' && freight.ordinal === 1 && contract.pickupProgress - freight.progress < 145 ||
      next.id === 'loaded' && freight.ordinal === 1 && freight.onboard && freight.progress >= contract.pickupProgress + 230 ||
      next.id === 'delivery' && freight.ordinal === 1 && contract.deliveryProgress - freight.progress < 150 ||
      next.id === 'risky' && freight.ordinal === 2 && contract.pickupProgress - freight.progress < 180 ||
      next.id === 'loss' && freight.ordinal === 3 && freight.onboard && contract.remaining < 2 ||
      next.id === 'replacement' && freight.lost > 0 && !freight.onboard && ['awaiting-pickup','awaiting-replacement'].includes(freight.status) && contract.pickupProgress - freight.progress < 160
    );
    if (starts) {
      const desiredCamera = next.id === 'loaded' ? 1 : 0;
      if (state.camera !== desiredCamera) await page.keyboard.press('c');
      active = { ...next, firstFrame: frameIndex, frameCount: 0, sourceStart: null, outputStart: frameIndex / fps };
      console.log(JSON.stringify({ segment: active.id, simulation: state.clock.seconds, progress: freight.progress, ordinal: freight.ordinal }));
    }
    // Show the loaded rig's real jump from chase view after the hood approach.
    // C is the ordinary in-game camera key; no replacement camera is injected.
    if (active?.id === 'loaded' && active.frameCount === fps * 3 && state.camera !== 0) await page.keyboard.press('c');
    // Standard and fragile contracts deliver naturally. Heavy cargo deliberately
    // expires while still driving slowly, proving cargo loss is not run failure.
    const losingThird = freight.ordinal === 3 && freight.onboard;
    const route = freight.ordinal === 2 ? 'risky' : 'safe';
    const speed = losingThird ? 3.2 : freight.onboard && contract.profileId === 'heavy' ? 27 : 31;
    const step = active ? 1 / fps : 1 / 15;
    const result = await driver.step(step, { route, targetSpeed: speed, lane: -4.4, boost: !losingThird && !freight.onboard, aimRamp: freight.ordinal === 1 });
    simulationSeconds = result.clock.seconds;
    if (active) {
      if (active.sourceStart === null) active.sourceStart = simulationSeconds;
      const file = path.join(output, 'frames', `frame-${String(frameIndex).padStart(6, '0')}.png`);
      if (!journeyOnly) {
        const bytes = await page.screenshot({ path: file });
        frames.push({ index: frameIndex, simulationTime: simulationSeconds, segment: active.id, sha256: digest(bytes), bytes: bytes.length });
      }
      frameIndex++; active.frameCount++;
      if (active.frameCount === active.seconds * fps) { active.sourceEnd = simulationSeconds + 1 / fps; segments.push(active); active = null; editIndex++; }
    }
    if (Math.floor(simulationSeconds) !== lastSample) {
      lastSample = Math.floor(simulationSeconds); const snapshot = await freightSnapshot(page); journey.push({ simulationTime: simulationSeconds, snapshot });
      if (lastSample % 10 === 0) {
        const status = { simulationSeconds, capturedFrames: frameIndex, editIndex, state: snapshot.freight.status, contract: snapshot.freight.ordinal, progress: snapshot.freight.progress, delivered: snapshot.freight.completed, lost: snapshot.freight.lost, truck: snapshot.condition['truck-condition'] };
        console.log(JSON.stringify(status)); await saveJson(path.join(output, 'capture-progress.json'), status);
      }
    }
    if (editIndex === edit.length && freight.completed >= 3 && freight.lost >= 1) break;
  }
  await driver.release(); after = await freightSnapshot(page);
  assert.equal(frameIndex, duration * fps, 'Every requested edited output frame must be captured.');
  assert.ok(after.freight.completed >= 3 && after.freight.lost >= 1 && after.scene === 'driving', 'The continuous source journey must deliver at least three loads, lose one, and continue.');
  assert.ok(transitions.some(value => value.status === 'cargo-lost') && transitions.some(value => value.lost > 0 && value.status === 'cargo-onboard'), 'Actual loss and replacement pickup must be observed.');
  const layout = await layoutEvidence(page); assert.ok(layout.stageScroll.x === 0 && layout.stageScroll.y === 0, 'Capture must preserve an aligned game stage.');
  await saveJson(path.join(output, 'layout-evidence.json'), layout);
  await page.screenshot({ path: path.join(output, 'after.png') });
  const fatalErrors = observations.consoleLog.filter(value => value.type === 'pageerror' || value.type === 'error' && !/favicon|404/.test(value.text));
  assert.equal(fatalErrors.length, 0, 'Natural journey has no fatal application or WebGL errors.');
  const journeyChecks = {
    constantSession: journey.every(value => value.snapshot.freight.sessionId === before.freight.sessionId),
    topologyBounded: journey.every(value => value.snapshot.topology.edges <= 16 && value.snapshot.topology.nodes <= 13),
    actualRiskyRouteReward: journey.some(value => value.snapshot.events.some(event => event.type === 'loading-route-complete')),
    actualRampLaunch: journey.some(value => value.snapshot.events.some(event => event.type === 'ramp-launch')),
    actualStuntLanding: journey.some(value => value.snapshot.events.some(event => event.type === 'stunt-landed')),
    actualCleanLandingReward: journey.some(value => value.snapshot.events.some(event => event.type === 'score-event' && event.kind === 'landing')),
    loadedProfiles: [...new Set(journey.filter(value => value.snapshot.freight.onboard).map(value => value.snapshot.freight.contract.profileId))],
    multipleExtensions: after.freight.road.revision >= 8,
    continuedBeyondInitialWindow: after.freight.progress > before.freight.road.windowEnd + 700,
    stationHostsBounded: journey.every(value => value.snapshot.freight.stationHosts <= 7),
    contactLedgerBounded: journey.every(value => value.snapshot.freight.contactLedger <= 270),
    patchCacheBounded: journey.every(value => value.snapshot.resources.patches.cached <= value.snapshot.resources.patches.cacheLimit),
    activeCellsBounded: journey.every(value => value.snapshot.resources.cells <= 81),
  };
  for (const [key, value] of Object.entries(journeyChecks)) if (typeof value === 'boolean') assert.ok(value, key);
  assert.ok(journeyChecks.loadedProfiles.length >= 4, 'Four distinct cargo profiles must be physically loaded.');
  await saveJson(path.join(output, 'journey-checks.json'), journeyChecks);
  await saveJson(path.join(output, 'resource-summary.json'), Object.fromEntries(['cells','horizonCells','drawCalls','triangles','geometries','textures','streamingPending'].map(key => [key, { first: journey[0].snapshot.resources[key], maximum: Math.max(...journey.map(value => value.snapshot.resources[key] ?? 0)), last: after.resources[key] }])));
  if (!journeyOnly) {
  const audio = await page.evaluate(async ({ seconds, selections }) => __fixedCapture.renderAudio(seconds, selections), { seconds: simulationSeconds + 1 / fps, selections: segments.map(value => ({ start: value.sourceStart, duration: value.seconds })) });
  assert.ok(audio.rms > .001 && audio.peak > .01, 'The original game audio must be non-silent.');
  await writeFile(path.join(output, 'game-audio-edited.wav'), Buffer.from(audio.base64, 'base64')); delete audio.base64;
  await saveJson(path.join(output, 'audio-capture.json'), audio);
  const finalSource = await sourceIdentity(); assert.equal(source.aggregate, finalSource.aggregate, 'Application source changed during capture.');
  const errors = observations.consoleLog.filter(value => value.type === 'pageerror' || value.type === 'error' && !/favicon|404/.test(value.text));
  assert.equal(errors.length, 0, 'Final capture must have no fatal browser errors.');
  assert.ok(frames.every((frame, index) => !index || frame.segment !== frames[index-1].segment || Math.abs(frame.simulationTime - frames[index-1].simulationTime - 1 / fps) < .00001), 'Every within-cut frame advances exactly 1/30 second.');
  const distinct = new Set(frames.map(frame => frame.sha256)).size;
  assert.ok(distinct >= frameIndex * .985, 'At least 98.5% of output frames must be distinct, not repeated software-renderer frames.');
  await saveJson(path.join(output, 'edit-manifest.json'), { fps, duration, width, height, source, segments, totalFrames: frameIndex, distinctFrames: distinct, frames });
  if (!captureOnly) {
    const captions = segments.map(segment => `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${segment.label}':fontsize=22:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=10:x=(w-text_w)/2:y=h*0.28:enable='between(t,${segment.outputStart},${segment.outputStart+1.7})'`).join(',');
    const video = path.join(output, 'TheLongHaul-Continuous-Freight-60s.mp4');
    execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-framerate',String(fps),'-i',path.join(output,'frames','frame-%06d.png'),'-i',path.join(output,'game-audio-edited.wav'),'-vf',captions,'-frames:v',String(duration*fps),'-t',String(duration),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',video], { stdio:'pipe' });
    const probe = JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',video],{encoding:'utf8'}));
    const stream = probe.streams.find(value => value.codec_type === 'video');
    assert.equal(Number(stream.nb_read_frames),duration*fps); assert.equal(stream.width,width); assert.equal(stream.height,height); assert.equal(stream.avg_frame_rate,'30/1'); assert.ok(Math.abs(Number(probe.format.duration)-duration)<.05);
    assert.ok(probe.streams.some(value => value.codec_type === 'audio' && value.codec_name === 'aac'));
    await saveJson(path.join(output,'ffprobe.json'),probe);
    await mkdir(path.join(output,'review'));
    for(const time of [0,4,8,16,24,34,44,52,59.5]) execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-ss',String(time),'-i',video,'-frames:v','1',path.join(output,'review',`at-${time}.png`)]);
    await saveJson(path.join(output,'validation.json'),{verdict:'pass',duration:Number(probe.format.duration),frames:duration*fps,distinctFrames:distinct,fps:30,width,height,videoSha256:digest(await readFile(video)),source:source.aggregate,audio:audio.source,sourceSimulationSeconds:simulationSeconds,delivered:after.freight.completed,lost:after.freight.lost,visualReview:'Required representative frames retained; root must inspect before release.',boundary:'Edited fixed-step browser screenshots of the actual application, with original offline-rendered game audio. Smooth encoding does not claim real-time GPU performance.'});
  }
  } else {
    assert.equal((await sourceIdentity()).aggregate, source.aggregate, 'Application source changed during natural journey validation.');
    await saveJson(path.join(output, 'validation.json'), { verdict: 'pass', mode: 'natural-continuous-journey', source: source.aggregate, sourceSimulationSeconds: simulationSeconds, delivered: after.freight.completed, lost: after.freight.lost, checks: journeyChecks, boundary: 'Real keyboard driving and unchanged physics, no teleports or direct freight state injection. Fixed simulation clock; full unedited state/input trace retained.' });
  }
} catch(error) { failure=String(error.stack||error); console.error(failure); if(page) await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{}); }
finally { await context?.close().catch(()=>{}); await browser?.close().catch(()=>{}); await server?.close().catch(()=>{}); }
await saveJson(path.join(output,'console.json'),observations?.consoleLog??[]); await saveJson(path.join(output,'network-failures.json'),observations?.networkFailures??[]);
await saveJson(path.join(output,'interaction.json'),driver?.commands??[]); await saveJson(path.join(output,'journey.json'),journey); await saveJson(path.join(output,'transitions.json'),transitions);
await saveJson(path.join(output,'report.json'),{verdict:failure?'fail':'pass',runId,startedAt,completedAt:new Date().toISOString(),source,runtime,requested,before,after,segments,frames:frames.length,plannedEditFrames:frameIndex,journeyOnly,simulationSeconds,failure,cleanup:{browserClosed:true,serverClosed:true},boundary:'One uninterrupted real-keyboard source journey. The edited output selects seven contiguous simulation intervals; no truck teleport, score injection, altered physics or replacement scene. Capture-only clock/audio adaptation is disclosed.'});
if (!failure) {
  const artifacts = Object.fromEntries([['before','before.png'],['after','after.png'],['decisionLog','decision-log.json'],['console','console.json'],['networkFailures','network-failures.json'],['interaction','interaction.json']].map(([key,file]) => [key,path.join(output,file)]));
  await saveJson(path.join(output,'validation-report.json'), {
    schemaVersion:'sandbox.web-render-validation/1',runId,startedAt,completedAt:new Date().toISOString(),runDirectory:output,requested,
    observed:{target:projectRoot,revision:source.revision,finalUrl:server.url+'index.html',surface:'mixed'},source,runtime,
    identity:{matchesRequestedMode:true,matchesRequestedTarget:true,matchesRequestedRevision:true},
    freshness:{currentRunOnly:true,historicalEvidenceExcluded:true},
    render:{visible:true,nonEmpty:true,surfaceProven:true,fatalErrors:[]},
    interaction:{required:true,performed:driver.commands.length>0,changeProven:after.freight.completed>=3&&after.freight.lost>=1},
    children:[{name:'sandbox-record-browser-it',verdict:'pass',evidence:path.join(output,'report.json')},{name:'webgl-render-sandbox-it',verdict:'pass',evidence:path.join(output,'webgl-render-report.json')}],
    artifacts,supplementalRuns:[],cleanup:{required:true,completed:true},verdict:'pass',
    coverageBoundary:'Actual local WebGL/DOM gameplay, one continuous ordinary-keyboard freight journey with three deliveries and one loss. Fixed simulation time is a capture adaptation; it makes no native GPU or real-time performance claim. Human feel and balance remain separate review.'
  });
}
console.log(JSON.stringify({verdict:failure?'fail':'pass',output,failure})); if(failure)process.exitCode=1;
