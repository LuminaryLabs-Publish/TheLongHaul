function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function createCellStreamingPlan({ position, heading, cellSize, activeRadius }) {
  const size = Math.max(1, Number(cellSize) || 1);
  const radius = Math.max(1, Math.floor(Number(activeRadius) || 1));
  const x = Number(position?.x) || 0;
  const z = Number(position?.z) || 0;
  const angle = Number(heading) || 0;
  const cx = Math.floor(x / size);
  const cz = Math.floor(z / size);
  const forward = { x: Math.sin(angle), z: Math.cos(angle) };
  const desiredCoordinates = [];
  const desiredIds = new Set();

  for (let offsetZ = -radius; offsetZ <= radius; offsetZ += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const coordinates = [cx + offsetX, cz + offsetZ];
      desiredCoordinates.push(coordinates);
      desiredIds.add(`${coordinates[0]}:${coordinates[1]}`);
    }
  }

  const lookAhead = size * 1.35;
  const nextCx = Math.floor((x + forward.x * lookAhead) / size);
  const nextCz = Math.floor((z + forward.z * lookAhead) / size);
  const dominantX = Math.abs(forward.x) >= Math.abs(forward.z);
  let stepX = clamp(nextCx - cx, -1, 1);
  let stepZ = clamp(nextCz - cz, -1, 1);

  if (stepX === 0 && stepZ === 0) {
    stepX = dominantX ? (forward.x >= 0 ? 1 : -1) : 0;
    stepZ = dominantX ? 0 : (forward.z >= 0 ? 1 : -1);
  }

  const frontierCoordinates = [];
  for (let offsetZ = -radius; offsetZ <= radius; offsetZ += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const coordinates = [cx + stepX + offsetX, cz + stepZ + offsetZ];
      if (!desiredIds.has(`${coordinates[0]}:${coordinates[1]}`)) frontierCoordinates.push(coordinates);
    }
  }

  return {
    cx,
    cz,
    key: `${cx}:${cz}`,
    forward,
    step: { x: stepX, z: stepZ },
    desiredCoordinates,
    frontierCoordinates
  };
}
