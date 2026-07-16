# Product-policy audit: domain consumption contract

**Timestamp:** `2026-07-16T14-01-02-04-00`

## Authority

`the-long-haul-product-policy-runtime-adoption-authority-domain`

## Snapshot contract

```txt
ProductPolicySnapshot
  generation
  digest
  worldProfile
  roadClasses
  terrainPolicy
  truckDynamicsProfile
  deliveryContracts
  sourceRevisions
  admittedAtSimulationRevision
```

The snapshot is immutable for an active run. Mutations may be staged for a later run but cannot silently alter an existing run's derived course, cells, truck, or contract state.

## Consumer contract

```txt
Course generation
  worldProfile + roadClasses + terrainPolicy

World/cell generation
  worldProfile + roadClasses + terrainPolicy

Truck simulation
  truckDynamicsProfile + resolved road surface/class

Delivery/run
  delivery contract + course/road/truck/cargo state

Presentation
  policy-bound run/world snapshots only
```

## Identity contract

The policy digest must be included in:

- course package ID and envelope metadata;
- run generation and transaction-ledger metadata;
- course-cell and patch-cache keys;
- Core World provider revision;
- truck/run/delivery snapshots;
- save/replay compatibility metadata;
- diagnostics and first-frame acknowledgements.

## Mutation contract

```txt
request mutation
  -> validate
  -> normalize
  -> accept/reject with exact revision
  -> if no active run: may admit new policy generation
  -> if active run: stage for next run or require explicit restart
```

## Adoption order

1. Truck dynamics profile.
2. World profile and streaming constants.
3. Road classes and course generation.
4. Terrain/jump policy and cell generation.
5. Delivery contracts.
6. Save/replay and deployment receipts.

## Completion proof

A complete implementation must prove:

- default policy preserves intended current behavior;
- each modified policy produces the expected semantic effect;
- repeated seeds remain deterministic under one digest;
- stale/mixed generations are rejected;
- source, CI artifact, and Pages use the same digest;
- first run and first frame acknowledgements converge.

## Boundary

This is a documentation contract only.