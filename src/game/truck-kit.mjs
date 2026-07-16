import { clone, clamp, finite, normalizeAngle } from "./shared.mjs";
import { DEFAULT_TRUCK_DYNAMICS_PROFILE } from "./truck-dynamics-profile-kit.mjs";

export function createLongHaulTruckKit(N, options = {}) {
  const TruckState = N.defineResource("long-haul.truck.state");
  const TruckInput = N.defineEvent("long-haul.truck.input.request");
  const TruckReset = N.defineEvent("long-haul.truck.reset.request");
  const TruckTeleport = N.defineEvent("long-haul.truck.teleport.request");
  const TruckImpulse = N.defineEvent("long-haul.truck.impulse.request");
  const DynamicsProfileState = options.dynamicsProfileResource ?? null;

  const initialTruck = (value = {}) => ({
    id: "long-haul-truck",
    position: { x: finite(value.x), y: finite(value.y), z: finite(value.z) },
    velocity: { x: 0, y: 0, z: 0 },
    heading: finite(value.heading),
    yawRate: 0,
    speed: 0,
    longitudinalSpeed: 0,
    lateralSpeed: 0,
    driftAngle: 0,
    steeringAngle: 0,
    wheelTravel: 0,
    bodyRoll: 0,
    bodyPitch: 0,
    grounded: true,
    groundHeight: finite(value.y),
    groundNormal: { x: 0, y: 1, z: 0 },
    suspensionCompression: 0,
    suspensionVelocity: 0,
    airTime: 0,
    surface: "road",
    surfaceGrip: 1,
    lastSafe: { x: finite(value.x), y: finite(value.y), z: finite(value.z), heading: finite(value.heading) },
    input: { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false },
    sequence: 0
  });

  const truckKit = N.defineDomainServiceKit({
    id: "long-haul-truck-kit",
    domain: "long-haul-truck",
    apiName: "longHaulTruck",
    services: ["road-vehicle", "drift", "ground-contact", "suspension", "air-control", "recovery-pose"],
    stability: "game-stable",
    version: "3.0.0",
    resources: { TruckState },
    events: { TruckInput, TruckReset, TruckTeleport, TruckImpulse },
    systems: [{
      phase: "simulate",
      name: "longHaulTruckSystem",
      system(world) {
        let state = world.getResource(TruckState);
        if (!state) return;
        const profile = DynamicsProfileState ? (world.getResource(DynamicsProfileState) ?? DEFAULT_TRUCK_DYNAMICS_PROFILE) : DEFAULT_TRUCK_DYNAMICS_PROFILE;

        for (const request of world.readEvents(TruckReset)) state = initialTruck(request);
        for (const request of world.readEvents(TruckTeleport)) {
          state = {
            ...state,
            position: { x: finite(request.x, state.position.x), y: finite(request.y, state.position.y), z: finite(request.z, state.position.z) },
            velocity: { x: 0, y: finite(request.verticalSpeed), z: 0 },
            heading: finite(request.heading, state.heading),
            speed: finite(request.speed, 0),
            longitudinalSpeed: finite(request.speed, 0),
            lateralSpeed: 0,
            steeringAngle: 0,
            grounded: request.grounded !== false,
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
              handbrake: Boolean(request.handbrake),
              boost: Boolean(request.boost)
            },
            surface: String(request.surface ?? state.surface),
            surfaceGrip: clamp(finite(request.surfaceGrip, state.surfaceGrip), 0.12, 1.2),
            groundHeight: finite(request.groundHeight, state.groundHeight),
            groundNormal: {
              x: finite(request.groundNormal?.x, state.groundNormal.x),
              y: finite(request.groundNormal?.y, state.groundNormal.y),
              z: finite(request.groundNormal?.z, state.groundNormal.z)
            }
          };
        }
        for (const request of world.readEvents(TruckImpulse)) {
          const forward = { x: Math.sin(state.heading), z: Math.cos(state.heading) };
          state = {
            ...state,
            velocity: {
              x: state.velocity.x + forward.x * finite(request.speedDelta) + finite(request.x),
              y: state.velocity.y + finite(request.y),
              z: state.velocity.z + forward.z * finite(request.speedDelta) + finite(request.z)
            },
            heading: normalizeAngle(state.heading + finite(request.headingDelta)),
            yawRate: state.yawRate + finite(request.yawDelta),
            sequence: state.sequence + 1
          };
        }

        const frameDelta = clamp(finite(world.__nexusClock?.delta), 0, 1 / 15);
        const maximumSubstep = Math.max(1 / 240, finite(profile.air?.maximumSubstep, 1 / 120));
        const maximumSubsteps = Math.max(1, Math.floor(finite(profile.air?.maximumSubsteps, 8)));
        const steps = Math.min(maximumSubsteps, Math.max(1, Math.ceil(frameDelta / maximumSubstep)));
        const dt = steps > 0 ? frameDelta / steps : 0;

        for (let step = 0; step < steps; step += 1) {
          const input = state.input;
          const forward = { x: Math.sin(state.heading), z: Math.cos(state.heading) };
          const right = { x: forward.z, z: -forward.x };
          let longitudinal = state.velocity.x * forward.x + state.velocity.z * forward.z;
          let lateral = state.velocity.x * right.x + state.velocity.z * right.z;
          const surfaceKey = state.surface === "road" ? "road" : state.surface === "shoulder" ? "shoulder" : "offRoad";
          const gripCatalog = profile.grip ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.grip;
          const lateralGrip = (input.handbrake ? gripCatalog.handbrake : gripCatalog[surfaceKey] ?? gripCatalog.road) * state.surfaceGrip;
          const boostForce = input.boost ? finite(profile.boost?.forceMultiplier, 1.18) : 1;
          const speedMultiplier = input.boost ? finite(profile.boost?.speedMultiplier, 1.14) : 1;
          const maximumForward = finite(profile.maximumForwardSpeed, 38) * speedMultiplier * (state.surface === "road" ? 1 : state.surface === "shoulder" ? 0.74 : 0.52);
          const maximumReverse = finite(profile.maximumReverseSpeed, 10);

          if (input.throttle > 0) {
            if (longitudinal < -0.2) longitudinal = Math.min(0, longitudinal + finite(profile.brakeForce, 17) * input.throttle * dt);
            else longitudinal += finite(profile.engineAcceleration, 12.5) * boostForce * state.surfaceGrip * input.throttle * dt;
          }
          if (input.brake > 0) {
            if (longitudinal > 0.45) longitudinal = Math.max(0, longitudinal - finite(profile.brakeForce, 17) * input.brake * dt);
            else longitudinal -= finite(profile.reverseAcceleration, 6.2) * state.surfaceGrip * input.brake * dt;
          }
          if (!input.throttle && !input.brake) {
            const resistance = finite(profile.rollingResistance?.[surfaceKey], 0.48) * dt;
            longitudinal = Math.abs(longitudinal) <= resistance ? 0 : longitudinal - Math.sign(longitudinal) * resistance;
          }
          longitudinal -= longitudinal * Math.abs(longitudinal) * finite(profile.aerodynamicDrag, 0.00105) * dt;
          longitudinal = clamp(longitudinal, -maximumReverse, maximumForward);
          lateral *= Math.exp(-Math.max(0.01, lateralGrip) * dt);

          const speedRatio = clamp(Math.abs(longitudinal) / Math.max(1, finite(profile.maximumForwardSpeed, 38)), 0, 1);
          const steering = profile.steering ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.steering;
          const targetSteer = input.steer * (finite(steering.lowSpeedAngle, 0.68) + (finite(steering.highSpeedAngle, 0.28) - finite(steering.lowSpeedAngle, 0.68)) * speedRatio);
          const steeringAngle = state.steeringAngle + (targetSteer - state.steeringAngle) * (1 - Math.exp(-finite(steering.response, 9.5) * dt));
          const targetYawRate = state.grounded && Math.abs(longitudinal) > 0.08
            ? (longitudinal / finite(steering.wheelbase, 5.2)) * Math.tan(steeringAngle) * finite(steering.yawResponse, 0.84) * state.surfaceGrip
            : input.steer * finite(profile.air?.steering, 0.14);
          const yawRate = state.yawRate + (targetYawRate - state.yawRate) * (1 - Math.exp(-(state.grounded ? 7 : 1.8) * dt));
          const heading = normalizeAngle(state.heading + yawRate * dt);
          const nextForward = { x: Math.sin(heading), z: Math.cos(heading) };
          const nextRight = { x: nextForward.z, z: -nextForward.x };
          let velocity = {
            x: nextForward.x * longitudinal + nextRight.x * lateral,
            y: state.velocity.y,
            z: nextForward.z * longitudinal + nextRight.z * lateral
          };

          const suspension = profile.suspension ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.suspension;
          const targetRideHeight = state.groundHeight + finite(suspension.travel, 0.85);
          const compression = targetRideHeight - state.position.y;
          const hasGround = compression > -0.18 && velocity.y <= 3.5;
          let grounded = state.grounded;
          let suspensionVelocity = state.suspensionVelocity;
          let positionY = state.position.y;
          let airTime = state.airTime;
          if (hasGround) {
            const springForce = compression * finite(suspension.spring, 18);
            const damping = velocity.y < 0 ? finite(suspension.compressionDamping, 7.5) : finite(suspension.extensionDamping, 4.2);
            suspensionVelocity += (springForce - velocity.y * damping) * dt;
            velocity.y += suspensionVelocity * dt;
            if (positionY < targetRideHeight - finite(suspension.travel, 0.85)) positionY = targetRideHeight - finite(suspension.travel, 0.85);
            if (!grounded && velocity.y < 0) velocity.y = -velocity.y * finite(suspension.landingRestitution, 0.16);
            grounded = true;
            airTime = 0;
          } else {
            grounded = false;
            airTime += dt;
            suspensionVelocity *= Math.exp(-4 * dt);
            velocity.y -= finite(profile.air?.gravity, 8.6) * dt;
          }

          const position = {
            x: state.position.x + velocity.x * dt,
            y: positionY + velocity.y * dt,
            z: state.position.z + velocity.z * dt
          };
          const planarSpeed = Math.hypot(velocity.x, velocity.z);
          const driftAngle = Math.atan2(lateral, Math.max(0.01, Math.abs(longitudinal)));
          const safe = grounded && state.surface === "road" && Math.abs(longitudinal) < finite(profile.maximumForwardSpeed, 38) * 0.82
            ? { x: position.x, y: position.y, z: position.z, heading }
            : state.lastSafe;

          state = {
            ...state,
            position,
            velocity,
            heading,
            yawRate,
            speed: longitudinal,
            longitudinalSpeed: longitudinal,
            lateralSpeed: lateral,
            driftAngle,
            steeringAngle,
            wheelTravel: state.wheelTravel + longitudinal * dt,
            bodyRoll: state.bodyRoll + ((-input.steer * speedRatio * 0.12 - driftAngle * 0.22) - state.bodyRoll) * (1 - Math.exp(-5 * dt)),
            bodyPitch: state.bodyPitch + (((grounded ? -velocity.y * 0.018 : clamp(velocity.y * 0.04, -0.18, 0.18))) - state.bodyPitch) * (1 - Math.exp(-4 * dt)),
            grounded,
            suspensionCompression: clamp(compression / Math.max(0.01, finite(suspension.travel, 0.85)), -1, 1),
            suspensionVelocity,
            airTime,
            lastSafe: safe,
            sequence: state.sequence + 1
          };
        }
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

  return Object.freeze({ kit: truckKit, resources: Object.freeze({ TruckState }) });
}
