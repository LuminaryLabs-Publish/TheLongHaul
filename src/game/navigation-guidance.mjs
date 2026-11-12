/** TLH-003: pure, read-only player guidance. Gameplay state belongs to its kits. */
const number = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const m = value => `${Math.round(Math.max(0, value))} m`;
export const GUIDANCE_PRIORITY = Object.freeze({ information: 10, reward: 20, objective: 30, route: 40, interaction: 60, danger: 90 });
export function relevantRouteChoice(course, progress, lead = 310) {
  if (!course || !Number.isFinite(progress)) return null;
  const candidates = (course.routeChoices ?? [])
    .filter(choice => Number.isFinite(choice.warningProgress) && choice.warningProgress >= progress - 12 && choice.warningProgress - progress <= lead)
    .sort((a, b) => a.warningProgress - b.warningProgress || String(a.id).localeCompare(String(b.id)));
  const choice = candidates[0];
  if (!choice) return null;
  const signs = (choice.signIds ?? []).map(id => course.signs?.find(s => s.id === id)).filter(Boolean);
  const sides = choice.kind === 'loading-route' ? { safe: choice.safeSide, express: choice.riskySide } : { option: choice.side };
  // Never guess a direction if world signage and the route contract disagree.
  const consistent = signs.length === (choice.signIds?.length ?? 0) && signs.every((sign, index) =>
    choice.kind === 'loading-route' ? sign.side === (index === 0 ? choice.safeSide : choice.riskySide) :
      sign.side === choice.side);
  return { id: choice.id, kind: choice.kind, leadMeters: Math.max(0, choice.warningProgress - progress),
    sides: Object.freeze(sides), consistent, signIds: (choice.signIds ?? []).slice(),
    text: !consistent ? 'Follow physical road signs' : choice.kind === 'loading-route' ?
      `${sides.safe === 'left' ? 'Wide left' : 'Wide right'} safe · ${sides.express === 'right' ? 'Express right' : 'Express left'} bonus` :
      choice.kind === 'town-loop' ? `${choice.label} · ${sides.option === 'left' ? 'Left' : 'Right'} exit · Returns to highway` :
      `${sides.option === 'left' ? 'Left' : 'Right'} optional · Highway continues` };
}
export function deriveGuidance({ scene = 'driving', truck, run, freight, course, fuel = 100, condition = 100,
  skillPoints = 0, abilitySlots = {}, interaction = '', experience = null, legacy = false } = {}) {
  if (scene !== 'driving' || !truck || !run) return Object.freeze({ active: false, alert: null, route: null });
  const progress = -number(truck.position?.z);
  const contract = freight?.contract;
  const stage = freight?.status ?? '';
  const transition = ['delivered','cargo-lost'].includes(stage);
  const onboard = Boolean(freight?.onboard);
  const target = contract && !transition ? number(onboard ? contract.deliveryProgress : contract.pickupProgress, NaN) : NaN;
  const remaining = Number.isFinite(target) ? Math.max(0, target - progress) : null;
  const available = Boolean(contract && Number.isFinite(remaining));
  const goal = transition ? (stage === 'delivered' ? 'Next pickup ahead' : 'Replacement ahead') :
    !contract ? 'Keep driving' : onboard ? 'Deliver cargo' : 'Pick up freight';
  const destination = !available ? goal : `${goal} · ${m(remaining)}`;
  const route = relevantRouteChoice(course, progress);
  const alerts = [];
  const add = (id, label, priority, persistent = true) => alerts.push({ id, label, priority, persistent });
  const mode = truck.rollMode;
  if (truck.tipped || mode === 'tipped') add('rollover', 'ROLLOVER · F TO RECOVER', GUIDANCE_PRIORITY.danger);
  else if (mode === 'critical') add('rollover-risk', 'TIP RISK · COUNTERSTEER', GUIDANCE_PRIORITY.danger);
  else if (mode === 'wheel-lift') add('wheel-lift', 'WHEELS LIFTING', GUIDANCE_PRIORITY.danger);
  if (number(condition, 100) < 20) add('truck-condition', 'TRUCK CRITICAL · SEEK REPAIR', GUIDANCE_PRIORITY.danger);
  if (number(fuel, 100) < 12) add('fuel', 'LOW FUEL · FIND A GARAGE', GUIDANCE_PRIORITY.danger);
  const deadline = onboard ? number(contract?.remaining, NaN) : NaN;
  if (Number.isFinite(deadline) && deadline <= 20) add('cargo-deadline', `CARGO DEADLINE · ${Math.ceil(Math.max(0, deadline))}s`, GUIDANCE_PRIORITY.danger);
  if (interaction && !truck.tipped && !['tipped','critical'].includes(mode))
    add('interaction', interaction.trim(), GUIDANCE_PRIORITY.interaction);
  if (route && !transition && !onboard && route.leadMeters < 185)
    add(`route:${route.id}`, route.text, GUIDANCE_PRIORITY.route);
  if (skillPoints > 0) add('upgrade', `${skillPoints} SKILL ${skillPoints === 1 ? 'POINT' : 'POINTS'} · U`, GUIDANCE_PRIORITY.information);
  alerts.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const guidance = {
    active: true, goal, destination, targetProgress: available ? target : null, distanceMeters: remaining,
    cargoOnboard: onboard, cargoDeadline: Number.isFinite(deadline) ? Math.max(0, deadline) : null,
    route, alert: alerts[0] ?? null, alerts, truckCondition: clamp(number(condition, 100),0,100),
    fuel: clamp(number(fuel,100),0,100), speedMph: Math.round(Math.abs(number(truck.speed)) * 2.237),
    abilitySlots: { q: abilitySlots.q ?? null, e: abilitySlots.e ?? null },
    experience, legacy, progress, status: stage
  };
  return Object.freeze(guidance);
}
/** Event keys are bounded by game simulation time; there is no independent gameplay clock. */
export function createGuidanceNotifications({ maxSeen = 64 } = {}) {
  const seen = new Map();
  let current = null;
  return Object.freeze({
    offer(event, now) {
      if (!event?.id || !event.label || !Number.isFinite(now)) return current;
      const key = String(event.id);
      if (seen.has(key)) return current;
      seen.set(key, now);
      while (seen.size > maxSeen) seen.delete(seen.keys().next().value);
      const priority = number(event.priority, GUIDANCE_PRIORITY.reward);
      const item = { id: key, label: String(event.label), priority, until: now + clamp(number(event.seconds, 2.6), .2, 8) };
      if (!current || now >= current.until || priority >= current.priority) current = item;
      return current;
    },
    visible(now, persistent = null) {
      if (persistent?.priority >= (current && now < current.until ? current.priority : -Infinity)) return persistent;
      return current && now < current.until ? current : persistent;
    },
    clear() { seen.clear(); current = null; },
    snapshot(now) { return { visible: current && now < current.until ? { ...current } : null, seen: seen.size }; }
  });
}
