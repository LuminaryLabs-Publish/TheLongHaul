import assert from 'node:assert/strict';
import * as N from '../vendor/nexusengine.mjs';
import { createFreightJourney, freightDifficulty, freightGateCrossing, prepareFreightSave } from '../src/game/freight-journey.mjs';
import { endlessHighwayPoint } from '../src/game/endless-highway.mjs';
import { createLongHaulTruckKit } from '../src/game/truck-kit.mjs';

const seed = 'freight-regression';
let identities = 0;
function driveTrace({ initialType = 'standard', sessionId = `freight-test-${++identities}`, snapshot = null } = {}) {
  const journey = createFreightJourney({ seed, sessionId, initialType, snapshot });
  let progress = snapshot?.progress ?? 0, collisions = 0;
  const events = [];
  const sample = (next, options = {}) => {
    progress = next;
    const point = endlessHighwayPoint(seed, progress, options.lateral ?? 0, options.route ?? 'safe');
    if (options.hit) collisions++;
    const input = { position: point, progress, heading: point.heading, speed: 40, dt: 1 / 60,
      grounded: true, active: true, cargoCondition: 100, collisionCount: collisions, ...options };
    if (options.heading !== undefined) input.heading = options.heading;
    const result = journey.tick(input); events.push(...result); return result;
  };
  sample(progress, { speed: 0 });
  const driveTo = (target, options = {}) => {
    const direction = target >= progress ? 1 : -1;
    const step = direction * (options.speed ?? 40) / 60;
    for (let guard = 0; Math.abs(target - progress) > 1e-7 && guard < 100000; guard++) {
      const next = direction > 0 ? Math.min(target, progress + step) : Math.max(target, progress + step);
      sample(next, { ...options, speed: direction * Math.abs(options.speed ?? 40) });
    }
    return journey.getState();
  };
  const hold = (seconds, options = {}) => { for (let i = 0; i < Math.ceil(seconds * 10); i++) sample(progress, { dt: 0.1, speed: 0, ...options }); return journey.getState(); };
  return { journey, events, sample, driveTo, hold, get progress() { return progress; }, get collisions() { return collisions; } };
}

function checkpoint(trace, bankedPoints = 0, terminal = false) {
  const journey = trace.journey.snapshot(), p = endlessHighwayPoint(seed, journey.progress);
  return { schema: 'long-haul.freight-checkpoint/1', journey,
    truck: { position: { x: p.x, y: 0.92, z: p.z }, velocity: { x: 0, y: 0, z: -40 }, heading: p.heading },
    run: { status: terminal ? 'failed' : 'running', rawTime: journey.elapsed, distance: journey.highWaterProgress },
    meters: { fuel: 80, truck: 90, cargo: journey.contract.condition }, bankedPoints, bestMultiplier: 2, initialType: 'standard', terminal };
}

// Swept samples remain physically adjacent even when they pass a thin gate
// between frames. These are deterministic motion traces; browser driving is a
// separate real-input acceptance gate.
const gate = { point: { x: 0, z: 0, heading: Math.PI }, halfWidth: 3.2 };
const before = { x: 0, z: 1 }, after = { x: 0, z: -1 };
const crossing = { speed: 60, heading: Math.PI, dt: 1 / 60, grounded: true };
assert.equal(freightGateCrossing(before, after, gate, crossing), true);
assert.equal(freightGateCrossing(before, after, gate, { ...crossing, speed: 0 }), false);
assert.equal(freightGateCrossing(before, after, gate, { ...crossing, speed: -60 }), false);
assert.equal(freightGateCrossing(before, after, gate, { ...crossing, dt: 0 }), false);
assert.equal(freightGateCrossing(before, after, gate, { ...crossing, heading: 0 }), false);
assert.equal(freightGateCrossing(before, after, gate, { ...crossing, grounded: false }), false);
assert.equal(freightGateCrossing(after, before, gate, crossing), false);
assert.equal(freightGateCrossing({ x: 0, z: 100 }, { x: 0, z: -100 }, gate, crossing), false);
assert.equal(freightGateCrossing({ x: 4, z: 1 }, { x: 4, z: -1 }, gate, crossing), false);
assert.equal(freightGateCrossing(before, after, { ...gate, halfWidth: NaN }, crossing), false);

const continuous = driveTrace();
const initialCheckpoint = checkpoint(continuous);
continuous.driveTo(1100);
assert.equal(continuous.journey.getState().completed, 1);
assert.equal(continuous.journey.getState().status, 'delivered');
const firstPaidCheckpoint = checkpoint(continuous, 420);
const firstCash = continuous.journey.getState().earnedCash;
continuous.driveTo(1200);
assert.equal(continuous.journey.getState().status, 'awaiting-pickup');
assert.equal(continuous.journey.getState().contract.profileId, 'fragile');
assert.equal(continuous.journey.getState().transitionRemaining, 0);
continuous.driveTo(2010, { route: 'risky' });
assert.equal(continuous.journey.getState().completed, 2);
assert.equal(continuous.events.filter(e => e.type === 'loading-route-complete').length, 1);
continuous.driveTo(2420);
assert.equal(continuous.journey.getState().contract.profileId, 'heavy');
assert.equal(continuous.journey.cargoOnboard(), true);
continuous.sample(2420.5, { cargoCondition: 0 });
assert.equal(continuous.journey.getState().status, 'cargo-lost');
assert.equal(continuous.journey.getState().lost, 1);
assert.equal(continuous.events.at(-1).reason, 'cargo-destroyed');
continuous.driveTo(2550);
assert.equal(continuous.journey.getState().status, 'awaiting-replacement');
continuous.driveTo(3930);
assert.equal(continuous.journey.getState().completed, 3);
assert.equal(continuous.journey.getState().lost, 1);
assert.equal(continuous.journey.getState().contract.profileId, 'hazardous');
assert.equal(continuous.events.filter(e => e.type === 'cargo-delivered').length, 3);
assert.equal(continuous.events.filter(e => e.type === 'cargo-picked-up').length, 4);
assert.ok(continuous.journey.getState().earnedCash > firstCash * 2);
assert.equal(continuous.journey.restore(continuous.journey.snapshot()), true, 'continuous state remains valid across several outcomes');

const expired = driveTrace(); expired.driveTo(490);
const beforePause = expired.journey.snapshot(); expired.hold(20, { active: false });
assert.deepEqual(expired.journey.snapshot(), beforePause, 'pause does not consume the delivery deadline');
expired.hold(90);
assert.equal(expired.journey.getState().lost, 1);
assert.equal(expired.journey.getState().earnedCash, 0);
assert.equal(expired.events.find(e => e.type === 'cargo-lost').reason, 'deadline-expired');
assert.equal(expired.journey.getState().status, 'awaiting-replacement');
assert.equal(expired.journey.restore(expired.journey.snapshot()), true);

const missedReceiver = driveTrace(); missedReceiver.driveTo(800);
missedReceiver.driveTo(1495, { lateral: 35 });
assert.equal(missedReceiver.events.filter(e => e.type === 'receiver-missed').length, 1, 'only one deadline extension is possible');
assert.equal(missedReceiver.journey.getState().status, 'cargo-lost');
assert.equal(missedReceiver.events.at(-1).reason, 'receiver-missed');
assert.equal(missedReceiver.journey.getState().earnedCash, 0);

const missedPickup = driveTrace();
missedPickup.driveTo(1650, { lateral: 60 });
assert.equal(missedPickup.journey.getState().missed, 2);
assert.equal(missedPickup.events.filter(e => e.type === 'pickup-missed' && e.offerRecovery).length, 1);
assert.equal(missedPickup.journey.getState().earnedCash, 0);
missedPickup.driveTo(2600, { route: 'risky' });
const recoveryRewards = missedPickup.events.filter(e => e.type === 'loading-route-complete');
assert.equal(recoveryRewards.length, 1);
assert.equal(recoveryRewards[0].recovery, true);
assert.equal(missedPickup.journey.getState().contract.routeRewarded, true);
missedPickup.driveTo(2480, { route: 'risky' }); missedPickup.driveTo(2600, { route: 'risky' });
assert.equal(missedPickup.events.filter(e => e.type === 'loading-route-complete').length, 1, 'the same shortcut cannot award twice');

for (const failure of ['collision', 'airborne', 'slow', 'reverse', 'off-line']) {
  const route = driveTrace(); route.driveTo(420, { route: 'risky' });
  if (failure === 'reverse') { route.driveTo(415, { route: 'risky' }); route.driveTo(420, { route: 'risky' }); }
  else route.sample(420.5, { route: 'risky', hit: failure === 'collision', grounded: failure !== 'airborne', speed: failure === 'slow' ? 3 : 40, lateral: failure === 'off-line' ? 4 : 0 });
  route.driveTo(660, { route: 'risky' });
  assert.equal(route.events.filter(e => e.type === 'loading-route-complete').length, 0, `${failure} cannot count as a clean express route`);
}

const teleport = driveTrace(); teleport.driveTo(470);
teleport.sample(490);
assert.equal(teleport.journey.cargoOnboard(), false, 'teleporting through pickup does not collect cargo');
const noDistanceFarm = driveTrace(); noDistanceFarm.driveTo(490);
noDistanceFarm.sample(1030);
for (let i = 0; i < 30; i++) { noDistanceFarm.driveTo(1022); noDistanceFarm.driveTo(1030); }
assert.ok(noDistanceFarm.journey.getState().contract.loadedDistance < 15, 'replaying already driven metres cannot satisfy delivery distance');
noDistanceFarm.driveTo(1050);
assert.equal(noDistanceFarm.journey.getState().completed, 0);
const reset = driveTrace(); reset.driveTo(420, { route: 'risky' });
reset.journey.resetPosition(endlessHighwayPoint(seed, 470, 0, 'risky'));
reset.sample(470, { route: 'risky' }); reset.driveTo(660, { route: 'risky' });
assert.equal(reset.journey.cargoOnboard(), true);
assert.equal(reset.events.filter(e => e.type === 'loading-route-complete').length, 0, 'recovery invalidates earlier shortcut proof');

const restoredSource = driveTrace({ initialType: 'unstable' }); restoredSource.driveTo(700, { route: 'risky' });
const restored = driveTrace({ initialType: 'unstable', sessionId: restoredSource.journey.getState().sessionId, snapshot: restoredSource.journey.snapshot() });
assert.equal(restored.journey.cargoOnboard(), true);
restored.driveTo(1050);
assert.equal(restored.journey.getState().completed, 1);
assert.equal(restored.events.filter(e => e.type === 'loading-route-complete').length, 0);
const reverseOrigin = driveTrace(); reverseOrigin.driveTo(-25);
assert.equal(reverseOrigin.journey.restore(reverseOrigin.journey.snapshot()), true, 'legitimate reverse travel before origin can be saved');
const preserved = restored.journey.snapshot();
for (const mutate of [s => { s.sequence = NaN; }, s => { s.ordinal = -1; }, s => { s.completed = 1e6; }, s => { s.contract.massKg = 0; }, s => { s.contract.profileId = 'constructor'; }, s => { s.contract.paid = false; }, s => { s.highWaterProgress = 0; }, s => { s.contract.timeLimit = 299; }]) {
  const bad = structuredClone(preserved); mutate(bad);
  assert.equal(restored.journey.restore(bad), false);
  assert.deepEqual(restored.journey.snapshot(), preserved, 'invalid restore leaves active play untouched');
  assert.throws(() => createFreightJourney({ seed, sessionId: preserved.sessionId, snapshot: bad }), /Invalid freight checkpoint/);
}

const wallet = { cash: 500, deliveries: 0, careerMiles: 0, upgrades: { engine: 2 }, unrelated: { keep: true } };
const walletBefore = structuredClone(wallet), initialBefore = structuredClone(initialCheckpoint);
let write = prepareFreightSave(wallet, initialCheckpoint, { expectedRevision: 0 });
assert.equal(write.ok, true); assert.equal(write.cash, 0);
assert.deepEqual(wallet, walletBefore); assert.deepEqual(initialCheckpoint, initialBefore);
let save = write.save;
write = prepareFreightSave(save, firstPaidCheckpoint, { expectedRevision: write.revision });
assert.equal(write.ok, true);
assert.equal(write.cash, firstCash + 21);
assert.equal(write.save.deliveries, 1);
assert.equal(write.save.freightReceipts.length, 1);
save = write.save;
const duplicate = prepareFreightSave(save, firstPaidCheckpoint, { expectedRevision: write.revision });
assert.equal(duplicate.ok, true); assert.equal(duplicate.cash, 0);
assert.equal(duplicate.save.cash, save.cash);
assert.equal(duplicate.save.deliveries, 1);
assert.deepEqual(duplicate.save.upgrades, wallet.upgrades);
assert.deepEqual(duplicate.save.unrelated, wallet.unrelated);
assert.equal(prepareFreightSave(save, firstPaidCheckpoint, { expectedRevision: 0 }).reason, 'save-conflict');
assert.equal(prepareFreightSave(save, initialCheckpoint, { expectedRevision: write.revision }).reason, 'stale-checkpoint');
assert.equal(prepareFreightSave({ ...save, freightReceipts: [] }, firstPaidCheckpoint).reason, 'invalid-receipts');
assert.equal(prepareFreightSave({ ...save, freightReceipts: [...save.freightReceipts, ...save.freightReceipts] }, firstPaidCheckpoint).reason, 'invalid-receipts');
assert.equal(prepareFreightSave({ ...save, cash: NaN }, firstPaidCheckpoint).reason, 'invalid-save');
for (const mutate of [c => { c.journey.earnedCash = 1e8; }, c => { c.bankedPoints = Infinity; }, c => { c.truck.position.y = NaN; }, c => { c.truck.speed = NaN; }, c => { c.truck.lastSafe = { x: 0, y: 0, z: 0, heading: Infinity }; }, c => { c.meters.fuel = -1; }, c => { c.journey.completed = -1; }]) {
  const bad = structuredClone(firstPaidCheckpoint); mutate(bad);
  assert.equal(prepareFreightSave(save, bad).ok, false, 'corrupt checkpoints cannot settle money');
}

// Exercise admission against actual engine snapshots, including airborne and
// landed states, rather than assuming a hand-written fixture matches the loader.
const truckKit = createLongHaulTruckKit(N);
const truckEngine = N.createEngine({ tick: { maxDelta: 1 / 15, rejectReentry: true }, kits: [truckKit.kit] });
truckEngine.world.__longHaulScene = 'driving';
const truckApi = truckEngine.n.longHaulTruck;
truckApi.reset({ y: .92 }); truckEngine.tick(0);
const defaultTruck = truckApi.snapshot();
truckApi.impulse({ y: 7, kind: 'launch' }); truckEngine.tick(1 / 60);
const airborneTruck = truckApi.snapshot();
assert.ok(airborneTruck.flightOrigin && !airborneTruck.grounded);
for (let i = 0; i < 120; i++) truckEngine.tick(1 / 60);
truckApi.impulse({ speedDelta: -1, kind: 'impact' }); truckEngine.tick(1 / 60);
const landedTruck = truckApi.snapshot();
assert.ok(landedTruck.lastLanding && landedTruck.lastImpact);
for (const truck of [defaultTruck, airborneTruck, landedTruck, initialCheckpoint.truck,
  { ...initialCheckpoint.truck, input: { steer: 0 }, groundNormal: { y: 1 }, lastSafe: { heading: Math.PI } }]) {
  const value = { ...structuredClone(initialCheckpoint), truck: structuredClone(truck) };
  assert.equal(prepareFreightSave(wallet, value).ok, true, 'real snapshots and omitted legacy/default fields remain resumable');
  truckApi.loadSnapshot(truck); truckEngine.tick(1 / 60);
  const resumed = truckApi.getState();
  assert.ok([resumed.bodyPitch, resumed.wheelTravel, resumed.airTime, resumed.position.x, resumed.position.y, resumed.position.z].every(Number.isFinite), 'accepted snapshots resume with finite motion and render state');
}
const malformedTruckCases = [
  ['bodyPitch reproduction', t => { t.bodyPitch = 'invalid'; }],
  ['null wheel travel', t => { t.wheelTravel = null; }],
  ['string air time', t => { t.airTime = '0.5'; }],
  ['nonfinite support velocity', t => { t.supportVelocity = NaN; }],
  ['present undefined acceleration', t => { t.acceleration = undefined; }],
  ['string landing sequence', t => { t.landingSequence = '1'; }],
  ['string grounded flag', t => { t.grounded = 'false'; }],
  ['missing flight-origin component', t => { t.flightOrigin = { x: 0, z: 0 }; }],
  ['wrong flight-origin shape', t => { t.flightOrigin = []; }],
  ['nonnumeric landing impact', t => { t.lastLanding.impactSpeed = 'invalid'; }],
  ['missing landing distance', t => { delete t.lastLanding.distance; }],
  ['nonfinite impact energy', t => { t.lastImpact.energy = Infinity; }],
  ['missing impact kind', t => { delete t.lastImpact.kind; }],
  ['nonnumeric saved input', t => { t.input.brake = '1'; }],
  ['null barrier record', t => { t.input.barrierContacts = [null]; }],
  ['missing barrier radius', t => { t.input.barrierContacts = [{ id: 'island', x: 0, z: 0 }]; }],
  ['wrong contact-list shape', t => { t.roundaboutContacts = {}; }],
  ['missing contact impact', t => { t.roundaboutContacts = [{ id: 'island' }]; }],
  ['wrong ground-normal component', t => { t.groundNormal.x = true; }],
  ['nonfinite recovery heading', t => { t.lastSafe.heading = NaN; }],
  ['nonnumeric load shift', t => { t.loadShift.x = 'invalid'; }],
  ['missing required position', t => { delete t.position.y; }],
];
for (const [label, mutate] of malformedTruckCases) {
  const bad = { ...structuredClone(initialCheckpoint), truck: structuredClone(landedTruck) }; mutate(bad.truck);
  assert.deepEqual(prepareFreightSave(wallet, bad), { ok: false, reason: 'invalid-checkpoint' }, `${label} is rejected before loadSnapshot`);
}
const terminal = { ...structuredClone(firstPaidCheckpoint), terminal: true, run: { ...firstPaidCheckpoint.run, status: 'failed' } };
const ended = prepareFreightSave(save, terminal);
assert.equal(ended.ok, true);
assert.equal(prepareFreightSave(ended.save, firstPaidCheckpoint).reason, 'closed-session');
for (let i = 0; i < 70; i++) {
  const fresh = driveTrace({ sessionId: `fresh-${i}` });
  const next = prepareFreightSave(save, checkpoint(fresh), { expectedRevision: save.freightJourney.revision });
  assert.equal(next.ok, true, 'a fresh journey can replace the previous active checkpoint'); save = next.save;
}
assert.equal(save.freightReceipts.length, 71, 'one receipt per session is retained; contracts do not append history');
assert.equal(prepareFreightSave(save, firstPaidCheckpoint).reason, 'inactive-session', 'an old paid session cannot resurrect after 64 newer sessions');
const offline = prepareFreightSave(wallet, firstPaidCheckpoint);
assert.equal(offline.ok, true); assert.equal(offline.cash, firstCash + 21, 'progress earned during a storage outage can settle once storage returns');
const traveledCheckpoint = checkpoint(noDistanceFarm); traveledCheckpoint.run.distance = 25;
const traveledSave = prepareFreightSave(wallet, traveledCheckpoint);
assert.equal(traveledSave.ok, true);
assert.equal(traveledSave.save.careerMiles, 25 / 1609.344, 'career mileage uses physical run distance instead of teleportable highway position');

assert.equal(freightDifficulty(NaN, Infinity).level, 0);
assert.equal(freightDifficulty(50000, 500).level, 6);
assert.ok(freightDifficulty(5000, 4, { massKg: 6200 }).warningLead > freightDifficulty(5000, 4).warningLead);
assert.ok(freightDifficulty(5000, 4, { massKg: 6200 }).minimumClearWidth >= 9);
console.log(JSON.stringify({ result: 'PASS', continuousDeliveries: continuous.journey.getState().completed, continuousLosses: continuous.journey.getState().lost,
  firstDeliveryCash: firstCash, testedPickupRecoveryMisses: 2, receiverRetries: missedReceiver.events.filter(e => e.type === 'receiver-missed').length,
  malformedTruckCases: malformedTruckCases.length, saveRevision: save.freightJourney.revision, retainedSessionReceipts: save.freightReceipts.length }, null, 2));
