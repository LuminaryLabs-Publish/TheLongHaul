# Deploy audit: Core profile release parity gate

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Summary

The repository now publishes two browser entry points with different Nexus Engine pins and different kit compositions. Static deployment can serve both successfully while still presenting a playable game whose Core ownership differs from the smoke and README.

## Plan ledger

**Goal:** prove that source, uploaded Pages artifact, deployed playable entry, and deployed smoke share one accepted Core capability manifest.

- [x] Identify the two public entry points.
- [x] Record their provider revision divergence.
- [x] Define artifact and deployed parity evidence.
- [ ] Pin one accepted provider revision.
- [ ] Publish one profile digest in both entry points.
- [ ] Run deployed semantic parity fixtures.

## Current release graph

```txt
index.html
  -> Three.js 0.165.0
  -> Nexus Engine c5548de504072bf09eb68986b98aca0292903803
  -> playable inline composition

core-integration.html
  -> Nexus Engine b941c9b2995e3449c6987908657753e2cf2df242
  -> src/long-haul-core.mjs
  -> isolated Core smoke composition

README.md
  -> describes promoted Core ownership
```

## Deployment risk

Static Pages deployment does not automatically prove:

```txt
same Nexus Engine revision
same Core profile digest
same course schema
same meter configuration
same random stream manifest
same camera and instance descriptors
same patch policy
same transaction semantics
same gameplay consumers
same first playable frame revision
```

## Required artifact metadata

```txt
long-haul-release-manifest.json
  productRevision
  playableEntryDigest
  smokeEntryDigest
  coreProfileDigest
  nexusEngineProviderRevision
  threeProviderRevision
  courseSchemaId/version
  capabilityManifestDigest
  artifactDigest
```

## Required fixture gate

```txt
source
  -> load playable and smoke
  -> read one capability manifest digest
  -> execute seven shared Core fixtures
  -> run one same-seed gameplay fixture

artifact
  -> repeat from uploaded Pages artifact
  -> compare module and manifest digests

Pages
  -> repeat from deployed origin
  -> verify cache/network requests resolve the accepted provider revision
  -> verify FirstCoreBoundPlayableFrameAck
```

## Failure classifications

```txt
provider-revision-divergence
profile-digest-divergence
missing-playable-adoption
smoke-only-capability
semantic-fixture-divergence
artifact-source-divergence
deployed-artifact-divergence
stale-cache-generation
missing-core-bound-frame
```

## Gate

Pages readiness for the Core integration requires one accepted manifest, passing shared semantic fixtures, and a playable frame bound to that manifest. A green static deployment alone is insufficient.

## Boundary

No workflow or deployment file was changed or executed in this audit.