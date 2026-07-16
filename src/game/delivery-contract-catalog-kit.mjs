const clone = (value) => value === undefined ? undefined : structuredClone(value);

export const DEFAULT_DELIVERY_CONTRACT_TYPES = Object.freeze([
  Object.freeze({ id: "standard", stops: 1, fragile: false, timeScale: 1, distanceScale: 1, penaltyScale: 1 }),
  Object.freeze({ id: "fragile", stops: 1, fragile: true, timeScale: 1.08, distanceScale: 1, penaltyScale: 1.35 }),
  Object.freeze({ id: "express", stops: 1, fragile: false, timeScale: 0.78, distanceScale: 1, penaltyScale: 1.15 }),
  Object.freeze({ id: "lost-manifest", stops: 1, fragile: false, hiddenDestination: true, candidateDepots: 5, timeScale: 1, distanceScale: 1, penaltyScale: 1 }),
  Object.freeze({ id: "rough-road-bonus", stops: 1, fragile: false, preferredRoadClasses: ["rough-shortcut", "forest-trail"], timeScale: 1.05, distanceScale: 0.9, penaltyScale: 1.1 }),
  Object.freeze({ id: "cross-region", stops: 1, fragile: false, minimumDistance: 8000, timeScale: 1.2, distanceScale: 1.15, penaltyScale: 1 }),
  Object.freeze({ id: "multi-stop", stops: 3, fragile: false, timeScale: 1.35, distanceScale: 1.25, penaltyScale: 1 })
]);

export function createLongHaulDeliveryContractCatalogKit(N, options = {}) {
  const ContractCatalogState = N.defineResource("long-haul.delivery-contract-catalog.state");
  const RegisterContractType = N.defineEvent("long-haul.delivery-contract-catalog.register.request");
  const initial = Object.fromEntries((options.contractTypes ?? DEFAULT_DELIVERY_CONTRACT_TYPES).map((entry) => [entry.id, clone(entry)]));
  const kit = N.defineDomainServiceKit({
    id: "long-haul-delivery-contract-catalog-kit",
    domain: "long-haul-delivery-contract-catalog",
    apiName: "longHaulDeliveryContracts",
    services: ["contract-type-catalog", "job-policy"],
    stability: "game-stable",
    version: "3.0.0",
    resources: { ContractCatalogState },
    events: { RegisterContractType },
    systems: [{ phase: "resolve", name: "longHaulDeliveryContractCatalogSystem", system(world) {
      let state = world.getResource(ContractCatalogState);
      for (const request of world.readEvents(RegisterContractType)) {
        const id = String(request.id ?? "").trim();
        if (id) state = { ...state, [id]: clone({ ...request, id }) };
      }
      world.setResource(ContractCatalogState, state);
    }}],
    initWorld({ world }) { world.setResource(ContractCatalogState, clone(initial)); },
    createApi({ world }) {
      const read = () => world.getResource(ContractCatalogState) ?? {};
      return {
        get: (id) => clone(read()[String(id)] ?? null),
        list: () => Object.values(read()).sort((a, b) => a.id.localeCompare(b.id)).map(clone),
        register(value) { world.emit(RegisterContractType, clone(value)); return clone(value); },
        snapshot: () => clone(read()),
        reset() { world.setResource(ContractCatalogState, clone(initial)); return clone(initial); }
      };
    }
  });
  return Object.freeze({ kit, resources: Object.freeze({ ContractCatalogState }) });
}
