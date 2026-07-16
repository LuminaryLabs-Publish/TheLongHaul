# Core adoption audit: playable/smoke parity contract

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Summary

`core-integration.html` proves seven Core behaviors against Nexus Engine `b941c9...`; `index.html` executes the game against `c5548d...` without importing the Core profile. This contract defines when the smoke may be treated as evidence for the playable release.

## Plan ledger

**Goal:** make the Core smoke and playable game consume the same immutable capability profile and report comparable semantic results.

- [x] Inventory smoke checks.
- [x] Map each check to its intended playable consumer.
- [x] Record provider and configuration divergence.
- [x] Define parity receipts and release gates.
- [ ] Share one profile and provider revision.
- [ ] Execute parity in source, artifact, and Pages contexts.

## Smoke-to-playable mapping

| Smoke check | Intended playable consumer | Current adoption |
|---|---|---|
| named random stream replay | course, terrain, vegetation, wildlife, materials, retry | absent |
| course package digest | generation admission and retry package identity | absent |
| resource meter clamp/tick | fuel, truck, cargo, remaining time | absent; parallel states remain |
| portable camera pose | chase camera and camera modes | absent |
| instance release receipt | streamed trees, grass, signs, depot props | absent |
| patch prefetch separation | Core World active/prefetch cell lifecycle | absent |
| transaction apply-once | depot checks, penalties, recovery, terminal settlement | absent |

## Required immutable manifest

```txt
CoreCapabilityAdoptionManifest
  productReleaseRevision
  nexusEngineProviderRevision
  profileModuleDigest
  courseSchemaId and version
  randomAlgorithm and named streams
  resourceMeterSchema and authored values
  cameraController schema
  instanceBatch schema and asset/material mappings
  patchPreparation policy and generator/settings identity
  transactionLedger schema
  playable consumer map
  proof adapter map
  migration policy version
```

## Parity result

```txt
CoreParityVerificationResult
  manifestDigest
  fixtureId
  sourceContextResult
  playableContextResult
  artifactContextResult
  pagesContextResult
  semanticComparison
  divergentFields
  acceptedProfileRevision
  terminalStatus
```

## Mandatory parity fixtures

```txt
1. Named stream snapshot/restore produces the same next values in smoke and playable.
2. One course package produces the same digest and admitted payload in both contexts.
3. Fuel, truck, cargo, and time meter operations produce the same values and thresholds.
4. One camera target produces the same portable descriptor before Three.js projection.
5. One instance cell replacement/removal produces the same release receipt and visible count.
6. One desired patch set produces the same active/prefetch classification.
7. One operation ID executes once and returns the same duplicate classification.
8. A full same-seed run produces the same canonical gameplay snapshot and terminal score.
9. The first playable frame cites the accepted Core profile revision.
```

## Adoption states

```txt
proof-only
  capability exists only in smoke and cannot be claimed by gameplay

bridge
  capability is accepted by Core but translated by a product adapter

authoritative
  all gameplay consumers read the accepted Core result

retired
  legacy owner no longer accepts commands or mutates truth
```

## Release gate

Do not describe Core Data, Core Camera, Core Graphics, Core Transaction Ledger, or Core World patch preparation as owning TheLongHaul gameplay until the manifest classifies them as authoritative or bridged and the parity result passes against the playable entry point.

## Boundary

The new Core module is a useful integration scaffold. The audit does not remove it or question the promoted Nexus Engine capabilities; it prevents proof-only behavior from being mistaken for product adoption.