// Ground-plane collision footprints sized from the meshes built in app-chunk-3.js
// and app-chunk-18.js. Local forward is +Z, matching the vehicle visuals.
export const LONG_HAUL_TRUCK_COLLIDER = Object.freeze({
  width: 3.65,
  length: 8.2,
  offsetZ: -0.12
});

export const ARCADE_TRAFFIC_COLLIDERS = Object.freeze([
  Object.freeze({ name: "car", width: 3.05, length: 4.85, offsetZ: 0 }),
  Object.freeze({ name: "pickup", width: 3.35, length: 5.95, offsetZ: 0 }),
  Object.freeze({ name: "box truck", width: 3.55, length: 7.6, offsetZ: 0 }),
  Object.freeze({ name: "semi", width: 3.72, length: 11, offsetZ: 0 })
]);

export function createVehicleCollider(position, heading, dimensions) {
  const sine = Math.sin(heading);
  const cosine = Math.cos(heading);
  const offset = dimensions.offsetZ ?? 0;
  return {
    x: position.x + sine * offset,
    z: position.z + cosine * offset,
    axisX: { x: cosine, z: -sine },
    axisZ: { x: sine, z: cosine },
    halfWidth: dimensions.width * 0.5,
    halfLength: dimensions.length * 0.5
  };
}

export function vehicleCollidersOverlap(first, second) {
  const deltaX = second.x - first.x;
  const deltaZ = second.z - first.z;
  const axes = [first.axisX, first.axisZ, second.axisX, second.axisZ];
  for (const axis of axes) {
    const distance = Math.abs(deltaX * axis.x + deltaZ * axis.z);
    const firstRadius = first.halfWidth * Math.abs(first.axisX.x * axis.x + first.axisX.z * axis.z)
      + first.halfLength * Math.abs(first.axisZ.x * axis.x + first.axisZ.z * axis.z);
    const secondRadius = second.halfWidth * Math.abs(second.axisX.x * axis.x + second.axisX.z * axis.z)
      + second.halfLength * Math.abs(second.axisZ.x * axis.x + second.axisZ.z * axis.z);
    if (distance > firstRadius + secondRadius) return false;
  }
  return true;
}
