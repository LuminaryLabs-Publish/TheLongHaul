/* The Long Haul's product-owned adapter for authored truck presentation.
 * Loaded after illustrated materials, before the player can launch. Preserve
 * the original buildTruck as a runtime fallback without changing gameplay. */
(() => {
  const originalBuildTruck = buildTruck;
  let latest = { source: HERO_TRUCK_SOURCE.id, status: 'not-built', meshCount: 0 };
  buildTruck = function buildAuthoredHeroTruck() {
    const previous = truckRig;
    if (previous?.root?.parent) previous.root.parent.remove(previous.root);
    if (previous?.heroRelease) previous.heroRelease();
    try {
      const rig = createHeroTruckMesh({ THREE, materials, createTruckGrounding });
      dynamicRoot.add(rig.root); truckRig = rig;
      latest = { source: rig.heroSourceId, status: 'authored', ...rig.heroStats };
      return rig;
    } catch (error) {
      latest = { source: HERO_TRUCK_SOURCE.id, status: 'fallback', reason: String(error) };
      console.warn('Authoring hero truck failed; retaining established truck.', error);
      return originalBuildTruck();
    }
  };
  window.LongHaulHeroTruck = { getState: () => ({ ...latest }) };
})();
