# Next steps

**Timestamp:** `2026-07-16T07-39-04-04-00`

## Plan ledger

**Goal:** move the promoted Core capabilities from an isolated proof engine into the playable game through one explicit profile, migration, and parity sequence.

- [ ] Pin one Nexus Engine revision for `index.html` and `core-integration.html`.
- [ ] Publish a versioned `CoreCapabilityAdoptionManifest` with a stable digest.
- [ ] Classify each new Core capability as `authoritative`, `bridge`, `proof-only`, or `retired`.
- [ ] Import the accepted Core profile into the playable bootstrap.
- [ ] Admit and verify one course envelope before world construction.
- [ ] Replace inline generation randomness with named streams.
- [ ] Snapshot and restore stream cursors for retry and replay.
- [ ] Choose one canonical meter schema for fuel, truck, cargo, and remaining time.
- [ ] Resolve the current 360-second playable and 300-second smoke difference explicitly.
- [ ] Add an atomic migration from custom run/Resource Pressure state to the accepted meter schema.
- [ ] Bridge Core Camera descriptors to the Three.js camera.
- [ ] Prohibit host-only camera mutations after the bridge becomes authoritative.
- [ ] Bridge Core Graphics batch descriptors to Three.js instances.
- [ ] Consume cell release receipts exactly once.
- [ ] Bridge patch-preparation ready results to Core World provider activation.
- [ ] Preserve existing streamed-world behavior during adoption.
- [ ] Move depot checks, penalties, recovery, and terminal operations to stable transaction IDs.
- [ ] Migrate or retire the custom penalty ledger and duplicate flags.
- [ ] Reject simultaneous mutation by legacy and adopted truth owners.
- [ ] Run the seven Core checks inside both smoke and playable contexts.
- [ ] Run a full same-seed gameplay equivalence fixture.
- [ ] Publish `CoreCapabilityAdoptionResult`.
- [ ] Present and publish `FirstCoreBoundPlayableFrameAck`.
- [ ] Compare source, root Pages artifact, and deployed Pages evidence.

## Ordered implementation

### 1. Provider and manifest

Use one pinned Nexus Engine revision and one immutable capability manifest. Include profile module digest, course schema, random streams, meter schema, camera controller, instance batches, patch policy, transaction schema, and consumer map.

### 2. Course and randomness

Adopt Core Data first because generation precedes every other gameplay subsystem. Verify the course package before world creation and move each deterministic concern to its named stream.

### 3. Gameplay state migration

Choose canonical meter IDs and values. Migrate the active run, condition values, remaining time, penalty records, recovery state, and delivery operation IDs atomically at a safe route boundary.

### 4. Presentation bridges

Keep Three.js renderer ownership in the product adapter. Feed it accepted Core Camera descriptors and Core Graphics instance-batch deltas, and bind visible cells to accepted patch/Core World revisions.

### 5. Idempotent settlement

Assign stable transaction IDs to depot checks, wrong-depot penalties, collisions, recovery, and terminal delivery. Retire parallel duplicate logic after equivalence proof.

### 6. Parity and retirement

Execute the same semantic fixtures in smoke and playable contexts. Retire legacy owners only when the accepted profile has matching canonical snapshots and a Core-bound gameplay frame.

### 7. Release proof

Repeat parity against source, uploaded artifact, and deployed Pages. Fail release admission on provider, profile, semantic, or frame divergence.

## Retained work

WebGL recovery, accessibility, input-action convergence, host clock, audio lifecycle, generation scheduling, motion preference, pause suspension, delivery settlement, and generation rollback remain open in their timestamped audit families.