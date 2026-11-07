# Road V3 world/driving-surface contract

**State:** Candidate only. V2 remains the default gameplay/recording generator.

## Targeted source updates

- World road queries resolve V3 road edges using position, elevation and graph progress continuity. An outdated route hint must not select the wrong bridge level.
- Natural terrain and modified terrain have separate V3 behavior. Roadbed blend now converges to ground-level pavement at its centre and to natural terrain outside its shoulder. Overpasses do not flatten the lower ground to the upper deck.
- The existing 160m World cell descriptor consumes V3 drivable road samples with finite `laneFactor=3`, and assigns upper/lower road mesh segments to their actual spatial owner cells. The pre-existing V2 and legacy paths are unchanged.
- V3 ground queries reuse the existing road spatial index with a bounded search window rather than scanning every edge in the graph.
- The existing freight journey service accepts an explicitly supplied V3 Road graph, derives distance by 3D projection, and locates physical pickup/receiver gates along the graph. A missing or insufficient lookahead graph is rejected; legacy V1/V2 journeys remain unchanged. This is a **contract-level consumer** and is not connected to the live WebGL host.

## Regression evidence

- `node tests/road-v3-world-regression.mjs`: 25 seeded overpass cases, tests for two vertical levels, stale route hint, local roadbed, unchanged terrain outside the road, multi-cell ownership and finite terrain samples.
- `node tests/road-v3-stream-regression.mjs`: 30 seeded worlds, 16 mountains per seed; deterministic streaming and reload.
- `node tests/road-v3-journey-regression.mjs --full`: 600 simulation seconds against the existing NexusEngine Truck Kit; 6.5 km physical progress, zero off-road simulation ticks. This is **not** the WebGL game.
- `node tests/road-v3-freight-regression.mjs`: one V3 graph-based cargo pickup, one paid delivery, checkpoint restore, rejection of insufficient road lookahead, and preserved V2 default.
- Existing terrain-clearance, environment-contract, freight-score and V2 freight journey regressions pass. The recovered-source full `npm test` also passed before the last isolated freight changes; rerun exact-head validation after promotion.

## Remaining release gates

**Not yet complete:** real V3 Endless host integration, live V3 freight/traffic/camera host adoption, 100 GLB bytes and runtime loading, validated bridge/support/tunnel meshes and collision, genuine browser gameplay, save/resume acceptance, hardware measurements, 600-second gameplay MP4, and 60-second social edit.

Local Chromium navigation is denied (`net::ERR_BLOCKED_BY_ADMINISTRATOR`). Do not use the simulation trace as gameplay footage, enable V3 by default, or close the parent outcome without authentic visual and user-journey acceptance.
