import { setKeyboard, stepClock } from './fixed-browser-clock.mjs';

export async function prepareFreightDriver(page) {
  await page.evaluate(async () => {
    window.__captureHighway = await import('./src/game/endless-highway.mjs');
  });
}

export async function freightSnapshot(page) {
  return page.evaluate(() => {
    const text = JSON.parse(render_game_to_text()), truck = readTruck(), run = readRun();
    return {
      ...text,
      freight: window.LongHaulFreight?.getState() ?? text.freight ?? null,
      truck: structuredClone(truck), runDetails: structuredClone(run),
      risk: arcadeScore.snapshot(), events: structuredClone(arcadeEventHistory),
      condition: Object.fromEntries(['fuel','truck-condition','cargo-condition','remaining-time'].map(id => [id, meters.get(id)?.value])),
      topology: { endless: Boolean(course?.endless), revision: course?.topologyRevision, edges: course?.edges?.length, nodes: course?.nodes?.length, stations: course?.loadingStations?.length },
      resources: window.LongHaulPerformance.getState(),
      failed: frameFailed, intro: { ...launchIntro },
    };
  });
}

/** Route-reading driver: only ordinary keyboard events alter the application. */
export async function freightSteering(page, { route = 'safe', targetSpeed = 29, lane = -4.4, boost = false, aimRamp = false, missPickup = false } = {}) {
  return page.evaluate(({ route, targetSpeed, lane, boost, aimRamp, missPickup }) => {
    const truck = readTruck(), sceneId = currentScene();
    if (sceneId !== 'driving' || launchIntro.active) return { keys: [], scene: sceneId, intro: launchIntro.active };
    const api = window.__captureHighway, progress = api.endlessHighwayProgress(course, truck.position);
    const look = 10 + Math.max(0, truck.speed) * .65;
    const stationIndex = Math.max(0, Math.round((progress - api.ENDLESS_HIGHWAY_RULES.firstStationProgress) / api.ENDLESS_HIGHWAY_RULES.stationSpacing));
    const station = api.endlessHighwayStation(course, stationIndex);
    const inApproach = progress > station.entryProgress - look - 30 && progress < station.exitProgress + 10;
    let desiredLane = inApproach && route === 'risky' ? 0 : lane;
    if (missPickup && inApproach) desiredLane = 12.6;
    let point = api.endlessHighwayPoint(course, progress + look, desiredLane, inApproach ? route : 'safe');
    let encounter = null;
    if (!inApproach) {
      const road = nearestRoad(course, truck.position), roadProgress = arcadeNetwork && arcadeRoadProgress(road, arcadeNetwork);
      if (roadProgress) {
        encounter = arcadeEncounters.filter(value => value.path === roadProgress.path && value.distance - roadProgress.distance > -25 && value.distance - roadProgress.distance < 150).sort((a,b) => a.distance - b.distance)[0];
        if (encounter) {
          // Highway lateral offsets and arcade encounter lanes use opposite
          // normals. Convert once so the keyboard driver aims at real geometry.
          if (encounter.kind === 'roadblock') desiredLane = -encounter.safeLane;
          if (aimRamp && encounter.kind === 'ramp') desiredLane = -encounter.lane;
          point = api.endlessHighwayPoint(course, progress + look, desiredLane);
        }
      }
    }
    const heading = Math.atan2(point.x - truck.position.x, point.z - truck.position.z);
    const error = Math.atan2(Math.sin(heading - truck.heading), Math.cos(heading - truck.heading));
    const wanted = [];
    const safeTarget = Math.abs(error) > .5 ? Math.min(targetSpeed, 15) : targetSpeed;
    if (truck.speed < safeTarget - .8) wanted.push('w'); else if (truck.speed > safeTarget + 1.8) wanted.push('s');
    if (error > .022) wanted.push('a'); if (error < -.022) wanted.push('d');
    if (boost && truck.speed < targetSpeed - 2 && Math.abs(error) < .1 && !inApproach) { if (!wanted.includes('w')) wanted.push('w'); wanted.push('Shift'); }
    return { keys: wanted, scene: sceneId, progress, speed: truck.speed, error, station: station.id, inApproach, route, target: point, desiredLane, tipped: truck.tipped, encounter: encounter ? { id: encounter.id, kind: encounter.kind } : null };
  }, { route, targetSpeed, lane, boost, aimRamp, missPickup });
}

export class FreightKeyboardDriver {
  constructor(page) { this.page = page; this.held = new Set(); this.lastRecovery = -Infinity; this.lastThrottleDown = -Infinity; this.commands = []; }
  async step(seconds = 1 / 30, options = {}) {
    const command = await freightSteering(this.page, options);
    const before = await this.page.evaluate(() => __fixedCapture.snapshot());
    // Speed regulation is ordinary key input, with intentional throttle taps at
    // least 350ms apart so control oscillation cannot accidentally request rush.
    if (command.keys.includes('w') && !this.held.has('w')) {
      if (before.seconds - this.lastThrottleDown < .35) command.keys = command.keys.filter(key => key !== 'w' && key !== 'Shift');
      else this.lastThrottleDown = before.seconds;
    }
    this.held = await setKeyboard(this.page, this.held, command.keys);
    if (command.tipped && before.seconds - this.lastRecovery >= 8.1) { await this.page.keyboard.press('e'); this.lastRecovery = before.seconds; }
    const clock = await stepClock(this.page, seconds);
    this.commands.push({ time: clock.seconds, ...command });
    return { command, clock };
  }
  async release() { this.held = await setKeyboard(this.page, this.held, []); }
}
