import { clone, clamp, finite, normalizeAngle } from "./shared.mjs";
import { DEFAULT_TRUCK_DYNAMICS_PROFILE } from "./truck-dynamics-profile-kit.mjs";
import { LONG_HAUL_TRUCK_COLLIDER } from "./vehicle-collider.mjs";

function resolveRoundaboutIslandContacts(position, velocity, heading, barriers) {
  if (!barriers?.length) return [];
  const forward = { x: Math.sin(heading), z: Math.cos(heading) };
  const right = { x: forward.z, z: -forward.x };
  const halfWidth = LONG_HAUL_TRUCK_COLLIDER.width * 0.5;
  const halfLength = LONG_HAUL_TRUCK_COLLIDER.length * 0.5;
  const offsetZ = LONG_HAUL_TRUCK_COLLIDER.offsetZ ?? 0;
  const contacts = [];

  for (const barrier of barriers) {
    const centerX = position.x + forward.x * offsetZ;
    const centerZ = position.z + forward.z * offsetZ;
    const dx = barrier.x - centerX;
    const dz = barrier.z - centerZ;
    const localX = dx * right.x + dz * right.z;
    const localZ = dx * forward.x + dz * forward.z;
    const nearestX = clamp(localX, -halfWidth, halfWidth);
    const nearestZ = clamp(localZ, -halfLength, halfLength);
    const fromIslandX = centerX + right.x * nearestX + forward.x * nearestZ - barrier.x;
    const fromIslandZ = centerZ + right.z * nearestX + forward.z * nearestZ - barrier.z;
    const distance = Math.hypot(fromIslandX, fromIslandZ);
    if (distance >= barrier.radius) continue;

    let normalX;
    let normalZ;
    let correction;
    if (distance > 1e-5) {
      normalX = fromIslandX / distance;
      normalZ = fromIslandZ / distance;
      correction = barrier.radius - distance + 1e-3;
    } else {
      // Recover deterministically if a teleport or restored save starts the truck
      // with the island center inside its footprint.
      const exits = [
        { distance: barrier.radius + halfWidth + localX, x: right.x, z: right.z },
        { distance: barrier.radius + halfWidth - localX, x: -right.x, z: -right.z },
        { distance: barrier.radius + halfLength + localZ, x: forward.x, z: forward.z },
        { distance: barrier.radius + halfLength - localZ, x: -forward.x, z: -forward.z }
      ].sort((a, b) => a.distance - b.distance);
      normalX = exits[0].x;
      normalZ = exits[0].z;
      correction = exits[0].distance + 1e-3;
    }

    position.x += normalX * correction;
    position.z += normalZ * correction;
    const inwardSpeed = velocity.x * normalX + velocity.z * normalZ;
    const impactSpeed = Math.max(0, -inwardSpeed);
    if (inwardSpeed < 0) {
      velocity.x -= normalX * inwardSpeed;
      velocity.z -= normalZ * inwardSpeed;
    }
    contacts.push({ id: barrier.id, impactSpeed });
  }
  return contacts;
}

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
    rollAngle: 0,
    rollVelocity: 0,
    tipped: false,
    grounded: true,
    groundHeight: finite(value.y)-DEFAULT_TRUCK_DYNAMICS_PROFILE.suspension.travel,
    contactShape: "sphere",
    contactRadius: DEFAULT_TRUCK_DYNAMICS_PROFILE.suspension.travel,
    groundNormal: { x: 0, y: 1, z: 0 },
    suspensionCompression: 0,
    suspensionVelocity: 0,
    airTime: 0,
    surface: "road",
    roadClass: "",
    roadMaterial: "paved",
    surfaceGrip: 1,
    lastSafe: { x: finite(value.x), y: finite(value.y), z: finite(value.z), heading: finite(value.heading) },
    input: { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, rush: false, barrierContacts: [] },
    roundaboutContacts: [],
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
        let teleportGround = null;
        for (const request of world.readEvents(TruckTeleport)) {
          const heading = finite(request.heading, state.heading);
          const speed = finite(request.speed, 0);
          state = {
            ...state,
            position: { x: finite(request.x, state.position.x), y: finite(request.y, state.position.y), z: finite(request.z, state.position.z) },
            velocity: { x: Math.sin(heading) * speed, y: finite(request.verticalSpeed), z: Math.cos(heading) * speed },
            heading,
            yawRate: 0,
            speed,
            longitudinalSpeed: speed,
            lateralSpeed: 0,
            driftAngle: 0,
            steeringAngle: 0,
            rollAngle: 0,
            rollVelocity: 0,
            bodyRoll: 0,
            bodyPitch: 0,
            suspensionCompression: 0,
            suspensionVelocity: 0,
            airTime: 0,
            roundaboutContacts: [],
            tipped: false,
            grounded: request.grounded !== false,
            sequence: state.sequence + 1
          };
          if (Number.isFinite(request.groundHeight)) teleportGround = { height: request.groundHeight, normal: request.groundNormal, surface: request.surface, grip: request.surfaceGrip, roadClass: request.roadClass, roadMaterial: request.roadMaterial, barriers: request.barrierContacts };
        }
        for (const request of world.readEvents(TruckInput)) {
          state = {
            ...state,
            input: {
              throttle: clamp(finite(request.throttle), 0, 1),
              brake: clamp(finite(request.brake), 0, 1),
              steer: clamp(finite(request.steer), -1, 1),
              handbrake: Boolean(request.handbrake),
              boost: Boolean(request.boost),
              rush: Boolean(request.rush),
              barrierContacts: Array.isArray(request.barrierContacts) ? request.barrierContacts.map((barrier) => ({
                id: String(barrier.id ?? "roundabout-island"),
                x: finite(barrier.x),
                z: finite(barrier.z),
                radius: Math.max(0, finite(barrier.radius))
              })) : []
            },
            surface: String(request.surface ?? state.surface),
            roadClass: String(request.roadClass ?? state.roadClass),
            roadMaterial: String(request.roadMaterial ?? state.roadMaterial),
            surfaceGrip: clamp(finite(request.surfaceGrip, state.surfaceGrip), 0.12, 1.2),
            groundHeight: finite(request.groundHeight, state.groundHeight),
            groundNormal: {
              x: finite(request.groundNormal?.x, state.groundNormal.x),
              y: finite(request.groundNormal?.y, state.groundNormal.y),
              z: finite(request.groundNormal?.z, state.groundNormal.z)
            }
          };
        }
        if (teleportGround) state = { ...state, groundHeight: teleportGround.height, groundNormal: {
          x: finite(teleportGround.normal?.x), y: finite(teleportGround.normal?.y, 1), z: finite(teleportGround.normal?.z)
        }, surface: String(teleportGround.surface ?? state.surface), roadClass: String(teleportGround.roadClass ?? state.roadClass), roadMaterial: String(teleportGround.roadMaterial ?? state.roadMaterial), surfaceGrip: clamp(finite(teleportGround.grip, state.surfaceGrip), 0.12, 1.2),
          input: { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, rush: false,
            barrierContacts: Array.isArray(teleportGround.barriers) ? teleportGround.barriers.map((barrier) => ({ id: String(barrier.id ?? "roundabout-island"), x: finite(barrier.x), z: finite(barrier.z), radius: Math.max(0, finite(barrier.radius)) })) : [] } };
        for (const request of world.readEvents(TruckImpulse)) {
          const forward = { x: Math.sin(state.heading), z: Math.cos(state.heading) };
          const rollImpulse = finite(request.rollDelta);
          state = {
            ...state,
            velocity: {
              x: state.velocity.x + forward.x * finite(request.speedDelta) + finite(request.x),
              y: state.velocity.y + finite(request.y),
              z: state.velocity.z + forward.z * finite(request.speedDelta) + finite(request.z)
            },
            heading: normalizeAngle(state.heading + finite(request.headingDelta)),
            yawRate: state.yawRate + finite(request.yawDelta),
            rollVelocity: state.rollVelocity + rollImpulse,
            rollAngle: state.rollAngle + Math.sign(rollImpulse) * Math.min(0.18, Math.abs(rollImpulse) * 0.06),
            tipped: state.tipped || (Math.abs(rollImpulse) >= 1.45 && Math.abs(state.speed) >= 6),
            sequence: state.sequence + 1
          };
        }

        const sceneId=world.__longHaulScene;
        const frameDelta = clamp(sceneId&&sceneId!=="driving"?0:finite(world.__nexusClock?.delta), 0, 1 / 15);
        // Commands such as reset and teleport still apply while the scene is
        // stopped, but contact resolution must not move a paused truck.
        if (frameDelta <= 0) { world.setResource(TruckState, state); return; }
        const maximumSubstep = Math.max(1 / 240, finite(profile.air?.maximumSubstep, 1 / 120));
        const maximumSubsteps = Math.max(1, Math.floor(finite(profile.air?.maximumSubsteps, 8)));
        const steps = Math.min(maximumSubsteps, Math.max(1, Math.ceil(frameDelta / maximumSubstep)));
        const dt = steps > 0 ? frameDelta / steps : 0;
        const roundaboutContactImpacts = new Map();

        for (let step = 0; step < steps; step += 1) {
          const input = state.input;
          const forward = { x: Math.sin(state.heading), z: Math.cos(state.heading) };
          const right = { x: forward.z, z: -forward.x };
          let longitudinal = state.velocity.x * forward.x + state.velocity.z * forward.z;
          let lateral = state.velocity.x * right.x + state.velocity.z * right.z;
          const surfaceKey = state.surface === "road" ? "road" : state.surface === "shoulder" ? "shoulder" : "offRoad";
          const gripCatalog = profile.grip ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.grip;
          const gripKey = surfaceKey !== "road" ? surfaceKey : state.roadClass === "paved-highway" ? "highway" : state.roadMaterial !== "paved" ? "rough" : "road";
          const lateralGrip = (input.handbrake ? gripCatalog.handbrake : gripCatalog[gripKey] ?? gripCatalog.road) * state.surfaceGrip;
          const boostForce = input.rush ? Math.max(1.18,finite(profile.boost?.forceMultiplier,1.18))*8 : input.boost ? finite(profile.boost?.forceMultiplier, 1.18) : 1;
          const speedMultiplier = input.rush ? Math.max(1.85,finite(profile.boost?.speedMultiplier,1.14)+.65) : input.boost ? finite(profile.boost?.speedMultiplier, 1.14) : 1;
          const maximumForward = finite(profile.maximumForwardSpeed, 38) * speedMultiplier * (state.surface === "road" ? 1 : state.surface === "shoulder" ? 0.74 : 0.52);
          const maximumReverse = finite(profile.maximumReverseSpeed, 10);

          const effectiveThrottle = state.tipped ? 0 : input.throttle;
          const effectiveBrake = state.tipped ? 0 : input.brake;
          const normalizedSpeed = clamp(Math.abs(longitudinal) / Math.max(1, maximumForward), 0, 1);
          const torqueCurve = 1 - normalizedSpeed * 0.5;
          if (effectiveThrottle > 0) {
            if (longitudinal < -0.2) longitudinal = Math.min(0, longitudinal + finite(profile.brakeForce, 17) * input.throttle * dt);
            else longitudinal += finite(profile.engineAcceleration, 3.6) * torqueCurve * boostForce * state.surfaceGrip * effectiveThrottle * dt;
          }
          if (effectiveBrake > 0) {
            if (longitudinal > 0.45) longitudinal = Math.max(0, longitudinal - finite(profile.brakeForce, 9.4) * effectiveBrake * dt);
            else longitudinal -= finite(profile.reverseAcceleration, 2.6) * state.surfaceGrip * effectiveBrake * dt;
          }
          if (!effectiveThrottle && !effectiveBrake) {
            const resistance = finite(profile.rollingResistance?.[surfaceKey], 0.48) * dt;
            longitudinal = Math.abs(longitudinal) <= resistance ? 0 : longitudinal - Math.sign(longitudinal) * resistance;
          }
          longitudinal -= longitudinal * Math.abs(longitudinal) * finite(profile.aerodynamicDrag, 0.00105) * dt;
          const forwardGrade = -(state.groundNormal.x * forward.x + state.groundNormal.z * forward.z) / Math.max(0.25, state.groundNormal.y);
          longitudinal -= clamp(forwardGrade, -0.32, 0.32) * 9.81 * dt;
          if (state.tipped) longitudinal *= Math.exp(-5.5 * dt);
          // Ease down after a burst instead of snapping instantly to the normal cap.
          longitudinal = clamp(longitudinal, -maximumReverse, Math.max(maximumForward,state.speed-12*dt));
          lateral *= Math.exp(-Math.max(0.01, lateralGrip) * dt);

          const speedRatio = clamp(Math.abs(longitudinal) / Math.max(1, finite(profile.maximumForwardSpeed, 38)), 0, 1);
          const steering = profile.steering ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.steering;
          const targetSteer = (state.tipped ? 0 : input.steer) * (finite(steering.lowSpeedAngle, 0.55) + (finite(steering.highSpeedAngle, 0.13) - finite(steering.lowSpeedAngle, 0.55)) * speedRatio);
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
          const contactRadius=finite(suspension.travel,.92);
          const targetRideHeight = state.groundHeight + contactRadius;
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
            if (positionY < targetRideHeight) positionY = targetRideHeight;
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
          for (const contact of resolveRoundaboutIslandContacts(position, velocity, heading, input.barrierContacts)) {
            const previous = roundaboutContactImpacts.get(contact.id) ?? 0;
            if (!roundaboutContactImpacts.has(contact.id) || contact.impactSpeed > previous) roundaboutContactImpacts.set(contact.id, contact.impactSpeed);
          }
          longitudinal = velocity.x * nextForward.x + velocity.z * nextForward.z;
          lateral = velocity.x * nextRight.x + velocity.z * nextRight.z;
          // Ground contact supports the sphere centre. Render lean never changes this radius.
          if(position.y<targetRideHeight){position.y=targetRideHeight;velocity.y=Math.max(0,velocity.y);suspensionVelocity=Math.max(0,suspensionVelocity);grounded=true;airTime=0}
          const planarSpeed = Math.hypot(velocity.x, velocity.z);
          const driftAngle = Math.atan2(lateral, Math.max(0.01, Math.abs(longitudinal)));
          const rollProfile = profile.roll ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.roll;
          const lateralAcceleration = yawRate * longitudinal;
          let tipped = state.tipped;
          let rollAngle = state.rollAngle;
          let rollVelocity = state.rollVelocity;
          // Steering lean is cosmetic and self-righting; only impact requests can tip the truck.
          const naturalTarget = Math.abs(input.steer)>.01 ? clamp(-lateralAcceleration * finite(rollProfile.lateralScale, 0.0135), -.35, .35) : 0;
          const settledAngle = finite(rollProfile.settledAngle, 1.43);
          const targetRoll = tipped ? Math.sign(rollAngle || rollVelocity || 1) * settledAngle : naturalTarget;
          const rollSpring=Math.max(.01,finite(rollProfile.spring,8.5));
          const rollDamping=tipped?finite(rollProfile.damping,4.7):Math.max(finite(rollProfile.damping,4.7),2*Math.sqrt(rollSpring));
          const rollAcceleration = (targetRoll - rollAngle) * rollSpring - rollVelocity * rollDamping;
          rollVelocity += rollAcceleration * dt;
          rollAngle += rollVelocity * dt;
          if(!tipped){rollAngle=clamp(rollAngle,-.36,.36);if(Math.abs(rollAngle)>=.36&&Math.sign(rollVelocity)===Math.sign(rollAngle))rollVelocity=0}
          if (tipped) rollAngle = clamp(rollAngle, -settledAngle * 1.05, settledAngle * 1.05);
          const safe = grounded && !tipped && Math.abs(rollAngle) < 0.34 && state.surface === "road" && Math.abs(longitudinal) < finite(profile.maximumForwardSpeed, 32) * 0.82
            ? { x: position.x, y: position.y, z: position.z, heading }
            : state.lastSafe;

          state = {
            ...state,
            position,
            velocity,
            roundaboutContacts: [...roundaboutContactImpacts].map(([id, impactSpeed]) => ({ id, impactSpeed })),
            heading,
            yawRate,
            speed: longitudinal,
            longitudinalSpeed: longitudinal,
            lateralSpeed: lateral,
            driftAngle,
            steeringAngle,
            wheelTravel: state.wheelTravel + longitudinal * dt,
            bodyRoll: rollAngle,
            bodyPitch: state.bodyPitch + (((grounded ? -velocity.y * 0.018 : clamp(velocity.y * 0.04, -0.18, 0.18))) - state.bodyPitch) * (1 - Math.exp(-4 * dt)),
            rollAngle,
            rollVelocity,
            tipped,
            grounded,
            contactRadius,
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
