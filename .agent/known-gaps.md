# Known gaps

## Course-generation authority

- Generation has no attempt ID or supersession policy.
- The predecessor world is cleared before the candidate is validated.
- Route, delivery, Core World, hazards, vehicle, render, and DOM state are mutated live during preparation.
- The generation-unit array is not a dependency or transaction manifest.
- Unit progress does not include participant revisions or adoption receipts.
- Final validation happens after the candidate has become partially live.
- Failure has no atomic rollback or predecessor restoration.
- Failure exposes reload only, not same-seed retry, new-seed retry, or title recovery.

## Interaction and gameplay

- Generation success and failure use mutable host flags rather than typed terminal results.
- Duplicate, stale, or superseded generation commands are not explicitly rejected.
- Same-seed retry uses a transient `Date.now()` retry ID and consumes it immediately.
- Run completion and score presentation are not bound to a first visible result-frame acknowledgement.
- Best-score persistence is unversioned and silently ignores parse or write failure.

## Domains, kits, and services

- Ten engine kits are composed, but the complete service manifest exists only implicitly in source.
- Course generation remains a large host-owned service outside a dedicated product DSK.
- Host code directly writes engine resources for route, hazards, vehicle, and other participants.
- World provider snapshots record active cell IDs but `restoreSnapshot()` is empty.
- Candidate ownership and disposal are not revisioned across engine and Three.js resources.
- The single `index.html` combines simulation, generation, rendering, UI, audio, storage, and lifecycle code.

## Rendering and presentation

- The WebGL world is revealed before route and world admission completes.
- There is no offscreen generation probe frame.
- No first admitted course-frame acknowledgement binds course, scene, world, and render revisions.
- Startup imports, engine creation, and WebGL renderer creation are top-level and lack a complete application result.
- Shared geometry and material lifetime is process-wide and not represented in a resource manifest.
- Context-loss and renderer-recovery behavior is undocumented and untested.

## Persistence and platform

- Settings and best-score documents have no schema version, migration, readback verification, or typed failure result.
- Audio and browser listeners have no explicit disposal lifecycle.
- No public diagnostics surface exposes the current course, run, provider, or frame revision.

## Validation and deployment

- No package manifest or executable validation command exists.
- No syntax, unit, deterministic generation, headless, or browser fixtures exist.
- No fault-injection test covers generation rollback.
- No artifact allowlist prevents unrelated root files from being published.
- No source, artifact, or Pages fingerprint parity result exists.
- No live Pages smoke was recorded for this audit.

## Governance

- The prior zero-runtime registry became stale as soon as the implementation commit landed.
- No automated check currently rejects runtime changes that leave `.agent/kit-registry.json` or the central ledger stale.
