const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const DEFAULT_ROAD_CLASSES = Object.freeze([
  Object.freeze({ id: "highway", width: [22, 30], grip: 1.0, gradeLimit: 0.07, curvature: [0.02, 0.12], jumpWeights: { none: 0.96, softCrest: 0.04 } }),
  Object.freeze({ id: "country-road", width: [14, 21], grip: 0.82, gradeLimit: 0.12, curvature: [0.08, 0.30], jumpWeights: { none: 0.72, softCrest: 0.18, drainageRise: 0.08, bridgeApproach: 0.02 } }),
  Object.freeze({ id: "rough-shortcut", width: [10, 17], grip: 0.58, gradeLimit: 0.18, curvature: [0.14, 0.42], jumpWeights: { none: 0.42, softCrest: 0.25, erodedRamp: 0.22, tabletop: 0.11 } }),
  Object.freeze({ id: "forest-trail", width: [7, 12], grip: 0.42, gradeLimit: 0.22, curvature: [0.18, 0.52], jumpWeights: { none: 0.28, softCrest: 0.30, erodedRamp: 0.30, bridgeApproach: 0.12 } })
]);

export function createLongHaulRoadClassCatalogKit(N, options = {}) {
  const CatalogState = N.defineResource("long-haul.road-class-catalog.state");
  const RegisterRoadClass = N.defineEvent("long-haul.road-class-catalog.register.request");
  const initial = Object.fromEntries((options.classes ?? DEFAULT_ROAD_CLASSES).map((entry) => [entry.id, clone(entry)]));
  const kit = N.defineDomainServiceKit({
    id: "long-haul-road-class-catalog-kit",
    domain: "long-haul-road-class-catalog",
    apiName: "longHaulRoadClasses",
    services: ["road-class-catalog", "surface-policy", "jump-weight-policy"],
    stability: "game-stable",
    version: "3.0.0",
    resources: { CatalogState },
    events: { RegisterRoadClass },
    systems: [{ phase: "resolve", name: "longHaulRoadClassCatalogSystem", system(world) {
      let state = world.getResource(CatalogState);
      for (const request of world.readEvents(RegisterRoadClass)) {
        const id = String(request.id ?? "").trim();
        if (!id) continue;
        state = { ...state, [id]: clone({ ...request, id }) };
      }
      world.setResource(CatalogState, state);
    }}],
    initWorld({ world }) { world.setResource(CatalogState, clone(initial)); },
    createApi({ world }) {
      const read = () => world.getResource(CatalogState) ?? {};
      return {
        get: (id) => clone(read()[String(id)] ?? null),
        list: () => Object.values(read()).sort((a, b) => a.id.localeCompare(b.id)).map(clone),
        register(value) { world.emit(RegisterRoadClass, clone(value)); return clone(value); },
        snapshot: () => clone(read()),
        reset() { world.setResource(CatalogState, clone(initial)); return clone(initial); }
      };
    }
  });
  return Object.freeze({ kit, resources: Object.freeze({ CatalogState }) });
}
