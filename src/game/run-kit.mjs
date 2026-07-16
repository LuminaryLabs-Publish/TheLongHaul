import { clone, clamp, finite } from "./shared.mjs";

export function createLongHaulRunKit(N) {
  const RunState = N.defineResource("long-haul.run.state");
  const RunStart = N.defineEvent("long-haul.run.start.request");
  const RunPause = N.defineEvent("long-haul.run.pause.request");
  const RunResume = N.defineEvent("long-haul.run.resume.request");
  const RunSample = N.defineEvent("long-haul.run.sample.request");
  const RunPenalty = N.defineEvent("long-haul.run.penalty.request");
  const RunRecovery = N.defineEvent("long-haul.run.recovery.request");
  const RunComplete = N.defineEvent("long-haul.run.complete.request");
  const RunFail = N.defineEvent("long-haul.run.fail.request");
  const RunReset = N.defineEvent("long-haul.run.reset.request");
  const initialRunState = () => ({
    status: "idle",
    rawTime: 0,
    distance: 0,
    maxSpeed: 0,
    collisions: 0,
    offRoadTime: 0,
    penaltyTotal: 0,
    penalties: [],
    recoveryUsed: false,
    stuckSeconds: 0,
    failureReason: null,
    result: null,
    lastPosition: null,
    sequence: 0
  });
  const runKit = N.defineDomainServiceKit({
    id: "long-haul-run-kit",
    domain: "long-haul-run",
    apiName: "longHaulRun",
    services: ["run-state", "telemetry", "penalties", "score"],
    stability: "game-stable",
    version: "2.0.0",
    resources: { RunState },
    events: { RunStart, RunPause, RunResume, RunSample, RunPenalty, RunRecovery, RunComplete, RunFail, RunReset },
    systems: [{
      phase: "resolve",
      name: "longHaulRunSystem",
      system(world) {
        let state = world.getResource(RunState);
        const dt = clamp(finite(world.__nexusClock?.delta), 0, 1 / 15);
        for (const request of world.readEvents(RunReset)) state = initialRunState();
        for (const request of world.readEvents(RunStart)) state = { ...initialRunState(), status: "running", lastPosition: clone(request.position ?? null), sequence: state.sequence + 1 };
        for (const request of world.readEvents(RunPause)) if (state.status === "running") state = { ...state, status: "paused", sequence: state.sequence + 1 };
        for (const request of world.readEvents(RunResume)) if (state.status === "paused") state = { ...state, status: "running", lastPosition: clone(request.position ?? state.lastPosition), sequence: state.sequence + 1 };
        if (state.status === "running") state = { ...state, rawTime: state.rawTime + dt, sequence: state.sequence + 1 };
        for (const request of world.readEvents(RunSample)) {
          if (state.status !== "running") continue;
          const position = { x: finite(request.position?.x), z: finite(request.position?.z) };
          let distance = 0;
          if (state.lastPosition && !request.teleport) {
            distance = Math.hypot(position.x - state.lastPosition.x, position.z - state.lastPosition.z);
            if (!Number.isFinite(distance) || distance > 80) distance = 0;
          }
          const trying = Boolean(request.trying);
          const speed = Math.abs(finite(request.speed));
          const stuckSeconds = trying && speed < 0.55 ? state.stuckSeconds + dt : Math.max(0, state.stuckSeconds - dt * 1.8);
          state = {
            ...state,
            distance: state.distance + distance,
            maxSpeed: Math.max(state.maxSpeed, speed),
            offRoadTime: state.offRoadTime + (request.surface === "off-road" ? dt : 0),
            stuckSeconds,
            lastPosition: position,
            sequence: state.sequence + 1
          };
        }
        for (const request of world.readEvents(RunPenalty)) {
          state = {
            ...state,
            penaltyTotal: state.penaltyTotal + Math.max(0, finite(request.seconds)),
            collisions: state.collisions + (request.collision ? 1 : 0),
            penalties: [...state.penalties, clone(request)].slice(-64),
            sequence: state.sequence + 1
          };
        }
        for (const request of world.readEvents(RunRecovery)) state = { ...state, recoveryUsed: true, stuckSeconds: 0, lastPosition: clone(request.position ?? state.lastPosition), sequence: state.sequence + 1 };
        for (const request of world.readEvents(RunComplete)) state = { ...state, status: "completed", result: clone(request.result), sequence: state.sequence + 1 };
        for (const request of world.readEvents(RunFail)) if (!["completed", "failed"].includes(state.status)) state = { ...state, status: "failed", failureReason: String(request.reason), sequence: state.sequence + 1 };
        world.setResource(RunState, state);
      }
    }],
    initWorld({ world }) { world.setResource(RunState, initialRunState()); },
    createApi({ world }) {
      const get = () => clone(world.getResource(RunState));
      return {
        getState: get,
        start(position) { world.emit(RunStart, { position: clone(position) }); return get(); },
        pause() { world.emit(RunPause, {}); return get(); },
        resume(position) { world.emit(RunResume, { position: clone(position) }); return get(); },
        sample(payload) { world.emit(RunSample, clone(payload)); return get(); },
        penalty(payload) { world.emit(RunPenalty, clone(payload)); return get(); },
        recovery(position) { world.emit(RunRecovery, { position: clone(position) }); return get(); },
        complete(result) { world.emit(RunComplete, { result: clone(result) }); return get(); },
        fail(reason) { world.emit(RunFail, { reason: String(reason) }); return get(); },
        reset() { world.emit(RunReset, {}); return get(); },
        snapshot: get,
        loadSnapshot(snapshot = {}) { world.setResource(RunState, { ...initialRunState(), ...clone(snapshot) }); return get(); }
      };
    }
  });

  return Object.freeze({ kit: runKit, resources: Object.freeze({RunState}) });
}
