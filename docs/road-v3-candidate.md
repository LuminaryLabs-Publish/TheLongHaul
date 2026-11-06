# The Long Haul — Road V3 candidate integration

**State:** Candidate only; V2 remains the default driving and freight generator.

## Implemented and tested
- `road-v3-geometry.mjs`: seeded mountain crossing geometry, bridge clearance, and 3D surface sampling.
- `road-v3-journey.mjs`: deterministic twelve-mountain, approximately 28 km graph; road-to-world projection, position-based 160 m streaming descriptors, and 200 m GLB catalog selection.
- `road-v3-kit.mjs`: NexusEngine Domain Service Kit with candidate journey preparation, sampling, 3D location, streaming and scenery-descriptor APIs. Generates no active V2 gameplay changes.
- Reuses the existing road spatial index. No new streaming runtime, physics engine or renderer introduced.

## Validation performed
- Candidate V3 crossing regression: PASS.
- Candidate V3 25 s input-driven NexusEngine truck test: PASS.
- Candidate V3 600 s input-driven NexusEngine truck test: PASS; approximately 6.5 km progress and zero off-road simulation ticks.
- Atomic Domain Service Kit smoke, V2 endless-highway regression and environment tile contract checks: PASS.
- Actual browser/WebGL V3 game playback and 600 s video: BLOCKED (`net::ERR_BLOCKED_BY_ADMINISTRATOR` on local browser navigation).
- Full `npm test` is NOT certified. An unrelated environment-tile renderer suite fails `road paint is separate` on the recovered baseline.
- No actual V3 gameplay recording or 60 s social edit was produced. The media production guide prohibits substituting simulated footage for authentic gameplay.

## Required before a true default V3 cutover
1. Replace the `-position.z` assumption throughout freight, active gameplay, traffic, camera and other dependent systems with graph progress.
2. Implement an unbounded, collision-safe road-growth planner; the current candidate is a bounded demonstration.
3. Integrate terrain-carved drivable road surfaces and bridge/tunnel structures into the authoritative Road and World hosts.
4. Load the 100 external GLB files in the runtime, suppress their illustrative road decks, and verify placement, LOD and unload. Presently only catalog descriptors are emitted.
5. Prove saves/reloads, traffic, freight and crossings in actual game playback.
6. Record a real uninterrupted 600 s WebGL session, inspect the preserved original, select a verified 60 s edit, and obtain publication approval separately.

**Do not switch the default from V2 or claim a finished V3 social video before these gates pass.**
