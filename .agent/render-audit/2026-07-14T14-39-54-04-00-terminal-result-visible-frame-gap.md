# Render audit: terminal result visible-frame gap

**Timestamp:** `2026-07-14T14-39-54-04-00`

## Current path

```txt
engine tick settles mutable run and delivery resources
  -> handleRunOutcome reads both
  -> transition complete
  -> showResults mutates DOM
  -> renderer renders the Three.js scene later in the same RAF callback
```

## Gap

The result DOM, Core Scene transition and WebGL frame are not bound to one immutable outcome or one renderer frame identity. `showResults()` can also write best-score storage before any frame proves that the accepted result was visibly presented.

Missing evidence:

```txt
OutcomeId
ResultSceneRevision
DomProjectionRevision
RendererFrameId
visible score fingerprint
best-score write authorization
FirstTerminalResultFrameAck
```

## Required frame contract

```txt
accepted RunOutcomeArtifact
  -> prepare results-scene candidate
  -> prepare DOM projection from the same artifact
  -> submit renderer frame
  -> verify visible score fingerprint
  -> publish FirstTerminalResultFrameAck
  -> authorize terminal presentation completion
```

## Rendering boundary

The audit does not claim the current results screen is visually wrong. It identifies missing identity and acknowledgement between terminal truth and the first frame that displays it.

## Validation needed

```txt
correct-delivery screenshot fixture
same-step conflict screenshot fixture
result DOM readback
renderer frame identity readback
score fingerprint comparison
source/build/Pages visual parity
```