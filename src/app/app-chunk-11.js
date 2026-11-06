$("#credits-btn").addEventListener("click",()=>transition("credits"));$("#credits-back-btn").addEventListener("click",()=>transition("back"));
$("#start-btn").addEventListener("click", () => {
  if (currentScene() !== "title" || pendingSceneTransition) return;
  const resume = $("#freight-resume-btn");
  // A validated checkpoint is the only authority for restoring progress.
  if (resume && !resume.hidden && !resume.disabled) { resume.click(); return; }
  audio.ensure();
  window.longHaulContract = "standard";
  startGeneration(newSeed(), false, "start");
});
$("#how-btn").addEventListener("click", () => transition("how"));
$("#settings-btn").addEventListener("click", () => {
  settingsReturn = "title";
  transition("settings");
});
$("#how-back-btn").addEventListener("click", () => transition("back"));
$("#settings-back-btn").addEventListener("click", () => {
  saveSettings();
  transition(settingsReturn === "paused" ? "pause" : "title");
});
$("#sound-switch").addEventListener("click", () => {
  settings.sound = !settings.sound;
  applySettings();
  audio.ensure();
});
$("#quality-switch").addEventListener("click", () => {
  settings.quality = !settings.quality;
  applySettings();
});
$("#motion-switch").addEventListener("click", () => {
  settings.motion = !settings.motion;
  applySettings();
});
$("#steer-range").addEventListener("input", (event) => {
  settings.steering = finite(event.target.value, 100);
});
$("#resume-btn").addEventListener("click", resumeGame);
$("#pause-settings-btn").addEventListener("click", () => {
  settingsReturn = "paused";
  transition("settings");
});
$("#pause-retry-btn").addEventListener("click", retrySame);
$("#pause-title-btn").addEventListener("click", goTitle);
$("#result-retry-btn").addEventListener("click", retrySame);
$("#result-new-btn").addEventListener("click", () => {
  if (arcadeCampaign()) location.href = "./campaign.html";
  else newCourse();
});
$("#result-title-btn").addEventListener("click", () => {
  if (arcadeCampaign()) location.href = "./campaign.html";
  else goTitle();
});
$("#loss-retry-btn").addEventListener("click", retrySame);
$("#loss-new-btn").addEventListener("click", () => {
  if (arcadeCampaign()) location.href = "./campaign.html#garage";
  else newCourse();
});
$("#loss-title-btn").addEventListener("click", () => {
  if (arcadeCampaign()) location.href = "./campaign.html";
  else goTitle();
});
function showBootError(error) {
  console.error(error);
  $("#boot-error").textContent = String(error?.message ?? error);
  $("#boot-failure").classList.add("show");
}
function resize() {
  const stage = document.getElementById("game-stage") || document.documentElement;
  const { width: rawWidth, height: rawHeight } = stage.getBoundingClientRect();
  const width = Math.max(1, Math.round(rawWidth)), height = Math.max(1, Math.round(rawHeight));
  const pixelBudget = settings.quality ? 2304e3 : 1036800;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.quality ? 1.25 : 0.85, Math.sqrt(pixelBudget / (width * height))));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();
applySettings();
window.render_game_to_text = () => {
  const truck = readTruck(), run = readRun();
  return JSON.stringify({ scene: currentScene(), mode: arcadeCampaign() ? "campaign" : "endless", coordinates: "meters; x east, y up, z south; heading 0 faces +z", player: { position: truck.position, velocity: truck.velocity, heading: truck.heading, speed: truck.speed, normalTopSpeed: readDynamics().maximumForwardSpeed, grounded: truck.grounded, tipped: truck.tipped, landingSequence: truck.landingSequence, lastLanding: truck.lastLanding }, run: { status: run.status, distance: run.distance, time: run.rawTime, recoveryCount: run.recoveryCount }, fuel: meters.get("fuel")?.value, presentation: { contactShape: truck.contactShape, contactRadius: truck.contactRadius, lean: truckRig?.leanPivot.rotation.z, clearance: truckRig?.grounding.minimumClearance, scraping, sparks: scrapeLife.filter((n) => n > 0).length }, boost: { ...forwardBoost.snapshot(), visualStrength: boostVisualStrength, streaks: boostStreaks.visible }, cinematic: { ...launchIntro }, risk: arcadeScore.snapshot(), encounters: { label: arcadeEventLabel, planned: arcadeEncounters.length, active: arcadeEncounterHosts.size, rampsUsed: arcadeUsedRamps.size, propsBroken: arcadeBrokenProps.size, traffic: arcadeVehicles.filter((v) => v.active).length }, weather: { rain: arcadeWeatherAmount, time: arcadeWeatherTime }, skills: skillSnapshot(), freight: window.LongHaulFreight?.getState(), events: arcadeEventHistory.slice(-16), loading: generation && !generation.ready ? generation.cursor : null });
};
window.__longHaulBooted = true;
window.longHaulBootReady?.();
transition("ready");
const performanceStats = createPerformanceStats();
let previous = performance.now(), scheduled = previous, lastHud = -Infinity, lastMap = -Infinity, frameFailed = false;
window.LongHaulPerformance = { reset: () => performanceStats.reset(), getState: () => ({ ...performanceStats.snapshot(), scene: currentScene(), cells: cellHosts.size, horizonCells: horizonHosts.size, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, patches: preparation?.getStats(), worker: patchClient?.getState(), streamingPending: cellRealizeQueue.length + cellDecorationQueue.length }) };
window.addEventListener("blur", () => {
  for (const key of Object.keys(keys)) keys[key] = false;
  pressed.clear();
  forwardBoost.clearTaps();
  if(currentScene() === "driving" && !simulationFrozen()) pauseGame();
});
document.addEventListener("visibilitychange", () => {
  previous = scheduled = performance.now();
  if (document.hidden && currentScene() === "driving" && !simulationFrozen()) pauseGame();
});
function frame(now) {
  if (frameFailed) return;
  requestAnimationFrame(frame);
  if (document.hidden) {
    previous = scheduled = now;
    return;
  }
  const frozenAtStart = simulationFrozen();
  const beforeScene = currentScene(), activeScene = beforeScene === "driving" || beforeScene === "generating", target = activeScene ? 1e3 / 60 : beforeScene === "title" ? 1e3 / 30 : 1e3 / 15;
  if (now < scheduled - 1.5) return;
  const interval = now - previous;
  previous = now;
  scheduled += target;
  if (scheduled < now - target) scheduled = now + target;
  performanceStats.begin(beforeScene, interval);
  const dt = clamp(interval / 1e3, 0, 1 / 15);
  try {
    if (beforeScene === "generating") performanceStats.measure("generation", stepGeneration);
    let surface = null;
    if (beforeScene === "driving") {
      if (launchIntro.active) updateLaunchIntro(dt);
      if (!launchIntro.active) surface = performanceStats.measure("input", () => preTickDriving(dt));
    } else if (beforeScene === "paused" && consume("Escape")) resumeGame();
    const simulate = !frozenAtStart && !simulationFrozen() && currentScene() === "driving";
    engine.world.__longHaulScene = simulate ? "driving" : beforeScene === "driving" ? "paused" : beforeScene;
    performanceStats.measure("simulation", () => engine.tick(simulate ? dt : 0));
    const sceneId = updateSceneUi();
    if (sceneId === "title" && campaignLaunch?.course && !campaignAutoStarted) {
      campaignAutoStarted = true;
      startGeneration(campaignLaunch.course.seed, false, "start");
    }
    if (sceneId === "driving") {
      if (simulate) {
        updateSkillGameplay(dt);
        performanceStats.measure("gameplay", () => postTickGameplay(surface ?? surfaceAt(readTruck().position), dt));
        updateArcadeRules(dt);
      }
      performanceStats.measure("streaming", updateWorldStreaming);
      performanceStats.measure("horizon", updateHorizonWorld);
      performanceStats.measure("visuals", () => {
        if (simulate || launchIntro.active) {
          const visualDt = simulate ? dt : 0;
          updateTruckVisual(visualDt);
          updateCloudLayers(readTruck(), skillVisualTime * 1000);
          updateWildlifeVisual();
          updateBoostVisuals(visualDt);
          renderSkillEffects(visualDt);
          applyCamera();
        } else renderSkillEffects(0);
      });
      if (now - lastHud >= 66) {
        lastHud = now;
        performanceStats.measure("hud", () => updateHud(surface ?? surfaceAt(readTruck().position)));
      }
      audio.update(simulate ? readTruck().speed : 0, simulate ? engine.n.coreInput.getIntent().throttle : 0, simulate);
    } else {
      updateBoostVisuals(dt);
      audio.update(0, 0, false);
    }
    if (sceneId === "generating") updateLoadingUi();
    if (now - lastMap >= 66) {
      lastMap = now;
      drawMap();
    }
    arcadeVisualFrame(now);
    updateRiskHud();
    updateSkillHud(now);
    performanceStats.measure("renderCpu", () => renderer.render(scene, camera));
    performanceStats.end();
    pressed.clear();
  } catch (error) {
    frameFailed = true;
    try {
      audio.update(0, 0, false);
    } catch {
    }
    showBootError(error);
  }
}
requestAnimationFrame(frame);
