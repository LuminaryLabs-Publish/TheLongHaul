# Known gaps

**Timestamp:** `2026-07-16T14-01-02-04-00`

## Intent

Track where installed policy state and accepted gameplay state can diverge.

## Product-policy generation

- No `ProductPolicyGeneration` or digest exists.
- World, road, terrain, truck, and delivery policy revisions are not admitted atomically.
- Policy configuration events do not publish typed accepted/rejected results.
- No validation checks cross-policy references such as delivery road-class preferences.
- No stale or mixed-policy rejection exists.
- Course, run, cell, provider, cache, save, and frame identity omit policy revisions.

## World profile adoption

- `playableRadius`, `boundaryFadeWidth`, macro-sector size, gameplay-cell size, active radius, horizon bounds, quadtree depth, curve distances, visual radius, and atlas targets are installed but not consumed by the playable world.
- `CELL_SIZE`, `ACTIVE_RADIUS`, camera far distance, course radial limits, and streamed-cell policy remain independent constants.
- The current course generator remains a compact five-branch course rather than the declared 22 km disk/atlas policy.
- No boundary fade, macro-sector, quadtree, settlement atlas, or road-atlas consumer exists.

## Road-class catalog adoption

- Course generation still uses `BRANCH_PROFILES` and literal trunk/link profiles.
- Width, grip, grade limit, curvature, and jump weights are not resolved from the catalog.
- Road records do not carry a catalog revision or exact class snapshot.
- Unknown road-class IDs are not rejected by a shared admission result.
- The terrain and truck systems do not agree on one road-class grip policy.

## Terrain and jump policy adoption

- Terrain noise uses hardcoded broad, medium, and detail frequencies/amplitudes.
- Hill, ridge, and valley density values are not consumed.
- Road cross-section flatten and longitudinal smoothing are not consumed.
- Jump profiles are registered but no generated road/cell emits typed jump instances from them.
- Terrain segment count, vegetation density, grass count, and rock placement remain hardcoded.
- No terrain-policy revision is bound to cell/cache identity.

## Truck dynamics adoption

- `createLongHaulProductKits()` passes a dynamics-profile resource to the truck factory.
- `createLongHaulTruckKit()` accepts only `N`, so that second argument is ignored.
- Maximum speed, reverse speed, acceleration, braking, drag, rolling resistance, steering response, steering angle, wheelbase, grip response, boost, and body roll remain hardcoded.
- Suspension and air-control profile fields have no runtime consumer.
- No default-profile parity or modified-profile behavior fixture exists.

## Delivery-contract adoption

- The catalog defines seven contract types, but delivery state has no `contractTypeId` or contract revision.
- Fragile, express, lost-manifest, rough-road bonus, cross-region, and multi-stop rules are not evaluated.
- Delivery checks remain one candidate depot versus one valid depot.
- Time, distance, penalty, road-class, stop, and cargo-damage requirements are not derived from the contract.
- No contract-selection loop or typed contract result exists.

## API settlement semantics

- Policy `configure()` and `register()` methods emit events and immediately return current state before the resolve phase processes the request.
- No request ID, expected revision, accepted result, rejected result, or duplicate classification exists.
- Callers cannot prove which tick accepted a configuration.
- Snapshots do not include a shared policy digest.

## Rendering and visible proof

- Three.js world geometry does not cite an accepted world/road/terrain policy generation.
- Truck presentation does not cite a dynamics-profile generation.
- HUD, map, results, and audio do not cite a contract/policy generation.
- No `FirstPolicyBoundRunAck` exists.
- No `FirstPolicyBoundFrameAck` exists.
- A policy resource may change while derived world/truck/delivery state remains from an older configuration.

## Validation and deployment

- Current smoke tests do not prove policy adoption.
- No fixture changes each policy and verifies a semantic runtime effect.
- No mixed-generation or stale-cache fixture exists.
- No source/build/Pages policy-convergence fixture exists.
- No deployment receipt identifies the accepted policy digest.

## Retained gaps

The browser-focus held-input retirement gap remains current: held and one-shot browser input is not retired on blur, hidden visibility, pagehide, freeze, route retirement, or run retirement. Earlier WebGL recovery, accessibility, host-clock, audio, generation scheduling, motion preference, pause, delivery settlement, and rollback gaps remain preserved in prior timestamped audit families.

## Completion boundary

Do not claim policy-driven world scale, terrain, roads, truck handling, contracts, cache correctness, frame convergence, or deployment parity until every run is bound to one admitted policy digest, every consumer reads that generation, stale derived work is rejected, and executable fixtures prove default and modified policies across source, artifact, and Pages.