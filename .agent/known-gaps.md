# Known gaps

## Product identity and intent

- No checked-in product manifest.
- No schema version, accepted intent revision, or intent fingerprint.
- No declared supported route, platform, player-facing loop, completion condition, or explicit non-goals.
- No immutable Nexus Engine provider policy.

## Interaction and gameplay

- No executable boot sequence.
- No menu, generation, run, delivery, result, retry, or shutdown state.
- No input commands or typed results.
- No simulation, time, route, freight, vehicle, depot, discovery, risk, score, or outcome authority.

## Domains, kits, and services

- No Nexus Engine dependency.
- No installed runtime domains.
- No source-backed DSKs, kits, or adapters.
- No capability-token, service-ownership, snapshot, reset, rollback, or disposal contracts.
- Planned audit surfaces are not implementation.

## Rendering and presentation

- No HTML, Canvas2D, WebGL, WebGPU, or native visual surface.
- No renderer, scene, camera, HUD, loading state, or visible-frame evidence.
- A `render-audit/` folder remains inapplicable until a visual surface exists.

## Persistence and platform

- No save schema, migration, audio, storage, networking, or platform adapter.
- No host lifecycle or public runtime contract.

## Validation and deployment

- No package or build manifest.
- No syntax, unit, headless, browser, build, artifact, or deployment command.
- No workflow, Pages configuration, deployed route, or source-to-artifact parity evidence.

## Governance

- Product ideas discussed outside the repository are not source truth.
- No automated guard currently rejects runtime commits that omit the product manifest or kit/service inventory.
- No implementation-admission result can yet distinguish documentation-only, incomplete, stale, and executable states.