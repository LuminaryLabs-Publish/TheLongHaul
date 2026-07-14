# Next steps

## Plan ledger

**Goal:** keep the existing gameplay and kit ownership intact while making terminal delivery, failure, scoring, persistence, presentation and retry one deterministic settlement transaction.

- [ ] Add `RunId`, `StepId`, `TerminalProposalId` and immutable policy revision fields.
- [ ] Collect accepted-delivery, timeout, collision, impact and explicit-failure proposals before terminal mutation.
- [ ] Define and document one precedence policy for conflicting proposals in the same step.
- [ ] Reject duplicate, stale and predecessor-generation proposals.
- [ ] Apply resource pressure and penalty effects before final metric capture.
- [ ] Move `buildRunResult()` behind terminal settlement instead of delivery-check admission.
- [ ] Add `RunOutcomeArtifact` with result ID, seed, route fingerprint, destination, final metrics, score-policy revision and content fingerprint.
- [ ] Store a bounded immutable result journal.
- [ ] Version the score formula and best-score storage document.
- [ ] Return typed persistence receipts for accepted, unchanged, rejected and failed writes.
- [ ] Make results UI consume only an accepted outcome artifact.
- [ ] Add `FirstTerminalResultFrameAck` binding outcome, scene, DOM and renderer frame revisions.
- [ ] Require retry to cite the accepted predecessor outcome and allocate a successor RunId.
- [ ] Preserve predecessor result evidence after same-seed and new-seed retry.
- [ ] Add same-step delivery-plus-impact, delivery-plus-timeout and delivery-plus-failure fixtures.
- [ ] Add duplicate-check, duplicate-persistence and late-predecessor fixtures.
- [ ] Add browser proof for terminal UI, best-score readback, retry lineage and visible-frame convergence.
- [ ] Add a package manifest with explicit check and test commands.
- [ ] Add source, artifact and Pages result-parity evidence.

## Preserve

```txt
existing 10-kit Nexus Engine composition
existing delivery and simulation ownership
five-branch and five-depot structure
wrong-depot penalty loop
fuel, truck, cargo, hazard and recovery risk
same-seed and new-seed retry options
current golf-style score presentation
Three.js, DOM, Canvas2D, audio and storage as host adapters
```

## First implementation slice

Introduce a terminal proposal buffer and `DeliveryTerminalSettlementResult` between the current delivery `simulate` system and simulation `resolve` system. Keep every existing kit, but stop constructing or presenting a score until all terminal proposals and metric effects for that StepId are finalized.