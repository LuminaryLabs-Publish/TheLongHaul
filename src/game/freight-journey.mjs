// One continuous product-owned freight state machine. It has no DOM, storage,
// renderer or engine authority: the host supplies physical crossing evidence.
import { getCargoProfile } from './cargo-profiles.mjs';
import { ENDLESS_HIGHWAY_RULES, endlessHighwayPoint, endlessHighwayStation, nextEndlessLoadingStation } from './endless-highway.mjs';

const TYPES = ['standard', 'fragile', 'heavy', 'hazardous', 'unstable'];
const REWARD = { standard: 1, fragile: 1.3, heavy: 1.35, hazardous: 1.5, unstable: 1.45 };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
const clone = value => structuredClone(value);
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9:_-]{1,100}$/.test(value);
const onboardStatuses = ['cargo-onboard', 'in-transit'];
const statuses = ['awaiting-pickup', 'awaiting-replacement', ...onboardStatuses, 'delivered', 'cargo-lost'];
const nonnegative = value => Number.isFinite(value) && value >= 0;
const integer = value => Number.isSafeInteger(value) && value >= 0;
const validPosition = value => value && [value.x, value.z].every(Number.isFinite);
const timeLimitFor = profile => Math.round(68 + profile.massKg / 700);

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const optionalFields = (value, keys, valid) => keys.every(key => !Object.hasOwn(value, key) || valid(value[key]));
const vector = (value, keys = ['x', 'y', 'z']) => record(value) && keys.every(key => Number.isFinite(value[key]));

function validTruckSnapshot(truck) {
  if (!record(truck) || !vector(truck.position) || !vector(truck.velocity) || !Number.isFinite(truck.heading)) return false;
  // loadSnapshot supplies defaults for omitted legacy fields, but a present
  // malformed field overrides that default and can poison subsequent arithmetic.
  if (!optionalFields(truck, ['speed', 'longitudinalSpeed', 'lateralSpeed', 'driftAngle', 'rollAngle', 'rollVelocity',
    'steeringAngle', 'yawRate', 'wheelTravel', 'bodyRoll', 'bodyPitch', 'groundHeight', 'contactRadius',
    'surfaceGrip', 'suspensionCompression', 'suspensionVelocity', 'supportVelocity', 'acceleration', 'weightTransfer', 'cargoShift', 'steeringDamage'], Number.isFinite)
    || !optionalFields(truck, ['airTime', 'flightPeakHeight', 'cargoMass', 'effectiveMass', 'totalMass', 'loadStress'], nonnegative)
    || !optionalFields(truck, ['sequence', 'impactSequence', 'landingSequence'], integer)
    || !optionalFields(truck, ['grounded', 'tipped'], value => typeof value === 'boolean')
    || !optionalFields(truck, ['id', 'surface', 'roadClass', 'roadMaterial', 'contactShape'], value => typeof value === 'string')) return false;
  // These records are merged with defaults by the loader; partial older records
  // remain valid, while nonnumeric supplied components do not.
  for (const [key, fields] of [['groundNormal', ['x', 'y', 'z']], ['lastSafe', ['x', 'y', 'z', 'heading']]]) {
    if (Object.hasOwn(truck, key) && (!record(truck[key]) || !optionalFields(truck[key], fields, Number.isFinite))) return false;
  }
  for (const key of ['loadShift', 'loadShiftVelocity']) if (Object.hasOwn(truck, key) && !vector(truck[key], ['x', 'z'])) return false;
  if (Object.hasOwn(truck, 'flightOrigin') && truck.flightOrigin !== null && !vector(truck.flightOrigin)) return false;
  if (Object.hasOwn(truck, 'lastLanding') && truck.lastLanding !== null) {
    const landing = truck.lastLanding;
    if (!record(landing) || !integer(landing.sequence) || !['airTime', 'impactSpeed', 'distance', 'height'].every(key => nonnegative(landing[key]))
      || !optionalFields(landing, ['effectiveMass', 'energy', 'loadStress'], nonnegative)) return false;
  }
  if (Object.hasOwn(truck, 'lastImpact') && truck.lastImpact !== null) {
    const impact = truck.lastImpact;
    if (!record(impact) || !integer(impact.sequence) || !nonnegative(impact.strength) || !nonnegative(impact.speed) || typeof impact.kind !== 'string'
      || !optionalFields(impact, ['effectiveMass', 'energy'], nonnegative)) return false;
  }
  if (Object.hasOwn(truck, 'drift')) {
    const drift = truck.drift;
    if (!record(drift) || typeof drift.active !== 'boolean' || !['idle', 'sliding', 'countersteer', 'released'].includes(drift.phase)
      || ![-1, 0, 1].includes(drift.direction) || !['energy', 'momentum', 'charge', 'duration', 'distance', 'entrySpeed', 'maxAngle', 'counterTime', 'releaseGrace', 'cooldown'].every(key => nonnegative(drift[key]))
      || !integer(drift.sequence) || !integer(drift.releaseSequence) || drift.charge > 1 || drift.energy > 242 || drift.momentum > 22) return false;
    if (drift.lastManeuver !== null) {
      const maneuver = drift.lastManeuver;
      if (!record(maneuver) || !integer(maneuver.sequence) || !integer(maneuver.releaseSequence) || typeof maneuver.countersteer !== 'boolean' || typeof maneuver.reason !== 'string'
        || !['duration', 'distance', 'entrySpeed', 'exitSpeed', 'maxAngle', 'reserve'].every(key => nonnegative(maneuver[key]))) return false;
    }
  }
  if (Object.hasOwn(truck, 'input')) {
    const input = truck.input;
    if (!record(input) || !optionalFields(input, ['throttle', 'brake', 'steer', 'pitchControl', 'steeringDamage'], Number.isFinite)
      || !optionalFields(input, ['handbrake', 'boost', 'rush', 'drift'], value => typeof value === 'boolean')) return false;
    if (Object.hasOwn(input, 'barrierContacts') && (!Array.isArray(input.barrierContacts) || input.barrierContacts.some(contact =>
      !vector(contact, ['x', 'z']) || typeof contact.id !== 'string' || !nonnegative(contact.radius)))) return false;
  }
  if (Object.hasOwn(truck, 'roundaboutContacts') && (!Array.isArray(truck.roundaboutContacts) || truck.roundaboutContacts.some(contact =>
    !record(contact) || typeof contact.id !== 'string' || !nonnegative(contact.impactSpeed)))) return false;
  return true;
}

function validJourney(value) {
  if (!value || value.schema !== 'long-haul.freight/1' || !validId(value.sessionId) || typeof value.seed !== 'string' || !statuses.includes(value.status)) return false;
  if (!integer(value.ordinal) || value.ordinal < 1 || !integer(value.sequence) || value.sequence < 1) return false;
  if (!['earnedCash', 'completed', 'lost', 'missed'].every(k => integer(value[k]))) return false;
  if (!['highWaterProgress', 'elapsed', 'totalLoadedDistance', 'transitionRemaining'].every(k => nonnegative(value[k])) || !Number.isFinite(value.progress)) return false;
  if (value.highWaterProgress + 1e-6 < Math.max(0, value.progress) || value.totalLoadedDistance > value.highWaterProgress + 1 || value.transitionRemaining > 3) return false;
  const final = ['delivered', 'cargo-lost'].includes(value.status);
  if (value.completed + value.lost !== value.ordinal - (final ? 0 : 1) || value.earnedCash > value.completed * 1000) return false;
  const c = value.contract, profile = getCargoProfile(c?.profileId);
  if (!c || !profile || c.id !== `${value.sessionId}:freight:${value.ordinal}` || c.ordinal !== value.ordinal || !integer(c.stationIndex)) return false;
  if (!['pickupProgress', 'deliveryProgress', 'remaining', 'timeLimit', 'loadedDistance', 'condition', 'massKg'].every(k => nonnegative(c[k])) || !Number.isFinite(c.assignedAt)) return false;
  const pickupProgress = ENDLESS_HIGHWAY_RULES.firstStationProgress + c.stationIndex * ENDLESS_HIGHWAY_RULES.stationSpacing;
  if (c.pickupProgress !== pickupProgress || c.massKg !== profile.massKg || c.timeLimit !== timeLimitFor(profile) || c.remaining > c.timeLimit || c.condition > 100) return false;
  if (!integer(c.misses) || !integer(c.receiverMisses) || c.receiverMisses > 1 || c.misses > value.missed || c.recoveryOffered !== (c.misses > 0)) return false;
  if (typeof c.routeRewarded !== 'boolean' || typeof c.paid !== 'boolean' || c.loadedDistance > value.totalLoadedDistance + 1e-6) return false;
  if (c.deliveryProgress < c.pickupProgress + 560 || (!c.receiverMisses && c.deliveryProgress !== c.pickupProgress + 560)) return false;
  if (c.loadedDistance > Math.max(0, value.highWaterProgress - c.pickupProgress) + 1) return false;
  const awaiting = value.status === 'awaiting-pickup' || value.status === 'awaiting-replacement';
  if (awaiting && (c.paid || c.remaining || c.loadedDistance || c.pickedRoute !== null || c.routeRewarded || c.receiverMisses)) return false;
  if (!awaiting && !['safe', 'risky'].includes(c.pickedRoute)) return false;
  if (c.routeRewarded && c.pickedRoute !== 'risky') return false;
  if (onboardStatuses.includes(value.status) && (c.paid || c.condition <= 0 || c.remaining <= 0)) return false;
  if (value.status === 'delivered' && (!c.paid || c.loadedDistance < 450 || c.condition <= 0 || c.remaining <= 0)) return false;
  if (value.status !== 'delivered' && c.paid) return false;
  if (final) {
    const outcome = value.lastOutcome;
    if (!outcome || outcome.contractId !== c.id || outcome.profileId !== c.profileId || outcome.kind !== (value.status === 'delivered' ? 'delivered' : 'lost')) return false;
    if (value.status === 'delivered') {
      const timeBonus = Math.round(Math.min(95, c.remaining * 1.1));
      const cash = Math.round((260 + c.condition * 2) * REWARD[c.profileId]) + timeBonus;
      if (outcome.ordinal !== c.ordinal || outcome.cash !== cash || outcome.timeBonus !== timeBonus || outcome.condition !== c.condition || cash > value.earnedCash) return false;
    } else if (outcome.cash !== 0 || typeof outcome.reason !== 'string') return false;
  }
  return true;
}

export function freightDifficulty(progress = 0, completed = 0, cargo = null) {
  const level = clamp(Math.floor(Math.max(0, finite(progress)) / 2800) + Math.floor(Math.max(0, finite(completed)) / 5), 0, 6);
  const heavy = (cargo?.massKg ?? 0) > 4500;
  return { level, trafficLimit: 3 + Math.min(4, level), trafficSpeed: 14 + level * 1.2,
    warningLead: 170 + level * 8 + (heavy ? 45 : 0), minimumGap: Math.max(34, 56 - level * 3) + (heavy ? 12 : 0),
    recoveryEvery: 4, minimumClearWidth: heavy ? 9 : 7.5 };
}

export function freightGateCrossing(previous, current, gate, { speed = 0, heading = 0, dt = 0, grounded = true } = {}) {
  if (!validPosition(previous) || !validPosition(current) || !validPosition(gate?.point) || !grounded || !Number.isFinite(speed) || speed < 2 || !Number.isFinite(heading) || !Number.isFinite(gate.point.heading) || !Number.isFinite(gate.halfWidth) || gate.halfWidth <= 0 || !Number.isFinite(dt) || dt <= 0) return false;
  const travel = Math.hypot(current.x - previous.x, current.z - previous.z);
  if (!Number.isFinite(travel) || travel > Math.max(8, Math.abs(speed) * Math.min(.1, dt) * 2 + 3)) return false;
  const { point } = gate, s = Math.sin(point.heading), c = Math.cos(point.heading);
  if (Math.cos(heading - point.heading) < .65) return false;
  const local = p => ({ along: (p.x - point.x) * s + (p.z - point.z) * c, side: (p.x - point.x) * c - (p.z - point.z) * s });
  const a = local(previous), b = local(current);
  if (a.along >= 0 || b.along < 0 || b.along <= a.along) return false;
  const t = -a.along / (b.along - a.along), side = a.side + (b.side - a.side) * t;
  return Math.abs(side) <= gate.halfWidth;
}

export function createFreightJourney({ seed = 'long-haul', sessionId, initialType = 'standard', snapshot = null } = {}) {
  if (!validId(sessionId)) throw new Error('A valid freight session identity is required');
  const course = { seed: String(seed), endless: true };
  let state = { schema: 'long-haul.freight/1', sessionId, seed: String(seed), ordinal: 0,
    status: 'assigned', contract: null, completed: 0, lost: 0, missed: 0,
    earnedCash: 0, highWaterProgress: 0, progress: 0, elapsed: 0, totalLoadedDistance: 0,
    lastOutcome: null, transitionRemaining: 0, routeAttempt: null, sequence: 0 };
  const events = [];
  let previousPosition = null;
  const emit = (type, detail = {}) => { const event = { type, sequence: ++state.sequence, time: state.elapsed, ...detail }; events.push(event); return event; };

  function assign(progress, replacement = false) {
    const station = nextEndlessLoadingStation(course, progress, 90);
    const offset = Math.max(0, TYPES.indexOf(initialType === 'express' ? 'hazardous' : initialType));
    const profileId = TYPES[(offset + state.ordinal) % TYPES.length], profile = getCargoProfile(profileId);
    state.ordinal++;
    state.contract = { id: `${sessionId}:freight:${state.ordinal}`, ordinal: state.ordinal, profileId,
      massKg: profile.massKg, stationIndex: station.index, pickupProgress: station.progress,
      deliveryProgress: station.progress + 560, remaining: 0, timeLimit: timeLimitFor(profile),
      loadedDistance: 0, misses: 0, receiverMisses: 0, recoveryOffered: false, routeRewarded: false,
      condition: 100, pickedRoute: null, paid: false, assignedAt: progress };
    state.status = replacement ? 'awaiting-replacement' : 'awaiting-pickup';
    state.transitionRemaining = 0;
    state.routeAttempt = null;
    emit('contract-assigned', { contractId: state.contract.id, profileId, stationId: station.id, replacement });
  }

  function cargoOnboard() { return onboardStatuses.includes(state.status); }
  function lose(reason) {
    if (!cargoOnboard()) return false;
    state.status = 'cargo-lost'; state.lost++; state.transitionRemaining = 2.2;
    state.routeAttempt = null;
    state.lastOutcome = { kind: 'lost', reason, contractId: state.contract.id, profileId: state.contract.profileId, cash: 0 };
    emit('cargo-lost', clone(state.lastOutcome));
    return true;
  }

  function tick(input = {}) {
    events.length = 0;
    if (input.active === false) { previousPosition = input.position ? clone(input.position) : null; return []; }
    const dt = clamp(finite(input.dt), 0, .1);
    const position = input.position;
    if (!validPosition(position)) return [];
    // Both highway branches use exactly z = -progress. Derive it from the real
    // position so a mismatched host counter cannot award phantom road metres.
    const progress = -position.z || 0;
    const oldProgress = state.progress, oldHighWater = state.highWaterProgress, advance = progress - oldProgress;
    const physicalStep = dt > 0 && previousPosition && Math.hypot(position.x - previousPosition.x, position.z - previousPosition.z) <= Math.max(8, Math.abs(finite(input.speed)) * dt * 2 + 3);
    const forward = physicalStep && advance > 0 && finite(input.speed) > 0;
    const newRoad = progress >= state.highWaterProgress - 8;
    state.progress = progress; state.highWaterProgress = Math.max(state.highWaterProgress, progress); state.elapsed += dt;
    if (!state.contract) assign(progress);
    const contract = state.contract;

    if (state.status === 'delivered' || state.status === 'cargo-lost') {
      state.transitionRemaining -= dt;
      if (state.transitionRemaining <= 0) assign(progress, state.status === 'cargo-lost');
      previousPosition = clone(position); return clone(events);
    }

    if (cargoOnboard()) {
      contract.condition = clamp(finite(input.cargoCondition, contract.condition), 0, 100);
      contract.remaining = Math.max(0, contract.remaining - dt - Math.max(0, finite(input.penaltySeconds)));
      if (forward) { const distance = Math.min(Math.max(0, progress - oldHighWater), advance, Math.max(8, finite(input.speed) * dt * 2)); contract.loadedDistance += distance; state.totalLoadedDistance += distance; }
      if (contract.condition <= 0) lose('cargo-destroyed');
      else if (contract.remaining <= 0) lose('deadline-expired');
      else {
        if (state.status === 'cargo-onboard' && progress > contract.pickupProgress + 8) { state.status = 'in-transit'; emit('cargo-in-transit', { contractId: contract.id }); }
        const gate = deliveryGate();
        if (newRoad && contract.loadedDistance >= 450 && freightGateCrossing(previousPosition, position, gate, input)) {
          const timeBonus = Math.round(Math.min(95, contract.remaining * 1.1));
          const cash = Math.round((260 + contract.condition * 2) * REWARD[contract.profileId]) + timeBonus;
          contract.paid = true; state.earnedCash += cash; state.completed++; state.status = 'delivered'; state.transitionRemaining = 1.8;
          state.lastOutcome = { kind: 'delivered', contractId: contract.id, ordinal: contract.ordinal, profileId: contract.profileId, cash, timeBonus, condition: contract.condition };
          emit('cargo-delivered', clone(state.lastOutcome));
        } else if (progress > contract.deliveryProgress + 50) {
          // One forward receiver retry is forgiving without becoming an
          // unlimited deadline extension or a repeated rescue reward.
          if (contract.receiverMisses >= 1) lose('receiver-missed');
          else {
            contract.receiverMisses++;
            contract.deliveryProgress = Math.ceil((progress + 250) / 160) * 160;
            contract.remaining = Math.min(contract.timeLimit, contract.remaining + 14);
            emit('receiver-missed', { contractId: contract.id, deliveryProgress: contract.deliveryProgress });
          }
        }
      }
    }

    const station = endlessHighwayStation(course, contract.stationIndex);
    if (['awaiting-pickup', 'awaiting-replacement'].includes(state.status)) {
      const decision = station.entryProgress + 52;
      if (!state.routeAttempt && forward && newRoad && oldProgress < decision && progress >= decision) {
        const risky = endlessHighwayPoint(course, progress, 0, 'risky'), safe = endlessHighwayPoint(course, progress);
        const rd = Math.hypot(position.x - risky.x, position.z - risky.z), sd = Math.hypot(position.x - safe.x, position.z - safe.z);
        const route = rd < sd && rd < 5 ? 'risky' : 'safe';
        state.routeAttempt = { stationId: station.id, route, startProgress: progress, collisionCount: finite(input.collisionCount), clean: true, picked: false, maxError: 0, recovery: contract.misses > 0 && contract.recoveryOffered };
        emit('loading-route-entered', { stationId: station.id, route });
      }
      for (const route of ['safe', 'risky']) {
        if (!newRoad || !freightGateCrossing(previousPosition, position, station[route], input)) continue;
        state.status = 'cargo-onboard'; contract.condition = 100; contract.remaining = contract.timeLimit;
        contract.loadedDistance = 0; contract.pickedRoute = route;
        if (state.routeAttempt?.route === route) state.routeAttempt.picked = true;
        else state.routeAttempt = null;
        emit('cargo-picked-up', { contractId: contract.id, profileId: contract.profileId, massKg: contract.massKg, route, stationId: station.id });
        break;
      }
      if (!cargoOnboard() && progress > station.progress + 42) {
        contract.misses++; state.missed++;
        const offerRecovery = !contract.recoveryOffered && contract.misses === 1;
        contract.recoveryOffered = true;
        const next = nextEndlessLoadingStation(course, progress, 90);
        contract.stationIndex = next.index; contract.pickupProgress = next.progress; contract.deliveryProgress = next.progress + 560;
        state.routeAttempt = null; state.status = 'awaiting-replacement';
        emit('pickup-missed', { contractId: contract.id, stationId: next.id, offerRecovery });
      }
    }

    const attempt = state.routeAttempt;
    if (attempt && attempt.stationId === station.id) {
      const point = endlessHighwayPoint(course, progress, 0, attempt.route);
      const error = Math.hypot(position.x - point.x, position.z - point.z);
      attempt.maxError = Math.max(attempt.maxError, error);
      if (!physicalStep || !forward || finite(input.collisionCount) !== attempt.collisionCount || input.grounded === false || finite(input.speed) < station.challenge.minForwardSpeed || (attempt.route === 'risky' && error > station.challenge.maxLateralError)) attempt.clean = false;
      if (progress >= station.exitProgress - 6) {
        if (attempt.route === 'risky' && attempt.clean && attempt.picked && newRoad && cargoOnboard() && !contract.routeRewarded) {
          contract.routeRewarded = true;
          emit('loading-route-complete', { id: `${contract.id}:${station.id}`, contractId: contract.id, ordinal: contract.ordinal, stationId: station.id, speed: input.speed, distance: progress - attempt.startProgress, recovery: attempt.recovery, clean: true });
        }
        state.routeAttempt = null;
      }
    }
    previousPosition = clone(position);
    return clone(events);
  }

  function deliveryGate() {
    if (!state.contract) return null;
    return { id: `${state.contract.id}:receiver`, point: endlessHighwayPoint(course, state.contract.deliveryProgress), halfWidth: 11, length: 40 };
  }
  function getState() {
    const value = clone(state);
    value.onboard = cargoOnboard();
    value.cargo = value.onboard ? { ...getCargoProfile(value.contract.profileId), massKg: value.contract.massKg, condition: value.contract.condition } : null;
    value.pickupStation = value.contract ? endlessHighwayStation(course, value.contract.stationIndex) : null;
    value.deliveryGate = deliveryGate();
    value.difficulty = freightDifficulty(value.highWaterProgress, value.completed, value.cargo);
    return value;
  }

  function restore(value) {
    if (!validJourney(value) || value.seed !== state.seed || value.sessionId !== sessionId) return false;
    state = clone(value); state.routeAttempt = null; previousPosition = null;
    return true;
  }

  function resetPosition(position = null) {
    previousPosition = validPosition(position) ? clone(position) : null;
    state.routeAttempt = null;
    if (previousPosition) { state.progress = -previousPosition.z || 0; state.highWaterProgress = Math.max(state.highWaterProgress, state.progress); }
  }

  if (snapshot !== null) { if (!restore(snapshot)) throw new Error('Invalid freight checkpoint'); }
  else assign(0);
  events.length = 0;
  return { tick, getState, snapshot: () => clone(state), restore, lose, cargoOnboard, deliveryGate, resetPosition };
}

// Pure preparation for one atomic localStorage write. Receipts live beside the
// checkpoint, so a reload cannot replay a payment from an older checkpoint.
export function prepareFreightSave(save, checkpoint, { expectedRevision = null } = {}) {
  if (!save || typeof save !== 'object' || Array.isArray(save) || !nonnegative(save.cash) || (save.deliveries !== undefined && !integer(save.deliveries)) || (save.careerMiles !== undefined && !nonnegative(save.careerMiles))) return { ok: false, reason: 'invalid-save' };
  const journey = checkpoint?.journey;
  const truck = checkpoint?.truck, run = checkpoint?.run;
  if (checkpoint?.schema !== 'long-haul.freight-checkpoint/1' || !validJourney(journey) || !integer(checkpoint.bankedPoints)
    || !validTruckSnapshot(truck)
    || !run || !nonnegative(run.rawTime) || !nonnegative(run.distance) || !['idle', 'running', 'paused', 'failed'].includes(run.status)
    || !checkpoint.meters || !['fuel', 'truck', 'cargo'].every(key => nonnegative(checkpoint.meters[key]) && checkpoint.meters[key] <= 100)
    || typeof checkpoint.terminal !== 'boolean') return { ok: false, reason: 'invalid-checkpoint' };
  const old = save.freightJourney;
  if (old && (!integer(old.revision) || old.revision < 1)) return { ok: false, reason: 'invalid-save' };
  if (expectedRevision !== null && !integer(expectedRevision)) return { ok: false, reason: 'invalid-revision' };
  if (expectedRevision !== null && (old?.revision ?? 0) !== expectedRevision) return { ok: false, reason: 'save-conflict' };
  if (save.freightReceipts !== undefined && !Array.isArray(save.freightReceipts)) return { ok: false, reason: 'invalid-receipts' };
  const receipts = save.freightReceipts ?? [];
  if (receipts.some(x => !x || !validId(x.sessionId) || !integer(x.paid) || !integer(x.completed) || !nonnegative(x.distance) || !integer(x.ordinal) || x.ordinal < 1
    || !nonnegative(x.elapsed) || !integer(x.sequence) || !integer(x.earnedCash) || !integer(x.bankedPoints) || !integer(x.lost) || !integer(x.missed) || !nonnegative(x.totalLoadedDistance) || !nonnegative(x.highWaterProgress)
    || x.paid !== Math.floor(x.earnedCash + x.bankedPoints / 20) || x.completed + x.lost > x.ordinal || x.totalLoadedDistance > x.highWaterProgress + 1)
    || new Set(receipts.map(x => x.sessionId)).size !== receipts.length) return { ok: false, reason: 'invalid-receipts' };
  if (old && (!validId(old.journey?.sessionId) || !receipts.some(x => x.sessionId === old.journey.sessionId))) return { ok: false, reason: 'invalid-receipts' };
  if (old && validJourney(old.journey)) {
    const activeReceipt = receipts.find(x => x.sessionId === old.journey.sessionId);
    if (activeReceipt.ordinal !== old.journey.ordinal || activeReceipt.earnedCash !== old.journey.earnedCash || activeReceipt.bankedPoints !== old.bankedPoints
      || activeReceipt.completed !== old.journey.completed || activeReceipt.lost !== old.journey.lost || activeReceipt.highWaterProgress !== old.journey.highWaterProgress || activeReceipt.distance !== old.run?.distance
      || activeReceipt.sequence !== old.journey.sequence || activeReceipt.elapsed !== old.journey.elapsed) return { ok: false, reason: 'invalid-receipts' };
  }
  const known = receipts.find(x => x.sessionId === journey.sessionId);
  if (known && old?.journey?.sessionId !== journey.sessionId) return { ok: false, reason: 'inactive-session' };
  if (known && old?.terminal && !checkpoint.terminal) return { ok: false, reason: 'closed-session' };
  const previous = known ?? { sessionId: journey.sessionId, paid: 0, completed: 0, distance: 0, highWaterProgress: 0, ordinal: 0, elapsed: 0, sequence: 0, earnedCash: 0, bankedPoints: 0, lost: 0, missed: 0, totalLoadedDistance: 0 };
  if (journey.ordinal < previous.ordinal) return { ok: false, reason: 'stale-contract' };
  if (journey.elapsed + 1e-6 < previous.elapsed || journey.sequence < previous.sequence || journey.earnedCash < previous.earnedCash || checkpoint.bankedPoints < previous.bankedPoints
    || journey.completed < previous.completed || journey.lost < previous.lost || journey.missed < previous.missed || journey.highWaterProgress + 1e-6 < previous.highWaterProgress || journey.totalLoadedDistance + 1e-6 < previous.totalLoadedDistance || run.distance + 1e-6 < previous.distance) return { ok: false, reason: 'stale-checkpoint' };
  const total = Math.floor(journey.earnedCash + Math.max(0, finite(checkpoint.bankedPoints)) / 20), cash = Math.max(0, total - previous.paid);
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(save.cash + cash) || total < previous.paid) return { ok: false, reason: 'invalid-payment' };
  const completed = Math.max(0, journey.completed - previous.completed), distance = Math.max(0, run.distance - previous.distance);
  const receipt = { sessionId: journey.sessionId, paid: total, completed: journey.completed, distance: Math.max(previous.distance, run.distance), highWaterProgress: journey.highWaterProgress, ordinal: journey.ordinal,
    elapsed: journey.elapsed, sequence: journey.sequence, earnedCash: journey.earnedCash, bankedPoints: checkpoint.bankedPoints, lost: journey.lost, missed: journey.missed, totalLoadedDistance: journey.totalLoadedDistance };
  const next = { ...clone(save), cash: save.cash + cash, deliveries: finite(save.deliveries) + completed,
    careerMiles: finite(save.careerMiles) + distance / 1609.344,
    // One compact receipt per driving session, independent of its delivery
    // count. Never discard old identity evidence and reopen its payouts.
    freightReceipts: [...receipts.filter(x => x.sessionId !== journey.sessionId), receipt],
    freightJourney: { ...clone(checkpoint), revision: (old?.revision ?? 0) + 1 } };
  return { ok: true, save: next, cash, revision: next.freightJourney.revision };
}
