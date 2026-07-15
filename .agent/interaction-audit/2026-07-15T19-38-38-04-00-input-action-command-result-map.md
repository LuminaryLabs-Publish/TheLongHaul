# Interaction audit: input action command/result map

**Timestamp:** `2026-07-15T19-38-38-04-00`

## Plan ledger

**Goal:** replace raw-key side effects with typed semantic action commands and results.

- [x] Inventory held and one-shot actions.
- [x] Map current producers and consumers.
- [x] Define required commands, rejections and acknowledgements.
- [ ] Implement command settlement.

## Current map

```txt
W/S/A/D/arrows/Shift
  -> mutable keys
  -> per-frame derived intent
  -> Core Input mirror + Vehicle Dynamics input

Escape
  -> direct pause/resume/settings/back transition

C
  -> direct cameraMode mutation

M
  -> direct mapOpen mutation

E
  -> direct interactWanted flag
  -> contextual recovery or depot check

R
  -> direct retry generation replacement
```

## Required command/result map

```txt
HeldDrivingActionCommand
  -> accepted | out-of-context | stale | retired
  -> HeldDrivingActionResult

PauseActionCommand
  -> accepted | unsupported-route | duplicate | stale
  -> PauseActionResult

CameraActionCommand
  -> accepted | unsupported-route | stale
  -> CameraActionResult

MapActionCommand
  -> opened | closed | unsupported-route | stale
  -> MapActionResult

InteractActionCommand
  -> depot-check | recovery | unavailable | out-of-range | stale
  -> InteractActionResult

RetryActionCommand
  -> accepted | unsupported-route | duplicate | retired
  -> RetryActionResult
```

## Identity requirements

Every command must bind:

```txt
DocumentId
InputGeneration
DeviceId
EventId
ActionId
ActionMapRevision
ContextRevision
RouteRevision
ExpectedRunGeneration
```

Every result must be idempotent and cite the accepted revisions. Consumers must reject results from superseded route, run, generation or document owners.

## Visible acknowledgement

```txt
InputActionResult
  -> state mutation
  -> matching DOM, Canvas2D, WebGL or audio projection
  -> FirstInputEffectFrameAck
```

## Validation boundary

No command API or runtime behavior was implemented.