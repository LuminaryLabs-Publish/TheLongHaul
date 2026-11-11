// Skill, ability and collectible host. The engine remains the simulation clock.
const SKILL_SAVE_KEY = "longhaul-campaign-v1";
let skillProgression = createSkillProgression(arcadeUpgradeState().skillProgression);
let skillSavedRevision = skillProgression.snapshot().revision;
let skillPersistence = "saved", skillRunId = "", skillSteeringDamage = 0;
let skillLastDrift = 0, skillLastLanding = 0, skillLastCombo = 0, skillComboStarted = 0;
let skillTuningKey = "", skillMenuPage = 0, skillVisualTime = 0, skillProtectedImpact = null;
let skillPreviousPosition = null, skillImpactId = 0;
let skillLastRepairTime = -100;
const activeAbilities = createActiveAbilities({ slots: skillProgression.snapshot().slots, levels: skillProgression.snapshot().abilities });
const drivingPickups = createDrivingPickups();

const skillUpgradePanel = document.createElement("section");
skillUpgradePanel.id = "skill-upgrade-panel";
skillUpgradePanel.hidden = true;
skillUpgradePanel.setAttribute("role", "dialog");
skillUpgradePanel.setAttribute("aria-modal", "true");
skillUpgradePanel.setAttribute("aria-labelledby", "skill-menu-title");
skillUpgradePanel.tabIndex = -1;
$("#game-stage").append(skillUpgradePanel);
function skillMenuOpen() { return !skillUpgradePanel.hidden; }
function simulationFrozen() {
  return comicHitStopHeld || currentScene() !== "driving" || launchIntro.active || mapOpen || !arcadeGaragePanel.hidden || skillMenuOpen();
}
function consumeAction(action) {
  let used = false;
  for (const code of LONG_HAUL_BINDINGS[action] || []) if (consume(code)) used = true;
  return used;
}
function touchDrivingAllowed(code) {
  if (currentScene() !== "driving") return false;
  if (skillMenuOpen()) return ["KeyU", "Escape"].includes(code);
  if (!arcadeGaragePanel.hidden) return ["KeyF", "Escape"].includes(code);
  if (mapOpen) return ["KeyM", "Escape"].includes(code);
  return true;
}
function setDrivingControl(code, down, { repeat = false } = {}) {
  if (!down) { keys[code] = false; return; }
  if (skillMenuOpen() && !["KeyU", "Escape"].includes(code)) return;
  if (!arcadeGaragePanel.hidden && !["KeyF", "Escape"].includes(code)) return;
  if (mapOpen && !["KeyM", "Escape"].includes(code)) return;
  if (!repeat && !keys[code]) {
    pressed.add(code);
    if (!simulationFrozen() && LONG_HAUL_BINDINGS.throttle.includes(code) && !readTruck().tipped && (meters.get("fuel")?.value ?? 0) > 0) {
      if (forwardBoost.tap(code, performance.now())) audio.tone(660, .15, "triangle", .04);
    }
  }
  keys[code] = true;
  audio.ensure();
}

function skillStoredRevision(save) {
  const revision = save?.skillProgression?.revision;
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : 0;
}
function persistSkills(model = skillProgression) {
  try {
    if (!arcadeSaveWritable()) throw Error("Save unavailable");
    const latest = arcadeUpgradeState();
    if (skillStoredRevision(latest) !== skillSavedRevision) {
      skillPersistence = "conflict";
      return false;
    }
    latest.skillProgression = model.serialize();
    localStorage.setItem(SKILL_SAVE_KEY, JSON.stringify(latest));
    skillSavedRevision = latest.skillProgression.revision;
    arcadeCachedSave = latest;
    skillPersistence = "saved";
    return true;
  } catch {
    skillPersistence = "unavailable";
    return false;
  }
}
function refreshSkillSave() {
  try {
    const read = readCampaignSave(localStorage.getItem(SKILL_SAVE_KEY));
    if (!read.readable) { skillPersistence = "unavailable"; return false; }
    const latest = read.save, savedRevision = skillStoredRevision(latest);
    if (savedRevision !== skillSavedRevision) {
      const local = skillProgression.snapshot();
      let imported = createSkillProgression(latest.skillProgression);
      const remote = imported.snapshot();
      if (skillRunId) {
        // The career is shared; maneuver receipts belong to this live run.
        // A foreign run must neither erase our receipts nor contribute IDs
        // from its separate sequence. Same-run tabs retain both sets.
        const receipts = [
          ...(local.runId === skillRunId ? local.seenIds : []),
          ...(remote.runId === skillRunId ? remote.seenIds : []),
        ];
        imported.startRun(skillRunId);
        imported = createSkillProgression({ ...imported.serialize(), seenIds: receipts });
      }
      skillProgression = imported;
      // A local scope change may increment the model revision. The write
      // lease still refers to the actual persisted revision we just read.
      skillSavedRevision = savedRevision;
      skillTuningKey = "";
      activeAbilities.configure({ slots: imported.snapshot().slots, levels: imported.snapshot().abilities });
    }
    arcadeCachedSave = latest;
    skillPersistence = "saved";
    // Refresh, including a storage-event refresh, never writes. Only genuine
    // run/XP/purchase/equipment mutations may persist and notify other tabs.
    return true;
  } catch {
    skillPersistence = "unavailable";
    return false;
  }
}
window.addEventListener("storage", event => {
  if (event.key !== SKILL_SAVE_KEY) return;
  skillPersistence = "conflict";
  if (skillMenuOpen()) { refreshSkillSave(); renderSkillMenu(); }
});
function ensureSkillRun() {
  if (!course || !arcadeAttemptId) return;
  // Freight resumes retain the same receipt scope. A new delivery leg retires
  // old evidence without allowing a reload to replay its last maneuver.
  const identity = isContinuousFreight() ? `freight:${freightState.sessionId}:leg:${freightState.ordinal}` : arcadeAttemptId;
  if (skillRunId === identity) return;
  skillRunId = identity;
  skillProgression.startRun(skillRunId);
  persistSkills();
}
const skillFinishIntroBase = finishLaunchIntro;
finishLaunchIntro = function(skipped = false) {
  const wasActive = launchIntro.active;
  const resumedSkills = freightResumeCheckpoint?.skillState;
  if (wasActive && resumedSkills?.version === 1) {
    skillSteeringDamage = clamp(finite(resumedSkills.steeringDamage), -.8, .8);
    skillLastRepairTime = Number.isFinite(resumedSkills.lastRepairTime) ? resumedSkills.lastRepairTime : -100;
    drivingPickups.restoreCheckpoint(resumedSkills.pickups);
    activeAbilities.restoreCheckpoint(resumedSkills.abilities);
    arcadeTrafficSerial = Math.max(arcadeTrafficSerial, Number.isSafeInteger(resumedSkills.trafficSerial) ? resumedSkills.trafficSerial : 0);
  }
  skillFinishIntroBase(skipped);
  if (!wasActive || launchIntro.active) return;
  ensureSkillRun();
  skillLastDrift = readTruck().drift?.lastManeuver?.sequence ?? 0;
  skillLastLanding = readTruck().landingSequence ?? 0;
};
function skillCheckpointState() {
  return { version: 1, steeringDamage: skillSteeringDamage, lastRepairTime: skillLastRepairTime, pickups: drivingPickups.checkpoint(), abilities: activeAbilities.checkpoint(), trafficSerial: arcadeTrafficSerial };
}
function awardSkillEvent(event) {
  if (simulationFrozen() || readRun().status !== "running") return { accepted: false, reason: "inactive" };
  ensureSkillRun();
  if (skillPersistence === "conflict") refreshSkillSave();
  const result = skillProgression.event({ ...event, active: true, xpMultiplier: drivingPickups.snapshot().xpMultiplier });
  if (result.accepted) {
    persistSkills();
    arcadeRecord("skill-xp", result);
    if (result.pointsEarned > 0) {
      toast(`LEVEL ${result.level} · +${result.pointsEarned} SKILL POINT · U to choose`, "good", 3000);
      audio.tone(880, .15, "triangle", .05);
    }
  }
  return result;
}
function currentCargoMass() {
  return readTruck().cargo?.massKg ?? 0;
}

function openSkillMenu() {
  if (currentScene() !== "driving" || launchIntro.active || mapOpen || !arcadeGaragePanel.hidden) return false;
  ensureSkillRun();
  refreshSkillSave();
  releaseDrivingInput();
  skillMenuPage = 0;
  skillUpgradePanel.hidden = false;
  document.body.classList.add("skill-menu-open");
  renderSkillMenu();
  skillUpgradePanel.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
  arcadeRecord("skills-open");
  return true;
}
function closeSkillMenu() {
  if (!skillMenuOpen()) return;
  skillUpgradePanel.hidden = true;
  document.body.classList.remove("skill-menu-open");
  releaseDrivingInput();
  $("#game-canvas").focus({ preventScroll: true });
  arcadeRecord("skills-close");
}
function skillPurchase(id, slot) {
  if (!skillMenuOpen()) return { accepted: false, reason: "menu-closed" };
  const candidate = createSkillProgression(skillProgression.serialize());
  const result = candidate.purchase(id, { slot, expectedRevision: skillProgression.snapshot().revision });
  if (!result.accepted) return result;
  if (!persistSkills(candidate)) {
    toast(skillPersistence === "conflict" ? "Career changed in another tab. Reopen Skills." : "Save unavailable. Your point has not been spent.", "bad", 2600);
    renderSkillMenu();
    return { accepted: false, reason: skillPersistence };
  }
  skillProgression = candidate;
  activeAbilities.configure({ slots: candidate.snapshot().slots, levels: candidate.snapshot().abilities });
  skillTuningKey = "";
  arcadeConfiguredRun = "";
  arcadeApplyUpgrades();
  updateSkillVehicleAppearance();
  arcadeRecord("skill-purchased", result);
  audio.good();
  closeSkillMenu();
  return result;
}
function equipSkillAbility(id, slot) {
  if (!skillMenuOpen()) return false;
  const candidate = createSkillProgression(skillProgression.serialize()), result = candidate.equip(id, slot);
  if (!result.accepted || !persistSkills(candidate)) return false;
  skillProgression = candidate;
  activeAbilities.configure({ slots: candidate.snapshot().slots, levels: candidate.snapshot().abilities });
  updateSkillVehicleAppearance();
  renderSkillMenu();
  arcadeRecord("ability-equipped", result);
  return true;
}
function skillNode(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}
function renderSkillMenu() {
  const state = skillProgression.snapshot();
  skillUpgradePanel.replaceChildren();
  const header = skillNode("header", "skill-menu-header"), intro = skillNode("div");
  intro.append(skillNode("small", "eyebrow", "DRIVER DEVELOPMENT · SIMULATION PAUSED"));
  const title = skillNode("h2", "", "Build your rig"); title.id = "skill-menu-title";
  intro.append(title, skillNode("p", "", `${state.points} skill point${state.points === 1 ? "" : "s"} · Level ${state.level} · ${state.xpToNext.toLocaleString()} XP to next level`));
  const close = skillNode("button", "btn skill-close", "Resume · U / Esc");
  close.id = "skill-close"; close.addEventListener("click", closeSkillMenu);
  header.append(intro, close); skillUpgradePanel.append(header);
  if (skillPersistence !== "saved") skillUpgradePanel.append(skillNode("p", "skill-save-warning", skillPersistence === "conflict" ? "Career changed in another tab. Close and reopen Skills to reload." : "Save unavailable. XP is held for this session; purchases are disabled."));
  const cards = skillNode("div", "skill-choices");
  for (const item of skillProgression.candidates({ page: skillMenuPage })) {
    const card = skillNode("article", "skill-choice");
    card.append(skillNode("small", "skill-kind", item.kind === "stat" ? "TRUCK STAT" : item.kind === "modifier" ? "INDEPENDENT MODIFIER" : item.requiresSlot ? "DISCOVER ABILITY" : "ABILITY UPGRADE"));
    card.append(skillNode("h3", "", item.label), skillNode("span", "skill-tier", `Tier ${item.level} → ${item.nextLevel}`), skillNode("p", "skill-effect", item.effectText));
    if (item.kind === "ability") card.append(skillNode("p", "skill-description", ABILITY_DEFINITIONS[item.id]?.description || item.description));
    const addPurchase = slot => {
      const name = slot ? `Replace ${slot.toUpperCase()} · ${item.cost} point${item.cost === 1 ? "" : "s"}` : `Upgrade · ${item.cost} point${item.cost === 1 ? "" : "s"}`;
      const button = skillNode("button", "btn primary", name);
      button.dataset.upgrade = item.id;
      if (slot) button.dataset.slot = slot;
      button.disabled = !item.affordable || skillPersistence !== "saved";
      button.addEventListener("click", () => skillPurchase(item.id, slot));
      card.append(button);
    };
    if (item.requiresSlot) { addPurchase("q"); addPurchase("e"); } else addPurchase();
    cards.append(card);
  }
  skillUpgradePanel.append(cards);
  const footer = skillNode("div", "skill-menu-footer"), more = skillNode("button", "btn", "Other choices →");
  more.dataset.skillRefresh = "true";
  more.addEventListener("click", () => { skillMenuPage += 1; renderSkillMenu(); skillUpgradePanel.querySelector("[data-skill-refresh]")?.focus({ preventScroll: true }); });
  footer.append(skillNode("span", "", "Choose any upgrade. Tiers stay independent."), more);
  skillUpgradePanel.append(footer);
  const loadout = skillNode("div", "skill-loadout");
  loadout.append(skillNode("h3", "", "Equipped abilities"));
  for (const slot of ["q", "e"]) {
    const row = skillNode("div", "skill-slot"), id = state.slots[slot];
    row.append(skillNode("b", "", `${slot.toUpperCase()} · ${ABILITY_DEFINITIONS[id].name} · Tier ${state.abilities[id]}`));
    for (const [candidate, tier] of Object.entries(state.abilities)) if (tier > 0 && !Object.values(state.slots).includes(candidate)) {
      const button = skillNode("button", "btn", `Equip ${ABILITY_DEFINITIONS[candidate].name}`);
      button.dataset.equip = candidate; button.dataset.slot = slot;
      button.disabled = skillPersistence !== "saved";
      button.addEventListener("click", () => equipSkillAbility(candidate, slot));
      row.append(button);
    }
    loadout.append(row);
  }
  skillUpgradePanel.append(loadout);
}
skillUpgradePanel.addEventListener("keydown", event => {
  if (event.code !== "Tab") return;
  const buttons = [...skillUpgradePanel.querySelectorAll("button:not(:disabled)")];
  if (!buttons.length) return;
  if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
  else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
});

// Recompute stock + cash upgrades + career effects together; never multiply an
// already-upgraded profile. This also preserves the existing garage economy.
const skillLegacyApplyUpgrades = arcadeApplyUpgrades;
arcadeApplyUpgrades = function() {
  if (!course) return;
  const save = arcadeCachedSave ??= arcadeUpgradeState(), effects = skillProgression.effects(), pickup = drivingPickups.snapshot();
  const key = JSON.stringify([runKey, save.truck, save.upgrades, effects, pickup.boostMultiplier]);
  if (skillTuningKey === key && arcadeConfiguredRun === runKey) return;
  skillTuningKey = key;
  arcadeConfiguredRun = "";
  skillLegacyApplyUpgrades();
  const level = id => clamp(Number(save.upgrades?.[id]) || 0, 0, 5), campaign = arcadeCampaign();
  const fleet = save.truck || "delivery";
  const base = (campaign ? { delivery: [38,5.8], box: [40,6.05], semi: [42,6.3], heavy: [44,6.55] } : { delivery: [36,5.4], box: [38,5.65], semi: [40,5.9], heavy: [42,6.15] })[fleet] || [36,5.4];
  engine.n.longHaulTruckDynamicsProfile.configure({
    maximumForwardSpeed: (base[0] + level("engine") * 2.8 + level("transmission") * 1.7) * effects.speedMultiplier,
    engineAcceleration: (base[1] + level("engine") * .7 + level("transmission") * .28) * effects.accelerationMultiplier,
    brakeForce: ((campaign ? 13 : 12) + level("brakes") * 1.5) * effects.brakeMultiplier,
    grip: { highway: ((campaign ? 5.2 : 4.5) + level("tires") * .65) * effects.gripMultiplier, road: ((campaign ? 4.3 : 3.8) + level("tires") * .55) * effects.gripMultiplier },
    suspension: { spring: 22 * effects.stabilityMultiplier, compressionDamping: 8.5 * effects.stabilityMultiplier, extensionDamping: 6.4 * effects.stabilityMultiplier },
    drift: { reserveEfficiency: Math.min(.9, .72 * effects.driftReserveMultiplier) },
    boost: { forceMultiplier: (1.8 + level("boost") * .19) * effects.boostMultiplier * pickup.boostMultiplier, rushForceMultiplier: 3.8 * effects.boostMultiplier * pickup.boostMultiplier, speedMultiplier: Math.min(1.6, 1.24 + level("boost") * .045 + (pickup.boostMultiplier - 1) * .3) },
  });
};
const skillLegacyScoreEvent = awardArcadeEvent;
awardArcadeEvent = function(event) {
  const receipt = skillLegacyScoreEvent({ ...event, comboWindow: skillProgression.effects().comboWindow, pointMultiplier: drivingPickups.snapshot().comboMultiplier });
  if (receipt.accepted) awardSkillEvent(event);
  return receipt;
};
const skillLegacyTruckDamage = spendTruckDamage;
spendTruckDamage = function(amount, reason) {
  if (simulationFrozen() || !(amount > 0)) return 0;
  const id = `impact:${skillImpactId++}`, time = readRun().rawTime;
  const protection = activeAbilities.absorbDamage(amount, { active: true, id });
  skillProtectedImpact = protection.shielded ? { reason, time } : null;
  applyAbilityEvents(protection.events);
  if (protection.shielded) { arcadeRecord("shield-protected", { amount, reason }); return 0; }
  const damage = skillLegacyTruckDamage(protection.damage * skillProgression.effects().armorMultiplier, reason);
  if (damage >= 6 && !["off-road", "recovery"].includes(reason)) {
    const side = comicDamageSide ?? (Math.sign(readTruck().input.steer) || (skillImpactId % 2 ? 1 : -1));
    skillSteeringDamage = clamp(skillSteeringDamage + side * damage * .012, -.8, .8);
  }
  return damage;
};
const skillLegacyCargoDamage = spendCargoDamage;
spendCargoDamage = function(amount, reason) {
  if (skillProtectedImpact?.reason === reason && skillProtectedImpact.time === readRun().rawTime) return 0;
  return skillLegacyCargoDamage(amount, reason);
};
const skillLegacyInteraction = handleInteraction;
handleInteraction = function(state, run, condition, surface) {
  const primaryInteraction = arcadeNearestGarage(state.position) || (!isContinuousFreight() && skillLegacyPrompt());
  if (!primaryInteraction && Math.abs(skillSteeringDamage) > .12 && Math.abs(state.speed) < 1.1 && !state.tipped && run.stuckSeconds < 2.8 && condition.fuel > 0 && surface.surface === "road") {
    if (run.rawTime - Math.max(run.lastRecoveryTime ?? -100, skillLastRepairTime) < 8) { toast("Recovery crew is resetting", "", 1200); return; }
    skillLastRepairTime = run.rawTime;
    engine.n.longHaulRun.penalty({ id: `steering-repair:${run.rawTime.toFixed(6)}`, kind: "repair", label: "Steering repair", seconds: 5, collision: false });
    skillSteeringDamage = 0;
    toast("STEERING REALIGNED · +5s", "good", 2200);
    arcadeRecord("steering-repaired", { source: "roadside" });
    return;
  }
  const before = readRun().recoveryCount;
  skillLegacyInteraction(state, run, condition, surface);
  // Recovery is queued in the engine, so its immediate grace flag is the signal.
  if (arcadeRecoveryGrace > 1.4 || readRun().recoveryCount > before) skillSteeringDamage = 0;
};
const skillLegacyPrompt = interactionPrompt;
interactionPrompt = function() {
  if (skillMenuOpen()) return "";
  const previous = skillLegacyPrompt();
  const primaryInteraction = arcadeNearestGarage(readTruck().position) || (!isContinuousFreight() && previous);
  if (!primaryInteraction && Math.abs(skillSteeringDamage) > .12) return Math.abs(readTruck().speed) < 1.1 ? "F · Repair steering · +5s" : "STEERING PULL · Stop, then F to repair";
  return previous;
};

const abilityRoot = new THREE.Group(), pickupRoot = new THREE.Group();
const abilityMaterials = { cyan: new THREE.MeshBasicMaterial({ color: 0x6ce9e5 }), violet: new THREE.MeshBasicMaterial({ color: 0x9c94ff }), metal: new THREE.MeshLambertMaterial({ color: 0x5e8388 }) };
const miniHosts = Array.from({ length: 12 }, () => {
  const group = new THREE.Group();
  addEncounterBox(group, abilityMaterials.metal, 0,.55,0,1.25,.7,2.4);
  addEncounterBox(group, abilityMaterials.cyan, 0,1,.5,1.15,.65,.9);
  for (const x of [-.67,.67]) for (const z of [-.7,.7]) addEncounterBox(group, arcadeWheelMat,x,.3,z,.2,.45,.45);
  group.visible = false; abilityRoot.add(group); return group;
});
const shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1,16,10), new THREE.MeshBasicMaterial({color:0x78e4ff,wireframe:true,transparent:true,opacity:.24,depthWrite:false}));
shieldMesh.scale.set(3.1,3.7,6); shieldMesh.visible = false; abilityRoot.add(shieldMesh);
const pulseGeometry = new THREE.RingGeometry(.92,1,48);
const pulseHosts = Array.from({length:3},()=>{ const mesh=new THREE.Mesh(pulseGeometry,new THREE.MeshBasicMaterial({color:0xb49dff,side:THREE.DoubleSide,transparent:true,opacity:.65,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.visible=false;abilityRoot.add(mesh);return mesh; });
const abilityObstacleHosts = new Map();
function skillAbilityObstacles() {
  const result = []; abilityObstacleHosts.clear();
  for (const host of arcadeEncounterHosts.values()) for (const prop of host.props) {
    if (prop.broken || !prop.mesh.visible || !host.group.visible) continue;
    const p = new THREE.Vector3(); prop.mesh.getWorldPosition(p);
    result.push({ id:prop.id,x:p.x,y:p.y,z:p.z,radius:prop.radius,destructible:true,kind:prop.barrier?"barrier":"crate" });
    abilityObstacleHosts.set(prop.id,{prop,host});
  }
  for (const vehicle of arcadeVehicles) if (vehicle.active && vehicle.group.visible) {
    result.push({ id:vehicle.id,x:vehicle.group.position.x,z:vehicle.group.position.z,radius:Math.min(3,vehicle.collider.length*.35),destructible:false,kind:"traffic" });
    abilityObstacleHosts.set(vehicle.id,{vehicle});
  }
  return result;
}
function applyAbilityEvents(events = []) {
  for (const event of events) {
    if (event.kind === "ability-hit") {
      const target = abilityObstacleHosts.get(event.obstacleId);
      if (target?.prop && !target.prop.broken) {
        target.prop.broken = true; target.prop.mesh.visible = false; arcadeBrokenProps.add(target.prop.id);
        burstDebris(new THREE.Vector3(event.position.x,event.position.y || 1,event.position.z),readTruck().speed);
      } else if (target?.vehicle) {
        const vehicle=target.vehicle, side=Math.sign(vehicle.lane)||Math.sign(Math.cos(vehicle.group.rotation.y)*(vehicle.group.position.x-readTruck().position.x)-Math.sin(vehicle.group.rotation.y)*(vehicle.group.position.z-readTruck().position.z))||1;
        vehicle.lane += side * Math.min(5,event.push*.35);
        vehicle.hit = true; vehicle.passed = true; vehicle.skillDisabled = event.disabledSeconds;
      }
      arcadeRecord("ability-hit", event);
      audio.tone(100,.065,"square",.025);
    } else if (event.kind === "ability-start") arcadeRecord("ability-activated", event);
  }
}
function activateSkillAbility(slot) {
  const active = !simulationFrozen() && readRun().status === "running";
  const result = activeAbilities.activate(slot,{ active, truck:readTruck(), enhancement:skillProgression.effects().abilityEnhancement+drivingPickups.snapshot().abilityEnhancement });
  applyAbilityEvents(result.events);
  if (result.accepted) { const id=skillProgression.snapshot().slots[slot]; toast(`${slot.toUpperCase()} · ${ABILITY_DEFINITIONS[id].name}`,"good",1000);audio.tone(slot==="q"?420:620,.14,"triangle",.04); }
  else if(active) toast(result.reason==="cooldown"?"Ability is recharging":"Ability unavailable right now","",1000);
  return result;
}

const pickupGeometry = new THREE.OctahedronGeometry(1,0);
const pickupMaterials = Object.fromEntries(Object.entries(PICKUP_DEFINITIONS).map(([id,def])=>[id,new THREE.MeshToonMaterial({color:def.color,emissive:def.color,emissiveIntensity:.24})]));
const pickupHosts = new Map();
let skillPickupNetwork = null, skillPickupPlan = [];
function planSkillPickups() {
  if (skillPickupNetwork === arcadeNetwork || !arcadeNetwork) return;
  skillPickupNetwork = arcadeNetwork; skillPickupPlan = [];
  const kinds = ["focus", "boost", "ability", "repair"];
  if (course?.endless) {
    const start = Math.max(0, Math.min(...course.edges.filter(edge => !edge.optional).map(edge => edge.startProgress)));
    const end = Math.max(...course.edges.map(edge => edge.endProgress));
    drivingPickups.retireThrough(Math.floor((start - 145) / 185));
    for (let index = Math.max(0, Math.ceil((start - 145) / 185)); 145 + index * 185 < end; index++) {
      const progress = 145 + index * 185;
      const point = endlessHighwayPoint(course, progress, -3.5);
      skillPickupPlan.push({ id: `pickup:endless:${index}`, kind: kinds[index % kinds.length], point });
    }
  } else {
    for (const path of arcadeNetwork.paths) for (let distance = 145; distance < path.length - 65 && skillPickupPlan.length < 192; distance += 185) {
      const point = arcadePathPoint(path, distance, -Math.min(3.5, (arcadePathPoint(path, distance)?.edge.width || 17) * .2));
      if (!point || point.edge.optional) continue;
      skillPickupPlan.push({ id: `pickup:${point.edge.id}:${Math.round(point.x)}:${Math.round(point.z)}`, kind: kinds[Math.floor(distance / 185) % kinds.length], point });
    }
  }
  const wanted = new Set(skillPickupPlan.map(pickup => pickup.id));
  for (const [id, host] of pickupHosts) if (!wanted.has(id)) { host.removeFromParent(); pickupHosts.delete(id); }
}
function collectSkillPickup(pickup, distance=0, height=0) {
  const receipt=drivingPickups.collect({id:pickup.id,kind:pickup.kind,distance,height,active:!simulationFrozen()&&readRun().status==="running"});
  if(!receipt.accepted)return receipt;
  if(receipt.repair){meters.restore("truck-condition",receipt.repair,"repair-pickup");skillSteeringDamage=0;arcadeRecord("steering-repaired",{source:"pickup"})}
  pickupHosts.get(pickup.id)?.removeFromParent();pickupHosts.delete(pickup.id);
  toast(receipt.label,"good",2000);audio.tone(740,.12,"sine",.04);arcadeRecord("pickup",receipt);skillTuningKey="";
  return receipt;
}
function updateSkillPickups(dt) {
  drivingPickups.tick(dt,{active:true});
  planSkillPickups();
  const truck=readTruck(),position=truck.position,previous=skillPreviousPosition;
  for(const pickup of skillPickupPlan){
    const {point,id,kind}=pickup,distance=Math.hypot(point.x-position.x,point.z-position.z);
    if(drivingPickups.has(id))continue;
    let host=pickupHosts.get(id);
    if(distance<340&&!host&&pickupHosts.size<28){host=new THREE.Mesh(pickupGeometry,pickupMaterials[kind]);host.scale.setScalar(1.05);pickupRoot.add(host);pickupHosts.set(id,host)}
    if(host){host.position.set(point.x,terrainHeight(course,point.x,point.z)+1.8+(settings.motion?Math.sin(skillVisualTime*2)*.18:0),point.z);host.rotation.y=settings.motion?skillVisualTime:0;host.visible=distance<340;if(distance>420){host.removeFromParent();pickupHosts.delete(id)}}
    let swept=distance;
    if(previous){const dx=position.x-previous.x,dz=position.z-previous.z,length=dx*dx+dz*dz;if(length>0&&length<18*18){const t=clamp(((point.x-previous.x)*dx+(point.z-previous.z)*dz)/length,0,1);swept=Math.hypot(point.x-previous.x-dx*t,point.z-previous.z-dz*t)}}
    if(swept<=3.3)collectSkillPickup(pickup,swept,position.y-terrainHeight(course,point.x,point.z));
  }
  skillPreviousPosition={x:position.x,z:position.z};
  for(const [id,host] of pickupHosts)if(Math.hypot(host.position.x-position.x,host.position.z-position.z)>420){host.removeFromParent();pickupHosts.delete(id)}
}

const skillHud = skillNode("div", "", ""); skillHud.id="skill-hud";
skillHud.innerHTML='<button id="skill-open" aria-label="Open skills and abilities"><b id="skill-level">LV 1</b><span id="skill-xp">0 XP</span><strong id="skill-points">U · SKILLS</strong><i><em id="skill-xp-fill"></em></i></button><div id="skill-ability-slots"></div><div id="skill-drift" role="status"></div><div id="skill-effects"></div>';
$("#game-stage").append(skillHud);$("#skill-open").addEventListener("click",openSkillMenu);
for(const slot of ["q","e"]){const button=skillNode("button","skill-ability");button.dataset.abilitySlot=slot;button.innerHTML=`<kbd>${slot.toUpperCase()}</kbd><span></span><small></small>`;button.addEventListener("click",()=>activateSkillAbility(slot));$("#skill-ability-slots").append(button)}
// Cache the two fixed HUD tiles once; never re-query or rebuild them per tick.
const skillAbilityNodes=Object.fromEntries(["q","e"].map(slot=>{
  const button=skillHud.querySelector(`[data-ability-slot="${slot}"]`);
  return [slot,{button,name:button.querySelector("span"),cooldown:button.querySelector("small")}];
}));
let skillLastHud=0;
function updateSkillHud(now) {
  skillHud.hidden=currentScene()!=="driving"||launchIntro.active;
  if(now-skillLastHud<66)return;skillLastHud=now;
  const state=skillProgression.snapshot(),abilities=activeAbilities.snapshot(),truck=readTruck(),pickups=drivingPickups.snapshot();
  $("#skill-level").textContent=`LV ${state.level}`;$("#skill-xp").textContent=`${state.xpIntoLevel.toLocaleString()} / ${state.levelSpan.toLocaleString()} XP`;
  $("#skill-points").textContent=state.points?`U · ${state.points} POINT${state.points===1?"":"S"}`:"U · SKILLS";
  $("#skill-xp-fill").style.transform=`scaleX(${state.levelSpan?clamp(state.xpIntoLevel/state.levelSpan,0,1):1})`;
  $("#skill-open").classList.toggle("ready",state.points>0);
  // Keep ability tiles stable: cache nodes and write only when their visible
  // value or actionable state changes. Cooldown rendering stays decoupled from
  // the faster gameplay simulation and does not recreate the tile contents.
  const frozen=simulationFrozen();
  for(const slot of ["q","e"]){
    const node=skillAbilityNodes[slot],id=state.slots[slot],remaining=Math.max(0,abilities.cooldowns[id]||0);
    const label=ABILITY_DEFINITIONS[id].shortName;
    // Ceiling avoids displaying 0.0s while the ability is still cooling down.
    const cooldown=remaining>0?`${(Math.ceil(remaining*10)/10).toFixed(1)}s`:"READY";
    if(node.name.textContent!==label)node.name.textContent=label;
    if(node.cooldown.textContent!==cooldown)node.cooldown.textContent=cooldown;
    const ready=remaining<=0;
    if(node.button.classList.contains("ready")!==ready)node.button.classList.toggle("ready",ready);
    const disabled=frozen||!ready;
    if(node.button.disabled!==disabled)node.button.disabled=disabled;
  }
  const drift=truck.drift||{};
  $("#skill-drift").textContent=truck.tipped?"ROLLOVER · F TO RECOVER":truck.rollMode==="critical"?"TIP RISK · COUNTERSTEER":truck.rollMode==="wheel-lift"?`WHEELS LIFTING · ${Math.round(Math.max(truck.wheelLiftLeft||0,truck.wheelLiftRight||0)*100)} CM`:drift.active?`DRIFT ${Math.round((drift.charge||0)*100)}% · COUNTERSTEER`:(drift.phase==="release"||drift.phase==="released")?"MOMENTUM RELEASED":Math.abs(skillSteeringDamage)>.12?`STEERING PULL ${skillSteeringDamage>0?"LEFT":"RIGHT"} · F TO REPAIR`:"S + TURN · SHIFT TO SLIDE";
  $("#skill-drift").classList.toggle("charged",drift.active&&drift.charge>.25);
  const effects=Object.entries(pickups.timers).filter(([,time])=>time>0).map(([id,time])=>`${id.toUpperCase()} ${Math.ceil(time)}s`);
  if(abilities.shield.remaining>0)effects.push(`SHIELD ${abilities.shield.charges} HITS`);
  $("#skill-effects").textContent=effects.join(" · ");
}
function updateSkillVehicleAppearance() {
  if(!truckRig)return;
  const rig=truckRig,state=skillProgression.snapshot(),visual=skillProgression.effects().visual;
  const signature=JSON.stringify([visual,state.slots]);
  if(rig.skillSignature===signature)return;rig.skillSignature=signature;
  for(const wheel of rig.wheels)wheel.scale.set(.82*visual.tires,.82,.82*visual.tires);
  if(!rig.skillParts){
    const group=new THREE.Group();rig.body.add(group);
    const exhausts=[-1.25,1.25].map(x=>addEncounterBox(group,materials.chrome,x,4,-.2,.22,2,.22));
    const armor=addEncounterBox(group,abilityMaterials.metal,0,1.5,4.25,3.5,.38,.3);
    const suspension=addEncounterBox(group,abilityMaterials.cyan,0,1.4,-1.7,2.7,.11,3.5);
    const equipment=[-1,1].map(x=>addEncounterBox(group,abilityMaterials.violet,x,2.1,-4.15,.5,.45,.7));
    rig.skillParts={group,exhausts,armor,suspension,equipment};
    for(const crate of rig.crates)crate.userData.skillBasePosition=crate.position.clone();
  }
  for(const exhaust of rig.skillParts.exhausts)exhaust.scale.y=2*visual.exhaust;
  rig.skillParts.armor.visible=state.stats.armor>0||state.stats.brakes>0;
  rig.skillParts.suspension.visible=state.stats.suspension>0;
  rig.skillParts.suspension.scale.y=.11*visual.suspension;
  ["q","e"].forEach((slot,index)=>{const part=rig.skillParts.equipment[index];part.material=state.slots[slot]==="mini-trucks"?abilityMaterials.cyan:state.slots[slot]==="road-shield"?abilityMaterials.metal:abilityMaterials.violet;part.scale.y=state.slots[slot]==="mini-trucks"?.45:state.slots[slot]==="road-shield"?.7:1});
}
function renderSkillEffects(dt=0) {
  if(!course)return;
  if(abilityRoot.parent!==dynamicRoot)dynamicRoot.add(abilityRoot);
  if(pickupRoot.parent!==dynamicRoot)dynamicRoot.add(pickupRoot);
  const state=activeAbilities.snapshot(),truck=readTruck();
  miniHosts.forEach((host,index)=>{const mini=state.miniTrucks[index];host.visible=Boolean(mini);if(mini){host.position.set(mini.x,mini.y,mini.z);host.rotation.y=mini.heading}});
  shieldMesh.visible=state.shield.remaining>0&&state.shield.charges>0;shieldMesh.position.set(truck.position.x,truck.position.y+1.4,truck.position.z);shieldMesh.rotation.y=truck.heading;
  pulseHosts.forEach((host,index)=>{const pulse=state.pulses[index];host.visible=Boolean(pulse);if(pulse){host.position.set(pulse.x,terrainHeight(course,pulse.x,pulse.z)+.35,pulse.z);host.scale.setScalar(Math.max(.1,pulse.radius));host.material.opacity=settings.motion?.6:.35}});
  updateSkillVehicleAppearance();
  if(truckRig){
    for(const crate of truckRig.crates){const base=crate.userData.skillBasePosition;if(!base)continue;crate.position.x=base.x+(settings.motion?clamp(truck.cargoShift||0,-.35,.35):0);crate.rotation.z=settings.motion?clamp((truck.cargoShift||0)*.18,-.12,.12):0}
    if(!settings.motion&&truck.movementVersion!=="v2"){truckRig.leanPivot.rotation.set(0,0,truck.tipped?truck.rollAngle:0)}
  }
}
function updateSkillGameplay(dt) {
  if(simulationFrozen()||readRun().status!=="running")return;
  ensureSkillRun();skillVisualTime+=dt;skillProgression.setActive(true);
  const truck=readTruck(),maneuver=truck.drift?.lastManeuver;
  if(maneuver&&maneuver.sequence!==skillLastDrift){
    skillLastDrift=maneuver.sequence;
    const award=awardSkillEvent({id:`drift:${maneuver.sequence}`,kind:maneuver.countersteer?"countersteer":"drift",speed:maneuver.entrySpeed,duration:maneuver.duration,distance:maneuver.distance,angle:maneuver.maxAngle,reserve:maneuver.reserve,exitSpeed:maneuver.exitSpeed,clean:!truck.tipped,forward:true});
    if(award.accepted)toast(`${maneuver.countersteer?"COUNTERSTEER":"DRIFT"} · +${award.xp} XP`,"good",1400);
  }
  if(truck.landingSequence!==skillLastLanding){skillLastLanding=truck.landingSequence;const landing=truck.lastLanding;if(landing&&!arcadeActiveStunt)awardSkillEvent({id:`landing:${truck.landingSequence}`,kind:"landing",speed:Math.abs(truck.speed),forward:truck.speed>0,clean:!truck.tipped&&landing.impactSpeed<18,airTime:landing.airTime,distance:landing.distance})}
  const combo=arcadeScore.snapshot();
  if(combo.comboEvents===0){skillComboStarted=readRun().rawTime;skillLastCombo=0}
  else if(combo.comboEvents>=3&&combo.comboEvents!==skillLastCombo&&readRun().rawTime-skillComboStarted>=3){skillLastCombo=combo.comboEvents;awardSkillEvent({id:`combo:${combo.bankCount}:${combo.events}`,kind:"combo",speed:truck.speed,count:combo.comboEvents,duration:readRun().rawTime-skillComboStarted,clean:true})}
  const result=activeAbilities.tick(dt,{active:true,truck,obstacles:skillAbilityObstacles(),groundHeightAt:(x,z)=>terrainHeight(course,x,z)+.12,roadHeadingAt:(x,z,heading)=>{const road=nearestRoad(course,{x,z});return road?road.heading+(Math.cos(heading-road.heading)<0?Math.PI:0):heading}});
  applyAbilityEvents(result.events);
  updateSkillPickups(dt);
  arcadeApplyUpgrades();
}
const skillResetArcade = resetArcadeOverhaul;
resetArcadeOverhaul = function(){
  skillResetArcade();skillUpgradePanel.hidden=true;document.body.classList.remove("skill-menu-open");
  activeAbilities.reset({slots:skillProgression.snapshot().slots,levels:skillProgression.snapshot().abilities});drivingPickups.reset();
  skillRunId="";skillSteeringDamage=0;skillLastRepairTime=-100;skillLastDrift=skillLastLanding=skillLastCombo=skillComboStarted=0;skillTuningKey="";skillVisualTime=0;skillPreviousPosition=null;skillProtectedImpact=null;
  skillPickupNetwork=null;skillPickupPlan=[];pickupHosts.clear();pickupRoot.clear();for(const host of miniHosts)host.visible=false;shieldMesh.visible=false;for(const host of pulseHosts)host.visible=false;
};
function skillSnapshot(){return{progression:skillProgression.snapshot(),abilities:activeAbilities.snapshot(),pickups:drivingPickups.snapshot(),steeringDamage:skillSteeringDamage,menuOpen:skillMenuOpen(),cargoMass:currentCargoMass(),persistence:skillPersistence,visualTime:skillVisualTime,pickupHosts:pickupHosts.size,miniHosts:miniHosts.filter(host=>host.visible).length}}
window.longHaulSkills={snapshot:skillSnapshot};
