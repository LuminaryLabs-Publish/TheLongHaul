# Deploy audit: infinite-sector browser fixture gate

**Timestamp:** `2026-07-16T19-39-24-04-00`

## Goal

Block populated-infinite-world and release-parity claims until source, artifact and Pages runs prove the same atlas-backed distant cells.

## Current executable proof

`npm test` runs:

```txt
node tests/atomic-domain-kits-smoke.mjs
node tests/long-haul-game-smoke.mjs
node tests/static-shell-smoke.mjs
```

The new source tests prove:

- the default profile is infinite;
- playable radius is `null`;
- distant macro sectors remain valid;
- distant terrain values remain finite and deterministic;
- adjacent distant gameplay cells share terrain-edge heights.

They do not prove that atlas roads, settlements or portals are consumed by the playable provider or rendered frame.

## Required source fixtures

- Profile/package extent digest agreement.
- Exact sector generation for positive and negative distant coordinates.
- Gameplay-cell overlap across one, two and four macro sectors.
- Deterministic atlas road connection through paired portals.
- Deterministic settlement ownership across gameplay cells.
- Course/atlas overlap precedence.
- Matching patch cache keys and stale-generation rejection.
- Horizon policy consumption or explicit proof-only classification.

## Required browser fixtures

```txt
launch a deterministic seed
  -> drive beyond finite course bounds
  -> cross multiple gameplay cells and macro sectors
  -> observe continuous terrain edges
  -> observe accepted atlas road/settlement content
  -> verify surface query follows the visible atlas road
  -> verify map and WebGL reference the same content digest
  -> capture FirstAtlasBoundWorldFrameAck
```

Required device coverage:

- Chromium desktop with WebGL.
- Firefox desktop.
- Safari/WebKit where available.
- DPR 1 and high-DPR viewport.
- Reduced-motion and normal-motion settings.

## Required artifact gate

- Build/package artifact is produced from the reviewed commit.
- Artifact file hashes are recorded.
- The same deterministic seed/sector fixture runs from the artifact.
- Sector, cell and content digests match source execution.
- The first atlas-bound frame acknowledgement matches.

## Required Pages gate

- Deployed Pages commit identity matches the reviewed release.
- No stale module cache serves the bounded profile.
- The deterministic far-drive fixture reaches the same sectors.
- WebGL and Canvas2D map projections match the artifact result.
- Network or module failures fail closed rather than silently falling back.

## Current status

```txt
npm test: not run during this audit
atlas-backed source fixture: unavailable
far-drive browser fixture: unavailable
artifact fixture: unavailable
Pages fixture: unavailable
FirstAtlasBoundWorldFrameAck: unavailable
combined commit statuses: none reported
```

## Completion boundary

Passing far-terrain tests is necessary but not sufficient. Deployment readiness requires atlas-backed semantic content and identical source/artifact/Pages receipts.
