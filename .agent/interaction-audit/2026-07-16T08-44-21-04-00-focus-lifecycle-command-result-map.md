# Interaction audit: focus lifecycle command/result map

**Timestamp:** `2026-07-16T08-44-21-04-00`

## Plan ledger

**Goal:** convert browser lifecycle evidence into one typed input-retirement transaction instead of scattered mutable clears.

- [x] Map current DOM evidence and consumers.
- [x] Define command and result identities.
- [x] Define stale and duplicate classifications.
- [ ] Implement the interaction contract.

## Current evidence map

| Evidence | Current effect | Result |
|---|---|---|
| `keydown` | Set held key and possibly add one-shot code | None |
| `keyup` | Set held key false | None |
| frame completion | Clear all one-shot codes | None |
| `blur` | No handler | None |
| hidden visibility | No handler | None |
| `pagehide` | No handler | None |
| freeze | No handler | None |
| route exit | No keyboard retirement | None |
| run clear/retry | No keyboard retirement | None |

## Required commands

### `InputKeyEvidenceCommand`

```txt
documentGeneration
routeGeneration
inputAdapterGeneration
runGeneration
eventId
code
phase: down | up
repeat
issuedAt
```

### `InputFocusLifecycleCommand`

```txt
documentGeneration
routeGeneration
inputAdapterGeneration
runGeneration
reason: blur | hidden | pagehide | freeze |
        route-retired | run-retired | adapter-replaced
observedAt
expectedCoreInputRevision
expectedTruckInputRevision
```

### `InputFocusRestoreCommand`

```txt
priorGeneration
newDocumentGeneration
newRouteGeneration
newInputAdapterGeneration
newRunGeneration
observedAt
```

## Required results

### `InputKeyEvidenceResult`

```txt
accepted | repeated | stale | unsupported | retired
code
actionIds
inputAdapterGeneration
```

### `HeldInputRetirementResult`

```txt
accepted | duplicate | stale | already-retired | failed
reason
retiredGeneration
heldActionIds
cancelledOneShotActionIds
coreInputRevision
truckInputRevision
pauseResultId?
```

### `InputFocusRestoreResult`

```txt
accepted | blocked | stale | failed
newGeneration
neutralSettlementResultId
freshEvidenceRequired: true
```

### `FirstNeutralInputFrameAck`

```txt
retirementResultId
simulationRevision
truckRevision
cameraRevision
hudRevision
mapRevision
audioRevision
frameRevision
```

## Classification rules

- Duplicate lifecycle evidence returns the existing retirement result.
- Evidence from a retired generation is `stale` and cannot repopulate state.
- A repeated keydown may update no state and must not create a second one-shot action.
- Restore cannot accept fresh keys until neutral settlement succeeds.
- A route transition and document blur racing together must settle one retirement result.
- A late keyup after retirement is harmless and classified, not applied to the new generation.
- A new keydown after restoration belongs to the fresh generation and operates normally.

## Existing consumer mapping

| Semantic action | Core Input | Product consumer |
|---|---|---|
| throttle | intent snapshot | Truck input and fuel spend |
| brake | intent snapshot | Truck input |
| steer left/right | combined steer intent | Truck input and camera target |
| boost | intent snapshot | Truck input and fuel spend |
| interact | declared action | Host depot/recovery command |
| camera | declared action | Host camera mode |
| map | declared action | Host map state |
| pause | declared action | Core Scene/Run host request |
| retry | declared action | Host generation request |

The lifecycle result must neutralize both declared semantic intent and host one-shot evidence.

## Validation boundary

No command or result type exists in runtime. This is a documentation contract only.