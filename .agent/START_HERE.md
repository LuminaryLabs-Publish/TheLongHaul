# START HERE: The Long Haul product-policy adoption audit

**Last updated:** `2026-07-16T14-01-02-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed pre-audit repository head:** `b224a9c181635ee43434900b7f6e48199535f7e9`  
**Previous documented repository head:** `dbd276e894cf3960d0305cfe46bab95ef01d4253`  
**Status:** `product-policy-runtime-adoption-authority-audited`

## Summary

Six new runtime commits added five stable product-policy DSKs and reorganized the product composition into semantic world, truck, delivery, and run groups. The new resources are installed in the playable engine, but most runtime consumers still use hardcoded constants and do not read the new policy state.

The focused gap is exact policy adoption. World scale, road classes, terrain fields and jumps, truck dynamics, and delivery contract types now exist as authoritative-looking resources, yet course generation, cell generation, truck simulation, delivery evaluation, streaming, and presentation do not share one admitted policy generation.

## Intent

Make one validated product-policy generation authoritative for course construction, world streaming, terrain, roads, truck simulation, delivery rules, snapshots, and visible proof.

## What needs to happen

```txt
policy DSKs configure/register
  -> validate references and values
  -> compute one ProductPolicyGeneration + digest
  -> bind generation into course/run/cell/cache identity
  -> make every consumer read the accepted snapshot
  -> reject mixed or stale revisions
  -> publish ProductPolicyAdmissionResult
  -> publish FirstPolicyBoundRunAck
  -> publish FirstPolicyBoundFrameAck
```

## Checklist

- [x] Compare the full 11-repository Publish inventory with central tracking.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Confirm all ten eligible repositories have central ledgers and root `.agent` state.
- [x] Select only TheLongHaul for its material six-commit product-domain expansion.
- [x] Inspect all six changed files and the existing course, terrain, truck, delivery, bootstrap, and frame paths.
- [x] Identify the complete interaction loop, domains, kits, adapters, controllers, providers, and services.
- [x] Add the timestamped product-policy audit family.
- [x] Keep runtime, tests, workflow, and deployment unchanged.
- [ ] Implement policy generation/admission and exact consumer adoption.
- [ ] Add executable source/runtime/browser fixtures proving configured values affect the accepted run.

## Main finding

```txt
new installed state                 current runtime consumer
------------------                  ------------------------
world profile                       fixed CELL_SIZE/ACTIVE_RADIUS and small course bounds
road-class catalog                  BRANCH_PROFILES and literal widths/roughness
terrain policy + jump profiles      hardcoded terrain noise and no jump-profile consumption
truck dynamics profile              truck kit ignores supplied profile resource and hardcodes dynamics
delivery contract catalog           delivery kit supports only one valid depot check
```

The policy APIs are real DSK resources and events, but installation is not equivalent to adoption. A configuration change can be accepted by a policy kit without changing the generated course, terrain, truck handling, delivery loop, or presented frame.

## Current implementation census

```txt
engine-installed kits:              18
Core World effect providers:         1
standalone controllers:              1
browser/product adapters:            9
proof and workflow adapters:         3
total source-backed surfaces:       32
render surfaces:                     3
new policy DSKs:                     5
planned policy-adoption surfaces:   18
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-16T14-01-02-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-16T14-01-02-04-00-product-policy-adoption-dsk-map.md`
5. `product-policy-audit/2026-07-16T14-01-02-04-00-domain-policy-consumption-contract.md`
6. `gameplay-audit/2026-07-16T14-01-02-04-00-configured-but-hardcoded-driving-loop.md`
7. `interaction-audit/2026-07-16T14-01-02-04-00-policy-admission-command-result-map.md`
8. `render-audit/2026-07-16T14-01-02-04-00-policy-state-visible-world-gap.md`
9. `deploy-audit/2026-07-16T14-01-02-04-00-product-policy-source-runtime-fixture-gate.md`
10. `central-sync-audit/2026-07-16T14-01-02-04-00-runtime-ahead-product-policy-reconciliation.md`
11. `turn-ledger/2026-07-16T14-01-02-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

The prior browser-focus input-retirement audit remains unresolved and preserved. Earlier Core adoption, WebGL recovery, accessibility, host-clock, audio, generation scheduling, motion preference, pause, delivery settlement, and rollback audits remain in their timestamped families.

## Next safe ledge

Do not tune the new profile values yet. First bind one immutable policy snapshot and digest into run creation, then adapt one consumer at a time: truck dynamics, course/road generation, terrain/cells, delivery contracts, and world/horizon streaming.