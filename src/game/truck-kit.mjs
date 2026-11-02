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
    flightOrigin: null,
    flightPeakHeight: 0,
    supportVelocity: 0,
    landingSequence: 0,
    lastLanding: null,
    impactSequence: 0,
    lastImpact: null,
    acceleration: 0,
    surface: "road",
    roadClass: "",
    roadMaterial: "paved",
    surfaceGrip: 1,
    lastSafe: { x: finite(value.x), y: finite(value.y), z: finite(value.z), heading: finite(value.heading) },
    input: { throttle: 0, brake: 0, steer: 0, pitchControl: 0, handbrake: false, boost: false, rush: false, barrierContacts: [] },
    roundaboutContacts: [],
    sequence: 0
  });

  const truckKit = N.defineDomainServiceKit({
    id: "long-haul-truck-kit",
    domain: "long-haul-truck",
    apiName: "longHaulTruck",
    services: ["road-vehicle", "drift", "ground-contact", "suspension", "air-control", "recovery-pose"],
    stability: "game-stable",
    version: "4.0.0",
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
            flightOrigin: request.grounded === false ? { x: finite(request.x, state.position.x), y: finite(request.y, state.position.y), z: finite(request.z, state.position.z) } : null,
            flightPeakHeight: 0,
            supportVelocity: 0,
            lastLanding: null,
            acceleration: 0,
            input: { throttle: 0, brake: 0, steer: 0, pitchControl: 0, handbrake: false, boost: false, rush: false, barrierContacts: [] },
            roundaboutContacts: [],
            tipped: false,
            grounded: request.grounded !== false && finite(request.verticalSpeed) <= 0.6,
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
              pitchControl: clamp(finite(request.pitchControl, finite(request.throttle) - finite(request.brake)), -1, 1),
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
          input: { throttle: 0, brake: 0, steer: 0, pitchControl: 0, handbrake: false, boost: false, rush: false,
            barrierContacts: Array.isArray(teleportGround.barriers) ? teleportGround.barriers.map((barrier) => ({ id: String(barrier.id ?? "roundabout-island"), x: finite(barrier.x), z: finite(barrier.z), radius: Math.max(0, finite(barrier.radius)) })) : [] } };
        for (const request of world.readEvents(TruckImpulse)) {
          const forward = { x: Math.sin(state.heading), z: Math.cos(state.heading) };
          const rollImpulse = finite(request.rollDelta);
          const launch = finite(request.y) > 0.6;
          const impactStrength = Math.hypot(finite(request.speedDelta), finite(request.x), finite(request.z)) + Math.abs(rollImpulse) * 4;
          const impact = request.kind !== "launch" && impactStrength > 0.01;
          state = {
            ...state,
            velocity: {
              x: state.velocity.x + forward.x * finite(request.speedDelta) + finite(request.x),
              y: clamp(state.velocity.y + finite(request.y), -40, 28),
              z: state.velocity.z + forward.z * finite(request.speedDelta) + finite(request.z)
            },
            heading: normalizeAngle(state.heading + finite(request.headingDelta)),
            yawRate: state.yawRate + finite(request.yawDelta),
            rollVelocity: state.rollVelocity + rollImpulse,
            rollAngle: state.rollAngle + Math.sign(rollImpulse) * Math.min(0.18, Math.abs(rollImpulse) * 0.06),
            tipped: state.tipped || (request.allowTip !== false && Math.abs(rollImpulse) >= 1.45 && Math.abs(state.speed) >= 6),
            grounded: launch ? false : state.grounded,
            flightOrigin: launch && state.grounded ? { ...state.position } : state.flightOrigin,
            flightPeakHeight: launch && state.grounded ? 0 : state.flightPeakHeight,
            airTime: launch && state.grounded ? 0 : state.airTime,
            impactSequence: state.impactSequence + (impact ? 1 : 0),
            lastImpact: impact ? { sequence: state.impactSequence + 1, strength: impactStrength, speed: Math.abs(state.speed), kind: String(request.kind ?? "impact") } : state.lastImpact,
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
          const boostForce = input.rush
            ? clamp(finite(profile.boost?.rushForceMultiplier, 3.8) + Math.max(0, finite(profile.boost?.forceMultiplier, 1.65) - 1.65), 1, 6)
            : input.boost ? clamp(finite(profile.boost?.forceMultiplier, 1.65), 1, 4) : 1;
          const speedMultiplier = input.rush
            ? clamp(finite(profile.boost?.rushSpeedMultiplier, 1.8) + Math.max(0, finite(profile.boost?.speedMultiplier, 1.22) - 1.22), 1, 2.2)
            : input.boost ? clamp(finite(profile.boost?.speedMultiplier, 1.22), 1, 1.8) : 1;
          const maximumForward = finite(profile.maximumForwardSpeed, 34) * speedMultiplier * (state.surface === "road" ? 1 : state.surface === "shoulder" ? 0.86 : 0.66);
          const maximumReverse = finite(profile.maximumReverseSpeed, 10);

          const effectiveThrottle = state.tipped || !state.grounded ? 0 : input.throttle;
          const effectiveBrake = state.tipped || !state.grounded ? 0 : input.brake;
          const normalizedSpeed = clamp(Math.abs(longitudinal) / Math.max(1, maximumForward), 0, 1);
          const torqueCurve = 1 - normalizedSpeed * 0.5;
          if (effectiveThrottle > 0) {
            if (longitudinal < -0.2) longitudinal = Math.min(0, longitudinal + finite(profile.brakeForce, 17) * input.throttle * dt);
            else longitudinal += finite(profile.engineAcceleration, 6.1) * torqueCurve * boostForce * state.surfaceGrip * effectiveThrottle * dt;
          }
          if (effectiveBrake > 0) {
            if (longitudinal > 0.45) longitudinal = Math.max(0, longitudinal - finite(profile.brakeForce, 9.4) * effectiveBrake * dt);
            else longitudinal -= finite(profile.reverseAcceleration, 2.6) * state.surfaceGrip * effectiveBrake * dt;
          }
          if (state.grounded && !effectiveThrottle && !effectiveBrake) {
            const resistance = finite(profile.rollingResistance?.[surfaceKey], 0.48) * dt;
            longitudinal = Math.abs(longitudinal) <= resistance ? 0 : longitudinal - Math.sign(longitudinal) * resistance;
          }
          if (state.grounded) {
            longitudinal -= longitudinal * Math.abs(longitudinal) * finite(profile.aerodynamicDrag, 0.00085) * dt;
            const forwardGrade = -(state.groundNormal.x * forward.x + state.groundNormal.z * forward.z) / Math.max(0.25, state.groundNormal.y);
            longitudinal -= clamp(forwardGrade, -0.32, 0.32) * 9.81 * dt;
            if (input.handbrake) longitudinal *= Math.exp(-0.85 * dt);
          }
          if (state.tipped) longitudinal *= Math.exp(-5.5 * dt);
          // Ease down after a burst instead of snapping instantly to the normal cap.
          if (state.grounded) longitudinal = clamp(longitudinal, -maximumReverse, Math.max(maximumForward, state.speed - 12 * dt));
          if (state.grounded) lateral *= Math.exp(-Math.max(0.01, lateralGrip) * dt);

          const speedRatio = clamp(Math.abs(longitudinal) / Math.max(1, finite(profile.maximumForwardSpeed, 38)), 0, 1);
          const steering = profile.steering ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.steering;
          const targetSteer = (state.tipped ? 0 : input.steer) * (finite(steering.lowSpeedAngle, 0.6) + (finite(steering.highSpeedAngle, 0.155) - finite(steering.lowSpeedAngle, 0.6)) * speedRatio);
          const steeringAngle = state.steeringAngle + (targetSteer - state.steeringAngle) * (1 - Math.exp(-finite(steering.response, 11) * dt));
          const maximumYaw = finite(steering.maximumYawRate, 1.1);
          const targetYawRate = state.tipped ? 0 : state.grounded
            ? Math.abs(longitudinal) > 0.08 ? clamp((longitudinal / finite(steering.wheelbase, 6.1)) * Math.tan(steeringAngle) * finite(steering.yawResponse, 0.84) * state.surfaceGrip * (input.handbrake ? 1.12 : 1), -maximumYaw, maximumYaw) : 0
            : input.steer * finite(profile.air?.steering, 0.72);
          const yawRate = state.yawRate + (targetYawRate - state.yawRate) * (1 - Math.exp(-(state.grounded ? 10 : 4.5) * dt));
          const heading = normalizeAngle(state.heading + yawRate * dt);
          const nextForward = { x: Math.sin(heading), z: Math.cos(heading) };
          const nextRight = { x: nextForward.z, z: -nextForward.x };
          // A turn changes the body orientation before tires redirect its mass.
          // Reprojecting preserves real slip; the handbrake lowers its damping.
          const yawStep = yawRate * dt;
          const turnLongitudinal = longitudinal * Math.cos(yawStep) + lateral * Math.sin(yawStep);
          const turnLateral = lateral * Math.cos(yawStep) - longitudinal * Math.sin(yawStep);
          let velocity;
          if (state.grounded) {
            velocity = { x: nextForward.x * turnLongitudinal + nextRight.x * turnLateral, y: state.velocity.y, z: nextForward.z * turnLongitudinal + nextRight.z * turnLateral };
          } else {
            // Air control bends the flight slightly, without road traction,
            // unlimited midair acceleration or snapping velocity to the nose.
            const airTurn = yawStep * clamp(finite(profile.air?.velocitySteering, 0.18), 0, 0.5);
            const drag = Math.exp(-Math.max(0, finite(profile.air?.drag, 0.025)) * dt);
            velocity = { x: (state.velocity.x * Math.cos(airTurn) + state.velocity.z * Math.sin(airTurn)) * drag, y: state.velocity.y, z: (state.velocity.z * Math.cos(airTurn) - state.velocity.x * Math.sin(airTurn)) * drag };
          }

          const suspension = profile.suspension ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.suspension;
          const contactRadius=finite(suspension.travel,.92);
          const targetRideHeight = state.groundHeight + contactRadius;
          const groundGap = state.position.y - targetRideHeight;
          let grounded = state.grounded && groundGap <= 0.24 && velocity.y <= 0.6;
          let suspensionCompression = state.suspensionCompression;
          let suspensionVelocity = state.suspensionVelocity;
          let positionY = state.position.y;
          let airTime = state.airTime;
          let flightOrigin = state.flightOrigin;
          let flightPeakHeight = state.flightPeakHeight;
          let landingSequence = state.landingSequence;
          let lastLanding = state.lastLanding;
          let supportVelocity = state.supportVelocity;
          if (grounded) {
            positionY = targetRideHeight;
            velocity.y = 0;
            airTime = 0;
            flightOrigin = null;
            supportVelocity = clamp(-(state.groundNormal.x * velocity.x + state.groundNormal.z * velocity.z) / Math.max(0.25, state.groundNormal.y), -8, 12);
          } else {
            if (!flightOrigin) { flightOrigin = { ...state.position }; flightPeakHeight = 0; }
            if (state.grounded) velocity.y = Math.max(velocity.y, supportVelocity);
            airTime += dt;
            velocity.y -= finite(profile.air?.gravity, 11.5) * dt;
            positionY += velocity.y * dt;
            flightPeakHeight = Math.max(flightPeakHeight, positionY - flightOrigin.y);
            if (positionY <= targetRideHeight && velocity.y <= 0) {
              const impactSpeed = -velocity.y;
              // A small rebound is visual punctuation, not a second stunt.
              if (airTime >= 0.25 && impactSpeed > 2) {
                landingSequence += 1;
                lastLanding = { sequence: landingSequence, airTime, impactSpeed, distance: Math.hypot(state.position.x - flightOrigin.x, state.position.z - flightOrigin.z), height: flightPeakHeight };
              }
              suspensionCompression = Math.max(suspensionCompression, Math.min(1, impactSpeed * 0.065));
              suspensionVelocity = 0;
              positionY = targetRideHeight;
              const rebound = Math.min(Math.max(0, finite(suspension.maximumRebound, 1)), impactSpeed * Math.max(0, finite(suspension.landingRestitution, 0.065)));
              velocity.y = rebound > 0.3 && airTime >= 0.25 ? rebound : 0;
              grounded = velocity.y === 0;
              airTime = 0; flightOrigin = null; flightPeakHeight = 0; supportVelocity = 0;
            }
          }
          // A damped visual spring is integrated once. The contact sphere does
          // not inherit body lean or accumulate artificial suspension energy.
          const damping = suspensionVelocity >= 0 ? finite(suspension.compressionDamping, 8.5) : finite(suspension.extensionDamping, 6.4);
          suspensionVelocity += (-suspensionCompression * finite(suspension.spring, 22) - suspensionVelocity * damping) * dt;
          suspensionCompression = clamp(suspensionCompression + suspensionVelocity * dt, -0.4, 1);

          const position = {
            x: state.position.x + velocity.x * dt,
            y: positionY,
            z: state.position.z + velocity.z * dt
          };
          const islandContacts = position.y - targetRideHeight <= 2 ? resolveRoundaboutIslandContacts(position, velocity, heading, input.barrierContacts) : [];
          for (const contact of islandContacts) {
            const previous = roundaboutContactImpacts.get(contact.id) ?? 0;
            if (!roundaboutContactImpacts.has(contact.id) || contact.impactSpeed > previous) roundaboutContactImpacts.set(contact.id, contact.impactSpeed);
          }
          longitudinal = velocity.x * nextForward.x + velocity.z * nextForward.z;
          lateral = velocity.x * nextRight.x + velocity.z * nextRight.z;
          // Ground contact supports the sphere centre. Render lean never changes this radius.
          if(position.y<targetRideHeight){position.y=targetRideHeight;velocity.y=Math.max(0,velocity.y);grounded=true;airTime=0}
          const driftAngle = Math.atan2(lateral, Math.max(0.01, Math.abs(longitudinal)));
          const rollProfile = profile.roll ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.roll;
          const lateralAcceleration = yawRate * longitudinal;
          let tipped = state.tipped;
          let rollAngle = state.rollAngle;
          let rollVelocity = state.rollVelocity;
          // Steering lean is cosmetic and self-righting; only impact requests can tip the truck.
          const maximumLean = clamp(finite(rollProfile.maximumAngle, 0.62), 0.25, 0.72);
          const naturalTarget = Math.abs(input.steer)>.01 ? clamp(-lateralAcceleration * finite(rollProfile.lateralScale, 0.034), -maximumLean, maximumLean) : 0;
          const settledAngle = finite(rollProfile.settledAngle, 1.48);
          const targetRoll = tipped ? Math.sign(rollAngle || rollVelocity || 1) * settledAngle : naturalTarget;
          const rollSpring=Math.max(.01,finite(rollProfile.spring,19));
          const rollDamping=tipped?finite(rollProfile.damping,8.8):Math.max(finite(rollProfile.damping,8.8),2*Math.sqrt(rollSpring));
          const rollAcceleration = (targetRoll - rollAngle) * rollSpring - rollVelocity * rollDamping;
          rollVelocity += rollAcceleration * dt;
          rollAngle += rollVelocity * dt;
          if(!tipped){rollAngle=clamp(rollAngle,-maximumLean,maximumLean);if(Math.abs(rollAngle)>=maximumLean&&Math.sign(rollVelocity)===Math.sign(rollAngle))rollVelocity=0}
          if (tipped) rollAngle = clamp(rollAngle, -settledAngle * 1.05, settledAngle * 1.05);
          const acceleration = clamp((longitudinal - state.longitudinalSpeed) / dt, -40, 40);
          const safe = grounded && !tipped && Math.abs(rollAngle) < 0.48 && state.surface === "road" && Math.abs(lateral) < 4 && roundaboutContactImpacts.size === 0
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
            bodyPitch: state.bodyPitch + ((grounded ? clamp(-acceleration * 0.012 + suspensionCompression * 0.13, -0.15, 0.18) : clamp(-velocity.y * 0.025 - input.pitchControl * finite(profile.air?.pitchControl, 0.24), -0.5, 0.5)) - state.bodyPitch) * (1 - Math.exp(-6 * dt)),
            rollAngle,
            rollVelocity,
            tipped,
            grounded,
            contactRadius,
            suspensionCompression,
            suspensionVelocity,
            airTime,
            flightOrigin,
            flightPeakHeight,
            supportVelocity,
            landingSequence,
            lastLanding,
            acceleration,
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
        loadSnapshot(snapshot = {}) {
          const initial = initialTruck(), saved = clone(snapshot);
          world.setResource(TruckState, { ...initial, ...saved,
            position: { ...initial.position, ...saved.position }, velocity: { ...initial.velocity, ...saved.velocity },
            input: { ...initial.input, ...saved.input }, groundNormal: { ...initial.groundNormal, ...saved.groundNormal },
            lastSafe: { ...initial.lastSafe, ...saved.lastSafe }
          });
          return get();
        }
      };
    }
  });

  return Object.freeze({ kit: truckKit, resources: Object.freeze({ TruckState }) });
}
