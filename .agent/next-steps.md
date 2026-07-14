# Next steps

## Plan ledger

**Goal:** keep the current gameplay and domain ownership intact while making procedural generation atomic, recoverable, testable, and visible only after admission.

- [ ] Add `CourseGenerationCommand` with attempt ID, seed, predecessor generation, and expected provider revisions.
- [ ] Move route graph and depot creation into a detached candidate object.
- [ ] Keep candidate route and destination data out of live engine resources until validation succeeds.
- [ ] Prepare terrain, provider descriptors, hazards, and truck spawn under the same candidate generation.
- [ ] Add one complete candidate resource and disposal manifest.
- [ ] Validate exactly five branches, five unique depots, one destination, reachability, bounds, provider order, active cells, hazards, and truck spawn.
- [ ] Render one offscreen probe frame before adding `world-visible`.
- [ ] Atomically adopt delivery, route, world, hazards, truck, scene, and render revisions.
- [ ] Preserve the accepted predecessor until the first admitted course frame is acknowledged.
- [ ] Roll back every candidate participant on failure or supersession.
- [ ] Replace reload-only failure with same-seed retry, new-seed retry, and title actions.
- [ ] Add deterministic same-seed and different-seed course fixtures.
- [ ] Add generation-unit fault injection for route, terrain, provider, hazard, truck, and probe failures.
- [ ] Add browser proof for startup, generation, rollback, driving entry, result, loss, and retry.
- [ ] Add a package manifest with explicit check and test commands.
- [ ] Restrict the Pages artifact to declared product and audit files.
- [ ] Add source-to-Pages fingerprint and live-route smoke evidence.

## Preserve

```txt
existing 10-kit Nexus Engine composition
existing delivery and simulation ownership
five-branch and five-depot game structure
wrong-depot penalty loop
fuel, truck, cargo, hazard, and recovery risk
same-seed and new-seed retry options
Three.js, DOM, Canvas2D, audio, and storage as host adapters
```

## First implementation slice

Introduce a detached `GenerationCandidate` and `CourseGenerationResult` around the existing generation-unit array. Do not restructure Nexus Engine or replace the existing kits.
