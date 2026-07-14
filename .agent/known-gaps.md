# Known gaps

## Terminal outcome authority

- Delivery acceptance constructs `runResult` before the current engine step finishes.
- Accepted delivery implicitly wins over same-step collision, impact, failure and timeout through system order.
- Terminal precedence is not declared, versioned or tested.
- Same-step penalties, damage and resource changes can be absent from the score.
- Terminal proposals have no RunId, StepId, proposal ID or conflict classification.
- Duplicate, stale and predecessor-generation terminal work is not explicitly rejected.
- The run result has no immutable ResultId, policy revision or content fingerprint.
- There is no bounded outcome journal.

## Score and persistence

- The score formula is code-only and has no policy version.
- Best-score persistence is an unversioned localStorage document.
- Best-score writes silently ignore parse, quota and storage failures.
- Stored best score does not retain the complete accepted outcome artifact.
- Persistence has no expected-base revision, readback or write receipt.

## Interaction and retry

- Results presentation is driven by mutable delivery and simulation resources rather than one accepted outcome artifact.
- Results transition and DOM projection have no matching renderer-frame acknowledgement.
- Same-seed retry uses `Date.now()` for identity and consumes the retry immediately.
- Retry does not cite an immutable predecessor outcome or preserve explicit lineage.
- Late predecessor events have no terminal-generation rejection rule.

## Course generation authority

- Generation has no attempt ID or supersession policy.
- The predecessor world is cleared before the candidate is validated.
- Route, delivery, Core World, hazards, vehicle, render and DOM state are mutated live during preparation.
- Final validation happens after the candidate has become partially live.
- Failure has no atomic rollback or predecessor restoration.

## Domains, kits and services

- Ten engine kits are composed, but terminal settlement is split implicitly between Delivery, Simulation, Resource Pressure and the browser host.
- Host code captures score metrics and directly coordinates transitions, result UI and storage.
- World provider snapshots record active cell IDs but `restoreSnapshot()` is empty.
- Candidate ownership and disposal are not revisioned across engine and Three.js resources.
- The single `index.html` combines simulation, generation, rendering, UI, audio, storage and lifecycle code.

## Rendering and presentation

- No first terminal-result frame binds outcome, results scene, DOM and renderer revisions.
- The renderer continues across title, generation, pause, results, loss and settings without a route-level lifecycle receipt.
- Shared geometry and material lifetime is process-wide and not represented in a resource manifest.
- Context-loss and renderer-recovery behavior is undocumented and untested.

## Validation and deployment

- No package manifest or executable validation command exists.
- No syntax, unit, deterministic terminal, headless or browser fixtures exist.
- No same-step terminal conflict test exists.
- No result-persistence or retry-lineage fixture exists.
- No artifact allowlist prevents unrelated root files from being published.
- No source, artifact or Pages fingerprint parity result exists.
- No live Pages smoke was recorded for this audit.

## Governance

- No automated check rejects runtime changes that leave `.agent/kit-registry.json` or the central ledger stale.
- Planned authority surfaces remain documentation until backed by source and executable proof.