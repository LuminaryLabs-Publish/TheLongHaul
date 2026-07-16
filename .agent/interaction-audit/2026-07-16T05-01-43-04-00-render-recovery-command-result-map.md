# Interaction audit: render recovery command/result map

**Timestamp:** `2026-07-16T05-01-43-04-00`

## Summary

Renderer loss is currently outside the game's command/result model. Browser context events, route state, held input, recovery UI and first-frame proof need one explicit transaction.

## Plan ledger

**Goal:** convert browser context evidence into typed admission, policy, recovery and visible-settlement results.

- [x] Identify current browser listeners and RAF callbacks.
- [x] Define the missing command/result envelopes.
- [x] Define stale-generation and duplicate-event handling.
- [ ] Implement and execute interaction fixtures.

## Command/result map

```txt
webglcontextlost evidence
  -> ContextLossEvidence
  -> RenderRecoveryAdmissionCommand
  -> RenderLossResult
  -> InputLossPolicyResult
  -> SimulationLossPolicyResult
  -> RenderRecoveryAttemptCommand
  -> RenderRecoveryResult | RenderFallbackResult
  -> FirstRecoveredFrameAck
```

## Required command fields

```txt
documentGeneration
routeGeneration
runtimeGeneration
rendererGeneration
contextGeneration
resourceManifestRevision
worldRevision
activeCellRevision
frameRevision
lossEventId
attempt
startedAt
deadline
```

## Required result fields

```txt
accepted
reason
retiredRendererGeneration
activeRendererGeneration
simulationPolicy
inputPolicy
resourceResults
activeCellResults
failedResourceIds
fallbackAction
presentedFrameRevision
settledAt
```

## Event rules

- Call `preventDefault()` only through the owned loss-admission path when restoration is intended.
- Deduplicate repeated loss callbacks for the same context generation.
- Ignore restoration evidence for retired document/runtime generations.
- Clear or neutralize held driving actions before any invisible simulation interval.
- Reject RAF, resize and world-provider callbacks targeting retired renderer generations.
- Do not treat `webglcontextrestored` as readiness; require reconstruction and one presented frame.
- Give failure an accessible non-WebGL retry/reload action.

## Boundary

No event listener, command, result, focus action, input policy or recovery UI was implemented.