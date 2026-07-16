# Interaction audit: accessibility command and result map

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Summary

Route changes, gameplay events and visual frames currently mutate DOM attributes and text directly. This audit defines the missing command/result chain that must bind accepted state, focus, announcements and the first matching visible frame.

## Plan ledger

**Goal:** require one typed result for every semantic route, focus, announcement and canvas-alternative change.

- [x] Trace title, help, settings, generation, driving, pause, results and loss routes.
- [x] Trace toasts, interaction prompts, progress and terminal outcomes.
- [x] Define commands, results, rejection classes and acknowledgements.
- [ ] Implement and execute the command/result chain.

## Command map

### AccessibilityProjectionCommand

```txt
inputs:
  documentGeneration
  routeRevision
  runGeneration
  simulationRevision
  vehicleRevision
  deliveryRevision
  conditionRevision
  mapRevision
  focusRevision
  visibleFrameRevision
  accessibilityPolicyRevision

results:
  AccessibilityProjectionAccepted
  AccessibilityProjectionAcceptedNoChange
  AccessibilityProjectionRejectedStale
  AccessibilityProjectionRejectedDuplicate
  AccessibilityProjectionRejectedRetired
  AccessibilityProjectionFailed
```

### RouteFocusCommand

```txt
inputs:
  routeRevision
  overlayGeneration
  invokerIdentity
  requestedFocusTarget

results:
  RouteFocusAccepted
  RouteFocusRestored
  RouteFocusRejectedMissingTarget
  RouteFocusRejectedStaleRoute
  RouteFocusRetired
```

### AnnouncementAdmissionCommand

```txt
inputs:
  semanticEventId
  eventKind
  eventRevision
  priority
  deduplicationKey
  messageDescriptor

results:
  AnnouncementAccepted
  AnnouncementCoalesced
  AnnouncementSuppressedInsignificant
  AnnouncementRejectedDuplicate
  AnnouncementRejectedStale
  AnnouncementRetired
```

### CanvasAlternativeCommand

```txt
inputs:
  surfaceIdentity
  runRevision
  mapRevision
  visibleFrameRevision

results:
  CanvasAlternativeAccepted
  CanvasAlternativeAcceptedNoChange
  CanvasAlternativeRejectedStale
  CanvasAlternativeRetired
```

## Current direct mutation paths

```txt
updateSceneUi -> classList only
updateGeneratingUi -> percent/phase text and classes
updateHud -> frame-rate text mutations under one live region
toast -> text/class mutation
updateMapPanel -> open class and aria-hidden
showResults -> innerHTML replacement
loss handling -> result text replacement
```

None publishes an `AccessibilityProjectionResult`, focus receipt, announcement receipt or first accessible-frame acknowledgement.

## Required acknowledgements

```txt
FirstAccessibleRouteFrameAck
FirstVisualAccessibleConvergenceAck
FirstGenerationProgressSemanticAck
FirstInteractionAffordanceAnnouncementAck
FirstTerminalOutcomeAnnouncementAck
```

## Lifecycle rules

```txt
route retirement cancels pending focus and announcement work
retry/new course invalidates predecessor run events
closing overlays restores focus only to a still-valid invoker
duplicate penalties or prompts do not announce twice
continuous telemetry uses thresholds and cadence, not event-per-frame
late semantic projections cannot overwrite a newer route
```

Documentation only. No interaction or accessibility behavior changed.