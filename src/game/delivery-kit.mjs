import { clone } from "./shared.mjs";

export function createLongHaulDeliveryKit(N) {
  const DeliveryState = N.defineResource("long-haul.delivery.state");
  const DeliveryLoad = N.defineEvent("long-haul.delivery.load.request");
  const DeliveryCheck = N.defineEvent("long-haul.delivery.check.request");
  const DeliveryReset = N.defineEvent("long-haul.delivery.reset.request");
  const initialDelivery = () => ({ candidateDepotIds: [], validDepotId: null, checkedDepotIds: [], lastCheck: null, delivered: false, sequence: 0 });
  const deliveryKit = N.defineDomainServiceKit({
    id: "long-haul-delivery-kit",
    domain: "long-haul-delivery",
    apiName: "longHaulDelivery",
    services: ["depot-evaluation", "delivery-result"],
    stability: "game-stable",
    version: "2.0.0",
    resources: { DeliveryState },
    events: { DeliveryLoad, DeliveryCheck, DeliveryReset },
    systems: [{
      phase: "resolve",
      name: "longHaulDeliverySystem",
      system(world) {
        let state = world.getResource(DeliveryState);
        for (const request of world.readEvents(DeliveryReset)) state = initialDelivery();
        for (const request of world.readEvents(DeliveryLoad)) state = { ...initialDelivery(), candidateDepotIds: clone(request.candidateDepotIds), validDepotId: String(request.validDepotId), sequence: state.sequence + 1 };
        for (const request of world.readEvents(DeliveryCheck)) {
          const depotId = String(request.depotId);
          if (!state.candidateDepotIds.includes(depotId)) continue;
          const duplicate = state.checkedDepotIds.includes(depotId);
          const accepted = depotId === state.validDepotId;
          const checkedDepotIds = duplicate ? state.checkedDepotIds : [...state.checkedDepotIds, depotId];
          state = {
            ...state,
            checkedDepotIds,
            delivered: state.delivered || accepted,
            lastCheck: { depotId, accepted, rejected: !accepted, duplicate, sequence: state.sequence + 1 },
            sequence: state.sequence + 1
          };
        }
        world.setResource(DeliveryState, state);
      }
    }],
    initWorld({ world }) { world.setResource(DeliveryState, initialDelivery()); },
    createApi({ world }) {
      const get = () => clone(world.getResource(DeliveryState));
      return {
        getState: get,
        load(candidateDepotIds, validDepotId) { world.emit(DeliveryLoad, { candidateDepotIds: clone(candidateDepotIds), validDepotId }); return get(); },
        check(depotId) { world.emit(DeliveryCheck, { depotId }); return get(); },
        reset() { world.emit(DeliveryReset, {}); return get(); },
        snapshot: get,
        loadSnapshot(snapshot = {}) { world.setResource(DeliveryState, { ...initialDelivery(), ...clone(snapshot) }); return get(); }
      };
    }
  });

  return Object.freeze({ kit: deliveryKit, resources: Object.freeze({DeliveryState}) });
}
