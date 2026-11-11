import { clone, clamp, finite, normalizeAngle } from "./shared.mjs";
import { DEFAULT_TRUCK_DYNAMICS_PROFILE } from "./truck-dynamics-profile-kit.mjs";
import { LONG_HAUL_TRUCK_COLLIDER } from "./vehicle-collider.mjs";
import { createDriftState, prepareDrift, resolveDrift } from "./drift-behavior.mjs";
import { createTruckSpringMassState, advanceTruckSpringMass } from "./truck-spring-mass.mjs";
import { cargoDynamics, normalizeCargoLoad } from "./cargo-profiles.mjs";
import { createReactiveBodyState, advanceReactiveBody, chassisHeading } from "./truck-reactive-body.mjs";
import { resolveTruckTireForces } from "./truck-tire-forces.mjs";

function bodyAtHeading(heading = 0, verticalVelocity = 0) {
  return createReactiveBodyState({
    quaternion: { x: 0, y: Math.sin(heading * 0.5), z: 0, w: Math.cos(heading * 0.5) },
    angularVelocity: { x: 0, y: 0, z: 0 },
    verticalVelocity
  });
}

function cargoState(profile, value, previous = null) {
  const cargo = normalizeCargoLoad(value);
  const loadFactors = cargoDynamics(profile, cargo);
  const sameLoad = cargo && previous?.cargo?.profileId === cargo.profileId && previous.cargo.massKg === cargo.massKg;
  const boundedVector = (vector, bound = 1) => ({ x: clamp(finite(vector?.x), -bound, bound), z: clamp(finite(vector?.z), -bound, bound) });
  return {
    cargo,
    cargoMass: loadFactors.cargoMass,
    effectiveMass: loadFactors.effectiveMass,
    totalMass: loadFactors.effectiveMass,
    cargoShift: sameLoad ? clamp(finite(previous.loadShift?.x), -1, 1) : 0,
    loadFactors,
    loadShift: sameLoad ? boundedVector(previous.loadShift) : { x: 0, z: 0 },
    loadShiftVelocity: sameLoad ? boundedVector(previous.loadShiftVelocity, 4) : { x: 0, z: 0 },
    loadStress: sameLoad ? clamp(finite(previous.loadStress), 0, 1) : 0
  };
}

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

export function createLongHaulMovementV2Kit(N, options = {}) {
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
    // Boost-only high-speed reserve; held throttle sustains earned momentum.
    boostCruiseSpeed: 0,
    longitudinalSpeed: 0,
    lateralSpeed: 0,
    driftAngle: 0,
    drift: createDriftState(),
    movementVersion: "v2",
    springMass: createTruckSpringMassState(),
    reactiveBody: bodyAtHeading(finite(value.heading)),
    driveTraction: 1,
    contactLoads: {left: 0, right: 0, body: 0},
    weightTransfer: 0,
    cargoShift: 0,
    steeringDamage: 0,
    totalMass: DEFAULT_TRUCK_DYNAMICS_PROFILE.mass,
    steeringAngle: 0,
    wheelTravel: 0,
    bodyRoll: 0,
    bodyPitch: 0,
    rollAngle: 0,
    rollVelocity: 0,
    rolloverExposure: 0,
    rolloverRisk: 0,
    wheelLiftLeft: 0,
    wheelLiftRight: 0,
    rollMode: "planted",
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
    input: { throttle: 0, brake: 0, steer: 0, pitchControl: 0, handbrake: false, boost: false, rush: false, drift: false, steeringDamage: 0, barrierContacts: [] },
    roundaboutContacts: [],
    ...cargoState(DEFAULT_TRUCK_DYNAMICS_PROFILE, value.cargo),
    sequence: 0
  });

  const truckKit = N.defineDomainServiceKit({
    id: "long-haul-truck-movement-v2-kit",
    domain: "long-haul-truck",
    apiName: "longHaulTruck",
    services: ["road-vehicle", "drift", "ground-contact", "suspension", "air-control", "recovery-pose", "cargo-load"],
    stability: "game-stable",
    version: "5.0.0",
    resources: { TruckState },
    events: { TruckInput, TruckReset, TruckTeleport, TruckImpulse },
    systems: [{
      phase: "simulate",
      name: "longHaulTruckMovementV2System",
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
            boostCruiseSpeed: 0,
            longitudinalSpeed: speed,
            lateralSpeed: 0,
            driftAngle: 0,
            drift: createDriftState(state.drift, true),
            springMass: createTruckSpringMassState(),
            reactiveBody: bodyAtHeading(heading, finite(request.verticalSpeed)),
            driveTraction: 1,
            contactLoads: {left: 0, right: 0, body: 0},
            weightTransfer: 0,
            cargoShift: 0,
            steeringAngle: 0,
            rollAngle: 0,
            rollVelocity: 0,
            rolloverExposure: 0,
            rolloverRisk: 0,
            wheelLiftLeft: 0,
            wheelLiftRight: 0,
            rollMode: "planted",
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
            loadShift: { x: 0, z: 0 },
            loadShiftVelocity: { x: 0, z: 0 },
            loadStress: 0,
            input: { throttle: 0, brake: 0, steer: 0, pitchControl: 0, handbrake: false, boost: false, rush: false, drift: false, steeringDamage: 0, barrierContacts: [] },
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
              drift: Boolean(request.drift),
              steeringDamage: clamp(finite(request.steeringDamage), -1, 1),
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
          input: { throttle: 0, brake: 0, steer: 0, pitchControl: 0, handbrake: false, boost: false, rush: false, drift: false, steeringDamage: 0,
            barrierContacts: Array.isArray(teleportGround.barriers) ? teleportGround.barriers.map((barrier) => ({ id: String(barrier.id ?? "roundabout-island"), x: finite(barrier.x), z: finite(barrier.z), radius: Math.max(0, finite(barrier.radius)) })) : [] } };
        const load = cargoDynamics(profile, state.cargo);
        state = { ...state, cargoMass: load.cargoMass, effectiveMass: load.effectiveMass, loadFactors: load };
        for (const request of world.readEvents(TruckImpulse)) {
          const forward = { x: Math.sin(state.heading), z: Math.cos(state.heading) };
          const rollImpulse = finite(request.rollDelta) * load.momentumScale * load.rollScale;
          const launchImpulse = finite(request.y) * (request.kind === "launch" ? load.launchScale : load.momentumScale);
          const launch = launchImpulse > 0.6;
          const impactStrength = Math.hypot(finite(request.speedDelta), finite(request.x), finite(request.z)) + Math.abs(rollImpulse) * 4;
          const impact = request.kind !== "launch" && impactStrength > 0.01;
          const deltaVelocity = {
            x: (forward.x * finite(request.speedDelta) + finite(request.x)) * load.momentumScale,
            y: launchImpulse,
            z: (forward.z * finite(request.speedDelta) + finite(request.z)) * load.momentumScale
          };
          // Both translation and rotation receive the same physical impulse.
          // Optional world contact coordinates give the impulse a lever arm.
          const offset = request.point ? {
            x: finite(request.point.x) - state.position.x,
            y: finite(request.point.y) - (state.groundHeight + state.reactiveBody.centerY),
            z: finite(request.point.z) - state.position.z
          } : { x: 0, y: 0, z: 0 };
          const angularKick = {
            x: (offset.y * deltaVelocity.z - offset.z * deltaVelocity.y) / 4.5,
            y: (offset.z * deltaVelocity.x - offset.x * deltaVelocity.z) / 8,
            z: (offset.x * deltaVelocity.y - offset.y * deltaVelocity.x) / 4.5
          };
          state = {
            ...state,
            velocity: {
              x: state.velocity.x + deltaVelocity.x,
              y: clamp(state.velocity.y + deltaVelocity.y, -40, 28),
              z: state.velocity.z + deltaVelocity.z
            },
            yawRate: state.yawRate + finite(request.yawDelta) * load.yawScale + angularKick.y,
            reactiveBody: { ...state.reactiveBody,
              verticalVelocity: clamp(state.reactiveBody.verticalVelocity + deltaVelocity.y, -40, 28),
              angularVelocity: {
                x: clamp(state.reactiveBody.angularVelocity.x + angularKick.x, -5, 5),
                y: clamp(state.reactiveBody.angularVelocity.y + finite(request.yawDelta) * load.yawScale + angularKick.y + finite(request.headingDelta) * load.yawScale, -3, 3),
                z: clamp(state.reactiveBody.angularVelocity.z + angularKick.z + (request.allowTip === false ? 0 : rollImpulse), -5, 5)
              }
            },
            grounded: launch ? false : state.grounded,
            flightOrigin: launch && state.grounded ? { ...state.position } : state.flightOrigin,
            flightPeakHeight: launch && state.grounded ? 0 : state.flightPeakHeight,
            airTime: launch && state.grounded ? 0 : state.airTime,
            // An impact/launch must not restore pre-collision boost speed.
            boostCruiseSpeed: impact || launch ? 0 : state.boostCruiseSpeed,
            impactSequence: state.impactSequence + (impact ? 1 : 0),
            lastImpact: impact ? { sequence: state.impactSequence + 1, strength: impactStrength, speed: Math.abs(state.speed), kind: String(request.kind ?? "impact"), effectiveMass: load.effectiveMass, energy: 0.5 * load.effectiveMass * impactStrength * impactStrength } : state.lastImpact,
            drift: impactStrength > 3 || launch ? createDriftState(state.drift, true) : state.drift,
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
          // V2's single inertial mass owns the compliant lateral/longitudinal
          // response. The V1 cargo shift spring is not run a second time.
          let loadShift = { x: 0, z: 0 };
          let loadShiftVelocity = { x: 0, z: 0 };
          let loadStress = 0;
          const previousPlanarSpeed = Math.hypot(longitudinal, lateral);
          const totalMass = load.effectiveMass;
          const loadRatio = load.payloadFraction;
          const steeringDamage = input.steeringDamage;
          const damageMagnitude = Math.abs(steeringDamage);
          const driftProfile = profile.drift ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.drift;
          let drift = prepareDrift(state.drift, input, {
            speed: previousPlanarSpeed, longitudinal, slipAngle: Math.atan2(lateral, Math.max(0.01, Math.abs(longitudinal))),
            grounded: state.grounded, tipped: state.driveTraction < 0.15
          }, dt);
          const surfaceKey = state.surface === "road" ? "road" : state.surface === "shoulder" ? "shoulder" : "offRoad";
          // Surface and grip limits are consumed by the two tire axles below;
          // no independent lateral damping or yaw-angle command is applied.
          const gripKey = surfaceKey !== 'road' ? surfaceKey
            : state.roadClass === 'paved-highway' ? 'highway'
            : state.roadMaterial !== 'paved' ? 'rough' : 'road';
          const boostForce = input.rush
            ? clamp(finite(profile.boost?.rushForceMultiplier, 3.8) + Math.max(0, finite(profile.boost?.forceMultiplier, 1.65) - 1.65), 1, 6)
            : input.boost ? clamp(finite(profile.boost?.forceMultiplier, 1.65), 1, 4) : 1;
          const speedMultiplier = input.rush
            ? clamp(finite(profile.boost?.rushSpeedMultiplier, 1.8) + Math.max(0, finite(profile.boost?.speedMultiplier, 1.22) - 1.22), 1, 2.2)
            : input.boost ? clamp(finite(profile.boost?.speedMultiplier, 1.22), 1, 1.8) : 1;
          const normalMaximum = finite(profile.maximumForwardSpeed, 34)
            * (state.surface === "road" ? 1 : state.surface === "shoulder" ? 0.86 : 0.66);
          const maximumForward = normalMaximum * speedMultiplier;
          // Sustained overspeed is earned by boost, not by ordinary throttle.
          // Letting go, braking, leaving reliable road traction, tipping or an
          // actual impact releases the reserve instead of restoring speed.
          const holdingThrottle = input.throttle >= 0.5 && input.brake <= 0
            && !input.handbrake && !input.drift && state.grounded
            && state.driveTraction >= 0.7 && state.surface === "road";
          const boosting = input.boost || input.rush;
          const speedBeforeThrust = Math.max(0, longitudinal);
          const retainedCruise = holdingThrottle ? Math.max(0, finite(state.boostCruiseSpeed)) : 0;
          const driveMaximum = Math.max(maximumForward, retainedCruise);
          const maximumReverse = finite(profile.maximumReverseSpeed, 10);

          const traction = state.grounded ? clamp(finite(state.driveTraction, 1), 0, 1) : 0;
          const effectiveThrottle = input.throttle * traction;
          const effectiveBrake = Math.max(input.brake, drift.active && input.drift ? 0.24 : 0) * traction;
          const normalizedSpeed = clamp(Math.abs(longitudinal) / Math.max(1, driveMaximum), 0, 1);
          const torqueCurve = 1 - normalizedSpeed * 0.5;
          if (effectiveThrottle > 0) {
            if (longitudinal < -0.2) longitudinal = Math.min(0, longitudinal + finite(profile.brakeForce, 17) * load.brakeScale * input.throttle * dt);
            else longitudinal += finite(profile.engineAcceleration, 6.1) * load.forceScale * torqueCurve * boostForce * state.surfaceGrip * effectiveThrottle * dt;
          }
          if (effectiveBrake > 0) {
            if (longitudinal > 0.45) longitudinal = Math.max(0, longitudinal - finite(profile.brakeForce, 9.4) * load.brakeScale * effectiveBrake * dt);
            else if (!input.drift) longitudinal -= finite(profile.reverseAcceleration, 2.6) * load.forceScale * state.surfaceGrip * effectiveBrake * dt;
          }
          if (state.grounded && !effectiveThrottle && !effectiveBrake) {
            const resistance = finite(profile.rollingResistance?.[surfaceKey], 0.48) * dt;
            longitudinal = Math.abs(longitudinal) <= resistance ? 0 : longitudinal - Math.sign(longitudinal) * resistance;
          }
          if (state.grounded) {
            longitudinal -= longitudinal * Math.abs(longitudinal) * finite(profile.aerodynamicDrag, 0.00085) * load.massRatio * dt;
            const forwardGrade = -(state.groundNormal.x * forward.x + state.groundNormal.z * forward.z) / Math.max(0.25, state.groundNormal.y);
            // Gravity is mass-independent; the heavier load's reduced available
            // traction above is what makes hills harder to climb.
            const gradeForce = load.effectiveMass * 9.81 * clamp(forwardGrade, -0.32, 0.32);
            longitudinal -= gradeForce / load.effectiveMass * dt;
            if (input.handbrake) longitudinal *= Math.exp(-0.85 * load.brakeScale * dt);
            // Sliding dissipates motion before the bounded reserve recovers any.
            if (drift.active) longitudinal *= Math.exp(-0.3 * dt);
          }
          // Ordinary throttle cannot create new overspeed by itself. With no
          // boost-earned reserve, it may hold the current speed but never
          // accelerate above the higher of that speed and the normal cap.
          if (!boosting && retainedCruise <= normalMaximum && longitudinal > normalMaximum)
            longitudinal = Math.min(longitudinal, Math.max(normalMaximum, speedBeforeThrust));
          // No automatic post-boost deceleration: throttle can sustain the
          // speed earned by boost. Coast, grade and brake use their real forces.
          if (state.grounded) longitudinal = clamp(longitudinal, -maximumReverse,
            Math.max(driveMaximum, Math.max(0, state.speed)));

          const speedRatio = clamp(Math.abs(longitudinal) / Math.max(1, finite(profile.maximumForwardSpeed, 38)), 0, 1);
          const steering = profile.steering ?? DEFAULT_TRUCK_DYNAMICS_PROFILE.steering;
          // Damage produces a stable, bounded pull and weaker steering. A full
          // opposing input always retains enough authority to correct it.
          const steerIntent = clamp(input.steer * (1 - damageMagnitude * 0.26) + steeringDamage * 0.16 * clamp(previousPlanarSpeed / 5, 0, 1), -1, 1);
          // Steering turns the visible front wheels irrespective of grip. Tire
          // contact forces, not steering or a target yaw rate, turn the truck.
          // Beyond normal top speed, the truck has a wider turn radius.
          // Tires still decide yaw/slip; this is not an artificial camera turn.
          const overspeed = Math.max(0, Math.abs(longitudinal) / Math.max(1, normalMaximum) - 1);
          const highSpeedAuthority = Math.max(0.5, 1 - 0.5 * overspeed);
          const targetSteer = steerIntent * highSpeedAuthority * (finite(steering.lowSpeedAngle, 0.6)
            + (finite(steering.highSpeedAngle, 0.155) - finite(steering.lowSpeedAngle, 0.6)) * speedRatio);
          const steeringAngle = state.steeringAngle + (targetSteer - state.steeringAngle)
            * (1 - Math.exp(-finite(steering.response, 11) * dt));
          const tire = resolveTruckTireForces({
            longitudinal, lateral, yawRate: state.yawRate, steeringAngle
          }, load, profile, {
            grounded: state.grounded, traction: state.driveTraction,
            surfaceGrip: state.surfaceGrip, gripKey,
            springDisplacementZ: state.springMass?.displacement?.z,
            driftActive: drift.active, handbrake: input.handbrake
          });
          longitudinal += tire.forwardAcceleration * dt;
          lateral += tire.lateralAcceleration * dt;
          // Preserve the *velocity vector* at boost-earned cruising speed,
          // including its slip direction, instead of snapping it to the nose.
          // Only a held accelerator and stable traction can sustain it.
          if (holdingThrottle && !boosting && retainedCruise > normalMaximum) {
            const planarSpeed = Math.hypot(longitudinal, lateral);
            if (planarSpeed > 0.1 && planarSpeed < retainedCruise) {
              const scale = retainedCruise / planarSpeed;
              longitudinal *= scale;
              lateral *= scale;
            }
          }
          const boostCruiseSpeed = holdingThrottle && (boosting || retainedCruise > 0)
            ? Math.min(normalMaximum * 2.2,
              Math.max(retainedCruise, boosting ? Math.max(0, Math.hypot(longitudinal, lateral)) : 0))
            : 0;
          // Angular velocity is integrated from axle torque. The safety bound
          // is for numerical robustness, not a steering-derived yaw target.
          let yawRate = clamp(finite(state.reactiveBody?.angularVelocity?.y, state.yawRate), -3, 3);
          let heading = normalizeAngle(state.heading + (yawRate + tire.yawAcceleration * dt) * dt);
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
            const release = resolveDrift(drift, {
              previousSpeed: previousPlanarSpeed, speed: Math.hypot(turnLongitudinal, turnLateral),
              longitudinal: turnLongitudinal, slipAngle: Math.atan2(turnLateral, Math.max(0.01, Math.abs(turnLongitudinal)))
            }, dt, driftProfile);
            drift = release.drift;
            if (release.released) {
              // Preserve momentum direction. Tire friction, not a drift event,
              // must gradually realign velocity with the chassis heading.
              const currentSpeed = Math.hypot(velocity.x, velocity.z);
              const scale = release.speed / Math.max(0.001, currentSpeed);
              velocity.x *= scale;
              velocity.z *= scale;
            }
          } else {
            // Air control bends the flight slightly, without road traction,
            // unlimited midair acceleration or snapping velocity to the nose.
            const airTurn = yawStep * clamp(finite(profile.air?.velocitySteering, 0.18), 0, 0.5) * load.airControlScale;
            const drag = Math.exp(-Math.max(0, finite(profile.air?.drag, 0.025)) * load.massRatio * dt);
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
          // The ground sample is a contact plane, never a height constraint.
          // The single reactive rigid body integrates gravity and suspension.
          if (!grounded) {
            if (!flightOrigin) { flightOrigin = { ...state.position }; flightPeakHeight = 0; }
            airTime += dt;
            flightPeakHeight = Math.max(flightPeakHeight, state.position.y - flightOrigin.y);
          }
          positionY += velocity.y * dt;
          // A damped visual spring is integrated once. The contact sphere does
          // not inherit body lean or accumulate artificial suspension energy.
          const damping = (suspensionVelocity >= 0 ? finite(suspension.compressionDamping, 8.5) : finite(suspension.extensionDamping, 6.4)) * load.dampingScale;
          const targetCompression = grounded ? load.staticCompression : 0;
          suspensionVelocity += ((targetCompression - suspensionCompression) * finite(suspension.spring, 22) * load.springScale - suspensionVelocity * damping) * dt;
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
          const driftAngle = Math.atan2(lateral, Math.max(0.01, Math.abs(longitudinal)));
          // Project the actual change in world velocity into the truck frame.
          // No steering-sign / drift-mode command is fed to the spring: a drift
          // changes lean only through tire traction and resulting acceleration.
          const localAcceleration = {
            x: clamp(((velocity.x - state.velocity.x) * nextRight.x + (velocity.z - state.velocity.z) * nextRight.z) / dt, -35, 35),
            y: clamp((velocity.y - state.velocity.y) / dt, -25, 25),
            z: clamp(((velocity.x - state.velocity.x) * nextForward.x + (velocity.z - state.velocity.z) * nextForward.z) / dt, -35, 35)
          };
          const spring = advanceTruckSpringMass(state.springMass, grounded ? localAcceleration : { x: 0, y: localAcceleration.y, z: 0 }, load, dt, profile.springMass);
          const sprungBalance = advanceReactiveBody(state.reactiveBody, spring, localAcceleration, load, profile, dt, true, {
            yawAcceleration: tire.yawAcceleration,
            normal: state.groundNormal
          });
          const { body: nextBody, ...bodyTelemetry } = sprungBalance;
          const { tipped, rollAngle, rollVelocity } = bodyTelemetry;
          // The chassis supplies the ONLY vertical position and orientation.
          position.y = state.groundHeight + nextBody.centerY - load.centerOfMassHeight + contactRadius;
          velocity.y = nextBody.verticalVelocity;
          heading = normalizeAngle(chassisHeading(nextBody.quaternion));
          yawRate = nextBody.angularVelocity.y;
          const previousGrounded = state.grounded;
          grounded = sprungBalance.driveTraction > 0.08 ||
            (bodyTelemetry.contactLoads.body > load.effectiveMass * 9.81 * 0.08);
          if (!previousGrounded && grounded) {
            const impactSpeed = Math.max(0, -finite(state.velocity.y));
            if (airTime >= 0.25 && impactSpeed > 2) {
              landingSequence += 1;
              lastLanding = { sequence: landingSequence, airTime, impactSpeed,
                distance: flightOrigin ? Math.hypot(position.x - flightOrigin.x, position.z - flightOrigin.z) : 0,
                height: flightPeakHeight, effectiveMass: load.effectiveMass,
                energy: 0.5 * load.effectiveMass * impactSpeed * impactSpeed, loadStress };
            }
            airTime = 0; flightOrigin = null; flightPeakHeight = 0;
          }
          if (sprungBalance.driveTraction < 0.15) drift = createDriftState(drift, true);
          const acceleration = clamp((longitudinal - state.longitudinalSpeed) / dt, -40, 40);
          // Preserve the existing cargo telemetry contract without inventing a
          // second moving-mass spring for unsecured freight.
          const shiftStrength = Math.max(0, finite(load.shiftStrength));
          loadShift = { x: clamp(spring.displacement.x * 3 * shiftStrength, -shiftStrength, shiftStrength),
            z: clamp(spring.displacement.z * 3 * shiftStrength, -shiftStrength, shiftStrength) };
          loadShiftVelocity = { x: spring.velocity.x * shiftStrength, z: spring.velocity.z * shiftStrength };
          loadStress = clamp((Math.abs(loadShift.x) * 0.8 + Math.abs(loadShift.z) * 0.6 - 0.3) / 0.7, 0, 1);
          const weightTransfer = clamp(spring.displacement.z * 2, -0.6, 1);
          const cargoShift = loadShift.x;
          const safe = grounded && !tipped && Math.abs(rollAngle) < 0.48 && state.surface === "road" && Math.abs(lateral) < 4 && roundaboutContactImpacts.size === 0
            ? { x: position.x, y: position.y, z: position.z, heading }
            : state.lastSafe;

          state = {
            ...state,
            ...bodyTelemetry,
            springMass: { displacement: spring.displacement, velocity: spring.velocity },
            reactiveBody: nextBody,
            movementVersion: "v2",
            position,
            velocity,
            roundaboutContacts: [...roundaboutContactImpacts].map(([id, impactSpeed]) => ({ id, impactSpeed })),
            heading,
            yawRate,
            speed: longitudinal,
            boostCruiseSpeed: roundaboutContactImpacts.size ? 0 : boostCruiseSpeed,
            longitudinalSpeed: longitudinal,
            lateralSpeed: lateral,
            driftAngle,
            drift,
            weightTransfer,
            cargoShift,
            steeringDamage,
            totalMass,
            steeringAngle,
            wheelTravel: state.wheelTravel + longitudinal * dt,
            bodyRoll: rollAngle,
            bodyPitch: sprungBalance.bodyPitch,
            rollAngle,
            rollVelocity,
            tipped,
            grounded,
            contactRadius,
            suspensionCompression,
            suspensionVelocity,
            loadShift,
            loadShiftVelocity,
            loadStress,
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
      const getProfile = () => DynamicsProfileState ? (world.getResource(DynamicsProfileState) ?? DEFAULT_TRUCK_DYNAMICS_PROFILE) : DEFAULT_TRUCK_DYNAMICS_PROFILE;
      return {
        getState: get,
        input(value = {}) { world.emit(TruckInput, clone(value)); return get(); },
        reset(value = {}) { world.emit(TruckReset, clone(value)); return get(); },
        teleport(value = {}) { world.emit(TruckTeleport, clone(value)); return get(); },
        impulse(value = {}) { world.emit(TruckImpulse, clone(value)); return get(); },
        setCargo(value = null) {
          const current = world.getResource(TruckState);
          // Drive-through loading changes force/inertia immediately. There is
          // deliberately no reset, teleport, speed cap or momentum rewrite.
          world.setResource(TruckState, { ...current, ...cargoState(getProfile(), value, current) });
          return get();
        },
        snapshot: get,
        loadSnapshot(snapshot = {}) {
          const initial = initialTruck(), saved = clone(snapshot);
          world.setResource(TruckState, { ...initial, ...saved,
            position: { ...initial.position, ...saved.position }, velocity: { ...initial.velocity, ...saved.velocity },
            input: { ...initial.input, ...saved.input }, groundNormal: { ...initial.groundNormal, ...saved.groundNormal },
            lastSafe: { ...initial.lastSafe, ...saved.lastSafe },
            ...cargoState(getProfile(), saved.cargo, saved),
            springMass: createTruckSpringMassState(saved.springMass),
            reactiveBody: createReactiveBodyState(saved.reactiveBody?.quaternion ? saved.reactiveBody :
              bodyAtHeading(finite(saved.heading)), cargoDynamics(getProfile(), saved.cargo).centerOfMassHeight)
          });
          return get();
        }
      };
    }
  });

  return Object.freeze({ kit: truckKit, resources: Object.freeze({ TruckState }) });
}
