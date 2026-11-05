/** TLH-003: exactly one active player-facing presentation. The original
 * driving presentation remains as the launch-selectable rollback path.
 * This host reads simulation state and never mutates scoring, truck or saves. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('presentation') !== 'v2') { window.LongHaulGuidanceV2 = { enabled: false }; return; }
  const { deriveGuidance, createGuidanceNotifications, GUIDANCE_PRIORITY } = LongHaulGuidance;
  const stage = document.querySelector('#game-stage');
  const container = document.createElement('section');
  container.id = 'guidance-v2';
  container.setAttribute('aria-label', 'Driving information');
  container.innerHTML = `
    <div class="guide-goal" aria-label="Current objective"><b id="guide-goal">Next pickup ahead</b><span id="guide-route"></span><small id="guide-deadline" hidden></small></div>
    <div id="guide-alert" role="status" aria-live="assertive" hidden></div>
    <div id="guide-reward" role="status" aria-live="polite" hidden></div>
    <div id="guide-combo" hidden></div>
    <div class="guide-drive" aria-label="Vehicle information"><div class="guide-speed"><strong id="guide-speed">0</strong><span>MPH</span></div><div class="guide-bar"><span>FUEL</span><i><em id="guide-fuel"></em></i></div><div class="guide-bar"><span>TRUCK</span><i><em id="guide-condition"></em></i></div></div>
    <div class="guide-abilities" aria-label="Abilities"><button type="button" id="guide-q" aria-label="Use Q ability"><kbd>Q</kbd><span>READY</span></button><button type="button" id="guide-e" aria-label="Use E ability"><kbd>E</kbd><span>READY</span></button><button type="button" id="guide-upgrade" hidden>U · UPGRADE</button></div>`;
  container.hidden = true;
  stage.append(container);
  document.body.classList.add('guidance-v2');
  const $guide = id => container.querySelector('#'+id);
  // Map labels are derived from the same route-choice contract as road signs
  // and the minimal objective; the existing map canvas remains authoritative.
  const mapTitle = document.querySelector('#map-panel .map-head h2');
  const mapChoice = document.createElement('small');
  mapChoice.className = 'guide-map-choice';
  mapChoice.hidden = true;
  mapTitle?.parentElement?.append(mapChoice);
  const notices = createGuidanceNotifications();
  let session = '', last = null, lastRewardKey = '';
  const originalToast = toast;
  const emit = (id, label, priority, time) => notices.offer({ id, label, priority, seconds: 2.8 }, time);
  // Old gameplay emits its historical notifications. Keep its effects intact,
  // but route their visible copy to our single player-facing presenter.
  toast = function(message, tone = '', duration = 1800) {
    originalToast(message, tone, duration);
    const time = readRun()?.rawTime ?? 0;
    if (currentScene() === 'driving' && !launchIntro.active && session) {
      const key = `toast:${message}:${Math.floor(time * 2)}`;
      emit(key, message, tone === 'bad' ? GUIDANCE_PRIORITY.interaction : GUIDANCE_PRIORITY.reward, time);
    }
  };
  const originalUpdate = updateHud;
  function updateView() {
    const playing = currentScene() === 'driving' && !launchIntro.active;
    container.hidden = !playing;
    if (!playing || !course) { last = null; return; }
    const truck = readTruck(),run = readRun(),skill = skillProgression.snapshot(),abilities = activeAbilities.snapshot();
    const nextSession = freightState?.sessionId || course.seed;
    if (session !== nextSession) { session = nextSession; notices.clear(); lastRewardKey = ''; }
    const fuel = meters.get('fuel')?.value ?? 100,condition = meters.get('truck-condition')?.value ?? 100;
    last = deriveGuidance({ scene: 'driving', truck, run, freight: isContinuousFreight() ? freightState : null, course,
      fuel, condition, skillPoints: skill.points, abilitySlots: skill.slots,
      interaction: interactionPrompt?.() || '' });
    $guide('guide-goal').textContent = last.destination;
    const nearbyRoute = last.route?.consistent && !last.cargoOnboard && last.route.leadMeters < 270 ? last.route.text : '';
    $guide('guide-route').textContent = nearbyRoute;
    if (mapTitle && isContinuousFreight()) mapTitle.textContent = last.cargoOnboard ? 'Delivery route' : 'Freight pickup route';
    mapChoice.hidden = !nearbyRoute;
    if (!mapChoice.hidden) mapChoice.textContent = nearbyRoute;
    const deadline = $guide('guide-deadline');
    deadline.hidden = last.cargoDeadline === null || last.cargoDeadline > 60;
    if (!deadline.hidden) deadline.textContent = `DEADLINE ${Math.ceil(last.cargoDeadline)}s`;
    $guide('guide-speed').textContent = last.speedMph;
    $guide('guide-fuel').style.width = last.fuel + '%';
    $guide('guide-condition').style.width = last.truckCondition + '%';
    $guide('guide-fuel').classList.toggle('urgent',last.fuel<15);
    $guide('guide-condition').classList.toggle('urgent',last.truckCondition<20);
    for (const key of ['q','e']) {
      const id = skill.slots[key],ability = ABILITY_DEFINITIONS[id];
      const remaining = Math.max(0,abilities.cooldowns[id]||0),button = $guide('guide-'+key);
      button.querySelector('span').textContent = remaining ? `${remaining.toFixed(1)}s` : (ability?.shortName || 'READY');
      button.disabled = remaining > 0 || simulationFrozen();
      button.classList.toggle('ready',remaining<=0);
      button.setAttribute('aria-label',`${key.toUpperCase()} ${ability?.shortName || 'ability'} ${remaining ? remaining.toFixed(1)+' seconds' : 'ready'}`);
    }
    const upgrades=$guide('guide-upgrade');upgrades.hidden=!(skill.points>0);if(skill.points)upgrades.textContent=`U · ${skill.points} UPGRADE${skill.points===1?'':'S'}`;
    const score=arcadeScore.snapshot(),combo=$guide('guide-combo');
    combo.hidden=!(score.pending>0);if(!combo.hidden)combo.textContent=`×${score.multiplier} COMBO · ${Math.round(score.pending)} PTS`;
    if (isContinuousFreight() && freightState?.lastOutcome) {
      const o=freightState.lastOutcome,key=`${o.id ?? freightState.contract?.id}:${freightState.completed}:${freightState.lost}`;
      if (lastRewardKey!==key) {
        lastRewardKey=key;
        emit(`freight:${key}`,freightState.status==='delivered'?`DELIVERED · +$${o.cash ?? 0}`:'LOAD LOST · REPLACEMENT AHEAD',GUIDANCE_PRIORITY.objective,run.rawTime);
      }
    }
    const activeAlert = notices.visible(run.rawTime,last.alert);
    const urgent=$guide('guide-alert'),reward=$guide('guide-reward');
    urgent.hidden=!activeAlert || activeAlert.priority<GUIDANCE_PRIORITY.route;
    reward.hidden=!activeAlert || activeAlert.priority>=GUIDANCE_PRIORITY.route;
    if (!urgent.hidden && urgent.textContent!==activeAlert.label) urgent.textContent=activeAlert.label;
    if (!reward.hidden && reward.textContent!==activeAlert.label) reward.textContent=activeAlert.label;
    urgent.classList.toggle('danger',activeAlert?.priority>=GUIDANCE_PRIORITY.danger);
    // Read-only public testing surface. No gameplay writes, rendering or event duplication.
  }
  updateHud = function(surface){ originalUpdate(surface); updateView(); };
  for(const key of ['q','e']) $guide('guide-'+key).addEventListener('click',()=>{
    const target=document.querySelector(`[data-ability-slot="${key}"]`);if(target&&!target.disabled)target.click();
  });
  $guide('guide-upgrade').addEventListener('click',()=>document.querySelector('#skill-open')?.click());
  window.LongHaulGuidanceV2 = { enabled: true, getState: () => last ? structuredClone(last) : null, getNotifications:() => notices.snapshot(readRun()?.rawTime ?? 0) };
})();
