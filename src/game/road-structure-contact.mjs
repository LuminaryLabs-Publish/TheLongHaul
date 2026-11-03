// Product-owned contacts for procedural bridge rails and gallery roofs/walls.
// Resolves actual simulation state; never used by the replay driver.
import { LONG_HAUL_TRUCK_COLLIDER } from './vehicle-collider.mjs';
export function resolveRoadStructureContact(truck, previous, road) {
  if (!road?.structure || !truck?.position || !previous) return null;
  if (Math.hypot(truck.position.x - previous.x, truck.position.z - previous.z) > 20) return null;
  const { nx, nz, width } = road;
  const lateral = (truck.position.x - road.x) * nx + (truck.position.z - road.z) * nz;
  const before = (previous.x - road.x) * nx + (previous.z - road.z) * nz;
  const relativeHeading = truck.heading - road.heading;
  const half = Math.abs(Math.cos(relativeHeading)) * LONG_HAUL_TRUCK_COLLIDER.width / 2
    + Math.abs(Math.sin(relativeHeading)) * LONG_HAUL_TRUCK_COLLIDER.length / 2;
  const inner = width / 2 + (road.structure === 'tunnel' ? .65 : .82);
  const wallTop = road.y + (road.structure === 'tunnel' ? 8.2 : 1.15);
  const groundedAtWall = truck.position.y < wallTop && truck.position.y + 4.7 > road.y;
  const position = { ...truck.position }, velocity = { ...truck.velocity };
  const contacts = []; let strength = 0;
  if (groundedAtWall) for (const side of [-1, 1]) {
    const distance = lateral * side, oldDistance = before * side;
    // The continuous segment wall is only .36 m/.1.1 m thick; retain the side
    // from which the truck approached instead of snapping outsiders inside.
    const outer = inner + (road.structure === 'tunnel' ? 1.1 : .36);
    let target = null;
    if (oldDistance <= inner && distance + half > inner && distance - half < outer) target = inner - half - .02;
    else if (oldDistance >= outer && distance - half < outer && distance + half > inner) target = outer + half + .02;
    if (target === null) continue;
    position.x += nx * side * (target - distance); position.z += nz * side * (target - distance);
    const normalVelocity = velocity.x * nx + velocity.z * nz;
    strength = Math.max(strength, Math.abs(normalVelocity));
    velocity.x -= nx * normalVelocity * 1.15; velocity.z -= nz * normalVelocity * 1.15;
    contacts.push('wall');
  }
  const top = position.y + 4.7, ceiling = road.y + 8.2 + road.bank * lateral;
  if (road.structure === 'tunnel' && Math.abs(lateral) < inner + half && top > ceiling && previous.y + 4.7 <= ceiling + 1.5) {
    position.y = ceiling - 4.7; strength = Math.max(strength, Math.abs(velocity.y));
    velocity.y = Math.min(-.3, -Math.abs(velocity.y) * .25); contacts.push('roof');
  }
  if (!contacts.length) return null;
  const longitudinalSpeed = velocity.x * Math.sin(truck.heading) + velocity.z * Math.cos(truck.heading);
  const lateralSpeed = velocity.x * Math.cos(truck.heading) - velocity.z * Math.sin(truck.heading);
  return { position, velocity, speed: longitudinalSpeed, longitudinalSpeed, lateralSpeed, contacts, strength };
}
