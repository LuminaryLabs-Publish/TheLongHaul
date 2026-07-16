# START HERE: The Long Haul Core capability adoption parity

**Last updated:** `2026-07-16T07-39-04-04-00`  
**Repository:** `LuminaryLabs-Publish/TheLongHaul`  
**Branch:** `main`  
**Reviewed pre-audit repository head:** `5367c558a8e77164631c62747f9e7bd1e0aa9ca5`  
**Status:** `core-capability-adoption-parity-authority-audited`

## Summary

TheLongHaul was selected because it was the only eligible Publish repository ahead of its central documented head. Three commits added `src/long-haul-core.mjs`, `core-integration.html`, and README ownership claims.

The new Core profile proves named random streams, package digests, bounded meters, camera descriptors, instance-batch release, patch prefetch, and transaction idempotency in a separate smoke engine. The playable `index.html` does not import that profile, remains on a different Nexus Engine revision, and retains parallel owners for the same responsibilities.

## Plan ledger

**Goal:** make one accepted Core capability profile authoritative across the playable game, smoke, state migration, artifacts, Pages, and the first matching gameplay frame.

- [x] Compare all 11 accessible Publish repositories with central tracking.
- [x] Exclude `LuminaryLabs-Publish/TheCavalryOfRome`.
- [x] Compare all ten eligible documented heads with `main`.
- [x] Select only TheLongHaul as the sole runtime-ahead repository.
- [x] Inspect the new Core profile, smoke, playable host, README, and retained audits.
- [x] Identify all domains, kits, controllers, adapters, and services.
- [x] Add the timestamped Core adoption audit family.
- [x] Keep runtime and deployment unchanged.
- [ ] Pin one Nexus Engine provider revision for both entry points.
- [ ] Admit one Core capability manifest in the playable host.
- [ ] Migrate or retire parallel truth owners.
- [ ] Execute playable/smoke, artifact, and Pages parity fixtures.

## Main finding

```txt
new Core profile: present
browser Core smoke: present
playable import of profile: absent
shared Nexus Engine pin: absent
shared RNG owner: absent
shared course-package admission: absent
shared meter schema: absent
shared camera descriptor owner: absent
shared instance-batch owner: absent
shared patch-preparation owner: absent
shared transaction ledger: absent
state migration result: absent
smoke/playable parity result: absent
FirstCoreBoundPlayableFrameAck: absent
```

Concrete divergence:

```txt
playable provider: c5548de504072bf09eb68986b98aca0292903803
smoke provider:    b941c9b2995e3449c6987908657753e2cf2df242
playable time limit: 360 seconds
Core smoke time limit: 300 seconds
playable meters: fuel, truck, cargo
Core meters: fuel, truck-condition, cargo-condition, remaining-time
```

## Required authority

`the-long-haul-core-capability-adoption-parity-authority-domain`

```txt
CoreCapabilityAdmissionCommand
  -> bind playable, smoke, provider, profile, schema,
     RNG, meter, camera, batch, patch, ledger,
     artifact, deployment, and frame revisions
  -> resolve one CoreCapabilityAdoptionManifest
  -> classify each capability as authoritative, bridge, proof-only, or retired
  -> reject duplicate or incompatible truth owners
  -> stage migration and initialize the playable profile
  -> run shared smoke/playable semantic fixtures
  -> publish CoreCapabilityAdoptionResult
  -> publish FirstCoreBoundPlayableFrameAck
```

## Census

```txt
playable engine kits: 10
Core World providers: 2
browser/product adapters: 7
isolated Core profile kits: 5
standalone Core controller: 1
browser proof adapters: 1
deployment adapters: 1
total source-backed surfaces: 27
product render surfaces: 3
planned adoption surfaces: 20
```

## Read this run first

1. `current-audit.md`
2. `known-gaps.md`
3. `trackers/2026-07-16T07-39-04-04-00/project-breakdown.md`
4. `architecture-audit/2026-07-16T07-39-04-04-00-core-capability-adoption-dsk-map.md`
5. `core-adoption-audit/2026-07-16T07-39-04-04-00-playable-smoke-parity-contract.md`
6. `gameplay-audit/2026-07-16T07-39-04-04-00-dual-core-gameplay-truth-loop.md`
7. `interaction-audit/2026-07-16T07-39-04-04-00-core-adoption-command-result-map.md`
8. `render-audit/2026-07-16T07-39-04-04-00-core-descriptor-visible-frame-gap.md`
9. `deploy-audit/2026-07-16T07-39-04-04-00-core-profile-release-parity-gate.md`
10. `central-sync-audit/2026-07-16T07-39-04-04-00-runtime-ahead-core-adoption-reconciliation.md`
11. `turn-ledger/2026-07-16T07-39-04-04-00.md`
12. `next-steps.md`
13. `validation.md`

## Retained audits

WebGL recovery, accessibility, input-action convergence, host clock, browser audio lifecycle, generation scheduling, motion preference, pause suspension, delivery settlement, and course-generation rollback remain valid in their timestamped audit families.

## Next safe ledge

Publish one immutable capability manifest and pin one Nexus Engine revision before changing gameplay ownership. Adopt Core Data course/RNG services first, then meters, camera, batches, patches, and transaction receipts with explicit migration and parity proof.