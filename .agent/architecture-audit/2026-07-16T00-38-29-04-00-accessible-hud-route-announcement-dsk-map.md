# Architecture audit: accessible HUD, route and announcement DSK map

**Timestamp:** `2026-07-16T00-38-29-04-00`

## Summary

The executable game already has authoritative gameplay, route, render and storage domains, but accessibility semantics are incidental DOM side effects. The required change is one projection authority downstream of accepted state, not a second gameplay owner.

## Plan ledger

**Goal:** define a narrow domain composition that converts accepted game revisions into stable semantic routes, focus, announcements and alternatives.

- [x] Preserve all existing engine kits, providers and adapters.
- [x] Keep Core Scene authoritative for route truth.
- [x] Keep simulation and gameplay kits authoritative for run truth.
- [x] Keep Three.js, Canvas2D and DOM adapters presentation-only.
- [x] Add one accessibility projection parent domain.
- [x] Define 20 coordinating surfaces.
- [ ] Implement and prove the domain.

## Existing domain flow

```txt
browser input
  -> Core Input / direct host commands
  -> Core Scene and gameplay domains
  -> accepted run, route, vehicle, delivery and condition state
  -> DOM, Canvas2D, WebGL and WebAudio adapters
```

## Current semantic gap

```txt
accepted state
  -> ad hoc textContent/class mutations
  -> one rapidly changing aria-live HUD
  -> no immutable AccessibleReadModel
  -> no focus transaction
  -> no announcement result
  -> no accessible-frame acknowledgement
```

## Required parent domain

`the-long-haul-accessible-hud-route-announcement-authority-domain`

### Inputs

```txt
DocumentGeneration
RouteRevision
RunGeneration
SimulationRevision
VehicleStateRevision
DeliveryStateRevision
ConditionStateRevision
MapRevision
InputActionRevision
FocusRevision
VisibleFrameRevision
AccessibilityPolicyRevision
```

### Outputs

```txt
AccessibleReadModel
AccessibilityProjectionResult
RouteFocusResult
AnnouncementResult
CanvasAlternativeResult
MapSemanticSummaryResult
FirstAccessibleRouteFrameAck
FirstVisualAccessibleConvergenceAck
```

## Planned DSK surfaces

1. `accessible-state-revision-kit`
2. `accessible-read-model-kit`
3. `route-semantic-projection-kit`
4. `route-focus-owner-kit`
5. `focus-restoration-kit`
6. `inactive-screen-inertness-kit`
7. `hud-telemetry-semantic-kit`
8. `hud-announcement-throttle-kit`
9. `announcement-priority-policy-kit`
10. `penalty-status-announcement-kit`
11. `interaction-affordance-announcement-kit`
12. `generation-progress-semantic-kit`
13. `outcome-alert-projection-kit`
14. `toast-live-region-adapter-kit`
15. `game-canvas-alternative-kit`
16. `map-semantic-summary-kit`
17. `accessibility-projection-result-kit`
18. `stale-accessibility-projection-rejection-kit`
19. `first-accessible-route-frame-ack-kit`
20. `first-visual-accessible-convergence-ack-kit`

## Ownership rules

```txt
Core Scene owns route acceptance.
Gameplay domains own run and outcome truth.
The accessibility domain derives semantics only from accepted revisions.
DOM owns no hidden gameplay state.
Continuous telemetry is queryable and rate-limited, not blindly announced.
Discrete events carry stable identity, priority and deduplication keys.
Focus changes occur only after accepted route projection.
Canvas alternatives cite the same run/map revision as the visible frame.
Stale or retired projections cannot mutate the active semantic surface.
```

## Required command/result boundary

```txt
AccessibilityProjectionCommand
  -> validate expected revisions
  -> derive AccessibleReadModel
  -> calculate route, focus, telemetry, announcement and alternative deltas
  -> reject stale or duplicate work
  -> commit one semantic projection
  -> publish AccessibilityProjectionResult
  -> wait for matching DOM/Canvas/WebGL presentation
  -> publish frame acknowledgements
```

## Validation boundary

Architecture only. No DSK, runtime adapter, DOM attribute, focus behavior or announcement behavior was implemented or executed.