import { clone, clamp, finite, normalizeAngle } from "./shared.mjs";

export function createLongHaulTruckKit(N) {
  const TruckState = N.defineResource("long-haul.truck.state");
  const TruckInput = N.defineEvent("long-haul.truck.input.request");
  const TruckReset = N.defineEvent("long-haul.truck.reset.request");
  const TruckTeleport = N.defineEvent("long-haul.truck.teleport.request");
  const TruckImpulse = N.defineEvent("long-haul.truck.impulse.request");

  const initialTruck = (options = {}) => ({
    id: "long-haul-truck",
    position: { x: finite(options.x), z: finite(options.z) },
    heading: finite(options.heading),
    speed: 0,
    steeringAngle: 0,
    wheelTravel: 0,
    bodyRoll: 0,
    surface: "road",
    surfaceGrip: 1,
    lastSafe: { x: finite(options.x), z: finite(options.z), heading: finite(options.heading) },
    input: { throttle: 0, brake: 0, steer: 0, boost: false },
    sequence: 0
  });

  const truckKit = N.defineDomainServiceKit({
    id: "long-haul-truck-kit",
    domain: "long-haul-truck",
    apiName: "longHaulTruck",
    services: ["road-vehicle", "recovery-pose"],
    stability: "game-stable",
    version: "2.0.0",
    resources: { TruckState },
    events: { TruckInput, TruckReset, TruckTeleport, TruckImpulse },
    systems: [{
      phase: "simulate",
      name: "longHaulTruckSystem",
      system(world) {
        let state = world.getResource(TruckState);
        if (!state) return;
        for (const request of world.readEvents(TruckReset)) state = initialTruck(request);
        for (const request of world.readEvents(TruckTeleport)) {
          state = {
            ...state,
            position: { x: finite(request.x, state.position.x), z: finite(request.z, state.position.z) },
            heading: finite(request.heading, state.heading),
            speed: finite(request.speed, 0),
            steeringAngle: 0,
            sequence: state.sequence + 1
          };
        }
        for (const request of world.readEvents(TruckInput)) {
          state = {
            ...state,
            input: {
              throttle: clamp(finite(request.throttle), 0, 1),
              brake: clamp(finite(request.brake), 0, 1),
              steer: clamp(finite(request.steer), -1, 1),
              boost: Boolean(request.boost)
            },
            surface: String(request.surface ?? state.surface),
            surfaceGrip: clamp(finite(request.surfaceGrip, state.surfaceGrip), 0.18, 1.15)
          };
        }
        for (const request of world.readEvents(TruckImpulse)) {
          state = {
            ...state,
            speed: clamp(state.speed + finite(request.speedDelta), -8, 34),
            heading: normalizeAngle(state.heading + finite(request.headingDelta)),
            sequence: state.sequence + 1
          };
        }

        const dt = clamp(finite(world.__nexusClock?.delta), 0, 1 / 15);
        const input = state.input;
        const grip = state.surfaceGrip;
        const maxForward = 31 * (input.boost ? 1.15 : 1) * (state.surface === "road" ? 1 : state.surface === "shoulder" ? 0.72 : 0.46);
        const maxReverse = 8;
        const acceleration = 9.8 * grip * (input.boost ? 1.22 : 1);
        const reverseAcceleration = 5.4 * grip;
        const brakeForce = 15;
        let speed = state.speed;

        if (input.throttle > 0) {
          if (speed < -0.2) speed = Math.min(0, speed + brakeForce * input.throttle * dt);
          else speed += acceleration * input.throttle * dt;
        }
        if (input.brake > 0) {
          if (speed > 0.45) speed = Math.max(0, speed - brakeForce * input.brake * dt);
          else speed -= reverseAcceleration * input.brake * dt;
        }
        const rolling = state.surface === "road" ? 0.72 : state.surface === "shoulder" ? 1.9 : 3.6;
        if (!input.throttle && !input.brake) {
          const amount = rolling * dt;
          speed = Math.abs(speed) <= amount ? 0 : speed - Math.sign(speed) * amount;
        }
        speed -= speed * Math.abs(speed) * 0.0013 * dt;
        speed = clamp(speed, -maxReverse, maxForward);

        const steerTarget = input.steer * (0.58 - 0.34 * clamp(Math.abs(speed) / 31, 0, 1));
        const steeringAngle = state.steeringAngle + (steerTarget - state.steeringAngle) * (1 - Math.exp(-8 * dt));
        const wheelbase = 5.3;
        const yawRate = Math.abs(speed) > 0.08 ? (speed / wheelbase) * Math.tan(steeringAngle) * grip : 0;
        const heading = normalizeAngle(state.heading + yawRate * dt);
        const forward = { x: Math.sin(heading), z: Math.cos(heading) };
        const position = {
          x: state.position.x + forward.x * speed * dt,
          z: state.position.z + forward.z * speed * dt
        };
        const safe = state.surface === "road" && Math.abs(speed) < 27
          ? { x: position.x, z: position.z, heading }
          : state.lastSafe;

        state = {
          ...state,
          position,
          heading,
          speed,
          steeringAngle,
          wheelTravel: state.wheelTravel + speed * dt,
          bodyRoll: state.bodyRoll + ((-input.steer * clamp(Math.abs(speed) / 25, 0, 1) * 0.09) - state.bodyRoll) * (1 - Math.exp(-5 * dt)),
          lastSafe: safe,
          sequence: state.sequence + 1
        };
        world.setResource(TruckState, state);
      }
    }],
    initWorld({ world }) { world.setResource(TruckState, initialTruck()); },
    createApi({ world }) {
      const get = () => clone(world.getResource(TruckState));
      return {
        getState: get,
        input(value = {}) { world.emit(TruckInput, clone(value)); return get(); },
        reset(value = {}) { world.emit(TruckReset, clone(value)); return get(); },
        teleport(value = {}) { world.emit(TruckTeleport, clone(value)); return get(); },
        impulse(value = {}) { world.emit(TruckImpulse, clone(value)); return get(); },
        snapshot: get,
        loadSnapshot(snapshot = {}) { world.setResource(TruckState, { ...initialTruck(), ...clone(snapshot) }); return get(); }
      };
    }
  });

  return Object.freeze({ kit: truckKit, resources: Object.freeze({TruckState}) });
}
