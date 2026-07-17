# Deploy audit: best-run browser and Pages fixture gate

**Timestamp:** `2026-07-17T17-39-07-04-00`

## Current deployment surface

The game is a static main-branch GitHub Pages product. Best-run state depends on browser local storage and therefore varies by origin, profile, privacy policy and storage availability.

## Missing executable proof

No fixture currently proves:

- first run with no prior record;
- better, equal, worse and incomparable candidates;
- exact-course versus global scope behavior;
- corrupted or incompatible stored data;
- storage denial or quota failure;
- write/readback verification;
- migration from the current reduced `the-long-haul-best-v2` record;
- reset/delete settlement;
- retry and new-course route transitions;
- visible record projection after reload;
- source, built artifact and Pages parity;
- `FirstBestRunBoundFrameAck`.

## Required fixture matrix

**Proposed, not implemented:**

```txt
Node/domain fixtures
  -> comparison classifications
  -> record schema and digest
  -> migration and reset

browser source-origin fixtures
  -> storage absent/present/corrupt/denied
  -> terminal run candidate and readback
  -> reload and visible projection

artifact-origin fixtures
  -> identical schema, comparison and projection digest

GitHub Pages fixtures
  -> same-origin persistence across reload
  -> migration compatibility
  -> matching visible best-run frame
```

## Release gate

Do not claim durable best-run support until one release candidate provides:

```txt
BestRunPolicyResult
BestRunCandidateResult
BestRunCommitResult or classified storage failure
BestRunRestoreResult
BestRunFrameDigest
FirstBestRunBoundFrameAck
source/artifact/Pages parity receipts
```

## Validation status

Documentation only. `npm test`, browser automation, artifact smoke and Pages smoke were not run during this audit.